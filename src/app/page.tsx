import Link from "next/link";
import { getRecentMixtures } from "@/lib/queries";
import { MixtureCard } from "@/components/MixtureCard";

export default async function Home() {
  const mixtures = await getRecentMixtures(12);

  return (
    <div className="flex flex-col gap-10">
      <section className="card flex flex-col items-start gap-4 p-6 sm:p-10">
        <h1 className="text-3xl font-bold sm:text-4xl">
          מתעדים ערבובים של צבעי גלזורה
        </h1>
        <p className="max-w-2xl text-muted">
          ערבבתם כמה גלזורות ויצא צבע מעניין? תעדו אילו צבעים ערבבתם, העלו תמונה של
          התוצאה השרופה, וגלו מה יצא לקדרים אחרים — לפי הצבעים שיש לכם בבית.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/mixtures/new"
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            תיעוד ערבוב חדש
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-border px-4 py-2 font-semibold transition hover:bg-surface"
          >
            חיפוש לפי צבעים
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">ערבובים אחרונים</h2>
          <Link href="/mixtures" className="text-sm text-primary hover:underline">
            לכל הערבובים →
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
      </section>
    </div>
  );
}
