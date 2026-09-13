import type { ResolvedConfig } from "./config";
import { logger } from "./logger";
import { safeRun } from "./utils";

function message(args: unknown[]): string {
  return args.map((value) => {
    if (value instanceof Error) return value.stack || value.message;
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch { return String(value); }
  }).join(" ");
}

export function installConsoleCapture(config: ResolvedConfig): void {
  (["warn", "error"] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      original(...args);
      safeRun(() => logger[level](message(args), { "log.source": "console" }), config.debugTrace);
    };
  });
}
