"use client";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import {
  Users,
  Presentation,
  UserPlus,
  MoreHorizontal,
  Loader,
  ShieldAlert
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
    <div className="space-y-6 md:space-y-10 pb-12 px-1 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Super Admin <span className="text-[#2A0066]">Overview</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Welcome back,{" "}
            <span className="text-[#2A0066] font-bold uppercase">
              {fullName || role || "Super Admin"}
            </span>
          </p>
        </div>
      </div>

      {/* Main KPI Grid - 3 cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="animate-spin text-[#2A0066]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <KPICard
            label="Total Platform Users"
            value={totalUsers.toString()}
            icon={<Users size={22} />}
            percentage={`${totalUsers} active accounts`}
          />
          <KPICard
            label="Total Courses"
            value={totalCourses.toString()}
            icon={<Presentation size={22} />}
            percentage="Platform wide courses"
          />
          <KPICard
            label="This Month Users"
            value={getThisMonthUsers().toString()}
            icon={<UserPlus size={22} />}
            percentage="↑ New Registrations"
            isHighlight
          />
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              Recent Signups
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs font-medium mt-1">
              Latest users across the platform
            </p>
          </div>
          <button
            className="text-[#2A0066] font-bold text-xs md:text-sm hover:underline whitespace-nowrap cursor-pointer"
            onClick={() => router.push("/superadmin/users")}
          >
            View All Users
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-5 md:px-8 py-4 text-left">User Name</th>
                <th className="px-5 md:px-8 py-4 text-left">Role</th>
                <th className="px-5 md:px-8 py-4 text-left">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center">
                    <Loader size={24} className="animate-spin text-[#2A0066] mx-auto" />
                  </td>
                </tr>
              ) : recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-400">
                    No users registered yet
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    name={user.fullName || "Unknown"}
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

// --- Responsive Helper Components ---

function KPICard({
  label,
  value,
  icon,
  percentage,
  isHighlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  percentage: string;
  isHighlight?: boolean;
}) {
  return (
    <motion.div className="p-5 md:p-7 rounded-2xl cursor-pointer border transition-all duration-300 bg-white border-slate-100 shadow-sm hover:shadow-md ">
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div
          className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl ${isHighlight ? "bg-[#2A0066] text-white" : "bg-[#2A0066]/5 text-[#2A0066]"}`}
        >
          {icon}
        </div>
        <button className="text-slate-300 cursor-pointer">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div>
        <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]">
          {label}
        </p>
        <h4 className="text-xl md:text-3xl font-black text-slate-900 mt-1">
          {value}
        </h4>
        <p
          className={`text-[9px] md:text-[10px] font-bold mt-2 ${isHighlight ? "text-[#2A0066]" : "text-slate-400"}`}
        >
          {percentage}
        </p>
      </div>
    </motion.div>
  );
}

function UserRow({
  name,
  role,
  date,
}: {
  name: string;
  role: string;
  date: string;
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
      <td className="px-5 md:px-8 py-4 md:py-6 ">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-[#2A0066]/5 flex items-center justify-center font-bold text-[#2A0066] border border-[#2A0066]/10 group-hover:bg-[#2A0066] group-hover:text-white transition-all">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-[#2A0066] transition-colors">
            {name}
          </span>
        </div>
      </td>
      <td className="px-5 md:px-8 py-4 md:py-6">
        <div className="flex items-center gap-2">
          <ShieldAlert
            size={14}
            className={role === "superadmin" ? "text-[#2A0066]" : "text-amber-500"}
          />
          <code className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded capitalize">
            {role}
          </code>
        </div>
      </td>
      <td className="px-5 md:px-8 py-4 md:py-6 text-[10px] md:text-sm text-slate-400 font-medium whitespace-nowrap">
        {date}
      </td>
    </tr>
  );
}
