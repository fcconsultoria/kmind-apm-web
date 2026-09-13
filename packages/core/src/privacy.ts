import type { ResolvedConfig } from "./config";
let config: Pick<ResolvedConfig, "scrub" | "privacy"> | undefined;
const defaultKeys = ["token", "email", "cpf", "password"];
export function configurePrivacy(next: ResolvedConfig): void { config = next; }
export function scrub(value: string, key = ""): string {
  const attributeKey = key.toLowerCase();
  const attributeKeys = config?.privacy.redactAttributeKeys ?? [...defaultKeys, "authorization", "cookie"];
  const queryKeys = config?.privacy.redactUrlQueryKeys ?? defaultKeys;
  if (attributeKeys.some((item) => item.toLowerCase() === attributeKey)) return "[redacted]";
  let sanitized = value;
  try {
    const url = new URL(value, typeof location === "undefined" ? "https://kmind.invalid" : location.href);
    queryKeys.forEach((queryKey) => { if (url.searchParams.has(queryKey)) url.searchParams.set(queryKey, "[redacted]"); });
    if (url.origin !== "https://kmind.invalid") sanitized = url.toString();
    else if (value.startsWith("/")) sanitized = `${url.pathname}${url.search}${url.hash}`;
  } catch { /* the generic replacement below covers malformed URLs */ }
  sanitized = sanitized.replace(/(token|email|cpf|password)=([^&#\s]*)/gi, "$1=[redacted]");
  try { return config?.scrub(sanitized, key) ?? sanitized; } catch { return sanitized; }
}
export function scrubAttributes(values: Record<string, unknown>): Record<string, unknown> { return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, scrub(String(value), key)])); }
