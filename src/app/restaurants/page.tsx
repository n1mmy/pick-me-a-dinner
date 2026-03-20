export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createRestaurant, updateRestaurant, deleteRestaurant } from "@/app/actions/restaurants";
import { SubmitButton } from "@/components/SubmitButton";
import { Tags } from "@/components/Tags";

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
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <textarea
          name="notes"
          placeholder="Notes"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          name="tags"
          placeholder="Tags (comma-separated, e.g. pizza, italian)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <SubmitButton className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Add
        </SubmitButton>
      </form>

      {/* List */}
      {restaurants.length === 0 ? (
        <p className="text-gray-400 text-sm">No restaurants yet.</p>
      ) : (
        <ul className="space-y-2">
          {restaurants.map((r) => (
            <li key={r.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-gray-400">
                    {r._count.dinners} dinner{r._count.dinners !== 1 ? "s" : ""}
                  </p>
                  {(r.phoneNumber || r.orderUrl) && (
                    <div className="flex gap-3 mt-0.5">
                      {r.phoneNumber && (
                        <a href={`tel:${r.phoneNumber}`} className="text-xs text-gray-500 hover:underline">Call</a>
                      )}
                      {r.orderUrl && (
                        <a href={r.orderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">Order online ↗</a>
                      )}
                    </div>
                  )}
                  {r.notes && <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>}
                  <Tags tags={r.tags} className="mt-1" />
                </div>
                <div className="flex gap-3 items-center">
                  <form
                    action={async () => {
                      "use server";
                      await deleteRestaurant(r.id);
                    }}
                  >
                    <SubmitButton className="text-xs text-red-400 hover:text-red-600">
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </div>
              <details>
                <summary className="cursor-pointer text-xs text-indigo-500 hover:text-indigo-700">Edit</summary>
                <form action={updateRestaurant} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    name="name"
                    required
                    defaultValue={r.name}
                    placeholder="Name *"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="phoneNumber"
                      defaultValue={r.phoneNumber ?? ""}
                      placeholder="Phone number"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                      name="orderUrl"
                      defaultValue={r.orderUrl ?? ""}
                      placeholder="Order URL"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <textarea
                    name="notes"
                    defaultValue={r.notes ?? ""}
                    placeholder="Notes"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    name="tags"
                    defaultValue={r.tags.join(", ")}
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
    </div>
  );
}
