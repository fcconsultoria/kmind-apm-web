import type { ResolvedConfig } from "./config";
import { tracePayload, type SpanData } from "./otlp";
import { enqueue } from "./transport";
import { shouldPromoteTrace, shouldSample } from "./sampling";
import { randomHex, nanoNow, safeRun } from "./utils";
import { scrubAttributes } from "./privacy";

let config: ResolvedConfig; let current: SpanData | undefined;
const traceStates = new Map<string, { sampled: boolean; pending: SpanData[] }>();
export function configureTracing(next: ResolvedConfig): void { config = next; }
export function getActiveTraceId(): string | undefined { return current?.traceId; }
export function getActiveSpanContext(): Pick<SpanData, "traceId" | "spanId"> | undefined {
  return current ? { traceId: current.traceId, spanId: current.spanId } : undefined;
}
export function startSpan(name: string, attrs: Record<string, unknown> = {}): SpanData {
  const parent = current; const traceId = parent?.traceId ?? randomHex(16);
  if (!traceStates.has(traceId)) traceStates.set(traceId, { sampled: shouldSample(config.sampleRate), pending: [] });
  return { traceId, spanId: randomHex(8), parentSpanId: parent?.spanId, name, start: nanoNow(), attrs: scrubAttributes(attrs) };
}
export function endSpan(span: SpanData, error = false): void {
  span.end = nanoNow(); span.status = error ? "ERROR" : "OK";
  const state = traceStates.get(span.traceId) ?? { sampled: true, pending: [] };
  const durationMs = Number(BigInt(span.end) - BigInt(span.start)) / 1_000_000;
  const promoted = shouldPromoteTrace(error, durationMs, config.slowTraceThresholdMs);
  if (state.sampled || promoted) {
    state.pending.forEach((item) => enqueue("traces", tracePayload(config.serviceName, item)));
    state.pending = []; state.sampled = true;
    enqueue("traces", tracePayload(config.serviceName, span));
  } else state.pending.push(span);
  if (!span.parentSpanId) traceStates.delete(span.traceId);
}
export function withActive<T>(span: SpanData, fn: () => T): T { const previous = current; current = span; try { return fn(); } finally { current = previous; } }
export function installPageTracing(): void { safeRun(() => { const page = startSpan("documentLoad", { "url.full": location.href }); current = page; window.addEventListener("pagehide", () => endSpan(page)); document.addEventListener("click", () => { const span = startSpan("user.click"); endSpan(span); }, true); document.addEventListener("submit", () => { const span = startSpan("form.submit"); endSpan(span); }, true); }, config.debugTrace); }
export function recordError(message: string, attrs: Record<string, unknown> = {}): void { safeRun(() => { const span = startSpan("exception", { "exception.message": message, ...attrs }); endSpan(span, true); }, config.debugTrace); }
