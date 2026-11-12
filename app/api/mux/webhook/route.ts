import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";
import { verifyMuxWebhookSignature } from "@/lib/mux";

export const dynamic = "force-dynamic";

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "0 mins";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs} secs`;
  return `${mins} min${mins > 1 ? "s" : ""}`;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("mux-signature");

    // 1. Verify Webhook Signature
    const isValid = verifyMuxWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      console.error("❌ Mux Webhook: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const data = event.data;

    console.log(`📡 Mux Webhook received: [${eventType}] - ID: ${data?.id}`);

    if (!adminDb) {
      throw new Error("Firebase Admin DB not initialized");
    }

    // 2. Handle video.asset.ready
    if (eventType === "video.asset.ready") {
      const assetId = data.id;
      const playbackId = data.playback_ids?.[0]?.id;
      const durationSeconds = data.duration;
      const formattedDuration = formatDuration(durationSeconds);
      const aspectRatio = data.aspect_ratio;
      const passthrough = data.passthrough;

      const streamUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : "";
      const thumbnailUrl = playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : "";

      console.log(`🎬 Asset ready: ${assetId}, Playback ID: ${playbackId}`);

      // Strategy A: If passthrough contains JSON { courseId, moduleId }
      let updated = false;
      if (passthrough) {
        try {
          let parsed: any = null;
          if (passthrough.startsWith("{")) {
            parsed = JSON.parse(passthrough);
          } else if (passthrough.includes(":")) {
            const [cId, mId] = passthrough.split(":");
            parsed = { courseId: cId, moduleId: mId };
          }

          if (parsed?.courseId && parsed?.moduleId) {
            const moduleRef = (adminDb as any)
              .collection("courses")
              .doc(parsed.courseId)
              .collection("modules")
              .doc(parsed.moduleId);

            const doc = await moduleRef.get();
            if (doc.exists) {
              await moduleRef.update({
                playbackId,
                assetId,
                videoUrl: streamUrl,
                streamUrl,
                thumbnailUrl,
                duration: doc.data()?.duration || formattedDuration,
                aspectRatio,
                muxStatus: "ready",
                streamType: "mux",
                updatedAt: admin.firestore.Timestamp.now(),
              });
              updated = true;
              console.log(`✅ Module ${parsed.moduleId} in Course ${parsed.courseId} updated via passthrough`);
            }
          }
        } catch (e) {
          console.warn("Could not parse passthrough:", e);
        }
      }

      // Strategy B: Match by assetId or upload_id via collectionGroup
      if (!updated && assetId) {
        const querySnapshot = await (adminDb as any)
          .collectionGroup("modules")
          .where("assetId", "==", assetId)
          .get();

        if (!querySnapshot.empty) {
          for (const doc of querySnapshot.docs) {
            await doc.ref.update({
              playbackId,
              videoUrl: streamUrl,
              streamUrl,
              thumbnailUrl,
              duration: doc.data()?.duration || formattedDuration,
              aspectRatio,
              muxStatus: "ready",
              streamType: "mux",
              updatedAt: admin.firestore.Timestamp.now(),
            });
            console.log(`✅ Module ${doc.id} updated via assetId match`);
          }
        } else if (data.upload_id) {
          // Try matching by uploadId
          const uploadSnapshot = await (adminDb as any)
            .collectionGroup("modules")
            .where("uploadId", "==", data.upload_id)
            .get();

          for (const doc of uploadSnapshot.docs) {
            await doc.ref.update({
              playbackId,
              assetId,
              videoUrl: streamUrl,
              streamUrl,
              thumbnailUrl,
              duration: doc.data()?.duration || formattedDuration,
              aspectRatio,
              muxStatus: "ready",
              streamType: "mux",
              updatedAt: admin.firestore.Timestamp.now(),
            });
            console.log(`✅ Module ${doc.id} updated via uploadId match`);
          }
        }
      }
    }

    // 3. Handle video.asset.errored
    if (eventType === "video.asset.errored") {
      const assetId = data.id;
      const errorMessage = data.errors?.messages?.[0] || "Video processing failed on Mux";
      console.error(`❌ Mux Asset errored: ${assetId} - ${errorMessage}`);

      const querySnapshot = await (adminDb as any)
        .collectionGroup("modules")
        .where("assetId", "==", assetId)
        .get();

      for (const doc of querySnapshot.docs) {
        await doc.ref.update({
          muxStatus: "errored",
          muxError: errorMessage,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      }
    }

    // 4. Handle video.upload.asset_created
    if (eventType === "video.upload.asset_created") {
      const uploadId = data.id;
      const assetId = data.asset_id;
      console.log(`📦 Mux Upload ${uploadId} produced Asset ${assetId}`);

      const querySnapshot = await (adminDb as any)
        .collectionGroup("modules")
        .where("uploadId", "==", uploadId)
        .get();

      for (const doc of querySnapshot.docs) {
        await doc.ref.update({
          assetId,
          muxStatus: "preparing",
          updatedAt: admin.firestore.Timestamp.now(),
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Mux Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isConfigured = !!(
    (process.env.MUX_TOKEN_ID || process.env.NEXT_PUBLIC_MUX_TOKEN_ID) &&
    (process.env.MUX_TOKEN_SECRET || process.env.NEXT_PUBLIC_MUX_TOKEN_SECRET)
  );
  const hasWebhookSecret = !!process.env.MUX_WEBHOOK_SECRET;

  return NextResponse.json({
    status: "active",
    endpoint: "/api/mux/webhook",
    productionWebhookUrl: "https://www.ancraze.com/api/mux/webhook",
    muxConfigured: isConfigured,
    webhookSecretConfigured: hasWebhookSecret,
    instructions: "Configure this webhook URL in your Mux Dashboard under Settings > Webhooks.",
    supportedEvents: [
      "video.asset.ready",
      "video.asset.errored",
      "video.upload.asset_created",
      "video.asset.deleted",
    ],
  });
}

