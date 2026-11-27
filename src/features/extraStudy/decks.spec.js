import {
  MISTAKES_WINDOW_MS,
  createRecentMistakesStore,
  pruneMistakes,
} from 'src/features/extraStudy/recentMistakes';
import {
  buildBurnedItemsDeck,
  buildCriticalItemsDeck,
  buildRecentLessonsDeck,
  buildRecentMistakesDeck,
  createPracticeAssignments,
} from 'src/features/extraStudy/decks';
import { KANJI, KANA_VOCAB, RADICAL, VOCAB } from 'src/common/constants';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: async k => (map.has(k) ? map.get(k) : null),
    setItem: async (k, v) => { map.set(k, v); },
  };
}

describe('Extra Study deck builders and 24h recent mistakes', () => {
  const now = Date.parse('2026-06-10T12:00:00.000Z');
  const subjectsById = {
    1: { id: 1, object: RADICAL, data: { characters: null } },
    2: { id: 2, object: KANJI, data: { characters: '人' } },
    3: { id: 3, object: VOCAB, data: { characters: '二人' } },
    4: { id: 4, object: KANA_VOCAB, data: { characters: 'おやつ' } },
  };

  test('prunes mistakes older than 24 hours and deduplicates by latest timestamp', async () => {
    const stale = now - MISTAKES_WINDOW_MS - 1000;
    const pruned = pruneMistakes([
      { subjectId: 1, timestamp: stale },
      { subjectId: 2, timestamp: now - 5000 },
      { subjectId: 2, timestamp: now - 1000 },
    ], now);
    expect(pruned).toEqual([{ subjectId: 2, timestamp: now - 1000 }]);

    const store = createRecentMistakesStore(memoryStorage());
    await store.recordMistake('tok', 3, now - 2000);
    await store.recordMistake('tok', 1, stale);
    expect(await store.getRecentMistakes('tok', now)).toEqual([
      { subjectId: 3, timestamp: now - 2000 },
    ]);
  });

  test('builds all 4 practice decks and marks practice assignments clearly', () => {
    const recentMistakes = buildRecentMistakesDeck({
      mistakeEntries: [{ subjectId: 4, timestamp: now - 1000 }],
      reviewStatsBySubject: {
        2: { data_updated_at: '2026-06-10T11:00:00Z', data: { subject_id: 2, percentage_correct: 70 } },
        1: { data_updated_at: '2026-06-01T11:00:00Z', data: { subject_id: 1, percentage_correct: 50 } },
      },
      subjectsById,
      now,
    });
    expect(recentMistakes.map(s => s.id)).toEqual([4, 2]);

    const lessons = buildRecentLessonsDeck({
      assignments: [
        { data: { subject_id: 1, started_at: '2026-06-09T00:00:00Z', burned_at: null } },
        { data: { subject_id: 3, started_at: '2026-06-10T06:00:00Z', burned_at: null } },
        { data: { subject_id: 2, started_at: '2026-06-10T10:00:00Z', burned_at: '2026-06-10T11:00:00Z' } },
      ],
      subjectsById,
    });
    expect(lessons.map(s => s.id)).toEqual([3, 1]);

    const critical = buildCriticalItemsDeck({
      reviewStatsBySubject: {
        2: { data: { subject_id: 2, percentage_correct: 74 } },
        3: { data: { subject_id: 3, percentage_correct: 52 } },
        4: { data: { subject_id: 4, percentage_correct: 88 } },
      },
      subjectsById,
    });
    expect(critical.map(s => s.id)).toEqual([3, 2]);

    const burned = buildBurnedItemsDeck({
      assignments: [{ data: { subject_id: 2, burned_at: '2026-06-05T00:00:00Z' } }],
      subjectsById,
    });
    expect(burned.map(s => s.id)).toEqual([2]);

    const practice = createPracticeAssignments([subjectsById[4]]);
    expect(practice[0]).toMatchObject({
      practice: true,
      data: { subject_id: 4, subject_type: KANA_VOCAB },
    });
  });
});
