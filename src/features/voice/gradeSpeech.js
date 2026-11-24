import { MEANING } from 'src/common/constants';

function englishWords(text) {
  return text.normalize('NFKC').toLowerCase().replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function normalizeMeaning(text) {
  return englishWords(text).replace(/^(a|an|the)\s+/, '');
}

export function normalizeReading(text) {
  return text.normalize('NFKC').replace(/[\s。、！？!?.,]/g, '')
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function gradeSpeech({ reviewType, subject, synonyms }, result) {
  const text = result.text?.trim() || '';
  if (!text || (result.confidence != null && result.confidence < 0.65)) {
    return { kind: 'unclear', message: 'Couldn’t hear that clearly' };
  }

  const meaning = reviewType === MEANING;
  const normalized = meaning ? normalizeMeaning(text) : normalizeReading(text);
  if (!normalized) return { kind: 'unclear', message: 'Couldn’t hear an answer' };
  const pass = meaning ? englishWords(text) === 'juken pass' : ['じゅけんぱす', '受験ぱす'].includes(normalized);
  if (pass) return { kind: 'pass' };

  const data = subject?.data;
  const answers = meaning ? data?.meanings : data?.readings;
  if (!answers?.some(item => item.accepted_answer)) {
    return { kind: 'manual', message: 'No answer available for voice grading' };
  }

  if (!meaning) {
    if (!/^[ぁ-ゖー]+$/.test(normalized)) {
      return { kind: 'unclear', message: 'Couldn’t tell which reading you said' };
    }
    if (answers.some(a => a.accepted_answer && normalizeReading(a.reading) === normalized)) {
      return { kind: 'correct' };
    }
  } else {
    const auxiliary = data.auxiliary_meanings || [];
    const listed = type => auxiliary.some(a => a.type === type && normalizeMeaning(a.meaning) === normalized);
    if (!listed('blacklist')) {
      const allowed = answers.some(a => a.accepted_answer && normalizeMeaning(a.meaning) === normalized);
      if (allowed || listed('whitelist') || synonyms?.some(s => normalizeMeaning(s) === normalized)) {
        return { kind: 'correct' };
      }
      if (synonyms == null) return { kind: 'manual', message: 'Personal synonyms unavailable' };
    }
  }
  return { kind: result.confidence == null ? 'unscored' : 'mismatch', normalized };
}
