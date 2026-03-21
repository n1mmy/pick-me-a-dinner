"use client";

import { useState } from "react";
import { createDinner, updateDinner } from "@/app/actions/dinners";
import { createRestaurantAndReturn } from "@/app/actions/restaurants";
import { createMealAndReturn } from "@/app/actions/meals";
import { SubmitButton } from "@/components/SubmitButton";

type Restaurant = { id: string; name: string };
type Meal = { id: string; name: string };

const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400";

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
      <h1 className="text-2xl font-semibold">Set dinner</h1>

      <form action={dinnerId ? updateDinner : createDinner} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
        {dinnerId
          ? <input type="hidden" name="id" value={dinnerId} />
          : <input type="date" name="date" defaultValue={date} required className={inputCls} />
        }
        <input type="hidden" name="type" value={type} />

        {/* Type toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => setType("RESTAURANT")}
            className={`px-4 py-2 text-sm font-medium ${
              type === "RESTAURANT"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Restaurant
          </button>
          <button
            type="button"
            onClick={() => setType("HOMECOOKED")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-200 dark:border-gray-600 ${
              type === "HOMECOOKED"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Homecooked
          </button>
        </div>

        {/* Picker */}
        {options.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No {type === "RESTAURANT" ? "restaurants" : "meals"} yet. Add one below.
          </p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {type === "RESTAURANT" ? "Restaurant" : "Meal"}
            </label>
            <select
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
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
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          Save dinner
        </SubmitButton>
      </form>

      {/* Inline create */}
      <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <input
                name="phoneNumber"
                placeholder="Phone number"
                className={inputCls}
              />
              <input
                name="orderUrl"
                placeholder="Order URL"
                className={inputCls}
              />
              <input
                name="menuUrl"
                placeholder="Menu URL"
                className={inputCls}
              />
            </>
          )}
          <SubmitButton
            className="px-4 py-2 bg-gray-800 dark:bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors"
          >
            Add
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
