import {
  buildTodayBatch,
  groupLessonsByLevelAndType,
  interleaveLessons,
  sortLessonsDefault,
} from 'src/features/lessons/lessonPlanner';
import { KANA_VOCAB, KANJI, RADICAL, VOCAB } from 'src/common/constants';

describe('lessonPlanner', () => {
  const subjectsById = {
    1: { id: 1, object: RADICAL, data: { level: 1, lesson_position: 5, meanings: [{ meaning: 'Ground', primary: true }] } },
    2: { id: 2, object: KANJI, data: { level: 1, lesson_position: 2, meanings: [{ meaning: 'One', primary: true }] } },
    3: { id: 3, object: VOCAB, data: { level: 1, lesson_position: 1, meanings: [{ meaning: 'One Thing', primary: true }] } },
    4: { id: 4, object: RADICAL, data: { level: 1, lesson_position: 8, meanings: [{ meaning: 'Fins', primary: true }] } },
    5: { id: 5, object: KANA_VOCAB, data: { level: 2, lesson_position: 1, meanings: [{ meaning: 'Snack', primary: true }] } },
  };
  const assignments = [5, 3, 2, 4, 1].map((subjectId, idx) => ({
    id: 100 + idx,
    data: { subject_id: subjectId, subject_type: subjectsById[subjectId].object },
  }));

  test('sorts lessons by level ascending then radical -> kanji -> vocab -> kana_vocab', () => {
    const sorted = sortLessonsDefault(assignments, subjectsById);
    expect(sorted.map(a => a.data.subject_id)).toEqual([1, 4, 2, 3, 5]);
  });

  test('interleaves subject types cleanly across a Today batch', () => {
    const interleaved = interleaveLessons(assignments, subjectsById);
    expect(interleaved.map(a => a.data.subject_id)).toEqual([1, 2, 3, 5, 4]);

    const batch = buildTodayBatch(assignments, subjectsById, { batchSize: 3, interleave: true });
    expect(batch.map(a => a.data.subject_id)).toEqual([1, 2, 3]);
  });

  test('groups lessons cleanly by level and subject type for Advanced Picker', () => {
    const grouped = groupLessonsByLevelAndType(assignments, subjectsById);
    expect(grouped.map(g => g.level)).toEqual([1, 2]);
    expect(grouped[0].groups.map(t => [t.type, t.assignments.length])).toEqual([
      [RADICAL, 2],
      [KANJI, 1],
      [VOCAB, 1],
    ]);
    expect(grouped[1].groups.map(t => t.type)).toEqual([KANA_VOCAB]);
  });
});
