import { useEffect, useState } from 'react';
import { GET } from 'src/common/constants';
import { collection } from 'src/features/wk/request';
import { buildReviewForecast } from 'src/features/reviews/forecast';

const HOUR_MS = 3_600_000;

function demoAssignments(now) {
  const base = Math.ceil(now / HOUR_MS) * HOUR_MS;
  const slots = [
    [base + HOUR_MS, 4],
    [base + 3 * HOUR_MS, 7],
    [base + 6 * HOUR_MS, 3],
  ];
  const list = [];
  let id = 900;
  for (const [ms, count] of slots) {
    const iso = new Date(ms).toISOString();
    for (let i = 0; i < count; i++) {
      list.push({ id: id++, data: { available_at: iso, burned_at: null } });
    }
  }
  return list;
}

export default function useReviewForecast({ token, demo = false, enabled = false } = {}) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    if (demo) {
      const now = Date.now();
      setForecast(buildReviewForecast(demoAssignments(now), now));
      setLoading(false);
      return undefined;
    }

    if (!token) return undefined;
    let active = true;
    setLoading(true);
    collection({
      endpoint: 'assignments',
      method: GET,
      apiKey: token,
      params: { started: true, burned: false, hidden: false },
    }).then(
      assignments => {
        if (!active) return;
        setForecast(buildReviewForecast(assignments, Date.now()));
        setLoading(false);
      },
      () => {
        if (!active) return;
        setLoading(false);
      },
    );
    return () => { active = false; };
  }, [token, demo, enabled]);

  return { forecast, loading };
}
