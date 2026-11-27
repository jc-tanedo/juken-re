import adjustQueue from 'src/features/reviews/utils/adjustQueue';
import queueReviews from 'src/features/reviews/utils/queueReviews';
import {
  BACK_TO_BACK_MODE,
  CURRENT_LEVEL_FIRST,
  KANA_VOCAB,
  KANJI,
  LOWEST_LEVEL_FIRST,
  MEANING,
  RADICAL,
  READING,
  VOCAB,
} from 'src/common/constants';

describe('queueReviews and adjustQueue', () => {
  const assignments = [
    { id: 1, data: { subject_id: 101, subject_type: RADICAL, srs_stage: 1 } },
    { id: 2, data: { subject_id: 201, subject_type: KANA_VOCAB, srs_stage: 2 } },
    { id: 3, data: { subject_id: 301, subject_type: KANJI, srs_stage: 3 } },
    { id: 4, data: { subject_id: 401, subject_type: VOCAB, srs_stage: 6 } },
  ];
  const subjects = [
    { id: 101, object: RADICAL, data: { level: 1 } },
    { id: 201, object: KANA_VOCAB, data: { level: 4 } },
    { id: 301, object: KANJI, data: { level: 2 } },
    { id: 401, object: VOCAB, data: { level: 3 } },
  ];

  test('creates one meaning card for radical and kana_vocabulary and two cards for kanji and vocab', () => {
    const queued = queueReviews(assignments, subjects);
    expect(queued).toHaveLength(6);
    expect(queued.filter(q => q.review.id === 1).map(q => q.reviewType)).toEqual([MEANING]);
    expect(queued.filter(q => q.review.id === 2).map(q => q.reviewType)).toEqual([MEANING]);
    expect(queued.filter(q => q.review.id === 3).map(q => q.reviewType).sort()).toEqual([MEANING, READING]);
  });

  test('groups meaning-before-reading pairs in back-to-back mode without corrupting singletons', () => {
    const raw = [
      { id: 'a', review: assignments[1], reviewType: MEANING, subjectLevel: 4 },
      { id: 'b', review: assignments[2], reviewType: READING, subjectLevel: 2 },
      { id: 'c', review: assignments[0], reviewType: MEANING, subjectLevel: 1 },
      { id: 'd', review: assignments[2], reviewType: MEANING, subjectLevel: 2 },
    ];
    const arranged = adjustQueue(raw, Boolean(BACK_TO_BACK_MODE), true, LOWEST_LEVEL_FIRST);
    expect(arranged.map(i => i.review.id)).toEqual([1, 3, 3, 2]);
    const kanjiCards = arranged.filter(i => i.review.id === 3);
    expect(kanjiCards.map(c => c.reviewType)).toEqual([MEANING, READING]);

    const highestFirst = adjustQueue(raw, true, false, CURRENT_LEVEL_FIRST);
    expect(highestFirst[0].review.id).toBe(2);
    expect(highestFirst.slice(1, 3).map(i => i.reviewType)).toEqual([READING, MEANING]);
  });
});
