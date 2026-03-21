export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createMeal, updateMeal, deleteMeal, hideMeal, unhideMeal } from "@/app/actions/meals";
import { SubmitButton } from "@/components/SubmitButton";
import { DeleteButton } from "@/components/DeleteButton";
import { Tags } from "@/components/Tags";
import { CollapsingForm } from "@/components/CollapsingForm";
import { LoadingLink } from "@/components/LoadingLink";
import Link from "next/link";

const inputCls = "w-full border border-muted/40 rounded px-3 py-2 text-sm bg-surface text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-teal";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ showHidden?: string }>;
}) {
  const { showHidden } = await searchParams;
  const showingHidden = showHidden === "1";
  const todayStr = new Date().toISOString().split("T")[0];

  const [meals, hiddenMeals] = await Promise.all([
    prisma.meal.findMany({
      where: { hidden: false },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { dinners: true } },
        dinners: { where: { notes: { not: null } }, orderBy: { date: "desc" }, take: 1, select: { notes: true } },
      },
    }),
    showingHidden
      ? prisma.meal.findMany({
          where: { hidden: true },
          orderBy: { name: "asc" },
          take: 50,
          include: { _count: { select: { dinners: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-unica)] text-2xl text-fg">Homecooked meals</h1>
        <hr className="border-0 border-b-[3px] border-dashed border-pink w-1/4 mt-1" />
      </div>

      {/* Add form */}
      <form action={createMeal} className="border border-dashed border-muted/30 rounded p-5 space-y-3">
        <h2 className="font-[family-name:var(--font-unica)] text-sm text-muted">Add meal</h2>
        <input name="name" required placeholder="Name *" className={inputCls} />
        <textarea name="notes" placeholder="Notes" rows={2} className={inputCls} />
        <input name="tags" placeholder="Tags (comma-separated, e.g. pasta, quick)" className={inputCls} />
        <SubmitButton className="px-4 py-2 bg-teal text-white rounded text-sm font-[family-name:var(--font-unica)] hover:opacity-80 transition-opacity cursor-pointer">
          Add
        </SubmitButton>
      </form>

      {/* List */}
      {meals.length === 0 ? (
        <p className="text-muted text-sm">No meals yet.</p>
      ) : (
        <div>
          {meals.map((m) => (
            <details key={m.id} className="group border-b border-dashed border-muted/30">
              <summary className="list-none flex items-center gap-3 py-3 cursor-default">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-fg">{m.name}</span>
                    <span className="text-xs text-teal hover:text-pink cursor-pointer transition-colors">
                      Edit <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span>
                    </span>
                  </div>
                  <Tags tags={m.tags} className="mt-0.5" />
                  {m.notes && <p className="text-xs text-muted mt-0.5 truncate italic">{m.notes}</p>}
                  {m.dinners[0]?.notes && <p className="text-xs text-muted/70 mt-0.5 truncate italic">&ldquo;{m.dinners[0].notes}&rdquo;</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-muted tabular-nums">{m._count.dinners}×</span>
                  <LoadingLink href={`/add?date=${todayStr}&suggestedId=${m.id}&type=HOMECOOKED`} className="px-2 py-0.5 border border-pink text-pink rounded font-[family-name:var(--font-unica)] hover:bg-pink hover:text-bg transition-colors">
                    Pick →
                  </LoadingLink>
                </div>
              </summary>
              <div className="pb-3 space-y-2">
                <CollapsingForm action={updateMeal} className="space-y-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input name="name" required defaultValue={m.name} placeholder="Name *" className={inputCls} />
                  <textarea name="notes" defaultValue={m.notes ?? ""} placeholder="Notes" rows={2} className={inputCls} />
                  <input name="tags" defaultValue={m.tags.join(", ")} placeholder="Tags (comma-separated)" className={inputCls} />
                  <SubmitButton className="px-3 py-1.5 bg-teal text-white rounded text-sm hover:opacity-80 transition-opacity cursor-pointer">
                    Save
                  </SubmitButton>
                </CollapsingForm>
                {m._count.dinners > 0 ? (
                  <form action={hideMeal.bind(null, m.id)}>
                    <SubmitButton className="text-xs text-muted hover:text-pink transition-colors cursor-pointer">
                      Hide
                    </SubmitButton>
                  </form>
                ) : (
                  <DeleteButton action={deleteMeal.bind(null, m.id)} className="text-xs text-pink/60 hover:text-pink transition-colors cursor-pointer">
                    Delete
                  </DeleteButton>
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
          className="text-xs text-muted hover:text-pink transition-colors"
        >
          {showingHidden ? "Hide hidden meals" : "Show hidden meals"}
        </Link>
      </div>

      {/* Hidden meals */}
      {showingHidden && hiddenMeals.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-unica)] text-sm text-muted">Hidden</h2>
          <div>
            {hiddenMeals.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-dashed border-muted/20">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-muted">{m.name}</span>
                  <Tags tags={m.tags} className="mt-0.5" />
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-muted/50 tabular-nums">{m._count.dinners}×</span>
                  <form action={unhideMeal.bind(null, m.id)}>
                    <SubmitButton className="text-xs text-teal hover:text-pink transition-colors cursor-pointer">
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
        <p className="text-muted text-sm text-center">No hidden meals.</p>
      )}
    </div>
  );
}
