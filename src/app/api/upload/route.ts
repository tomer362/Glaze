import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Client-upload token endpoint for Vercel Blob.
 *
 * The browser streams the image directly to Blob (bypassing the function body
 * limit) after requesting a short-lived token here. We gate that on an
 * authenticated session and restrict content type + size.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error("צריך להתחבר כדי להעלות תמונה");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 8 * 1024 * 1024, // 8 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      // No onUploadCompleted: the client receives the blob URL directly and the
      // form persists it, so the completion webhook would be dead weight (and
      // adding it forces a callbackUrl the client flow doesn't need).
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
