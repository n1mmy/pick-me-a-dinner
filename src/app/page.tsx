export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { pickAndRedirect } from "@/app/actions/dinners";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function Home() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - 7);

  const recentDinners = await prisma.dinner.findMany({
    where: { date: { gte: since } },
    include: { restaurant: true, meal: true },
    orderBy: { date: "desc" },
  });

  const todayStr = toDateStr(today);
  const todayDinner = recentDinners.find((d) => toDateStr(d.date) === todayStr);

  // Build last 7 days (excluding today), most recent first
  const pastDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (i + 1));
    return d;
  });
  const dinnerByDate = Object.fromEntries(
    recentDinners.map((d) => [toDateStr(d.date), d])
  );

  return (
    <div className="space-y-6">
      {/* Tonight */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Tonight</h2>
        {todayDinner ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">
                {todayDinner.restaurant?.name ?? todayDinner.meal?.name}
              </p>
              <p className="text-sm text-gray-500">
                {todayDinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
              </p>
              {todayDinner.notes && (
                <p className="text-sm text-gray-500 mt-1">{todayDinner.notes}</p>
              )}
            </div>
            <Link
              href={`/add?date=${todayStr}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Change
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-gray-500">No dinner set for tonight yet.</p>
            <div className="flex gap-3">
              <form action={pickAndRedirect}>
                <input type="hidden" name="date" value={todayStr} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Pick for me
                </button>
              </form>
              <Link
                href={`/add?date=${todayStr}`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Choose myself
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Last 7 nights</h2>
        <ul className="space-y-2">
          {pastDays.map((day) => {
            const dateStr = toDateStr(day);
            const dinner = dinnerByDate[dateStr];
            return (
              <li
                key={dateStr}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex justify-between items-center"
              >
                {dinner ? (
                  <>
                    <div>
                      <p className="font-medium">
                        {dinner.restaurant?.name ?? dinner.meal?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(day)} · {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                      </p>
                    </div>
                    <Link
                      href={`/add?date=${dateStr}`}
                      className="text-xs text-gray-400 hover:text-indigo-600"
                    >
                      Edit
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">{formatDate(day)}</p>
                    <Link
                      href={`/add?date=${dateStr}`}
                      className="text-xs text-indigo-500 hover:text-indigo-700"
                    >
                      Add
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
