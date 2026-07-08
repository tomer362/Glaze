import { auth } from "@/lib/auth";
import { getColorOptions } from "@/lib/queries";
import { MixtureForm } from "@/components/MixtureForm";
import { SignInCard } from "@/components/SignInCard";

export default async function NewMixturePage({
  searchParams,
}: {
  searchParams: Promise<{ colorIds?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-xl">
        <SignInCard message="כדי לתעד ערבוב צריך להתחבר." />
      </div>
    );
  }

  const options = await getColorOptions();

  // Keep only ids that actually exist in the library.
  const { colorIds: colorIdsParam } = await searchParams;
  const valid = new Set(options.map((o) => o.id));
  const initialColorIds = (colorIdsParam?.split(",") ?? [])
    .map((s) => s.trim())
    .filter((s) => valid.has(s));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">תיעוד ערבוב חדש</h1>
        <p className="mt-1 text-sm text-muted">
          בחרו את הצבעים שערבבתם, העלו תמונה של התוצאה השרופה, ותנו לתוצאה שם.
        </p>
      </div>
      <MixtureForm colors={options} initialColorIds={initialColorIds} />
    </div>
  );
}
