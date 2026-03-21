export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { createRestaurant, updateRestaurant, deleteRestaurant, hideRestaurant, unhideRestaurant } from "@/app/actions/restaurants";
import { SubmitButton } from "@/components/SubmitButton";
import { DeleteButton } from "@/components/DeleteButton";
import { Tags } from "@/components/Tags";
import { CollapsingForm } from "@/components/CollapsingForm";
import { ExpandingAddForm } from "@/components/ExpandingAddForm";
import { LoadingLink } from "@/components/LoadingLink";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

const inputCls = "w-full border border-muted/40 rounded px-3 py-2 text-sm bg-surface text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-teal";
const halfInputCls = "border border-muted/40 rounded px-3 py-2 text-sm bg-surface text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-teal";

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ showHidden?: string; q?: string }>;
}) {
  const { showHidden, q } = await searchParams;
  const showingHidden = showHidden === "1";
  const search = q?.trim() ?? "";
  const todayStr = new Date().toISOString().split("T")[0];

  const tagMatchIds = search
    ? (await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Restaurant" WHERE array_to_string(tags, ',') ILIKE ${`%${search}%`}`).map((r) => r.id)
    : [];
  const searchFilter = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { id: { in: tagMatchIds } }] }
    : {};

  const [restaurants, hiddenRestaurants] = await Promise.all([
    prisma.restaurant.findMany({
      where: { hidden: false, ...searchFilter },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { dinners: true } },
        dinners: { where: { notes: { not: null } }, orderBy: { date: "desc" }, take: 1, select: { notes: true } },
      },
    }),
    showingHidden
      ? prisma.restaurant.findMany({
          where: { hidden: true, ...searchFilter },
          orderBy: { name: "asc" },
          include: { _count: { select: { dinners: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-unica)] text-2xl text-fg">Restaurants</h1>
        <hr className="border-0 border-b-[3px] border-dashed border-pink w-1/4 mt-1" />
      </div>

      {/* Add form */}
      <ExpandingAddForm
        action={createRestaurant}
        label="Add restaurant"
        namePlaceholder="Name *"
        nameInputClassName={inputCls}
        className="border border-dashed border-muted/30 rounded p-5 space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <input name="phoneNumber" placeholder="Phone number" className={halfInputCls} />
          <input name="orderUrl" placeholder="Order URL" className={halfInputCls} />
          <input name="menuUrl" placeholder="Menu URL" className={`${halfInputCls} col-span-2`} />
        </div>
        <textarea name="notes" placeholder="Notes" rows={2} className={inputCls} />
        <input name="tags" placeholder="Tags (comma-separated, e.g. pizza, italian)" className={inputCls} />
        <SubmitButton className="px-4 py-2 bg-teal text-white rounded text-sm font-[family-name:var(--font-unica)] hover:opacity-80 transition-opacity cursor-pointer">
          Add
        </SubmitButton>
      </ExpandingAddForm>

      {/* Search */}
      <SearchBar placeholder="Search restaurants…" />

      {/* List */}
      {restaurants.length === 0 ? (
        <p className="text-muted text-sm">{search ? `No restaurants matching "${search}".` : "No restaurants yet."}</p>
      ) : (
        <div>
          {restaurants.map((r) => (
            <details key={r.id} className="group border-b border-dashed border-muted/30">
              <summary className="list-none flex items-center gap-3 py-3 cursor-default">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-fg">{r.name}</span>
                    <span className="text-xs text-teal hover:text-pink cursor-pointer transition-colors">
                      Edit <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span>
                    </span>
                  </div>
                  <Tags tags={r.tags} className="mt-0.5" />
                  {r.notes && <p className="text-xs text-muted mt-0.5 truncate italic">{r.notes}</p>}
                  {r.dinners[0]?.notes && <p className="text-xs text-muted/70 mt-0.5 truncate italic">&ldquo;{r.dinners[0].notes}&rdquo;</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-muted tabular-nums">{r._count.dinners}×</span>
                  {r.phoneNumber && (
                    <a href={`tel:${r.phoneNumber}`} className="text-muted hover:text-pink transition-colors">Call</a>
                  )}
                  {r.menuUrl && (
                    <a href={r.menuUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:text-fg transition-colors">Menu ↗</a>
                  )}
                  {r.orderUrl && (
                    <a href={r.orderUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:text-fg transition-colors">Order ↗</a>
                  )}
                  <LoadingLink href={`/add?date=${todayStr}&suggestedId=${r.id}&type=RESTAURANT`} className="px-2 py-0.5 border border-pink text-pink rounded font-[family-name:var(--font-unica)] hover:bg-pink hover:text-bg transition-colors">
                    Pick →
                  </LoadingLink>
                </div>
              </summary>
              <div className="pb-3 space-y-2">
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
                  <SubmitButton className="px-3 py-1.5 bg-teal text-white rounded text-sm hover:opacity-80 transition-opacity cursor-pointer">
                    Save
                  </SubmitButton>
                </CollapsingForm>
                {r._count.dinners > 0 ? (
                  <form action={hideRestaurant.bind(null, r.id)}>
                    <SubmitButton className="text-xs text-muted hover:text-pink transition-colors cursor-pointer">
                      Hide
                    </SubmitButton>
                  </form>
                ) : (
                  <DeleteButton action={deleteRestaurant.bind(null, r.id)} className="text-xs text-pink/60 hover:text-pink transition-colors cursor-pointer">
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
          href={showingHidden
            ? `/restaurants${search ? `?q=${encodeURIComponent(search)}` : ""}`
            : `/restaurants?showHidden=1${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          scroll={false}
          className="text-xs text-muted hover:text-pink transition-colors"
        >
          {showingHidden ? "Hide hidden restaurants" : "Show hidden restaurants"}
        </Link>
      </div>

      {/* Hidden restaurants */}
      {showingHidden && hiddenRestaurants.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-unica)] text-sm text-muted">Hidden</h2>
          <div>
            {hiddenRestaurants.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-dashed border-muted/20">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-muted">{r.name}</span>
                  <Tags tags={r.tags} className="mt-0.5" />
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-muted/50 tabular-nums">{r._count.dinners}×</span>
                  <form action={unhideRestaurant.bind(null, r.id)}>
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
      {showingHidden && hiddenRestaurants.length === 0 && (
        <p className="text-muted text-sm text-center">No hidden restaurants.</p>
      )}
    </div>
  );
}
