"use client";

import { useState } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import type { Suggestion } from "@/app/actions/dinners";

function daysSinceLabel(n: number | null, verb: "ordered" | "cooked") {
  if (n === null) return `never ${verb}`;
  if (n === 0) return `last ${verb} today`;
  if (n === 1) return `last ${verb} yesterday`;
  return `last ${verb} ${n} days ago`;
}

export function SuggestionsPageList({
  suggestions,
  verb,
  todayStr,
}: {
  suggestions: Suggestion[];
  verb: "ordered" | "cooked";
  todayStr: string;
}) {
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const visible = suggestions.filter((s) => !rejectedIds.includes(s.id));

  if (visible.length === 0) return null;

  return (
    <ul>
      {visible.map((s) => (
        <li key={s.id} className="border-b border-dashed border-muted/30 py-3 flex items-center justify-between group hover:bg-surface/50 -mx-2 px-2 rounded transition-colors duration-150">
          <LoadingLink
            href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
            className="flex-1 min-w-0"
          >
            <p className="text-sm text-fg">{s.name}</p>
            <p className="text-xs text-muted">{daysSinceLabel(s.daysSinceLastOrder, verb)}</p>
            {s.tagsWithRecency.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {s.tagsWithRecency.map(({ tag, daysSince }) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal/15 text-teal rounded text-xs">
                    #{tag}
                    <span className="text-muted text-[10px]">
                      {daysSince === null ? "never" : daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince}d`}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </LoadingLink>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {s.phoneNumber && (
              <a href={`tel:${s.phoneNumber}`} className="text-xs text-muted hover:text-pink transition-colors">Call</a>
            )}
            {s.orderUrl && (
              <a href={s.orderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:text-fg transition-colors">
                Order ↗
              </a>
            )}
            <button
              onClick={() => setRejectedIds((prev) => [...prev, s.id])}
              className="text-xs text-muted/60 hover:text-pink cursor-pointer transition-colors"
            >
              Nah
            </button>
            <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="text-sm text-pink hover:text-fg font-[family-name:var(--font-unica)] transition-colors">
              Pick →
            </LoadingLink>
          </div>
        </li>
      ))}
    </ul>
  );
}
