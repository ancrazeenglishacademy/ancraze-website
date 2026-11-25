"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  User,
  Loader,
  Check,
  Award,
  Sparkles,
  Search,
  Layers,
  Image as ImageIcon,
  Unlock,
} from "lucide-react";
import Cookies from "js-cookie";

interface CourseDayItem {
  id: string;
  title: string;
  order?: number;
  dayNumber?: number;
  taskTitle?: string;
  taskDescription?: string;
  taskType?: "assignment" | "exercise" | "quiz" | "speaking_recording";
  taskImageUrl?: string;
}

interface EnrolledCourseDetail {
  id: string;
  title: string;
  isTrainerGuided?: boolean;
  daysCount?: number;
  modulesCount?: number;
  days?: CourseDayItem[];
}

interface StudentRecord {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  enrolledCourses?: string[];
  enrolledCoursesDetails?: EnrolledCourseDetail[];
  courseProgress?: Record<string, any>;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  taskType?: "assignment" | "exercise" | "quiz" | "speaking_recording";
  studentId: string;
  student?: {
    id: string;
    fullName: string;
    email: string;
    loginId?: string;
  };
  status: "pending" | "submitted" | "approved" | "needs_correction" | "completed";
  taskImageUrl?: string;
  courseId?: string;
  dayId?: string;
  dayNumber?: number;
  createdAt: string;
  evaluatedAt?: string;
}

