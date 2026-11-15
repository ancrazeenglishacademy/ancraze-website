# Ancraze Mobile App API Integration Guide (React Native / Expo) 📱

> **Audience:** React Native / Expo Mobile App Developers  
> **Platform:** iOS & Android (Ancraze English Academy Student App)  
> **Backend Base URL:** `https://ancraze-website.vercel.app` (Production) / `http://localhost:3000` (Local Dev)  
> **Last Updated:** November 2026

---

## 1. Quick Summary of What's New

1. **Mux Video Streaming (Adaptive HLS `.m3u8`)**:
   - Replaced raw Firebase Storage MP4 downloads with **Mux Video HLS streaming**.
   - Modules now return `streamUrl`, `hlsUrl`, `playbackId`, and auto-generated `thumbnailUrl`.
   - `videoUrl` is backwards-compatible and points directly to the `.m3u8` stream.
2. **Device Locking & Single Device Enforcement**:
   - Students are bound to a single device via `deviceId`. Subsequent logins from a different device return `403 Forbidden`.
3. **Expo Push Notifications**:
   - Dedicated endpoint `POST /api/users/push-token` to register `expoPushToken`.
4. **Speaking Practice & Task Submissions**:
   - Tasks support audio recordings (`audioRecordingUrl`) and text submissions via `PATCH /api/tasks`.
5. **Day-wise & Module-wise Course Structure**:
   - Full hierarchy with lock enforcement (`isLocked: true/false`).

---

## 2. Global Headers & Environment

Store your configuration in `.env` or `app.config.js`:

```env
EXPO_PUBLIC_API_BASE_URL=https://ancraze-website.vercel.app
EXPO_PUBLIC_INTERNAL_API_KEY=your_internal_api_key_if_set
```

### Standard Request Headers
```typescript
const getHeaders = (extraHeaders = {}) => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.EXPO_PUBLIC_INTERNAL_API_KEY || '',
  ...extraHeaders,
});
```

---

## 3. Unique Device ID Setup (Expo)

To support the single-device security policy, generate or retrieve a persistent Device ID on app launch using `expo-application`:

```bash
npx expo install expo-application
```

```typescript
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'android') {
    return Application.getAndroidId() || 'android_device_' + Date.now();
  } else if (Platform.OS === 'ios') {
    const id = await Application.getIosIdForVendorAsync();
    return id || 'ios_device_' + Date.now();
  }
  return 'generic_device_' + Date.now();
}
```

---

## 4. Student Authentication & Session

### 4.1. Student Login (Single Device Bound)
- **Method:** `POST`
- **Endpoint:** `/api/auth/student-login`
- **Request Body:**
  ```json
  {
    "email": "student@example.com",
    "loginId": "STD-2026-9874",
    "deviceId": "c83f98a21e4b9812"
  }
  ```

- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "idToken": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "uid": "user_doc_id_123",
      "email": "student@example.com",
      "fullName": "Rahul Sharma",
      "loginId": "STD-2026-9874",
      "role": "student",
      "isBlocked": false,
      "enrolledCourses": ["course_abc123", "course_xyz456"],
      "deviceId": "c83f98a21e4b9812",
      "photoURL": null,
      "createdAt": "2026-11-10T10:00:00.000Z"
    }
  }
  ```

- **Error Responses:**
  - `401 Unauthorized`: `"Invalid email or Login ID"`
  - `403 Forbidden`: `"Your already login in another device"` *(Device mismatch)*
  - `403 Forbidden`: `"Your account has been blocked. Please contact support."`
  - `400 Bad Request`: `"Email, Login ID, and Device ID are required"`

> 💡 **Action for App Developer:** Store `user`, `idToken`, and `deviceId` in `expo-secure-store` or `@react-native-async-storage/async-storage`.

---

## 5. Push Notifications (Expo Push Token)

Register the student's Expo push token immediately upon login:

- **Method:** `POST`
- **Endpoint:** `/api/users/push-token`
- **Request Body:**
  ```json
  {
    "userId": "user_doc_id_123",
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Push token saved successfully"
  }
  ```

---

## 6. Courses & Curriculum

### 6.1. Get Student's Enrolled Courses
- **Method:** `GET`
- **Endpoint:** `/api/courses/purchased?userId={userId}`
  *(Alternative: `/api/students/courses?email={email}&loginId={loginId}&deviceId={deviceId}`)*

- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "courses": [
      {
        "id": "course_abc123",
        "title": "30-Day Foundational Spoken English Course",
        "description": "Master 20 sentence formation codes...",
        "price": 2999,
        "teacherName": "Mohammad Irfan",
        "coverImageUrl": "https://storage.googleapis.com/...",
        "duration": "30 Days",
        "validity": "6 Months",
        "liveSessions": "5 Live Sessions",
        "createdAt": "2026-11-01T08:00:00.000Z"
      }
    ]
  }
  ```

