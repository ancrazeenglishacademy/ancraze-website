# Ancraze Course & Video Access Guide
**How Course Unlocking Works & How the Mobile App Connects to It**

---

## 📌 Quick Summary (In Plain English)

When a student opens a course in the **Ancraze Mobile App**, our backend automatically decides **which videos and daily tasks are unlocked** and **which ones are locked**.

Even if someone tries to inspect the network traffic, **locked videos cannot be played** because the server completely hides the video stream links (`videoUrl`, `playbackId`, and `taskImageUrl` are sent as `null`) until the student unlocks them. Only the video title, thumbnail image, and the reason it is locked are shown.

There are **4 ways** a user sees a course in the app:

| User Type | What They Can Watch | How Next Videos Unlock |
| :--- | :--- | :--- |
| **1. Free / Not Enrolled Visitor** | **First 3 videos only** (Free Trial Preview) | Must purchase / enroll in the course to unlock the rest. |
| **2. Enrolled in a Self-Study Course** (`isTrainerGuided: false`) | **1 new video per day** (Daily Drip) | Unlocks automatically every new calendar day (IST) after enrollment. |
| **3. Enrolled in a Trainer-Guided Course** (`isTrainerGuided: true`) | **Day 1 initially**, then **3 days at a time** | Whenever their trainer marks a day's task as **Approved / Completed**, the next **3 days** of videos unlock immediately. |
| **4. Admin, Trainer, or Preview Account** | **All videos & tasks unlocked** | Full access right away—no waiting for days or tasks. |

---

## 📚 Current Courses Configured in Your Database

Here are the **4 courses** currently live in your Firestore database:

### 1. SELF FLUENT IN 30 DAYS
- **Course ID:** `EB9q2FJk5RIWEEhcDzyu`
- **Badge:** `SELF STUDY COURSE`
- **Price:** ₹899
- **Duration & Validity:** 30 Days • 6 Months App Validity • 0 Live Sessions
- **Content Size:** 31 Days • 31 Video Modules
- **Shown on Website (`/courses` & Home Page):** ✅ Yes (`showOnHomePage: true`)
- **Current Unlocking Mode:** **Daily Drip** (`isTrainerGuided: false` — releases 1 video per day)

### 2. Speak English in 30 Days
- **Course ID:** `91HRz5JsQzCzE462Wsz4`
- **Badge:** `most popular`
- **Price:** ₹2,499
- **Duration & Validity:** 30 Days • 6 Months App Validity • 30 Live Sessions
- **Content Size:** 37 Days • 40 Video Modules
- **Shown on Website (`/courses` & Home Page):** ✅ Yes (`showOnHomePage: true`)
- **Current Unlocking Mode:** **Daily Drip** (`isTrainerGuided: false` — *Tip: You can switch this to Trainer-Guided in Super Admin → Edit Course*)

### 3. Mr. Fluent in 60 Days
- **Course ID:** `UieECWDa8gizzJQpvZyN`
- **Badge:** `For mastering Fluency`
- **Price:** ₹3,499
- **Duration & Validity:** 60 Days • 6 Months App Validity • 50 Live Sessions
- **Content Size:** 60 Days • 34 Video Modules
- **Shown on Website (`/courses` & Home Page):** ✅ Yes (`showOnHomePage: true`)
- **Current Unlocking Mode:** **Daily Drip** (`isTrainerGuided: false` — *Tip: You can switch this to Trainer-Guided in Super Admin → Edit Course*)

### 4. SELF FLUENT IN 60 DAYS
- **Course ID:** `qmzLmpdXcwnS4kBwr9WJ`
- **Badge:** `SELF STUDY COURSE`
- **Price:** ₹1,099
- **Duration & Validity:** 60 Days • 6 Months App Validity • 0 Live Sessions
- **Content Size:** 60 Days • 34 Video Modules
- **Shown on Website (`/courses` & Home Page):** ✅ Yes (`showOnHomePage: true`)
- **Current Unlocking Mode:** **Daily Drip** (`isTrainerGuided: false` — releases 1 video per day)

---

## 🔓 Detailed Breakdown of the 4 Unlocking Rules

### Rule 1: Free Preview (Before Buying a Course)
- **Who this applies to:** Any student who has **not** enrolled in the course yet (`isPurchased: false`).
- **What happens:**
  - **Videos 1, 2, and 3** are unlocked so the student can try the teaching method.
  - **Video 4 onwards** are marked `isLocked: true`.
  - Message shown on locked videos:
    > *"Enroll in this course to unlock full video access."*

---

### Rule 2: Self-Study Courses — "1 Video Per Day" (`daily_drip`)
- **Who this applies to:** Enrolled students in courses where **"Trainer Guided Course"** is **unchecked** (`isTrainerGuided: false`).
- **How the schedule works:**
  - **Day of Enrollment (Day 1):** Video 1 is unlocked.
  - **Next Calendar Day (Day 2, after midnight IST):** Video 2 unlocks.
  - **Day 3:** Video 3 unlocks, and so on—1 video every day.
- **Message shown on future locked videos:**
  > *"Released 1 video per day. This video unlocks on Day X."*

---

### Rule 3: Trainer-Guided Courses — "Next 3 Days Unlock After Task Approval" (`trainer_guided`)
- **Who this applies to:** Enrolled students in courses where **"Trainer Guided Course"** is **checked** (`isTrainerGuided: true`).
- **How the schedule works:**
  1. **When the student first enrolls:** **Day 1** is unlocked (1 day total).
  2. **Student completes the Day Task** (e.g., speaking recording or assignment) and submits it to their trainer.
  3. **Trainer marks the task as "Approved" or "Completed":** The backend automatically unlocks **3 more days** of videos!
     - After **1st approved task:** Days **1 to 4** are unlocked (4 days total).
     - After **2nd approved task:** Days **1 to 7** are unlocked (7 days total).
     - After **3rd approved task:** Days **1 to 10** are unlocked (10 days total).
