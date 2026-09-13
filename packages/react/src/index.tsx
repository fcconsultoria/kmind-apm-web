import { Component, type ErrorInfo, type ReactNode, useEffect, useRef } from "react";
import { init, logger, recordMetric, type KmindConfig } from "kmind-apm-web";

type PublicEnv = Record<string, string | undefined>;
function viteEnv(): PublicEnv { return (import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}; }
export function initKmindReact(config: Partial<KmindConfig> = {}): void {
  const env = viteEnv();
  init({ applicationName: config.applicationName ?? config.serviceName ?? env.VITE_KMIND_APPLICATION_NAME ?? env.VITE_KMIND_SERVICE_NAME ?? "react-app", clientKey: config.clientKey ?? env.VITE_KMIND_CLIENT_KEY ?? "", endpoint: config.endpoint ?? env.VITE_KMIND_ENDPOINT, statusEndpoint: config.statusEndpoint ?? env.VITE_KMIND_STATUS_ENDPOINT, ...config });
}
export function useKmindRoute(route: string): void { const previous = useRef<string | undefined>(undefined); useEffect(() => { if (previous.current !== undefined && previous.current !== route) recordMetric("navigation.route_change", 1, { route }); previous.current = route; }, [route]); }
export class KmindErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { logger.error(error.message, { "exception.stacktrace": error.stack ?? "", "react.component_stack": info.componentStack }); }
  render() { return this.state.failed ? this.props.fallback ?? null : this.props.children; }
}
