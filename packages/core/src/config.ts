export type PrivacyRules = {
  redactAttributeKeys?: string[];
  redactUrlQueryKeys?: string[];
};
export type KmindConfig = {
  /** Name shown as an application in Kmind. */
  applicationName?: string;
  /** @deprecated Use applicationName. Kept for backwards compatibility. */
  serviceName?: string;
  clientKey: string;
  enabled?: boolean;
  sampleRate?: number;
  debugHttp?: boolean;
  debugTrace?: boolean;
  /** Capture console.warn/error. Disabled by default because it patches global console methods. */
  captureConsole?: boolean;
  propagateTraceTo?: string[];
  endpoint?: string;
  statusEndpoint?: string;
  scrub?: (value: string, key: string) => string;
  privacy?: PrivacyRules;
  slowTraceThresholdMs?: number;
};

export type ResolvedConfig = Required<Omit<KmindConfig, "applicationName" | "serviceName" | "propagateTraceTo" | "privacy">> & { applicationName: string; propagateTraceTo: string[]; privacy: Required<PrivacyRules> };

export function resolveConfig(input: KmindConfig): ResolvedConfig {
  const applicationName = (input.applicationName ?? input.serviceName ?? "").trim();
  if (!applicationName) throw new Error("applicationName is required");
  if (!input.clientKey.trim()) throw new Error("clientKey is required");
  const sampleRate = input.sampleRate ?? 1;
  if (sampleRate < 0 || sampleRate > 1) throw new Error("sampleRate must be between 0 and 1");
  return {
    applicationName, clientKey: input.clientKey.trim(), enabled: input.enabled ?? true,
    sampleRate, debugHttp: input.debugHttp ?? false, debugTrace: input.debugTrace ?? false,
    captureConsole: input.captureConsole ?? false,
    propagateTraceTo: input.propagateTraceTo ?? [], endpoint: (input.endpoint ?? "https://ingest.kmind.com.br/v1").replace(/\/$/, ""),
    statusEndpoint: input.statusEndpoint ?? "https://ingest.kmind.com.br/v1/apm/status",
    scrub: input.scrub ?? ((value) => value),
    privacy: { redactAttributeKeys: input.privacy?.redactAttributeKeys ?? ["token", "email", "cpf", "password", "authorization", "cookie"], redactUrlQueryKeys: input.privacy?.redactUrlQueryKeys ?? ["token", "email", "cpf", "password"] },
    slowTraceThresholdMs: input.slowTraceThresholdMs ?? 1000,
  };
}
