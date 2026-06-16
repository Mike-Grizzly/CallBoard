/**
 * Coachmark walkthrough definitions.
 *
 * Pure data + a path resolver — NO "use server" here (constants exported from
 * a server-action file cause hydration errors; see CLAUDE.md). The tour engine
 * (components/tour) consumes this on the client.
 *
 * Each step points at a `data-tour="<anchor>"` element in the live DOM. Steps
 * whose anchor isn't present are silently skipped, which is also how
 * permissions are honoured for free: capability-gated UI (a "New report"
 * button, a manager-only tab) simply isn't rendered for roles that lack it, so
 * its step drops out without any role logic here.
 */

export type TourPlacement = "top" | "bottom" | "left" | "right";

export type TourStep = {
  /** Matches the `data-tour` attribute on the element to highlight. */
  anchor: string;
  title: string;
  body: string;
  /** Preferred tooltip side; the engine flips it if it would overflow. */
  placement?: TourPlacement;
};

export type TourDefinition = {
  /** Persisted in profiles.tours_seen once finished or dismissed. */
  key: string;
  /** Human label for the Settings replay list. */
  label: string;
  steps: TourStep[];
};

const DASHBOARD_TOUR: TourDefinition = {
  key: "dashboard",
  label: "Dashboard",
  steps: [
    {
      anchor: "dash-greeting",
      title: "Welcome to your dashboard",
      body: "This is your home base. Every time you sign in, you'll land here with a snapshot of what needs your attention.",
      placement: "bottom",
    },
    {
      anchor: "dash-chips",
      title: "Your day at a glance",
      body: "New mentions, fresh announcements, and how many shows you're active on — a quick pulse before you dive in.",
      placement: "bottom",
    },
    {
      anchor: "dash-hero",
      title: "Your next call",
      body: "Your upcoming rehearsal and today's timeline live here, so you always know where to be and when.",
      placement: "bottom",
    },
    {
      anchor: "rail-productions",
      title: "Jump between shows",
      body: "All the productions you're part of are pinned here in the sidebar. Click one to open its hub.",
      placement: "right",
    },
    {
      anchor: "rail-settings",
      title: "Settings & preferences",
      body: "Manage your profile, notifications, and theme here. You can also replay any of these walkthroughs from Settings.",
      placement: "right",
    },
  ],
};

const PRODUCTIONS_TOUR: TourDefinition = {
  key: "productions",
  label: "Productions list",
  steps: [
    {
      anchor: "prod-heading",
      title: "Every show in one place",
      body: "This is the home for all of your organization's productions — past, present, and upcoming.",
      placement: "bottom",
    },
    {
      anchor: "prod-new",
      title: "Start a new production",
      body: "Spin up a new show with a short guided setup. You can invite your team and add details as you go.",
      placement: "left",
    },
    {
      anchor: "prod-list",
      title: "Open a show's hub",
      body: "Each card opens that production's workspace — reports, schedule, documents, script, and more.",
      placement: "top",
    },
  ],
};

const PRODUCTION_HUB_TOUR: TourDefinition = {
  key: "production-hub",
  label: "Production hub",
  steps: [
    {
      anchor: "hub-title",
      title: "This show's workspace",
      body: "Everything for this production lives here. The header shows its status, opening date, and director at a glance.",
      placement: "bottom",
    },
    {
      anchor: "hub-tabs",
      title: "Move between sections",
      body: "Rehearsal reports, the schedule, documents, announcements, your script, and more — each section is a tab.",
      placement: "bottom",
    },
    {
      anchor: "hub-actions",
      title: "Quick actions",
      body: "The most common things you'll do on this show — like filing a report or opening the cast & crew list — are right up here. The Take a tour button replays this guide anytime.",
      placement: "bottom",
    },
  ],
};

const BLOCKING_TOUR: TourDefinition = {
  key: "blocking",
  label: "Blocking tool",
  steps: [
    {
      anchor: "blocking-scenes",
      title: "Scenes & cast",
      body: "Pick the scene you're blocking from this list. Actors who aren't on stage for the current beat wait down here in the off-stage area.",
      placement: "right",
    },
    {
      anchor: "blocking-stage",
      title: "The stage",
      body: "Drag each actor to where they stand. A saved arrangement is a “beat” — step through beats to build the scene's movement moment by moment.",
      placement: "top",
    },
    {
      anchor: "blocking-tools",
      title: "Set pieces, notes & comments",
      body: "Drop furniture and set pieces onto the stage, jot blocking notes for the current beat, and leave comments your team can reply to.",
      placement: "left",
    },
  ],
};

const SCRIPT_TOUR: TourDefinition = {
  key: "script",
  label: "Script tool",
  steps: [
    {
      anchor: "script-tools",
      title: "Your toolbox",
      body: "Select, highlight (by drawing or selecting text), drop light/sound cues, add sticky notes, and bookmark scenes — each tool is in this rail.",
      placement: "right",
    },
    {
      anchor: "script-page",
      title: "Mark up the page",
      body: "Your script renders here. With a tool active, mark directly on the page — everything you add is private to your own copy.",
      placement: "left",
    },
    {
      anchor: "script-side",
      title: "Bookmarks & cue sheet",
      body: "Jump to any scene or song from your bookmarks, and review every cue in the cue sheet — which exports to CSV for the booth.",
      placement: "left",
    },
    {
      anchor: "script-pagenav",
      title: "Navigate & zoom",
      body: "Move between pages here, and zoom to fit the whole page or in close on the detail you're marking.",
      placement: "bottom",
    },
  ],
};

const TOURS: TourDefinition[] = [
  DASHBOARD_TOUR,
  PRODUCTIONS_TOUR,
  PRODUCTION_HUB_TOUR,
  BLOCKING_TOUR,
  SCRIPT_TOUR,
];

/** All tours that can be replayed from Settings, in display order. */
export const REPLAYABLE_TOURS = TOURS.map((t) => ({
  key: t.key,
  label: t.label,
}));

/** Every screen-tour key. */
export const ALL_TOUR_KEYS = TOURS.map((t) => t.key);

/**
 * Marker key for the one-time "Want a quick tour?" welcome prompt shown on the
 * first dashboard visit. Stored alongside the screen-tour keys in
 * `tours_seen`, but it gates the choice modal rather than a tour.
 */
export const INTRO_KEY = "intro";

/**
 * Picks the tour for a given pathname, or null if the screen has none.
 * `/productions` (the list) and `/productions/<slug>` (a show hub) are
 * distinct tours; the blocking and script tools — sub-routes of a hub — get
 * their own; `/productions/new` (the wizard) has none.
 */
export function resolveTour(pathname: string): TourDefinition | null {
  if (pathname === "/dashboard") return DASHBOARD_TOUR;
  if (pathname === "/productions") return PRODUCTIONS_TOUR;
  if (pathname === "/productions/new") return null;
  if (pathname.startsWith("/productions/")) {
    if (/^\/productions\/[^/]+\/blocking(\/|$)/.test(pathname))
      return BLOCKING_TOUR;
    if (/^\/productions\/[^/]+\/script(\/|$)/.test(pathname))
      return SCRIPT_TOUR;
    return PRODUCTION_HUB_TOUR;
  }
  return null;
}
