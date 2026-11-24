import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { StatusBar, StyleSheet, View, Text } from 'react-native';
import { useStoreActions, useStoreState } from 'easy-peasy';
import { SimpleLineIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import Page from 'src/components/Page/Page';
import Bar from 'src/components/Bar/Bar';
import Card from 'src/components/Card/Card';
import Deck from 'src/components/Deck/Deck';
import Overlay from 'src/components/Overlay/Overlay';
import SrsStages from 'src/components/Toast/SrsStages';
import useColorScheme from 'src/hooks/useColorScheme';
// import Toast, { TYPES } from 'src/components/Toast/Toast';
import Message from 'src/screens/Message/Message';
import useLoadReviews from 'src/features/reviews/useLoadReviews';
import useReviewSession from 'src/features/reviews/useReviewSession';
import useScrollLock from 'src/hooks/useScrollLock';
import useLeaveWarning from 'src/hooks/useLeaveWarning';
import Button from 'src/components/Button/Button';
import extractSubject from 'src/utils/extractSubject';
import ReviewTopBar from 'src/screens/Review/ReviewTopBar';
import ReviewMenu from 'src/screens/Review/ReviewMenu';
import SubjectDetailsModal from 'src/screens/SubjectDetails/SubjectDetailsModal';
import { SKIP_MODE, QUICK_MODE } from 'src/common/constants';

const Review = ({ demo = false, stopDemo } = {}) => {
  const [ srsStages, setSrsStages ] = useState({});
  const [ menuOpen, setMenuOpen ] = useState(false);

  // only ask unfinished reviews
  const [ wrapUpMode, setWrapUpMode ] = useState(false);

  const logout = useStoreActions(actions => actions.session.logout);
  const submitReview = useStoreActions(actions => actions.reviews.submitReview);
  const retrySubmission = useStoreActions(actions => actions.reviews.retrySubmission);
  const ignoreSubmissionErrors = useStoreActions(actions => actions.reviews.ignoreSubmissionErrors);
  const submissionQueue = useStoreState(state => state.reviews.submissionQueue);
  const submissionErrors = useStoreState(state => state.reviews.submissionErrors);
  const userSettings = useStoreState(state => state.session.userSettings);

  // Allow answering without revealing
  const skipMode = _.get(userSettings, SKIP_MODE);
  
  // Tap anywhere on the card to reveal
  const quickMode = _.get(userSettings, QUICK_MODE);
  
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];

  useScrollLock();
  useLeaveWarning();

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
    subjectsDict,
    totalCards,
    totalReviews,
    stats,
    unfinishedReviews,
  } = useReviewSession(
    reviews,
    subjects,
  );

  // TODO: refactor
  const queueFiltered = useMemo(() => (
    // wrap up mode filter
    queue.filter(i => wrapUpMode
      ? !_.isNil(_.get(unfinishedReviews, i.review.id))
      : true
    )
  ), [
    queue,
    wrapUpMode,
  ])

  // are all queue items asked
  const isQueueClear = !loadingReviews && queueFiltered.length === 0;

  return (
    <>
    <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

    {/** subject details modal 
      <SubjectDetailsModal
        visible={true}
        close={() => {}}
      />
    */}

    {/** display srs stages toasts */}
    <SrsStages stages={srsStages} />

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
          logout={logout}
          stopDemo={stopDemo}
          submissionQueue={submissionQueue}
          submissionErrors={submissionErrors}
          ignoreSubmissionErrors={ignoreSubmissionErrors}
          retrySubmission={retrySubmission}
          setMenuOpen={setMenuOpen}
        />

        {/** menu */}
        <ReviewMenu
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          demo={demo}
          logout={logout}
          stopDemo={stopDemo}
          loadReviews={loadReviews}
          wrapUpMode={wrapUpMode}
          setWrapUpMode={setWrapUpMode}
        />

        {/* render deck */}
        {queueFiltered.length > 0 && (
          <Deck
            style={styles.deck}
            cards={queueFiltered}
            allowSkipping={skipMode}
            dismissCard={direction => {
              submitAnswer(
                // item that was submitted: the top item
                // of the processed queue list
                queueFiltered[0],
                // right direction means correct answer
                direction === 'right',
                // callback for when the submit answer causes
                // the review to be completed
                res => {

                  const {
                    review,
                    incorrectMeanings,
                    incorrectReadings,
                  } = res;

                  // review was correct when there are
                  // no incorrect readings or meanings
                  const isCorrect = (
                    !incorrectMeanings &&
                    !incorrectReadings
                  );

                  // increase srs stage if the answer was correct
                  if (isCorrect) {
                    const currentStage = _.get(review, 'data.srs_stage');
                    setSrsStages({ current: currentStage, next: currentStage + 1 })
                  }

                  // submit review
                  submitReview({
                    demo,
                    subjectId: _.get(review, 'data.subject_id'),
                    reviewId: review.id,
                    incorrectMeanings,
                    incorrectReadings,
                  });
                }
              );
            }}
            renderCard={(item, props) => {

              // empty cards
              if (!item) return <Card empty />

              const { id, review, reviewType } = item;
              const subjectId = _.get(review, 'data.subject_id');
              const subject = _.get(subjectsDict, subjectId);
              const subjectType = _.get(subject, 'object');
              const meaningMnemonic = _.get(subject, 'data.meaning_mnemonic');
              const readingMnemonic = _.get(subject, 'data.reading_mnemonic');
              const {
                question,
                questionComponent,
                answer,
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
                  meaningMnemonic={meaningMnemonic}
                  readingMnemonic={readingMnemonic}
                  quickMode={quickMode}
                />
              )
            }}
          />
        )}

        {/* no reviews notice */}
        {isQueueClear && (
          <View style={[styles.noReviewsContainer, { backgroundColor: colors.successContainer }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.surfaceBright }]}>
              <AntDesign name="check" size={30} color={colors.success} />
            </View>
            <Text accessibilityRole="header" style={[theme.type.headline, { color: colors.onSuccessContainer }]}>
              {wrapUpMode ? 'Wrap-up queue clear!' : 'Review queue clear!'}
            </Text>
            {wrapUpMode && (
              <Text style={[theme.type.body, { color: colors.onSuccessContainer }]}>
                You can now end your review session.
              </Text>
            )}
          </View>
        )}

        {/* stats */}
        {totalReviews > 0 && (
          <View style={[styles.box, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[theme.type.title, { color: colors.onSurface }]}>Session progress</Text>
            {[
              { key: 'reviews', label: 'Reviews', total: totalReviews },
              { key: 'cards', label: 'Cards', total: totalCards },
            ].map(({ key, label, total }) => {
              const { completed = 0, incorrectPercent = 0, correctPercent = 0 } = stats?.[key] ?? {};
              const unfinished = key === 'reviews' ? stats?.reviews?.unfinished : 0;
              return (
                <View key={key} style={styles.progressRow}>
                  <View style={styles.progressLabel}>
                    <Text style={[theme.type.label, { color: colors.onSurface }]}>{label}</Text>
                    <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>
                      {completed} of {total}{unfinished > 0 ? ` · ${unfinished} unfinished` : ''}
                    </Text>
                  </View>
                  <Bar
                    style={{ backgroundColor: colors.outlineVariant }}
                    values={[incorrectPercent, correctPercent]}
                    colors={[colors.error, colors.success]}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* controls */}
        {isQueueClear && (
          <>
            <View style={{ height: 6 }} />
            {wrapUpMode && (
              <Button
                text="Disable Wrap-up Mode"
                style={{ marginTop: 8 }}
                iconLeft={<SimpleLineIcons name="clock" size={18} color={colors.onSecondaryContainer} />}
                onPress={() => setWrapUpMode(false)}
              />
            )}
            {!wrapUpMode && (
              <Button
                text="Refresh"
                style={{ marginTop: 8 }}
                iconLeft={<SimpleLineIcons name="refresh" size={18} color={colors.onSecondaryContainer} />}
                onPress={() => loadReviews()}
              />
            )}
            <Button
              text="Logout"
              variant="text"
              style={{ marginTop: 8 }}
              onPress={() => {
                if (demo) stopDemo()
                else logout();
              }}
            />
          </>
        )}
      </View>
    </Page>
  </>
)};

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
    padding: 22,
    gap: 8,
    borderRadius: theme.radius.card,
    marginBottom: 12,
  },
  successIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 12,
    padding: 16,
    gap: 8,
    borderRadius: 24,
  },
  progressRow: { gap: 4 },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  count: { flexShrink: 1, textAlign: 'right', fontSize: 13, lineHeight: 20 },
});

export default Review;
