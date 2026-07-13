import { describe, it, expect } from "vitest";
import { ROLES, type Role } from "@/types/roles";
import { can } from "@/lib/permissions";
import { NAV_ITEMS, navItemsFor } from "./nav-items";

// N4 guard: navItemsFor() consolidated the desktop rail and mobile "More" nav
// into one source. These reference implementations are copied VERBATIM from the
// pre-consolidation code (rail.tsx's filter and more/page.tsx's ITEMS list), so
// if the refactor changes what any role sees on either surface, this test fails.
// The security concern the backlog flags is gating silently loosening — this is
// its guard.

// Pre-refactor rail: NAV_ITEMS minus "/productions", gated by capability.
function oldRailHrefs(role: Role): string[] {
  return NAV_ITEMS.filter(
    (i) => i.href !== "/productions" && (!i.capability || can(role, i.capability)),
  ).map((i) => i.href);
}

// Pre-refactor mobile More: this exact hardcoded list, gated by capability.
const OLD_MORE_ITEMS: { href: string; capability?: string }[] = [
  { href: "/productions", capability: "productions:view" },
  { href: "/documents", capability: "documents:view" },
  { href: "/announcements", capability: "announcements:view" },
  { href: "/activity", capability: "activity:view" },
  { href: "/people", capability: "settings:manage" },
  { href: "/settings" },
];
function oldMoreHrefs(role: Role): string[] {
  return OLD_MORE_ITEMS.filter(
    (i) => !i.capability || can(role, i.capability as never),
  ).map((i) => i.href);
}

describe("navItemsFor — gating is byte-identical to the pre-N4 surfaces", () => {
  for (const role of ROLES) {
    it(`rail nav for ${role} is unchanged`, () => {
      expect(navItemsFor("rail", role).map((i) => i.href)).toEqual(
        oldRailHrefs(role),
      );
    });
    it(`more nav for ${role} is unchanged`, () => {
      expect(navItemsFor("more", role).map((i) => i.href)).toEqual(
        oldMoreHrefs(role),
      );
    });
  }

  it("has no dead Productions entry in the rail surface", () => {
    expect(navItemsFor("rail", "admin").some((i) => i.href === "/productions")).toBe(
      false,
    );
  });
});
