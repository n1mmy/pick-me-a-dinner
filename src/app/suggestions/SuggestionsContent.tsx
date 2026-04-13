"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import { fetchMoreSuggestions, type Suggestion } from "@/app/actions/dinners";

function daysSinceLabel(n: number | null, verb: "ordered" | "cooked") {
  if (n === null) return `never ${verb}`;
  if (n === 0) return `last ${verb} today`;
  if (n === 1) return `last ${verb} yesterday`;
  return `last ${verb} ${n} days ago`;
}

type TagFilter = { mode: "only" | "exclude"; tag: string };

interface Props {
  restaurantCandidates: Suggestion[];
  mealCandidates: Suggestion[];
  todayStr: string;
}

export function SuggestionsContent({
  restaurantCandidates: initialRestaurants,
  mealCandidates: initialMeals,
  todayStr,
}: Props) {
  const [allRestaurants, setAllRestaurants] = useState<Suggestion[]>(initialRestaurants);
  const [allMeals, setAllMeals] = useState<Suggestion[]>(initialMeals);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [tagFilter, setTagFilter] = useState<TagFilter | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    [...allRestaurants, ...allMeals].forEach((s) =>
      s.tagsWithRecency.forEach((t) => tagSet.add(t.tag))
    );
    return [...tagSet].sort();
  }, [allRestaurants, allMeals]);

  const handleTagClick = (tag: string) => {
    setTagFilter((prev) => {
      if (prev?.tag === tag) {
        if (prev.mode === "only") return { mode: "exclude", tag };
        return null;
      }
      return { mode: "only", tag };
    });
  };

  const applyTagFilter = (suggestions: Suggestion[]) => {
    if (!tagFilter) return suggestions;
    if (tagFilter.mode === "only")
      return suggestions.filter((s) => s.tagsWithRecency.some((t) => t.tag === tagFilter.tag));
    return suggestions.filter((s) => !s.tagsWithRecency.some((t) => t.tag === tagFilter.tag));
  };

  const reject = async (id: string) => {
    const newRejected = [...rejectedIds, id];
    setRejectedIds(newRejected);

    const remainingR = allRestaurants.filter((s) => !newRejected.includes(s.id)).length;
    const remainingM = allMeals.filter((s) => !newRejected.includes(s.id)).length;

    if (remainingR === 0 || remainingM === 0) {
      setIsFetching(true);
      const allKnownIds = [...allRestaurants, ...allMeals].map((s) => s.id);
      const more = await fetchMoreSuggestions(allKnownIds);
      if (!mountedRef.current) return;
      setAllRestaurants((prev) => [...prev, ...more.restaurantCandidates]);
      setAllMeals((prev) => [...prev, ...more.mealCandidates]);
      setIsFetching(false);
    }
  };

  const visibleRestaurants = applyTagFilter(allRestaurants.filter((s) => !rejectedIds.includes(s.id))).slice(0, 5);
  const visibleMeals = applyTagFilter(allMeals.filter((s) => !rejectedIds.includes(s.id))).slice(0, 3);

  return (
    <div className="space-y-6">
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
              className="text-xs text-muted/60 hover:text-pink transition-colors ml-1"
            >
              clear ×
            </button>
          )}
        </div>
      )}
      {(visibleRestaurants.length > 0 || (isFetching && allRestaurants.filter((s) => !rejectedIds.includes(s.id)).length === 0)) && (
        <section className="space-y-1">
          <p className="font-display text-sm text-muted">Restaurants</p>
          {visibleRestaurants.length > 0 ? (
            <ul>
              {visibleRestaurants.map((s) => (
                <li key={s.id} className="border-b border-dashed border-muted/30 py-3 flex items-center justify-between group hover:bg-surface-raised -mx-2 px-2 rounded transition-colors duration-150">
                  <LoadingLink
                    href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm text-fg">{s.name}</p>
                    <p className="text-xs text-muted">{daysSinceLabel(s.daysSinceLastOrder, "ordered")}</p>
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
                    <div className="flex flex-col items-center gap-1.5">
                      <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="inline-block px-3 py-1 border border-pink text-pink rounded text-sm font-display hover:bg-pink hover:text-bg transition-colors">
                        Pick →
                      </LoadingLink>
                      <button
                        onClick={() => reject(s.id)}
                        className="text-xs text-muted/60 hover:text-pink cursor-pointer transition-colors"
                      >
                        Nah
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted animate-pulse py-1">Finding more…</p>
          )}
        </section>
      )}

      {(visibleMeals.length > 0 || (isFetching && allMeals.filter((s) => !rejectedIds.includes(s.id)).length === 0)) && (
        <section className="space-y-1">
          <p className="font-display text-sm text-muted">Homecooked</p>
          {visibleMeals.length > 0 ? (
            <ul>
              {visibleMeals.map((s) => (
                <li key={s.id} className="border-b border-dashed border-muted/30 py-3 flex items-center justify-between group hover:bg-surface-raised -mx-2 px-2 rounded transition-colors duration-150">
                  <LoadingLink
                    href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm text-fg">{s.name}</p>
                    <p className="text-xs text-muted">{daysSinceLabel(s.daysSinceLastOrder, "cooked")}</p>
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
                    <div className="flex flex-col items-center gap-1.5">
                      <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="inline-block px-3 py-1 border border-pink text-pink rounded text-sm font-display hover:bg-pink hover:text-bg transition-colors">
                        Pick →
                      </LoadingLink>
                      <button
                        onClick={() => reject(s.id)}
                        className="text-xs text-muted/60 hover:text-pink cursor-pointer transition-colors"
                      >
                        Nah
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted animate-pulse py-1">Finding more…</p>
          )}
        </section>
      )}

      {!isFetching && visibleRestaurants.length === 0 && visibleMeals.length === 0 && (
        <p className="text-muted text-sm">
          {tagFilter
            ? `No suggestions match ${tagFilter.mode === "only" ? `#${tagFilter.tag}` : `(excluding #${tagFilter.tag})`}.`
            : "No restaurants or meals added yet."}
        </p>
      )}
    </div>
  );
}
