import type { ResolvedConfig } from "./config";
import { logger } from "./logger";
import { scrub } from "./privacy";
import { recordError } from "./tracing";
import { safeRun } from "./utils";
export function installErrorCapture(config: ResolvedConfig): void { window.addEventListener("error", (event) => safeRun(() => { const message = scrub(event.message || "Unhandled error"); const stack = scrub(event.error?.stack ?? ""); recordError(message, { "exception.stacktrace": stack }); logger.error(message, { "exception.stacktrace": stack, "log.source": "window.onerror" }); }, config.debugTrace)); window.addEventListener("unhandledrejection", (event) => safeRun(() => { const message = scrub(String(event.reason?.message ?? event.reason ?? "Unhandled rejection")); recordError(message); logger.error(message, { "log.source": "unhandledrejection" }); }, config.debugTrace)); }
