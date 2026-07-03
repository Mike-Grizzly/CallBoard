// Structured-data script tag. Data is first-party, statically authored —
// JSON.stringify output inside a script tag only needs `<` escaping to be
// safe, and none of our content contains it, but escape defensively anyway.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
