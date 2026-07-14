/**
 * Single source of truth for the drawer's motion **duration**.
 *
 * This one number drives both sides of the animation:
 *  - JS: how long <Drawer> keeps the panel mounted after `open` flips to false,
 *    so the exit transition can finish before the node is removed.
 *  - CSS: injected onto the drawer root as the `--drawer-dur` custom property,
 *    so the actual transition runs for exactly this long.
 *
 * Change it here and every drawer rendered through <Drawer> updates in lockstep.
 * The easing curve, slide distance, backdrop tint, and bottom-sheet behaviour
 * are the other half of the story and live as CSS variables in `drawer.css` —
 * retune those in one place too.
 */
export const DRAWER_DURATION_MS = 220;
