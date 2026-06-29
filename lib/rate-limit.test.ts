import { describe, it, expect } from "vitest";
import { decideRateLimit } from "./rate-limit";

describe("rate-limit / decideRateLimit", () => {
  describe("when the limiter ran", () => {
    it("allows a request within budget (any environment)", () => {
      expect(decideRateLimit({ kind: "ok", success: true }, true)).toEqual({
        limited: false,
      });
      expect(decideRateLimit({ kind: "ok", success: true }, false)).toEqual({
        limited: false,
      });
    });

    it("blocks a request over budget (any environment)", () => {
      expect(decideRateLimit({ kind: "ok", success: false }, true).limited).toBe(
        true,
      );
      expect(
        decideRateLimit({ kind: "ok", success: false }, false).limited,
      ).toBe(true);
    });
  });

  // The security-critical branch: protection must not silently disappear in
  // production when the limiter is missing or broken (pentest Phase 1 #2).
  describe("when the limiter is unavailable (no Redis configured)", () => {
    it("fails CLOSED in real production", () => {
      const r = decideRateLimit({ kind: "unavailable" }, true);
      expect(r.limited).toBe(true);
      expect(r.error).toBeTruthy();
    });

    it("fails OPEN outside production (dev/CI/preview stay usable)", () => {
      expect(decideRateLimit({ kind: "unavailable" }, false)).toEqual({
        limited: false,
      });
    });
  });

  describe("when the limiter errors (Redis unreachable)", () => {
    it("fails CLOSED in real production", () => {
      const r = decideRateLimit({ kind: "error" }, true);
      expect(r.limited).toBe(true);
      expect(r.error).toBeTruthy();
    });

    it("fails OPEN outside production", () => {
      expect(decideRateLimit({ kind: "error" }, false)).toEqual({
        limited: false,
      });
    });
  });
});
