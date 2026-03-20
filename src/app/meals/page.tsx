export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createMeal, updateMeal, deleteMeal, hideMeal, unhideMeal } from "@/app/actions/meals";
import { SubmitButton } from "@/components/SubmitButton";
import { Tags } from "@/components/Tags";
import Link from "next/link";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ showHidden?: string }>;
}) {
  const { showHidden } = await searchParams;
  const showingHidden = showHidden === "1";

  const [meals, hiddenMeals] = await Promise.all([
    prisma.meal.findMany({
      where: { hidden: false },
      orderBy: { name: "asc" },
      include: { _count: { select: { dinners: true } } },
    }),
    showingHidden
      ? prisma.meal.findMany({
          where: { hidden: true },
          orderBy: { name: "asc" },
          include: { _count: { select: { dinners: true } } },
        })
      : Promise.resolve([]),
  ]);

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
        <input
          name="tags"
          placeholder="Tags (comma-separated, e.g. pasta, quick)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <SubmitButton className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Add
        </SubmitButton>
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
                  <Tags tags={m.tags} className="mt-1" />
                </div>
                {m._count.dinners > 0 ? (
                  <form action={hideMeal.bind(null, m.id)}>
                    <SubmitButton className="text-xs text-gray-400 hover:text-gray-600">
                      Hide
                    </SubmitButton>
                  </form>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await deleteMeal(m.id);
                    }}
                  >
                    <SubmitButton className="text-xs text-red-400 hover:text-red-600">
                      Delete
                    </SubmitButton>
                  </form>
                )}
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
                  <input
                    name="tags"
                    defaultValue={m.tags.join(", ")}
                    placeholder="Tags (comma-separated)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <SubmitButton className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Save
                  </SubmitButton>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}

      {/* Show hidden toggle */}
      <div className="text-center">
        <Link
          href={showingHidden ? "/meals" : "/meals?showHidden=1"}
          scroll={false}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {showingHidden ? "Hide hidden meals" : "Show hidden meals"}
        </Link>
      </div>

      {/* Hidden meals */}
      {showingHidden && hiddenMeals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hidden</h2>
          <ul className="space-y-2">
            {hiddenMeals.map((m) => (
              <li key={m.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-400">{m.name}</p>
                  <p className="text-xs text-gray-300">{m._count.dinners} dinner{m._count.dinners !== 1 ? "s" : ""}</p>
                  <Tags tags={m.tags} className="mt-1" />
                </div>
                <form action={unhideMeal.bind(null, m.id)}>
                  <SubmitButton className="text-xs text-indigo-500 hover:text-indigo-700">
                    Unhide
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
      {showingHidden && hiddenMeals.length === 0 && (
        <p className="text-gray-400 text-sm text-center">No hidden meals.</p>
      )}
    </div>
  );
}
