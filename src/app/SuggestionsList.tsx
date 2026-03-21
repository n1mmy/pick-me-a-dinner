"use client";

import { useState } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import { fetchMoreSuggestions, type Suggestion } from "@/app/actions/dinners";

interface Props {
  restaurantCandidates: Suggestion[];
  mealCandidates: Suggestion[];
  todayStr: string;
}

export function SuggestionsList({ restaurantCandidates: initialRestaurants, mealCandidates: initialMeals, todayStr }: Props) {
  const [allRestaurants, setAllRestaurants] = useState<Suggestion[]>(initialRestaurants);
  const [allMeals, setAllMeals] = useState<Suggestion[]>(initialMeals);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const reject = async (id: string) => {
    const newRejected = [...rejectedIds, id];
    setRejectedIds(newRejected);

    const remainingR = allRestaurants.filter((s) => !newRejected.includes(s.id)).length;
    const remainingM = allMeals.filter((s) => !newRejected.includes(s.id)).length;

    if (remainingR === 0 || remainingM === 0) {
      setIsFetching(true);
      const allKnownIds = [...allRestaurants, ...allMeals].map((s) => s.id);
      const more = await fetchMoreSuggestions(allKnownIds);
      setAllRestaurants((prev) => [...prev, ...more.restaurantCandidates]);
      setAllMeals((prev) => [...prev, ...more.mealCandidates]);
      setIsFetching(false);
    }
  };

  const visibleRestaurants = allRestaurants.filter((s) => !rejectedIds.includes(s.id)).slice(0, 3);
  const visibleMeals = allMeals.filter((s) => !rejectedIds.includes(s.id)).slice(0, 2);

  if (!isFetching && visibleRestaurants.length === 0 && visibleMeals.length === 0) {
    return (
      <p className="text-sm text-muted py-2">
        No more suggestions —{" "}
        <LoadingLink href={`/add?date=${todayStr}`} className="text-pink hover:text-fg transition-colors">
          choose yourself
        </LoadingLink>
        .
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {(visibleRestaurants.length > 0 || (isFetching && allRestaurants.filter((s) => !rejectedIds.includes(s.id)).length === 0)) && (
        <div>
          <p className="font-display text-sm text-muted mb-3">Restaurants</p>
          {visibleRestaurants.length > 0 ? (
            <ul>
              {visibleRestaurants.map((s) => (
                <li key={s.id} className="border-b border-dashed border-muted/30 py-3 flex items-center justify-between group hover:bg-surface/50 -mx-2 px-2 rounded transition-colors duration-150">
                  <LoadingLink
                    href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm text-fg group-hover:text-fg transition-colors">{s.name}</p>
                    <p className="text-xs text-muted">
                      {s.daysSinceLastOrder === null
                        ? "never ordered"
                        : s.daysSinceLastOrder === 0
                        ? "last ordered today"
                        : s.daysSinceLastOrder === 1
                        ? "last ordered yesterday"
                        : `last ordered ${s.daysSinceLastOrder} days ago`}
                    </p>
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
        </div>
      )}
      {(visibleMeals.length > 0 || (isFetching && allMeals.filter((s) => !rejectedIds.includes(s.id)).length === 0)) && (
        <div>
          <p className="font-display text-sm text-muted mb-3">Homecooked</p>
          {visibleMeals.length > 0 ? (
            <ul>
              {visibleMeals.map((s) => (
                <li key={s.id} className="border-b border-dashed border-muted/30 py-3 flex items-center justify-between group hover:bg-surface/50 -mx-2 px-2 rounded transition-colors duration-150">
                  <LoadingLink
                    href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm text-fg group-hover:text-fg transition-colors">{s.name}</p>
                    <p className="text-xs text-muted">
                      {s.daysSinceLastOrder === null
                        ? "never cooked"
                        : s.daysSinceLastOrder === 0
                        ? "last cooked today"
                        : s.daysSinceLastOrder === 1
                        ? "last cooked yesterday"
                        : `last cooked ${s.daysSinceLastOrder} days ago`}
                    </p>
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
                  <div className="flex items-center gap-3 shrink-0 ml-4">
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
        </div>
      )}
    </div>
  );
}
