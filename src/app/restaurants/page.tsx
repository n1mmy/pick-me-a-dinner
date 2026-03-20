export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createRestaurant, updateRestaurant, deleteRestaurant, hideRestaurant, unhideRestaurant } from "@/app/actions/restaurants";
import { SubmitButton } from "@/components/SubmitButton";
import { Tags } from "@/components/Tags";
import { CollapsingForm } from "@/components/CollapsingForm";
import Link from "next/link";

const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400";
const halfInputCls = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400";

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ showHidden?: string }>;
}) {
  const { showHidden } = await searchParams;
  const showingHidden = showHidden === "1";

  const [restaurants, hiddenRestaurants] = await Promise.all([
    prisma.restaurant.findMany({
      where: { hidden: false },
      orderBy: { name: "asc" },
      include: { _count: { select: { dinners: true } } },
    }),
    showingHidden
      ? prisma.restaurant.findMany({
          where: { hidden: true },
          orderBy: { name: "asc" },
          include: { _count: { select: { dinners: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Restaurants</h1>

      {/* Add form */}
      <form action={createRestaurant} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
        <h2 className="font-medium text-gray-700 dark:text-gray-300">Add restaurant</h2>
        <input name="name" required placeholder="Name *" className={inputCls} />
        <div className="grid grid-cols-2 gap-3">
          <input name="phoneNumber" placeholder="Phone number" className={halfInputCls} />
          <input name="orderUrl" placeholder="Order URL" className={halfInputCls} />
          <input name="menuUrl" placeholder="Menu URL" className={`${halfInputCls} col-span-2`} />
        </div>
        <textarea name="notes" placeholder="Notes" rows={2} className={inputCls} />
        <input name="tags" placeholder="Tags (comma-separated, e.g. pizza, italian)" className={inputCls} />
        <SubmitButton className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Add
        </SubmitButton>
      </form>

      {/* List */}
      {restaurants.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">No restaurants yet.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
          {restaurants.map((r) => (
            <details key={r.id} className="group">
                <summary className="list-none flex items-center gap-3 px-4 py-2.5 cursor-default">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{r.name}</span>
                      <span className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer">Edit <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span></span>
                    </div>
                    <Tags tags={r.tags} className="mt-0.5" />
                    {r.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 tabular-nums">{r._count.dinners}×</span>
                    {r.phoneNumber && (
                      <a href={`tel:${r.phoneNumber}`} className="text-gray-500 dark:text-gray-400 hover:underline">Call</a>
                    )}
                    {r.menuUrl && (
                      <a href={r.menuUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">Menu ↗</a>
                    )}
                    {r.orderUrl && (
                      <a href={r.orderUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">Order ↗</a>
                    )}
                  </div>
                </summary>
                <div className="px-4 pb-3 space-y-2">
                  <CollapsingForm action={updateRestaurant} className="space-y-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input name="name" required defaultValue={r.name} placeholder="Name *" className={inputCls} />
                    <div className="grid grid-cols-2 gap-2">
                      <input name="phoneNumber" defaultValue={r.phoneNumber ?? ""} placeholder="Phone number" className={halfInputCls} />
                      <input name="orderUrl" defaultValue={r.orderUrl ?? ""} placeholder="Order URL" className={halfInputCls} />
                      <input name="menuUrl" defaultValue={r.menuUrl ?? ""} placeholder="Menu URL" className={`${halfInputCls} col-span-2`} />
                    </div>
                    <textarea name="notes" defaultValue={r.notes ?? ""} placeholder="Notes" rows={2} className={inputCls} />
                    <input name="tags" defaultValue={r.tags.join(", ")} placeholder="Tags (comma-separated)" className={inputCls} />
                    <SubmitButton className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Save
                    </SubmitButton>
                  </CollapsingForm>
                  {r._count.dinners > 0 ? (
                    <form action={hideRestaurant.bind(null, r.id)}>
                      <SubmitButton className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        Hide
                      </SubmitButton>
                    </form>
                  ) : (
                    <form action={deleteRestaurant.bind(null, r.id)}>
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
          href={showingHidden ? "/restaurants" : "/restaurants?showHidden=1"}
          scroll={false}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showingHidden ? "Hide hidden restaurants" : "Show hidden restaurants"}
        </Link>
      </div>

      {/* Hidden restaurants */}
      {showingHidden && hiddenRestaurants.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Hidden</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            {hiddenRestaurants.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-gray-400 dark:text-gray-500">{r.name}</span>
                  <Tags tags={r.tags} className="mt-0.5" />
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-gray-300 dark:text-gray-600 tabular-nums">{r._count.dinners}×</span>
                  <form action={unhideRestaurant.bind(null, r.id)}>
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
      {showingHidden && hiddenRestaurants.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center">No hidden restaurants.</p>
      )}
    </div>
  );
}
