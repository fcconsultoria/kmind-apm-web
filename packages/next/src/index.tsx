"use client";
import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { init, logger, recordMetric, type KmindConfig } from "kmind-apm-web";

export function initKmindNext(config: Partial<KmindConfig> = {}): void {
  init({ applicationName: config.applicationName ?? config.serviceName ?? process.env.NEXT_PUBLIC_KMIND_APPLICATION_NAME ?? process.env.NEXT_PUBLIC_KMIND_SERVICE_NAME ?? "next-app", clientKey: config.clientKey ?? process.env.NEXT_PUBLIC_KMIND_CLIENT_KEY ?? "", endpoint: config.endpoint ?? process.env.NEXT_PUBLIC_KMIND_ENDPOINT, statusEndpoint: config.statusEndpoint ?? process.env.NEXT_PUBLIC_KMIND_STATUS_ENDPOINT, ...config });
}
export function KmindNextNavigation(): null {
  useEffect(() => { const notify = () => recordMetric("navigation.route_change", 1, { route: location.pathname }); const original = history.pushState; history.pushState = function(...args) { original.apply(this, args); notify(); }; addEventListener("popstate", notify); return () => { history.pushState = original; removeEventListener("popstate", notify); }; }, []);
  return null;
}
export class KmindNextErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { logger.error(error.message, { "exception.stacktrace": error.stack ?? "", "next.component_stack": info.componentStack }); }
  render() { return this.state.failed ? this.props.fallback ?? null : this.props.children; }
}
