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

/**
 * Safely updates any module matching a specific filter field (e.g. assetId or uploadId).
 * 1. Tries Firestore collectionGroup("modules") first.
 * 2. If collectionGroup fails due to missing index (code 9 FAILED_PRECONDITION),
 *    gracefully falls back to searching each course's `modules` subcollection directly,
 *    which does NOT require a collectionGroup index exemption.
 */
async function findAndUpdateModules(
  field: "assetId" | "uploadId",
  value: string,
  updateData: Record<string, any>
): Promise<number> {
  if (!adminDb || !value) return 0;
  let updateCount = 0;

  // Attempt 1: collectionGroup query (fast when index is created)
  try {
    const groupSnapshot = await (adminDb as any)
      .collectionGroup("modules")
      .where(field, "==", value)
      .get();

    if (!groupSnapshot.empty) {
      for (const doc of groupSnapshot.docs) {
        await doc.ref.update({
          ...updateData,
          updatedAt: admin.firestore.Timestamp.now(),
        });
        updateCount++;
      }
      return updateCount;
    }
  } catch (err: any) {
    // If missing index (code 9 / FAILED_PRECONDITION), log warning and proceed to fallback
    console.warn(
      `⚠️ collectionGroup query for ${field}=${value} requires an index (${err.code || err.message}). Falling back to course subcollection scan.`
    );
  }

  // Attempt 2: Direct subcollection query under each course (does NOT require collectionGroup index)
  try {
    const coursesSnapshot = await (adminDb as any).collection("courses").get();
    for (const courseDoc of coursesSnapshot.docs) {
      const matchSnapshot = await courseDoc.ref
        .collection("modules")
        .where(field, "==", value)
        .get();

      for (const modDoc of matchSnapshot.docs) {
        await modDoc.ref.update({
          ...updateData,
          updatedAt: admin.firestore.Timestamp.now(),
        });
        updateCount++;
      }
    }
  } catch (fallbackErr: any) {
    console.error("❌ Fallback search across courses failed:", fallbackErr);
  }

  return updateCount;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("mux-signature");

    // 1. Verify Webhook Signature (if secret configured)
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
      console.warn("⚠️ Firebase Admin DB not initialized; acknowledging webhook to prevent retries.");
      return NextResponse.json({ received: true, warning: "Firebase Admin not initialized" }, { status: 200 });
    }

    // 2. Handle video.asset.ready
    if (eventType === "video.asset.ready") {
      const assetId = data.id;
      // Prefer public playback ID
      const publicPb = data.playback_ids?.find((p: any) => p.policy === "public");
      const playbackId = publicPb ? publicPb.id : data.playback_ids?.[0]?.id;
      const durationSeconds = data.duration;
      const formattedDuration = formatDuration(durationSeconds);
      const aspectRatio = data.aspect_ratio;
      const passthrough = data.passthrough;

      const streamUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : "";
      const thumbnailUrl = playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : "";

      console.log(`🎬 Asset ready: ${assetId}, Playback ID: ${playbackId}`);

      let updatedViaPassthrough = false;

      // Strategy A: If passthrough contains JSON { courseId, moduleId } or courseId:moduleId
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
              updatedViaPassthrough = true;
              console.log(`✅ Module ${parsed.moduleId} in Course ${parsed.courseId} updated via passthrough`);
            }
          }
        } catch (e) {
          console.warn("Could not parse passthrough:", e);
        }
      }

      // Strategy B: Safe search by assetId or upload_id (without requiring collectionGroup index)
      if (!updatedViaPassthrough && assetId) {
        const updatePayload: Record<string, any> = {
          playbackId,
          videoUrl: streamUrl,
          streamUrl,
          thumbnailUrl,
          duration: formattedDuration,
          aspectRatio,
          muxStatus: "ready",
          streamType: "mux",
        };

        let count = await findAndUpdateModules("assetId", assetId, updatePayload);

        if (count === 0 && data.upload_id) {
          count = await findAndUpdateModules("uploadId", data.upload_id, {
            ...updatePayload,
            assetId,
          });
        }

        if (count > 0) {
          console.log(`✅ Updated ${count} module(s) for Asset ${assetId}`);
        } else {
          console.log(`ℹ️ Asset ${assetId} not currently linked to any module (created directly or unassigned).`);
        }
      }
    }

    // 3. Handle video.asset.errored
    if (eventType === "video.asset.errored") {
      const assetId = data.id;
      const errorMessage = data.errors?.messages?.[0] || "Video processing failed on Mux";
      console.error(`❌ Mux Asset errored: ${assetId} - ${errorMessage}`);

      await findAndUpdateModules("assetId", assetId, {
        muxStatus: "errored",
        muxError: errorMessage,
      });
    }

    // 4. Handle video.upload.asset_created
    if (eventType === "video.upload.asset_created") {
      const uploadId = data.id;
      const assetId = data.asset_id;
      console.log(`📦 Mux Upload ${uploadId} produced Asset ${assetId}`);

      if (uploadId && assetId) {
        await findAndUpdateModules("uploadId", uploadId, {
          assetId,
          muxStatus: "preparing",
        });
      }
    }

    // Always return HTTP 200 so Mux acknowledges the delivery and does not retry in error loops
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Mux Webhook Error:", error);
    // Return 200 with error details so Mux does not loop retry indefinitely for unrecoverable errors
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 200 }
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
