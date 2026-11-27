import _ from 'lodash';
import { GET } from 'src/common/constants';
import { collectionWithMeta, newerIsoTimestamp, request } from 'src/features/wk/request';
import { createJsonStorage, hashToken } from 'src/utils/storage';
import toChunks from 'src/utils/toChunks';

export { hashToken };

const NAMESPACES = ['subjects', 'srs_systems', 'study_materials', 'review_statistics'];
const SUBJECT_CHUNK_SIZE = 500;

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
    latest = newerIsoTimestamp(latest, item?.data_updated_at);
  }
  return latest;
}

export function createCache(customStorage) {
  const memory = new Map();
  const storage = customStorage || createJsonStorage();

  const keyFor = (token, namespace) => `[JukenCache]:${hashToken(token)}:${namespace}`;

  async function readEntry(token, namespace) {
    const key = keyFor(token, namespace);
    if (memory.has(key)) return memory.get(key);
    try {
      const stored = await storage.getItem(key);
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
      await storage.setItem(key, entry);
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
      const updatedAt = newerIsoTimestamp(entry.updatedAt, res.dataUpdatedAt || maxDataUpdatedAt(res.data));
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
          updatedAt = newerIsoTimestamp(updatedAt, delta.dataUpdatedAt || maxDataUpdatedAt(delta.data));
        }
      }

      const missingItems = await fetchMissingSubjects(token, requiredIds, byId, hiddenById);
      if (missingItems.length > 0) {
        ({ byId, hiddenById } = mergeById(byId, hiddenById, missingItems, { pruneHidden: true }));
        updatedAt = newerIsoTimestamp(updatedAt, maxDataUpdatedAt(missingItems));
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
        const updatedAt = newerIsoTimestamp(entry.updatedAt, maxDataUpdatedAt(missingItems));
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
      const updatedAt = newerIsoTimestamp(entry.updatedAt, res.dataUpdatedAt || maxDataUpdatedAt(res.data));
      await writeEntry(token, 'study_materials', { updatedAt, byId });
      return byId;
    },

    async upsertStudyMaterial(token, material) {
      if (!token || !material?.data?.subject_id) return {};
      const entry = await readEntry(token, 'study_materials');
      const byId = mergeBySubjectId(entry.byId, [material]);
      const updatedAt = newerIsoTimestamp(entry.updatedAt, material.data_updated_at);
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
      const updatedAt = newerIsoTimestamp(entry.updatedAt, res.dataUpdatedAt || maxDataUpdatedAt(res.data));
      await writeEntry(token, 'review_statistics', { updatedAt, byId });
      return byId;
    },

    async clearUserCache(token) {
      if (!token) return;
      for (const ns of NAMESPACES) {
        const key = keyFor(token, ns);
        memory.delete(key);
        try {
          await storage.removeItem(key);
        } catch {
          // Ignore storage cleanup errors on logout.
        }
      }
    },
  };
}

export default createCache();
