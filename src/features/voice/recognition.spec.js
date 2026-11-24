import { gradeSpeech } from './gradeSpeech';
import { reviewVocabulary } from './reviewVocabulary';

const subject = {
  data: {
    readings: [{ reading: 'がっこう', accepted_answer: true }],
    meanings: [{ meaning: 'school', accepted_answer: true }],
  },
};
const reading = { subject, reviewType: 'reading' };
const meaning = { subject, reviewType: 'meaning', synonyms: [] };
const heard = (text, confidence = 0.9) => ({ text, confidence });

test('compares kana and unambiguous full dictionary words by pronunciation', () => {
  for (const text of ['学校。', 'がっこう', 'ガッコー', 'ｶﾞｯｺｳ']) {
    expect(gradeSpeech(reading, heard(text)).kind).toBe('correct');
  }
  for (const text of ['がっこ', 'がこう', 'がっかー']) {
    expect(gradeSpeech(reading, heard(text)).kind).toBe('mismatch');
  }
  for (const text of ['生', '大人', '今日', '銀行']) {
    expect(gradeSpeech(reading, heard(text)).kind).toBe('unclear');
  }
});

test('an ambiguous spelling needs corroborating kana to receive credit', () => {
  const primary = heard('生');
  const card = { reviewType: 'reading', subject: { data: { readings: [{ reading: 'なま', accepted_answer: true }] } } };
  const grade = alternatives => gradeSpeech(card, { ...primary, alternatives });
  expect(grade([]).kind).toBe('unclear');
  expect(grade([heard('ナマ', 0.8)])).toEqual({ kind: 'correct', transcript: 'ナマ' });
  expect(grade([heard('なま'), heard('せい')]).kind).toBe('unclear');
  expect(grade([heard('なま', null)]).kind).toBe('unclear');
  expect(grade([heard('なま', 0.2)]).kind).toBe('unclear');
});

test('a plausible competing answer prompts a retry without awarding points', () => {
  const miss = heard('cool');
  expect(gradeSpeech(meaning, miss).kind).toBe('mismatch');
  expect(gradeSpeech(meaning, { ...miss, alternatives: [heard('school')] }).kind).toBe('unclear');
  expect(gradeSpeech(meaning, { ...miss, alternatives: [heard('school', 0.1), heard('Juken pass')] }).kind).toBe('mismatch');
});

test('dictated numbers and written number words agree', () => {
  const card = { ...meaning, synonyms: ['two'] };
  expect(gradeSpeech(card, heard('2')).kind).toBe('correct');
  expect(gradeSpeech(card, heard('12')).kind).toBe('mismatch');
});

test('only mixed review vocabulary becomes a local recognition hint', () => {
  const other = { data: { readings: [{ reading: 'やま', accepted_answer: true }, { reading: 'さん', accepted_answer: false }] } };
  expect(reviewVocabulary([subject], true)).toEqual([]);
  expect(reviewVocabulary([subject, other], true)).toEqual(['がっこう', 'やま']);
  expect(reviewVocabulary([subject, other], false)).toEqual([]);
});
