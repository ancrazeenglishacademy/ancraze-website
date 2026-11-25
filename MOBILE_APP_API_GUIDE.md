# Ancraze Mobile App API Integration Guide (React Native / Expo)

> **Audience:** React Native / Expo Mobile App Developers (iOS & Android)  
> **Platform:** Ancraze Online Spoken English Academy Student App  
> **Backend Base URL:** `https://www.ancraze.com` (Production) / `http://localhost:3000` (Local Dev)  
> **Currency:** INR (`₹`)  
> **Last Updated:** November 2026

---

## Table of Contents

1. [What's New in This Version](#1-whats-new-in-this-version)
2. [Environment & Global Headers](#2-environment--global-headers)
3. [Authentication & Multi-Device Sessions](#3-authentication--multi-device-sessions)
4. [Courses, Progressive Locking & Day-Based Tasks](#4-courses-progressive-locking--day-based-tasks)
5. [Student Progress Tracking API](#5-student-progress-tracking-api)
6. [Mux Video Streaming & Task Image Rendering (Expo)](#6-mux-video-streaming--task-image-rendering-expo)
7. [Day Tasks History](#7-day-tasks-history)
8. [Push Notifications (Expo Push Token)](#8-push-notifications-expo-push-token)
9. [Announcements & Broadcasts](#9-announcements--broadcasts)
10. [Profile Updates & Support Requests](#10-profile-updates--support-requests)
11. [Complete Endpoint Reference Cheat Sheet](#11-complete-endpoint-reference-cheat-sheet)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What's New in This Version

1. **Multi-Device Login Enabled (No Single-Device 403 Lock)**:
   - Students can log in across multiple devices without encountering `403` device mismatch errors.
   - `deviceId` is optional and stored alongside `lastLoginAt` as non-blocking session metadata.
2. **Progressive Course Video Access & Locking (`accessControl`)**:
   - **Trainer-Guided Courses (`isTrainerGuided: true`)**: Start with Day 1 unlocked. Each time the assigned trainer marks a student's day task as completed in the Trainer Portal, the **next 3 days' videos** unlock automatically (`1 + completedTasksCount * 3`).
   - **Self-Paced / Non-Trainer-Guided Courses (`isTrainerGuided: false`)**: Automatically release **1 video per calendar day** (IST `UTC+5:30`) starting from the student's enrollment date.
   - **Trainer Preview Accounts (`isTrainerPreviewAccount: true`)**: Special student accounts that have **100% of days, videos, and task images unlocked immediately**.
3. **Day-Based Tasks with Firebase Storage Task Images**:
   - Tasks are attached at the **Day** level (`courses/{courseId}/days/{dayId}`) and automatically propagated to both `course.days[]` and `course.modules[]` with `taskTitle`, `taskDescription`, `taskType`, `taskImageUrl`, and `task` object so the app can display the day's task image right alongside the lesson video.
4. **Dedicated Student Progress API (`/api/students/progress`)**:
   - New `GET` and `POST` endpoints to read and atomically persist `watchedModuleIds` and `startedAt` per course.
5. **Course Refund Policy Field (`refundDays`)**:
   - Courses include `refundDays` (number of days eligible for refund; `0` = non-refundable) and `isTrainerGuided` (`boolean`).
6. **Mux Video HLS Streaming (`.m3u8`)**:
   - All unlocked modules return adaptive bitrate HLS streams (`streamUrl`, `hlsUrl`, `videoUrl`, `playbackId`) and auto-generated `thumbnailUrl` / `posterUrl`.

---

## 2. Environment & Global Headers

Configure your Expo environment variables in `.env` or `app.config.js`:

```env
EXPO_PUBLIC_API_BASE_URL=https://www.ancraze.com
EXPO_PUBLIC_INTERNAL_API_KEY=your_internal_api_key
```

### Standard Request Headers

```typescript
export const getHeaders = (extraHeaders: Record<string, string> = {}) => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.EXPO_PUBLIC_INTERNAL_API_KEY || '',
  ...extraHeaders,
});
```

### Optional Device Metadata Helper (Expo)

```typescript
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'android') {
    return Application.getAndroidId() || `android_${Date.now()}`;
  }
  if (Platform.OS === 'ios') {
    const id = await Application.getIosIdForVendorAsync();
    return id || `ios_${Date.now()}`;
  }
  return `device_${Date.now()}`;
}
```

---

## 3. Authentication & Multi-Device Sessions

### 3.1. Student Login
- **Method:** `POST`
- **Endpoint:** `/api/auth/student-login`
- **Request Body:**
  ```json
  {
    "email": "student@example.com",
    "loginId": "ANC-SKIXS3",
    "deviceId": "c83f98a21e4b9812"
  }
  ```
  > `deviceId` is **optional**. Sending it updates `deviceId` and `lastLoginAt` for admin activity monitoring, without blocking logins from other devices.

- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "idToken": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "uid": "user_uid_123",
      "email": "student@example.com",
      "fullName": "Rahul Sharma",
      "loginId": "ANC-SKIXS3",
      "role": "student",
      "isTrainerPreviewAccount": false,
      "isBlocked": false,
      "enrolledCourses": ["course_abc123", "course_xyz456"],
      "deviceId": "c83f98a21e4b9812",
      "createdAt": "2026-11-10T10:00:00.000Z",
      "createdByAdminName": "Admin",
      "photoURL": null
    }
  }
  ```

- **Error Responses:**
  - `400 Bad Request`: `{ "error": "Email and Login ID are required" }`
  - `401 Unauthorized`: `{ "error": "Invalid email or Login ID" }`
  - `403 Forbidden`: `{ "error": "Your account has been blocked. Please contact support." }`

> Store `user`, `idToken`, `email`, and `loginId` securely in `expo-secure-store` or `@react-native-async-storage/async-storage`.

---

### 3.2. Student Self-Registration
- **Method:** `POST`
- **Endpoint:** `/api/auth/student-register`
- **Request Body:**
  ```json
  {
    "email": "newstudent@example.com",
    "fullName": "Ananya Das"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "loginId": "X9K2LP",
    "student": {
      "email": "newstudent@example.com",
      "fullName": "Ananya Das",
      "loginId": "X9K2LP"
    }
  }
  ```

---

### 3.3. Google Sign-In
- **Method:** `POST`
- **Endpoint:** `/api/auth/google`
- **Request Body:**
  ```json
  {
    "idToken": "firebase_google_id_token"
  }
  ```
- **Success Response (`200 OK` for existing user / `201 Created` for new user):**
  ```json
  {
    "success": true,
    "message": "User already exists",
    "user": {
      "uid": "google_uid_123",
      "email": "user@gmail.com",
      "fullName": "Ananya Das",
      "photoURL": "https://lh3.googleusercontent.com/...",
      "role": "user",
      "isBlocked": false,
      "authProvider": "google"
    }
  }
  ```

---

## 4. Courses, Progressive Locking & Day-Based Tasks

### 4.1. List All Available Courses (Catalog)
- **Method:** `GET`
- **Endpoint:** `/api/courses`
- **Headers:** `x-api-key`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "total": 4,
    "courses": [
      {
        "id": "course_abc123",
        "title": "SELF FLUENT IN 30 DAYS",
        "description": "Structured 30-day spoken English programme taught in Bangla.",
        "teacherName": "Ancraze Master Faculty",
        "price": 2999,
        "coverImage": "https://storage.googleapis.com/...",
        "showOnHomePage": true,
        "isTrainerGuided": true,
        "refundDays": 7,
        "badge": "POPULAR FOUNDATION",
        "tagline": "Build Your Foundation. Start Speaking with Confidence.",
        "duration": "30 Days",
        "validity": "6 Months",
        "liveSessions": "5 Live Sessions",
        "features": ["24/7 App Access", "20 Codes Method"],
        "whoShouldJoin": "Learners looking for a structured 30-day foundation.",
        "moduleCount": 31,
        "studentCount": 42,
        "days": [
          {
            "id": "day_01_id",
            "title": "Day 1: Welcome to Ancraze",
            "order": 0,
            "taskTitle": "Introduce Yourself in English",
            "taskDescription": "Practice a 2-minute self-introduction using Code 1.",
            "taskType": "speaking_recording",
            "taskImageUrl": "https://storage.googleapis.com/...",
            "modules": []
          }
        ],
        "createdAt": "2026-11-01T08:00:00.000Z",
        "updatedAt": "2026-11-20T10:30:00.000Z"
      }
    ]
  }
  ```
  > Note: Optional marketing fields (`duration`, `validity`, `liveSessions`, `badge`, `tagline`, `whoShouldJoin`) may be empty strings `""` if left blank by admins. Always fall back gracefully in the UI.

---

### 4.2. Get Student's Purchased Courses (Flat List)
- **Method:** `GET`
- **Endpoint:** `/api/courses/purchased?userId={uid}` *(or `?email={email}`)*
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "total": 2,
    "courses": [
      {
        "id": "course_abc123",
        "title": "SELF FLUENT IN 30 DAYS",
        "description": "...",
        "price": 2999,
        "coverImage": "https://storage.googleapis.com/...",
        "isTrainerGuided": true,
        "refundDays": 7,
        "isPurchased": true,
        "createdAt": "2026-11-01T08:00:00.000Z",
        "updatedAt": "2026-11-20T10:30:00.000Z"
      }
    ]
  }
  ```

---

### 4.3. Get Student's Enrolled Courses with Full Curriculum & Lock States
- **Method:** `GET`
- **Endpoint:** `/api/students/courses?email={email}&loginId={loginId}` *(optional `&courseId={courseId}` for a single course)*
- **Response (`200 OK` — all enrolled courses):**
  ```json
  {
    "success": true,
    "courses": [
      {
        "id": "course_abc123",
        "title": "SELF FLUENT IN 30 DAYS",
        "isTrainerGuided": true,
        "refundDays": 7,
        "accessControl": {
          "mode": "trainer_guided",
          "isTrainerGuided": true,
          "isPurchased": true,
          "completedTasksCount": 2,
          "completedDayIds": ["day_01_id", "day_02_id"],
          "unlockedDaysCount": 7,
          "unlockedVideosCount": 7,
          "totalDaysCount": 30,
          "totalVideosCount": 30
        },
        "days": [],
        "modules": []
      }
    ]
  }
  ```
  > If `courseId` is passed, returns `{ "success": true, "course": { ... } }`.

---

### 4.4. Get Single Course Detail with Days, Modules, Locking & Day Task Images
- **Method:** `GET`
- **Endpoint:** `/api/courses/{courseId}?stdId={uid}`  
  *(Also supports `?userId={uid}` or `?email={email}&loginId={loginId}`)*

- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "user": {
      "fullName": "Rahul Sharma",
      "email": "student@example.com",
      "role": "student",
      "isEnrolled": true
    },
    "accessControl": {
      "mode": "trainer_guided",
      "isTrainerGuided": true,
      "isPurchased": true,
      "completedTasksCount": 1,
      "completedDayIds": ["day_01_id"],
      "unlockedDaysCount": 4,
      "unlockedVideosCount": 4,
      "totalDaysCount": 30,
      "totalVideosCount": 30
    },
    "course": {
      "id": "course_abc123",
      "title": "SELF FLUENT IN 30 DAYS",
      "description": "...",
      "teacherName": "Ancraze Master Faculty",
      "price": 2999,
      "coverImage": "https://storage.googleapis.com/...",
      "isTrainerGuided": true,
      "refundDays": 7,
      "isPurchased": true,
      "accessControl": {
        "mode": "trainer_guided",
        "isTrainerGuided": true,
        "isPurchased": true,
        "completedTasksCount": 1,
        "completedDayIds": ["day_01_id"],
        "unlockedDaysCount": 4,
        "unlockedVideosCount": 4,
        "totalDaysCount": 30,
        "totalVideosCount": 30
      },
      "days": [
        {
          "id": "day_01_id",
          "title": "WELCOME TO ANCRAZE",
          "order": 0,
          "dayNumber": 1,
          "isLocked": false,
          "isTaskCompleted": true,
          "taskTitle": "Day 1 Speaking Practice",
          "taskDescription": "Read the practice sheet aloud and prepare for your trainer session.",
          "taskType": "speaking_recording",
          "taskImageUrl": "https://storage.googleapis.com/your-bucket/courses/course_abc123/days/tasks/1732512000_day_task.jpg",
          "taskImage": "https://storage.googleapis.com/your-bucket/courses/course_abc123/days/tasks/1732512000_day_task.jpg",
          "hasTask": true,
          "task": {
            "title": "Day 1 Speaking Practice",
            "description": "Read the practice sheet aloud and prepare for your trainer session.",
            "type": "speaking_recording",
            "imageUrl": "https://storage.googleapis.com/your-bucket/courses/course_abc123/days/tasks/1732512000_day_task.jpg"
          },
          "modules": [
            {
              "id": "mod_01",
              "title": "Lesson 01 — Introduction to 20 Codes",
              "day": "day_01_id",
              "duration": "14 mins",
              "isLocked": false,
              "isTaskCompleted": true,
              "unlockDayNumber": 1,
              "lockReason": null,
              "streamType": "mux",
              "playbackId": "mUxPlAyBaCkId123",
              "streamUrl": "https://stream.mux.com/mUxPlAyBaCkId123.m3u8",
              "hlsUrl": "https://stream.mux.com/mUxPlAyBaCkId123.m3u8",
              "videoUrl": "https://stream.mux.com/mUxPlAyBaCkId123.m3u8",
              "thumbnailUrl": "https://image.mux.com/mUxPlAyBaCkId123/thumbnail.jpg",
              "posterUrl": "https://image.mux.com/mUxPlAyBaCkId123/thumbnail.jpg",
              "taskTitle": "Day 1 Speaking Practice",
              "taskDescription": "Read the practice sheet aloud and prepare for your trainer session.",
              "taskType": "speaking_recording",
              "taskImageUrl": "https://storage.googleapis.com/your-bucket/courses/course_abc123/days/tasks/1732512000_day_task.jpg",
              "taskImage": "https://storage.googleapis.com/your-bucket/courses/course_abc123/days/tasks/1732512000_day_task.jpg",
              "hasTask": true,
              "task": {
                "title": "Day 1 Speaking Practice",
                "description": "Read the practice sheet aloud and prepare for your trainer session.",
                "type": "speaking_recording",
                "imageUrl": "https://storage.googleapis.com/your-bucket/courses/course_abc123/days/tasks/1732512000_day_task.jpg"
              },
              "questions": [
                {
                  "question": "Construct a sentence using Code 1.",
                  "answer": "I am working on my project."
                }
              ]
            }
          ]
        },
        {
          "id": "day_05_id",
          "title": "ADALAT CODE",
          "order": 4,
          "dayNumber": 5,
          "isLocked": true,
          "isTaskCompleted": false,
          "taskTitle": "Day 5 Practice Task",
          "taskDescription": "...",
          "taskType": "speaking_recording",
          "taskImageUrl": null,
          "taskImage": null,
          "hasTask": true,
          "task": {
            "title": "Day 5 Practice Task",
            "description": "...",
            "type": "speaking_recording",
            "imageUrl": null
          },
          "modules": [
            {
              "id": "mod_05",
              "title": "Lesson 05 — Adalat Code",
              "day": "day_05_id",
              "isLocked": true,
              "unlockDayNumber": 5,
              "lockReason": "Complete your current day's task and get trainer approval to unlock the next 3 days' videos.",
              "playbackId": null,
              "streamUrl": null,
              "hlsUrl": null,
              "videoUrl": null,
              "thumbnailUrl": "https://image.mux.com/mUxPlAyBaCkId555/thumbnail.jpg",
              "taskImageUrl": null
            }
          ]
        }
      ],
      "modules": []
    }
  }
  ```

#### `accessControl.mode` Values Reference

| `accessControl.mode` | When It Applies | Mobile UI Behavior |
| :--- | :--- | :--- |
| `"trainer_guided"` | Enrolled student in a trainer-guided course | Day 1 starts unlocked; each trainer-approved day task unlocks +3 days. Show `module.lockReason` on locked days/videos. |
| `"daily_drip"` | Enrolled student in a non-trainer-guided course | Releases 1 video per day since `accessControl.enrolledAt` (`currentCourseDay`, `unlockedVideosCount`). Show `module.lockReason` (`"This video unlocks on Day X"`). |
| `"trainer_preview"` | Student has `isTrainerPreviewAccount: true` | All days, videos, and task images are unlocked (`isLocked: false`). |
| Unenrolled (`isPurchased: false`) | User not enrolled in course | First 3 preview videos unlocked; remaining modules are locked (`lockReason: "Enroll in this course to unlock full video access."`). |

---

### 4.5. Enroll Student in a Course
- **Method:** `POST`
- **Endpoint:** `/api/enroll`
- **Headers:** `x-api-key`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "userId": "user_uid_123",
    "courseId": "course_abc123"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Successfully enrolled"
  }
  ```
  > Automatically records `courseEnrollments.{courseId}.enrolledAt` so daily drip courses start counting from Day 1.

---

### 4.6. Get Days for a Course (Lightweight)
- **Method:** `GET`
- **Endpoint:** `/api/days?courseId={courseId}`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "total": 30,
    "days": [
      {
        "id": "day_01_id",
        "courseId": "course_abc123",
        "title": "WELCOME TO ANCRAZE",
        "order": 0,
        "taskTitle": "Day 1 Speaking Practice",
        "taskDescription": "Practice Code 1 sentences.",
        "taskType": "speaking_recording",
        "taskImageUrl": "https://storage.googleapis.com/...",
        "task": {
          "title": "Day 1 Speaking Practice",
          "description": "Practice Code 1 sentences.",
          "type": "speaking_recording",
          "imageUrl": "https://storage.googleapis.com/..."
        },
        "createdAt": "2026-11-01T08:00:00.000Z",
        "updatedAt": "2026-11-20T10:30:00.000Z"
      }
    ]
  }
  ```

---

## 5. Student Progress Tracking API

Use `/api/students/progress` to sync watched video modules and course start dates between the mobile app and Firestore (`users/{studentId}/courseProgress/{courseId}`).

### 5.1. Get Student Progress (Single Course)
- **Method:** `GET`
- **Endpoint:** `/api/students/progress?studentId={uid}&courseId={courseId}`
- **Headers:** `x-api-key`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "studentId": "user_uid_123",
    "courseId": "course_abc123",
    "startedAt": "2026-11-10T10:00:00.000Z",
    "watchedModuleIds": ["mod_01", "mod_02", "mod_03"],
    "updatedAt": "2026-11-25T09:15:00.000Z",
    "progress": {
      "courseId": "course_abc123",
      "startedAt": "2026-11-10T10:00:00.000Z",
      "watchedModuleIds": ["mod_01", "mod_02", "mod_03"],
      "updatedAt": "2026-11-25T09:15:00.000Z"
    }
  }
  ```

### 5.2. Get Student Progress (All Enrolled Courses)
- **Method:** `GET`
- **Endpoint:** `/api/students/progress?studentId={uid}` *(omit `courseId`)*
- **Headers:** `x-api-key`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "studentId": "user_uid_123",
    "progress": {
      "course_abc123": {
        "courseId": "course_abc123",
        "startedAt": "2026-11-10T10:00:00.000Z",
        "watchedModuleIds": ["mod_01", "mod_02"],
        "updatedAt": "2026-11-25T09:15:00.000Z"
      },
      "course_xyz456": {
        "courseId": "course_xyz456",
        "startedAt": "2026-11-18T14:00:00.000Z",
        "watchedModuleIds": ["mod_10"],
        "updatedAt": "2026-11-24T18:20:00.000Z"
      }
    }
  }
  ```

### 5.3. Save / Update Watched Module Progress
- **Method:** `POST`
- **Endpoint:** `/api/students/progress`
- **Headers:** `x-api-key`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "studentId": "user_uid_123",
    "courseId": "course_abc123",
    "moduleId": "mod_04",
    "watched": true,
    "initializeStartDate": true
  }
  ```
  > You can pass either a single `"moduleId": "mod_04"` or an array `"moduleIds": ["mod_04", "mod_05"]`. Set `"watched": false` to unmark a module.

- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "studentId": "user_uid_123",
    "courseId": "course_abc123",
    "startedAt": "2026-11-10T10:00:00.000Z",
    "watchedModuleIds": ["mod_01", "mod_02", "mod_03", "mod_04"]
  }
  ```

---

## 6. Mux Video Streaming & Task Image Rendering (Expo)

Install `expo-av`:
```bash
npx expo install expo-av
```

### Complete Lesson Screen Example (Video + Day Task Image + Auto Progress Sync)

```tsx
import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { getHeaders } from './apiConfig';

interface ModuleProps {
  studentId: string;
  courseId: string;
  module: {
    id: string;
    title: string;
    isLocked: boolean;
    lockReason?: string | null;
    streamUrl: string | null;
    thumbnailUrl?: string | null;
    hasTask?: boolean;
    taskTitle?: string | null;
    taskDescription?: string | null;
    taskImageUrl?: string | null;
  };
}

export default function LessonPlayer({ studentId, courseId, module }: ModuleProps) {
  const videoRef = useRef<Video>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [markedWatched, setMarkedWatched] = useState(false);

  const markModuleWatched = async () => {
    if (markedWatched) return;
    setMarkedWatched(true);
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/students/progress`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          studentId,
          courseId,
          moduleId: module.id,
          watched: true,
          initializeStartDate: true,
        }),
      });
    } catch (err) {
      console.warn('Failed to sync watched progress:', err);
    }
  };

  if (module.isLocked || !module.streamUrl) {
    return (
      <View style={styles.lockedBox}>
        <Text style={styles.lockedTitle}>Lesson Locked</Text>
        <Text style={styles.lockedText}>
          {module.lockReason || 'Complete previous milestones to unlock this video.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{
            uri: module.streamUrl,
            overrideFileExtensionAndroid: 'm3u8', // Required for HLS on Android
          }}
          posterSource={module.thumbnailUrl ? { uri: module.thumbnailUrl } : undefined}
          usePoster={!!module.thumbnailUrl}
          posterStyle={{ resizeMode: 'cover' }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsBuffering(status.isBuffering);
              if (status.didJustFinish) {
                markModuleWatched();
              }
            }
          }}
        />
        {isBuffering && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2A0066" />
          </View>
        )}
      </View>

      {/* Day-Based Task Card & Firebase Storage Task Image */}
      {module.hasTask && (
        <View style={styles.taskCard}>
          <Text style={styles.taskBadge}>TODAY&apos;S PRACTICE TASK</Text>
          {!!module.taskTitle && <Text style={styles.taskTitle}>{module.taskTitle}</Text>}
          {!!module.taskDescription && (
            <Text style={styles.taskDesc}>{module.taskDescription}</Text>
          )}
          {!!module.taskImageUrl && (
            <Image
              source={{ uri: module.taskImageUrl }}
              style={styles.taskImage}
              resizeMode="contain"
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16 },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBox: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  lockedTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  lockedText: { fontSize: 13, color: '#475569', textAlign: 'center' },
  taskCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 8,
  },
  taskBadge: { fontSize: 10, fontWeight: '800', color: '#2A0066', letterSpacing: 1 },
  taskTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  taskDesc: { fontSize: 13, color: '#475569', lineHeight: 19 },
  taskImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 6,
  },
});
```

---

## 7. Day Tasks History

In the trainer-guided workflow, trainers mark a student's day task as completed directly from the Trainer Portal (no file upload is required from the student). The mobile app can fetch the student's completed/assigned task history via:

### 7.1. Get Tasks for a Student
- **Method:** `GET`
- **Endpoint:** `/api/tasks?studentId={uid}`
- **Headers:** `x-api-key`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "tasks": [
      {
        "id": "task_101",
        "title": "SELF FLUENT IN 30 DAYS — WELCOME TO ANCRAZE: Day 1 Speaking Practice",
        "description": "Trainer marked WELCOME TO ANCRAZE task as completed.",
        "taskType": "speaking_recording",
        "studentId": "user_uid_123",
        "trainerId": "trainer_uid_456",
        "courseId": "course_abc123",
        "dayId": "day_01_id",
        "dayNumber": 1,
        "taskImageUrl": "https://storage.googleapis.com/...",
        "status": "completed",
        "createdAt": "2026-11-25T08:00:00.000Z",
        "evaluatedAt": "2026-11-25T08:00:00.000Z",
        "trainer": {
          "id": "trainer_uid_456",
          "fullName": "Ayesha Rahman",
          "email": "trainer@ancraze.com",
          "photoURL": null
        }
      }
    ]
  }
  ```

