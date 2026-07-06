"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import Image from "next/image";

/**
 * Downscale + re-encode an image on the client before upload.
 *
 * Why: iPhone photos are multi-MB (often HEIC), and uploading them whole over
 * cellular stalls. Drawing to a canvas and exporting JPEG both shrinks the file
 * (fast upload) and converts HEIC → JPEG (iOS Safari decodes HEIC to canvas),
 * which also satisfies the server's allowed content types. Falls back to the
 * original file if anything goes wrong (e.g. a browser that can't decode it).
 */
async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<File> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode failed"));
        el.src = url;
      });

      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob) throw new Error("encode failed");

      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    } finally {
      URL.revokeObjectURL(url);
    }
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
