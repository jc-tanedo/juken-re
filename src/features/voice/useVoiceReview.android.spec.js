import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import useReviewSession from 'src/features/reviews/useReviewSession';
import useVoiceReview from './useVoiceReview';
import { speechService } from './speechService';

jest.mock('./speechService', () => ({
  speechService: { permission: async () => true, listen: jest.fn(), cancel: jest.fn() },
}));
jest.mock('easy-peasy', () => ({ useStoreState: fn => fn({ session: { userSettings: {} } }) }));
jest.mock('src/features/wk/request', () => ({ request: jest.fn() }));

const androidTest = Platform.OS === 'android' ? test : test.skip;

androidTest('a missed final demo card requeues, then submits exactly once with the original mistake count', async () => {
  jest.useFakeTimers();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const reviews = [{ id: 1, data: { subject_id: 12, subject_type: 'radical' } }];
  const subjects = [{ id: 12, object: 'radical', data: { meanings: [{ meaning: 'tree', accepted_answer: true }] } }];
  const completed = jest.fn();
  const results = [];
  speechService.listen.mockImplementation(() => new Promise(resolve => results.push(resolve)));
  let voice;
  function Demo() {
    const { queue, subjectsDict, submitAnswer } = useReviewSession(reviews, subjects);
    voice = useVoiceReview({ queue, subjectsDict, subjects, demo: true,
      submit: (item, correct) => submitAnswer(item, correct, completed) });
    return null;
  }
  const root = createRoot();
  try {
    await act(async () => root.render(<Demo />));
    await act(async () => voice.session.start());
    await act(async () => { voice.session.pass(); voice.session.pass(); });
    expect(voice.state.phase).toBe('answer');
    expect(completed).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(2000));
    expect(voice.state.phase).toBe('listening');
    await act(async () => results[0]({ status: 'result', text: 'tree' }));
    expect(completed).not.toHaveBeenCalled();
    await act(async () => results[1]({ status: 'result', text: 'tree' }));
    expect(completed).toHaveBeenCalledTimes(1);
    expect(completed.mock.calls[0][0]).toMatchObject({ review: reviews[0], incorrectMeanings: 1 });
    expect(voice.cards).toHaveLength(1);
    await act(async () => jest.advanceTimersByTime(650));
    expect(voice.cards).toHaveLength(0);
    expect(voice.state.phase).toBe('off');
  } finally {
    await act(async () => root.unmount());
    jest.useRealTimers();
  }
});
