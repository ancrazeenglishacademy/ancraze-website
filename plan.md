# Implementation Plan: 3-Role Academy Architecture

This document outlines the architectural plan to structure the Ancraze English Academy platform with dedicated panels and comprehensive feature sets for **Super Admin**, **Admin**, and **Trainer**, aligned with modern Next.js 16 (App Router), Tailwind CSS v4, and Firebase Firestore/Admin SDK.

---

## 1. High-Level Role Architecture & Navigation

```
                       ┌───────────────────────────────┐
                       │     Firebase Authentication   │
                       │   & Role Verification Engine  │
                       └───────────────┬───────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│   SUPER ADMIN PANEL     │  │       ADMIN PANEL       │  │      TRAINER PANEL      │
│   Route: /superadmin    │  │   Route: /dashboard     │  │     Route: /trainer     │
│   Role: Overall Academy │  │   Role: Student Admin   │  │   Role: Learning &      │
│   Governance & Control  │  │   & Operations          │  │   Evaluation            │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 2. Detailed Panel Specifications

### 2.1 Super Admin Panel (`/superadmin`)
**Role:** Overall management, executive analytics, and governance of the entire academy.

* **Navigation & Routes:**
  * `/superadmin` — **Executive Dashboard & Statistics:** Total students, admission trends, trainer performance indexes, course completion rates, revenue charts, and platform health.
  * `/superadmin/courses` — **Course & Curriculum Management:** Full course authoring, pricing & fees, module structuring, day-by-day lesson scheduling, video integration, assignment configuration, and publication status.
  * `/superadmin/students` — **Student Governance:** Complete academy-wide student directory, course enrolments, learning progress, status controls, and global profile audit.
  * `/superadmin/finances` — **Financial Management:** Revenue tracking, fee payments, outstanding balances, expense recording, financial breakdown by course, and financial report exports.
  * `/superadmin/staff` — **Staff Management:** Create, manage, and assign roles (`admin`, `trainer`), permissions management, active student workload balancing, and trainer assignment summaries.
  * `/superadmin/oversight` — **Account Oversight & Approvals:** Review and approve/reject refund requests and student account closure requests initiated by admins, oversee account freezing/restoration policies.
  * `/superadmin/reports` — **Reports & Analytics:** Advanced report generator for student performance, trainer engagement metrics, course completion statistics, and financial audit logs with CSV/Print capabilities.
  * `/superadmin/settings` — **System Settings:** Academy branding (name, logos, contact info, support channels), website configuration, notification preferences, and platform security rules.

---

### 2.2 Admin Panel (`/dashboard` or `/admin`)
**Role:** Day-to-day student operations, enrolment management, onboarding, trainer allocations, and operational support.

* **Navigation & Routes:**
  * `/dashboard` — **Operational Dashboard:** Today's admissions, active students count, trainer distribution summary, pending onboarding tasks, and quick alerts.
  * `/dashboard/registration` — **Student Registration & Onboarding:** Add admitted students, auto-generate unique formatted Student IDs (`ANC-XXXXXX`), set temporary passwords, and instant credential sharing cards (WhatsApp/Email copy-ready format).
  * `/dashboard/students` — **Student Records & Enrolment:** Update student personal details, manage enrolled courses, course progression status, and contact history.
  * `/dashboard/allocations` — **Trainer Allocation:** Assign students to specific trainers, reallocate students between trainers, and monitor trainer student capacity.
  * `/dashboard/accounts` — **Account Management:** Freeze (temporary suspension), restore (unfreeze), and initiate account closure requests with audit reasons for Super Admin approval.
  * `/dashboard/monitoring` — **Student Monitoring & Activity:** Track recent login timestamps, active devices (`deviceId` tracking and reset), course access status, and basic completion percentages.
  * `/dashboard/communications` — **Announcements & Broadcasts:** Send academy-wide or cohort announcements, course deadline reminders, and onboarding follow-ups.
  * `/dashboard/support-requests` — **Support & Refund Requests:** Handle student enquiries, manage issue tickets, and formally raise/forward refund or exceptional account requests to the Super Admin.

---

### 2.3 Trainer Panel (`/trainer`)
**Role:** Direct student learning support, task evaluation, speaking assessment, and academic progress monitoring.

* **Navigation & Routes:**
  * `/trainer` — **Trainer Console Dashboard:** Summary of assigned active students, pending tasks awaiting review, recent submissions, and quick-alerts for lagging students.
  * `/trainer/students` — **Assigned Students Roster:** Filtered strictly to students allocated to the logged-in trainer (`trainerId == auth.uid`), view contact info, enrolled modules, and learning velocity.
  * `/trainer/tasks` — **Task Evaluation & Approval:**
    * Filter tasks by status: `Pending Review`, `Approved`, `Needs Correction`.
    * Review written assignments, exercises, quiz submissions, and audio voice recordings.
    * Provide structured feedback, mark as Approved or return with specific correction notes.
  * `/trainer/progress` — **Progress Tracking:** In-depth lesson completion rates, task submission compliance, module milestone checkpoints, and individual student progress cards.
  * `/trainer/support` — **Student Learning Support & Guidance:** Learning Q&A desk, message notes to students, and academic guidance logs.
  * `/trainer/reports` — **Student Performance & Risk Reports:** Automated identification of at-risk students (falling behind schedule, multiple missed deadlines, low task scores) and one-click incident reporting to Admins.

---

## 3. Data Model & Firestore Architecture

### 3.1 Collections & Schema Updates

```
users (Collection)
├── uid: string (Firebase Auth UID)
├── email: string
├── fullName: string
├── role: 'superadmin' | 'admin' | 'trainer' | 'student' | 'user'
├── loginId: string (e.g. ANC-82910)
├── trainerId: string | null (UID of assigned trainer)
├── trainerName: string | null
├── enrolledCourses: string[] (Course IDs)
├── enrolledCoursesDetails: object[]
├── accountStatus: 'active' | 'frozen' | 'closure_requested' | 'closed'
├── isBlocked: boolean
├── deviceId: string | null
├── phone: string | null
├── batch: string | null
├── notes: string | null
├── createdByAdminName: string | null
├── createdAt: Timestamp
└── lastLoginAt: Timestamp

