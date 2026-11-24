// Offer a mixed session vocabulary to the local recognizer. Supplying just
// the current solution could make a wrong answer sound correct.
export function reviewVocabulary(subjects, readings) {
  const terms = new Set();
  let contributingSubjects = 0;
  for (const subject of subjects || []) {
    const entries = readings ? subject.data?.readings : subject.data?.meanings;
    const before = terms.size;
    for (const entry of entries || []) {
      const text = readings ? entry.reading : entry.meaning;
      if (entry.accepted_answer && text) terms.add(text);
      if (terms.size === 64) break;
    }
    if (terms.size > before) contributingSubjects++;
    if (terms.size === 64) break;
  }
  return contributingSubjects >= 2 ? Array.from(terms) : [];
}
