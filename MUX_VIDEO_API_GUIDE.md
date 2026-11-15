# Mux Video API & Streaming Guide 🎥

> **Migration Summary:** All video streaming and module media have transitioned from raw Firebase Storage MP4 uploads to **Mux Video API** utilizing global Adaptive Bitrate (ABR) HLS streaming via Mux's CDN.

---

## 1. Key Changes: Firebase Storage vs. Mux Video

| Feature | Old (Firebase Storage) | New (Mux Video API) |
| :--- | :--- | :--- |
| **Video Format** | Static `.mp4` / `.mov` files | Adaptive HLS (`.m3u8`) with multi-resolution renditions (1080p, 720p, 480p, 360p) |
| **Upload Pipeline** | Client uploads file to backend `/api/upload-video`, then server streams to Firebase Storage | Client requests Direct Upload URL from `/api/mux/upload` and uploads directly to Mux (0 server load) |
| **Database Fields** | `videoUrl: "https://storage.googleapis.com/..."` | `playbackId`, `assetId`, `streamUrl`, `thumbnailUrl`, `streamType: "mux"` |
| **Buffering / Speed** | Slow on mobile data; high bandwidth costs | Instant playback startup via global edge CDN; low bandwidth overhead |
| **Security & Locking** | Direct MP4 link was easily downloadable | Un-enrolled courses mask `playbackId` and `streamUrl` as `null` server-side |
| **Thumbnail Generation** | Manual upload or static placeholder | Auto-generated dynamically: `https://image.mux.com/{playbackId}/thumbnail.jpg` |
| **Asynchronous Webhooks** | Not available | Mux Webhook automatically updates Firestore with asset resolution, duration, and playback ID |

---

## 2. Environment Configuration

Add the following environment variables to your `.env.local` or Vercel Environment Variables:

```env
# Mux API Credentials (from https://dashboard.mux.com/settings/access-tokens)
MUX_TOKEN_ID=your_mux_token_id_here
MUX_TOKEN_SECRET=your_mux_token_secret_here

# Mux Webhook Signing Secret (from Mux Dashboard -> Settings -> Webhooks)
MUX_WEBHOOK_SECRET=your_mux_webhook_signing_secret

# Internal API Protection (Optional)
INTERNAL_API_KEY=your_internal_secret_key
NEXT_PUBLIC_INTERNAL_API_KEY=your_internal_secret_key
```

---

## 3. Architecture & Upload Flow

```
[ Admin / Trainer Portal ]
        │
        ▼ 1. POST /api/mux/upload
[ Ancraze Backend ] ──> Requests Direct Upload URL from Mux Video API
        │
        ▼ 2. Returns { upload: { id, url } }
[ Admin / Trainer Portal ]
        │
        ▼ 3. Direct HTTP PUT video file to Mux Upload URL
[ Mux Video Ingestion CDN ]
        │
        ├── 4. Mux encodes multi-resolution HLS chunks (.m3u8)
        │
        ▼ 5. POST /api/mux/webhook (video.asset.ready)
[ Ancraze Webhook Handler ] ──> Automatically updates module in Firestore with playbackId, streamUrl, duration
```

---

## 4. API Endpoints Reference

### 4.1. Request Direct Upload URL
Create a short-lived pre-signed URL to upload video files directly to Mux.

- **Endpoint:** `POST /api/mux/upload`
- **Headers:**
  - `Content-Type: application/json`
  - `x-api-key: <INTERNAL_API_KEY>` (if configured)
- **Request Body:**
  ```json
  {
    "passthrough": "course_<courseId>_module_<moduleId>"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "upload": {
      "id": "upload_abc123xyz",
      "url": "https://storage.googleapis.com/video-storage/direct-upload-...",
      "status": "waiting",
      "timeout": 3600
    }
  }
  ```

---

### 4.2. Upload Video Binary Directly to Mux
Upload the video file directly from the browser or mobile app to the Mux `upload.url`:

