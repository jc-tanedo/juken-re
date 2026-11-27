import _ from 'lodash';
import { GET } from 'src/common/constants';
import { collectionWithMeta, request } from 'src/features/wk/request';
import device from 'src/utils/device';
import toChunks from 'src/utils/toChunks';

const NAMESPACES = ['subjects', 'srs_systems', 'study_materials', 'review_statistics'];
const SUBJECT_CHUNK_SIZE = 500;

function resolveDefaultStorage() {
  const native = device('mobile');
  const backend = native
    ? require('@react-native-async-storage/async-storage').default
    : require('localforage');
  return {
    async getItem(key) {
      const value = await backend.getItem(key);
      if (value == null) return null;
      return native && typeof value === 'string' ? JSON.parse(value) : value;
    },
    async setItem(key, value) {
      return backend.setItem(key, native ? JSON.stringify(value) : value);
    },
    async removeItem(key) {
      return backend.removeItem(key);
    },
  };
}

/**
 * Produces a stable non-raw hash so API tokens are not written verbatim into cache keys.
 */
export function hashToken(token) {
  const input = String(token || 'anonymous');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash * 33) ^ input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function newerIso(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  const parsedA = Date.parse(a);
  const parsedB = Date.parse(b);
  if (Number.isNaN(parsedA)) return b;
  if (Number.isNaN(parsedB)) return a;
  return parsedB > parsedA ? b : a;
}

function mergeById(existingById, existingHidden, items, { pruneHidden = false } = {}) {
  const byId = { ...(existingById || {}) };
  const hiddenById = { ...(existingHidden || {}) };
  for (const item of items || []) {
    if (!item || item.id == null) continue;
    if (pruneHidden && item.data?.hidden_at != null) {
      delete byId[item.id];
      hiddenById[item.id] = true;
    } else {
      byId[item.id] = item;
      delete hiddenById[item.id];
    }
  }
  return { byId, hiddenById };
}

function mergeBySubjectId(existing, items) {
  const next = { ...(existing || {}) };
  for (const item of items || []) {
    const subjectId = item?.data?.subject_id;
    if (subjectId == null) continue;
    if (item.data?.hidden_at != null) {
      delete next[subjectId];
    } else {
      next[subjectId] = item;
    }
  }
  return next;
}

function maxDataUpdatedAt(items, fallback = null) {
  let latest = fallback || null;
  for (const item of items || []) {
    latest = newerIso(latest, item?.data_updated_at);
  }
  return latest;
}

