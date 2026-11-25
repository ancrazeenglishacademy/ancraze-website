"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Calendar,
  BookOpen,
  User,
  Loader,
  Check,
  Search,
  Image as ImageIcon,
  Unlock,
  ArrowLeft,
  ChevronRight,
  Users,
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
  isTrainerPreviewAccount?: boolean;
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

  // Selected student (null = show assigned students grid; set = show task approval options for that student)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [courseDaysMap, setCourseDaysMap] = useState<Record<string, CourseDayItem[]>>({});
  const [loadingDays, setLoadingDays] = useState(false);

  // Search filters
  const [studentSearch, setStudentSearch] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

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
    () => (selectedStudentId ? students.find((s) => s.id === selectedStudentId) || null : null),
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
    return courseDaysMap[selectedCourse.id] || selectedCourse.days || [];
  }, [selectedCourse, courseDaysMap]);

  // Helper to get completed day IDs for any student + course
  const getCompletedDayIdsForCourse = (
    student: StudentRecord,
    courseId: string,
    daysList: CourseDayItem[]
  ) => {
    const set = new Set<string>();
    const prog = student.courseProgress?.[courseId];
    if (Array.isArray(prog?.completedDayIds)) {
      prog.completedDayIds.forEach((id: string) => set.add(id));
    }

    tasks.forEach((t) => {
      const isDone = t.status === "completed" || t.status === "approved";
      const matchesStudent = t.studentId === student.id;
      const matchesCourse = !t.courseId || t.courseId === courseId;
      if (isDone && matchesStudent && matchesCourse) {
        if (t.dayId) {
          set.add(t.dayId);
        } else if (t.dayNumber && daysList[t.dayNumber - 1]) {
          set.add(daysList[t.dayNumber - 1].id);
        }
      }
    });

    return set;
  };

  const completedDayIdsSet = useMemo(() => {
    if (!selectedStudent || !selectedCourse) return new Set<string>();
    return getCompletedDayIdsForCourse(selectedStudent, selectedCourse.id, activeCourseDays);
  }, [selectedStudent, selectedCourse, tasks, activeCourseDays]);

  // Auto-select the first uncompleted day whenever student/course/days change
  useEffect(() => {
    if (!selectedStudentId || activeCourseDays.length === 0) {
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

  const handleOpenStudent = (student: StudentRecord) => {
    const firstCourseId =
      student.enrolledCoursesDetails?.[0]?.id || student.enrolledCourses?.[0] || "";
    setSelectedStudentId(student.id);
    setSelectedCourseId(firstCourseId);
    setSelectedDayId("");
  };

  const handleBackToStudents = () => {
    setSelectedStudentId(null);
    setSelectedCourseId("");
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
      targetDay.taskTitle?.trim() || `${targetDay.title || `Day ${dayNum}`} Task`;

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

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.loginId?.toLowerCase().includes(q) ||
        (s.enrolledCoursesDetails || []).some((c) =>
          c.title?.toLowerCase().includes(q)
        )
    );
  }, [students, studentSearch]);

  const completedTasksHistory = useMemo(() => {
    return tasks
      .filter((t) => t.status === "completed" || t.status === "approved")
      .filter((t) => {
        if (selectedStudent && t.studentId !== selectedStudent.id) {
          return false;
        }
        if (!logSearchQuery.trim()) return true;
        const q = logSearchQuery.toLowerCase();
        return (
          t.title?.toLowerCase().includes(q) ||
          t.student?.fullName?.toLowerCase().includes(q) ||
          t.student?.loginId?.toLowerCase().includes(q)
        );
      });
  }, [tasks, logSearchQuery, selectedStudent]);

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
            Day Task Completion & Approval
          </h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium">
            {selectedStudent
              ? `Managing day-based task approvals for ${selectedStudent.fullName}.`
              : "Click on any assigned student below to view their courses and mark day tasks as completed."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {selectedStudent ? (
            <button
              type="button"
              onClick={handleBackToStudents}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>All Assigned Students</span>
            </button>
          ) : (
            <span className="px-3.5 py-2 bg-[#2A0066]/10 text-[#2A0066] rounded-xl text-xs font-black">
              {students.length} Assigned Student{students.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* VIEW 1: ASSIGNED STUDENTS CARDS GRID (DEFAULT)                   */}
      {/* ================================================================ */}
      {!selectedStudent ? (
        <div className="space-y-5">
          {/* Search Assigned Students */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search student by name, Login ID, or course..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
              />
            </div>

            <span className="text-xs font-bold text-slate-400">
              Showing {filteredStudents.length} of {students.length} students
            </span>
          </div>

          {/* Students Cards Grid */}
          {loading ? (
            <div className="py-20 bg-white rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center gap-2">
              <Loader size={24} className="animate-spin text-[#2A0066]" />
              <p className="text-xs font-bold text-slate-400">
                Loading your assigned students...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 bg-white rounded-3xl border border-slate-100 text-center space-y-2">
              <Users size={36} className="text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-400">
                {students.length === 0
                  ? "No students are currently allocated to your roster."
                  : "No students match your search query."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStudents.map((student) => {
                const enrolledList =
                  student.enrolledCoursesDetails &&
                  student.enrolledCoursesDetails.length > 0
                    ? student.enrolledCoursesDetails
                    : [];

                const totalCompletedForStudent = enrolledList.reduce((acc, c) => {
                  const daysList = courseDaysMap[c.id] || c.days || [];
                  const doneSet = getCompletedDayIdsForCourse(student, c.id, daysList);
                  const progDone = Number(
                    student.courseProgress?.[c.id]?.completedTasksCount || 0
                  );
                  return acc + Math.max(doneSet.size, progDone);
                }, 0);

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleOpenStudent(student)}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#2A0066]/30 transition-all text-left flex flex-col justify-between gap-5 group cursor-pointer"
                  >
                    <div className="space-y-4 w-full">
                      {/* Student Identity */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] group-hover:bg-[#2A0066] group-hover:text-white transition-colors font-black text-base flex items-center justify-center shrink-0">
                            {student.fullName?.charAt(0).toUpperCase() || "S"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-black text-slate-900 text-sm sm:text-base truncate group-hover:text-[#2A0066] transition-colors">
                                {student.fullName}
                              </h3>
                              {student.isTrainerPreviewAccount && (
                                <span className="px-2 py-0.5 bg-purple-100 text-[#2A0066] rounded-md text-[9px] font-black uppercase">
                                  Preview
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-[11px] text-slate-400 font-bold">
                              {student.loginId || "---"}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black border border-emerald-100 shrink-0">
                          {totalCompletedForStudent} Done
                        </span>
                      </div>

                      {/* Enrolled Courses Summary */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Enrolled Courses ({enrolledList.length})
                        </p>
                        {enrolledList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {enrolledList.map((c) => {
                              const daysList = courseDaysMap[c.id] || c.days || [];
                              const doneCount = Math.max(
                                getCompletedDayIdsForCourse(student, c.id, daysList).size,
                                Number(
                                  student.courseProgress?.[c.id]?.completedTasksCount || 0
                                )
                              );
                              const totalDays = c.daysCount || daysList.length || 0;
                              return (
                                <span
                                  key={c.id}
                                  className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                                >
                                  <span className="truncate max-w-[160px]">{c.title}</span>
                                  <span className="text-[#2A0066] font-black">
                                    {doneCount}
                                    {totalDays ? `/${totalDays}` : ""}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            No courses assigned yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Action CTA */}
                    <div className="w-full pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#2A0066]">
                      <span>Open Task Approval Options</span>
                      <div className="w-7 h-7 rounded-xl bg-purple-50 group-hover:bg-[#2A0066] group-hover:text-white flex items-center justify-center transition-colors">
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================================================================ */
        /* VIEW 2: SELECTED STUDENT'S TASK APPROVAL PANEL                   */
        /* ================================================================ */
        <div className="space-y-6">
          {/* Selected Student Banner */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#2A0066] text-white font-black text-lg flex items-center justify-center shadow-md shadow-[#2A0066]/20 shrink-0">
                {selectedStudent.fullName?.charAt(0).toUpperCase() || "S"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900">
                    {selectedStudent.fullName}
                  </h2>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {selectedStudent.loginId || "---"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {selectedStudent.email}
                </p>
              </div>
            </div>

            {selectedCourse && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#2A0066] border border-purple-100 text-xs font-black">
                  {unlockedDaysForSelectedCourse} Days Unlocked
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black">
                  {completedDayIdsSet.size} / {activeCourseDays.length} Days Completed
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Course & Day Task Approval Controls */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="h-10 w-10 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-md shadow-[#2A0066]/20">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Mark Day Task as Completed
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Select the course and day below to approve and unlock the next 3 days&apos; videos
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Step 1: Select Enrolled Course */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <BookOpen size={13} className="text-[#2A0066]" /> 1.{" "}
                    {studentCourses.length > 1
                      ? "Select Enrolled Course"
                      : "Enrolled Course"}
                  </label>

                  {studentCourses.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                      This student is not enrolled in any course yet.
                    </div>
                  ) : studentCourses.length > 5 ? (
                    <select
                      value={selectedCourse?.id || ""}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#2A0066] cursor-pointer"
                    >
                      {studentCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
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

                {/* Step 2: Select Day of the Task */}
                {selectedCourse && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#2A0066]" /> 2. Select Day of the Task
                      </label>
                    </div>

                    {loadingDays ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-400 flex items-center gap-2">
                        <Loader size={14} className="animate-spin text-[#2A0066]" />
                        Loading days for {selectedCourse.title}...
                      </div>
                    ) : activeCourseDays.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500">
                        No days have been created for this course yet.
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
                          const taskLabel = day.taskTitle ? ` — ${day.taskTitle}` : "";
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
                        <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                          {selectedDay.taskTitle ||
                            `${selectedDay.title || `Day ${selectedDayNumber}`} Speaking / Practice Task`}
                        </h4>
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

                {/* Mark Completed Button */}
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
            </div>

            {/* Right Column: All Days Checklist for Selected Student & Course */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Course Day Tasks Checklist
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {selectedCourse?.title || "No Course Selected"}
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
        </div>
      )}

      {/* Completed Day Tasks Log */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {selectedStudent
                ? `${selectedStudent.fullName}'s Completed Day Tasks`
                : "Completed Day Tasks Log"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {selectedStudent
                ? "History of day tasks marked as completed for this student"
                : "History of day tasks marked as completed across all your allocated students"}
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
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
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
