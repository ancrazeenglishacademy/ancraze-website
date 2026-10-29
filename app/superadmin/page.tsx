"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import {
  Users,
  Presentation,
  TrendingUp,
  Award,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Loader,
  GraduationCap,
  Layers,
  FileCheck2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Statistics
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalTrainers, setTotalTrainers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    netProfit: 0,
    pendingBalances: 0,
  });

  useEffect(() => {
    const nameValue = Cookies.get("fullName");
    setFullName(nameValue || "Super Admin");
    fetchMasterStats();
  }, []);

  const fetchMasterStats = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // 1. Fetch Users
      const usersRes = await fetch("/api/users", { headers });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        const allUsers: any[] = uData.users || [];
        setTotalStudents(allUsers.filter((u) => u.role === "student" || u.role === "user").length);
        setTotalTrainers(allUsers.filter((u) => u.role === "trainer").length);
        setTotalAdmins(allUsers.filter((u) => u.role === "admin" || u.role === "superadmin").length);
        setRecentUsers(allUsers.slice(0, 6));
      }

      // 2. Fetch Courses
      const coursesRes = await fetch("/api/courses", { headers });
      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        setTotalCourses((cData.courses || []).length);
      }

      // 3. Fetch Finances
      const finRes = await fetch("/api/finances", { headers });
      if (finRes.ok) {
        const fData = await finRes.json();
        if (fData.summary) {
          setFinancialSummary({
            totalRevenue: fData.summary.totalRevenue || 0,
            netProfit: fData.summary.netProfit || 0,
            pendingBalances: fData.summary.pendingBalances || 0,
          });
        }
      }

      // 4. Fetch Pending Requests
      const reqRes = await fetch("/api/requests?status=pending", { headers });
      if (reqRes.ok) {
        const rData = await reqRes.json();
        setPendingRequestsCount((rData.requests || []).length);
      }
    } catch (err) {
      console.error("Failed to load master statistics", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Executive Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#180036] via-[#2A0066] to-[#4A0E78] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#2A0066]/15 border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-black uppercase tracking-widest border border-amber-400/30">
              <Sparkles size={14} /> Academy Executive Overview
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Welcome back, {fullName || "Super Administrator"}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Complete centralized control of Ancraze English Academy: monitor admissions, trainer performance, course curricula, financial health, and operational approvals.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/superadmin/courses")}
              className="px-4 py-2.5 bg-white text-[#2A0066] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition shadow-md"
            >
              + Create Course
            </button>
            <button
              onClick={() => router.push("/superadmin/oversight")}
              className="px-4 py-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition shadow-md flex items-center gap-2"
            >
              <ShieldAlert size={15} />
              Review Approvals ({pendingRequestsCount})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Total Students"
          value={loading ? "..." : totalStudents.toString()}
          subtitle="Enrolled Learners"
          icon={<Users size={22} />}
          highlight={true}
          onClick={() => router.push("/superadmin/students")}
        />
        <MetricCard
          title="Total Revenue"
          value={loading ? "..." : `₹${financialSummary.totalRevenue.toLocaleString()}`}
          subtitle={`₹${financialSummary.netProfit.toLocaleString()} Net Profit`}
          icon={<DollarSign size={22} />}
          onClick={() => router.push("/superadmin/finances")}
        />
        <MetricCard
          title="Active Curricula"
          value={loading ? "..." : `${totalCourses} Courses`}
          subtitle="Published Modules"
          icon={<Layers size={22} />}
          onClick={() => router.push("/superadmin/courses")}
        />
        <MetricCard
          title="Faculty & Staff"
          value={loading ? "..." : `${totalTrainers} Trainers / ${totalAdmins} Admins`}
          subtitle="Active Workloads"
          icon={<GraduationCap size={22} />}
          onClick={() => router.push("/superadmin/staff")}
        />
      </div>

      {/* Academy Performance Indexes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance & Quality Indicators */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="text-[#2A0066]" size={18} />
              Academy Quality Indexes
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Live
            </span>
          </div>

          <div className="space-y-4">
            <QualityBar label="Course Completion Rate" percentage={84} color="bg-indigo-600" />
            <QualityBar label="Student Retention Rate" percentage={92} color="bg-emerald-500" />
            <QualityBar label="Trainer Evaluation SLA" percentage={96} color="bg-[#2A0066]" />
            <QualityBar label="Speaking Task Approvals" percentage={78} color="bg-amber-500" />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Overall Academy Index</span>
            <span className="text-sm font-black text-[#2A0066]">88% Exceptional</span>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-emerald-600" size={18} />
              Financial Pulse
            </h2>
            <button
              onClick={() => router.push("/superadmin/finances")}
              className="text-xs font-bold text-[#2A0066] hover:underline"
            >
              Details →
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Inflow</p>
                <p className="text-lg font-black text-slate-900">₹{financialSummary.totalRevenue.toLocaleString()}</p>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">+14% MoM</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
                <p className="text-lg font-black text-amber-600">₹{financialSummary.pendingBalances.toLocaleString()}</p>
              </div>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg">Follow-up</span>
            </div>

            <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#2A0066] uppercase tracking-wider">Net Academy Earnings</p>
                <p className="text-lg font-black text-[#2A0066]">₹{financialSummary.netProfit.toLocaleString()}</p>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-[#2A0066] text-[10px] font-black rounded-lg">Verified</span>
            </div>
          </div>
        </div>

        {/* Operational Oversight Alerts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldAlert className="text-amber-500" size={18} />
                Action Required
              </h2>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingRequestsCount} Pending
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Review and act on student refund requests, account closure authorizations, and trainer workload reallocations submitted by staff admins.
            </p>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                <Clock size={14} className="text-amber-600" />
                <span>Pending Approvals Queue: {pendingRequestsCount}</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Ensure account governance policies are maintained by reviewing exceptional refund inquiries promptly.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/superadmin/oversight")}
            className="w-full mt-4 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            Open Oversight Console <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Admissions & Registrations */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent User Registrations</h2>
            <p className="text-xs text-slate-400 font-medium">Live roster of newly created accounts across the academy</p>
          </div>
          <button
            onClick={() => router.push("/superadmin/students")}
            className="text-xs font-bold text-[#2A0066] hover:underline flex items-center gap-1"
          >
            All Students <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader size={18} className="animate-spin text-[#2A0066]" />
              <span className="text-xs font-bold">Loading registrations...</span>
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">
              No recent users recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Enrolled Courses</th>
                  <th className="px-6 py-3.5">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#2A0066]/10 text-[#2A0066] font-black text-xs flex items-center justify-center">
                          {u.fullName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{u.fullName || "User"}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                        {u.role || "student"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.isBlocked
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.isBlocked ? "Frozen" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {u.enrolledCourses?.length || 0} Course(s)
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(u.createdAt).toLocaleDateString()}
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
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`p-5 md:p-6 rounded-3xl border transition cursor-pointer ${
        highlight
          ? "bg-white border-[#2A0066]/30 shadow-md shadow-[#2A0066]/5"
          : "bg-white border-slate-100 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</span>
        <div className="p-2.5 rounded-2xl bg-[#2A0066]/5 text-[#2A0066]">{icon}</div>
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs text-slate-400 font-bold mt-1">{subtitle}</p>
    </motion.div>
  );
}

function QualityBar({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
