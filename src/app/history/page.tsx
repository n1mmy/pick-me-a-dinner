export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteDinner } from "@/app/actions/dinners";

const PAGE_SIZE = 30;

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [dinners, total] = await Promise.all([
    prisma.dinner.findMany({
      include: { restaurant: true, meal: true },
      orderBy: { date: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.dinner.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dinner history</h1>
        <form method="get" action="/add" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            + Add
          </button>
        </form>
      </div>

      {dinners.length === 0 ? (
        <p className="text-gray-400">No dinners recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {dinners.map((dinner) => (
            <li
              key={dinner.id}
              className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {dinner.restaurant?.name ?? dinner.meal?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(dinner.date)} · {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                </p>
                {dinner.notes && (
                  <p className="text-xs text-gray-400 mt-0.5">{dinner.notes}</p>
                )}
              </div>
              <div className="flex gap-3 items-center">
                <Link
                  href={`/add?date=${toDateStr(dinner.date)}`}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteDinner(dinner.id);
                  }}
                >
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 pt-2">
          {page > 1 && (
            <Link
              href={`/history?page=${page - 1}`}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              ← Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/history?page=${page + 1}`}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
