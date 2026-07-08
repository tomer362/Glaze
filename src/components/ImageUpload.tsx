"use client";

import { useState } from "react";
import Image from "next/image";
import { Spinner } from "./Spinner";

/** POST a file to our own /api/upload and resolve the stored public URL. */
function postImage(
  file: File,
  onProgress: (pct: number) => void,
  timeoutMs = 30_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.timeout = timeoutMs;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      let body: { url?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.url) {
        resolve(body.url);
      } else {
        reject(new Error(body.error || "ההעלאה נכשלה"));
      }
    };
    xhr.onerror = () => reject(new Error("שגיאת רשת"));
    xhr.ontimeout = () => reject(new Error("ההעלאה ארכה יותר מדי"));

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/** Reject a promise if it doesn't settle within `ms` (so a hung decoder can't freeze the UI). */
function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Decode a file to something canvas can draw, with its dimensions. */
async function decode(
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  // Try createImageBitmap first (handles HEIC + EXIF orientation, real dims),
  // but time-box each attempt: on some iOS WebKit builds it hangs on HEIC, and
  // we must fall through to the <img> decoder rather than freeze.
  if (typeof createImageBitmap === "function") {
    for (const opts of [{ imageOrientation: "from-image" as const }, undefined]) {
      try {
        const bitmap = await withTimeout(
          opts ? createImageBitmap(file, opts) : createImageBitmap(file),
          8000,
          "bitmap timeout",
        );
        if (bitmap.width > 0 && bitmap.height > 0) {
          return { source: bitmap, width: bitmap.width, height: bitmap.height };
        }
        bitmap.close();
      } catch {
        // try the next strategy
      }
    }
  }

  // <img> fallback (WebKit renders HEIC here), also time-boxed.
  const url = URL.createObjectURL(file);
  try {
    const img = await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode failed"));
        el.src = url;
      }),
      10000,
      "image timeout",
    );
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
 * Throws if the browser can't decode the source at all (caller surfaces it).
 */
async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.72,
): Promise<File> {
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

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

type Stage = "idle" | "compressing" | "uploading" | "error";

/**
 * Uploads an image straight to Vercel Blob (via a short-lived token from
 * /api/upload) and stores the resulting public URL in a hidden input so a
 * plain <form action={serverAction}> can submit it.
 */
export function ImageUpload({
  name,
  label,
  required = false,
  defaultUrl = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  /** Existing image to show and keep when editing (unless the user replaces it). */
  defaultUrl?: string;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setStage("compressing");
    setProgress(0);
    setError("");

    try {
      // Compress with its own timeout; if decoding fails, upload the original
      // (the server may still accept it, and this beats a dead end).
      let file: File;
      try {
        file = await withTimeout(
          compressImage(picked),
          25_000,
          "עיבוד התמונה נתקע",
        );
      } catch {
        file = picked;
      }
      setStage("uploading");

      // Weak mobile links stall mid-upload; retry a few times so a transient
      // stall recovers instead of failing outright.
      const maxAttempts = 3;
      let lastErr: unknown;
      for (let i = 1; i <= maxAttempts; i++) {
        setProgress(0);
        try {
          const uploadedUrl = await postImage(file, (p) => setProgress(p));
          setUrl(uploadedUrl);
          setStage("idle");
          return;
        } catch (err) {
          lastErr = err;
          if (i < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1200 * i)); // backoff
          }
        }
      }
      throw lastErr ?? new Error("ההעלאה נכשלה");
    } catch (err) {
      setStage("error");
      setError(
        (err as Error)?.message ||
          "ההעלאה נכשלה — נסו שוב, ואם אפשר בחיבור Wi‑Fi.",
      );
    }
  }

  const busy = stage === "compressing" || stage === "uploading";
  // Calm, static labels — progress is conveyed by the thumbnail affordance, not
  // a number in the button.
  const buttonLabel = busy
    ? "מעלה…"
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
        {/* 80×80 thumbnail box. While uploading it turns into a minimalist
            "working" state: a soft shimmer, a small ring, and a hairline
            progress bar hugging the bottom edge — no percentage. */}
        <div
          className="relative h-20 w-20 overflow-hidden rounded-lg"
          aria-busy={busy}
          aria-live="polite"
        >
          {url && !busy ? (
            <Image
              src={url}
              alt="תצוגה מקדימה"
              width={80}
              height={80}
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
          ) : busy ? (
            <div className="shimmer flex h-full w-full items-center justify-center rounded-lg border border-border">
              <Spinner className="h-5 w-5 text-muted/70" />
              {/* Determinate hairline only while actually uploading; compression
                  has no real percentage, so the shimmer alone carries it. */}
              {stage === "uploading" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
                  <span
                    className="block h-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              )}
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
              אין תמונה
            </div>
          )}
        </div>

        <label
          className={`rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition ${
            busy
              ? "cursor-default opacity-60"
              : "cursor-pointer hover:bg-background"
          }`}
        >
          {buttonLabel}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={busy}
          />
        </label>
      </div>

      {stage === "error" && <p className="text-sm text-red-600">{error}</p>}

      {/* Value consumed by the server action */}
      <input type="hidden" name={name} value={url} required={required} />
    </div>
  );
}
