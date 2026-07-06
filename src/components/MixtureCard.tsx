import Link from "next/link";
import Image from "next/image";
import { ColorSwatch } from "./ColorSwatch";
import type { MixtureView } from "@/lib/queries";

export function MixtureCard({ mixture }: { mixture: MixtureView }) {
  return (
    <Link
      href={`/mixtures/${mixture.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-background">
        {mixture.resultImageUrl ? (
          <Image
            src={mixture.resultImageUrl}
            alt={mixture.name}
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundColor: mixture.resultHex ?? "#cfc6ba" }}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-semibold leading-tight">{mixture.name}</h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {mixture.components.map((c) => (
            <ColorSwatch key={c.glazeColorId} color={c} size="sm" />
          ))}
          <span className="text-xs text-muted">
            {mixture.components.length} צבעים
          </span>
        </div>

        {mixture.authorName && (
          <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted">
            {mixture.authorImage && (
              <Image
                src={mixture.authorImage}
                alt={mixture.authorName}
                width={18}
                height={18}
                className="rounded-full"
              />
            )}
            <span>{mixture.authorName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
