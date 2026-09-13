import { describe, expect, it } from "vitest";
import { randomHex } from "../src/utils";
import { shouldSample } from "../src/sampling";
import { shouldPromoteTrace } from "../src/sampling";
import { configurePrivacy, scrub } from "../src/privacy";
import { resolveConfig } from "../src/config";

describe("kmind-apm-web core", () => {
  it("generates W3C-sized trace and span ids", () => { expect(randomHex(16)).toMatch(/^[0-9a-f]{32}$/); expect(randomHex(8)).toMatch(/^[0-9a-f]{16}$/); });
  it("scrubs common query-string secrets", () => { expect(scrub("/checkout?email=a@b.com&token=abc&safe=yes")).toBe("/checkout?email=[redacted]&token=[redacted]&safe=yes"); });
  it("honors sampling boundaries", () => { expect(shouldSample(0)).toBe(false); expect(shouldSample(1)).toBe(true); });
  it("promotes errors and slow traces regardless of head sampling", () => { expect(shouldPromoteTrace(true, 1, 1000)).toBe(true); expect(shouldPromoteTrace(false, 1000, 1000)).toBe(true); expect(shouldPromoteTrace(false, 999, 1000)).toBe(false); });
  it("supports custom privacy rules and scrub hooks", () => { configurePrivacy(resolveConfig({ serviceName: "test", clientKey: "key", privacy: { redactAttributeKeys: ["account.id"], redactUrlQueryKeys: ["session"] }, scrub: (value) => value.replace("internal", "masked") })); expect(scrub("42", "account.id")).toBe("[redacted]"); expect(scrub("https://internal.example.com/?session=abc")).toContain("masked.example.com/?session=%5Bredacted%5D"); });
});
