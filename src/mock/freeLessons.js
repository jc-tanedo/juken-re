import { KANA_VOCAB, KANJI, RADICAL, VOCAB } from 'src/common/constants';

export const lessonSubjects = [
  {
    id: 8801,
    object: RADICAL,
    data: {
      level: 1,
      slug: 'ground',
      characters: '一',
      meanings: [{ meaning: 'Ground', primary: true, accepted_answer: true }],
      meaning_mnemonic: 'This radical consists of a single horizontal stroke just like the flat <radical>ground</radical>.',
      lesson_position: 1,
    },
  },
  {
    id: 8802,
    object: RADICAL,
    data: {
      level: 1,
      slug: 'fins',
      characters: 'ハ',
      meanings: [{ meaning: 'Fins', primary: true, accepted_answer: true }],
      meaning_mnemonic: 'Two angled strokes look just like a pair of <radical>fins</radical> sticking out of the water.',
      lesson_position: 2,
    },
  },
  {
    id: 440,
    object: KANJI,
    data: {
      level: 1,
      slug: '一',
      characters: '一',
      meanings: [{ meaning: 'One', primary: true, accepted_answer: true }],
      readings: [
        { type: 'onyomi', primary: true, reading: 'いち', accepted_answer: true },
        { type: 'kunyomi', primary: false, reading: 'ひと', accepted_answer: false },
      ],
      component_subject_ids: [8801],
      meaning_mnemonic: 'One <radical>ground</radical> line is simply the number <kanji>one</kanji>.',
      meaning_hint: 'Count the single horizontal bar.',
      reading_mnemonic: 'Imagine an <reading>itchy</reading> (<ja>いち</ja>) mosquito bite as <kanji>one</kanji> annoying bump.',
      lesson_position: 10,
    },
  },
  {
    id: 441,
    object: KANJI,
    data: {
      level: 1,
      slug: '二',
      characters: '二',
      meanings: [{ meaning: 'Two', primary: true, accepted_answer: true }],
      readings: [
        { type: 'onyomi', primary: true, reading: 'に', accepted_answer: true },
        { type: 'kunyomi', primary: false, reading: 'ふた', accepted_answer: false },
      ],
      component_subject_ids: [8801],
      meaning_mnemonic: 'Stack two lines above the <radical>ground</radical> to get <kanji>two</kanji>.',
      reading_mnemonic: 'You have <kanji>two</kanji> <reading>knee</reading>s (<ja>に</ja>).',
      lesson_position: 11,
    },
  },
  {
    id: 2475,
    object: VOCAB,
    data: {
      level: 1,
      slug: '一人',
      characters: '一人',
      meanings: [
        { meaning: 'Alone', primary: true, accepted_answer: true },
        { meaning: 'One Person', primary: false, accepted_answer: true },
      ],
      readings: [{ reading: 'ひとり', primary: true, accepted_answer: true }],
      parts_of_speech: ['noun', 'adverb'],
      component_subject_ids: [440, 444],
      meaning_mnemonic: '<kanji>One</kanji> <kanji>person</kanji> standing by themselves is <vocabulary>alone</vocabulary>.',
      reading_mnemonic: 'Remember the exceptional reading <ja>ひとり</ja> — hitting the trail all alone.',
      context_sentences: [
        { en: 'I live alone.', ja: '一人で住んでいます。' },
      ],
      pronunciation_audios: [],
      lesson_position: 40,
    },
  },
  {
    id: 9211,
    object: KANA_VOCAB,
    data: {
      level: 4,
      slug: 'おにぎり',
      characters: 'おにぎり',
      meanings: [
        { meaning: 'Onigiri', primary: true, accepted_answer: true },
        { meaning: 'Rice Ball', primary: true, accepted_answer: true },
      ],
      parts_of_speech: ['noun'],
      meaning_mnemonic: 'Gently squeezing warm rice in your hands (<ja>にぎる</ja>) makes an <vocabulary>onigiri</vocabulary> <vocabulary>rice ball</vocabulary>.',
      meaning_hint: 'Kana-only vocabulary tests meaning right after study.',
      context_sentences: [
        { en: 'I bought a salmon rice ball.', ja: 'さけのおにぎりを買いました。' },
      ],
      pronunciation_audios: [],
      lesson_position: 91,
    },
  },
];

export const lessonAssignments = lessonSubjects.map((subject, idx) => ({
  id: 5001 + idx,
  data: {
    subject_id: subject.id,
    subject_type: subject.object,
    srs_stage: 0,
    started_at: null,
    spaced_repetition_system_id: 1,
  },
}));
