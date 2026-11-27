import _ from 'lodash';

export const WRAP_UP_TEN_ITEMS = 'ten_items';
export const WRAP_UP_UNFINISHED = 'unfinished';

/**
 * Selects which review IDs remain active under Wrap-Up mode:
 * - `'unfinished'`: only items with a half-completed meaning/reading pair
 * - `'ten_items'` (default): unfinished pairs topped up to `cap` items in queue order
 */
export function selectWrapUpReviewIds(
  queue = [],
  unfinishedReviews = {},
  mode = WRAP_UP_TEN_ITEMS,
  cap = 10,
) {
  const presentIds = new Set(
    queue.map(item => _.get(item, 'review.id')).filter(id => id != null),
  );
  const selected = new Set();

  for (const rawId of Object.keys(unfinishedReviews || {})) {
    if (!unfinishedReviews[rawId]) continue;
    const matchItem = queue.find(item => String(_.get(item, 'review.id')) === String(rawId));
    if (matchItem) selected.add(matchItem.review.id);
  }

  if (mode === WRAP_UP_UNFINISHED) {
    return selected;
  }

  for (const item of queue) {
    if (selected.size >= cap) break;
    const reviewId = _.get(item, 'review.id');
    if (reviewId != null && presentIds.has(reviewId)) {
      selected.add(reviewId);
    }
  }

  return selected;
}
