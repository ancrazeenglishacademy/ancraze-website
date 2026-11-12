import { NextRequest, NextResponse } from "next/server";
import {
  listAssets,
  deleteAsset,
  getAsset,
  createPlaybackId,
  ensurePublicPlaybackId,
  getMuxStreamUrl,
  getMuxThumbnailUrl,
} from "@/lib/mux";

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey =
    process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;

  if (!validApiKey) return true;
  return apiKey === validApiKey;
};

/**
 * GET /api/mux/assets
 * Lists videos in your Mux account with playback IDs and thumbnails.
 */
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");

    const assets = await listAssets({ limit, page });

    const formattedAssets = await Promise.all(
      assets.map(async (asset) => {
        let playbackId = asset.playback_ids?.find((p) => p.policy === "public")?.id;

        // Auto-fix: If asset is ready but has no public playback ID, create one automatically
        if (!playbackId && asset.status === "ready") {
          playbackId = await ensurePublicPlaybackId(asset);
        } else if (!playbackId && asset.playback_ids && asset.playback_ids.length > 0) {
          playbackId = asset.playback_ids[0].id;
        }

        return {
          id: asset.id,
          status: asset.status,
          duration: asset.duration,
          aspectRatio: asset.aspect_ratio,
          createdAt: asset.created_at,
          playbackId: playbackId || null,
          hasPublicPlaybackId: !!playbackId,
          streamUrl: playbackId ? getMuxStreamUrl(playbackId) : null,
          thumbnailUrl: playbackId ? getMuxThumbnailUrl(playbackId) : null,
          passthrough: asset.passthrough,
        };
      })
    );

    return NextResponse.json({
      success: true,
      assets: formattedAssets,
      total: formattedAssets.length,
    });
  } catch (error: any) {
    console.error("❌ Error listing Mux assets:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to list Mux assets",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mux/assets?assetId=...
 * Deletes a video asset from Mux.
 */
export async function DELETE(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const assetId = request.nextUrl.searchParams.get("assetId");
  if (!assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  try {
    await deleteAsset(assetId);
    return NextResponse.json({
      success: true,
      message: "Mux asset deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting Mux asset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete Mux asset" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mux/assets
 * Body: { assetId: string }
 * Creates a public playback ID for an existing asset that only has signed or no playback IDs.
 */
export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { assetId } = body;

    if (!assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 });
    }

    const asset = await getAsset(assetId);
    const playbackId = await ensurePublicPlaybackId(asset);

    return NextResponse.json({
      success: true,
      playbackId,
      streamUrl: getMuxStreamUrl(playbackId),
      thumbnailUrl: getMuxThumbnailUrl(playbackId),
    });
  } catch (error: any) {
    console.error("❌ Error creating public playback ID:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create public playback ID" },
      { status: 500 }
    );
  }
}

