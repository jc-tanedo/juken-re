import React from 'react';
import _ from 'lodash';
import {
  KANJI,
  MEANING,
  RADICAL,
  READING_TYPE_LABELS,
  TERMINOLOGY,
} from 'src/common/constants';
import Radical from 'src/components/Radical/Radical';

export default (subject, reviewType) => {
  const subjectType = _.get(subject, 'object');
  const characters = _.get(subject, 'data.characters');
  const meanings = _.get(subject, 'data.meanings') || [];
  const readings = _.get(subject, 'data.readings') || [];

  const meaningAccepted = meanings.filter(m => m.accepted_answer).map(m => m.meaning).join(', ');
  const meaningOther = meanings.filter(m => !m.accepted_answer).map(m => m.meaning).join(', ');
  const readingAccepted = readings.filter(m => m.accepted_answer).map(m => m.reading).join(', ');
  const readingOther = readings.filter(m => !m.accepted_answer).map(m => m.reading).join(', ');

  const acceptedTypes = _.uniq(
    readings.filter(r => r.accepted_answer && r.type).map(r => r.type),
  );
  const readingType = subjectType === KANJI && acceptedTypes.length === 1
    ? acceptedTypes[0]
    : null;
  const readingTypeLabel = readingType ? (READING_TYPE_LABELS[readingType] || readingType) : null;

  const question = characters;
  const answer = !reviewType ? null : (
    reviewType === MEANING
      ? meaningAccepted
      : readingAccepted
  );

  const questionComponent = subjectType === RADICAL && !characters
    ? <Radical subject={subject} />
    : null;

  return {
    type: TERMINOLOGY[reviewType],
    characters,
    meaningAccepted,
    meaningOther,
    readingAccepted,
    readingOther,
    readingType,
    readingTypeLabel,
    question,
    questionComponent,
    answer,
  };
};
