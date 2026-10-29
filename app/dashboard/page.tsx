"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Activity,
  Megaphone,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Loader,
  AlertCircle,
  Smartphone,
  Key,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [totalStudents, setTotalStudents] = useState(0);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [activeDeviceSessions, setActiveDeviceSessions] = useState(0);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const nameValue = Cookies.get("fullName");
    setFullName(nameValue || "Admin");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // 1. Fetch Students
      const sRes = await fetch("/api/students?role=student", { headers });
      if (sRes.ok) {
        const sData = await sRes.json();
        const students: any[] = sData.students || [];
        setTotalStudents(students.length);
        setUnassignedCount(students.filter((s) => !s.trainerId).length);
        setActiveDeviceSessions(students.filter((s) => !!s.deviceId).length);
        setRecentStudents(students.slice(0, 6));
      }

      // 2. Fetch Requests
      const rRes = await fetch("/api/requests?status=pending", { headers });
      if (rRes.ok) {
        const rData = await rRes.json();
        setPendingRequestsCount((rData.requests || []).length);
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
              <Sparkles size={14} /> Day-to-Day Operations Console
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Welcome, {fullName || "Operations Admin"}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Manage student admissions, allocate cohorts to trainers, monitor learning device sessions, and broadcast updates.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/dashboard/registration")}
              className="px-4 py-2.5 bg-white text-[#2A0066] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition shadow-md flex items-center gap-2"
            >
              <UserPlus size={16} /> + Register Admitted Student
            </button>
            <button
              onClick={() => router.push("/dashboard/allocations")}
              className="px-4 py-2.5 bg-purple-500/30 text-white border border-white/20 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition shadow-md"
            >
              Allocate Trainers ({unassignedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Total Admitted"
          value={loading ? "..." : totalStudents.toString()}
          subtitle="Enrolled Students"
          icon={<Users size={22} />}
          highlight={true}
          onClick={() => router.push("/dashboard/students")}
        />
        <MetricCard
          title="Trainer Allocation"
          value={loading ? "..." : `${totalStudents - unassignedCount} / ${totalStudents}`}
          subtitle={`${unassignedCount} Unassigned`}
          icon={<UserCheck size={22} />}
          alert={unassignedCount > 0}
          onClick={() => router.push("/dashboard/allocations")}
        />
        <MetricCard
          title="Active Devices"
          value={loading ? "..." : `${activeDeviceSessions} Active`}
          subtitle="Bound Hardware Locks"
          icon={<Smartphone size={22} />}
          onClick={() => router.push("/dashboard/monitoring")}
        />
        <MetricCard
          title="Pending Escalations"
          value={loading ? "..." : `${pendingRequestsCount} In Review`}
          subtitle="Refunds & Exceptions"
          icon={<HelpCircle size={22} />}
          onClick={() => router.push("/dashboard/support-requests")}
        />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => router.push("/dashboard/registration")}
          className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
        >
          <div className="p-3 bg-purple-50 text-[#2A0066] rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <UserPlus size={22} />
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-[#2A0066] transition">
            Register & Onboard Student
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Issue unique formatted Student IDs (`ANC-XXXXXX`) and generate instant WhatsApp/copy credentials cards.
          </p>
        </div>

        <div
          onClick={() => router.push("/dashboard/allocations")}
          className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <UserCheck size={22} />
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
            Trainer Workload Balancing
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Reassign learners between instructors, balance cohort capacities, and resolve unassigned students.
          </p>
        </div>

        <div
          onClick={() => router.push("/dashboard/communications")}
          className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <Megaphone size={22} />
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition">
            Cohort Announcements
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Send urgent reminders, deadline notices, or onboarding instructions to student and trainer portals.
          </p>
        </div>
      </div>

      {/* Recent Admissions Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Admitted Students</h2>
            <p className="text-xs text-slate-400 font-medium">Newly registered student records and onboarding status</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/students")}
            className="text-xs font-bold text-[#2A0066] hover:underline flex items-center gap-1"
          >
            All Students <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader size={18} className="animate-spin text-[#2A0066]" />
              <span className="text-xs font-bold">Loading student records...</span>
            </div>
          ) : recentStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">
              No students admitted yet. Click "+ Register Admitted Student" above.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Student ID</th>
                  <th className="px-6 py-3.5">Assigned Trainer</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Admission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentStudents.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/dashboard/students/${s.id}`)}
                    className="hover:bg-slate-50/50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{s.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {s.loginId || "---"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {s.trainerName || (
                        <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50 text-[11px]">
                          Unallocated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          s.isBlocked
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {s.isBlocked ? "Frozen" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(s.createdAt).toLocaleDateString()}
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
