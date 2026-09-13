export function shouldSample(rate: number): boolean { return rate >= 1 || (rate > 0 && Math.random() < rate); }
export function shouldPromoteTrace(error: boolean, durationMs: number, slowThresholdMs: number): boolean { return error || durationMs >= slowThresholdMs; }
