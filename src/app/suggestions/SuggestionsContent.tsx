"use client";

import { useState, useMemo } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import type { Suggestion } from "@/app/actions/dinners";

function daysSinceLabel(n: number | null, verb: "ordered" | "cooked") {
  if (n === null) return `never ${verb}`;
  if (n === 0) return `last ${verb} today`;
  if (n === 1) return `last ${verb} yesterday`;
  return `last ${verb} ${n} days ago`;
}

type TagFilter = { mode: "only" | "exclude"; tag: string };
type Tab = "restaurants" | "meals";

interface Props {
  restaurantCandidates: Suggestion[];
  mealCandidates: Suggestion[];
  todayStr: string;
}

export function SuggestionsContent({
  restaurantCandidates,
  mealCandidates,
  todayStr,
}: Props) {
  const [tab, setTab] = useState<Tab>("restaurants");
  const [tagFilter, setTagFilter] = useState<TagFilter | null>(null);

  const items = tab === "restaurants" ? restaurantCandidates : mealCandidates;
  const verb = tab === "restaurants" ? "ordered" : "cooked";

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((s) => s.tagsWithRecency.forEach((t) => tagSet.add(t.tag)));
    return [...tagSet].sort();
  }, [items]);

  const handleTagClick = (tag: string) => {
    setTagFilter((prev) => {
      if (prev?.tag === tag) {
        if (prev.mode === "only") return { mode: "exclude", tag };
        return null;
      }
      return { mode: "only", tag };
    });
  };

  const visible = useMemo(() => {
    if (!tagFilter) return items;
    if (tagFilter.mode === "only")
      return items.filter((s) => s.tagsWithRecency.some((t) => t.tag === tagFilter.tag));
    return items.filter((s) => !s.tagsWithRecency.some((t) => t.tag === tagFilter.tag));
  }, [items, tagFilter]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex rounded overflow-hidden w-fit border border-muted/30">
        <button
          onClick={() => { setTab("restaurants"); setTagFilter(null); }}
          className={`px-4 py-2 text-sm font-display transition-colors cursor-pointer ${
            tab === "restaurants"
              ? "bg-pink text-white"
              : "bg-surface text-muted hover:text-fg"
          }`}
        >
          Restaurants
        </button>
        <button
          onClick={() => { setTab("meals"); setTagFilter(null); }}
          className={`px-4 py-2 text-sm font-display border-l border-muted/30 transition-colors cursor-pointer ${
            tab === "meals"
              ? "bg-pink text-white"
              : "bg-surface text-muted hover:text-fg"
          }`}
        >
          Meals
        </button>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted mr-1">Filter:</span>
          {allTags.map((tag) => {
            const state = tagFilter?.tag === tag ? tagFilter.mode : null;
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                title={state === "only" ? "Click to exclude" : state === "exclude" ? "Click to clear" : "Click to filter to this tag"}
                className={
                  state === "only"
                    ? "inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer bg-teal text-bg"
                    : state === "exclude"
                    ? "inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer bg-pink/15 text-pink line-through"
                    : "inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer bg-teal/15 text-teal hover:bg-teal/30 transition-colors"
                }
              >
                #{tag}
              </button>
            );
          })}
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              className="text-xs text-muted/60 hover:text-pink transition-colors ml-1 cursor-pointer"
            >
              clear ×
            </button>
          )}
        </div>
      )}

      {/* List */}
      {visible.length > 0 ? (
        <ul>
          {visible.map((s) => (
            <li key={s.id} className="border-b border-dashed border-muted/30 py-3 flex items-center justify-between group hover:bg-surface-raised -mx-2 px-2 rounded transition-colors duration-150">
              <LoadingLink
                href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                className="flex-1 min-w-0"
              >
                <p className="text-sm text-fg">{s.name}</p>
                <p className="text-xs text-muted">{daysSinceLabel(s.daysSinceLastOrder, verb)}</p>
                {s.entityNotes && (
                  <p className="text-xs text-muted mt-1 italic">{s.entityNotes}</p>
                )}
                {s.lastNotes && (
                  <p className="text-xs text-muted/70 mt-1 italic">&ldquo;{s.lastNotes}&rdquo;</p>
                )}
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
              <div className="flex items-start gap-3 shrink-0 ml-4">
                {s.phoneNumber && (
                  <a href={`tel:${s.phoneNumber}`} className="text-xs text-muted hover:text-pink transition-colors mt-[7px]">Call</a>
                )}
                {s.orderUrl && (
                  <a href={s.orderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:text-fg transition-colors mt-[7px]">
                    Order ↗
                  </a>
                )}
                <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="inline-block px-3 py-1 border border-pink text-pink rounded text-sm font-display hover:bg-pink hover:text-bg transition-colors">
                  Pick →
                </LoadingLink>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-sm">
          {tagFilter
            ? `No ${tab} match ${tagFilter.mode === "only" ? `#${tagFilter.tag}` : `(excluding #${tagFilter.tag})`}.`
            : `No ${tab} added yet.`}
        </p>
      )}
    </div>
  );
}
