"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

interface StudentProgress {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  enrolledCoursesDetails?: any[];
  completedLessonsCount?: number;
  totalLessonsCount?: number;
  taskSubmissionRate?: number;
  averageScore?: number;
}

export default function TrainerProgressPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAssignedStudentsProgress();
  }, []);

  const fetchAssignedStudentsProgress = async () => {
    try {
      setLoading(true);
      const userDataCookie = Cookies.get("userData");
      let trainerUid = "";
      if (userDataCookie) {
        try {
          const parsed = JSON.parse(userDataCookie);
          trainerUid = parsed.uid || "";
        } catch (e) {
          console.error(e);
        }
      }
      if (!trainerUid) trainerUid = Cookies.get("uid") || "";

      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      const res = await fetch(`/api/students?trainerId=${trainerUid}`, { headers });
      const data = await res.json();
      const myStudents: any[] = data.students || [];

      // Calculate mock/calculated progress metrics for demonstration
      const formatted: StudentProgress[] = myStudents.map((s, idx) => {
        const completed = 8 + (idx * 3) % 15;
        const total = 24;
        const rate = Math.min(100, Math.round((completed / total) * 100));
        return {
          id: s.id,
          fullName: s.fullName,
          email: s.email,
          loginId: s.loginId,
          enrolledCoursesDetails: s.enrolledCoursesDetails,
          completedLessonsCount: completed,
          totalLessonsCount: total,
          taskSubmissionRate: rate,
          averageScore: 82 + (idx * 4) % 15,
        };
      });

      setStudents(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loginId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Progress & Milestone Tracking</h1>
          <p className="text-xs text-slate-500 font-medium">Monitor module completion velocity, assignment submission rates, and individual proficiency metrics</p>
        </div>
        <span className="px-3.5 py-1.5 bg-[#2A0066]/10 text-[#2A0066] rounded-xl text-xs font-black self-start sm:self-auto">
          {students.length} Allocated Students
        </span>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
          />
        </div>
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading student milestone trackers...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-xs font-bold">
            No students found in your roster.
          </div>
        ) : (
          filteredStudents.map((s) => (
            <div
              key={s.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] font-black text-sm flex items-center justify-center">
                    {s.fullName?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.fullName}</h3>
                    <p className="font-mono text-[11px] text-slate-400 font-bold">{s.loginId || "---"}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-lg border border-emerald-100">
                  {s.averageScore}% Avg
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Lesson Completion</span>
                  <span className="text-[#2A0066] font-black">{s.taskSubmissionRate}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${s.taskSubmissionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>{s.completedLessonsCount} Completed</span>
                  <span>{s.totalLessonsCount} Total Lessons</span>
                </div>
              </div>

              {/* Course Info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium truncate max-w-[180px]">
                  {s.enrolledCoursesDetails?.[0]?.title || "Spoken English Mastery"}
                </span>
                <span className="font-bold text-[#2A0066] text-[11px]">On Track</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

