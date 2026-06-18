import { describe, it, expect } from "vitest";
import { can, CAPABILITIES } from "./permissions";
import type { Capability } from "./permissions";
import type { Role } from "@/types/roles";

// Full expected capability matrix derived from lib/permissions.ts.
const MATRIX: Record<Role, Capability[]> = {
  admin: [...CAPABILITIES],
  producer: CAPABILITIES.filter((c) => c !== "settings:manage"),
  director: CAPABILITIES.filter(
    (c) => c !== "settings:manage" && c !== "productions:manage",
  ),
  choreographer: CAPABILITIES.filter(
    (c) =>
      c !== "settings:manage" &&
      c !== "productions:manage" &&
      c !== "announcements:create" &&
      c !== "notes:manage_tags",
  ),
  creative: CAPABILITIES.filter(
    (c) =>
      c !== "settings:manage" &&
      c !== "productions:manage" &&
      c !== "announcements:create" &&
      c !== "notes:manage_tags",
  ),
  stage_manager: CAPABILITIES.filter(
    (c) =>
      c !== "settings:manage" &&
      c !== "productions:manage" &&
      c !== "announcements:create",
  ),
  cast: [
    "productions:view",
    "reports:view",
    "documents:view",
    "videos:view",
    "announcements:view",
    "blocking:view",
    "notes:view",
    "notes:create",
  ],
  crew: [
    "productions:view",
    "reports:view",
    "documents:view",
    "videos:view",
    "announcements:view",
    "blocking:view",
    "notes:view",
    "notes:create",
  ],
};

describe("permissions / can()", () => {
  for (const [role, allowed] of Object.entries(MATRIX) as [Role, Capability[]][]) {
    const allowedSet = new Set(allowed);

    describe(`role: ${role}`, () => {
      for (const cap of CAPABILITIES) {
        if (allowedSet.has(cap)) {
          it(`grants ${cap}`, () => {
            expect(can(role, cap)).toBe(true);
          });
        } else {
          it(`denies ${cap}`, () => {
            expect(can(role, cap)).toBe(false);
          });
        }
      }
    });
  }

  describe("key business rules", () => {
    it("admin is the only role with settings:manage", () => {
      const withSettings = (
        ["admin", "producer", "director", "choreographer", "creative", "stage_manager", "cast", "crew"] as Role[]
      ).filter((r) => can(r, "settings:manage"));
      expect(withSettings).toEqual(["admin"]);
    });

    it("only admin and producer can manage productions", () => {
      const withManage = (
        ["admin", "producer", "director", "choreographer", "creative", "stage_manager", "cast", "crew"] as Role[]
      ).filter((r) => can(r, "productions:manage"));
      expect(withManage).toEqual(["admin", "producer"]);
    });

    it("cast and crew cannot upload documents", () => {
      expect(can("cast", "documents:upload")).toBe(false);
      expect(can("crew", "documents:upload")).toBe(false);
    });

    it("cast and crew cannot create announcements", () => {
      expect(can("cast", "announcements:create")).toBe(false);
      expect(can("crew", "announcements:create")).toBe(false);
    });

    it("cast and crew cannot edit blocking", () => {
      expect(can("cast", "blocking:edit")).toBe(false);
      expect(can("crew", "blocking:edit")).toBe(false);
    });

    it("cast and crew cannot write reports", () => {
      expect(can("cast", "reports:create")).toBe(false);
      expect(can("crew", "reports:create")).toBe(false);
    });

    it("stage_manager can create reports but not manage productions", () => {
      expect(can("stage_manager", "reports:create")).toBe(true);
      expect(can("stage_manager", "productions:manage")).toBe(false);
    });

    it("choreographer and creative cannot manage tags", () => {
      expect(can("choreographer", "notes:manage_tags")).toBe(false);
      expect(can("creative", "notes:manage_tags")).toBe(false);
    });
  });
});
