"use client";

import { useState } from "react";
import { LoadingLink } from "@/components/LoadingLink";

type TagWithRecency = { tag: string; daysSince: number | null };
type Suggestion = {
  type: "RESTAURANT" | "HOMECOOKED";
  id: string;
  name: string;
  tagsWithRecency: TagWithRecency[];
  orderUrl: string | null;
  phoneNumber: string | null;
  daysSinceLastOrder: number | null;
  score: number;
};

interface Props {
  restaurantCandidates: Suggestion[];
  mealCandidates: Suggestion[];
  todayStr: string;
}

export function SuggestionsList({ restaurantCandidates, mealCandidates, todayStr }: Props) {
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  const reject = (id: string) => setRejectedIds((prev) => [...prev, id]);

  const visibleRestaurants = restaurantCandidates.filter((s) => !rejectedIds.includes(s.id)).slice(0, 3);
  const visibleMeals = mealCandidates.filter((s) => !rejectedIds.includes(s.id)).slice(0, 2);

  if (visibleRestaurants.length === 0 && visibleMeals.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">No more suggestions — <LoadingLink href={`/add?date=${todayStr}`} className="text-indigo-500 hover:underline">choose yourself</LoadingLink>.</p>
    );
  }

  return (
    <div className="space-y-4">
      {visibleRestaurants.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1">Restaurants</p>
          <ul className="space-y-2">
            {visibleRestaurants.map((s) => (
              <li key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all">
                <LoadingLink
                  href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400">
                    {s.daysSinceLastOrder === null
                      ? "never ordered"
                      : s.daysSinceLastOrder === 0
                      ? "last ordered today"
                      : s.daysSinceLastOrder === 1
                      ? "last ordered yesterday"
                      : `last ordered ${s.daysSinceLastOrder} days ago`}
                  </p>
                  {s.tagsWithRecency.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.tagsWithRecency.map(({ tag, daysSince }) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">
                          {tag}
                          <span className="text-indigo-400 font-normal">
                            {daysSince === null ? "never" : daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince}d ago`}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </LoadingLink>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {s.phoneNumber && (
                    <a href={`tel:${s.phoneNumber}`} className="text-xs text-gray-500 hover:underline">Call</a>
                  )}
                  {s.orderUrl && (
                    <a href={s.orderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                      Order ↗
                    </a>
                  )}
                  <button
                    onClick={() => reject(s.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    No thanks
                  </button>
                  <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="text-sm text-indigo-600 font-medium">
                    Choose →
                  </LoadingLink>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {visibleMeals.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1">Homecooked</p>
          <ul className="space-y-2">
            {visibleMeals.map((s) => (
              <li key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all">
                <LoadingLink
                  href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400">
                    {s.daysSinceLastOrder === null
                      ? "never cooked"
                      : s.daysSinceLastOrder === 0
                      ? "last cooked today"
                      : s.daysSinceLastOrder === 1
                      ? "last cooked yesterday"
                      : `last cooked ${s.daysSinceLastOrder} days ago`}
                  </p>
                  {s.tagsWithRecency.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.tagsWithRecency.map(({ tag, daysSince }) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">
                          {tag}
                          <span className="text-indigo-400 font-normal">
                            {daysSince === null ? "never" : daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince}d ago`}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </LoadingLink>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <button
                    onClick={() => reject(s.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    No thanks
                  </button>
                  <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="text-sm text-indigo-600 font-medium">
                    Choose →
                  </LoadingLink>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