courses (Collection)
├── id: string
├── title: string
├── description: string
├── teacherName: string
├── price: number | string
├── status: 'published' | 'draft' | 'archived'
├── coverImage: string
├── moduleCount: number
├── modules: array (Sub-modules / Lessons / Videos)
├── assignments: array
└── days: subcollection or array

tasks / submissions (Collection)
├── id: string
├── title: string
├── description: string
├── taskType: 'assignment' | 'exercise' | 'quiz' | 'speaking_recording'
├── studentId: string
├── trainerId: string
├── courseId: string
├── status: 'pending' | 'submitted' | 'approved' | 'needs_correction'
├── submissionUrl: string | null
├── audioRecordingUrl: string | null
├── submissionNotes: string | null
├── trainerFeedback: string | null
├── score: number | null
├── dueDate: Timestamp
├── submittedAt: Timestamp | null
├── evaluatedAt: Timestamp | null
└── createdAt: Timestamp

finances (Collection)
├── id: string
├── type: 'revenue' | 'expense' | 'refund'
├── title: string
├── amount: number
├── currency: string (INR / USD)
├── studentId: string | null
├── studentName: string | null
├── courseId: string | null
├── courseTitle: string | null
├── status: 'completed' | 'pending' | 'refunded'
├── paymentMethod: string
├── invoiceNumber: string
└── createdAt: Timestamp

requests (Collection) [For Admin -> Super Admin oversight]
├── id: string
├── type: 'refund' | 'account_closure' | 'exception'
├── studentId: string
├── studentName: string
├── studentLoginId: string
├── requestedByAdminId: string
├── requestedByAdminName: string
├── reason: string
├── amount: number | null
├── status: 'pending' | 'approved' | 'rejected'
├── resolutionNotes: string | null
├── reviewedBy: string | null
├── createdAt: Timestamp
└── resolvedAt: Timestamp | null

announcements (Collection)
├── id: string
├── title: string
├── content: string
├── targetRole: 'all' | 'student' | 'trainer' | 'admin'
├── priority: 'normal' | 'urgent'
├── authorName: string
├── authorId: string
├── createdAt: Timestamp

