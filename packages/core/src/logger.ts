import type { ResolvedConfig } from "./config";
import { logPayload } from "./otlp";
import { scrub } from "./privacy";
import { getActiveSpanContext } from "./tracing";
import { enqueue } from "./transport";
import { safeRun } from "./utils";

export type KmindLogger = {
  info(message: string, attributes?: Record<string, unknown>): void;
  warn(message: string, attributes?: Record<string, unknown>): void;
  error(message: string, attributes?: Record<string, unknown>): void;
};

let config: ResolvedConfig | undefined;

export function configureLogger(next: ResolvedConfig): void { config = next; }

function normalizeAttributes(input: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, scrub(typeof value === "string" ? value : JSON.stringify(value), key)]));
}

function write(severity: "INFO" | "WARN" | "ERROR", message: string, attributes: Record<string, unknown> = {}): void {
  safeRun(() => {
    if (!config) return;
    const context = getActiveSpanContext();
    enqueue("logs", logPayload(config.serviceName, severity, scrub(message), {
      ...normalizeAttributes(attributes),
      trace_id: context?.traceId,
      span_id: context?.spanId,
    }));
  }, config?.debugTrace);
}

export const logger: KmindLogger = {
  info: (message, attributes) => write("INFO", message, attributes),
  warn: (message, attributes) => write("WARN", message, attributes),
  error: (message, attributes) => write("ERROR", message, attributes),
};
