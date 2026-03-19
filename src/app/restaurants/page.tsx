export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createRestaurant, deleteRestaurant } from "@/app/actions/restaurants";

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { dinners: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Restaurants</h1>

      {/* Add form */}
      <form action={createRestaurant} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-medium text-gray-700">Add restaurant</h2>
        <input
          name="name"
          required
          placeholder="Name *"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="phoneNumber"
            placeholder="Phone number"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            name="orderUrl"
            placeholder="Order URL"
            type="url"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
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
      {restaurants.length === 0 ? (
        <p className="text-gray-400 text-sm">No restaurants yet.</p>
      ) : (
        <ul className="space-y-2">
          {restaurants.map((r) => (
            <li
              key={r.id}
              className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex justify-between items-start"
            >
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-gray-400">
                  {r._count.dinners} dinner{r._count.dinners !== 1 ? "s" : ""}
                  {r.phoneNumber && ` · ${r.phoneNumber}`}
                </p>
                {r.orderUrl && (
                  <a
                    href={r.orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    Order online ↗
                  </a>
                )}
                {r.notes && <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>}
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteRestaurant(r.id);
                }}
              >
                <button type="submit" className="text-xs text-red-400 hover:text-red-600">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
