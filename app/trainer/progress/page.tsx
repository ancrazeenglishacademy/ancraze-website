"use client";

import { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import {
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  User,
  Loader,
  Award,
  ChevronRight,
  Filter,
  PlayCircle,
  CheckSquare,
  Calendar,
  Sparkles,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface CourseDetail {
  id: string;
  title: string;
  duration?: string;
  isTrainerGuided?: boolean;
  daysCount?: number;
  modulesCount?: number;
  dayIds?: string[];
  moduleIds?: string[];
}

interface TaskRecord {
  id: string;
  title: string;
  studentId: string;
  courseId?: string | null;
  dayId?: string | null;
  dayNumber?: number | null;
  moduleId?: string | null;
  status: "pending" | "submitted" | "approved" | "needs_correction" | "completed";
  score?: number | null;
  createdAt?: string;
  evaluatedAt?: string | null;
}

interface RawStudent {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  accountStatus?: string;
  isBlocked?: boolean;
  isTrainerPreviewAccount?: boolean;
  trainerPreviewAccount?: boolean;
  enrolledCourses?: string[];
  enrolledCoursesDetails?: CourseDetail[];
  courseProgress?: Record<string, any>;
  courseEnrollments?: Record<string, any>;
  createdAt?: string;
  lastLoginAt?: string | null;
}

interface ComputedCourseMetrics {
  courseId: string;
  courseTitle: string;
  isTrainerGuided: boolean;
  isPreviewAccount: boolean;
  enrolledAt: string | null;
  startedAt: string | null;
  totalDays: number;
  totalModules: number;
  watchedModulesCount: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lessonCompletionRate: number;
  unlockedDaysCount: number;
  unlockedVideosCount: number;
  totalTasksForCourse: number;
  submittedOrCompletedTasksCount: number;
  approvedTasksCount: number;
  pendingTasksCount: number;
  needsCorrectionTasksCount: number;
  taskSubmissionRate: number;
  averageScore: number | null;
  overallMilestoneRate: number;
}

function parseDurationDays(durationStr?: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/(\d+)\s*day/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

export default function TrainerProgressPage() {
  const [students, setStudents] = useState<RawStudent[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalCourseFilter, setGlobalCourseFilter] = useState<string>("all");
  // Per-student selected course ID map: { [studentId]: courseId }
  const [selectedCourseByStudent, setSelectedCourseByStudent] = useState<Record<string, string>>({});
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedStudentsProgress();
  }, []);

  const getTrainerUid = () => {
    const userDataCookie = Cookies.get("userData");
    let trainerUid = "";
    if (userDataCookie) {
      try {
        trainerUid = JSON.parse(userDataCookie).uid || "";
      } catch {
        // ignore
      }
    }
    if (!trainerUid) trainerUid = Cookies.get("uid") || "";
    return trainerUid;
  };

  const fetchAssignedStudentsProgress = async () => {
    try {
      setLoading(true);
      const trainerUid = getTrainerUid();
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      const [studentsRes, tasksRes] = await Promise.all([
        fetch(`/api/students?trainerId=${trainerUid}`, { headers }),
        fetch(`/api/tasks?trainerId=${trainerUid}`, { headers }),
      ]);

      const studentsData = studentsRes.ok ? await studentsRes.json() : { students: [] };
      const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };

      const myStudents: RawStudent[] = studentsData.students || [];
      const myTasks: TaskRecord[] = tasksData.tasks || [];

      setStudents(myStudents);
      setTasks(myTasks);

      // Initialize per-student selected course if not already set
      setSelectedCourseByStudent((prev) => {
        const next = { ...prev };
        myStudents.forEach((s) => {
          const availableIds =
            s.enrolledCoursesDetails?.map((c) => c.id) ||
            s.enrolledCourses ||
            [];
          if (!next[s.id] || (availableIds.length > 0 && !availableIds.includes(next[s.id]))) {
            next[s.id] = availableIds[0] || "";
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Error fetching student milestone data:", err);
    } finally {
      setLoading(false);
    }
  };

  // All distinct courses across assigned students for the top filter bar
  const allAvailableCourses = useMemo(() => {
    const map = new Map<string, CourseDetail>();
    students.forEach((s) => {
      (s.enrolledCoursesDetails || []).forEach((c) => {
        if (c?.id && !map.has(c.id)) {
          map.set(c.id, c);
        }
      });
    });
    return Array.from(map.values());
  }, [students]);

  // When global course filter changes to a specific course, automatically switch each enrolled student's tab to that course
  const handleGlobalCourseFilterChange = (courseId: string) => {
    setGlobalCourseFilter(courseId);
    if (courseId !== "all") {
      setSelectedCourseByStudent((prev) => {
        const next = { ...prev };
        students.forEach((s) => {
          const enrolledIds =
            s.enrolledCoursesDetails?.map((c) => c.id) || s.enrolledCourses || [];
          if (enrolledIds.includes(courseId)) {
            next[s.id] = courseId;
          }
        });
        return next;
      });
    }
  };

  // Compute comprehensive metrics for a given student & selected courseId
  const computeStudentCourseMetrics = (
    student: RawStudent,
    targetCourseId: string
  ): ComputedCourseMetrics => {
    const enrolledDetails = student.enrolledCoursesDetails || [];
    const courseObj =
      enrolledDetails.find((c) => c.id === targetCourseId) ||
      enrolledDetails[0] ||
      null;

    const courseId = courseObj?.id || targetCourseId || student.enrolledCourses?.[0] || "";
    const courseTitle = courseObj?.title || "Unassigned Course";
    const isTrainerGuided = Boolean(courseObj?.isTrainerGuided);
    const isPreviewAccount = Boolean(
      student.isTrainerPreviewAccount || student.trainerPreviewAccount
    );

    const progressInfo = (courseId && student.courseProgress?.[courseId]) || {};
    const enrollmentInfo = (courseId && student.courseEnrollments?.[courseId]) || {};

    const enrolledAt: string | null =
      enrollmentInfo.enrolledAt ||
      progressInfo.enrolledAt ||
      student.createdAt ||
      null;
    const startedAt: string | null =
      progressInfo.startedAt ||
      enrollmentInfo.startedAt ||
      enrolledAt;

    // Filter tasks belonging to this student and this selected course
    const studentAllTasks = tasks.filter((t) => t.studentId === student.id);
    const studentEnrolledCount = Math.max(
      enrolledDetails.length,
      student.enrolledCourses?.length || 0
    );

    const courseTasks = studentAllTasks.filter((t) => {
      if (t.courseId && courseId) {
        return t.courseId === courseId;
      }
      // Legacy tasks without courseId belong to the course if student only has 1 course or it's their primary course
      if (!t.courseId) {
        const primaryId = enrolledDetails[0]?.id || student.enrolledCourses?.[0] || "";
        return studentEnrolledCount <= 1 || courseId === primaryId;
      }
      return false;
    });

    const approvedOrCompletedTasks = courseTasks.filter(
      (t) => t.status === "approved" || t.status === "completed"
    );
    const submittedOrCompletedTasks = courseTasks.filter(
      (t) =>
        t.status === "submitted" ||
        t.status === "approved" ||
        t.status === "completed"
    );
    const pendingTasks = courseTasks.filter(
      (t) => t.status === "pending" || t.status === "submitted"
    );
    const needsCorrectionTasks = courseTasks.filter(
      (t) => t.status === "needs_correction"
    );

    // Scored tasks for this specific course
    const scoredTasks = courseTasks.filter(
      (t) => typeof t.score === "number" && !isNaN(t.score)
    );
    const averageScore =
      scoredTasks.length > 0
        ? Math.round(
            scoredTasks.reduce((acc, t) => acc + Number(t.score || 0), 0) /
              scoredTasks.length
          )
        : null;

    // Watched modules for this specific course
    const rawWatchedIds: string[] = Array.isArray(progressInfo.watchedModuleIds)
      ? progressInfo.watchedModuleIds
      : [];
    const courseModuleIds: string[] = Array.isArray(courseObj?.moduleIds)
      ? courseObj.moduleIds
      : [];
    const watchedModulesCount =
      courseModuleIds.length > 0
        ? rawWatchedIds.filter((id) => courseModuleIds.includes(id)).length
        : rawWatchedIds.length;

    // Completed days & tasks count for this course
    const completedDayIds: string[] = Array.isArray(progressInfo.completedDayIds)
      ? progressInfo.completedDayIds
      : [];
    const completedTasksCount = Math.max(
      Number(progressInfo.completedTasksCount || 0),
      approvedOrCompletedTasks.length,
      completedDayIds.length
    );

    // Course totals (days and modules)
    const durationDaysFallback = parseDurationDays(courseObj?.duration) || 30;
    const totalDays =
      courseObj?.daysCount && courseObj.daysCount > 0
        ? courseObj.daysCount
        : durationDaysFallback;
    const totalModules =
      courseObj?.modulesCount && courseObj.modulesCount > 0
        ? courseObj.modulesCount
        : totalDays;

    // Calculate unlocked days & videos based on course mode & enrollment date
    let unlockedDaysCount = 1;
    let unlockedVideosCount = 1;

    if (isPreviewAccount) {
      unlockedDaysCount = totalDays;
      unlockedVideosCount = totalModules;
    } else if (isTrainerGuided) {
      const storedUnlockedDays = Number(progressInfo.unlockedDaysCount || 0);
      unlockedDaysCount = Math.min(
        totalDays,
        Math.max(1, storedUnlockedDays, 1 + completedTasksCount * 3)
      );
      unlockedVideosCount = Math.min(totalModules, unlockedDaysCount);
    } else {
      // Non-trainer-guided: 1 video per day since enrollment in IST
      const enrolledDate = enrolledAt ? new Date(enrolledAt) : new Date();
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const enrolledDayNum = Math.floor(
        (enrolledDate.getTime() + IST_OFFSET_MS) / (1000 * 60 * 60 * 24)
      );
      const currentDayNum = Math.floor(
        (Date.now() + IST_OFFSET_MS) / (1000 * 60 * 60 * 24)
      );
      const elapsedDays = Math.max(0, currentDayNum - enrolledDayNum);
      const manualUnlocked = Number(
        progressInfo.unlockedVideosCount || progressInfo.unlockedDaysCount || 0
      );
      unlockedVideosCount = Math.min(
        totalModules,
        Math.max(1, elapsedDays + 1, manualUnlocked)
      );
      unlockedDaysCount = Math.min(totalDays, unlockedVideosCount);
    }

    // Lesson completion: considers watched modules, completed day tasks, and unlocked progress
    const totalLessonsCount =
      courseObj?.modulesCount && courseObj.modulesCount > 0
        ? courseObj.modulesCount
        : totalDays;

    const completedLessonsCount = Math.min(
      totalLessonsCount,
      Math.max(
        watchedModulesCount,
        completedTasksCount,
        isPreviewAccount ? totalLessonsCount : 0
      )
    );

    const lessonCompletionRate =
      totalLessonsCount > 0
        ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100))
        : 0;

    const unlockProgressRate =
      totalDays > 0
        ? Math.min(100, Math.round((unlockedDaysCount / totalDays) * 100))
        : 0;

    const taskSubmissionRate =
      courseTasks.length > 0
        ? Math.min(
            100,
            Math.round((submittedOrCompletedTasks.length / courseTasks.length) * 100)
          )
        : completedTasksCount > 0
        ? 100
        : 0;

    // Overall milestone rate combines lesson progress, unlock progress, and task completion
    const overallMilestoneRate = Math.min(
      100,
      Math.max(lessonCompletionRate, unlockProgressRate)
    );

    return {
      courseId,
      courseTitle,
      isTrainerGuided,
      isPreviewAccount,
      enrolledAt,
      startedAt,
      totalDays,
      totalModules,
      watchedModulesCount,
      completedLessonsCount,
      totalLessonsCount,
      lessonCompletionRate,
      unlockedDaysCount,
      unlockedVideosCount,
      totalTasksForCourse: courseTasks.length,
      submittedOrCompletedTasksCount: submittedOrCompletedTasks.length,
      approvedTasksCount: completedTasksCount,
      pendingTasksCount: pendingTasks.length,
      needsCorrectionTasksCount: needsCorrectionTasks.length,
      taskSubmissionRate,
      averageScore,
      overallMilestoneRate,
    };
  };

  const handleMarkDayTaskCompleted = async (
    student: RawStudent,
    metrics: ComputedCourseMetrics
  ) => {
    if (!metrics.courseId) {
      alert("This student is not enrolled in a course yet.");
      return;
    }

    const actionKey = `${student.id}_${metrics.courseId}`;
    try {
      setUnlockingKey(actionKey);
      const trainerUid = getTrainerUid();
      const nextDayNum = metrics.approvedTasksCount + 1;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          title: `${metrics.courseTitle} — Day ${nextDayNum} Task Completed`,
          description: `Trainer marked Day ${nextDayNum} task as completed for ${metrics.courseTitle}, unlocking the next 3 days' videos.`,
          studentId: student.id,
          trainerId: trainerUid || null,
          courseId: metrics.courseId,
          dayNumber: nextDayNum,
          taskType: "speaking_recording",
          status: "completed",
        }),
      });

      if (!res.ok) throw new Error("Failed to mark day task completed");
      await fetchAssignedStudentsProgress();
    } catch (err) {
      console.error("Failed to unlock next 3 days:", err);
      alert("Error marking day task as completed");
    } finally {
      setUnlockingKey(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loginId?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (globalCourseFilter !== "all") {
      const enrolledIds =
        s.enrolledCoursesDetails?.map((c) => c.id) || s.enrolledCourses || [];
      return enrolledIds.includes(globalCourseFilter);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Progress & Milestone Tracking
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitor course-specific module completion velocity, watched videos, task evaluations, and unlocked day milestones per enrolled course
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-[#2A0066]/10 text-[#2A0066] rounded-xl text-xs font-black self-start sm:self-auto">
          {filteredStudents.length} of {students.length} Allocated Students
        </span>
      </div>

      {/* Search & Global Course Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search student by name, email, or Login ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
          />
        </div>

        {allAvailableCourses.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
              <Filter size={12} /> Course Filter:
            </span>
            <button
              type="button"
              onClick={() => handleGlobalCourseFilterChange("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                globalCourseFilter === "all"
                  ? "bg-[#2A0066] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Courses
            </button>
            {allAvailableCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => handleGlobalCourseFilterChange(course.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  globalCourseFilter === course.id
                    ? "bg-[#2A0066] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {course.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">
              Loading student milestone trackers...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-xs font-bold">
            No students found matching your filter.
          </div>
        ) : (
          filteredStudents.map((s) => {
            const enrolledCourses: CourseDetail[] =
              s.enrolledCoursesDetails && s.enrolledCoursesDetails.length > 0
                ? s.enrolledCoursesDetails
                : (s.enrolledCourses || []).map((id) => ({
                    id,
                    title: "Enrolled Course",
                  }));

            const activeCourseId =
              selectedCourseByStudent[s.id] || enrolledCourses[0]?.id || "";
            const metrics = computeStudentCourseMetrics(s, activeCourseId);
            const actionKey = `${s.id}_${metrics.courseId}`;
            const isUnlocking = unlockingKey === actionKey;

            return (
              <div
                key={s.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Student Identity & Score Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] font-black text-sm flex items-center justify-center shrink-0">
                        {s.fullName?.charAt(0) || "S"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {s.fullName}
                          </h3>
                          {metrics.isPreviewAccount && (
                            <span className="px-2 py-0.5 bg-purple-100 text-[#2A0066] rounded-md text-[9px] font-black uppercase tracking-wider">
                              Preview
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-slate-400 font-bold">
                          {s.loginId || "---"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {metrics.averageScore !== null ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-lg border border-emerald-100">
                          {metrics.averageScore}% Avg Score
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-lg">
                          No Graded Tasks
                        </span>
                      )}
                      {enrolledCourses.length > 1 && (
                        <span className="text-[10px] font-black text-[#2A0066] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {enrolledCourses.length} Courses Enrolled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Per-Student Course Selector (when enrolled in 1 or multiple courses) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <BookOpen size={11} />
                        {enrolledCourses.length > 1
                          ? "Select Enrolled Course"
                          : "Enrolled Course"}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          metrics.isTrainerGuided
                            ? "bg-purple-50 text-[#2A0066] border border-purple-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {metrics.isTrainerGuided ? "Trainer Guided" : "Daily Drip (1/Day)"}
                      </span>
                    </div>

                    {enrolledCourses.length > 1 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {enrolledCourses.map((c) => {
                          const isSelected = c.id === metrics.courseId;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                setSelectedCourseByStudent((prev) => ({
                                  ...prev,
                                  [s.id]: c.id,
                                }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition text-left truncate max-w-full cursor-pointer border ${
                                isSelected
                                  ? "bg-[#2A0066] text-white border-[#2A0066] shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {c.title}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-800 truncate">
                        {metrics.courseTitle}
                      </div>
                    )}
                  </div>

                  {/* Course-Specific Progress Bars */}
                  <div className="space-y-3 pt-1">
                    {/* Overall Milestone & Unlock Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Course Milestone Progress</span>
                        <span className="text-[#2A0066] font-black">
                          {metrics.overallMilestoneRate}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2A0066] via-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${metrics.overallMilestoneRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>
                          {metrics.completedLessonsCount} / {metrics.totalLessonsCount} Lessons Completed
                        </span>
                        <span className="font-bold text-[#2A0066]">
                          {metrics.unlockedDaysCount} / {metrics.totalDays} Days Unlocked
                        </span>
                      </div>
                    </div>

                    {/* Detailed Course Breakdown Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400">
                          Watched
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-0.5">
                          {metrics.watchedModulesCount}/{metrics.totalModules}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Videos</p>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400">
                          Approved
                        </p>
                        <p className="text-xs font-black text-emerald-700 mt-0.5">
                          {metrics.approvedTasksCount}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          Day Tasks
                        </p>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400">
                          Pending
                        </p>
                        <p
                          className={`text-xs font-black mt-0.5 ${
                            metrics.pendingTasksCount > 0
                              ? "text-amber-600"
                              : "text-slate-900"
                          }`}
                        >
                          {metrics.pendingTasksCount}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          Reviews
                        </p>
                      </div>
                    </div>

                    {/* Enrollment & Activity Metadata for Selected Course */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1">
                      <span>
                        Started:{" "}
                        <strong className="text-slate-600">
                          {metrics.startedAt
                            ? new Date(metrics.startedAt).toLocaleDateString()
                            : "Not started"}
                        </strong>
                      </span>
                      {metrics.needsCorrectionTasksCount > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {metrics.needsCorrectionTasksCount} Needs Correction
                        </span>
                      ) : (
                        <span>
                          Account:{" "}
                          <strong
                            className={
                              s.isBlocked
                                ? "text-rose-600"
                                : "text-emerald-600 capitalize"
                            }
                          >
                            {s.isBlocked ? "Frozen" : s.accountStatus || "Active"}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Action Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  {metrics.isPreviewAccount ? (
                    <div className="w-full py-2.5 px-3 bg-purple-50 text-[#2A0066] border border-purple-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>Trainer Preview — All Videos Unlocked</span>
                    </div>
                  ) : metrics.isTrainerGuided ? (
                    <button
                      type="button"
                      disabled={isUnlocking || !metrics.courseId}
                      onClick={() => handleMarkDayTaskCompleted(s, metrics)}
                      className="w-full py-2.5 px-3 bg-[#2A0066] hover:bg-[#3d0099] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isUnlocking ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          <span>Unlocking Next 3 Days...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>
                            Mark Day {metrics.approvedTasksCount + 1} Task Completed (+3 Days)
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                      <Clock size={14} className="text-slate-500" />
                      <span>
                        Auto-Releasing 1 Video/Day ({metrics.unlockedVideosCount} Unlocked)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
