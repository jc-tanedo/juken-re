import _ from 'lodash';
import { pruneMistakes, MISTAKES_WINDOW_MS } from 'src/features/extraStudy/recentMistakes';

export function createPracticeAssignments(subjects = []) {
  return (subjects || []).filter(Boolean).map(subject => ({
    id: `practice-${subject.id}`,
    practice: true,
    data: {
      subject_id: subject.id,
      subject_type: subject.object,
      srs_stage: 1,
      spaced_repetition_system_id: subject.data?.spaced_repetition_system_id || 1,
    },
  }));
}

export function buildRecentMistakesDeck({
  mistakeEntries = [],
  reviewStatsBySubject = {},
  subjectsById = {},
  now = Date.now(),
  limit = 40,
} = {}) {
  const orderedIds = [];
  const seen = new Set();

  for (const entry of pruneMistakes(mistakeEntries, now)) {
    if (!seen.has(entry.subjectId)) {
      seen.add(entry.subjectId);
      orderedIds.push(entry.subjectId);
    }
  }

  const statMisses = Object.values(reviewStatsBySubject || {})
    .filter(stat => {
      const updatedMs = Date.parse(stat?.data_updated_at || '');
      const recent = !Number.isNaN(updatedMs) && (now - updatedMs <= MISTAKES_WINDOW_MS);
      const pct = stat?.data?.percentage_correct;
      return recent && typeof pct === 'number' && pct < 85 && !stat?.data?.hidden;
    })
    .sort((a, b) => Date.parse(b.data_updated_at) - Date.parse(a.data_updated_at));

  for (const stat of statMisses) {
    const id = stat?.data?.subject_id;
    if (id != null && !seen.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
  }

  return orderedIds.map(id => subjectsById[id]).filter(Boolean).slice(0, limit);
}

export function buildRecentLessonsDeck({
  assignments = [],
  subjectsById = {},
  limit = 30,
} = {}) {
  const started = (assignments || [])
    .filter(a => a?.data?.started_at && !a.data.burned_at && !a.data.hidden)
    .sort((a, b) => Date.parse(b.data.started_at) - Date.parse(a.data.started_at));

  const seen = new Set();
  const subjects = [];
  for (const assignment of started) {
    const id = assignment?.data?.subject_id;
    if (id == null || seen.has(id) || !subjectsById[id]) continue;
    seen.add(id);
    subjects.push(subjectsById[id]);
    if (subjects.length >= limit) break;
  }
  return subjects;
}

export function buildCriticalItemsDeck({
  reviewStatsBySubject = {},
  subjectsById = {},
  threshold = 75,
  limit = 40,
} = {}) {
  const critical = Object.values(reviewStatsBySubject || {})
    .filter(stat => (
      !stat?.data?.hidden &&
      typeof stat?.data?.percentage_correct === 'number' &&
      stat.data.percentage_correct < threshold
    ))
    .sort((a, b) => a.data.percentage_correct - b.data.percentage_correct);

  return critical
    .map(stat => subjectsById[stat.data.subject_id])
    .filter(Boolean)
    .slice(0, limit);
}

export function buildBurnedItemsDeck({
  assignments = [],
  subjectsById = {},
  limit = 40,
} = {}) {
  const burnedIds = _.uniq(
    (assignments || [])
      .filter(a => a?.data?.burned_at && !a.data.hidden)
      .map(a => a.data.subject_id)
      .filter(Boolean),
  );
  return _.shuffle(burnedIds)
    .map(id => subjectsById[id])
    .filter(Boolean)
    .slice(0, limit);
}
