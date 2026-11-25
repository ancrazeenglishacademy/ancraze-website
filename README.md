# ANCRAZE — Online Spoken English Academy & Learning Management Platform

**Ancraze** is a full-stack Learning Management System (LMS), multi-role operational console, and SEO-optimized public web portal for **Ancraze Online Spoken English Academy** (*"Don't Just Learn English. Speak English with Our 20 Codes."*).

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Firebase (Auth, Firestore, Storage)**, and **Mux Video HLS Streaming**, the platform powers public course discovery, lead capture, curriculum authoring, progressive video unlocking, trainer milestone evaluation, and REST APIs for the Ancraze mobile applications (Android & iOS).

---

## Table of Contents

1. [Platform Highlights](#1-platform-highlights)
2. [Tech Stack](#2-tech-stack)
3. [Role-Based Portals & Capabilities](#3-role-based-portals--capabilities)
4. [Progressive Course Access & Unlocking Engine](#4-progressive-course-access--unlocking-engine)
5. [Project Structure](#5-project-structure)
6. [Public SEO Routes & Sitemap](#6-public-seo-routes--sitemap)
7. [REST API Reference](#7-rest-api-reference)
8. [Environment Variables](#8-environment-variables)
9. [Getting Started & Deployment](#9-getting-started--deployment)

---

## 1. Platform Highlights

- **Dynamic Course & Curriculum Engine**: Create and manage Spoken English courses with custom pricing (`₹` INR), refund eligibility windows (`refundDays`), trainer-guided flags (`isTrainerGuided`), homepage visibility toggles, and rich marketing metadata.
- **Day-Based Curriculum & Tasks**: Organize courses into ordered **Days**, each with its own day-level speaking/practice task details and task image stored in **Firebase Storage**, plus multiple video **Modules** and interactive Q&A items.
- **Mux HLS Video Streaming**: Direct browser-to-Mux video upload and asset library selection with adaptive HLS (`.m3u8`) playback URLs and automatic thumbnails for web and mobile apps.
- **Automated Video Drip & Trainer-Guided Unlocking**:
  - **Self-Study / Non-Trainer-Guided Courses**: Automatically releases **1 video per calendar day** (IST) from the student's enrollment date.
  - **Trainer-Guided Courses**: Unlocks the **next 3 days' videos** each time an assigned trainer marks a student's day task as completed.
  - **Trainer Preview Student Accounts**: Special flag (`isTrainerPreviewAccount`) that unlocks all course videos immediately without waiting for daily drip or task completions.
- **Multi-Course Student Progress & Milestone Tracking**: Tracks watched modules (`watchedModuleIds`), completed day tasks (`completedDayIds`), unlocked day counts, and enrollment start dates independently for each course a student is enrolled in.
- **Financial & Admissions Ledger**: Tracks student admissions fees in INR (`₹`), revenue vs. expense entries, payment statuses, and website admission enquiries.

---

## 2. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js `16.1.3` (App Router, Server & Client Components) |
| **Language** | TypeScript `5.x` |
| **UI & Styling** | React `19.2.3`, Tailwind CSS `4`, Framer Motion `12`, Lucide Icons |
| **Authentication** | Firebase Authentication & Firebase Admin SDK (`ANC-XXXXXX` Student Login IDs & Staff Auth) |
| **Database** | Cloud Firestore (Courses, Days, Modules, Users, Course Progress, Tasks, Enquiries, Finances, Support Requests) |
| **Object Storage** | Firebase Cloud Storage (Course Cover Images, Day Task Images, Faculty Avatars) |
| **Video Streaming** | Mux Video REST API (Direct Uploads, Public Playback IDs, HLS `.m3u8` Streams, Webhooks) |

---

## 3. Role-Based Portals & Capabilities

### SuperAdmin Portal (`/superadmin`)
- **Executive Overview (`/superadmin`)**: Real-time KPIs for active students, trainers, total revenue (`₹`), and course catalog metrics.
- **Course & Curriculum Management (`/superadmin/courses`, `/superadmin/addCourse`, `/superadmin/course/[id]`)**:
  - Live homepage card preview while creating or editing courses.
  - Configure **Trainer Guided Course** mode and **Course Refund Days**.
  - Manage ordered **Days** (with day-level task title, task description, task type, and Firebase Storage task image) and **Modules** (with Mux video picker/uploader and Q&A pairs).
- **Student Directory (`/superadmin/students`)**: Register students with auto-generated or custom `ANC-XXXXXX` Login IDs, assign trainers, enroll in multiple courses, or designate **Trainer Preview Accounts**.
- **Staff & Faculties (`/superadmin/staff`, `/superadmin/faculties`)**: Manage admin/trainer accounts and public-facing faculty profiles.
- **Financials & Enquiries (`/superadmin/finances`, `/superadmin/enquiries`, `/superadmin/oversight`)**: Track revenue/expenses in INR (`₹`), manage website enquiries, and approve operational requests.

### Admin / Operations Dashboard (`/dashboard`)
- **Student Intake & Registration (`/dashboard/registration`, `/dashboard/students`)**: Onboard new students, record initial admission fees (`₹`), manage multi-course enrollments, and toggle **Trainer Preview Account** access.
- **Trainer Allocations (`/dashboard/allocations`)**: Assign and rebalance students across personal speaking trainers.
- **Curriculum Management (`/dashboard/course`, `/dashboard/addCourse`, `/dashboard/course/[id]`)**: Full access to create courses, days, day-based tasks with task images, and video modules.
- **Support & Communications (`/dashboard/support-requests`, `/dashboard/communications`, `/dashboard/monitoring`)**: Broadcast announcements and handle trainer/student escalation tickets.

### Trainer Portal (`/trainer`)
- **Instructional Console (`/trainer`)**: Quick overview of assigned learners, completed day tasks, and at-risk student alerts.
- **Day-Based Task Completion (`/trainer/tasks`)**: Select an allocated student, choose their enrolled course, pick the course day task, view the day task prompt/image, and mark it completed in one click to unlock the next 3 days' videos.
- **Per-Course Progress & Milestone Tracking (`/trainer/progress`)**: View each student's watched videos, completed lessons, unlocked days, and milestone percentage with an interactive per-student course switcher for multi-course students.
- **At-Risk Learner Reports & Support (`/trainer/reports`, `/trainer/support`)**: Escalate lagging learners to operations admins.

---

## 4. Progressive Course Access & Unlocking Engine

Centralized in [`lib/mux.ts`](./lib/mux.ts) (`computeCourseAccessAndLocking`), video and task locking is enforced consistently across all course and student endpoints:

| Account / Course Type | Unlocking Behavior |
| :--- | :--- |
| **Trainer Guided Course (`isTrainerGuided: true`)** | Starts with **Day 1** unlocked. Every time the trainer marks a day's task as completed, the **next 3 days' videos** are unlocked (`1 + completedTasksCount * 3`). |
| **Self-Paced / Non-Trainer-Guided (`isTrainerGuided: false`)** | Releases **1 video per calendar day** (calculated in IST `UTC+5:30`) starting from the student's course enrollment timestamp. |
| **Trainer Preview Account (`isTrainerPreviewAccount: true`)** | Unlocks **100% of days, modules, and task images immediately**, bypassing daily drip and task completion timers. |
| **Unenrolled / Public Preview** | Unlocks the first 3 preview videos and locks the remaining curriculum (`isLocked: true`, `playbackId: null`, `videoUrl: null`). |

Each module returned to the client app automatically includes its parent day's task metadata (`taskTitle`, `taskDescription`, `taskType`, `taskImageUrl`, and `task` object) so the mobile app can display the day's task image alongside the lesson video.

---

## 5. Project Structure

```text
ancraze/
├── app/
│   ├── about/                  # Public About Us SEO page
│   ├── contact/                # Public Contact & Admissions Enquiry page
│   ├── courses/                # Dynamic Public Course Catalog page
│   ├── faculties/              # Public Faculties & Mentors page
│   ├── privacy/                # Public Privacy Policy page
│   ├── what-we-provide/        # Public "What We Provide" feature page
│   ├── why-ancraze/            # Public "Why Ancraze & 20 Codes" methodology page
│   ├── login/                  # Staff & Portal Authentication page
│   ├── dashboard/              # Operations Admin Dashboard routes
│   ├── superadmin/             # SuperAdmin Console routes
│   ├── trainer/                # Trainer Instructional Portal routes
│   ├── componets/              # Shared UI components (Navbar, Footer, MuxVideoPicker, etc.)
│   ├── api/                    # REST API Route Handlers (Auth, Courses, Days, Modules, Students, Tasks, Mux)
│   ├── layout.tsx              # Root metadata, OpenGraph, & JSON-LD Schema.org graph
│   ├── page.tsx                # Main Landing Page
│   ├── robots.ts               # Dynamic robots.txt generator
│   └── sitemap.ts              # Dynamic XML sitemap generator
├── lib/
│   ├── firebase.ts             # Firebase Client SDK initialization
│   ├── firebaseAdmin.ts        # Firebase Admin SDK (Firestore, Auth, Storage)
│   └── mux.ts                  # Mux Video API client & progressive course unlocking logic
├── public/                     # Static brand assets, icons, and Google verification HTML
└── SEO_TEAM_ROUTES_GUIDE.md    # Comprehensive route & indexing guide for the SEO team
```

---

## 6. Public SEO Routes & Sitemap

| Route | Purpose |
| :--- | :--- |
| `/` | Homepage — 20 Codes Method, Dynamic Courses, App Download, FAQs, & Quick Enquiry |
| `/courses` | Dynamic Spoken English Course Catalog & Plan Comparison |
| `/why-ancraze` | The 20 Codes Method & Why Choose Ancraze |
| `/what-we-provide` | 24/7 App, 1-on-1 Personal Speaking Trainers, Daily Practice, & Live Sessions |
| `/about` | Academy Story & Mission for Bengali-Speaking Learners |
| `/faculties` | Certified Spoken English Faculties & Personal Trainers |
| `/contact` | Admissions Office Contact & Course Enquiry Form |
| `/privacy` | Privacy Policy |
| `/robots.txt` | Crawler rules (allows all public pages; disallows `/api/`, `/dashboard/`, `/superadmin/`, `/trainer/`) |
| `/sitemap.xml` | Dynamic XML Sitemap for Google Search Console |

---

## 7. REST API Reference

Protected internal and mobile endpoints accept the `x-api-key` header matching `INTERNAL_API_KEY`.

### Authentication & Student Profile
- `POST /api/auth/student-login` — Authenticates a student via `email` and `loginId` (`ANC-XXXXXX`), supporting multi-device sessions and recording `deviceId` and `lastLoginAt` metadata.
- `POST /api/auth/login` / `POST /api/auth/trainer-login` — Authenticates admin, superadmin, and trainer accounts.
- `GET /api/students/courses` — Returns all enrolled courses for an authenticated student with progressive day/video lock states and day task images.
- `GET | POST /api/students/progress` — Reads or atomically updates a student's course progress (`startedAt`, `watchedModuleIds`) in `users/{studentId}/courseProgress/{courseId}`.

### Courses, Days & Modules
- `GET | POST | DELETE /api/courses` — Lists all courses or fetches a single course (`?courseId=...`), including days, modules, and computed `accessControl`.
- `GET | DELETE /api/courses/[id]` — Fetches a specific course by ID with enrollment & progressive unlock computation for `?stdId=...` or `?email=...&loginId=...`.
- `POST /api/addcourse` & `PUT /api/courses/update` — Creates or updates course details, cover image, `isTrainerGuided`, and `refundDays`.
- `GET | POST | DELETE /api/days` & `PUT /api/days/update` — Creates, updates, or deletes course days along with day-based task fields and Firebase Storage task images (`taskImageUrl`).
- `GET | POST | DELETE /api/modules` & `PUT /api/modules/update` — Manages video lessons and Q&A items under each day.

### Student Management, Tasks & Video Streaming
- `GET | POST | PATCH | DELETE /api/students` — CRUD operations for students, multi-course enrollments, trainer assignments, `isTrainerPreviewAccount` flags, and per-course curriculum progress.
- `GET | POST | PATCH | DELETE /api/tasks` — Records day-task completions and automatically unlocks the next 3 days' videos for trainer-guided courses.
- `GET | POST /api/mux/upload` & `GET | DELETE /api/mux/assets` — Direct upload URLs and asset management for Mux HLS video streaming.

---

## 8. Environment Variables

Create a `.env.local` file in the project root with the following configuration:

```env
# Site URL
NEXT_PUBLIC_APP_URL=https://www.ancraze.com

# Internal API Security Key
INTERNAL_API_KEY=your_internal_api_key
NEXT_PUBLIC_INTERNAL_API_KEY=your_internal_api_key

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Service Account)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# Mux Video Streaming API
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_secret
```

---

## 9. Getting Started & Deployment

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run TypeScript & Production Build Checks:**
   ```bash
   npx tsc --noEmit
   npm run build
   ```

### Production Server Start
```bash
npm run build
npm run start
```

---

© 2026 **Ancraze Online Spoken English Academy**. All Rights Reserved.
