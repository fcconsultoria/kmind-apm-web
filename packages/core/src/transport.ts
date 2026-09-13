import type { ResolvedConfig } from "./config";

type Signal = "traces" | "metrics" | "logs";
const MAX_QUEUED_EVENTS_PER_SIGNAL = 100;
const MAX_BATCH_EVENTS = 20;
const MAX_PAYLOAD_BYTES = 60 * 1024;
const FLUSH_INTERVAL_MS = 5_000;
const REQUEST_TIMEOUT_MS = 3_000;
const queues: Record<Signal, unknown[]> = { traces: [], metrics: [], logs: [] };
const nativeFetch = typeof window !== "undefined" ? window.fetch.bind(window) : undefined;
let timer: number | undefined;
let config: ResolvedConfig | undefined;
let active = true;
const inFlight: Record<Signal, boolean> = { traces: false, metrics: false, logs: false };

export function configureTransport(next: ResolvedConfig): void { config = next; active = next.enabled; }
export function disableTransport(): void { active = false; (Object.keys(queues) as Signal[]).forEach((key) => { queues[key] = []; }); }
export function enqueue(signal: Signal, event: unknown): void {
  if (!active || !config) return;
  // Telemetry is intentionally lossy under pressure so it cannot grow memory usage.
  if (queues[signal].length >= MAX_QUEUED_EVENTS_PER_SIGNAL) return;
  queues[signal].push(event);
  if (queues[signal].length >= MAX_BATCH_EVENTS) scheduleFlush(0);
  else if (!timer) scheduleFlush(FLUSH_INTERVAL_MS);
}

function scheduleFlush(delay: number): void {
  if (timer || typeof window === "undefined") return;
  timer = window.setTimeout(() => {
    timer = undefined;
    void flushAll();
  }, delay);
}

function payloadFor(signal: Signal, events: unknown[]): string | undefined {
  const collection = signal === "traces" ? "resourceSpans" : signal === "metrics" ? "resourceMetrics" : "resourceLogs";
  try {
    const payload = JSON.stringify({ [collection]: events.flatMap((event) => ((event as Record<string, unknown>)[collection] as unknown[]) ?? []), _kmind: { clientKey: config?.clientKey } });
    return new TextEncoder().encode(payload).byteLength <= MAX_PAYLOAD_BYTES ? payload : undefined;
  } catch {
    return undefined;
  }
}

export async function flush(signal: Signal): Promise<void> {
  if (inFlight[signal] || !config || !active) return;
  const events = queues[signal].splice(0, MAX_BATCH_EVENTS);
  if (!events.length) return;
  const payload = payloadFor(signal, events);
  // A single oversized batch is dropped rather than competing for bandwidth.
  if (!payload) { if (queues[signal].length) scheduleFlush(FLUSH_INTERVAL_MS); return; }
  const url = `${config.endpoint}/${signal}`;
  inFlight[signal] = true;
  try {
    const beaconSender: ((destination: string, data?: BodyInit | null) => boolean) | undefined = typeof navigator === "undefined" ? undefined : navigator.sendBeacon.bind(navigator);
    const body = new Blob([payload], { type: "application/json" });
    if (body.size < 64 * 1024 && beaconSender?.(url, body)) return;
    if (!nativeFetch) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      await nativeFetch(url, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", "X-Kmind-Client-Key": config.clientKey }, body: payload, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  } catch { /* telemetry must never affect the host application */ }
  finally {
    inFlight[signal] = false;
    if (queues[signal].length) scheduleFlush(FLUSH_INTERVAL_MS);
  }
}
export async function flushAll(): Promise<void> { await Promise.all((Object.keys(queues) as Signal[]).map(flush)); }
export function installPageFlush(): void { window.addEventListener("pagehide", () => void flushAll(), { once: false }); }