---

## 8. Push Notifications (Expo Push Token)

Register or refresh the student's Expo push token after login:

- **Method:** `POST`
- **Endpoint:** `/api/users/push-token`
- **Request Body:**
  ```json
  {
    "userId": "user_uid_123",
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

## 9. Announcements & Broadcasts

Fetch active announcements targeted at students (returns both `"all"` and `"students"` notices):

- **Method:** `GET`
- **Endpoint:** `/api/announcements?targetRole=students`
- **Headers:** `x-api-key`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "announcements": [
      {
        "id": "ann_01",
        "title": "Upcoming Live Practice Session",
        "content": "Join our live speaking revision session this Sunday at 7 PM IST.",
        "targetRole": "students",
        "priority": "urgent",
        "authorName": "Academy Administration",
        "authorRole": "admin",
        "createdAt": "2026-11-25T09:00:00.000Z"
      }
    ]
  }
  ```
  > `priority` is either `"normal"` or `"urgent"`.

---

## 10. Profile Updates & Support Requests

### 10.1. Update Student Profile
- **Method:** `POST`
- **Endpoint:** `/api/users/update-profile`
- **Headers:** `x-api-key`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "userId": "user_uid_123",
    "fullName": "Rahul Sharma",
    "photoURL": "https://storage.googleapis.com/..."
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "updatedFields": ["fullName", "photoURL"]
  }
  ```

### 10.2. Submit a Support / Refund Request
- **Method:** `POST`
- **Endpoint:** `/api/requests`
- **Headers:** `x-api-key`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "studentId": "user_uid_123",
    "studentName": "Rahul Sharma",
    "studentLoginId": "ANC-SKIXS3",
    "type": "exception",
    "reason": "Need help rescheduling my trainer speaking slot."
  }
  ```
  > `type` accepts `"refund"`, `"account_closure"`, or `"exception"`. For `"refund"`, you may also pass `"amount": 2999`.

- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Request submitted to Super Admin"
  }
  ```

---

## 11. Complete Endpoint Reference Cheat Sheet

| Endpoint | Method | Purpose | Key Query / Body Params |
| :--- | :---: | :--- | :--- |
| `/api/auth/student-login` | `POST` | Student login (multi-device supported) | `email`, `loginId`, `deviceId?` |
| `/api/auth/student-register` | `POST` | Self-register a new student account | `email`, `fullName` |
| `/api/auth/google` | `POST` | Authenticate via Google Firebase ID token | `idToken` |
| `/api/courses` | `GET` | List all published courses for catalog | *(header `x-api-key`)* |
| `/api/courses/purchased` | `GET` | Flat list of student's enrolled courses | `userId` or `email` |
| `/api/students/courses` | `GET` | Enrolled courses with full days, modules & lock states | `email`, `loginId`, `courseId?` |
| `/api/courses/{id}` | `GET` | Single course with days, modules, Mux HLS & day tasks | `stdId` (or `email` + `loginId`) |
| `/api/days` | `GET` | Ordered days & day-based tasks for a course | `courseId` |
| `/api/enroll` | `POST` | Enroll student in a course & record start timestamp | `userId`, `courseId` |
| `/api/students/progress` | `GET` | Read `watchedModuleIds` & `startedAt` | `studentId`, `courseId?` |
| `/api/students/progress` | `POST` | Atomically mark/unmark watched modules | `studentId`, `courseId`, `moduleId` / `moduleIds[]`, `watched` |
| `/api/tasks` | `GET` | Fetch student's completed & assigned day tasks | `studentId` |
| `/api/users/push-token` | `POST` | Save Expo push notification token | `userId`, `token` |
| `/api/announcements` | `GET` | Fetch academy & trainer announcements | `targetRole=students` |
| `/api/users/update-profile` | `POST` | Update display name and/or avatar URL | `userId`, `fullName?`, `photoURL?` |
| `/api/requests` | `POST` | Submit refund or support request | `studentId`, `studentName`, `studentLoginId`, `type`, `reason` |

---

## 12. Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| Video URL / `taskImageUrl` is `null` | Module or day is locked (`isLocked: true`) | Check `module.isLocked` before rendering the player and display `module.lockReason` to the student. |
| Black screen on Android HLS playback | Android ExoPlayer needs explicit `.m3u8` hint | Pass `overrideFileExtensionAndroid: 'm3u8'` inside `<Video source={{ uri: module.streamUrl, overrideFileExtensionAndroid: 'm3u8' }} />`. |
| `401 Invalid API Key` | Missing or mismatched `x-api-key` header | Ensure `EXPO_PUBLIC_INTERNAL_API_KEY` matches the backend's `INTERNAL_API_KEY`. |
| Trainer-guided videos still locked after practice | Trainer hasn't marked the day's task completed yet | Once the trainer marks the day completed in the Trainer Portal, re-fetch `GET /api/courses/{id}?stdId={uid}` to get the newly unlocked 3 days. |
| `Network request failed` on Android Emulator | `localhost` points to emulator loopback | Use `http://10.0.2.2:3000` for local testing on Android Emulator, or point to the production URL. |
