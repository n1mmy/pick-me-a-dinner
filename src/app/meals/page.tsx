export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createMeal, updateMeal, deleteMeal } from "@/app/actions/meals";

export default async function MealsPage() {
  const meals = await prisma.meal.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { dinners: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Homecooked meals</h1>

      {/* Add form */}
      <form action={createMeal} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-medium text-gray-700">Add meal</h2>
        <input
          name="name"
          required
          placeholder="Name *"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Add
        </button>
      </form>

      {/* List */}
      {meals.length === 0 ? (
        <p className="text-gray-400 text-sm">No meals yet.</p>
      ) : (
        <ul className="space-y-2">
          {meals.map((m) => (
            <li key={m.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-400">
                    {m._count.dinners} dinner{m._count.dinners !== 1 ? "s" : ""}
                  </p>
                  {m.notes && <p className="text-xs text-gray-400 mt-0.5">{m.notes}</p>}
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteMeal(m.id);
                  }}
                >
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </form>
              </div>
              <details>
                <summary className="cursor-pointer text-xs text-indigo-500 hover:text-indigo-700">Edit</summary>
                <form action={updateMeal} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    name="name"
                    required
                    defaultValue={m.name}
                    placeholder="Name *"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <textarea
                    name="notes"
                    defaultValue={m.notes ?? ""}
                    placeholder="Notes"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
