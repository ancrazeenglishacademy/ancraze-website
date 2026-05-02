# Video Upload to Firebase - Complete Flow ✅

## How It Works

### **Step 1: Upload Video to Firebase Storage** (`/api/upload-video`)
```
User selects video file
    ↓
Client sends to /api/upload-video (FormData)
    ↓
Backend receives FormData:
  - video file
  - courseId
    ↓
Backend uploads to Firebase Storage:
  - Path: modules/{courseId}/{timestamp}_{filename}
  - Makes file public
    ↓
Backend returns videoUrl
```

### **Step 2: Create Module with Video URL** (`/api/modules`)
```
Client sends to /api/modules (JSON)
{
  "courseId": "xyz123",
  "moduleTitle": "React Basics",
  "videoUrl": "https://storage.googleapis.com/...",
  "questions": [...]
}
    ↓
Backend creates module in Firestore:
  - Path: courses/{courseId}/modules/{moduleId}
  - Stores: title, videoUrl, questions, timestamps
    ↓
Module saved with video URL in database
```

## Database Structure

```
Firestore:
└── courses/
    └── {courseId}/
        └── modules/
            └── {moduleId}/
                ├── title: "React Basics"
                ├── videoUrl: "https://storage.googleapis.com/bucket/modules/..."
                ├── questions: [
                │   { question: "...", answer: "..." }
                │ ]
                ├── createdAt: timestamp
                └── updatedAt: timestamp

Firebase Storage:
└── modules/
    └── {courseId}/
        └── 1705XXXXX_video-name.mp4
```

## API Endpoints

### 1. **Upload Video** - `POST /api/upload-video`
**Request:**
```
POST /api/upload-video
Content-Type: multipart/form-data

Body:
- video: File
- courseId: string
```

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "videoUrl": "https://storage.googleapis.com/bucket/modules/..."
}
```

**Error Handling:**
- ❌ No video file → 400 error
- ❌ No courseId → 400 error
- ❌ Upload fails → 500 error with details

---

### 2. **Create Module** - `POST /api/modules`
**Request:**
```
POST /api/modules
Content-Type: application/json

Body:
{
  "courseId": "course123",
  "moduleTitle": "Module Name",
  "videoUrl": "https://...", // optional
  "questions": [
    { "question": "Q1?", "answer": "A1" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Module created successfully",
  "moduleId": "mod_xyz",
  "module": {
    "courseId": "course123",
    "title": "Module Name",
    "videoUrl": "https://...",
    "questions": [...],
    "createdAt": "2026-01-21T...",
    "updatedAt": "2026-01-21T..."
  }
}
```

**Error Handling:**
- ❌ Missing courseId or moduleTitle → 400 error
- ❌ Failed to save to Firestore → 500 error

---

## Client Flow

```typescript
// 1. User selects video and fills form
const videoFile = e.target.files[0];
const moduleTitle = "React Basics";
const questions = [...];

// 2. Upload video (if exists)
if (videoFile) {
  const uploadFormData = new FormData();
  uploadFormData.append('video', videoFile);
  uploadFormData.append('courseId', courseId);
  
  const videoRes = await fetch('/api/upload-video', {
    method: 'POST',
    body: uploadFormData,
  });
  
  const videoData = await videoRes.json();
  videoUrl = videoData.videoUrl; // Get URL from storage
}

// 3. Create module with video URL
const moduleRes = await fetch('/api/modules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseId,
    moduleTitle,
    videoUrl, // From previous step
    questions,
  }),
});

// 4. Module created and saved to Firestore with video URL
```

## Feature Summary

✅ Upload video to Firebase Storage
✅ Get public video URL from Storage
✅ Store video URL in Firestore database
✅ Associate video with module
✅ Video persists in database
✅ Video accessible via URL
✅ Video optional (can create modules without video)
✅ Works with any video format (mp4, webm, etc.)

## Testing Checklist

- [x] API endpoints created
- [x] Firebase Storage configured
- [x] Firestore database structure ready
- [x] Client-side code implemented
- [x] Error handling in place
- [x] Logging for debugging
- [x] Two-step process working
- [x] Video URL stored in database

## Files Involved

1. `/api/upload-video/route.ts` - Video upload endpoint
2. `/api/modules/route.ts` - Module creation with videoUrl
3. `/app/dashboard/course/[id]/page.tsx` - Client-side form handling

## Environment Variables Required

```
FIREBASE_PRIVATE_KEY
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```

✅ All set up and ready to use!
