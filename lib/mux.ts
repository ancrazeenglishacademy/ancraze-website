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
 * Creates a public (or signed) playback ID for an existing Mux asset.
 */
export async function createPlaybackId(
  assetId: string,
  policy: "public" | "signed" = "public"
): Promise<MuxPlaybackId> {
  const headers = getMuxAuthHeaders();

  const response = await fetch(`${MUX_API_BASE}/assets/${assetId}/playback-ids`, {
    method: "POST",
    headers,
    body: JSON.stringify({ policy }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to create playback ID for asset ${assetId}`);
  }

  return data.data;
}

/**
 * Ensures an asset has a public playback ID. If only signed or none exists, creates one automatically.
 */
export async function ensurePublicPlaybackId(asset: MuxAsset): Promise<string> {
  const publicPb = asset.playback_ids?.find((p) => p.policy === "public");
  if (publicPb) return publicPb.id;

  try {
    console.log(`🔑 Creating public playback ID for asset ${asset.id}...`);
    const newPb = await createPlaybackId(asset.id, "public");
    return newPb?.id || "";
  } catch (err) {
    console.warn(`Could not create public playback ID for asset ${asset.id}:`, err);
    return "";
  }
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

  // Normalize module task & task image stored in Firebase Storage
  const rawTaskTitle = data.taskTitle ?? data.task?.title ?? "";
  const rawTaskDescription = data.taskDescription ?? data.task?.description ?? "";
  const rawTaskType = data.taskType ?? data.task?.type ?? "speaking_recording";
  const rawTaskImageUrl = data.taskImageUrl ?? data.taskImage ?? data.task?.imageUrl ?? "";
  const hasTask = Boolean(rawTaskTitle || rawTaskDescription || rawTaskImageUrl);

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
    taskTitle: rawTaskTitle || null,
    taskDescription: rawTaskDescription || null,
    taskType: rawTaskType,
    taskImageUrl: isLocked ? null : (rawTaskImageUrl || null),
    taskImage: isLocked ? null : (rawTaskImageUrl || null),
    hasTask,
    task: hasTask
      ? {
          title: rawTaskTitle || "",
          description: rawTaskDescription || "",
          type: rawTaskType,
          imageUrl: isLocked ? null : (rawTaskImageUrl || null),
        }
      : null,
  };
}

/**
 * Helper to parse any Firestore Timestamp, Date, or ISO string into a Date object.
 */
function parseFirestoreDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val?.toDate === "function") {
    const d = val.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  if (typeof val?._seconds === "number") {
    return new Date(val._seconds * 1000);
  }
  if (typeof val?.seconds === "number") {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats a Day object's task & taskImageUrl (stored in Firebase Storage)
 */
export function formatDayTask(day: any, isLocked = false) {
  const rawTaskTitle = day?.taskTitle ?? day?.task?.title ?? "";
  const rawTaskDescription = day?.taskDescription ?? day?.task?.description ?? "";
  const rawTaskType = day?.taskType ?? day?.task?.type ?? "speaking_recording";
  const rawTaskImageUrl = day?.taskImageUrl ?? day?.taskImage ?? day?.task?.imageUrl ?? "";
  const hasTask = Boolean(rawTaskTitle || rawTaskDescription || rawTaskImageUrl);

  return {
    taskTitle: rawTaskTitle || null,
    taskDescription: rawTaskDescription || null,
    taskType: rawTaskType,
    taskImageUrl: isLocked ? null : (rawTaskImageUrl || null),
    taskImage: isLocked ? null : (rawTaskImageUrl || null),
    hasTask,
    task: hasTask
      ? {
          title: rawTaskTitle || "",
          description: rawTaskDescription || "",
          type: rawTaskType,
          imageUrl: isLocked ? null : (rawTaskImageUrl || null),
        }
      : null,
  };
}

/**
 * Helper to merge a parent Day's task fields onto a module so the app always receives
 * the Day's task & taskImageUrl alongside the module video.
 */
function attachDayTaskToModule(formattedMod: any, dayObj: any, isLocked: boolean) {
  if (!dayObj) return formattedMod;
  const dayTaskFields = formatDayTask(dayObj, isLocked);
  if (!dayTaskFields.hasTask) return formattedMod;

  return {
    ...formattedMod,
    taskTitle: dayTaskFields.taskTitle || formattedMod.taskTitle,
    taskDescription: dayTaskFields.taskDescription || formattedMod.taskDescription,
    taskType: dayTaskFields.taskType || formattedMod.taskType,
    taskImageUrl: dayTaskFields.taskImageUrl || formattedMod.taskImageUrl,
    taskImage: dayTaskFields.taskImage || formattedMod.taskImage,
    hasTask: true,
    task: dayTaskFields.task || formattedMod.task,
  };
}

/**
 * Computes day-by-day video release (for non-trainer-guided courses: 1 video per day)
 * or task-based 3-day batch unlocking (for trainer-guided courses: next 3 days unlocked
 * whenever the trainer marks a day's task as completed).
 */
export function computeCourseAccessAndLocking(options: {
  courseId: string;
  courseData: any;
  days?: any[];
  modules: any[];
  userData?: any | null;
  isPurchased: boolean;
  isAdminOrTrainer?: boolean;
  approvedTasksCount?: number;
}) {
  const {
    courseId,
    courseData,
    days = [],
    modules = [],
    userData = null,
    isPurchased,
    isAdminOrTrainer = false,
    approvedTasksCount = 0,
  } = options;

  const isTrainerGuided = Boolean(courseData?.isTrainerGuided);
  const isTrainerPreviewAccount = Boolean(
    userData?.isTrainerPreviewAccount || userData?.trainerPreviewAccount
  );
  const dayMap = new Map<string, any>();
  days.forEach((d: any) => {
    if (d?.id) dayMap.set(d.id, d);
  });

  // Admins / SuperAdmins / Trainers or Trainer Preview Student Accounts get full unlocked access to all videos without waiting for days or task completions
  if (isAdminOrTrainer || isTrainerPreviewAccount) {
    const formattedDays = days.map((d: any, dIdx: number) => ({
      ...d,
      ...formatDayTask(d, false),
      dayNumber: dIdx + 1,
      isLocked: false,
      modules: (d.modules || []).map((m: any) =>
        attachDayTaskToModule(formatModuleForStreaming(m, false), d, false)
      ),
    }));
    const formattedModules = modules.map((m: any) =>
      attachDayTaskToModule(formatModuleForStreaming(m, false), dayMap.get(m.day), false)
    );
    return {
      days: formattedDays,
      modules: formattedModules,
      accessControl: {
        mode: isTrainerPreviewAccount
          ? "trainer_preview"
          : isTrainerGuided
          ? "trainer_guided"
          : "daily_drip",
        isTrainerGuided,
        isTrainerPreviewAccount,
        isAdminOrTrainer: Boolean(isAdminOrTrainer),
        isPurchased: true,
        unlockedDaysCount: days.length || modules.length,
        unlockedVideosCount: modules.length,
        totalDaysCount: days.length,
        totalVideosCount: modules.length,
      },
    };
  }

  // Unenrolled user: lock after first 3 preview videos
  if (!isPurchased) {
    let globalIdx = 0;
    const formattedDays = days.map((d: any, dIdx: number) => {
      const dayMods = (d.modules || []).map((m: any) => {
        const isLocked = globalIdx >= 3;
        globalIdx++;
        return {
          ...attachDayTaskToModule(formatModuleForStreaming(m, isLocked), d, isLocked),
          unlockDayNumber: dIdx + 1,
          lockReason: isLocked ? "Enroll in this course to unlock full video access." : null,
        };
      });
      const isDayLocked = dayMods.length > 0 ? dayMods.every((m: any) => m.isLocked) : dIdx >= 3;
      return {
        ...d,
        ...formatDayTask(d, isDayLocked),
        isLocked: isDayLocked,
        modules: dayMods,
      };
    });

    const formattedModules = modules.map((m: any, idx: number) => {
      const isLocked = idx >= 3;
      return {
        ...attachDayTaskToModule(formatModuleForStreaming(m, isLocked), dayMap.get(m.day), isLocked),
        unlockDayNumber: idx + 1,
        lockReason: isLocked ? "Enroll in this course to unlock full video access." : null,
      };
    });

    return {
      days: formattedDays,
      modules: formattedModules,
      accessControl: {
        mode: isTrainerGuided ? "trainer_guided" : "daily_drip",
        isTrainerGuided,
        isPurchased: false,
        unlockedDaysCount: Math.min(3, days.length || 3),
        unlockedVideosCount: Math.min(3, modules.length),
        totalDaysCount: days.length,
        totalVideosCount: modules.length,
      },
    };
  }

  // Enrolled Student:
  const progress = userData?.courseProgress?.[courseId] || {};
  const enrollmentInfo = userData?.courseEnrollments?.[courseId] || {};

  if (!isTrainerGuided) {
    // NON-TRAINER-GUIDED COURSE:
    // Release one by one on a daily basis as 1 video each day since enrollment.
    const enrolledDate =
      parseFirestoreDate(enrollmentInfo.enrolledAt) ||
      parseFirestoreDate(progress.enrolledAt) ||
      parseFirestoreDate(userData?.createdAt) ||
      new Date();

    // Calculate calendar days elapsed in IST (UTC+5:30) so each new day releases 1 video
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const enrolledDayNumber = Math.floor((enrolledDate.getTime() + IST_OFFSET_MS) / (1000 * 60 * 60 * 24));
    const currentDayNumber = Math.floor((Date.now() + IST_OFFSET_MS) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, currentDayNumber - enrolledDayNumber);

    // Day 1 of enrollment = 1 video unlocked; Day 2 = 2 videos unlocked, etc.
    const manualUnlocked = Number(progress.unlockedVideosCount || progress.unlockedDaysCount || 0);
    const unlockedVideosCount = Math.max(1, elapsedDays + 1, manualUnlocked);

    let globalVideoCounter = 0;
    const unlockedModuleIds = new Set<string>();

    const formattedDays = days.map((d: any, dIdx: number) => {
      const dayMods = (d.modules || []).map((m: any) => {
        const videoIndex = globalVideoCounter;
        globalVideoCounter++;
        const isLocked = videoIndex >= unlockedVideosCount;
        if (!isLocked && m.id) unlockedModuleIds.add(m.id);
        return {
          ...attachDayTaskToModule(formatModuleForStreaming(m, isLocked), d, isLocked),
          unlockDayNumber: videoIndex + 1,
          lockReason: isLocked
            ? `Released 1 video per day. This video unlocks on Day ${videoIndex + 1}.`
            : null,
        };
      });
      const isDayLocked = dayMods.length > 0 ? dayMods.every((m: any) => m.isLocked) : dIdx >= unlockedVideosCount;

      return {
        ...d,
        ...formatDayTask(d, isDayLocked),
        dayNumber: dIdx + 1,
        isLocked: isDayLocked,
        modules: dayMods,
      };
    });

    const formattedModules = modules.map((m: any, idx: number) => {
      const isLocked =
        days.length > 0 && globalVideoCounter > 0
          ? !unlockedModuleIds.has(m.id) && idx >= unlockedVideosCount
          : idx >= unlockedVideosCount;
      return {
        ...attachDayTaskToModule(formatModuleForStreaming(m, isLocked), dayMap.get(m.day), isLocked),
        unlockDayNumber: idx + 1,
        lockReason: isLocked
          ? `Released 1 video per day. This video unlocks on Day ${idx + 1}.`
          : null,
      };
    });

    return {
      days: formattedDays,
      modules: formattedModules,
      accessControl: {
        mode: "daily_drip",
        isTrainerGuided: false,
        isPurchased: true,
        enrolledAt: enrolledDate.toISOString(),
        currentCourseDay: elapsedDays + 1,
        unlockedVideosCount,
        unlockedDaysCount: unlockedVideosCount,
        totalDaysCount: days.length,
        totalVideosCount: modules.length,
      },
    };
  } else {
    // TRAINER-GUIDED COURSE:
    // Initially Day 1 is unlocked. Whenever the trainer marks a day's task as completed,
    // the next 3 days' videos are unlocked.
    const completedDayIds: string[] = Array.isArray(progress.completedDayIds)
      ? progress.completedDayIds
      : [];
    const completedTasksCount = Math.max(
      Number(progress.completedTasksCount || 0),
      Number(approvedTasksCount || 0),
      completedDayIds.length
    );
    const storedUnlockedDays = Number(progress.unlockedDaysCount || 0);
    const unlockedDaysCount = Math.max(1, storedUnlockedDays, 1 + completedTasksCount * 3);

    const unlockedDayIds = new Set<string>();
    const formattedDays = days.map((d: any, dIdx: number) => {
      const isDayLocked = dIdx >= unlockedDaysCount;
      if (!isDayLocked && d.id) unlockedDayIds.add(d.id);
      const isTaskCompleted = completedDayIds.includes(d.id) || dIdx < completedTasksCount;

      const dayMods = (d.modules || []).map((m: any) => ({
        ...attachDayTaskToModule(formatModuleForStreaming(m, isDayLocked), d, isDayLocked),
        unlockDayNumber: dIdx + 1,
        isTaskCompleted,
        lockReason: isDayLocked
          ? "Complete your current day's task and get trainer approval to unlock the next 3 days' videos."
          : null,
      }));

      return {
        ...d,
        ...formatDayTask(d, isDayLocked),
        dayNumber: dIdx + 1,
        isLocked: isDayLocked,
        isTaskCompleted,
        modules: dayMods,
      };
    });

    let unlockedVideosCount = 0;
    const formattedModules = modules.map((m: any, idx: number) => {
      let isLocked: boolean;
      if (days.length > 0 && m.day) {
        isLocked = !unlockedDayIds.has(m.day);
      } else {
        isLocked = idx >= unlockedDaysCount;
      }
      if (!isLocked) unlockedVideosCount++;
      return {
        ...attachDayTaskToModule(formatModuleForStreaming(m, isLocked), dayMap.get(m.day), isLocked),
        unlockDayNumber: idx + 1,
        lockReason: isLocked
          ? "Complete your current day's task and get trainer approval to unlock the next 3 days' videos."
          : null,
      };
    });

    return {
      days: formattedDays,
      modules: formattedModules,
      accessControl: {
        mode: "trainer_guided",
        isTrainerGuided: true,
        isPurchased: true,
        completedTasksCount,
        completedDayIds,
        unlockedDaysCount,
        unlockedVideosCount,
        totalDaysCount: days.length,
        totalVideosCount: modules.length,
      },
    };
  }
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