- **Message shown on locked days:**
  > *"Complete your current day's task and get trainer approval to unlock the next 3 days' videos."*

---

### Rule 4: Admin, Trainer & Trainer Preview Accounts (`trainer_preview`)
- **Who this applies to:**
  - Any user with role `admin`, `superadmin`, or `trainer`.
  - Any student test account that has `isTrainerPreviewAccount: true` enabled.
- **What happens:** Every day, video, and task image in the course is **100% unlocked immediately** so trainers and admins can preview everything without waiting.

---

## 📱 Mobile App Developer Guide (How to Call the APIs)

### Common Request Header
Include this header when calling internal API endpoints from the mobile app:
```http
x-api-key: ancraze-secret-internal-key-2024
Content-Type: application/json
```

---

### Step 1: Show the "My Purchased Courses" List
Use this lightweight endpoint to list the courses a student has bought on their home screen:

- **Endpoint:** `GET /api/courses/purchased`
- **Parameters:** Pass `userId` (Firestore user ID) **or** `email`
- **Example:**
  ```http
  GET /api/courses/purchased?userId=STUDENT_USER_ID
  ```

---

### Step 2: Open a Course (Get Days, Videos, Tasks & Lock Status)
When a student taps on a course in the mobile app, call either of these endpoints:

- **Option A (Simplest):**
  ```http
  GET /api/courses/EB9q2FJk5RIWEEhcDzyu?stdId=STUDENT_USER_ID
  ```
- **Option B (Query Parameter style with API Key):**
  ```http
  GET /api/courses?courseId=EB9q2FJk5RIWEEhcDzyu&userId=STUDENT_USER_ID
  x-api-key: ancraze-secret-internal-key-2024
  ```
*(You can also pass `email=...&loginId=...` instead of `stdId`/`userId`.)*

#### What the Mobile App Receives Back:
1. **`accessControl` Summary Box:** Tells the app the current mode and how many days/videos are unlocked:
   ```json
   "accessControl": {
     "mode": "daily_drip",
     "isTrainerGuided": false,
     "isPurchased": true,
     "currentCourseDay": 4,
     "unlockedVideosCount": 4,
     "unlockedDaysCount": 4,
     "totalDaysCount": 31,
     "totalVideosCount": 31
   }
   ```
2. **`course.days[]` (Organized Day-by-Day):**
   Each day object contains:
   - `title` (e.g., `"WELCOME TO ANCRAZE"`)
   - `dayNumber` (e.g., `1`)
   - `isLocked` (`true` or `false`)
   - **Day Task Info:** `hasTask`, `taskTitle`, `taskDescription`, `taskType`, and `taskImageUrl` (Firebase Storage image URL for the day's task)
   - **`modules[]` (The Videos inside that Day):**
     - `title` (e.g., `"GREETINGS PART ONE"`)
     - `duration` (e.g., `"3:28"`)
     - `isLocked` (`false` = playable, `true` = show lock screen)
     - `lockReason` (Human-readable message explaining why it's locked and how to unlock it)
     - `videoUrl` / `streamUrl` / `hlsUrl` (Mux `.m3u8` adaptive streaming link — **`null` if locked**)
     - `thumbnailUrl` / `posterUrl` (Video thumbnail image — always available so locked cards still look great)
     - `questions` (Practice questions for the module)

---

### Step 3: Save & Load "Watched Video" Progress
When a student finishes watching a video module, mark it as watched so the app can show a checkmark and progress bar:

- **Mark a video as watched:**
  ```http
  POST /api/students/progress
  x-api-key: ancraze-secret-internal-key-2024
  ```
  ```json
  {
    "studentId": "STUDENT_USER_ID",
    "courseId": "EB9q2FJk5RIWEEhcDzyu",
    "moduleId": "5TZb289IuddgE2dJe8Ex",
    "watched": true
  }
  ```

- **Get watched videos for a course:**
  ```http
  GET /api/students/progress?studentId=STUDENT_USER_ID&courseId=EB9q2FJk5RIWEEhcDzyu
  x-api-key: ancraze-secret-internal-key-2024
  ```
  Returns `watchedModuleIds: ["5TZb289IuddgE2dJe8Ex", ...]` and `startedAt`.

---

### Step 4: Submit or Approve a Day Task (For Trainer-Guided Unlocking)
- **When a student submits a task or trainer assigns one:**
  `POST /api/tasks` (with `x-api-key`)
- **When a trainer approves/completes a task:**
  `PATCH /api/tasks` (with `x-api-key`)
  ```json
  {
    "taskId": "TASK_DOC_ID",
    "status": "approved",
    "trainerFeedback": "Great pronunciation!"
  }
  ```
  **Automatic Backend Action:** As soon as `status` is set to `"approved"` or `"completed"`, the server automatically unlocks the **next 3 days of videos** for that student.

---

### Step 5: Enroll a Student in a Course
- **Endpoint:** `POST /api/enroll` (with `x-api-key`)
- **Body:**
  ```json
  {
    "userId": "STUDENT_USER_ID",
    "courseId": "EB9q2FJk5RIWEEhcDzyu"
  }
  ```
- **Automatic Backend Action:** Adds the course to the student's `enrolledCourses` and saves today's timestamp as `enrolledAt` so Day 1 begins immediately.
