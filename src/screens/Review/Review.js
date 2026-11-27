import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ScrollView, StatusBar, StyleSheet, View, Text } from 'react-native';
import { useStoreActions, useStoreState } from 'easy-peasy';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import Page from 'src/components/Page/Page';
import Bar from 'src/components/Bar/Bar';
import StudyDeck from 'src/components/Deck/StudyDeck';
import AdaptivePaneLayout from 'src/components/Layout/AdaptivePaneLayout';
import SrsStages from 'src/components/Toast/SrsStages';
import UndoSnackbar from 'src/components/Toast/UndoSnackbar';
import VacationBanner from 'src/screens/Review/VacationBanner';
import ForecastCard from 'src/screens/Review/ForecastCard';
import useColorScheme from 'src/hooks/useColorScheme';
import useLayoutMode from 'src/hooks/useLayoutMode';
import Message from 'src/screens/Message/Message';
import useLoadReviews from 'src/features/reviews/useLoadReviews';
import useReviewSession from 'src/features/reviews/useReviewSession';
import useStudyDeck from 'src/features/reviews/useStudyDeck';
import useUndoQueue from 'src/features/reviews/useUndoQueue';
import useReviewForecast from 'src/features/reviews/useReviewForecast';
import {
  selectWrapUpReviewIds,
  WRAP_UP_TEN_ITEMS,
} from 'src/features/reviews/utils/filterWrapUpQueue';
import useScrollLock from 'src/hooks/useScrollLock';
import useLeaveWarning from 'src/hooks/useLeaveWarning';
import Button from 'src/components/Button/Button';
import ReviewTopBar from 'src/screens/Review/ReviewTopBar';
import { speechMode } from 'src/features/voice/speechProviders';
import ReviewMenu from 'src/screens/Review/ReviewMenu';
import useStudyMaterials from 'src/features/wk/useStudyMaterials';
import { recordMistake } from 'src/features/extraStudy/recentMistakes';
import {
  ANSWER_INPUT_BOTH,
  ANSWER_INPUT_MODE,
  AUTOPLAY_AUDIO,
  CARD_SIDE_RIGHT,
  DEFAULT_VOICE_ACTOR_ID,
  QUICK_MODE,
  SHOW_SRS_INDICATOR,
  SKIP_MODE,
  SPEECH_MODE,
  UNFOLDED_CARD_SIDE,
  WRAP_UP_MODE_TYPE,
} from 'src/common/constants';

