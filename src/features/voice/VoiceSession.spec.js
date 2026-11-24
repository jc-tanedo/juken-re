import VoiceSession from './VoiceSession';
import { gradeSpeech } from './gradeSpeech';

const meaning = {
  reviewType: 'meaning', answer: 'Tree', synonyms: ['timber'],
  subject: { data: {
    meanings: [{ meaning: 'Tree', accepted_answer: true }, { meaning: 'plant', accepted_answer: false }],
    auxiliary_meanings: [{ type: 'whitelist', meaning: 'wood' }, { type: 'blacklist', meaning: 'forest' }],
  } },
};
const reading = { reviewType: 'reading', subject: { data: { readings: [{ reading: 'がっこう', accepted_answer: true }] } } };
const result = (text, confidence = null) => ({ status: 'result', text, confidence });
const flush = () => Promise.resolve();

test('grades allowed English meanings and handles missing or blocked personal synonyms', () => {
  for (const text of ['A TREE!', 'WOOD.', 'timber']) expect(gradeSpeech(meaning, result(text)).kind).toBe('correct');
  expect(gradeSpeech(meaning, result('plant', 1)).kind).toBe('mismatch');
  expect(gradeSpeech({ ...meaning, synonyms: ['forest'] }, result('forest', 1)).kind).toBe('mismatch');
  expect(gradeSpeech({ ...meaning, synonyms: null }, result('unknown', 1)).kind).toBe('manual');
  expect(gradeSpeech({ ...meaning, synonyms: null }, result('tree')).kind).toBe('correct');
});

test('requires verifiable Japanese pronunciation, preserving vowel length and small tsu', () => {
  expect(gradeSpeech(reading, result('ガッコウ。')).kind).toBe('correct');
  for (const text of ['がこう', 'がっこ']) expect(gradeSpeech(reading, result(text, 1)).kind).toBe('mismatch');
  expect(gradeSpeech(reading, result('生', 1)).kind).toBe('unclear');
  expect(gradeSpeech(reading, result('受験パス', 1)).kind).toBe('pass');
  expect(gradeSpeech(meaning, result('Juken pass', 1)).kind).toBe('pass');
});

function setup() {
  const utterances = [];
  const service = { permission: async () => true, cancel: jest.fn(),
    listen: jest.fn(() => new Promise(resolve => utterances.push(resolve))) };
  const commit = jest.fn(() => true);
  const advance = jest.fn();
  const session = new VoiceSession(service, () => {}, { commit, advance, answers: () => meaning });
  const item = { reviewType: 'meaning' };
  session.setTurn({ item });
  return { session, utterances, item, commit, advance };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('Retry just before the deadline drops the miss and only the new result grades', async () => {
  const { session, utterances, commit } = setup();
  await session.start();
  utterances.shift()(result('three', 0.9));
  await flush();
  jest.advanceTimersByTime(2999);
  session.retry();
  session.retry();
  jest.advanceTimersByTime(5);
  expect(commit).not.toHaveBeenCalled();
  expect(utterances).toHaveLength(1);
  utterances.shift()(result('tree', 1));
  await flush();
  expect(commit).toHaveBeenCalledTimes(1);
  expect(commit.mock.calls[0][1]).toBe(true);
});

test('Stop cancels the pending grade and ignores late results', async () => {
  const { session, utterances, commit } = setup();
  await session.start();
  session.stop();
  await session.start();
  utterances.shift()(result('tree', 1));
  await flush();
  expect(commit).not.toHaveBeenCalled();
  utterances.shift()(result('three', 1));
  await flush();
  session.stop();
  jest.advanceTimersByTime(5000);
  expect(commit).not.toHaveBeenCalled();
});

test('an unscored miss requires the same mismatch twice', async () => {
  const { session, utterances, commit } = setup();
  await session.start();
  for (const text of ['three', 'Three!']) {
    utterances.shift()(result(text));
    await flush();
  }
  expect(session.state.phase).toBe('correction');
  jest.advanceTimersByTime(3000);
  session.retry();
  expect(session.state.phase).toBe('answer');
  expect(commit).toHaveBeenCalledTimes(1);
});

test('inconsistent guesses and repeated silence fall back without grading', async () => {
  for (const pair of [[result('three', 0.1), { status: 'silence' }], [result('leaf'), result('branch')]]) {
    const { session, utterances, commit } = setup();
    await session.start();
    for (const response of pair) { utterances.shift()(response); await flush(); }
    expect(session.state.phase).toBe('manual');
    expect(commit).not.toHaveBeenCalled();
  }
});

test('Pass commits once and a requeued final item starts a fresh attempt', async () => {
  const { session, item, utterances, commit, advance } = setup();
  await session.start();
  const oldResult = utterances.shift();
  session.pass();
  session.pass();
  jest.advanceTimersByTime(2000);
  expect(advance).toHaveBeenCalledTimes(1);
  session.setTurn({ item });
  oldResult(result('tree', 1));
  await flush();
  expect(commit).toHaveBeenCalledTimes(1);
  utterances.shift()(result('tree', 1));
  await flush();
  expect(commit.mock.calls.map(call => call[1])).toEqual([false, true]);
});

test('native activity drives the mic and transcript; only a final result commits a grade', async () => {
  const service = { permission: async () => true, cancel: jest.fn(), listen: jest.fn() };
  let notify;
  let finish;
  service.listen.mockImplementation((locale, current, activity) => {
    notify = activity;
    return new Promise(resolve => { finish = resolve; });
  });
  const commit = jest.fn(() => true);
  const session = new VoiceSession(service, () => {}, { commit, answers: () => meaning, advance: jest.fn() });
  session.setTurn({ item: { reviewType: 'meaning' } });
  await session.start();
  expect(session.state.phase).toBe('preparing');
  notify({ stage: 'ready' });
  expect(session.state.phase).toBe('listening');
  notify({ stage: 'speaking' });
  notify({ stage: 'partial', text: 'three' });
  expect(session.state).toMatchObject({ phase: 'speaking', detail: '“three”' });
  notify({ stage: 'processing' });
  notify({ stage: 'partial', text: 'tree' });
  expect(session.state).toMatchObject({ phase: 'processing', detail: '“tree”' });
  expect(commit).not.toHaveBeenCalled();
  finish(result('tree', 1));
  await flush();
  notify({ stage: 'ready' });
  expect(session.state).toMatchObject({ phase: 'correct', detail: '“tree”' });
  expect(commit).toHaveBeenCalledTimes(1);
});

test('a correct live transcript still needs a final result before an English card advances', async () => {
  const { session, utterances, commit } = setup();
  await session.start();
  const activity = session.service.listen.mock.calls[0][2];
  activity({ stage: 'partial', text: 'tree' });
  expect(commit).not.toHaveBeenCalled();
  utterances.shift()({ status: 'silence' });
  await flush();
  expect(session.state.detail).toContain('No final transcript');
  expect(commit).not.toHaveBeenCalled();
  utterances.shift()(result('tree', 0.1));
  await flush();
  expect(session.state.phase).toBe('correct');
  expect(commit).toHaveBeenCalledTimes(1);
});
