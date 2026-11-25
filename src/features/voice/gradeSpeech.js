import { normalizeReading, pronunciationOf, sameReading } from './pronunciation';
import { MEANING } from 'src/common/constants';

function englishWords(text) {
  return text.normalize('NFKC').toLowerCase().replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

const smallNumbers = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');

export function normalizeMeaning(text) {
  const words = englishWords(text).replace(/^(a|an|the)\s+/, '');
  const number = smallNumbers.indexOf(words);
  return number >= 0 ? String(number) : words;
}

function lowConfidence(result) {
  return result.confidence != null && result.confidence < 0.65;
}

function gradeCandidate({ reviewType, subject, synonyms }, result) {
  const text = result.text?.trim() || '';
  if (!text) return { kind: 'unclear', message: 'No final transcript received' };

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
    const spoken = pronunciationOf(text);
    if (!spoken) {
      return { kind: 'unclear', message: 'Couldn’t tell which reading you said' };
    }
    if (answers.some(a => a.accepted_answer && sameReading(normalizeReading(a.reading), spoken))) {
      return { kind: 'correct' };
    }
    // A dictionary reading can corroborate a match. Never charge a miss
    // solely on a pronunciation inferred from the recognizer's spelling.
    if (spoken !== normalized) return { kind: 'unclear', message: 'Couldn’t confirm the pronunciation' };
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

function gradeTranscript(card, result) {
  const primary = gradeCandidate(card, result);
  // A final English transcript that matches a known meaning is sufficient.
  // Keep the confidence gate for misses, commands, readings and alternatives.
  if (lowConfidence(result) && !(card.reviewType === MEANING && primary.kind === 'correct')) {
    return { kind: 'unclear', message: 'Dictation was uncertain' };
  }
  if (primary.kind === 'unclear' && card.reviewType !== MEANING &&
      /[一-龯々]/.test(result.text || '')) {
    const kana = (result.alternatives || []).filter(candidate =>
      !lowConfidence(candidate) &&
      /^[ぁ-ゖー]+$/.test(normalizeReading(candidate.text))
    );
    const supported = kana.find(candidate => candidate.confidence >= 0.65);
    if (supported && kana.every(candidate => gradeCandidate(card, candidate).kind === 'correct')) {
      return { kind: 'correct', transcript: supported.text };
    }
  }
  if (!['mismatch', 'unscored'].includes(primary.kind)) return primary;
  // A lower-ranked matching hypothesis is evidence of uncertainty. Re-listen
  // without revealing the solution or recording a mistake.
  const plausibleMatch = result.alternatives?.some(candidate =>
    !lowConfidence(candidate) && gradeCandidate(card, candidate).kind === 'correct'
  );
  return plausibleMatch ? { kind: 'unclear', message: 'Dictation suggested different words' } : primary;
}

export function gradeSpeech(card, result) {
  const primary = gradeTranscript(card, result);
  if (!result.secondOpinion) return primary;
  const other = gradeTranscript(card, result.secondOpinion);
  if (primary.kind === 'unclear' && other.kind === 'correct') {
    return { ...other, transcript: other.transcript || result.secondOpinion.text };
  }
  if (primary.kind === 'correct' && other.kind === 'unclear') return primary;
  if (primary.kind === other.kind && primary.normalized === other.normalized) return primary;
  if (primary.normalized && primary.normalized === other.normalized) return primary;
  return { kind: 'unclear', message: 'The recognizers heard different answers' };
}
