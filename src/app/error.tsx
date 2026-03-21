"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 py-8">
      <h2 className="font-[family-name:var(--font-unica)] text-xl text-fg">Something went wrong</h2>
      <p className="text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={reset}
        className="px-4 py-2 border border-pink text-pink rounded text-sm font-[family-name:var(--font-unica)] hover:bg-pink hover:text-bg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
