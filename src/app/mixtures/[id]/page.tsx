import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getMixtureById } from "@/lib/queries";
import { ColorSwatch } from "@/components/ColorSwatch";

const unitLabels: Record<string, string> = {
  parts: "חלקים",
  grams: "גרם",
  "%": "%",
};

export default async function MixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mixture = await getMixtureById(id);
  if (!mixture) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="card overflow-hidden">
        <div className="relative aspect-[16/10] w-full bg-background">
          {mixture.resultImageUrl ? (
            <Image
              src={mixture.resultImageUrl}
              alt={mixture.name}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundColor: mixture.resultHex ?? "#cfc6ba" }}
            />
          )}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">{mixture.name}</h1>
            {mixture.authorName && (
              <div className="flex items-center gap-2 text-sm text-muted">
                {mixture.authorImage && (
                  <Image
                    src={mixture.authorImage}
                    alt={mixture.authorName}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>{mixture.authorName}</span>
              </div>
            )}
          </div>

          {mixture.notes && (
            <p className="whitespace-pre-wrap text-foreground/90">
              {mixture.notes}
            </p>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          הצבעים בערבוב
          {!mixture.hasAmounts && (
            <span className="ms-2 text-sm font-normal text-muted">
              (ללא כמויות)
            </span>
          )}
        </h2>
        <ul className="flex flex-col gap-2">
          {mixture.components.map((c) => (
            <li
              key={c.glazeColorId}
              className="card flex items-center gap-3 p-3"
            >
              <ColorSwatch color={c} size="md" />
              <Link
                href={`/colors/${c.glazeColorId}`}
                className="flex-1 hover:underline"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-sm text-muted">
                  {[c.brand, c.code].filter(Boolean).length > 0 &&
                    " · " + [c.brand, c.code].filter(Boolean).join(" · ")}
                </span>
              </Link>
              {mixture.hasAmounts && c.amount != null && (
                <span className="rounded-md bg-background px-2 py-1 text-sm">
                  {c.amount} {c.unit ? unitLabels[c.unit] ?? c.unit : ""}
                </span>
              )}
            </li>
          ))}
        </ul>

        <Link
          href="/search"
          className="mt-2 self-start text-sm text-primary hover:underline"
        >
          ← חיפוש ערבובים לפי צבעים
        </Link>
      </section>
    </div>
  );
}
