import { randomHex } from "./utils";
const key = "kmind.apm.session.id";
export function sessionId(): string { try { const value = sessionStorage.getItem(key); if (value) return value; const next = randomHex(16); sessionStorage.setItem(key, next); return next; } catch { return randomHex(16); } }
