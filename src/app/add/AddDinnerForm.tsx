"use client";

import { useState } from "react";
import { createDinner, updateDinner } from "@/app/actions/dinners";
import { createRestaurantAndReturn } from "@/app/actions/restaurants";
import { createMealAndReturn } from "@/app/actions/meals";
import { SubmitButton } from "@/components/SubmitButton";

type Restaurant = { id: string; name: string };
type Meal = { id: string; name: string };


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

      <form action={dinnerId ? updateDinner : createDinner} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        {dinnerId
          ? <input type="hidden" name="id" value={dinnerId} />
          : <input type="date" name="date" defaultValue={date} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        }
        <input type="hidden" name="type" value={type} />

        {/* Type toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => setType("RESTAURANT")}
            className={`px-4 py-2 text-sm font-medium ${
              type === "RESTAURANT"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Restaurant
          </button>
          <button
            type="button"
            onClick={() => setType("HOMECOOKED")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${
              type === "HOMECOOKED"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Homecooked
          </button>
        </div>

        {/* Picker */}
        {options.length === 0 ? (
          <p className="text-sm text-gray-400">
            No {type === "RESTAURANT" ? "restaurants" : "meals"} yet. Add one below.
          </p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === "RESTAURANT" ? "Restaurant" : "Meal"}
            </label>
            <select
              name={type === "RESTAURANT" ? "restaurantId" : "mealId"}
              defaultValue={defaultId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={existingNotes ?? ""}
            placeholder="Optional notes"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
      <details className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {type === "RESTAURANT" && (
            <>
              <input
                name="phoneNumber"
                placeholder="Phone number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                name="orderUrl"
                placeholder="Order URL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </>
          )}
          <SubmitButton
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Add
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
