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

export const dynamic = "force-dynamic";
export const revalidate = 0;

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey =
    process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;

  if (!validApiKey) return true;
  return apiKey === validApiKey;
};

function extractAssetTitle(asset: {
  id: string;
  meta?: { title?: string; external_id?: string; creator_id?: string };
  passthrough?: string;
}): string {
  if (asset.meta?.title && asset.meta.title.trim()) {
    return asset.meta.title.trim();
  }

  if (asset.passthrough && asset.passthrough.trim()) {
    const raw = asset.passthrough.trim();
    if (raw.startsWith("{")) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.title === "string" && parsed.title.trim()) {
          return parsed.title.trim();
        }
        if (typeof parsed?.name === "string" && parsed.name.trim()) {
          return parsed.name.trim();
        }
      } catch {
        // Not valid JSON, fall through
      }
    }
    if (raw !== "ancraze-course-video") {
      return raw;
    }
  }

  return "";
}

/**
 * GET /api/mux/assets
 * Lists videos in your Mux account with titles, playback IDs, and thumbnails.
 */
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    const requestedLimit = parseInt(request.nextUrl.searchParams.get("limit") || "100", 10);
    const requestedPage = request.nextUrl.searchParams.get("page");
    const limit = Math.min(isNaN(requestedLimit) || requestedLimit <= 0 ? 100 : requestedLimit, 100);

    let assets = await listAssets({
      limit,
      page: requestedPage ? parseInt(requestedPage, 10) || 1 : 1,
    });

    // If no explicit page was requested and the first page is full (100 items),
    // automatically fetch up to 2 more pages so the entire Mux library is searchable by title.
    if (!requestedPage && assets.length === 100) {
      for (let nextPage = 2; nextPage <= 3; nextPage++) {
        const moreAssets = await listAssets({ limit: 100, page: nextPage });
        if (!moreAssets.length) break;
        assets = assets.concat(moreAssets);
        if (moreAssets.length < 100) break;
      }
    }

    const formattedAssets = await Promise.all(
      assets.map(async (asset) => {
        let publicPlaybackId = asset.playback_ids?.find((p) => p.policy === "public")?.id;

        // Auto-fix: If asset is ready but has no public playback ID, create one automatically
        if (!publicPlaybackId && asset.status === "ready") {
          publicPlaybackId = await ensurePublicPlaybackId(asset);
        }

        const resolvedTitle = extractAssetTitle(asset);

        return {
          id: asset.id,
          title: resolvedTitle || null,
          meta: asset.meta || null,
          status: asset.status,
          duration: asset.duration,
          aspectRatio: asset.aspect_ratio,
          createdAt: asset.created_at,
          playbackId: publicPlaybackId || null,
          hasPublicPlaybackId: !!publicPlaybackId,
          streamUrl: publicPlaybackId ? getMuxStreamUrl(publicPlaybackId) : null,
          thumbnailUrl: publicPlaybackId ? getMuxThumbnailUrl(publicPlaybackId) : null,
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

