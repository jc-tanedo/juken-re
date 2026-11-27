import { useCallback, useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import useVoiceReview from 'src/features/voice/useVoiceReview';
import { isVoiceCapturePhase } from 'src/features/voice/VoiceSession';
import usePronunciationAudio from 'src/features/audio/usePronunciationAudio';

/**
 * Coordinates the shared flashcard deck lifecycle across Reviews, Extra Study,
 * and Lesson Quizzes: voice review state, pronunciation audio, autoplay,
 * voice-capture audio suppression, and Item Info inspection.
 */
export default function useStudyDeck({
  queue = [],
  subjects = [],
  subjectsDict = {},
  demo = false,
  submit,
  speechModeId,
  autoplayAudio = false,
  preferredVoiceActorId = null,
  studyMaterials,
  overrideAudioSubject = null,
  pauseAutoplay = false,
}) {
  const [detailsSubject, setDetailsSubject] = useState(null);
  const [topCardRevealed, setTopCardRevealed] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const deckActionsRef = useRef(null);

  const voice = useVoiceReview({
    queue,
    subjects,
    subjectsDict,
    demo,
    submit,
    mode: speechModeId,
    studySynonyms: studyMaterials?.synonymsBySubjectId,
  });

  const voiceControlsCard = !['off', 'manual'].includes(voice.state.phase);
  const topCard = voice.cards[0];
  const topSubject = topCard ? subjectsDict[_.get(topCard, 'review.data.subject_id')] : null;
  const isTopRevealed = topCardRevealed || voice.state.phase === 'correct' || voice.state.phase === 'answer';

  useEffect(() => {
    setTopCardRevealed(false);
    setExpandedDetails(false);
  }, [topCard?.id]);

  const audio = usePronunciationAudio({
    subject: overrideAudioSubject || topSubject,
    preferredVoiceActorId,
    suppressPlayback: isVoiceCapturePhase(voice.state.phase),
  });

  useEffect(() => {
    if (!autoplayAudio || pauseAutoplay || detailsSubject || overrideAudioSubject) return;
    if (voice.state.phase === 'correct' || voice.state.phase === 'answer') {
      audio.play();
    }
  }, [autoplayAudio, pauseAutoplay, detailsSubject, overrideAudioSubject, voice.state.phase, topCard?.id]);

  const stopMedia = useCallback(() => {
    audio.stop();
    voice.session.stop();
  }, [audio.stop, voice.session]);

  const openDetails = useCallback(subject => {
    if (!subject) return;
    stopMedia();
    setDetailsSubject(subject);
  }, [stopMedia]);

  const closeDetails = useCallback(() => {
    setDetailsSubject(null);
  }, []);

  const onRevealCard = useCallback(() => {
    if (autoplayAudio && !pauseAutoplay && !detailsSubject) {
      audio.play();
    }
  }, [autoplayAudio, pauseAutoplay, detailsSubject, audio.play]);

  return {
    voice,
    cards: voice.cards,
    topCard,
    topSubject,
    isTopRevealed,
    setTopCardRevealed,
    expandedDetails,
    setExpandedDetails,
    deckActionsRef,
    voiceControlsCard,
    audio,
    detailsSubject,
    openDetails,
    closeDetails,
    stopMedia,
    onRevealCard,
  };
}
