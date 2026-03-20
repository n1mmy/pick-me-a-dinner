export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createMeal, updateMeal, deleteMeal, hideMeal, unhideMeal } from "@/app/actions/meals";
import { SubmitButton } from "@/components/SubmitButton";
import { Tags } from "@/components/Tags";
import { CollapsingForm } from "@/components/CollapsingForm";
import Link from "next/link";

const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400";

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
      <form action={createMeal} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
        <h2 className="font-medium text-gray-700 dark:text-gray-300">Add meal</h2>
        <input name="name" required placeholder="Name *" className={inputCls} />
        <textarea name="notes" placeholder="Notes" rows={2} className={inputCls} />
        <input name="tags" placeholder="Tags (comma-separated, e.g. pasta, quick)" className={inputCls} />
        <SubmitButton className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Add
        </SubmitButton>
      </form>

      {/* List */}
      {meals.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">No meals yet.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
          {meals.map((m) => (
            <details key={m.id} className="group">
              <summary className="list-none flex items-center gap-3 px-4 py-2.5 cursor-default">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{m.name}</span>
                    <span className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer">Edit <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span></span>
                  </div>
                  <Tags tags={m.tags} className="mt-0.5" />
                  {m.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{m.notes}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-gray-400 dark:text-gray-500 tabular-nums">{m._count.dinners}×</span>
                </div>
              </summary>
              <div className="px-4 pb-3 space-y-2">
                <CollapsingForm action={updateMeal} className="space-y-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input name="name" required defaultValue={m.name} placeholder="Name *" className={inputCls} />
                  <textarea name="notes" defaultValue={m.notes ?? ""} placeholder="Notes" rows={2} className={inputCls} />
                  <input name="tags" defaultValue={m.tags.join(", ")} placeholder="Tags (comma-separated)" className={inputCls} />
                  <SubmitButton className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Save
                  </SubmitButton>
                </CollapsingForm>
                {m._count.dinners > 0 ? (
                  <form action={hideMeal.bind(null, m.id)}>
                    <SubmitButton className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                      Hide
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={deleteMeal.bind(null, m.id)}>
                    <SubmitButton className="text-xs text-red-400 hover:text-red-600">
                      Delete
                    </SubmitButton>
                  </form>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Show hidden toggle */}
      <div className="text-center">
        <Link
          href={showingHidden ? "/meals" : "/meals?showHidden=1"}
          scroll={false}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showingHidden ? "Hide hidden meals" : "Show hidden meals"}
        </Link>
      </div>

      {/* Hidden meals */}
      {showingHidden && hiddenMeals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Hidden</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            {hiddenMeals.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-gray-400 dark:text-gray-500">{m.name}</span>
                  <Tags tags={m.tags} className="mt-0.5" />
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-gray-300 dark:text-gray-600 tabular-nums">{m._count.dinners}×</span>
                  <form action={unhideMeal.bind(null, m.id)}>
                    <SubmitButton className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                      Unhide
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showingHidden && hiddenMeals.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center">No hidden meals.</p>
      )}
    </div>
  );
}
