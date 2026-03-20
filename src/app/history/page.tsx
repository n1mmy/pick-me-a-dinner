export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { deleteDinner } from "@/app/actions/dinners";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";
import { Tags } from "@/components/Tags";

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
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <SubmitButton className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            + Add
          </SubmitButton>
        </form>
      </div>

      {dinners.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500">No dinners recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {dinners.map((dinner) => (
            <li
              key={dinner.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {dinner.restaurant?.name ?? dinner.meal?.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(dinner.date)} · {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                </p>
                {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                )}
                {dinner.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{dinner.notes}</p>
                )}
                <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-1" />
              </div>
              <div className="flex gap-3 items-center">
                <LoadingLink
                  href={`/add?id=${dinner.id}`}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Edit
                </LoadingLink>
                <form
                  action={async () => {
                    "use server";
                    await deleteDinner(dinner.id);
                  }}
                >
                  <SubmitButton className="text-xs text-red-400 hover:text-red-600">
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 pt-2">
          {page > 1 && (
            <LoadingLink
              href={`/history?page=${page - 1}`}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              ← Previous
            </LoadingLink>
          )}
          <span className="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <LoadingLink
              href={`/history?page=${page + 1}`}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next →
            </LoadingLink>
          )}
        </div>
      )}
    </div>
  );
}
