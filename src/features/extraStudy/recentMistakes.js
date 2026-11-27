import { createJsonStorage, hashToken } from 'src/utils/storage';

export const MISTAKES_WINDOW_MS = 24 * 60 * 60 * 1000;

export function pruneMistakes(entries = [], now = Date.now(), windowMs = MISTAKES_WINDOW_MS) {
  const latestBySubject = new Map();
  for (const entry of entries || []) {
    if (!entry?.subjectId || typeof entry.timestamp !== 'number') continue;
    if (now - entry.timestamp > windowMs) continue;
    const prev = latestBySubject.get(entry.subjectId);
    if (!prev || entry.timestamp > prev.timestamp) {
      latestBySubject.set(entry.subjectId, {
        subjectId: entry.subjectId,
        timestamp: entry.timestamp,
      });
    }
  }
  return Array.from(latestBySubject.values()).sort((a, b) => b.timestamp - a.timestamp);
}

export function createRecentMistakesStore(customStorage) {
  const storage = customStorage || createJsonStorage();
  const memory = new Map();

  const keyFor = token => `[JukenMistakes]:${hashToken(token || 'DEMO')}`;

  async function read(token, now = Date.now()) {
    const key = keyFor(token);
    if (memory.has(key)) return pruneMistakes(memory.get(key), now);
    try {
      const stored = await storage.getItem(key);
      const pruned = pruneMistakes(Array.isArray(stored) ? stored : [], now);
      memory.set(key, pruned);
      return pruned;
    } catch {
      return [];
    }
  }

  async function recordMistake(token, subjectId, now = Date.now()) {
    if (!subjectId) return [];
    const key = keyFor(token);
    const existing = await read(token, now);
    const next = pruneMistakes([...existing, { subjectId, timestamp: now }], now);
    memory.set(key, next);
    try {
      await storage.setItem(key, next);
    } catch {
      // Non-fatal persistence error.
    }
    return next;
  }

  return {
    getRecentMistakes: read,
    recordMistake,
  };
}

const defaultStore = createRecentMistakesStore();

export const getRecentMistakes = (...args) => defaultStore.getRecentMistakes(...args);
export const recordMistake = (...args) => defaultStore.recordMistake(...args);
