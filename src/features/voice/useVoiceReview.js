import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { reviewVocabulary } from './reviewVocabulary';
import VoiceSession from './VoiceSession';
import { speechService } from './speechService';
import useStudySynonyms from './useStudySynonyms';
import extractSubject from 'src/utils/extractSubject';

// Keep displaying a committed card during feedback, even if it was the final
// review or the same missed item was immediately requeued.
export default function useVoiceReview({ queue, subjects, subjectsDict, demo, submit, mode }) {
  const [held, hold] = useState(null);
  const [sequence, setSequence] = useState(0);
  const [state, setState] = useState({ phase: 'off' });
  const cards = held || queue;
  const item = cards[0];
  const turn = useMemo(() => item ? { item } : null, [item, sequence]);
  const synonyms = useStudySynonyms(subjects, demo, state.phase !== 'off');
  const active = state.phase !== 'off';
  const vocabulary = useMemo(() => {
    if (!active) return {};
    const upcoming = new Set();
    for (const item of queue) {
      const subject = subjectsDict[item.review.data.subject_id];
      if (subject) upcoming.add(subject);
      if (upcoming.size === 16) break;
    }
    return { meaning: reviewVocabulary(upcoming, false), reading: reviewVocabulary(upcoming, true) };
  }, [active, queue, subjectsDict]);
  const latest = useRef(null);
  const graded = useRef(null);

  function advance() {
    hold(null);
    setSequence(n => n + 1);
  }

  function commit(expected, correct, withFeedback) {
    if (!expected || expected !== turn || expected.item !== queue[0] || graded.current === turn) return false;
    graded.current = turn;
    if (withFeedback) hold(cards);
    submit(item, correct);
    if (!withFeedback) advance();
    return true;
  }

  const [session] = useState(() => new VoiceSession(speechService, setState, {
    answers: () => latest.current.answers(),
    mode: () => latest.current.mode,
    vocabulary: () => latest.current.vocabulary,
    commit: (expected, correct) => latest.current.commit(expected, correct, true),
    advance,
  }));

  useLayoutEffect(() => {
    latest.current = {
      commit, mode, vocabulary: vocabulary[item?.reviewType] || [],
      answers() {
        const id = item.review.data.subject_id;
        const subject = subjectsDict[id];
        return {
          subject, reviewType: item.reviewType,
          answer: extractSubject(subject, item.reviewType).answer,
          synonyms: synonyms == null ? null : synonyms[id] || [],
        };
      },
    };
    session.setTurn(turn);
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', status => {
      if (status !== 'active' && session.state.phase !== 'off') session.stop();
    });
    return () => { sub.remove(); session.invalidate(); };
  }, [session]);

  return {
    cards, state, session,
    manualDismiss: direction => {
      if (['off', 'manual'].includes(session.state.phase)) commit(turn, direction === 'right', false);
    },
  };
}
