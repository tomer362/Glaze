"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import Image from "next/image";

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
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setUrl(blob.url);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message || "ההעלאה נכשלה");
    }
  }

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
          {status === "uploading"
            ? "מעלה…"
            : url
              ? "החלפת תמונה"
              : "בחירת תמונה"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
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
