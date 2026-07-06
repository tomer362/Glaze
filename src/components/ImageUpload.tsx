"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import Image from "next/image";

/** Decode a file to something canvas can draw, with its dimensions. */
async function decode(
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  // createImageBitmap is the most reliable decoder on iOS (handles HEIC and
  // applies EXIF orientation), and always reports real dimensions — unlike
  // <img>, which can report width/height 0 for HEIC via an object URL.
  if (typeof createImageBitmap === "function") {
    // Try with EXIF orientation first; some older WebKit builds reject the
    // options argument, so retry without it before giving up on the bitmap path.
    for (const opts of [{ imageOrientation: "from-image" as const }, undefined]) {
      try {
        const bitmap = opts
          ? await createImageBitmap(file, opts)
          : await createImageBitmap(file);
        if (bitmap.width > 0 && bitmap.height > 0) {
          return { source: bitmap, width: bitmap.width, height: bitmap.height };
        }
        bitmap.close();
      } catch {
        // try the next strategy
      }
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) throw new Error("zero dimensions");
    return { source: img, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Downscale + re-encode an image on the client before upload.
 *
 * Why: iPhone photos are multi-MB (often HEIC), and uploading them whole over
 * cellular stalls. Re-encoding to a small JPEG makes the upload near-instant
 * and converts HEIC → JPEG (satisfying the server's allowed content types).
 * Returns the smaller of {compressed, original}; falls back to the original if
 * the browser can't decode the source at all.
 */
async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.72,
): Promise<File> {
  try {
    const { source, width, height } = await decode(file);

    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(source, 0, 0, w, h);
    if (typeof (source as ImageBitmap).close === "function") {
      (source as ImageBitmap).close();
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("encode failed");

    // Always return the JPEG: it's small (≤1280px) and, importantly, an allowed
    // content type — unlike a HEIC source, which the upload token would reject.
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    // Could not process (unsupported source, etc.) — upload the original.
    return file;
  }
}

/**
 * Uploads an image straight to Vercel Blob (via a short-lived token from
 * /api/upload) and stores the resulting public URL in a hidden input so a
 * plain <form action={serverAction}> can submit it.
 */
export function ImageUpload({
  name,
  label,
  required = false,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setStatus("uploading");
    setProgress(0);
    setError("");

    // Guard against a silently stalled upload.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const file = await compressImage(picked);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        abortSignal: controller.signal,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      setUrl(blob.url);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(
        controller.signal.aborted
          ? "ההעלאה ארכה יותר מדי — נסו שוב או בחרו תמונה קטנה יותר."
          : (err as Error).message || "ההעלאה נכשלה",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  const buttonLabel =
    status === "uploading"
      ? `מעלה… ${progress}%`
      : url
        ? "החלפת תמונה"
        : "בחירת תמונה";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>

      <div className="flex items-center gap-3">
        {url ? (
          <Image
            src={url}
            alt="תצוגה מקדימה"
            width={80}
            height={80}
            className="h-20 w-20 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
            אין תמונה
          </div>
        )}

        <label className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-background">
          {buttonLabel}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={status === "uploading"}
          />
        </label>
      </div>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      {/* Value consumed by the server action */}
      <input type="hidden" name={name} value={url} required={required} />
    </div>
  );
}