- **Method:** `PUT`
- **URL:** `<upload.url>` (received from step 4.1)
- **Headers:**
  - `Content-Type: video/mp4` (or matching video mime-type)
- **Body:** Binary File Data

```javascript
// Example in JavaScript / React
await fetch(upload.url, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
});
```

---

### 4.3. Check Direct Upload Status (Polling Alternative)
If webhooks are not yet connected in local development, query the upload status directly:

- **Endpoint:** `GET /api/mux/upload?uploadId=upload_abc123xyz`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "upload": {
      "id": "upload_abc123xyz",
      "status": "asset_created",
      "asset_id": "asset_987654321"
    },
    "asset": {
      "id": "asset_987654321",
      "status": "ready",
      "playback_ids": [{ "id": "mUxPlAyBaCkId123", "policy": "public" }]
    },
    "playbackId": "mUxPlAyBaCkId123",
    "streamUrl": "https://stream.mux.com/mUxPlAyBaCkId123.m3u8",
    "thumbnailUrl": "https://image.mux.com/mUxPlAyBaCkId123/thumbnail.jpg"
  }
  ```

---

### 4.4. List Available Mux Assets
Browse uploaded videos across your Mux account (used in the Admin Video Picker).

- **Endpoint:** `GET /api/mux/assets?limit=50&page=1`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "total": 12,
    "assets": [
      {
        "id": "asset_01",
        "status": "ready",
        "duration": 482.15,
        "aspectRatio": "16:9",
        "createdAt": "1731665400",
        "playbackId": "abc123playbackId",
        "hasPublicPlaybackId": true,
        "streamUrl": "https://stream.mux.com/abc123playbackId.m3u8",
        "thumbnailUrl": "https://image.mux.com/abc123playbackId/thumbnail.jpg"
      }
    ]
  }
  ```

---

### 4.5. Delete Mux Asset
Delete a video asset permanently from Mux storage:

- **Endpoint:** `DELETE /api/mux/assets?assetId=asset_01`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Mux asset deleted successfully"
  }
  ```

---

### 4.6. Mux Webhook Listener
Automates status updates when encoding finishes.

- **Endpoint:** `POST /api/mux/webhook`
- **Headers:** `mux-signature: t=...,v1=...`
- **Handled Events:**
  - `video.asset.ready`: Extracts `playbackId`, duration, aspect ratio, and saves stream URLs directly to matching Firestore module documents.
  - `video.asset.errored`: Marks module encoding state as failed.
  - `video.upload.asset_created`: Associates the created `assetId` with the corresponding upload.

---

## 5. Course Module Creation & Update Payloads

### Create Module (`POST /api/modules`)
When creating or attaching a video module, pass the `playbackId`:

```json
{
  "courseId": "30-day-foundational",
  "moduleTitle": "Day 01 - Code 1 to 5 Introduction",
  "day": "day_01_id",
  "playbackId": "abc123playbackId",
  "assetId": "asset_01",
  "streamType": "mux",
  "duration": "15 mins",
  "description": "Learn the first 5 sentence formation codes.",
  "questions": [
    {
      "question": "Construct code 1 with present continuous.",
      "answer": "Subject + am/is/are + verb-ing"
    }
  ]
}
```

> **Automatic URL Population:** If `playbackId` is supplied without `videoUrl`, the backend automatically generates:
> - `videoUrl`: `https://stream.mux.com/{playbackId}.m3u8`
> - `streamUrl`: `https://stream.mux.com/{playbackId}.m3u8`
> - `thumbnailUrl`: `https://image.mux.com/{playbackId}/thumbnail.jpg`

---

## 6. How Mobile & Web Apps Consume Video

When fetching course modules via:
- `GET /api/courses/{id}`
- `GET /api/courses/{id}?stdId={studentId}`
- `GET /api/students/courses?email=...&loginId=...&deviceId=...`

