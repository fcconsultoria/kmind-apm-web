export function safeRun(fn: () => void, debug = false): void { try { fn(); } catch (error) { if (debug) console.debug("[Kmind APM]", error); } }
export function nanoNow(): string { return String(BigInt(Date.now()) * 1_000_000n); }
export function randomHex(bytes: number): string { const data = new Uint8Array(bytes); crypto.getRandomValues(data); return Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join(""); }
export function attributes(values: Record<string, unknown>): Array<{ key: string; value: { stringValue: string } }> { return Object.entries(values).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => ({ key, value: { stringValue: String(value) } })); }
