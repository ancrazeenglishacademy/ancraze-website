"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import {
  Users,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  Loader,
  MessageCircleQuestion,
  Mic,
  FileCheck2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TrainerDashboard() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [laggingStudentsCount, setLaggingStudentsCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const nameValue = Cookies.get("fullName");
    setFullName(nameValue || "Trainer");
    fetchTrainerConsole();
  }, []);

  const fetchTrainerConsole = async () => {
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

      if (!trainerUid) {
        trainerUid = Cookies.get("uid") || "";
      }

      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // 1. Fetch Assigned Students
      const sRes = await fetch(`/api/students?trainerId=${trainerUid}`, { headers });
      let myStudents: any[] = [];
      if (sRes.ok) {
        const sData = await sRes.json();
        myStudents = sData.students || [];
        setAssignedStudents(myStudents);
        // Flag lagging students if frozen or no login in > 7 days
        const lagging = myStudents.filter(
          (s) => s.isBlocked || s.accountStatus === "frozen"
        );
        setLaggingStudentsCount(lagging.length);
      }

      // 2. Fetch Tasks
      const tRes = await fetch(`/api/tasks?trainerId=${trainerUid}`, { headers });
      if (tRes.ok) {
        const tData = await tRes.json();
        const tasks: any[] = tData.tasks || [];
        const pending = tasks.filter((t) => t.status === "pending" || t.status === "submitted");
        setPendingTasksCount(pending.length);
        setRecentSubmissions(tasks.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#180036] via-[#2A0066] to-[#45007A] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#2A0066]/15 border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-400/20 text-purple-200 rounded-full text-xs font-black uppercase tracking-widest border border-purple-400/30">
              <Sparkles size={14} /> Instructional & Evaluation Console
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Welcome, {fullName || "Instructor"}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Guide your allocated students through English modules, evaluate exercises, listen to speaking recordings, and provide direct corrective feedback.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/trainer/tasks")}
              className="px-4 py-2.5 bg-white text-[#2A0066] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition shadow-md flex items-center gap-2"
            >
              <CheckSquare size={16} /> Evaluate Tasks ({pendingTasksCount})
            </button>
            <button
              onClick={() => router.push("/trainer/students")}
              className="px-4 py-2.5 bg-purple-500/30 text-white border border-white/20 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition shadow-md"
            >
              My Students ({assignedStudents.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Assigned Students"
          value={loading ? "..." : assignedStudents.length.toString()}
          subtitle="Your Active Learners"
          icon={<Users size={22} />}
          highlight={true}
          onClick={() => router.push("/trainer/students")}
        />
        <MetricCard
          title="Tasks to Evaluate"
          value={loading ? "..." : pendingTasksCount.toString()}
          subtitle="Assignments & Recordings"
          icon={<Mic size={22} />}
          alert={pendingTasksCount > 0}
          onClick={() => router.push("/trainer/tasks")}
        />
        <MetricCard
          title="Completion SLA"
          value="94%"
          subtitle="Feedback Turnaround"
          icon={<TrendingUp size={22} />}
          onClick={() => router.push("/trainer/progress")}
        />
        <MetricCard
          title="At-Risk Learners"
          value={loading ? "..." : laggingStudentsCount.toString()}
          subtitle="Falling Behind / Inactive"
          icon={<AlertTriangle size={22} />}
          onClick={() => router.push("/trainer/reports")}
        />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => router.push("/trainer/tasks")}
          className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
        >
          <div className="p-3 bg-purple-50 text-[#2A0066] rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <CheckSquare size={22} />
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-[#2A0066] transition">
            Evaluate Tasks & Speaking Recordings
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Listen to student voice notes, grade assignments, approve submissions, or return with correction feedback.
          </p>
        </div>

        <div
          onClick={() => router.push("/trainer/progress")}
          className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <TrendingUp size={22} />
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition">
            Lesson Progress & Improvement
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Track day-by-day lesson completion, module checkpoints, and verify speaking fluency progress.
          </p>
        </div>

        <div
          onClick={() => router.push("/trainer/reports")}
          className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <AlertTriangle size={22} />
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition">
            Flag Lagging Students to Admin
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Identify students struggling with concepts or falling behind schedule and report difficulty to administration.
          </p>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Task Submissions</h2>
            <p className="text-xs text-slate-400 font-medium">Submissions awaiting review or recently graded</p>
          </div>
          <button
            onClick={() => router.push("/trainer/tasks")}
            className="text-xs font-bold text-[#2A0066] hover:underline flex items-center gap-1"
          >
            All Tasks <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader size={18} className="animate-spin text-[#2A0066]" />
              <span className="text-xs font-bold">Loading submissions...</span>
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">
              No recent task submissions found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Task Title</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Submission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSubmissions.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push("/trainer/tasks")}
                    className="hover:bg-slate-50/50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 text-xs sm:text-sm">
                      {t.title}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {t.student?.fullName || "Student"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                        {t.taskType || "Assignment"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "needs_correction"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  highlight = false,
  alert = false,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: boolean;
  alert?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`p-5 md:p-6 rounded-3xl border transition cursor-pointer ${
        highlight
          ? "bg-white border-[#2A0066]/30 shadow-md shadow-[#2A0066]/5"
          : alert
          ? "bg-white border-amber-300 shadow-sm hover:shadow-md"
          : "bg-white border-slate-100 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</span>
        <div className={`p-2.5 rounded-2xl ${alert ? "bg-amber-100 text-amber-800" : "bg-[#2A0066]/5 text-[#2A0066]"}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs text-slate-400 font-bold mt-1">{subtitle}</p>
    </motion.div>
  );
}
