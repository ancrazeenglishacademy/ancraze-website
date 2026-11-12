/**
 * Mux Video API Client
 * Direct REST API client for Mux Video streaming and direct uploads.
 * Uses HTTP Basic Auth with MUX_TOKEN_ID and MUX_TOKEN_SECRET.
 */

import crypto from "crypto";

const MUX_API_BASE = "https://api.mux.com/video/v1";

function getMuxAuthHeaders(): HeadersInit {
  const tokenId = process.env.MUX_TOKEN_ID || process.env.NEXT_PUBLIC_MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET || process.env.NEXT_PUBLIC_MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error(
      "Mux API credentials not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env.local"
    );
  }

  const credentials = Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");
  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
}

export interface MuxPlaybackId {
  id: string;
  policy: "public" | "signed";
}

export interface MuxAsset {
  id: string;
  status: "preparing" | "ready" | "errored";
  playback_ids?: MuxPlaybackId[];
  duration?: number;
  aspect_ratio?: string;
  created_at: string;
  max_stored_resolution?: string;
  max_stored_frame_rate?: number;
  tracks?: Array<{
    type: "video" | "audio" | "text";
    duration?: number;
    max_width?: number;
    max_height?: number;
  }>;
  errors?: {
    type: string;
    messages: string[];
  };
  passthrough?: string;
}

export interface MuxDirectUpload {
  id: string;
  url: string;
  status: "waiting" | "asset_created" | "errored" | "cancelled" | "timed_out";
  asset_id?: string;
  timeout?: number;
}

/**
 * Creates a direct upload URL so client browsers can upload directly to Mux.
 */
export async function createDirectUpload(options?: {
  corsOrigin?: string;
  passthrough?: string;
}): Promise<MuxDirectUpload> {
  const headers = getMuxAuthHeaders();

  const response = await fetch(`${MUX_API_BASE}/uploads`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      cors_origin: options?.corsOrigin || "*",
      new_asset_settings: {
        playback_policy: ["public"],
        passthrough: options?.passthrough || "ancraze-course-video",
        mp4_support: "standard", // allows direct mp4 download fallback if ever needed
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to create Mux direct upload URL");
  }

  return data.data;
}

/**
 * Retrieves the status of a direct upload, including the created asset_id once completed.
 */
export async function getDirectUpload(uploadId: string): Promise<MuxDirectUpload> {
  const headers = getMuxAuthHeaders();

  const response = await fetch(`${MUX_API_BASE}/uploads/${uploadId}`, {
    method: "GET",
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to fetch Mux upload ${uploadId}`);
  }

  return data.data;
}

/**
 * Retrieves a Mux video asset by ID, including its playback IDs and streaming info.
 */
export async function getAsset(assetId: string): Promise<MuxAsset> {
  const headers = getMuxAuthHeaders();

  const response = await fetch(`${MUX_API_BASE}/assets/${assetId}`, {
    method: "GET",
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to fetch Mux asset ${assetId}`);
  }

  return data.data;
}

/**
 * Lists all video assets from Mux account.
 */
export async function listAssets(options?: {
  limit?: number;
  page?: number;
}): Promise<MuxAsset[]> {
  const headers = getMuxAuthHeaders();
  const limit = options?.limit || 25;
  const page = options?.page || 1;

  const response = await fetch(
    `${MUX_API_BASE}/assets?limit=${limit}&page=${page}`,
    {
      method: "GET",
      headers,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to list Mux assets");
  }

  return data.data || [];
}

/**
 * Deletes an asset from Mux.
 */
export async function deleteAsset(assetId: string): Promise<boolean> {
  const headers = getMuxAuthHeaders();

  const response = await fetch(`${MUX_API_BASE}/assets/${assetId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok && response.status !== 204) {
    const data = await response.json();
    throw new Error(data.error?.message || `Failed to delete Mux asset ${assetId}`);
  }

  return true;
}

/**
 * Helpers to format Mux URLs from a playbackId
 */
export function getMuxStreamUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getMuxThumbnailUrl(playbackId: string, options?: { time?: number; width?: number; height?: number }): string {
  const params = new URLSearchParams();
  if (options?.time !== undefined) params.set("time", options.time.toString());
  if (options?.width !== undefined) params.set("width", options.width.toString());
  if (options?.height !== undefined) params.set("height", options.height.toString());

  const query = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${query ? `?${query}` : ""}`;
}

export function getMuxAnimatedGifUrl(playbackId: string, options?: { start?: number; end?: number; width?: number }): string {
  const params = new URLSearchParams();
  if (options?.start !== undefined) params.set("start", options.start.toString());
  if (options?.end !== undefined) params.set("end", options.end.toString());
  if (options?.width !== undefined) params.set("width", options.width.toString());

  const query = params.toString();
  return `https://image.mux.com/${playbackId}/animated.gif${query ? `?${query}` : ""}`;
}

/**
 * Normalizes a module object to ensure video streaming always utilizes Mux HLS CDN
 * for web, mobile apps (React Native, Flutter, Swift/iOS AVPlayer, Kotlin/Android ExoPlayer).
 */
export function formatModuleForStreaming(data: any, isLocked = false) {
  let playbackId = data.playbackId || "";
  let videoUrl = data.videoUrl || "";
  let streamUrl = data.streamUrl || "";
  let thumbnailUrl = data.thumbnailUrl || "";

  // If playbackId is empty, try extracting it from videoUrl (e.g. stream.mux.com/<id>.m3u8)
  if (!playbackId && videoUrl) {
    const match = videoUrl.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)(?:\.m3u8)?/);
    if (match && match[1]) {
      playbackId = match[1];
    }
  }

  // If playbackId is known, standardize all stream and thumbnail URLs
  if (playbackId) {
    streamUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    videoUrl = streamUrl; // Mobile apps reading videoUrl get the HLS stream
    if (!thumbnailUrl) {
      thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
    }
  }

  const posterUrl = thumbnailUrl || (playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : "");

  return {
    ...data,
    isLocked: !!isLocked,
    playbackId: isLocked ? null : (playbackId || null),
    videoUrl: isLocked ? null : (videoUrl || null),
    streamUrl: isLocked ? null : (streamUrl || videoUrl || null),
    hlsUrl: isLocked ? null : (streamUrl || (playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null)),
    thumbnailUrl: thumbnailUrl || posterUrl || null,
    posterUrl: posterUrl || null,
    streamType: playbackId ? "mux" : (data.streamType || "legacy"),
  };
}

/**
 * Verifies Mux Webhook signature (mux-signature header).
 * Header format: t=1612345678,v1=6e3b8a...
 */
export function verifyMuxWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret?: string
): boolean {
  const webhookSecret = secret || process.env.MUX_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("⚠️ MUX_WEBHOOK_SECRET is not configured; allowing webhook in development mode.");
    return true;
  }
  if (!signatureHeader) return false;

  try {
    const parts = signatureHeader.split(",");
    let timestamp = "";
    let expectedSignature = "";

    for (const part of parts) {
      const [key, value] = part.trim().split("=");
      if (key === "t") timestamp = value;
      if (key === "v1") expectedSignature = value;
    }

    if (!timestamp || !expectedSignature) return false;

    // Tolerance window (allow up to 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);
    if (Math.abs(currentTime - webhookTime) > 300) {
      console.warn("⚠️ Mux webhook timestamp outside 5-minute tolerance window");
    }

    const payload = `${timestamp}.${rawBody}`;
    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    if (computedSignature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );
  } catch (err) {
    console.error("❌ Error verifying Mux webhook signature:", err);
    return false;
  }
}