---

### 6.2. Get Course Detail with Days & Modules (Mux Video Ready)
- **Method:** `GET`
- **Endpoint:** `/api/courses/{courseId}?stdId={userId}`

- **Response Structure:**
  ```json
  {
    "success": true,
    "course": {
      "id": "course_abc123",
      "title": "30-Day Foundational Spoken English Course",
      "isPurchased": true,
      "modules": [
        {
          "id": "mod_01",
          "moduleTitle": "Lesson 01 - Code 1 to Code 5",
          "description": "Essential sentence structures for daily conversation.",
          "duration": "14 mins",
          "day": "day_01_id",
          "isLocked": false,
          "streamType": "mux",
          "playbackId": "mUxPlAyBaCkId123",
          "streamUrl": "https://stream.mux.com/mUxPlAyBaCkId123.m3u8",
          "hlsUrl": "https://stream.mux.com/mUxPlAyBaCkId123.m3u8",
          "videoUrl": "https://stream.mux.com/mUxPlAyBaCkId123.m3u8",
          "thumbnailUrl": "https://image.mux.com/mUxPlAyBaCkId123/thumbnail.jpg",
          "posterUrl": "https://image.mux.com/mUxPlAyBaCkId123/thumbnail.jpg",
          "questions": [
            {
              "question": "Construct a sentence using Code 1.",
              "answer": "I am working on my project."
            }
          ]
        }
      ]
    }
  }
  ```

> 🔒 **Security / Locking:**
> If `isPurchased === false`, modules past the preview threshold return `isLocked: true`, and `playbackId`, `streamUrl`, and `videoUrl` are sanitized to `null`. Always check `module.isLocked` before rendering the player.

---

### 6.3. Get Days for a Course
- **Method:** `GET`
- **Endpoint:** `/api/days?courseId={courseId}`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "days": [
      {
        "id": "day_01_id",
        "title": "Day 01: Core Sentence Foundation",
        "order": 1
      },
      {
        "id": "day_02_id",
        "title": "Day 02: Daily Habit Verbs",
        "order": 2
      }
    ]
  }
  ```

---

## 7. Mux Video Streaming in React Native Expo

Install `expo-av`:
```bash
npx expo install expo-av
```

### Complete Video Player Component (`MuxVideoPlayer.tsx`)
```tsx
import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface Props {
  streamUrl: string;       // e.g. "https://stream.mux.com/{playbackId}.m3u8"
  thumbnailUrl?: string;   // e.g. "https://image.mux.com/{playbackId}/thumbnail.jpg"
  onPlaybackFinished?: () => void;
}

export default function MuxVideoPlayer({ streamUrl, thumbnailUrl, onPlaybackFinished }: Props) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{
          uri: streamUrl,
          overrideFileExtensionAndroid: 'm3u8', // Required for HLS on older Android devices
        }}
        posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
        usePoster={!!thumbnailUrl}
        posterStyle={{ resizeMode: 'cover' }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={(newStatus) => {
          setStatus(newStatus);
          if (newStatus.isLoaded) {
            setIsBuffering(newStatus.isBuffering);
            if (newStatus.didJustFinish) {
              onPlaybackFinished?.();
            }
          }
        }}
      />
      {isBuffering && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2A0066" />
          <Text style={styles.loadingText}>Loading Stream...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
  },
});
```

> **Why this works seamlessly:**
> Mux streams via `.m3u8` Adaptive Bitrate. ExoPlayer on Android and AVPlayer on iOS natively scale quality between 360p, 720p, and 1080p based on the student's mobile signal, preventing buffering.

---

## 8. Student Tasks & Speaking Recordings

### 8.1. Get Assigned Tasks for Student
- **Method:** `GET`
- **Endpoint:** `/api/tasks?studentId={userId}`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "tasks": [
      {
        "id": "task_101",
        "title": "Speaking Exercise - 20 Codes Audio",
        "description": "Record a 60-second audio answering 3 situational questions.",
        "taskType": "speaking_recording",
        "status": "pending",
        "dueDate": "2026-11-20T18:30:00.000Z",
        "submission": "",
        "audioRecordingUrl": null,
        "trainerFeedback": null,
        "score": null,
        "trainer": {
          "fullName": "Ayesha Rahman",
          "email": "trainer@ancraze.com"
        }
      }
    ]
  }
  ```

