import { resolveConfig, type KmindConfig } from "./config";
import { installErrorCapture } from "./errors";
import { heartbeat } from "./heartbeat";
import { installFetchInstrumentation, installXhrInstrumentation } from "./network";
import { metricPayload } from "./otlp";
import { getActiveTraceId, configureTracing, installPageTracing } from "./tracing";
import { configureTransport, enqueue, installPageFlush } from "./transport";
import { safeRun } from "./utils";
import { installWebVitals } from "./vitals";
import { configurePrivacy } from "./privacy";
import { configureLogger, logger, type KmindLogger } from "./logger";
import { installConsoleCapture } from "./consoleCapture";

let initialized = false; let config: ReturnType<typeof resolveConfig> | undefined;
export function init(input: KmindConfig): void { safeRun(() => { if (initialized || typeof window === "undefined") return; config = resolveConfig(input); if (!config.enabled) return; initialized = true; configurePrivacy(config); configureTransport(config); configureTracing(config); configureLogger(config); installPageFlush(); installPageTracing(); installFetchInstrumentation(config); installXhrInstrumentation(config); installWebVitals(config); installErrorCapture(config); if (config.captureConsole) installConsoleCapture(config); void heartbeat(config); }, input.debugTrace); }
export function recordMetric(name: string, value: number, attributes: Record<string, string> = {}): void { safeRun(() => { if (config && Number.isFinite(value)) enqueue("metrics", metricPayload(config.serviceName, name, value, attributes)); }, config?.debugTrace); }
export { getActiveTraceId };
export { logger };
export type { KmindConfig, KmindLogger };
