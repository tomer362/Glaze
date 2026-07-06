import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (under Vercel's 4.5 MB function body limit)

/**
 * Server-side image upload. The browser POSTs the (already client-compressed,
 * ~small) file here; this function — running in the same region as the Blob
 * store — writes it with put(). The browser only has to reach the nearest
 * Vercel edge, which is far more reliable on weak mobile links than PUTting
 * directly to a distant blob store from the client SDK.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "צריך להתחבר כדי להעלות תמונה" },
      { status: 401 },
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "לא נבחרה תמונה" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "פורמט לא נתמך (רק JPG / PNG / WEBP)" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "התמונה גדולה מדי" },
      { status: 400 },
    );
  }

  try {
    const blob = await put(file.name || "upload.jpg", file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "שמירת התמונה נכשלה" },
      { status: 500 },
    );
  }
}