export function createCache(customStorage) {
  const memory = new Map();
  let resolvedStorage = customStorage || null;

  function getStorage() {
    if (!resolvedStorage) resolvedStorage = resolveDefaultStorage();
    return resolvedStorage;
  }

  const keyFor = (token, namespace) => `[JukenCache]:${hashToken(token)}:${namespace}`;

  async function readEntry(token, namespace) {
    const key = keyFor(token, namespace);
    if (memory.has(key)) return memory.get(key);
    try {
      const stored = await getStorage().getItem(key);
      const entry = stored && typeof stored === 'object'
        ? { updatedAt: stored.updatedAt || null, byId: stored.byId || {}, hiddenById: stored.hiddenById || {} }
        : { updatedAt: null, byId: {}, hiddenById: {} };
      memory.set(key, entry);
      return entry;
    } catch {
      return { updatedAt: null, byId: {}, hiddenById: {} };
    }
  }

  async function writeEntry(token, namespace, entry) {
    const key = keyFor(token, namespace);
    memory.set(key, entry);
    try {
      await getStorage().setItem(key, entry);
    } catch {
      // Cache persistence errors must not abort active review sessions.
    }
    return entry;
  }

  async function fetchMissingSubjects(token, ids, existingById, hiddenById = {}) {
    const uniqueMissing = _.uniq((ids || []).filter(Boolean)).filter(
      id => !existingById[id] && !hiddenById[id],
    );
    if (uniqueMissing.length === 0) return [];
    const responses = await Promise.all(
      toChunks(uniqueMissing, SUBJECT_CHUNK_SIZE).map(chunk => request({
        endpoint: 'subjects',
        method: GET,
        apiKey: token,
        params: { ids: chunk.join(',') },
      })),
    );
    return responses.flatMap(res => (Array.isArray(res?.data) ? res.data : []));
  }

  return {
    async syncSrsSystems(token) {
      if (!token) return {};
      const entry = await readEntry(token, 'srs_systems');
      const res = await collectionWithMeta({
        endpoint: 'spaced_repetition_systems',
        method: GET,
        apiKey: token,
        params: entry.updatedAt ? { updated_after: entry.updatedAt } : undefined,
      });
      if (!res.data.length && Object.keys(entry.byId || {}).length > 0) {
        return entry.byId;
      }
      const { byId } = mergeById(entry.byId, null, res.data);
      const updatedAt = newerIso(entry.updatedAt, res.dataUpdatedAt || maxDataUpdatedAt(res.data));
      await writeEntry(token, 'srs_systems', { updatedAt, byId });
      return byId;
    },

    async syncSubjects(token, requiredIds = []) {
      if (!token) return {};
      const entry = await readEntry(token, 'subjects');
      let byId = { ...(entry.byId || {}) };
      let hiddenById = { ...(entry.hiddenById || {}) };
      let updatedAt = entry.updatedAt || null;

      if (updatedAt) {
        const delta = await collectionWithMeta({
          endpoint: 'subjects',
          method: GET,
          apiKey: token,
          params: { updated_after: updatedAt },
        });
        if (delta.data.length > 0) {
          ({ byId, hiddenById } = mergeById(byId, hiddenById, delta.data, { pruneHidden: true }));
          updatedAt = newerIso(updatedAt, delta.dataUpdatedAt || maxDataUpdatedAt(delta.data));
        }
      }

      const missingItems = await fetchMissingSubjects(token, requiredIds, byId, hiddenById);
      if (missingItems.length > 0) {
        ({ byId, hiddenById } = mergeById(byId, hiddenById, missingItems, { pruneHidden: true }));
        updatedAt = newerIso(updatedAt, maxDataUpdatedAt(missingItems));
      }

      await writeEntry(token, 'subjects', { updatedAt, byId, hiddenById });
      return byId;
    },

    async getSubjectsByIds(token, ids = []) {
      if (!token) return {};
      const wanted = _.uniq((ids || []).filter(Boolean));
      const entry = await readEntry(token, 'subjects');
      let byId = { ...(entry.byId || {}) };
      let hiddenById = { ...(entry.hiddenById || {}) };
      const missingItems = await fetchMissingSubjects(token, wanted, byId, hiddenById);
      if (missingItems.length > 0) {
        ({ byId, hiddenById } = mergeById(byId, hiddenById, missingItems, { pruneHidden: true }));
        const updatedAt = newerIso(entry.updatedAt, maxDataUpdatedAt(missingItems));
        await writeEntry(token, 'subjects', { updatedAt, byId, hiddenById });
      }
      const selected = {};
      for (const id of wanted) {
        if (byId[id]) selected[id] = byId[id];
      }
      return selected;
    },

    async syncStudyMaterials(token) {
      if (!token) return {};
      const entry = await readEntry(token, 'study_materials');
      const res = await collectionWithMeta({
        endpoint: 'study_materials',
        method: GET,
        apiKey: token,
        params: entry.updatedAt ? { updated_after: entry.updatedAt } : undefined,
      });
      if (!res.data.length && Object.keys(entry.byId || {}).length > 0) {
        return entry.byId;
      }
      const byId = mergeBySubjectId(entry.byId, res.data);
      const updatedAt = newerIso(entry.updatedAt, res.dataUpdatedAt || maxDataUpdatedAt(res.data));
      await writeEntry(token, 'study_materials', { updatedAt, byId });
      return byId;
    },

    async upsertStudyMaterial(token, material) {
      if (!token || !material?.data?.subject_id) return {};
      const entry = await readEntry(token, 'study_materials');
      const byId = mergeBySubjectId(entry.byId, [material]);
      const updatedAt = newerIso(entry.updatedAt, material.data_updated_at);
      await writeEntry(token, 'study_materials', { updatedAt, byId });
      return byId;
    },

    async syncReviewStatistics(token) {
      if (!token) return {};
      const entry = await readEntry(token, 'review_statistics');
      const res = await collectionWithMeta({
        endpoint: 'review_statistics',
        method: GET,
        apiKey: token,
        params: entry.updatedAt ? { updated_after: entry.updatedAt } : undefined,
      });
      if (!res.data.length && Object.keys(entry.byId || {}).length > 0) {
        return entry.byId;
      }
      const byId = mergeBySubjectId(entry.byId, res.data);
      const updatedAt = newerIso(entry.updatedAt, res.dataUpdatedAt || maxDataUpdatedAt(res.data));
      await writeEntry(token, 'review_statistics', { updatedAt, byId });
      return byId;
    },

    async clearUserCache(token) {
      if (!token) return;
      for (const ns of NAMESPACES) {
        const key = keyFor(token, ns);
        memory.delete(key);
        try {
          await getStorage().removeItem(key);
        } catch {
          // Ignore storage cleanup errors on logout.
        }
      }
    },
  };
}

export default createCache();