system_settings (Doc: config/academy)
├── academyName: string
├── academyTagline: string
├── logoUrl: string
├── contactEmail: string
├── contactPhone: string
├── currencySymbol: string
├── studentIdPrefix: string (e.g. ANC)
├── maxDeviceLimit: number
└── announcementBanner: string
```

---

## 4. Phased Implementation Roadmap

### Phase 1: Shared APIs & Data Access Layer
1. Expand `/api/students/route.ts` and `/api/users/route.ts` to support:
   - Account status (`active`, `frozen`, `closure_requested`).
   - Device reset and trainer re-allocation.
   - Batch updates and formatted ID generation.
2. Create `/api/finances/route.ts` for financial ledger and revenue summaries.
3. Create `/api/requests/route.ts` for handling refund and closure approval workflows.
4. Create `/api/announcements/route.ts` for communications broadcast.
5. Create `/api/settings/route.ts` for academy configuration.

### Phase 2: Super Admin Panel Enhancements (`/superadmin`)
1. **Sidebar & Layout Navigation:** Add links to Dashboard, Courses, Students, Finances, Staff, Account Oversight, Reports & Analytics, and Settings.
2. **Dashboard & Statistics Page (`/superadmin`):** Comprehensive metrics (Students, Admissions, Trainer KPIs, Completion Rates, Revenue, System Health).
3. **Financial Management Page (`/superadmin/finances`):** Metrics cards, payments ledger, outstanding balances, revenue breakdown.
4. **Account Oversight Page (`/superadmin/oversight`):** One-click approval/rejection for refund and closure requests, account freeze review.
5. **Reports & Analytics Page (`/superadmin/reports`):** Multi-dimensional reports (Student progress, Trainer performance, Financial audit).
6. **System Settings Page (`/superadmin/settings`):** Platform branding, security rules, notification settings.

### Phase 3: Admin Panel Enhancements (`/dashboard`)
1. **Sidebar & Layout Navigation:** Refine sidebar with Dashboard, Registration & Onboarding, Student Records, Trainer Allocation, Account Management, Student Monitoring, Communications, and Support & Requests.
2. **Registration & Onboarding Page (`/dashboard/registration`):** Admission intake form, unique Student ID generator (`ANC-XXXXXX`), temporary password, shareable onboarding credential slip.
3. **Trainer Allocation Page (`/dashboard/allocations`):** Drag-and-drop or batch allocation modal to assign and balance students per trainer.
4. **Account Management Page (`/dashboard/accounts`):** Quick Freeze, Unfreeze, and request account closure with reason.
5. **Student Monitoring Page (`/dashboard/monitoring`):** Real-time monitoring of login activity, progress %, and active device sessions.
6. **Communication Page (`/dashboard/communications`):** Announcements creation and broadcast dispatch.
7. **Support & Refund Requests Page (`/dashboard/support-requests`):** Forward requests to Super Admin with tracking status.

### Phase 4: Trainer Panel Enhancements (`/trainer`)
1. **Sidebar & Layout Navigation:** Add Dashboard, Assigned Students, Task Evaluation & Approvals, Progress Tracking, Student Support, and Performance Reports.
2. **Task Evaluation Page (`/trainer/tasks`):** Multi-media evaluation interface supporting text submissions, file uploads, quizzes, and audio voice recording player with approve/return feedback controls.
3. **Progress Tracking Page (`/trainer/progress`):** Visual student progress meters, module-by-module breakdown, and lesson completion checkmarks.
4. **Student Support Desk (`/trainer/support`):** Interactive Q&A notes, academic support guidelines, student consultation logs.
5. **Performance & Lagging Student Reports (`/trainer/reports`):** Auto-flagging students with overdue assignments or stalled progress, one-click escalation report to Admins.

### Phase 5: Verification & Quality Assurance
1. Test role-based protection and route middleware guards.
2. Verify all API endpoints with API key and role authentication.
3. Check UI responsiveness across mobile, tablet, and desktop screens with the brand color theme (`#2A0066`).