---

### 8.2. Submit a Task (Text or Audio Recording)
- **Method:** `PATCH`
- **Endpoint:** `/api/tasks`
- **Request Body:**
  ```json
  {
    "taskId": "task_101",
    "status": "submitted",
    "submission": "Here is my completed answer text...",
    "audioRecordingUrl": "https://storage.googleapis.com/.../student_voice.m4a"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Task updated successfully",
    "task": {
      "id": "task_101",
      "status": "submitted"
    }
  }
  ```

---

## 9. Announcements & Broadcasts

Display announcements from the academy or trainers:

- **Method:** `GET`
- **Endpoint:** `/api/announcements?targetRole=student`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "announcements": [
      {
        "id": "ann_01",
        "title": "Upcoming Live Practice Session",
        "content": "Join trainer Mohammad Irfan this Sunday at 7 PM for live speaking corrections.",
        "priority": "high",
        "createdAt": "2026-11-14T09:00:00.000Z"
      }
    ]
  }
  ```

---

## 10. Support Requests & Device Reset Inquiries

If a student switches phones or requires help with billing/account:

- **Method:** `POST`
- **Endpoint:** `/api/requests`
- **Request Body:**
  ```json
  {
    "studentId": "user_doc_id_123",
    "studentName": "Rahul Sharma",
    "studentLoginId": "STD-2026-9874",
    "type": "exception",
    "reason": "I changed my phone and need to reset my registered device."
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Request submitted to Super Admin"
  }
  ```

---

## 11. Profile Update

- **Method:** `POST`
- **Endpoint:** `/api/users/update-profile`
- **Request Body:**
  ```json
  {
    "userId": "user_doc_id_123",
    "fullName": "Rahul Sharma",
    "photoURL": "https://..."
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully"
  }
  ```

---

## 12. Complete Mobile API Endpoint Summary Cheat Sheet

| Endpoint | Method | Purpose | Key Parameters |
| :--- | :---: | :--- | :--- |
| `/api/auth/student-login` | `POST` | Authenticate student & bind device | `email`, `loginId`, `deviceId` |
| `/api/users/push-token` | `POST` | Register Expo Push Notification Token | `userId`, `token` |
| `/api/courses/purchased` | `GET` | Get courses enrolled by student | `userId` |
| `/api/courses/{id}` | `GET` | Get course curriculum, days, Mux HLS videos | `stdId` (Student UID) |
| `/api/days` | `GET` | Get structured days for a course | `courseId` |
| `/api/tasks` | `GET` | Fetch assigned tasks & feedback | `studentId` |
| `/api/tasks` | `PATCH` | Submit assignment / speaking audio | `taskId`, `status`, `submission`, `audioRecordingUrl` |
| `/api/announcements` | `GET` | View academy & trainer notices | `targetRole=student` |
| `/api/requests` | `POST` | Submit support / device change request | `studentId`, `type`, `reason` |
| `/api/users/update-profile`| `POST` | Update avatar & name | `userId`, `fullName`, `photoURL` |

---

## 13. Common Troubleshooting for React Native Developers

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `Your already login in another device` | Device ID does not match the bound device in Firestore | Student must submit a request via `/api/requests` or ask Admin to reset their `deviceId`. |
| Black screen on video playback | Missing `.m3u8` HLS header config on Android | Add `overrideFileExtensionAndroid: 'm3u8'` to `<Video source={{ ... }} />`. |
| Video URL returns `null` | Student has not purchased course or module is locked | Check `module.isLocked === false` before opening the video screen. |
| `Network request failed` | Incorrect base URL on Android Emulator | Android emulator requires `http://10.0.2.2:3000` for localhost, or use the live Vercel URL. |
