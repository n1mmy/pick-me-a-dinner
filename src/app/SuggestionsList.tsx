"use client";

import { useState, useRef, useTransition } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import {
  fetchMoreSuggestions,
  quickConfirmDinner,
  type Suggestion,
} from "@/app/actions/dinners";

interface Props {
  restaurantCandidates: Suggestion[];
  mealCandidates: Suggestion[];
  todayStr: string;
  activeTag: string | null;
}

export function SuggestionsList({
  restaurantCandidates: initialRestaurants,
  mealCandidates: initialMeals,
  todayStr,
  activeTag,
}: Props) {
  const [allRestaurants, setAllRestaurants] = useState<Suggestion[]>(initialRestaurants);
  const [allMeals, setAllMeals] = useState<Suggestion[]>(initialMeals);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);

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

  const confirm = (s: Suggestion) => {
    setError(null);
    setPickingId(s.id);
    startTransition(async () => {
      const result = await quickConfirmDinner({ date: todayStr, type: s.type, id: s.id });
      if ("error" in result) {
        setError(result.error);
        setPickingId(null);
      }
      // On success, Next.js auto-refreshes the route and page.tsx renders
      // the "Tonight" block with Edit + Delete (the inline Undo).
    });
  };

  const matchesTag = (s: Suggestion) =>
    !activeTag || s.tagsWithRecency.some((t) => t.tag === activeTag);

  const visibleRestaurants = allRestaurants
    .filter((s) => !rejectedIds.includes(s.id) && matchesTag(s))
    .slice(0, 3);
  const visibleMeals = allMeals
    .filter((s) => !rejectedIds.includes(s.id) && matchesTag(s))
    .slice(0, 2);

  if (!isFetching && visibleRestaurants.length === 0 && visibleMeals.length === 0) {
    return (
      <div className="space-y-3">
        {activeTag && (
          <ActiveTagBanner tag={activeTag} />
        )}
        <p className="text-sm text-muted py-2">
          No {activeTag ? `#${activeTag} ` : ""}suggestions —{" "}
          <LoadingLink
            href={`/add?date=${todayStr}`}
            className="text-pink hover:text-fg transition-colors"
          >
            choose yourself
          </LoadingLink>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activeTag && <ActiveTagBanner tag={activeTag} />}
      {error && (
        <p role="alert" className="text-sm text-pink bg-pink/10 rounded px-3 py-2">
          {error}
        </p>
      )}
      {(visibleRestaurants.length > 0 ||
        (isFetching && allRestaurants.filter((s) => !rejectedIds.includes(s.id) && matchesTag(s)).length === 0)) && (
        <section aria-label="Restaurant suggestions">
          <p className="font-display text-sm text-muted mb-3">Restaurants</p>
          {visibleRestaurants.length > 0 ? (
            <ul>
              {visibleRestaurants.map((s) => (
                <SuggestionRow
                  key={s.id}
                  s={s}
                  verb="ordered"
                  onConfirm={() => confirm(s)}
                  onReject={() => reject(s.id)}
                  isPicking={pickingId === s.id && pending}
                  disabled={pending}
                />
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted animate-pulse py-1">Finding more…</p>
          )}
        </section>
      )}
      {(visibleMeals.length > 0 ||
        (isFetching && allMeals.filter((s) => !rejectedIds.includes(s.id) && matchesTag(s)).length === 0)) && (
        <section aria-label="Homecooked suggestions">
          <p className="font-display text-sm text-muted mb-3">Homecooked</p>
          {visibleMeals.length > 0 ? (
            <ul>
              {visibleMeals.map((s) => (
                <SuggestionRow
                  key={s.id}
                  s={s}
                  verb="cooked"
                  onConfirm={() => confirm(s)}
                  onReject={() => reject(s.id)}
                  isPicking={pickingId === s.id && pending}
                  disabled={pending}
                />
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted animate-pulse py-1">Finding more…</p>
          )}
        </section>
      )}
    </div>
  );
}

function ActiveTagBanner({ tag }: { tag: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted">Showing</span>
      <span className="inline-flex items-center gap-2 px-2 py-0.5 bg-teal/20 text-teal rounded">
        #{tag}
        <LoadingLink
          href="/"
          aria-label="Clear tag filter"
          className="text-teal hover:text-pink -mr-1 px-1 font-mono text-base leading-none"
        >
          ×
        </LoadingLink>
      </span>
    </div>
  );
}

interface RowProps {
  s: Suggestion;
  verb: "ordered" | "cooked";
  onConfirm: () => void;
  onReject: () => void;
  isPicking: boolean;
  disabled: boolean;
}

function SuggestionRow({ s, verb, onConfirm, onReject, isPicking, disabled }: RowProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const recencyLabel =
    s.daysSinceLastOrder === null
      ? `never ${verb}`
      : s.daysSinceLastOrder === 0
      ? `last ${verb} today`
      : s.daysSinceLastOrder === 1
      ? `last ${verb} yesterday`
      : `last ${verb} ${s.daysSinceLastOrder} days ago`;

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (reduceMotion) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isSwiping && Math.abs(dy) > Math.abs(dx)) {
      touchStartX.current = null;
      return;
    }
    if (dx < 0) {
      setIsSwiping(true);
      setDragX(Math.max(dx, -160));
    }
  };
  const handleTouchEnd = () => {
    if (dragX < -80) {
      onReject();
    }
    setDragX(0);
    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <li
      className="relative border-b border-dashed border-muted/30 overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Swipe reveal label */}
      <div
        className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-display text-pink pointer-events-none"
        aria-hidden="true"
        style={{ opacity: Math.min(Math.abs(dragX) / 80, 1) }}
      >
        Skip →
      </div>
      <div
        className="py-3 flex items-center justify-between group hover:bg-surface-raised -mx-2 px-2 rounded transition-colors duration-150 bg-bg"
        style={{
          transform: dragX ? `translateX(${dragX}px)` : undefined,
          transition: isSwiping ? "none" : "transform 200ms",
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-fg">{s.name}</p>
          <p className="text-xs text-muted">{recencyLabel}</p>
          {s.entityNotes && <p className="text-xs text-muted mt-1 italic">{s.entityNotes}</p>}
          {s.lastNotes && (
            <p className="text-xs text-muted/70 mt-1 italic">&ldquo;{s.lastNotes}&rdquo;</p>
          )}
          {s.tagsWithRecency.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {s.tagsWithRecency.map(({ tag, daysSince }) => (
                <LoadingLink
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  aria-label={`Filter by #${tag}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal/15 text-teal rounded text-xs hover:bg-teal/25 hover:text-fg transition-colors"
                >
                  #{tag}
                  <span className="text-muted text-[10px]">
                    {daysSince === null
                      ? "never"
                      : daysSince === 0
                      ? "today"
                      : daysSince === 1
                      ? "yesterday"
                      : `${daysSince}d`}
                  </span>
                </LoadingLink>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-start gap-2 shrink-0 ml-3">
          {s.phoneNumber && (
            <a
              href={`tel:${s.phoneNumber}`}
              aria-label={`Call ${s.name}`}
              className="min-h-11 inline-flex items-center px-2 text-xs text-muted hover:text-pink transition-colors"
            >
              Call
            </a>
          )}
          {s.orderUrl && (
            <a
              href={s.orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Order from ${s.name} (opens in new tab)`}
              className="min-h-11 inline-flex items-center px-2 text-xs text-teal hover:text-fg transition-colors"
            >
              Order ↗
            </a>
          )}
          <div className="flex flex-col items-stretch gap-1">
            <button
              type="button"
              onClick={onConfirm}
              disabled={disabled}
              aria-label={`Pick ${s.name} for tonight`}
              className="min-h-11 inline-flex items-center justify-center px-3 py-1 border border-pink text-pink rounded text-sm font-display hover:bg-pink hover:text-bg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPicking ? "…" : "Pick →"}
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={disabled}
              aria-label={`Skip ${s.name}`}
              className="min-h-11 px-3 py-1 text-xs text-muted hover:text-pink cursor-pointer transition-colors rounded disabled:opacity-50"
            >
              Not tonight
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
