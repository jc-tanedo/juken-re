import _ from 'lodash';
import { action, thunk, thunkOn } from 'easy-peasy';
import { GET, POST, RETRY_BATCH_SIZE } from 'src/common/constants';
import { request, collection } from 'src/features/wk/request';
import wkCache from 'src/features/wk/cache';
import { DEFAULT_SRS_SYSTEM, estimateNextStage } from 'src/utils/checkSrsStage';
import sleep from 'src/utils/sleep';
import freeAssignments from 'src/mock/freeAssignments';
import freeSubjects from 'src/mock/freeSubjects';

// reviewSubmission:
// {
//   demo,
//   reviewId,
//   subjectId,
//   srsStage,
//   srsSystemId,
//   incorrectMeanings,
//   incorrectReadings,
//   createdAt,
// }

export const reviews = {
  assignments: [],
  subjects: [],
  srsSystems: {},
  reviewStats: {},
  lastSrsUpdate: null,
  submissionQueue: [],
  submissionErrors: [],

  /** actions */

  _saveReviews: action((state, { assignments, subjects, srsSystems = {}, reviewStats = {} }) => {
    state.assignments = assignments;
    state.subjects = subjects;
    state.srsSystems = srsSystems;
    state.reviewStats = reviewStats;
    state.lastSrsUpdate = null;
    state.submissionQueue = [];
    state.submissionErrors = [];
  }),

  _recordSrsUpdate: action((state, update) => {
    state.lastSrsUpdate = update;
  }),

  _upsertReviewStat: action((state, stat) => {
    const subjectId = stat?.data?.subject_id;
    if (subjectId != null) {
      state.reviewStats[subjectId] = stat;
    }
  }),

  // Add review to the submission queue
  _addToSubmissionQueue: action((state, reviewSubmission) => {
    state.submissionQueue.unshift(reviewSubmission);
  }),

  // Remove review from submission queue
  _removeFromSubmissionQueue: action((state, reviewSubmission) => {
    const { reviewId } = reviewSubmission;
    const ind = state.submissionQueue.map(s => s.reviewId).indexOf(reviewId);
    if (ind !== -1) state.submissionQueue.splice(ind, 1);
  }),

  // Add review to errors
  _addToSubmissionErrors: action((state, reviewSubmission) => {
    const { reviewId } = reviewSubmission;
    const ind = state.submissionErrors.map(s => s.reviewId).indexOf(reviewId);
    if (ind === -1) state.submissionErrors.push(reviewSubmission);
  }),

  // Remove review from errors
  _removeFromSubmissionErrors: action((state, reviewSubmission) => {
    const { reviewId } = reviewSubmission;
    const ind = state.submissionErrors.map(s => s.reviewId).indexOf(reviewId);
    if (ind !== -1) state.submissionErrors.splice(ind, 1);
  }),

  // Ignore everything in the submit queue + the errors
  ignoreSubmissionErrors: action(state => {
    state.submissionQueue = [];
    state.submissionErrors = [];
  }),

  /** thunks */

  // Queue a completed review for submission, stamping createdAt once so retries preserve review time
  submitReview: thunk((actions, reviewSubmission) => {
    actions._addToSubmissionQueue({
      ...reviewSubmission,
      createdAt: reviewSubmission.createdAt || new Date().toISOString(),
    });
  }),

  // Success! remove from submission queue / errors list
  _submitSuccess: thunk((actions, reviewSubmission) => {
    actions._removeFromSubmissionQueue(reviewSubmission);
    actions._removeFromSubmissionErrors(reviewSubmission);
  }),

  // Error! add submission to errors list
  _submitFail: thunk((actions, reviewSubmission) => {
    actions._addToSubmissionErrors(reviewSubmission);
  }),

  // Retry submissions that errored in small batches
  retrySubmission: thunk(async (actions, { items } = {}, { getState }) => {
    const state = getState();
    const currentErrors = items || state.submissionErrors;
    const retry = currentErrors.slice(0, RETRY_BATCH_SIZE);
    const retryNext = currentErrors.slice(RETRY_BATCH_SIZE);

    await Promise.all(retry.map(reviewSubmission => (
      new Promise(resolve => {
        actions._submitReview({
          reviewSubmission,
          callback: resolve,
        });
      })
    )));

    if (retryNext.length > 0) {
      actions.retrySubmission({ items: retryNext });
    }
  }),

  // Submit a completed review to WaniKani
  _submitReview: thunk(async (actions, { reviewSubmission, callback }, { getState }) => {
    try {
      const {
        demo,
        reviewId,
        subjectId,
        srsStage,
        srsSystemId = 1,
        incorrectMeanings,
        incorrectReadings,
        createdAt,
      } = reviewSubmission;

      if (demo) {
        await sleep(1000);
        const totalIncorrect = (incorrectMeanings || 0) + (incorrectReadings || 0);
        if (srsStage != null) {
          const system = getState().srsSystems?.[srsSystemId] || DEFAULT_SRS_SYSTEM;
          const next = estimateNextStage(srsStage, totalIncorrect, system);
          actions._recordSrsUpdate({
            reviewId,
            subjectId,
            current: srsStage,
            next,
            srsSystemId,
            timestamp: Date.now(),
          });
        }
        actions._submitSuccess(reviewSubmission);
        if (typeof callback === 'function') callback();
        return;
      }

      const res = await request({
        endpoint: 'reviews',
        method: POST,
        body: {
          review: {
            assignment_id: reviewId,
            incorrect_meaning_answers: incorrectMeanings || 0,
            incorrect_reading_answers: incorrectReadings || 0,
            ...(createdAt ? { created_at: createdAt } : {}),
          },
        },
      });

      const updatedAssignment = _.get(res, 'resources_updated.assignment');
      const hasError = _.get(updatedAssignment, 'id') !== reviewId;

      if (hasError) {
        actions._submitFail(reviewSubmission);
      } else {
        const nextStage = _.get(updatedAssignment, 'data.srs_stage');
        const resolvedSystemId = _.get(updatedAssignment, 'data.spaced_repetition_system_id') || srsSystemId;
        if (srsStage != null && nextStage != null) {
          actions._recordSrsUpdate({
            reviewId,
            subjectId,
            current: srsStage,
            next: nextStage,
            srsSystemId: resolvedSystemId,
            timestamp: Date.now(),
          });
        }
        const updatedStat = _.get(res, 'resources_updated.review_statistic');
        if (updatedStat?.data?.subject_id != null) {
          actions._upsertReviewStat(updatedStat);
        }
        actions._submitSuccess(reviewSubmission);
      }
    } catch {
      actions._submitFail(reviewSubmission);
    }

    if (typeof callback === 'function') {
      callback();
    }
  }),

  // Trigger submit review when a review is added to the submission queue
  _submitReviewFromQueue: thunkOn(
    actions => actions._addToSubmissionQueue,
    async (actions, _, { getState }) => {
      const state = getState();
      const reviewSubmission = state.submissionQueue[0];
      if (!reviewSubmission) return;
      actions._submitReview({ reviewSubmission });
    },
  ),

  // Load immediately available reviews with incremental subject + SRS caching
  loadAvailable: thunk(async (action, { demo, onEmpty }, { getStoreState }) => {
    if (demo) {
      await sleep(200);
      action._saveReviews({
        assignments: freeAssignments.slice(),
        subjects: freeSubjects.slice(),
        srsSystems: { 1: DEFAULT_SRS_SYSTEM },
        reviewStats: {},
      });
      return;
    }

    try {
      const token = getStoreState()?.session?.token;
      const assignments = await collection({
        endpoint: 'assignments',
        method: GET,
        apiKey: token,
        params: {
          immediately_available_for_review: true,
        },
      });

      if (!assignments || assignments.length === 0) {
        onEmpty();
        return;
      }

      const subjectIds = _.uniq(
        assignments.map(r => _.get(r, 'data.subject_id')).filter(Boolean),
      );

      const [srsSystems, subjectsById, reviewStats] = await Promise.all([
        wkCache.syncSrsSystems(token).catch(() => ({ 1: DEFAULT_SRS_SYSTEM })),
        wkCache.syncSubjects(token, subjectIds),
        wkCache.syncReviewStatistics(token).catch(() => ({})),
      ]);

      const subjects = subjectIds.map(id => subjectsById[id]).filter(Boolean);
      const validAssignments = assignments.filter(a => Boolean(subjectsById[_.get(a, 'data.subject_id')]));

      if (validAssignments.length === 0) {
        onEmpty();
        return;
      }

      action._saveReviews({
        assignments: validAssignments,
        subjects,
        srsSystems,
        reviewStats,
      });
    } catch {
      onEmpty();
    }
  }),
};
