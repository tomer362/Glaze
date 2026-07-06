import { auth } from "@/lib/auth";
import { getColors } from "@/lib/queries";
import { MixtureForm } from "@/components/MixtureForm";
import { SignInCard } from "@/components/SignInCard";

export default async function NewMixturePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-xl">
        <SignInCard message="כדי לתעד ערבוב צריך להתחבר." />
      </div>
    );
  }

  const colors = await getColors();
  const options = colors.map((c) => ({
    id: c.id,
    name: c.name,
    brand: c.brand,
    code: c.code,
    hex: c.hex,
    imageUrl: c.imageUrl,
  }));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">תיעוד ערבוב חדש</h1>
        <p className="mt-1 text-sm text-muted">
          בחרו את הצבעים שערבבתם, העלו תמונה של התוצאה השרופה, ותנו לתוצאה שם.
        </p>
      </div>
      <MixtureForm colors={options} />
    </div>
  );
}
