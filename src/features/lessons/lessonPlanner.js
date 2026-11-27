import { KANA_VOCAB, KANJI, RADICAL, TERMINOLOGY, VOCAB } from 'src/common/constants';

export const TYPE_PRIORITY = {
  [RADICAL]: 0,
  [KANJI]: 1,
  [VOCAB]: 2,
  [KANA_VOCAB]: 3,
};

const TYPE_SEQUENCE = [RADICAL, KANJI, VOCAB, KANA_VOCAB];

function subjectFor(assignment, subjectsById) {
  return subjectsById?.[assignment?.data?.subject_id] || null;
}

function levelOf(assignment, subjectsById) {
  return subjectFor(assignment, subjectsById)?.data?.level ?? 999;
}

function typeOf(assignment, subjectsById) {
  return assignment?.data?.subject_type || subjectFor(assignment, subjectsById)?.object || VOCAB;
}

function positionOf(assignment, subjectsById) {
  return subjectFor(assignment, subjectsById)?.data?.lesson_position ?? 9999;
}

export function sortLessonsDefault(assignments = [], subjectsById = {}) {
  return (assignments || [])
    .filter(a => subjectFor(a, subjectsById))
    .slice()
    .sort((a, b) => {
      const levelDiff = levelOf(a, subjectsById) - levelOf(b, subjectsById);
      if (levelDiff !== 0) return levelDiff;
      const typeDiff = (TYPE_PRIORITY[typeOf(a, subjectsById)] ?? 99) -
        (TYPE_PRIORITY[typeOf(b, subjectsById)] ?? 99);
      if (typeDiff !== 0) return typeDiff;
      const posDiff = positionOf(a, subjectsById) - positionOf(b, subjectsById);
      if (posDiff !== 0) return posDiff;
      return (a.id || 0) - (b.id || 0);
    });
}

/**
 * Interleaves lessons round-robin across available subject types while preserving
 * ascending level & lesson_position order within each type.
 */
export function interleaveLessons(assignments = [], subjectsById = {}) {
  const sorted = sortLessonsDefault(assignments, subjectsById);
  const buckets = new Map(TYPE_SEQUENCE.map(type => [type, []]));

  for (const item of sorted) {
    const type = typeOf(item, subjectsById);
    if (!buckets.has(type)) buckets.set(type, []);
    buckets.get(type).push(item);
  }

  const out = [];
  let added = true;
  while (added) {
    added = false;
    for (const queue of buckets.values()) {
      if (queue.length > 0) {
        out.push(queue.shift());
        added = true;
      }
    }
  }
  return out;
}

export function buildTodayBatch(
  assignments = [],
  subjectsById = {},
  { batchSize = 5, interleave = false } = {},
) {
  const ordered = interleave
    ? interleaveLessons(assignments, subjectsById)
    : sortLessonsDefault(assignments, subjectsById);
  return ordered.slice(0, Math.max(1, batchSize));
}

export function groupLessonsByLevelAndType(assignments = [], subjectsById = {}) {
  const sorted = sortLessonsDefault(assignments, subjectsById);
  const levelMap = new Map();

  for (const item of sorted) {
    const level = levelOf(item, subjectsById);
    const type = typeOf(item, subjectsById);
    if (!levelMap.has(level)) levelMap.set(level, new Map());
    const typeMap = levelMap.get(level);
    if (!typeMap.has(type)) typeMap.set(type, []);
    typeMap.get(type).push(item);
  }

  return Array.from(levelMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([level, typeMap]) => ({
      level,
      groups: Array.from(typeMap.entries())
        .sort((a, b) => (TYPE_PRIORITY[a[0]] ?? 99) - (TYPE_PRIORITY[b[0]] ?? 99))
        .map(([type, items]) => ({
          type,
          label: TERMINOLOGY[type] || type,
          assignments: items,
        })),
    }));
}
