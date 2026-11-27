const HOUR_MS = 3_600_000;

export function formatHourLabel(hourMs) {
  const date = new Date(hourMs);
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;
  return `${twelveHour} ${suffix}`;
}

export function formatTimeUntil(targetMs, nowMs = Date.now()) {
  if (targetMs == null || !Number.isFinite(targetMs)) return null;
  const diffMs = Math.max(0, targetMs - nowMs);
  if (diffMs < 60_000) return 'Now';
  if (diffMs < HOUR_MS) return `${Math.ceil(diffMs / 60_000)}m`;
  const totalMins = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Aggregates active assignments into hourly WaniKani review forecast buckets
 * over the upcoming `horizonHours` window (default 24h).
 */
export function buildReviewForecast(assignments = [], now = Date.now(), horizonHours = 24) {
  const horizonEnd = now + horizonHours * HOUR_MS;
  const hourCounts = new Map();
  let dueNowCount = 0;
  let earliestMs = null;

  for (const assignment of assignments || []) {
    const data = assignment?.data;
    if (!data?.available_at || data.burned_at || data.hidden_at) continue;
    const atMs = Date.parse(data.available_at);
    if (Number.isNaN(atMs)) continue;

    if (atMs <= now) {
      dueNowCount += 1;
      continue;
    }

    if (atMs > horizonEnd) continue;

    const hourMs = Math.floor(atMs / HOUR_MS) * HOUR_MS;
    hourCounts.set(hourMs, (hourCounts.get(hourMs) || 0) + 1);
    if (earliestMs == null || atMs < earliestMs) {
      earliestMs = atMs;
    }
  }

  const sortedHours = Array.from(hourCounts.keys()).sort((a, b) => a - b);
  let cumulative = dueNowCount;
  const buckets = sortedHours.map(hourMs => {
    const count = hourCounts.get(hourMs);
    cumulative += count;
    return {
      hourMs,
      label: formatHourLabel(hourMs),
      count,
      cumulative,
    };
  });

  const nextBucket = buckets[0] || null;
  return {
    dueNowCount,
    nextReviewAt: earliestMs,
    nextReviewCount: nextBucket ? nextBucket.count : 0,
    totalNext24h: buckets.reduce((acc, b) => acc + b.count, 0),
    buckets,
  };
}
