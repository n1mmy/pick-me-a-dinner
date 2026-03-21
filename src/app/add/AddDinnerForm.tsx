"use client";

import { useState } from "react";
import { createDinner, updateDinner } from "@/app/actions/dinners";
import { createRestaurantAndReturn } from "@/app/actions/restaurants";
import { createMealAndReturn } from "@/app/actions/meals";
import { SubmitButton } from "@/components/SubmitButton";

type Restaurant = { id: string; name: string };
type Meal = { id: string; name: string };

const inputCls = "w-full border border-muted/40 rounded px-3 py-2 text-sm bg-surface text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-teal";

export function AddDinnerForm({
  date,
  dinnerId,
  restaurants,
  meals,
  initialType,
  initialSelectedId,
  existingNotes,
}: {
  date: string;
  dinnerId: string | null;
  restaurants: Restaurant[];
  meals: Meal[];
  initialType: "RESTAURANT" | "HOMECOOKED";
  initialSelectedId: string | null;
  existingNotes: string | null;
}) {
  const [type, setType] = useState<"RESTAURANT" | "HOMECOOKED">(initialType);

  const options = type === "RESTAURANT" ? restaurants : meals;
  const defaultId = initialSelectedId
    ? options.find((o) => o.id === initialSelectedId)?.id ?? options[0]?.id ?? ""
    : options[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-unica)] text-2xl text-fg">Set dinner</h1>
        <hr className="border-0 border-b-[3px] border-dashed border-pink w-1/4 mt-1" />
      </div>

      <form action={dinnerId ? updateDinner : createDinner} className="space-y-4">
        {dinnerId
          ? <input type="hidden" name="id" value={dinnerId} />
          : <input type="date" name="date" defaultValue={date} required className={inputCls} />
        }
        <input type="hidden" name="type" value={type} />

        {/* Type toggle */}
        <div className="flex rounded overflow-hidden w-fit border border-muted/30">
          <button
            type="button"
            onClick={() => setType("RESTAURANT")}
            className={`px-4 py-2 text-sm font-[family-name:var(--font-unica)] transition-colors ${
              type === "RESTAURANT"
                ? "bg-pink text-white"
                : "bg-surface text-muted hover:text-fg"
            }`}
          >
            Restaurant
          </button>
          <button
            type="button"
            onClick={() => setType("HOMECOOKED")}
            className={`px-4 py-2 text-sm font-[family-name:var(--font-unica)] border-l border-muted/30 transition-colors ${
              type === "HOMECOOKED"
                ? "bg-pink text-white"
                : "bg-surface text-muted hover:text-fg"
            }`}
          >
            Homecooked
          </button>
        </div>

        {/* Picker */}
        {options.length === 0 ? (
          <p className="text-sm text-muted">
            No {type === "RESTAURANT" ? "restaurants" : "meals"} yet. Add one below.
          </p>
        ) : (
          <div>
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">
              {type === "RESTAURANT" ? "Restaurant" : "Meal"}
            </label>
            <select
              key={type}
              name={type === "RESTAURANT" ? "restaurantId" : "mealId"}
              defaultValue={defaultId}
              className={inputCls}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Notes</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={existingNotes ?? ""}
            placeholder="Optional notes"
            className={inputCls}
          />
        </div>

        <SubmitButton
          disabled={options.length === 0}
          className="px-5 py-2 bg-teal text-white rounded text-sm font-[family-name:var(--font-unica)] hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          Save dinner
        </SubmitButton>
      </form>

      {/* Inline create */}
      <details className="border-t border-dashed border-muted/30 pt-4">
        <summary className="cursor-pointer text-sm text-teal hover:text-pink transition-colors">
          + Add new {type === "RESTAURANT" ? "restaurant" : "meal"}
        </summary>
        <form
          action={type === "RESTAURANT" ? createRestaurantAndReturn : createMealAndReturn}
          className="mt-3 space-y-2"
        >
          <input type="hidden" name="returnDate" value={date} />
          {dinnerId && <input type="hidden" name="returnDinnerId" value={dinnerId} />}
          <input
            name="name"
            required
            placeholder={`${type === "RESTAURANT" ? "Restaurant" : "Meal"} name *`}
            className={inputCls}
          />
          {type === "RESTAURANT" && (
            <>
              <input name="phoneNumber" placeholder="Phone number" className={inputCls} />
              <input name="orderUrl" placeholder="Order URL" className={inputCls} />
              <input name="menuUrl" placeholder="Menu URL" className={inputCls} />
            </>
          )}
          <SubmitButton className="px-4 py-2 bg-surface text-fg rounded text-sm hover:opacity-80 transition-opacity cursor-pointer border border-muted/30">
            Add
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
