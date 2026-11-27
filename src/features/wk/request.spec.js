import { GET } from 'src/common/constants';
import {
  WK_API_REVISION,
  collectionWithMeta,
  request,
  setTokenProvider,
} from 'src/features/wk/request';

describe('WaniKani API v2 client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setTokenProvider(() => 'provider-token');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setTokenProvider(() => null);
  });

  test('sends Wanikani-Revision header and resolves token from provider', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => JSON.stringify({ data: { username: 'jc' } }),
    });

    const data = await request({ endpoint: 'user', method: GET });
    expect(data).toEqual({ data: { username: 'jc' } });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.wanikani.com/v2/user',
      expect.objectContaining({
        method: GET,
        headers: expect.objectContaining({
          Authorization: 'Bearer provider-token',
          'Wanikani-Revision': WK_API_REVISION,
        }),
      }),
    );
  });

  test('supports conditional 304 responses without failing JSON parsing', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 304,
      headers: { get: name => (name === 'ETag' ? '"abc"' : null) },
      text: async () => '',
    });

    const res = await request({
      endpoint: 'user',
      method: GET,
      ifNoneMatch: '"abc"',
      includeMeta: true,
    });
    expect(res).toEqual({
      data: null,
      status: 304,
      etag: '"abc"',
      lastModified: null,
      notModified: true,
    });
  });

  test('retries HTTP 429 using RateLimit-Reset backoff and throws typed error on persistent failure', async () => {
    const sleep = jest.fn(async () => {});
    const now = () => 1_700_000_000_000;

    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: name => (name === 'RateLimit-Reset' ? '1700000002' : null) },
        text: async () => JSON.stringify({ code: 429, error: 'Too Many Requests' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => JSON.stringify({ ok: true }),
      });

    const ok = await request({
      endpoint: 'subjects',
      method: GET,
      _sleep: sleep,
      _now: now,
    });
    expect(ok).toEqual({ ok: true });
    expect(sleep).toHaveBeenCalledWith(2000);

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: { get: () => null },
      text: async () => JSON.stringify({ code: 403, error: 'Unauthorized scope' }),
    });

    await expect(request({ endpoint: 'study_materials', method: GET, maxRetries: 0 }))
      .rejects.toMatchObject({ status: 403, code: 403, message: 'Unauthorized scope' });
  });

  test('collectionWithMeta aggregates paginated items and latest data_updated_at', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => JSON.stringify({
          data_updated_at: '2026-01-01T00:00:00.000000Z',
          pages: { next_url: 'https://api.wanikani.com/v2/subjects?page_after_id=2' },
          data: [{ id: 1, data_updated_at: '2026-01-01T00:00:00.000000Z' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => JSON.stringify({
          data_updated_at: '2026-01-05T12:00:00.000000Z',
          pages: { next_url: null },
          data: [{ id: 2, data_updated_at: '2026-01-06T08:00:00.000000Z' }],
        }),
      });

    const result = await collectionWithMeta({ endpoint: 'subjects', method: GET });
    expect(result.data).toHaveLength(2);
    expect(result.dataUpdatedAt).toBe('2026-01-06T08:00:00.000000Z');
  });
});
