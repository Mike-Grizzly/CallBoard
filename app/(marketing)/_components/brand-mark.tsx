/**
 * Proscene logo mark — a proscenium-arch silhouette with three marquee slats
 * masked out, drawn in the accent (recolored to --ink in the nav via CSS).
 * Ported from the design handoff's `logoMark()` in site.js. The mask id must
 * be unique per instance so the nav and footer copies don't collide.
 */
export function BrandMark({ id }: { id: string }) {
  return (
    <svg className="brand-logo" viewBox="0 0 240 200" overflow="visible" aria-hidden="true">
      <defs>
        <mask id={id}>
          <rect width="240" height="200" fill="white" />
          <g fill="black" stroke="black" strokeWidth={9} strokeLinejoin="round">
            <polygon points="68,77 172,77 176,87 64,87" />
            <polygon points="56,116 184,116 190,130 50,130" />
            <polygon points="44,155 196,155 204,173 36,173" />
          </g>
        </mask>
      </defs>
      <path
        d="M 30 184 L 30 74 Q 30 24 84 24 L 156 24 Q 210 24 210 74 L 210 184 Z"
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth={12}
        strokeLinejoin="round"
        mask={`url(#${id})`}
      />
    </svg>
  );
}
