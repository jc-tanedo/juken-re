import { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
import { GET, PUT } from 'src/common/constants';
import { collection, request } from 'src/features/wk/request';
import wkCache from 'src/features/wk/cache';
import listToDict from 'src/utils/listToDict';
import { lessonAssignments, lessonSubjects } from 'src/mock/freeLessons';

export default function useLessons({ token, demo = false } = {}) {
  const [assignments, setAssignments] = useState([]);
  const [subjectsById, setSubjectsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick(t => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (demo) {
      setAssignments(lessonAssignments.slice());
      setSubjectsById(listToDict(lessonSubjects));
      setLoading(false);
      return undefined;
    }

    if (!token) {
      setAssignments([]);
      setSubjectsById({});
      setLoading(false);
      return undefined;
    }

    collection({
      endpoint: 'assignments',
      method: GET,
      apiKey: token,
      params: { immediately_available_for_lesson: true },
    }).then(async rawAssignments => {
      if (!active) return;
      const list = Array.isArray(rawAssignments) ? rawAssignments : [];
      if (list.length === 0) {
        setAssignments([]);
        setSubjectsById({});
        setLoading(false);
        return;
      }

      const subjectIds = _.uniq(list.map(a => a?.data?.subject_id).filter(Boolean));
      const cachedSubjects = await wkCache.syncSubjects(token, subjectIds);
      if (!active) return;
      setAssignments(list.filter(a => Boolean(cachedSubjects[a?.data?.subject_id])));
      setSubjectsById(cachedSubjects);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [token, demo, reloadTick]);

  const unlockAssignment = useCallback(async assignment => {
    if (!assignment?.id) return { ok: false, message: 'Missing assignment ID.' };

    if (demo) {
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      return {
        ok: true,
        assignment: {
          ...assignment,
          data: {
            ...assignment.data,
            srs_stage: 1,
            started_at: new Date().toISOString(),
          },
        },
      };
    }

    if (!token) return { ok: false, message: 'Sign in with a WaniKani token to unlock lessons.' };

    try {
      const updated = await request({
        endpoint: `assignments/${assignment.id}/start`,
        method: PUT,
        apiKey: token,
      });
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      return { ok: true, assignment: updated };
    } catch (err) {
      const status = err?.status || err?.code;
      if (status === 401 || status === 403) {
        return {
          ok: false,
          permissionDenied: true,
          message: 'Add assignments:start permission to your WaniKani API token to unlock completed lessons.',
        };
      }
      return {
        ok: false,
        message: err?.message || 'Could not unlock lesson on WaniKani.',
      };
    }
  }, [demo, token]);

  return {
    assignments,
    subjectsById,
    availableCount: assignments.length,
    loading,
    reload,
    unlockAssignment,
  };
}
