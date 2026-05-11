"use client";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import {
  Users,
  Presentation,
  CheckCircle2,
  MoreHorizontal,
  Loader,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TrainerDashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real data states
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);

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

      const userDataCookie = Cookies.get("userData");
      let trainerUid = "";
      if (userDataCookie) {
        try {
          const parsedData = JSON.parse(userDataCookie);
          trainerUid = parsedData.uid || "";
        } catch (e) {
          console.error("Failed to parse trainer data", e);
        }
      }

      if (!trainerUid) {
        console.warn("No trainer UID found for dashboard stats");
        setLoading(false);
        return;
      }

      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // Fetch students assigned to this trainer
      const studentsRes = await fetch(`/api/students?trainerId=${trainerUid}`, { headers });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const students = studentsData.students || [];
        setTotalStudents(students.length);

        // Get recent students
        const sortedStudents = students
          .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentStudents(sortedStudents);
      }

      // Fetch courses
      const coursesRes = await fetch("/api/courses", { headers });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const coursesArray = coursesData.courses || [];
        // Optionally filter by instructor logic, here we just show all
        setTotalCourses(coursesArray.length);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
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
            Trainer <span className="text-[#2A0066]">Overview</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Welcome back,{" "}
            <span className="text-[#2A0066] font-bold uppercase">
              {fullName || role || "Trainer"}
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
            label="My Students"
            value={totalStudents.toString()}
            icon={<Users size={22} />}
            percentage={`${totalStudents} active students`}
          />
          <KPICard
            label="Total Courses"
            value={totalCourses.toString()}
            icon={<Presentation size={22} />}
            percentage="Platform curriculum"
          />
          <KPICard
            label="Tasks Pending"
            value="12"
            icon={<CheckCircle2 size={22} />}
            percentage="Awaiting Review"
            isHighlight
          />
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              Recent Students
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs font-medium mt-1">
              Latest students assigned to your cohort
            </p>
          </div>
          <button
            className="text-[#2A0066] font-bold text-xs md:text-sm hover:underline whitespace-nowrap cursor-pointer"
            onClick={() => router.push("/trainer/students")}
          >
            View All Students
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-5 md:px-8 py-4 text-left">Student Name</th>
                <th className="px-5 md:px-8 py-4 text-left">Enrolled Courses</th>
                <th className="px-5 md:px-8 py-4 text-left">Enrollment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center">
                    <Loader size={24} className="animate-spin text-[#2A0066] mx-auto" />
                  </td>
                </tr>
              ) : recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-400">
                    No students assigned yet
                  </td>
                </tr>
              ) : (
                recentStudents.map((student) => (
                  <StudentRow
                    key={student.id}
                    name={student.fullName || "Unknown"}
                    classType={
                      student.enrolledCourses &&
                      student.enrolledCourses.length > 0
                        ? `${student.enrolledCourses.length} Courses`
                        : "No Course Assigned"
                    }
                    date={formatDate(student.createdAt)}
                    onClick={() => router.push(`/trainer/students/${student.id}`)}
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

function StudentRow({
  name,
  classType,
  date,
  onClick,
}: {
  name: string;
  classType: string;
  date: string;
  onClick: () => void;
}) {
  return (
    <tr onClick={onClick} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
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
        <span className="px-2.5 md:px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] md:text-xs font-bold border border-slate-200">
          {classType}
        </span>
      </td>
      <td className="px-5 md:px-8 py-4 md:py-6 text-[10px] md:text-sm text-slate-400 font-medium whitespace-nowrap">
        {date}
      </td>
    </tr>
  );
}