export default function TrainerTasks() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selection state: Student -> Course -> Day
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [courseDaysMap, setCourseDaysMap] = useState<Record<string, CourseDayItem[]>>({});
  const [loadingDays, setLoadingDays] = useState(false);

  // Search filter for history
  const [searchQuery, setSearchQuery] = useState("");

  const trainerId = useMemo(() => {
    const userData = Cookies.get("userData");
    if (userData) {
      try {
        return JSON.parse(userData).uid || "";
      } catch {
        // ignore
      }
    }
    return Cookies.get("uid") || "";
  }, []);

  useEffect(() => {
    fetchData();
  }, [trainerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      const [studentsRes, tasksRes] = await Promise.all([
        fetch(`/api/students?trainerId=${trainerId}`, { headers }),
        fetch(`/api/tasks?trainerId=${trainerId}`, { headers }),
      ]);

      const studentsData = studentsRes.ok ? await studentsRes.json() : { students: [] };
      const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };

      const fetchedStudents: StudentRecord[] = studentsData.students || [];
      const fetchedTasks: TaskItem[] = tasksData.tasks || [];

      setStudents(fetchedStudents);
      setTasks(fetchedTasks);

      // Populate courseDaysMap from enrolledCoursesDetails
      const initialDaysMap: Record<string, CourseDayItem[]> = {};
      fetchedStudents.forEach((s) => {
        (s.enrolledCoursesDetails || []).forEach((c) => {
          if (c.id && Array.isArray(c.days) && c.days.length > 0) {
            initialDaysMap[c.id] = c.days;
          }
        });
      });
      setCourseDaysMap((prev) => ({ ...prev, ...initialDaysMap }));

      // Default select first student if none selected
      if (fetchedStudents.length > 0 && !selectedStudentId) {
        const firstStudent = fetchedStudents[0];
        const firstCourseId =
          firstStudent.enrolledCoursesDetails?.[0]?.id ||
          firstStudent.enrolledCourses?.[0] ||
          "";
        setSelectedStudentId(firstStudent.id);
        setSelectedCourseId(firstCourseId);
      }
    } catch (err) {
      console.error("Error loading trainer tasks data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch days for selectedCourseId if not already cached
  useEffect(() => {
    const ensureDaysLoaded = async () => {
      if (!selectedCourseId) return;
      if (courseDaysMap[selectedCourseId] && courseDaysMap[selectedCourseId].length > 0) {
        return;
      }
      try {
        setLoadingDays(true);
        const res = await fetch(`/api/days?courseId=${selectedCourseId}`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const rawDays: any[] = data.days || [];
          const normalized: CourseDayItem[] = rawDays.map((d, idx) => ({
            id: d.id,
            title: d.title || `Day ${idx + 1}`,
            order: d.order !== undefined ? d.order : idx,
            dayNumber: idx + 1,
            taskTitle: d.taskTitle || d.task?.title || "",
            taskDescription: d.taskDescription || d.task?.description || "",
            taskType: d.taskType || d.task?.type || "speaking_recording",
            taskImageUrl: d.taskImageUrl || d.taskImage || d.task?.imageUrl || "",
          }));
          setCourseDaysMap((prev) => ({
            ...prev,
            [selectedCourseId]: normalized,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch days for course:", err);
      } finally {
        setLoadingDays(false);
      }
    };
    ensureDaysLoaded();
  }, [selectedCourseId]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const studentCourses: EnrolledCourseDetail[] = useMemo(() => {
    if (!selectedStudent) return [];
    if (
      selectedStudent.enrolledCoursesDetails &&
      selectedStudent.enrolledCoursesDetails.length > 0
    ) {
      return selectedStudent.enrolledCoursesDetails;
    }
    return (selectedStudent.enrolledCourses || []).map((id) => ({
      id,
      title: "Enrolled Course",
    }));
  }, [selectedStudent]);

  const selectedCourse = useMemo(
    () =>
      studentCourses.find((c) => c.id === selectedCourseId) ||
      studentCourses[0] ||
      null,
    [studentCourses, selectedCourseId]
  );

  const activeCourseDays: CourseDayItem[] = useMemo(() => {
    if (!selectedCourse) return [];
    return (
      courseDaysMap[selectedCourse.id] ||
      selectedCourse.days ||
      []
    );
  }, [selectedCourse, courseDaysMap]);

  // Determine which days are already completed by the selected student in the selected course
  const completedDayIdsSet = useMemo(() => {
    const set = new Set<string>();
    if (!selectedStudent || !selectedCourse) return set;

    const prog = selectedStudent.courseProgress?.[selectedCourse.id];
    if (Array.isArray(prog?.completedDayIds)) {
      prog.completedDayIds.forEach((id: string) => set.add(id));
    }

    // Also check completed/approved task documents for this student & course
    tasks.forEach((t) => {
      const isDone = t.status === "completed" || t.status === "approved";
      const matchesStudent = t.studentId === selectedStudent.id;
      const matchesCourse = !t.courseId || t.courseId === selectedCourse.id;
      if (isDone && matchesStudent && matchesCourse) {
        if (t.dayId) {
          set.add(t.dayId);
        } else if (t.dayNumber && activeCourseDays[t.dayNumber - 1]) {
          set.add(activeCourseDays[t.dayNumber - 1].id);
        }
      }
    });

    return set;
  }, [selectedStudent, selectedCourse, tasks, activeCourseDays]);

  // Auto-select the first uncompleted day (or first day) whenever student/course/days change
  useEffect(() => {
    if (activeCourseDays.length === 0) {
      setSelectedDayId("");
      return;
    }
    const currentStillValid = activeCourseDays.some((d) => d.id === selectedDayId);
    if (!currentStillValid) {
      const nextUncompleted = activeCourseDays.find(
        (d) => !completedDayIdsSet.has(d.id)
      );
      setSelectedDayId(nextUncompleted ? nextUncompleted.id : activeCourseDays[0].id);
    }
  }, [activeCourseDays, selectedStudentId, selectedCourseId]);

  const selectedDay = useMemo(
    () => activeCourseDays.find((d) => d.id === selectedDayId) || null,
    [activeCourseDays, selectedDayId]
  );

  const selectedDayNumber = useMemo(() => {
    if (!selectedDay) return 1;
    const idx = activeCourseDays.findIndex((d) => d.id === selectedDay.id);
    return idx !== -1 ? idx + 1 : selectedDay.dayNumber || 1;
  }, [selectedDay, activeCourseDays]);

  const isSelectedDayCompleted = useMemo(
    () => (selectedDay ? completedDayIdsSet.has(selectedDay.id) : false),
    [selectedDay, completedDayIdsSet]
  );

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    const st = students.find((s) => s.id === studentId);
    const firstCourseId =
      st?.enrolledCoursesDetails?.[0]?.id || st?.enrolledCourses?.[0] || "";
    setSelectedCourseId(firstCourseId);
    setSelectedDayId("");
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedDayId("");
  };

  const handleMarkDayTaskCompleted = async (dayToComplete?: CourseDayItem) => {
    const targetDay = dayToComplete || selectedDay;
    if (!selectedStudent || !selectedCourse || !targetDay) {
      alert("Please select a student, course, and day.");
      return;
    }

    const dayIdx = activeCourseDays.findIndex((d) => d.id === targetDay.id);
    const dayNum = dayIdx !== -1 ? dayIdx + 1 : targetDay.dayNumber || 1;
    const displayTaskTitle =
      targetDay.taskTitle?.trim() ||
      `${targetDay.title || `Day ${dayNum}`} Task`;

    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          title: `${selectedCourse.title} — ${targetDay.title || `Day ${dayNum}`}: ${displayTaskTitle}`,
          description:
            targetDay.taskDescription ||
            `Trainer marked ${targetDay.title || `Day ${dayNum}`} task as completed.`,
          taskType: targetDay.taskType || "speaking_recording",
          taskImageUrl: targetDay.taskImageUrl || null,
          studentId: selectedStudent.id,
          trainerId: trainerId || null,
          courseId: selectedCourse.id,
          dayId: targetDay.id,
          dayNumber: dayNum,
          status: "completed",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to mark day task as completed");
      }

      await fetchData();

      // Advance selection to the next uncompleted day automatically
      const nextUncompleted = activeCourseDays.find(
        (d) => d.id !== targetDay.id && !completedDayIdsSet.has(d.id)
      );
      if (nextUncompleted) {
        setSelectedDayId(nextUncompleted.id);
      }
    } catch (err: any) {
      alert(err.message || "Error marking day task as completed");
    } finally {
      setSubmitting(false);
    }
  };

  const completedTasksHistory = useMemo(() => {
    return tasks
      .filter((t) => t.status === "completed" || t.status === "approved")
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.title?.toLowerCase().includes(q) ||
          t.student?.fullName?.toLowerCase().includes(q) ||
          t.student?.loginId?.toLowerCase().includes(q)
        );
      });
  }, [tasks, searchQuery]);

  const unlockedDaysForSelectedCourse = useMemo(() => {
    if (!selectedStudent || !selectedCourse) return 1;
    const prog = selectedStudent.courseProgress?.[selectedCourse.id];
    const completedCount = Math.max(
      Number(prog?.completedTasksCount || 0),
      completedDayIdsSet.size
    );
    return Math.max(
      1,
      Number(prog?.unlockedDaysCount || 0),
      1 + completedCount * 3
    );
  }, [selectedStudent, selectedCourse, completedDayIdsSet]);

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Task Evaluation & Spoken Audio Review
          </h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium">
            Select a student and their course day task to mark it as completed and automatically unlock the next 3 days&apos; videos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3.5 py-2 bg-[#2A0066]/10 text-[#2A0066] rounded-xl text-xs font-black">
            {completedTasksHistory.length} Day Tasks Completed
          </span>
        </div>
      </div>

      {/* Main Day-Based Task Completion Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Select Student, Course & Day Task */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-md shadow-[#2A0066]/20">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Mark Day Task as Completed
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  No file upload required — select the student and day task below
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader size={24} className="animate-spin text-[#2A0066]" />
              <p className="text-xs font-bold text-slate-400">
                Loading students and course day tasks...
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              No students are currently allocated to your roster.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Step 1: Select Student */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <User size={13} className="text-[#2A0066]" /> 1. Select Allocated Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#2A0066] focus:bg-white transition cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.loginId || s.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Enrolled Course (shown if enrolled in multiple or 1 course) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#2A0066]" /> 2.{" "}
                    {studentCourses.length > 1
                      ? "Select Enrolled Course"
                      : "Enrolled Course"}
                  </label>
                  {selectedCourse && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-[#2A0066] border border-purple-100">
                      {unlockedDaysForSelectedCourse} Days Unlocked
                    </span>
                  )}
                </div>

                {studentCourses.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                    This student is not enrolled in any course yet.
                  </div>
                ) : studentCourses.length > 1 ? (
                  <div className="flex flex-wrap gap-2">
                    {studentCourses.map((course) => {
                      const active = course.id === selectedCourse?.id;
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => handleCourseChange(course.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            active
                              ? "bg-[#2A0066] text-white border-[#2A0066] shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {course.title}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800">
                    {selectedCourse?.title}
                  </div>
                )}
              </div>

              {/* Step 3: Select Day of the Task */}
              {selectedCourse && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#2A0066]" /> 3. Select Day of the Task
                    </label>
                    <span className="text-[11px] font-bold text-emerald-600">
                      {completedDayIdsSet.size} / {activeCourseDays.length} Days Completed
                    </span>
                  </div>

                  {loadingDays ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-400 flex items-center gap-2">
                      <Loader size={14} className="animate-spin text-[#2A0066]" />
                      Loading days for {selectedCourse.title}...
                    </div>
                  ) : activeCourseDays.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500">
                      No days have been created for this course yet. Create days and day tasks in the Course Curriculum manager.
                    </div>
                  ) : (
                    <select
                      value={selectedDayId}
                      onChange={(e) => setSelectedDayId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#2A0066] focus:bg-white transition cursor-pointer"
                    >
                      {activeCourseDays.map((day, idx) => {
                        const isDone = completedDayIdsSet.has(day.id);
                        const dayLabel = day.title || `Day ${idx + 1}`;
                        const taskLabel = day.taskTitle
                          ? ` — ${day.taskTitle}`
                          : "";
                        return (
                          <option key={day.id} value={day.id}>
                            {isDone ? "✓ [Completed] " : ""}
                            {dayLabel}
                            {taskLabel}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}

              {/* Selected Day Task Preview Card */}
              {selectedDay && (
                <div
                  className={`p-5 rounded-2xl border space-y-3 transition ${
                    isSelectedDayCompleted
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-purple-50/40 border-purple-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#2A0066]">
                        {selectedDay.title || `Day ${selectedDayNumber}`} Task Details
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                        {selectedDay.taskTitle ||
                          `${selectedDay.title || `Day ${selectedDayNumber}`} Speaking / Practice Task`}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        isSelectedDayCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isSelectedDayCompleted ? "Completed" : "Pending Completion"}
                    </span>
                  </div>

                  {selectedDay.taskDescription && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {selectedDay.taskDescription}
                    </p>
                  )}

                  {selectedDay.taskImageUrl && (
                    <div className="pt-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <ImageIcon size={12} /> Day Task Image
                      </p>
                      <img
                        src={selectedDay.taskImageUrl}
                        alt={selectedDay.taskTitle || selectedDay.title}
                        className="max-h-56 rounded-xl border border-slate-200 object-contain bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit / Mark Completed Button */}
              {selectedDay && (
                <button
                  type="button"
                  disabled={submitting || isSelectedDayCompleted}
                  onClick={() => handleMarkDayTaskCompleted()}
                  className={`w-full py-4 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    isSelectedDayCompleted
                      ? "bg-emerald-600 text-white opacity-90 cursor-default shadow-emerald-600/15"
                      : "bg-[#2A0066] hover:bg-[#3D0099] text-white shadow-[#2A0066]/20 disabled:opacity-50"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      <span>Marking Day Task Completed...</span>
                    </>
                  ) : isSelectedDayCompleted ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>
                        {selectedDay.title || `Day ${selectedDayNumber}`} Task Already Completed
                      </span>
                    </>
                  ) : (
                    <>
                      <Unlock size={16} />
                      <span>
                        Mark {selectedDay.title || `Day ${selectedDayNumber}`} Task as Completed (+3 Days Videos)
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: All Days Checklist for Selected Student & Course */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Course Day Tasks Checklist
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {selectedStudent
                  ? `${selectedStudent.fullName} • ${selectedCourse?.title || "No Course"}`
                  : "Select a student to view their day tasks"}
              </p>
            </div>
            {activeCourseDays.length > 0 && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-black border border-emerald-100">
                {completedDayIdsSet.size}/{activeCourseDays.length} Done
              </span>
            )}
          </div>

          {activeCourseDays.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              No day tasks configured for this course yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {activeCourseDays.map((day, idx) => {
                const isDone = completedDayIdsSet.has(day.id);
                const isSelected = day.id === selectedDayId;
                const dayLabel = day.title || `Day ${idx + 1}`;

                return (
                  <div
                    key={day.id}
                    onClick={() => setSelectedDayId(day.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-[#2A0066] bg-purple-50/50 shadow-xs"
                        : isDone
                        ? "border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60"
                        : "border-slate-100 bg-slate-50/70 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isSelected
                            ? "bg-[#2A0066] text-white"
                            : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        {isDone ? <Check size={14} /> : idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {dayLabel}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {day.taskTitle || "Day Speaking / Practice Task"}
                        </p>
                      </div>
                    </div>

                    {isDone ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0">
                        Completed
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayId(day.id);
                          handleMarkDayTaskCompleted(day);
                        }}
                        className="px-3 py-1.5 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Completed Day Tasks Log */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Completed Day Tasks Log
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              History of day tasks marked as completed for your allocated students
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter by student or day..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] text-slate-900"
            />
          </div>
        </div>

        {completedTasksHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            No completed day tasks recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {completedTasksHistory.map((task) => (
              <div
                key={task.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Student:{" "}
                      <span className="font-bold text-slate-800">
                        {task.student?.fullName || "Student"}
                      </span>{" "}
                      {task.student?.loginId && (
                        <span className="font-mono text-[11px] text-slate-400 font-bold">
                          ({task.student.loginId})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    Completed (+3 Days Unlocked)
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(task.evaluatedAt || task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
