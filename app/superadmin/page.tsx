"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import {
  Users,
  Presentation,
  UserPlus,
  MoreHorizontal,
  Loader,
  Shield,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real data states
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const roleValue = Cookies.get("role");
    const nameValue = Cookies.get("fullName");
    setRole(roleValue || null);
    setFullName(nameValue || null);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [mounted]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // Fetch users
      const usersRes = await fetch("/api/users", { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.users || [];
        setTotalUsers(users.length);

        // Get recent users (last 5, sorted by creation date)
        const sortedUsers = users
          .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentUsers(sortedUsers);
      }

      // Fetch courses
      const coursesRes = await fetch("/api/courses", { headers });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const coursesArray = coursesData.courses || [];
        setTotalCourses(coursesArray.length);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate this month's new users
  const getThisMonthUsers = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return recentUsers.filter((user) => {
      const createdDate = new Date(user.createdAt);
      return (
        createdDate.getMonth() === thisMonth &&
        createdDate.getFullYear() === thisYear
      );
    }).length;
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 px-1 sm:px-0">
      
      {/* Premium Gradient Greeting Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#2A0066] via-[#3d0080] to-[#5a00b3] p-8 md:p-10 text-white shadow-[0_20px_50px_rgba(42,0,102,0.15)]"
      >
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150 rounded-full blur-xl" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-purple-200 tracking-wider uppercase">
              <Sparkles size={12} className="animate-spin text-purple-300" />
              Live Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white">{fullName || role || "Super Admin"}</span>
            </h1>
            <p className="text-purple-100/80 text-sm max-w-xl font-medium leading-relaxed">
              Manage users, configure courses, monitor operations and customize your English Learning platform from the dashboard.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => router.push("/superadmin/courses")}
              className="px-6 py-3 rounded-2xl bg-white text-[#2A0066] font-bold text-sm shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              Add Course
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main KPI Grid - 3 cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="animate-spin text-[#2A0066]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPICard
            label="Total Platform Users"
            value={totalUsers.toString()}
            icon={<Users size={22} />}
            desc="Registered active platform accounts"
            trend={`${totalUsers} Total`}
            color="from-purple-500 to-indigo-600"
          />
          <KPICard
            label="Total Course Modules"
            value={totalCourses.toString()}
            icon={<Presentation size={22} />}
            desc="Syllabus courses globally active"
            trend="Live Academy Catalog"
            color="from-blue-500 to-sky-600"
          />
          <KPICard
            label="This Month Signups"
            value={getThisMonthUsers().toString()}
            icon={<UserPlus size={22} />}
            desc="New registrations in current month"
            trend="↑ Increasing Activity"
            color="from-emerald-500 to-teal-600"
            isHighlight
          />
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-50/50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-600" />
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Recent Platform Registrations
              </h3>
            </div>
            <p className="text-slate-400 text-xs font-medium mt-1">
              Real-time update of latest signups on the database
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-xl bg-purple-50 text-[#2A0066] hover:bg-purple-100 font-bold text-xs md:text-sm transition-all cursor-pointer shadow-sm active:scale-95"
            onClick={() => router.push("/superadmin/users")}
          >
            View All Users
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-extrabold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 md:px-8 py-4 text-left font-black">User Details</th>
                <th className="px-6 md:px-8 py-4 text-left font-black">Role / Access</th>
                <th className="px-6 md:px-8 py-4 text-left font-black">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 bg-white/50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center">
                    <Loader size={28} className="animate-spin text-[#2A0066] mx-auto" />
                  </td>
                </tr>
              ) : recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center text-slate-400 font-medium">
                    No users registered yet
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    name={user.fullName || "Unknown User"}
                    email={user.email || "no-email@platform.com"}
                    role={user.role || "user"}
                    date={formatDate(user.createdAt)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Premium Card Helper Components ---

function KPICard({
  label,
  value,
  icon,
  desc,
  trend,
  color,
  isHighlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  desc: string;
  trend: string;
  color: string;
  isHighlight?: boolean;
}) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="p-6 md:p-8 rounded-[28px] cursor-pointer bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg shadow-black/5`}>
            {icon}
          </div>
          <button className="text-slate-300 hover:text-slate-500 cursor-pointer">
            <MoreHorizontal size={20} />
          </button>
        </div>
        
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
          {label}
        </p>
        <h4 className="text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">
          {value}
        </h4>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="text-slate-400 font-medium">{desc}</span>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600`}>
          {trend}
        </span>
      </div>
    </motion.div>
  );
}

function UserRow({
  name,
  email,
  role,
  date,
}: {
  name: string;
  email: string;
  role: string;
  date: string;
}) {
  const getRoleColors = (role: string) => {
    switch (role.toLowerCase()) {
      case "superadmin":
        return "bg-purple-100 text-purple-700 border-purple-200/50";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200/50";
      case "trainer":
        return "bg-indigo-100 text-indigo-700 border-indigo-200/50";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200/50";
    }
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-b border-slate-100/40">
      <td className="px-6 md:px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-50/20 border border-purple-100 flex items-center justify-center font-black text-purple-600 group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-sm">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 group-hover:text-[#2A0066] transition-colors leading-tight">
              {name}
            </span>
            <span className="text-slate-400 text-xs font-medium mt-0.5">
              {email}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 md:px-8 py-5">
        <div className="flex items-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize shadow-sm ${getRoleColors(role)}`}>
            <Shield size={12} />
            {role}
          </span>
        </div>
      </td>
      <td className="px-6 md:px-8 py-5 text-xs text-slate-400 font-bold whitespace-nowrap">
        {date}
      </td>
    </tr>
  );
}