The API returns normalized streaming objects:

```json
{
  "id": "module_xyz",
  "moduleTitle": "Day 01 - Code 1 to 5 Introduction",
  "isLocked": false,
  "playbackId": "abc123playbackId",
  "streamUrl": "https://stream.mux.com/abc123playbackId.m3u8",
  "hlsUrl": "https://stream.mux.com/abc123playbackId.m3u8",
  "videoUrl": "https://stream.mux.com/abc123playbackId.m3u8",
  "thumbnailUrl": "https://image.mux.com/abc123playbackId/thumbnail.jpg",
  "posterUrl": "https://image.mux.com/abc123playbackId/thumbnail.jpg",
  "streamType": "mux",
  "duration": "15 mins"
}
```

> 🔒 **Security Feature:** If the student is **not enrolled** and the module is locked (`isLocked: true`), `playbackId`, `streamUrl`, `hlsUrl`, and `videoUrl` are sanitized to `null` to prevent unauthorized streaming.

---

## 7. Client Player Integration Code Snippets

### A. Next.js / React (Using `MuxPlayer` or HLS.js)
```tsx
import MuxPlayer from "@/app/componets/MuxPlayer";

export default function LessonView({ module }) {
  return (
    <MuxPlayer
      playbackId={module.playbackId}
      streamUrl={module.streamUrl}
      poster={module.thumbnailUrl}
      title={module.moduleTitle}
      autoPlay={false}
    />
  );
}
```

### B. React Native / Expo (`expo-av`)
```tsx
import { Video, ResizeMode } from "expo-av";

<Video
  source={{ uri: module.streamUrl }} // Mux HLS .m3u8 stream
  useNativeControls
  resizeMode={ResizeMode.CONTAIN}
  posterSource={{ uri: module.thumbnailUrl }}
  style={{ width: "100%", height: 240 }}
/>;
```

### C. Flutter (`video_player`)
```dart
import 'package:video_player/video_player.dart';

VideoPlayerController _controller = VideoPlayerController.networkUrl(
  Uri.parse(module['streamUrl']), // Automatically handles HLS .m3u8
);
```

### D. Android Native (Kotlin + Google ExoPlayer)
```kotlin
val mediaItem = MediaItem.fromUri(module.streamUrl) // "https://stream.mux.com/<playbackId>.m3u8"
val player = ExoPlayer.Builder(context).build().apply {
    setMediaItem(mediaItem)
    prepare()
}
```

### E. iOS Native (Swift + AVPlayer)
```swift
import AVKit

guard let streamUrl = URL(string: module.streamUrl) else { return }
let player = AVPlayer(url: streamUrl)
let playerViewController = AVPlayerViewController()
playerViewController.player = player
```

---

## 8. Dynamic Image & Thumbnail Transformations
Mux provides dynamic thumbnail resizing without additional storage:

| Asset | Format | URL Format |
| :--- | :--- | :--- |
| **Default Poster** | JPEG | `https://image.mux.com/{playbackId}/thumbnail.jpg` |
| **Specific Second** | JPEG | `https://image.mux.com/{playbackId}/thumbnail.jpg?time=25` |
| **Custom Size** | JPEG | `https://image.mux.com/{playbackId}/thumbnail.jpg?width=640&height=360` |
| **Animated GIF** | GIF | `https://image.mux.com/{playbackId}/animated.gif?start=10&end=15&width=320` |

---

## 9. Backwards Compatibility
Any legacy modules uploaded prior to the Mux migration using Firebase Storage (`storage.googleapis.com/...mp4`) continue to function seamlessly:
- `lib/mux.ts` detects legacy URLs, assigns `streamType: "legacy"`, and passes the MP4 URL through to `videoUrl` and `streamUrl`.
- Admin users can use the Mux Video Picker to upgrade any existing module to a high-speed Mux HLS stream in one click.
