import {
  MEANING,
  READING,
  isMeaningOnlySubject,
} from 'src/common/constants';

// Return meaning or reading of a review randomly (radicals and kana-only vocab are meaning-only)
export default (subjectType, prevReviewType) => {
  let shouldKeep = null;
  let reviewType = null;

  if (isMeaningOnlySubject(subjectType)) {
    shouldKeep = false;
    reviewType = MEANING;
  } else if (prevReviewType) {
    shouldKeep = false;
    reviewType = prevReviewType === MEANING
      ? READING
      : MEANING;
  } else {
    shouldKeep = true;
    reviewType = (2 * Math.random() << 0) === 0
      ? MEANING
      : READING;
  }

  return [
    shouldKeep,
    reviewType,
  ];
};
