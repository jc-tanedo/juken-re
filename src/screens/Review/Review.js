import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Platform, StatusBar, StyleSheet, View, Text } from 'react-native';
import { useStoreActions, useStoreState } from 'easy-peasy';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import Page from 'src/components/Page/Page';
import Bar from 'src/components/Bar/Bar';
import Card from 'src/components/Card/Card';
import Deck from 'src/components/Deck/Deck';
import Overlay from 'src/components/Overlay/Overlay';
import SrsStages from 'src/components/Toast/SrsStages';
import UndoSnackbar from 'src/components/Toast/UndoSnackbar';
import VacationBanner from 'src/components/VacationBanner/VacationBanner';
import ForecastCard from 'src/components/Forecast/ForecastCard';
import useColorScheme from 'src/hooks/useColorScheme';
import Message from 'src/screens/Message/Message';
import useLoadReviews from 'src/features/reviews/useLoadReviews';
import useReviewSession from 'src/features/reviews/useReviewSession';
import useUndoQueue from 'src/features/reviews/useUndoQueue';
import useReviewForecast from 'src/features/reviews/useReviewForecast';
import {
  selectWrapUpReviewIds,
  WRAP_UP_TEN_ITEMS,
} from 'src/features/reviews/utils/filterWrapUpQueue';
import useScrollLock from 'src/hooks/useScrollLock';
import useLeaveWarning from 'src/hooks/useLeaveWarning';
import Button from 'src/components/Button/Button';
import extractSubject from 'src/utils/extractSubject';
import ReviewTopBar from 'src/screens/Review/ReviewTopBar';
import useVoiceReview from 'src/features/voice/useVoiceReview';
import VoicePanel from 'src/features/voice/VoicePanel';
import { speechMode } from 'src/features/voice/speechProviders';
import ReviewMenu from 'src/screens/Review/ReviewMenu';
import SubjectDetailsModal from 'src/screens/SubjectDetails/SubjectDetailsModal';
import useStudyMaterials from 'src/features/wk/useStudyMaterials';
import usePronunciationAudio from 'src/features/audio/usePronunciationAudio';
import { selectPronunciationAudio } from 'src/features/audio/audioSelector';
import {
  AUTOPLAY_AUDIO,
  DEFAULT_VOICE_ACTOR_ID,
  QUICK_MODE,
  SHOW_SRS_INDICATOR,
  SKIP_MODE,
  SPEECH_MODE,
  WRAP_UP_MODE_TYPE,
} from 'src/common/constants';

const VOICE_CAPTURE_PHASES = new Set(['starting', 'preparing', 'listening', 'speaking', 'processing']);

