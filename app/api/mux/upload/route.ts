import { NextRequest, NextResponse } from "next/server";
import { createDirectUpload, getDirectUpload, getAsset } from "@/lib/mux";

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey =
    process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;

  if (!validApiKey) return true;
  return apiKey === validApiKey;
};

/**
 * POST /api/mux/upload
 * Creates a direct upload URL on Mux for the client to PUT the video file directly to Mux.
 */
export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { passthrough = "ancraze-course-video" } = body;

    const directUpload = await createDirectUpload({
      corsOrigin: "*",
      passthrough,
    });

    return NextResponse.json(
      {
        success: true,
        upload: directUpload,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Mux upload creation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to create Mux direct upload",
        code: "MUX_UPLOAD_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mux/upload?uploadId=...
 * Checks the status of a direct upload and returns the resolved asset and playback ID once ready.
 */
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const uploadId = request.nextUrl.searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
  }

  try {
    const upload = await getDirectUpload(uploadId);

    let asset = null;
    let playbackId = null;

    if (upload.asset_id) {
      asset = await getAsset(upload.asset_id);
      if (asset.playback_ids && asset.playback_ids.length > 0) {
        playbackId = asset.playback_ids[0].id;
      }
    }

    return NextResponse.json({
      success: true,
      upload,
      asset,
      playbackId,
      streamUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
      thumbnailUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null,
    });
  } catch (error: any) {
    console.error("❌ Mux upload status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check Mux upload status" },
      { status: 500 }
    );
  }
}

