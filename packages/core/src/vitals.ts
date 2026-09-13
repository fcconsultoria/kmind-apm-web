import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { ResolvedConfig } from "./config";
import { metricPayload } from "./otlp";
import { enqueue } from "./transport";
import { safeRun } from "./utils";
export function installWebVitals(config: ResolvedConfig): void { const report = (metric: { name: string; value: number }) => enqueue("metrics", metricPayload(config.serviceName, `web.vital.${metric.name.toLowerCase()}`, metric.value, {})); safeRun(() => { onCLS(report); onFCP(report); onINP(report); onLCP(report); onTTFB(report); }, config.debugTrace); }
