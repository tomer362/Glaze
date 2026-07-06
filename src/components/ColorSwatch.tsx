import Image from "next/image";

type SwatchColor = {
  name: string;
  hex?: string | null;
  imageUrl?: string | null;
};

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-20 w-20",
} as const;

/**
 * A single color chip. Prefers a real fired photo when present, otherwise
 * falls back to the (approximate) hex swatch, otherwise a neutral placeholder.
 */
export function ColorSwatch({
  color,
  size = "md",
}: {
  color: SwatchColor;
  size?: keyof typeof sizeMap;
}) {
  const dim = sizeMap[size];

  if (color.imageUrl) {
    return (
      <Image
        src={color.imageUrl}
        alt={color.name}
        width={80}
        height={80}
        className={`${dim} rounded-lg border border-border object-cover`}
      />
    );
  }

  return (
    <span
      title={color.name}
      className={`${dim} inline-block rounded-lg border border-border`}
      style={{ backgroundColor: color.hex ?? "#cfc6ba" }}
    />
  );
}
