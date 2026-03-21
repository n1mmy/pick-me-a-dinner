export function Tags({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-block px-1.5 py-0.5 bg-teal/15 text-teal rounded text-xs"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
