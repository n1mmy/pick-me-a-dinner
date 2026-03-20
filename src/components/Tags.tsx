export function Tags({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-block px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded text-xs font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
