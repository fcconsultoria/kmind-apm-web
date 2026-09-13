import type { App } from "vue";
import { init, logger, recordMetric, type KmindConfig } from "kmind-apm-web";
type PublicEnv = Record<string, string | undefined>;
type Router = { afterEach: (callback: (to: { fullPath: string }, from: { fullPath: string }) => void) => void };
function viteEnv(): PublicEnv { return (import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}; }
export function initKmindVue(config: Partial<KmindConfig> = {}): void { const env = viteEnv(); init({ applicationName: config.applicationName ?? config.serviceName ?? env.VITE_KMIND_APPLICATION_NAME ?? env.VITE_KMIND_SERVICE_NAME ?? "vue-app", clientKey: config.clientKey ?? env.VITE_KMIND_CLIENT_KEY ?? "", endpoint: config.endpoint ?? env.VITE_KMIND_ENDPOINT, statusEndpoint: config.statusEndpoint ?? env.VITE_KMIND_STATUS_ENDPOINT, ...config }); }
export function installKmindVue(app: App, router?: Router): void { app.config.errorHandler = (error, _instance, info) => logger.error(error instanceof Error ? error.message : String(error), { "vue.error_info": info, "exception.stacktrace": error instanceof Error ? error.stack ?? "" : "" }); router?.afterEach((to, from) => { if (to.fullPath !== from.fullPath) recordMetric("navigation.route_change", 1, { route: to.fullPath }); }); }
