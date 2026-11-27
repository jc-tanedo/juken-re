import * as env from 'src/common/env';
import queryString from 'src/utils/queryString';
import { GET } from 'src/common/constants';
import run from 'src/utils/run';
import defaultSleep from 'src/utils/test/sleep';

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_MAX_RETRY_WAIT_MS = 10000;

function readHeader(response, name) {
  const headers = response?.headers;
  if (!headers) return null;
  if (typeof headers.get === 'function') {
    return headers.get(name) ?? headers.get(name.toLowerCase()) ?? null;
  }
  const lower = name.toLowerCase();
  const key = Object.keys(headers).find(k => k.toLowerCase() === lower);
  return key ? headers[key] : null;
}

function getRateLimitDelayMs(response, attempt, maxRetryWaitMs, now) {
  const resetHeader = readHeader(response, 'RateLimit-Reset');
  if (resetHeader != null) {
    const resetSeconds = Number(resetHeader);
    if (Number.isFinite(resetSeconds) && resetSeconds > 0) {
      return Math.min(maxRetryWaitMs, Math.max(0, resetSeconds * 1000 - now()));
    }
  }
  const retryAfter = readHeader(response, 'Retry-After');
  if (retryAfter != null) {
    const retrySeconds = Number(retryAfter);
    if (Number.isFinite(retrySeconds) && retrySeconds >= 0) {
      return Math.min(maxRetryWaitMs, retrySeconds * 1000);
    }
  }
  return Math.min(maxRetryWaitMs, 1000 * (attempt + 1));
}

async function parseResponseBody(response) {
  if (typeof response.text === 'function') {
    const raw = await response.text();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (typeof response.json === 'function') {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
}

export default async (method, url, opts = {}) => {
  const {
    body = {},
    params = {},
    headers,
    hasError,
    includeMeta = false,
    maxRetries = DEFAULT_MAX_RETRIES,
    maxRetryWaitMs = DEFAULT_MAX_RETRY_WAIT_MS,
    _sleep = defaultSleep,
    _now = Date.now,
  } = opts;

  const finalUrl = `${url}${queryString(params)}`;

  try {
    const reqHeaders = { ...(headers || {}) };
    const fetchOpts = { method, headers: reqHeaders };
    if (body && method !== GET) {
      reqHeaders.Accept = 'application/json';
      reqHeaders['Content-Type'] = 'application/json';
      fetchOpts.body = JSON.stringify(body);
    }

    if (env.DEBUG) console.log(`🌎 [${method}]: `, finalUrl, fetchOpts);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(finalUrl, fetchOpts);
      const etag = readHeader(response, 'ETag');
      const lastModified = readHeader(response, 'Last-Modified');

      if (response.status === 304) {
        const result = { data: null, status: 304, etag, lastModified, notModified: true };
        return includeMeta ? result : null;
      }

      if (response.status === 429 && attempt < maxRetries) {
        const waitMs = getRateLimitDelayMs(response, attempt, maxRetryWaitMs, _now);
        await _sleep(waitMs);
        continue;
      }

      const data = await parseResponseBody(response);
      const ok = response.ok !== undefined
        ? response.ok
        : (!response.status || (response.status >= 200 && response.status < 300));

      if (!ok) {
        const message = (data && typeof data === 'object' && (data.error || data.message)) ||
          `HTTP ${response.status || 'Error'}`;
        const err = new Error(message);
        err.status = response.status;
        err.code = (data && typeof data === 'object' && data.code) || response.status;
        err.body = data;
        throw err;
      }

      // Evaluate API-level errors returned inside a 200 OK payload.
      const customError = run(hasError, data);
      if (customError) throw customError;

      if (env.DEBUG) console.log(`🌕 [${method}]: `, finalUrl, data);

      if (includeMeta) {
        return {
          data,
          status: response.status ?? 200,
          etag,
          lastModified,
          notModified: false,
        };
      }
      return data;
    }
  } catch (err) {
    if (env.DEBUG) console.log(`🌑 [${method}]: `, finalUrl, err);
    throw err;
  }

  return null;
};
