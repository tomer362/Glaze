import Link from "next/link";
import { getColors, getBrands } from "@/lib/queries";
import { ColorSwatch } from "@/components/ColorSwatch";

export default async function ColorsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; community?: string }>;
}) {
  const { brand, community: communityParam } = await searchParams;
  const community = communityParam === "1";
  const [colors, brands] = await Promise.all([
    getColors(
      community ? { community: true } : brand ? { brand } : undefined,
    ),
    getBrands(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ספריית הצבעים</h1>
        <Link
          href="/colors/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          + הוספת צבע
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/colors"
          className={`rounded-full border border-border px-3 py-1 ${!brand && !community ? "bg-primary text-primary-foreground" : "bg-surface"}`}
        >
          הכל
        </Link>
        <Link
          href="/colors?community=1"
          className={`rounded-full border border-border px-3 py-1 ${community ? "bg-primary text-primary-foreground" : "bg-surface"}`}
        >
          קהילה
        </Link>
        {brands.map((b) => (
          <Link
            key={b}
            href={`/colors?brand=${encodeURIComponent(b)}`}
            className={`rounded-full border border-border px-3 py-1 ${brand === b ? "bg-primary text-primary-foreground" : "bg-surface"}`}
          >
            {b}
          </Link>
        ))}
      </div>

      {colors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          אין צבעים להצגה.
        </p>
      ) : (
        <div className="animate-fade-in grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {colors.map((c) => (
            <Link
              key={c.id}
              href={`/colors/${c.id}`}
              className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <ColorSwatch color={c} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {[c.brand, c.code].filter(Boolean).join(" · ") ||
                    (c.isBase ? "בסיס" : "קהילה")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
