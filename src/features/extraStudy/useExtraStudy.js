import { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
import { GET } from 'src/common/constants';
import { collection } from 'src/features/wk/request';
import wkCache from 'src/features/wk/cache';
import listToDict from 'src/utils/listToDict';
import { getRecentMistakes } from 'src/features/extraStudy/recentMistakes';
import {
  buildBurnedItemsDeck,
  buildCriticalItemsDeck,
  buildRecentLessonsDeck,
  buildRecentMistakesDeck,
} from 'src/features/extraStudy/decks';
import freeSubjects from 'src/mock/freeSubjects';
import freeAssignments from 'src/mock/freeAssignments';

function demoDecks(recordedMistakes = []) {
  const byId = listToDict(freeSubjects);
  const now = Date.now();
  const sampleStats = {
    444: { data_updated_at: new Date(now).toISOString(), data: { subject_id: 444, percentage_correct: 62 } },
    2502: { data_updated_at: new Date(now).toISOString(), data: { subject_id: 2502, percentage_correct: 68 } },
    9210: { data_updated_at: new Date(now).toISOString(), data: { subject_id: 9210, percentage_correct: 71 } },
  };
  const recentAssignments = freeAssignments.slice(0, 6).map((a, idx) => ({
    ...a,
    data: {
      ...a.data,
      started_at: new Date(now - idx * 3_600_000).toISOString(),
    },
  }));
  const burnedAssignments = [
    { id: 901, data: { subject_id: 7560, burned_at: '2026-01-01T00:00:00Z' } },
    { id: 902, data: { subject_id: 8763, burned_at: '2026-01-02T00:00:00Z' } },
  ];

  const mistakeSubjects = recordedMistakes.length > 0
    ? buildRecentMistakesDeck({ mistakeEntries: recordedMistakes, subjectsById: byId, now })
    : [freeSubjects[0], freeSubjects[3], freeSubjects[9]].filter(Boolean);

  return [
    {
      id: 'recentMistakes',
      title: 'Recent Mistakes',
      subtitle: 'Items missed in the last 24 hours',
      icon: 'replay',
      tone: 'error',
      subjects: mistakeSubjects,
    },
    {
      id: 'recentLessons',
      title: 'Recent Lessons',
      subtitle: 'Your most recently unlocked items',
      icon: 'auto-stories',
      tone: 'primary',
      subjects: buildRecentLessonsDeck({ assignments: recentAssignments, subjectsById: byId }),
    },
    {
      id: 'critical',
      title: 'Critical Condition',
      subtitle: 'Leeches below 75% overall accuracy',
      icon: 'warning-amber',
      tone: 'warning',
      subjects: buildCriticalItemsDeck({ reviewStatsBySubject: sampleStats, subjectsById: byId }),
    },
    {
      id: 'burned',
      title: 'Burned Items',
      subtitle: 'Zero-risk refresher on retired cards',
      icon: 'local-fire-department',
      tone: 'secondary',
      subjects: buildBurnedItemsDeck({ assignments: burnedAssignments, subjectsById: byId }),
    },
  ];
}

export default function useExtraStudy({ token, demo = false } = {}) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick(t => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (demo) {
      getRecentMistakes('DEMO').then(mistakes => {
        if (!active) return;
        setDecks(demoDecks(mistakes));
        setLoading(false);
      });
      return () => { active = false; };
    }

    if (!token) {
      setDecks([]);
      setLoading(false);
      return undefined;
    }

    Promise.all([
      getRecentMistakes(token),
      wkCache.syncReviewStatistics(token).catch(() => ({})),
      collection({
        endpoint: 'assignments',
        method: GET,
        apiKey: token,
        params: { started: true, burned: false, hidden: false },
      }).catch(() => []),
      collection({
        endpoint: 'assignments',
        method: GET,
        apiKey: token,
        params: { burned: true, hidden: false },
      }).catch(() => []),
    ]).then(async ([mistakes, reviewStatsBySubject, activeAssignments, burnedAssignments]) => {
      if (!active) return;
      const neededIds = _.uniq([
        ...mistakes.map(m => m.subjectId),
        ...Object.keys(reviewStatsBySubject).map(Number),
        ...activeAssignments.map(a => a?.data?.subject_id),
        ...burnedAssignments.map(a => a?.data?.subject_id),
      ].filter(Boolean));

      const subjectsById = neededIds.length > 0
        ? await wkCache.syncSubjects(token, neededIds)
        : {};
      if (!active) return;

      const now = Date.now();
      setDecks([
        {
          id: 'recentMistakes',
          title: 'Recent Mistakes',
          subtitle: 'Items missed in the last 24 hours',
          icon: 'replay',
          tone: 'error',
          subjects: buildRecentMistakesDeck({ mistakeEntries: mistakes, reviewStatsBySubject, subjectsById, now }),
        },
        {
          id: 'recentLessons',
          title: 'Recent Lessons',
          subtitle: 'Most recently started items',
          icon: 'auto-stories',
          tone: 'primary',
          subjects: buildRecentLessonsDeck({ assignments: activeAssignments, subjectsById }),
        },
        {
          id: 'critical',
          title: 'Critical Condition',
          subtitle: 'Items below 75% accuracy',
          icon: 'warning-amber',
          tone: 'warning',
          subjects: buildCriticalItemsDeck({ reviewStatsBySubject, subjectsById }),
        },
        {
          id: 'burned',
          title: 'Burned Items',
          subtitle: 'Zero-risk refresher on burned items',
          icon: 'local-fire-department',
          tone: 'secondary',
          subjects: buildBurnedItemsDeck({ assignments: burnedAssignments, subjectsById }),
        },
      ]);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [token, demo, reloadTick]);

  return { decks, loading, reload };
}
