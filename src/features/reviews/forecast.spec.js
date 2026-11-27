import { buildReviewForecast, formatTimeUntil } from 'src/features/reviews/forecast';

describe('review forecast builder', () => {
  test('buckets upcoming reviews by hour within 24h and ignores burned or hidden items', () => {
    const now = Date.parse('2026-06-01T10:15:00.000Z');
    const hour1 = '2026-06-01T11:00:00.000Z';
    const hour3 = '2026-06-01T13:00:00.000Z';
    const beyond24h = '2026-06-03T12:00:00.000Z';

    const assignments = [
      { id: 1, data: { available_at: '2026-06-01T09:00:00.000Z', burned_at: null } },
      { id: 2, data: { available_at: hour1, burned_at: null } },
      { id: 3, data: { available_at: hour1, burned_at: null } },
      { id: 4, data: { available_at: hour3, burned_at: null } },
      { id: 5, data: { available_at: hour1, burned_at: '2026-05-01T00:00:00Z' } },
      { id: 6, data: { available_at: beyond24h, burned_at: null } },
    ];

    const forecast = buildReviewForecast(assignments, now, 24);
    expect(forecast.dueNowCount).toBe(1);
    expect(forecast.nextReviewAt).toBe(Date.parse(hour1));
    expect(forecast.nextReviewCount).toBe(2);
    expect(forecast.totalNext24h).toBe(3);
    expect(forecast.buckets.map(b => [b.count, b.cumulative])).toEqual([
      [2, 3],
      [1, 4],
    ]);
  });

  test('formats remaining wait duration cleanly', () => {
    const now = 1_700_000_000_000;
    expect(formatTimeUntil(now + 20_000, now)).toBe('Now');
    expect(formatTimeUntil(now + 25 * 60_000, now)).toBe('25m');
    expect(formatTimeUntil(now + 95 * 60_000, now)).toBe('1h 35m');
    expect(formatTimeUntil(now + 120 * 60_000, now)).toBe('2h');
  });
});
