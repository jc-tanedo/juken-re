import { useCallback, useEffect, useMemo, useState } from 'react';
import { POST, PUT } from 'src/common/constants';
import { request } from 'src/features/wk/request';
import wkCache from 'src/features/wk/cache';

const DEMO_MATERIALS = {
  444: {
    id: -444,
    data: {
      subject_id: 444,
      meaning_synonyms: ['Human', 'Somebody'],
      meaning_note: 'Picture a person striding forward on two legs.',
      reading_note: 'Nintendo starts with にん and Jeans with じん.',
    },
  },
};

function sanitizeSynonyms(synonyms) {
  if (!Array.isArray(synonyms)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of synonyms) {
    const clean = String(raw || '').trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= 8) break;
  }
  return out;
}

export default function useStudyMaterials({ token, demo = false, enabled = true } = {}) {
  const [materialsBySubjectId, setMaterialsBySubjectId] = useState(() => (demo ? DEMO_MATERIALS : {}));
  const [loaded, setLoaded] = useState(demo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (demo) {
      setMaterialsBySubjectId(prev => (Object.keys(prev).length ? prev : DEMO_MATERIALS));
      setLoaded(true);
      setLoading(false);
      return undefined;
    }
    if (!enabled || !token) return undefined;

    let active = true;
    setLoading(true);
    wkCache.syncStudyMaterials(token).then(
      bySubjectId => {
        if (!active) return;
        setMaterialsBySubjectId(bySubjectId || {});
        setLoaded(true);
        setLoading(false);
      },
      () => {
        if (!active) return;
        setLoaded(false);
        setLoading(false);
      },
    );
    return () => { active = false; };
  }, [token, demo, enabled]);

  const synonymsBySubjectId = useMemo(() => {
    if (!demo && !loaded) return null;
    const out = {};
    for (const [subjectId, material] of Object.entries(materialsBySubjectId)) {
      out[subjectId] = material?.data?.meaning_synonyms || [];
    }
    return out;
  }, [demo, loaded, materialsBySubjectId]);

  const saveStudyMaterial = useCallback(async ({
    subjectId,
    meaningSynonyms,
    meaningNote,
    readingNote,
  }) => {
    if (!subjectId) return { ok: false, message: 'Missing subject ID.' };

    const existing = materialsBySubjectId[subjectId];
    const nextSynonyms = meaningSynonyms !== undefined
      ? sanitizeSynonyms(meaningSynonyms)
      : (existing?.data?.meaning_synonyms || []);
    const nextMeaningNote = meaningNote !== undefined
      ? (meaningNote?.trim() ? meaningNote : null)
      : (existing?.data?.meaning_note ?? null);
    const nextReadingNote = readingNote !== undefined
      ? (readingNote?.trim() ? readingNote : null)
      : (existing?.data?.reading_note ?? null);

    if (demo) {
      const saved = {
        id: existing?.id || -subjectId,
        data_updated_at: new Date().toISOString(),
        data: {
          subject_id: subjectId,
          meaning_synonyms: nextSynonyms,
          meaning_note: nextMeaningNote,
          reading_note: nextReadingNote,
        },
      };
      setMaterialsBySubjectId(prev => ({ ...prev, [subjectId]: saved }));
      return { ok: true, material: saved };
    }

    if (!token) return { ok: false, message: 'Sign in with a WaniKani token to save notes.' };

    try {
      const payload = {
        study_material: {
          ...(existing?.id ? {} : { subject_id: subjectId }),
          meaning_synonyms: nextSynonyms,
          meaning_note: nextMeaningNote,
          reading_note: nextReadingNote,
        },
      };

      const saved = existing?.id
        ? await request({
          endpoint: `study_materials/${existing.id}`,
          method: PUT,
          apiKey: token,
          body: payload,
        })
        : await request({
          endpoint: 'study_materials',
          method: POST,
          apiKey: token,
          body: payload,
        });

      await wkCache.upsertStudyMaterial(token, saved);
      setMaterialsBySubjectId(prev => ({ ...prev, [subjectId]: saved }));
      return { ok: true, material: saved };
    } catch (err) {
      const status = err?.status || err?.code;
      if (status === 401 || status === 403) {
        return {
          ok: false,
          permissionDenied: true,
          message: 'Add study_materials:create and study_materials:update permissions to your WaniKani API token to save synonyms and notes.',
        };
      }
      return {
        ok: false,
        message: err?.message || 'Could not save study material.',
      };
    }
  }, [demo, token, materialsBySubjectId]);

  return {
    materialsBySubjectId,
    synonymsBySubjectId,
    loading,
    loaded,
    saveStudyMaterial,
  };
}
