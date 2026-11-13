const byDay = new Map<string, number>();
let processRequests = 0;

export function trackRequest() {
  processRequests += 1;
  const day = new Date().toISOString().slice(0, 10);
  byDay.set(day, (byDay.get(day) || 0) + 1);
}

export function requestMetrics() {
  return {
    sinceProcessStart: processRequests,
    byDay: [...byDay.entries()].map(([day, count]) => ({ day, count })),
  };
}
