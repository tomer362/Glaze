import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { canEditMixture } from "@/lib/permissions";
import { getColors, getMixtureById } from "@/lib/queries";
import { MixtureForm } from "@/components/MixtureForm";

export default async function EditMixturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mixture = await getMixtureById(id);
  if (!mixture) notFound();

  const session = await auth();
  if (!canEditMixture(session, mixture)) notFound();

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
        <h1 className="text-2xl font-bold">עריכת ערבוב</h1>
        <p className="mt-1 text-sm text-muted">
          עדכנו את הצבעים, התמונה או הפרטים של הערבוב.
        </p>
      </div>

      <MixtureForm
        colors={options}
        edit={{
          id: mixture.id,
          name: mixture.name,
          notes: mixture.notes,
          beforeImageUrl: mixture.beforeImageUrl,
          resultImageUrl: mixture.resultImageUrl,
          components: mixture.components.map((c) => ({
            glazeColorId: c.glazeColorId,
            amount: c.amount,
            unit: c.unit,
          })),
        }}
      />

      <Link
        href={`/mixtures/${mixture.id}`}
        className="self-start text-sm text-muted hover:text-foreground"
      >
        ← חזרה לערבוב
      </Link>
    </div>
  );
}