const Review = ({ demo = false, stopDemo } = {}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSubpage, setMenuSubpage] = useState('root');
  const [detailsSubject, setDetailsSubject] = useState(null);

  const [wrapUpMode, setWrapUpMode] = useState(false);
  const [wrapUpIds, setWrapUpIds] = useState(null);

  const signOut = useStoreActions(actions => actions.session.signOut);
  const refreshUser = useStoreActions(actions => actions.session.refreshUser);
  const submitReview = useStoreActions(actions => actions.reviews.submitReview);
  const retrySubmission = useStoreActions(actions => actions.reviews.retrySubmission);
  const ignoreSubmissionErrors = useStoreActions(actions => actions.reviews.ignoreSubmissionErrors);
  const token = useStoreState(state => state.session.token);
  const user = useStoreState(state => state.session.user);
  const submissionQueue = useStoreState(state => state.reviews.submissionQueue);
  const submissionErrors = useStoreState(state => state.reviews.submissionErrors);
  const lastSrsUpdate = useStoreState(state => state.reviews.lastSrsUpdate);
  const srsSystems = useStoreState(state => state.reviews.srsSystems);
  const userSettings = useStoreState(state => state.session.userSettings);

  const skipMode = _.get(userSettings, SKIP_MODE);
  const quickMode = _.get(userSettings, QUICK_MODE);
  const autoplayAudio = Boolean(_.get(userSettings, AUTOPLAY_AUDIO));
  const showSrsIndicator = _.get(userSettings, SHOW_SRS_INDICATOR) !== false;
  const wrapUpStyle = _.get(userSettings, WRAP_UP_MODE_TYPE, WRAP_UP_TEN_ITEMS);
  const preferredVoiceActorId = _.get(userSettings, DEFAULT_VOICE_ACTOR_ID)
    ?? _.get(user, 'data.preferences.default_voice_actor_id');
  const vacationStartedAt = !demo ? _.get(user, 'data.current_vacation_started_at') : null;

  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];

  useScrollLock();
  useLeaveWarning();

  useEffect(() => {
    if (!demo && token) refreshUser?.();
  }, [demo, token]);

  // load reviews
  const {
    loadReviews,
    loadingReviews,
    reviews,
    subjects,
  } = useLoadReviews(demo);

  // manage review session
  const {
    queue,
    submitAnswer,
    undoLastAnswer,
    subjectsDict,
    totalCards,
    totalReviews,
    stats,
    unfinishedReviews,
  } = useReviewSession(
    reviews,
    subjects,
  );

  const studyMaterials = useStudyMaterials({
    token,
    demo,
    enabled: Boolean(demo || token),
  });

  const undoQueue = useUndoQueue({
    onCommit: payload => submitReview(payload),
    onUndoSession: undoLastAnswer,
  });

  function toggleWrapUp(enabled) {
    if (enabled) {
      setWrapUpIds(selectWrapUpReviewIds(queue, unfinishedReviews, wrapUpStyle, 10));
      setWrapUpMode(true);
    } else {
      setWrapUpMode(false);
      setWrapUpIds(null);
    }
  }

  useEffect(() => {
    if (wrapUpMode) {
      setWrapUpIds(selectWrapUpReviewIds(queue, unfinishedReviews, wrapUpStyle, 10));
    }
  }, [wrapUpStyle]);

  const queueFiltered = useMemo(() => {
    if (!wrapUpMode) return queue;
    return queue.filter(i => {
      const reviewId = _.get(i, 'review.id');
      return wrapUpIds ? wrapUpIds.has(reviewId) : !_.isNil(_.get(unfinishedReviews, reviewId));
    });
  }, [queue, wrapUpMode, wrapUpIds, unfinishedReviews]);

  const wrapUpRemaining = useMemo(() => {
    if (!wrapUpMode) return null;
    return new Set(queueFiltered.map(i => _.get(i, 'review.id')).filter(Boolean)).size;
  }, [wrapUpMode, queueFiltered]);

  const activeSpeechMode = speechMode(userSettings?.[SPEECH_MODE]);

  function submit(item, correct) {
    const subject = subjectsDict[_.get(item, 'review.data.subject_id')];
    const chars = subject?.data?.characters || subject?.data?.slug || 'Card';
    const bufferedManual = !['listening', 'speaking', 'processing', 'correction', 'correct', 'answer'].includes(
      voice?.state?.phase,
    );

    submitAnswer(item, correct, ({ review, incorrectMeanings, incorrectReadings }) => {
      const payload = {
        demo,
        subjectId: review.data.subject_id,
        reviewId: review.id,
        srsStage: review.data.srs_stage,
        srsSystemId: review.data.spaced_repetition_system_id,
        incorrectMeanings,
        incorrectReadings,
      };
      if (bufferedManual) {
        undoQueue.enqueue(payload, `${chars} (${correct ? 'Correct' : 'Missed'})`);
      } else {
        undoQueue.flush();
        submitReview(payload);
      }
    });
  }

  const voice = useVoiceReview({
    queue: queueFiltered,
    subjects,
    subjectsDict,
    demo,
    submit,
    mode: userSettings?.[SPEECH_MODE],
    studySynonyms: studyMaterials.synonymsBySubjectId,
  });
  const voiceControlsCard = !['off', 'manual'].includes(voice.state.phase);
  const topCard = voice.cards[0];
  const topSubject = topCard ? subjectsDict[_.get(topCard, 'review.data.subject_id')] : null;
  const audio = usePronunciationAudio({
    subject: topSubject,
    preferredVoiceActorId,
    suppressPlayback: VOICE_CAPTURE_PHASES.has(voice.state.phase),
  });

  useEffect(() => {
    if (!autoplayAudio || detailsSubject || menuOpen) return;
    if (voice.state.phase === 'correct' || voice.state.phase === 'answer') {
      audio.play();
    }
  }, [autoplayAudio, voice.state.phase, topCard?.id, detailsSubject, menuOpen]);

  function openMenu(open, subpage = 'root') {
    if (open) {
      audio.stop();
      voice.session.stop();
      setMenuSubpage(subpage);
    } else {
      setMenuSubpage('root');
    }
    setMenuOpen(open);
  }

  function openDetails(subject) {
    if (!subject) return;
    audio.stop();
    voice.session.stop();
    setDetailsSubject(subject);
  }

  function handleRefresh() {
    undoQueue.flush();
    loadReviews();
  }

  function handleLogout() {
    undoQueue.flush();
    if (demo) stopDemo();
    else signOut();
  }

  // are all queue items asked
  const isQueueClear = !loadingReviews && voice.cards.length === 0;
  const completedCards = stats?.cards?.completed ?? 0;
  const remainingCards = Math.max(0, totalCards - completedCards);
  const { forecast, loading: forecastLoading } = useReviewForecast({
    token,
    demo,
    enabled: isQueueClear && !wrapUpMode,
  });

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/** display srs stages toasts */}
      <SrsStages
        stages={lastSrsUpdate}
        srsSystem={srsSystems?.[lastSrsUpdate?.srsSystemId]}
        enabled={showSrsIndicator}
      />

      {loadingReviews && (
        <Overlay>
          <Message loading />
        </Overlay>
      )}

      <Page
        style={[
          styles.page,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.deckWrapper}>
          {/** top bar */}
          <ReviewTopBar
            demo={demo}
            wrapUpMode={wrapUpMode}
            wrapUpRemaining={wrapUpRemaining}
            logout={handleLogout}
            stopDemo={stopDemo}
            submissionQueue={submissionQueue}
            submissionErrors={submissionErrors}
            ignoreSubmissionErrors={ignoreSubmissionErrors}
            retrySubmission={retrySubmission}
            setMenuOpen={open => openMenu(open, 'root')}
          />

          <VacationBanner startedAt={vacationStartedAt} />

          {/** menu */}
          <ReviewMenu
            menuOpen={menuOpen}
            setMenuOpen={openMenu}
            initialSubpage={menuSubpage}
            demo={demo}
            logout={handleLogout}
            stopDemo={stopDemo}
            loadReviews={handleRefresh}
            wrapUpMode={wrapUpMode}
            setWrapUpMode={toggleWrapUp}
          />

          {/** Item info sheet */}
          <SubjectDetailsModal
            visible={Boolean(detailsSubject)}
            subject={detailsSubject}
            studyMaterial={detailsSubject ? studyMaterials.materialsBySubjectId[detailsSubject.id] : null}
            subjectsById={subjectsDict}
            token={token}
            preferredVoiceActorId={preferredVoiceActorId}
            onSaveStudyMaterial={studyMaterials.saveStudyMaterial}
            onClose={() => setDetailsSubject(null)}
          />

          {/* render deck */}
          {voice.cards.length > 0 && (
            <Deck
              style={styles.deck}
              key={voiceControlsCard ? 'voice' : 'manual'}
              cards={voice.cards}
              swipe={voice.state.swipe}
              interactive={!voiceControlsCard}
              allowSkipping={skipMode}
              onReveal={() => {
                if (autoplayAudio && !detailsSubject && !menuOpen) audio.play();
              }}
              dismissCard={voice.manualDismiss}
              renderCard={(item, props) => {
                if (!item) return <Card empty />;

                const { id, review, reviewType } = item;
                const subjectId = _.get(review, 'data.subject_id');
                const subject = _.get(subjectsDict, subjectId);
                const subjectType = _.get(subject, 'object');
                const meaningMnemonic = _.get(subject, 'data.meaning_mnemonic');
                const readingMnemonic = _.get(subject, 'data.reading_mnemonic');
                const cardClip = selectPronunciationAudio(subject, { preferredVoiceActorId });
                const synonymsText = (studyMaterials.synonymsBySubjectId?.[subjectId] || []).join(', ');
                const {
                  question,
                  questionComponent,
                  answer,
                  readingTypeLabel,
                } = extractSubject(subject, reviewType);

                return (
                  <Card
                    key={`${id}_${reviewType}`}
                    deckProps={props}
                    subjectType={subjectType}
                    reviewType={reviewType}
                    reviewQuestion={question}
                    reviewQuestionComponent={questionComponent}
                    reviewAnswer={answer}
                    readingTypeLabel={readingTypeLabel}
                    synonymsText={synonymsText}
                    hasAudio={Boolean(cardClip)}
                    playingAudio={Boolean(cardClip && audio.playingUrl === cardClip.url)}
                    onPlayAudio={cardClip ? () => audio.play(cardClip) : undefined}
                    onOpenDetails={subject ? () => openDetails(subject) : undefined}
                    meaningMnemonic={meaningMnemonic}
                    readingMnemonic={readingMnemonic}
                    voiceControlled={voiceControlsCard}
                    quickMode={quickMode}
                  />
                );
              }}
            />
          )}

          <UndoSnackbar
            visible={undoQueue.hasPending}
            label={undoQueue.pendingLabel || 'Review recorded'}
            onUndo={undoQueue.undo}
          />

          {Platform.OS === 'android' && voice.cards.length > 0 && (
            <VoicePanel
              state={voice.state}
              session={voice.session}
              colors={colors}
              engineLabel={activeSpeechMode.label}
              onOpenVoiceSettings={() => openMenu(true, 'voice')}
            />
          )}

          {/* no reviews notice */}
          {isQueueClear && (
            <View style={[styles.noReviewsContainer, { backgroundColor: colors.successContainer }, theme.elevation.level1]}>
              <View style={[styles.successIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
                <MaterialIcons name="check-circle" size={30} color={colors.success} />
              </View>
              <Text accessibilityRole="header" style={[theme.type.headlineMedium, { color: colors.onSuccessContainer }]}>
                {wrapUpMode ? 'Wrap-up queue clear!' : 'Review queue clear!'}
              </Text>
              <Text style={[theme.type.bodyLarge, { color: colors.onSuccessContainer }]}>
                {wrapUpMode
                  ? 'You can now end your review session.'
                  : 'All available reviews are complete.'}
              </Text>
            </View>
          )}

          {isQueueClear && !wrapUpMode && (
            <ForecastCard forecast={forecast} loading={forecastLoading} />
          )}

          {/* stats */}
          {totalReviews > 0 && (
            <View
              style={[
                styles.box,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
              ]}
            >
              <View style={styles.progressHeader}>
                <Text style={[theme.type.titleSmall, { color: colors.onSurface }]}>Session progress</Text>
                <View style={[styles.remainingChip, { backgroundColor: colors.secondaryContainer }]}>
                  <Text style={[theme.type.labelSmall, { color: colors.onSecondaryContainer }]}>
                    {remainingCards} left
                  </Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                {[
                  { key: 'reviews', label: 'Reviews', total: totalReviews },
                  { key: 'cards', label: 'Cards', total: totalCards },
                ].map(({ key, label, total }) => {
                  const { completed = 0, incorrectPercent = 0, correctPercent = 0 } = stats?.[key] ?? {};
                  const unfinished = key === 'reviews' ? stats?.reviews?.unfinished : 0;
                  return (
                    <View key={key} style={styles.progressCol}>
                      <View style={styles.progressLabel}>
                        <Text style={[theme.type.labelMedium, { color: colors.onSurface }]}>{label}</Text>
                        <Text style={[theme.type.bodySmall, styles.count, { color: colors.onSurfaceVariant }]}>
                          {completed}/{total}{unfinished > 0 ? ` · ${unfinished} open` : ''}
                        </Text>
                      </View>
                      <Bar
                        style={{ backgroundColor: colors.surfaceContainerHighest }}
                        values={[incorrectPercent, correctPercent]}
                        colors={[colors.error, colors.success]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* controls */}
          {isQueueClear && (
            <View style={styles.controls}>
              {wrapUpMode && (
                <Button
                  variant="filled"
                  text="Disable Wrap-up Mode"
                  iconLeft={<MaterialIcons name="schedule" size={18} color={colors.onPrimary} />}
                  onPress={() => toggleWrapUp(false)}
                />
              )}
              {!wrapUpMode && (
                <Button
                  variant="filled"
                  text="Refresh"
                  iconLeft={<MaterialIcons name="refresh" size={18} color={colors.onPrimary} />}
                  onPress={handleRefresh}
                />
              )}
              <Button
                text="Logout"
                variant="text"
                onPress={handleLogout}
              />
            </View>
          )}
        </View>
      </Page>
    </>
  );
};

Review.propTypes = {
  demo: PropTypes.bool,
  stopDemo: PropTypes.func,
};

const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noReviewsContainer: {
    width: '100%',
    padding: 24,
    gap: 8,
    borderRadius: theme.shape.extraLarge,
    marginBottom: 4,
  },
  successIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.shape.largeIncreased,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deckWrapper: {
    flex: 8,
    flexGrow: 1,
    maxWidth: 520,
    width: '100%',
    height: '100%',
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deck: {
    width: '100%',
    height: '100%',
    maxHeight: 620,
    zIndex: 9,
  },
  box: {
    width: '100%',
    flexShrink: 0,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderRadius: theme.shape.extraLarge,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  remainingChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.shape.full,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    flexShrink: 1,
    textAlign: 'right',
  },
  controls: {
    width: '100%',
    gap: 8,
    marginTop: 14,
  },
});

export default Review;
