import { createCache, hashToken } from 'src/features/wk/cache';
import { request, collectionWithMeta } from 'src/features/wk/request';

jest.mock('src/features/wk/request', () => ({
  request: jest.fn(),
  collectionWithMeta: jest.fn(),
}));

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: async key => (map.has(key) ? map.get(key) : null),
    setItem: async (key, value) => { map.set(key, value); },
    removeItem: async key => { map.delete(key); },
  };
}

describe('WaniKani incremental cache', () => {
  beforeEach(() => {
    request.mockReset();
    collectionWithMeta.mockReset();
  });

  test('hashes tokens instead of storing raw API tokens in keys', async () => {
    const token = 'secret-pat-123';
    const storage = memoryStorage();
    const cache = createCache(storage);
    request.mockResolvedValueOnce({
      data: [{ id: 444, data_updated_at: '2026-02-01T00:00:00Z', data: { hidden_at: null } }],
    });

    await cache.syncSubjects(token, [444]);
    const keys = Array.from(storage.map.keys());
    expect(keys[0]).toContain(hashToken(token));
    expect(keys[0]).not.toContain(token);
  });

  test('reuses cached subjects, syncs updated_after delta, and prunes hidden_at subjects', async () => {
    const storage = memoryStorage();
    const cache = createCache(storage);

    request.mockResolvedValueOnce({
      data: [
        { id: 1, data_updated_at: '2026-02-01T00:00:00Z', data: { characters: '一', hidden_at: null } },
        { id: 2, data_updated_at: '2026-02-01T00:00:00Z', data: { characters: '二', hidden_at: null } },
      ],
    });
    const first = await cache.syncSubjects('tok', [1, 2]);
    expect(Object.keys(first)).toEqual(['1', '2']);
    expect(collectionWithMeta).not.toHaveBeenCalled();

    // Next sync uses updated_after and fetches only missing ID 3, while hiding ID 2
    collectionWithMeta.mockResolvedValueOnce({
      data: [
        { id: 2, data_updated_at: '2026-02-02T00:00:00Z', data: { characters: '二', hidden_at: '2026-02-02T00:00:00Z' } },
      ],
      dataUpdatedAt: '2026-02-02T00:00:00Z',
    });
    request.mockResolvedValueOnce({
      data: [
        { id: 3, data_updated_at: '2026-02-02T01:00:00Z', data: { characters: '三', hidden_at: null } },
      ],
    });

    const second = await cache.syncSubjects('tok', [1, 2, 3]);
    expect(collectionWithMeta).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'subjects',
      params: { updated_after: '2026-02-01T00:00:00Z' },
    }));
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      endpoint: 'subjects',
      params: { ids: '3' },
    }));
    expect(second[1]).toBeDefined();
    expect(second[2]).toBeUndefined();
    expect(second[3]).toBeDefined();

    await cache.clearUserCache('tok');
    expect(storage.map.size).toBe(0);
  });
});
