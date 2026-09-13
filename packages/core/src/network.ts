import type { ResolvedConfig } from "./config";
import { endSpan, startSpan, withActive } from "./tracing";
import { safeRun } from "./utils";

function shouldPropagate(url: string, config: ResolvedConfig): boolean { try { return config.propagateTraceTo.includes(new URL(url, location.href).hostname); } catch { return false; } }
function traceparent(span: { traceId: string; spanId: string }): string { return `00-${span.traceId}-${span.spanId}-01`; }
export function installFetchInstrumentation(config: ResolvedConfig): void {
  const original = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    let span: ReturnType<typeof startSpan> | undefined;
    let requestInit = init;
    try {
      const isRequest = typeof Request !== "undefined" && input instanceof Request;
      const url = typeof input === "string" ? input : isRequest ? input.url : String(input);
      const method = init.method ?? (isRequest ? input.method : "GET");
      span = startSpan("HTTP " + method, { "http.request.method": method, "url.full": url, "server.address": new URL(url, location.href).hostname });
      // Do not touch native request options unless distributed tracing was explicitly enabled.
      if (shouldPropagate(url, config)) {
        const headers = new Headers(init.headers ?? (isRequest ? input.headers : undefined));
        headers.set("traceparent", traceparent(span));
        requestInit = { ...init, headers };
      }
    } catch {
      // If instrumentation cannot inspect a request, preserve the native fetch exactly.
      return original(input, init);
    }
    let request: Promise<Response>;
    try {
      request = withActive(span!, () => original(input, requestInit));
    } catch (error) {
      safeRun(() => endSpan(span!, true), config.debugTrace);
      throw error;
    }
    return request.then(
      (response) => { safeRun(() => endSpan(span!, response.status >= 400), config.debugTrace); return response; },
      (error) => { safeRun(() => endSpan(span!, true), config.debugTrace); throw error; },
    );
  };
}
export function installXhrInstrumentation(config: ResolvedConfig): void {
  const open = XMLHttpRequest.prototype.open; const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: [boolean?, string?, string?]) { safeRun(() => { (this as XMLHttpRequest & { __kmind?: { method: string; url: string } }).__kmind = { method, url: String(url) }; }, config.debugTrace); return (open as (...values: unknown[]) => void).apply(this, [method, url, ...rest]); };
  XMLHttpRequest.prototype.send = function(...args: Parameters<XMLHttpRequest["send"]>) { const meta = (this as XMLHttpRequest & { __kmind?: { method: string; url: string } }).__kmind; if (!meta) return send.apply(this, args); let span: ReturnType<typeof startSpan> | undefined; safeRun(() => { span = startSpan("HTTP " + meta.method, { "http.request.method": meta.method, "url.full": meta.url }); if (shouldPropagate(meta.url, config)) this.setRequestHeader("traceparent", traceparent(span!)); this.addEventListener("loadend", () => safeRun(() => endSpan(span!, this.status >= 400), config.debugTrace), { once: true }); }, config.debugTrace); return send.apply(this, args); };
}
