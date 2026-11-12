import { NextRequest, NextResponse } from "next/server";
import { createDirectUpload, getDirectUpload, getAsset } from "@/lib/mux";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    console.log("📹 /api/upload-video: Processing video upload to Mux");

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const courseId = (formData.get("courseId") as string) || "general";
    const moduleId = (formData.get("moduleId") as string) || "";

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    console.log(`📹 Video file received: ${videoFile.name} (${videoFile.size} bytes)`);

    // 1. Create a Direct Upload on Mux
    const passthroughData = JSON.stringify({ courseId, moduleId, name: videoFile.name });
    const upload = await createDirectUpload({
      passthrough: passthroughData,
    });

    console.log(`📤 Mux Direct Upload created: ${upload.id}`);

    // 2. Upload file buffer to Mux Direct Upload URL
    const fileBuffer = await videoFile.arrayBuffer();
    const putResponse = await fetch(upload.url, {
      method: "PUT",
      headers: {
        "Content-Type": videoFile.type || "video/mp4",
      },
      body: Buffer.from(fileBuffer),
    });

    if (!putResponse.ok) {
      throw new Error(`Failed to stream video to Mux direct upload: HTTP ${putResponse.status}`);
    }

    console.log("✅ Video payload delivered to Mux. Waiting for asset creation...");

    // 3. Poll for asset creation (up to 30 seconds)
    let assetId = upload.asset_id;
    let attempts = 0;
    while (!assetId && attempts < 15) {
      await new Promise((res) => setTimeout(res, 2000));
      const status = await getDirectUpload(upload.id);
      if (status.asset_id) {
        assetId = status.asset_id;
        break;
      }
      if (status.status === "errored") {
        throw new Error("Mux reported upload status: errored");
      }
      attempts++;
    }

    let playbackId = "";
    let duration = "";
    if (assetId) {
      // 4. Retrieve asset details to get playbackId
      let assetAttempts = 0;
      while (!playbackId && assetAttempts < 10) {
        try {
          const asset = await getAsset(assetId);
          if (asset.playback_ids && asset.playback_ids.length > 0) {
            playbackId = asset.playback_ids[0].id;
            if (asset.duration) {
              const mins = Math.floor(asset.duration / 60);
              const secs = Math.floor(asset.duration % 60);
              duration = mins > 0 ? `${mins} mins` : `${secs} secs`;
            }
            break;
          }
        } catch (e) {
          // asset may still be processing
        }
        await new Promise((res) => setTimeout(res, 2000));
        assetAttempts++;
      }
    }

    const streamUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : "";
    const thumbnailUrl = playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : "";

    return NextResponse.json(
      {
        success: true,
        message: "Video uploaded to Mux successfully",
        uploadId: upload.id,
        assetId: assetId || null,
        playbackId: playbackId || null,
        videoUrl: streamUrl,
        streamUrl: streamUrl,
        thumbnailUrl: thumbnailUrl,
        posterUrl: thumbnailUrl,
        duration: duration || "10 mins",
        streamType: "mux",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error in /api/upload-video:", error);
    return NextResponse.json(
      {
        error: "Failed to upload video to Mux",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
