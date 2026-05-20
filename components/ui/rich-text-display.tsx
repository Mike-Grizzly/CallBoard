export function RichTextDisplay({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