const Review = ({ demo = false, stopDemo } = {}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSubpage, setMenuSubpage] = useState('root');

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
  const unfoldedCardSide = _.get(userSettings, UNFOLDED_CARD_SIDE, CARD_SIDE_RIGHT);
  const answerInputMode = _.get(userSettings, ANSWER_INPUT_MODE, ANSWER_INPUT_BOTH);
  const preferredVoiceActorId = _.get(userSettings, DEFAULT_VOICE_ACTOR_ID)
    ?? _.get(user, 'data.preferences.default_voice_actor_id');
  const vacationStartedAt = !demo ? _.get(user, 'data.current_vacation_started_at') : null;

  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];
  const layout = useLayoutMode();

  useScrollLock();
  useLeaveWarning();

  useEffect(() => {
    if (!demo && token) refreshUser?.();
  }, [demo, token]);

  const {
    loadReviews,
    loadingReviews,
    reviews,
    subjects,
  } = useLoadReviews(demo);

  const {
    queue,
    submitAnswer,
    undoLastAnswer,
    subjectsDict,
    totalCards,
    totalReviews,
    stats,
    unfinishedReviews,
  } = useReviewSession(reviews, subjects);

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

  function submit(item, correct, { fromVoice = false } = {}) {
    const subjectId = _.get(item, 'review.data.subject_id');
    const subject = subjectsDict[subjectId];
    const chars = subject?.data?.characters || subject?.data?.slug || 'Card';

    if (!correct && subjectId) {
      recordMistake(demo ? 'DEMO' : token, subjectId);
    }

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
      if (fromVoice) {
        undoQueue.flush();
        submitReview(payload);
      } else {
        undoQueue.enqueue(payload, `${chars} (${correct ? 'Correct' : 'Missed'})`);
      }
    });
  }

  const activeSpeechMode = speechMode(userSettings?.[SPEECH_MODE]);
  const studyDeck = useStudyDeck({
    queue: queueFiltered,
    subjects,
    subjectsDict,
    demo,
    submit,
    speechModeId: userSettings?.[SPEECH_MODE],
    autoplayAudio,
    preferredVoiceActorId,
    studyMaterials,
    pauseAutoplay: menuOpen || loadingReviews,
  });

  function openMenu(open, subpage = 'root') {
    if (open) {
      studyDeck.stopMedia();
      setMenuSubpage(subpage);
    } else {
      setMenuSubpage('root');
    }
    setMenuOpen(open);
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

  const isQueueClear = !loadingReviews && studyDeck.cards.length === 0;
  const completedCards = stats?.cards?.completed ?? 0;
  const remainingCards = Math.max(0, totalCards - completedCards);
  const { forecast, loading: forecastLoading } = useReviewForecast({
    token,
    demo,
    enabled: isQueueClear && !wrapUpMode,
  });

  const stackProgressMetrics = layout.isMedium && !layout.isTabletop && !isQueueClear;
  const useAdaptiveStudyLayout = (layout.isWide || layout.isTabletop) && studyDeck.cards.length > 0;

  const sessionProgressBox = totalReviews > 0 ? (
    <View
      style={[
        styles.box,
        useAdaptiveStudyLayout && styles.boxAdaptive,
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
      <View style={stackProgressMetrics ? styles.metricsCol : styles.metricsRow}>
        {[
          { key: 'reviews', label: 'Reviews', total: totalReviews },
          { key: 'cards', label: 'Cards', total: totalCards },
        ].map(({ key, label, total }) => {
          const { completed = 0, incorrectPercent = 0, correctPercent = 0 } = stats?.[key] ?? {};
          const unfinished = key === 'reviews' ? stats?.reviews?.unfinished : 0;
          return (
            <View key={key} style={stackProgressMetrics ? styles.progressColStacked : styles.progressCol}>
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
  ) : null;

  const queueClearCard = (
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
  );

  const queueClearControls = (
    <View style={styles.controls}>
      {wrapUpMode ? (
        <Button
          variant="filled"
          text="Disable Wrap-up Mode"
          iconLeft={<MaterialIcons name="schedule" size={18} color={colors.onPrimary} />}
          onPress={() => toggleWrapUp(false)}
        />
      ) : (
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
  );

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />

      <SrsStages
        stages={lastSrsUpdate}
        srsSystem={srsSystems?.[lastSrsUpdate?.srsSystemId]}
        enabled={showSrsIndicator}
      />

      <Page
        wide={layout.isWide}
        style={[
          styles.page,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={[styles.deckWrapper, { maxWidth: layout.isWide ? 1160 : 520 }]}>
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

          {loadingReviews ? (
            <Message loading style={styles.inlineLoading} />
          ) : (
            <>
              <StudyDeck
                studyDeck={studyDeck}
                subjectsDict={subjectsDict}
                studyMaterials={studyMaterials}
                token={token}
                preferredVoiceActorId={preferredVoiceActorId}
                speechModeLabel={activeSpeechMode.label}
                skipMode={skipMode}
                quickMode={quickMode}
                deckStyle={styles.deck}
                onOpenVoiceSettings={() => openMenu(true, 'voice')}
                layout={layout}
                cardSide={unfoldedCardSide}
                answerInputMode={answerInputMode}
                progressSlot={sessionProgressBox}
              />

              <UndoSnackbar
                visible={undoQueue.hasPending}
                label={undoQueue.pendingLabel || 'Review recorded'}
                onUndo={undoQueue.undo}
              />

              {isQueueClear ? (
                layout.isWide ? (
                  <AdaptivePaneLayout
                    layout={layout}
                    allowTabletop={false}
                    primary={(
                      <View style={styles.clearPane}>
                        {queueClearCard}
                        {queueClearControls}
                      </View>
                    )}
                    secondary={(!wrapUpMode || sessionProgressBox) ? (
                      <ScrollView
                        style={styles.clearScroll}
                        contentContainerStyle={styles.clearScrollContent}
                        showsVerticalScrollIndicator={false}
                      >
                        {!wrapUpMode && (
                          <ForecastCard forecast={forecast} loading={forecastLoading} />
                        )}
                        {sessionProgressBox}
                      </ScrollView>
                    ) : null}
                  />
                ) : (
                  <View style={styles.clearWrapper}>
                    {queueClearCard}
                    {!wrapUpMode && (
                      <ForecastCard forecast={forecast} loading={forecastLoading} />
                    )}
                    {sessionProgressBox}
                    {queueClearControls}
                  </View>
                )
              ) : (
                !useAdaptiveStudyLayout && sessionProgressBox
              )}
            </>
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
    flex: 1,
    maxWidth: 520,
    width: '100%',
    alignItems: 'center',
  },
  inlineLoading: {
    flex: 1,
    width: '100%',
    height: undefined,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: 'transparent',
  },
  clearWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  clearPane: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  clearScroll: {
    flex: 1,
    width: '100%',
  },
  clearScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 12,
  },
  deck: {
    width: '100%',
    flex: 1,
    maxHeight: 500,
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
  boxAdaptive: {
    marginTop: 0,
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
  metricsCol: {
    flexDirection: 'column',
    gap: 10,
  },
  progressCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  progressColStacked: {
    width: '100%',
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
