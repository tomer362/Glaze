import { notFound } from "next/navigation";
import Link from "next/link";
import { getColorById } from "@/lib/queries";
import { auth } from "@/lib/auth";
import { canEditColor } from "@/lib/permissions";
import { EditColorForm } from "@/components/EditColorForm";

export default async function EditColorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const color = await getColorById(id);
  if (!color) notFound();

  const session = await auth();
  if (!canEditColor(session, color)) notFound();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">עריכת צבע</h1>
        <p className="mt-1 text-sm text-muted">
          עדכנו את פרטי הצבע או הוסיפו תמונה של הגלזורה השרופה.
        </p>
      </div>

      <EditColorForm
        id={color.id}
        defaults={{
          name: color.name,
          brand: color.brand,
          code: color.code,
          hex: color.hex,
          imageUrl: color.imageUrl,
        }}
      />

      <Link
        href={`/colors/${color.id}`}
        className="self-start text-sm text-muted hover:text-foreground"
      >
        ← חזרה לצבע
      </Link>
    </div>
  );
}
