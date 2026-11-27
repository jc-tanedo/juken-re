/**
 * https://github.com/oguzgelal/juken/issues/8
 *
 * Adjust distances between subject pairs items to
 * make sure that they are not too far apart.
 * Also used to implement back-to-back and priority sorting.
 */

import _ from 'lodash';
import {
  MEANING,
  RANDOM_ORDER,
  LOWEST_LEVEL_FIRST,
  CURRENT_LEVEL_FIRST,
  ASCENDING_SRS_STAGE,
  DESCENDING_SRS_STAGE,
  APPRENTICE_FIRST,
  LEECH_FIRST,
  isMeaningOnlySubject,
} from 'src/common/constants';

const ALLOWED_MAX_DISTANCE = 10;
const ALLOWED_MIN_DISTANCE = 3;

function passingStageFor(item, srsDict) {
  const sysId = _.get(item, 'review.data.spaced_repetition_system_id') || 1;
  return _.get(srsDict, [sysId, 'data', 'passing_stage_position']) ?? 5;
}

function accuracyFor(item, reviewStatsDict) {
  const subjectId = _.get(item, 'review.data.subject_id');
  const accuracy = _.get(reviewStatsDict, [subjectId, 'data', 'percentage_correct']);
  return typeof accuracy === 'number' ? accuracy : 100;
}

export default (
  queue,
  backToBackMode = false,
  meaningFirst = false,
  reviewOrder = RANDOM_ORDER,
  options = {},
) => {
  const { reviewStatsDict = {}, srsDict = {} } = options || {};
  let newQueue = (queue || []).slice();
  let currentIndex = 0;

  switch (reviewOrder) {
    case RANDOM_ORDER:
      newQueue = _.shuffle(newQueue);
      break;
    case LOWEST_LEVEL_FIRST:
      newQueue = _.orderBy(newQueue, ['subjectLevel', 'review.data.srs_stage'], ['asc', 'asc']);
      break;
    case CURRENT_LEVEL_FIRST:
      newQueue = _.orderBy(newQueue, ['subjectLevel', 'review.data.srs_stage'], ['desc', 'asc']);
      break;
    case ASCENDING_SRS_STAGE:
      newQueue = _.orderBy(newQueue, ['review.data.srs_stage', 'subjectLevel'], ['asc', 'asc']);
      break;
    case DESCENDING_SRS_STAGE:
      newQueue = _.orderBy(newQueue, ['review.data.srs_stage', 'subjectLevel'], ['desc', 'asc']);
      break;
    case APPRENTICE_FIRST:
      newQueue = _.orderBy(
        newQueue,
        [
          item => ((_.get(item, 'review.data.srs_stage') ?? 0) < passingStageFor(item, srsDict) ? 0 : 1),
          item => _.get(item, 'review.data.srs_stage') ?? 0,
          'subjectLevel',
        ],
        ['asc', 'asc', 'asc'],
      );
      break;
    case LEECH_FIRST:
      newQueue = _.orderBy(
        newQueue,
        [
          item => accuracyFor(item, reviewStatsDict),
          item => _.get(item, 'review.data.srs_stage') ?? 0,
          'subjectLevel',
        ],
        ['asc', 'asc', 'asc'],
      );
      break;
  }

  // Avoid recursion to prevent exceeding maximum call stack size
  while (currentIndex < newQueue.length - 1) {
    const currentItem = newQueue[currentIndex];
    const currentReviewId = _.get(currentItem, 'review.id');
    const currentSubjectType = _.get(currentItem, 'review.data.subject_type');

    // Skip meaning-only subjects (radicals and kana-only vocabulary)
    if (isMeaningOnlySubject(currentSubjectType)) {
      currentIndex += 1;
      continue;
    }

    let pairIndex = newQueue.slice(currentIndex + 1).findIndex(item => (
      _.get(item, 'review.id') === currentReviewId
    ));

    if (pairIndex === -1) {
      currentIndex += 1;
      continue;
    }

    pairIndex += currentIndex + 1;

    const randomDistance = _.random(ALLOWED_MIN_DISTANCE, ALLOWED_MAX_DISTANCE);
    const backToBackDistance = ((currentItem.reviewType === MEANING) === meaningFirst) ? 1 : 0;
    const pairDistance = backToBackMode ? backToBackDistance : randomDistance;

    const tmp = newQueue.splice(pairIndex, 1)[0];
    newQueue.splice(currentIndex + pairDistance, 0, tmp);

    currentIndex += 1;
  }

  return newQueue;
};
