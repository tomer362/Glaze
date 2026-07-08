import { notFound } from "next/navigation";
import Link from "next/link";
import { getColorById, getMixturesForColor } from "@/lib/queries";
import { auth } from "@/lib/auth";
import { canEditColor } from "@/lib/permissions";
import { ColorSwatch } from "@/components/ColorSwatch";
import { MixtureCard } from "@/components/MixtureCard";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteColor } from "@/lib/actions/deletions";

export default async function ColorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const color = await getColorById(id);
  if (!color) notFound();

  const mixtures = await getMixturesForColor(id);

  const session = await auth();
  const isOwner = !color.isBase && session?.user?.id === color.createdBy;
  const canEdit = canEditColor(session, color);

  return (
    <div className="flex flex-col gap-8">
      <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <ColorSwatch color={color} size="lg" zoomable />
        <div>
          <h1 className="text-2xl font-bold">{color.name}</h1>
          <p className="mt-1 text-muted">
            {[color.brand, color.code].filter(Boolean).join(" · ") ||
              (color.isBase ? "צבע בסיס" : "צבע קהילה")}
          </p>
          {color.isBase && (
            <p className="mt-2 text-xs text-muted">
              דגימת הצבע משוערת בלבד — הצבע השרוף האמיתי תלוי בחומר ובכבשן.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
          {canEdit && (
            <Link
              href={`/colors/${color.id}/edit`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-background"
            >
              עריכה
            </Link>
          )}
          <Link
            href={`/mixtures/new?colorIds=${color.id}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            צור ערבוב עם הצבע הזה
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">ערבובים שמשתמשים בצבע הזה</h2>
        {mixtures.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            עדיין אין ערבובים עם הצבע הזה.{" "}
            <Link href="/mixtures/new" className="text-primary hover:underline">
              היו הראשונים
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {mixtures.map((m) => (
              <MixtureCard key={m.id} mixture={m} />
            ))}
          </div>
        )}
      </section>

      {isOwner && (
        <section className="border-t border-border pt-4">
          <DeleteButton
            action={deleteColor.bind(null, color.id)}
            label="מחיקת הצבע"
            confirmText="למחוק את הצבע הזה? הפעולה בלתי הפיכה."
          />
        </section>
      )}
    </div>
  );
}
