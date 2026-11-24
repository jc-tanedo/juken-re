import { useEffect, useState } from 'react';
import { GET } from 'src/common/constants';
import { request } from 'src/features/wk/request';
import toChunks from 'src/utils/toChunks';

async function loadSynonyms(subjects) {
  const synonyms = {};
  for (const ids of toChunks(subjects.map(s => s.id), 500)) {
    let nextUrl;
    do {
      const page = await request({
        endpoint: 'study_materials', method: GET, params: { subject_ids: ids.join(',') }, nextUrl,
      });
      if (!Array.isArray(page.data)) throw new Error('Study materials unavailable');
      for (const { data } of page.data) synonyms[data.subject_id] = data.meaning_synonyms || [];
      nextUrl = page.pages?.next_url;
    } while (nextUrl);
  }
  return synonyms;
}

export default function useStudySynonyms(subjects, demo, enabled) {
  const [loaded, setLoaded] = useState(null);
  useEffect(() => {
    if (demo || !enabled || !subjects?.length || loaded?.subjects === subjects) return;
    let current = true;
    loadSynonyms(subjects).then(
      values => { if (current) setLoaded({ subjects, values }); },
      () => { if (current) setLoaded({ subjects, values: null }); },
    );
    return () => { current = false; };
  }, [subjects, demo, enabled, loaded]);
  if (demo) return {};
  return loaded && loaded.subjects === subjects ? loaded.values : null;
}
