export const RETRY_BATCH_SIZE = 5;
export const GET = 'GET';
export const POST = 'POST';
export const PUT = 'PUT';
export const DELETE = 'DELETE';
export const KANJI = 'kanji';
export const RADICAL = 'radical';
export const VOCAB = 'vocabulary';
export const KANA_VOCAB = 'kana_vocabulary';
export const MEANING = 'meaning';
export const READING = 'reading';
export const APPRENTICE = 'apprentice';
export const GURU = 'guru';
export const MASTER = 'master';
export const ENLIGHTENED = 'enlightened';
export const BURNED = 'burned';

export const DEMO_TOKEN = 'DEMO_TOKEN';
export const SKIP_MODE = 'SKIP_MODE';
export const SPEECH_MODE = 'SPEECH_MODE';
export const QUICK_MODE = 'QUICK_MODE';
export const DARK_MODE = 'DARK_MODE';
export const BACK_TO_BACK_MODE = 'BACK_TO_BACK_MODE';
export const MEANING_FIRST = 'MEANING_FIRST';
export const AUTOPLAY_AUDIO = 'AUTOPLAY_AUDIO';

// review orders
export const REVIEW_ORDER = 'REVIEW_ORDER';
export const RANDOM_ORDER = 'RANDOM_ORDER';
export const LOWEST_LEVEL_FIRST = 'LOWEST_LEVEL_FIRST';
export const CURRENT_LEVEL_FIRST = 'CURRENT_LEVEL_FIRST';
export const ASCENDING_SRS_STAGE = 'ASCENDING_SRS_STAGE';
export const DESCENDING_SRS_STAGE = 'DESCENDING_SRS_STAGE';

export const READING_TYPE_LABELS = {
  onyomi: "On'yomi",
  kunyomi: "Kun'yomi",
  nanori: 'Nanori',
};

export const isMeaningOnlySubject = subjectType => (
  subjectType === RADICAL || subjectType === KANA_VOCAB
);

export const TERMINOLOGY = {
  // subject types
  [KANJI]: 'Kanji',
  [RADICAL]: 'Radical',
  [VOCAB]: 'Vocabulary',
  [KANA_VOCAB]: 'Kana Vocabulary',

  // review types
  [MEANING]: 'Meaning',
  [READING]: 'Reading',

  // srs stages
  [APPRENTICE]: 'Apprentice',
  [GURU]: 'Guru',
  [MASTER]: 'Master',
  [ENLIGHTENED]: 'Enlightened',
  [BURNED]: 'Burned',
};
