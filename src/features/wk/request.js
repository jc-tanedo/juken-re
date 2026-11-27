import _ from 'lodash';
import requestBase from 'src/features/request/request';

const BASE = 'https://api.wanikani.com/v2/';
export const WK_API_REVISION = '20170710';

let tokenProvider = () => null;

/**
 * Registers the active session token getter without introducing a module cycle
 * between the API client and the Redux/Easy-Peasy store.
 */
export const setTokenProvider = provider => {
  tokenProvider = typeof provider === 'function' ? provider : () => null;
};

function newerIsoTimestamp(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  const parsedA = Date.parse(a);
  const parsedB = Date.parse(b);
  if (Number.isNaN(parsedA)) return b;
  if (Number.isNaN(parsedB)) return a;
  return parsedB > parsedA ? b : a;
}

export const request = async (opts = {}) => {
  const {
    apiKey,
    endpoint,
    params,
    body,
    method,
    nextUrl,
    ifModifiedSince,
    ifNoneMatch,
    includeMeta = false,
    maxRetries,
    maxRetryWaitMs,
    _sleep,
    _now,
  } = opts;

  const useApiKey = apiKey || tokenProvider();
  const finalUrl = nextUrl || `${BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${useApiKey}`,
    'Wanikani-Revision': WK_API_REVISION,
  };
  if (ifModifiedSince) headers['If-Modified-Since'] = ifModifiedSince;
  if (ifNoneMatch) headers['If-None-Match'] = ifNoneMatch;

  return await requestBase(method, finalUrl, {
    body,
    params: !nextUrl ? params : null,
    headers,
    includeMeta,
    maxRetries,
    maxRetryWaitMs,
    _sleep,
    _now,
    hasError: res => (res && res.error ? res : null),
  });
};

export const collectionWithMeta = async (opts = {}) => {
  const first = await request({ ...opts, includeMeta: true });
  if (!first || first.notModified) {
    return {
      data: [],
      dataUpdatedAt: null,
      etag: first?.etag || null,
      lastModified: first?.lastModified || null,
      notModified: Boolean(first?.notModified),
    };
  }

  let items = Array.isArray(first.data?.data) ? first.data.data.slice() : [];
  let dataUpdatedAt = first.data?.data_updated_at || null;
  let next = first.data?.pages?.next_url || null;

  while (next) {
    const page = await request({ ...opts, nextUrl: next, includeMeta: false });
    const pageItems = _.get(page, 'data') || [];
    items = items.concat(pageItems);
    dataUpdatedAt = newerIsoTimestamp(dataUpdatedAt, page?.data_updated_at);
    next = _.get(page, 'pages.next_url') || null;
  }

  for (const item of items) {
    dataUpdatedAt = newerIsoTimestamp(dataUpdatedAt, item?.data_updated_at);
  }

  return {
    data: items,
    dataUpdatedAt,
    etag: first.etag || null,
    lastModified: first.lastModified || null,
    notModified: false,
  };
};

// Get an entire WaniKani collection across paginated responses.
export const collection = async (opts = {}, col = []) => {
  const response = await request(opts);
  const data = col.concat(_.get(response, 'data') || []);
  const next = _.get(response, 'pages.next_url');

  return next
    ? await collection({ ...opts, nextUrl: next }, data)
    : data;
};
