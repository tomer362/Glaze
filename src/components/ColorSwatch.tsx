import Image from "next/image";
import { ImageLightbox } from "./ImageLightbox";

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
 * Pass `zoomable` to open the photo in a full-screen preview on click.
 */
export function ColorSwatch({
  color,
  size = "md",
  zoomable = false,
}: {
  color: SwatchColor;
  size?: keyof typeof sizeMap;
  zoomable?: boolean;
}) {
  const dim = sizeMap[size];

  if (color.imageUrl) {
    const img = (
      <Image
        src={color.imageUrl}
        alt={color.name}
        width={80}
        height={80}
        className={`${dim} rounded-lg border border-border object-cover`}
      />
    );

    if (zoomable) {
      return (
        <ImageLightbox
          src={color.imageUrl}
          alt={color.name}
          className="cursor-zoom-in rounded-lg"
        >
          {img}
        </ImageLightbox>
      );
    }

    return img;
  }

  return (
    <span
      title={color.name}
      className={`${dim} inline-block rounded-lg border border-border`}
      style={{ backgroundColor: color.hex ?? "#cfc6ba" }}
    />
  );
}
