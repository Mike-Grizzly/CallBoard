import { describe, it, expect } from "vitest";
import { canViewDraftReports } from "./visibility";
import type { Role } from "@/types/roles";

// Roles that can author/manage reports may see drafts; plain viewers may not.
const CAN_SEE_DRAFTS: Role[] = [
  "admin",
  "producer",
  "director",
  "choreographer",
  "creative",
  "stage_manager",
];
const CANNOT_SEE_DRAFTS: Role[] = ["cast", "crew"];

describe("reports / canViewDraftReports", () => {
  for (const role of CAN_SEE_DRAFTS) {
    it(`allows ${role} to view drafts`, () => {
      expect(canViewDraftReports(role)).toBe(true);
    });
  }

  for (const role of CANNOT_SEE_DRAFTS) {
    it(`denies ${role} from viewing drafts`, () => {
      expect(canViewDraftReports(role)).toBe(false);
    });
  }

  // Pentest finding P2-S1: a lower-privilege production member could read a
  // draft rehearsal report before it was distributed. These are the explicit
  // regression guards for that fix — if either flips to true, the boundary is
  // broken again.
  it("cast cannot view drafts (P2-S1 regression guard)", () => {
    expect(canViewDraftReports("cast")).toBe(false);
  });
  it("crew cannot view drafts (P2-S1 regression guard)", () => {
    expect(canViewDraftReports("crew")).toBe(false);
  });
});
