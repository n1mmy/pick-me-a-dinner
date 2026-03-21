export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { deleteDinner } from "@/app/actions/dinners";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";
import { Tags } from "@/components/Tags";

const PAGE_SIZE = 30;

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
  const todayStr = new Date().toISOString().split("T")[0];
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-unica)] text-2xl text-fg">Dinner history</h1>
          <hr className="border-0 border-b-[3px] border-dashed border-pink w-2/3 mt-1" />
        </div>
        <form method="get" action="/add" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="border border-muted/40 rounded px-3 py-1.5 text-sm bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-teal"
          />
          <button type="submit" className="px-3 py-1.5 bg-teal text-white rounded text-sm font-[family-name:var(--font-unica)] hover:opacity-80 transition-opacity cursor-pointer">
            + Add
          </button>
        </form>
      </div>

      {dinners.length === 0 ? (
        <p className="text-muted">No dinners recorded yet.</p>
      ) : (
        <div>
          {dinners.map((dinner) => (
            <div
              key={dinner.id}
              className="border-b border-dashed border-muted/30 py-3 flex justify-between items-start"
            >
              <div>
                <p className="text-sm text-fg">
                  {dinner.restaurant?.name ?? dinner.meal?.name}
                </p>
                <p className="text-xs text-muted">
                  <span className="font-[family-name:var(--font-unica)]">{formatDate(dinner.date)}</span> · {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                </p>
                {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                  <p className="text-xs text-muted mt-1 italic">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                )}
                {dinner.notes && (
                  <p className="text-xs text-muted/70 mt-1 italic">&ldquo;{dinner.notes}&rdquo;</p>
                )}
                <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-1" />
              </div>
              <div className="flex gap-3 items-center shrink-0 ml-4">
                <LoadingLink
                  href={`/add?date=${todayStr}&suggestedId=${dinner.restaurantId ?? dinner.mealId}&type=${dinner.type}`}
                  className="px-2 py-0.5 border border-pink text-pink rounded text-xs font-[family-name:var(--font-unica)] hover:bg-pink hover:text-bg transition-colors"
                >
                  Pick →
                </LoadingLink>
                <LoadingLink
                  href={`/add?id=${dinner.id}`}
                  className="text-xs text-teal hover:text-pink transition-colors"
                >
                  Edit
                </LoadingLink>
                <form action={async () => { "use server"; await deleteDinner(dinner.id); }}>
                  <SubmitButton className="text-xs text-pink/60 hover:text-pink transition-colors cursor-pointer">
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 pt-2 items-center">
          {page > 1 && (
            <LoadingLink
              href={`/history?page=${page - 1}`}
              className="px-3 py-1.5 border border-dashed border-muted/40 rounded text-sm text-muted hover:text-pink hover:border-pink/40 transition-colors"
            >
              ← Previous
            </LoadingLink>
          )}
          <span className="px-3 py-1.5 text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <LoadingLink
              href={`/history?page=${page + 1}`}
              className="px-3 py-1.5 border border-dashed border-muted/40 rounded text-sm text-muted hover:text-pink hover:border-pink/40 transition-colors"
            >
              Next →
            </LoadingLink>
          )}
        </div>
      )}
    </div>
  );
}
