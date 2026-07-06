import Link from "next/link";
import { getRecentMixtures } from "@/lib/queries";
import { MixtureCard } from "@/components/MixtureCard";

export default async function MixturesPage() {
  const mixtures = await getRecentMixtures(60);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">כל הערבובים</h1>
        <Link
          href="/mixtures/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          + ערבוב חדש
        </Link>
      </div>

      {mixtures.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          עדיין אין ערבובים. היו הראשונים לתעד!
        </p>
      ) : (
        <div className="animate-fade-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {mixtures.map((m) => (
            <MixtureCard key={m.id} mixture={m} />
          ))}
        </div>
      )}
    </div>
  );
}
