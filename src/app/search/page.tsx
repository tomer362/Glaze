import Link from "next/link";
import { getColors, searchMixtures } from "@/lib/queries";
import { SearchColorPicker } from "@/components/SearchColorPicker";
import { MixtureCard } from "@/components/MixtureCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; mode?: string }>;
}) {
  const { ids: idsParam, mode: modeParam } = await searchParams;
  const mode: "all" | "any" = modeParam === "any" ? "any" : "all";

  const colors = await getColors();
  const options = colors.map((c) => ({
    id: c.id,
    name: c.name,
    brand: c.brand,
    code: c.code,
    hex: c.hex,
    imageUrl: c.imageUrl,
  }));

  // Keep only ids that actually exist in the library.
  const valid = new Set(options.map((o) => o.id));
  const selectedIds = (idsParam?.split(",") ?? [])
    .map((s) => s.trim())
    .filter((s) => valid.has(s));

  const results = selectedIds.length
    ? await searchMixtures(selectedIds, mode)
    : [];
  const hasQuery = selectedIds.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">חיפוש ערבובים לפי צבעים</h1>
        <p className="mt-1 text-sm text-muted">
          בחרו את הצבעים שיש לכם, ותראו מה יצא לקדרים אחרים כשהם ערבבו אותם.
        </p>
      </div>

      <SearchColorPicker
        colors={options}
        initialIds={selectedIds}
        initialMode={mode}
      />

      {hasQuery && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">
            {results.length} תוצאות
            <span className="ms-2 text-sm font-normal text-muted">
              ({mode === "all" ? "מכיל את כל הצבעים" : "מכיל לפחות אחד"})
            </span>
          </h2>

          {results.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              לא נמצאו ערבובים תואמים.{" "}
              <Link href="/mixtures/new" className="text-primary hover:underline">
                תעדו ערבוב חדש
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((m) => (
                <MixtureCard key={m.id} mixture={m} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
