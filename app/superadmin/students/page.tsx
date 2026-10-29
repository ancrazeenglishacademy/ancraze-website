"use client";

import { useState, useEffect } from "react";
import {
  Search,
  User,
  Calendar,
  X,
  Loader,
  UsersRound,
  ShieldAlert,
  Edit2,
  Lock,
  Unlock,
  Key,
  BookOpen,
  Filter,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  role: string;
  isBlocked?: boolean;
  accountStatus?: "active" | "frozen" | "closure_requested" | "closed";
  enrolledCourses?: string[];
  enrolledCoursesDetails?: any[];
  trainerName?: string;
  trainerId?: string;
  createdAt: string;
}

export default function SuperAdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Status Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("active");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students?role=student", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccountStatus = async () => {
    if (!selectedStudent) return;
    try {
      setModalLoading(true);
      const isBlocked = newStatus === "frozen" || newStatus === "closed";
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          accountStatus: newStatus,
          isBlocked,
        }),
      });

      if (!res.ok) throw new Error("Failed to update student status");

      setShowStatusModal(false);
      setSelectedStudent(null);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loginId?.toLowerCase().includes(searchQuery.toLowerCase());

    const currentStatus = s.accountStatus || (s.isBlocked ? "frozen" : "active");
    const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Governance & Enrolments</h1>
          <p className="text-xs text-slate-500 font-medium">Academy-wide student oversight, course progress, and account status controls</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-[#2A0066]/10 text-[#2A0066] rounded-xl text-xs font-black">
            {students.length} Total Students
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or Student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Learners</option>
            <option value="frozen">Frozen (Suspended)</option>
            <option value="closure_requested">Closure Requested</option>
            <option value="closed">Closed Accounts</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Enrolled Courses</th>
                  <th className="px-6 py-4">Assigned Trainer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const currentStatus = s.accountStatus || (s.isBlocked ? "frozen" : "active");
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#2A0066]/10 text-[#2A0066] font-black text-xs flex items-center justify-center">
                            {s.fullName?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{s.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {s.loginId || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {s.enrolledCoursesDetails && s.enrolledCoursesDetails.length > 0 ? (
                            s.enrolledCoursesDetails.map((c: any) => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100"
                              >
                                {c.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">
                        {s.trainerName || "Unassigned"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            currentStatus === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : currentStatus === "frozen"
                              ? "bg-rose-100 text-rose-800"
                              : currentStatus === "closure_requested"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              currentStatus === "active"
                                ? "bg-emerald-600"
                                : currentStatus === "frozen"
                                ? "bg-rose-600"
                                : currentStatus === "closure_requested"
                                ? "bg-amber-600"
                                : "bg-slate-600"
                            }`}
                          />
                          {currentStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setNewStatus(currentStatus);
                            setShowStatusModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-[#2A0066] hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          Manage Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Status Modal */}
      <AnimatePresence>
        {showStatusModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Oversight: Account Status</h3>
                  <p className="text-xs text-slate-400 font-medium">Update status for {selectedStudent.fullName}</p>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Select Status
                </label>
                <div className="space-y-2">
                  {[
                    { val: "active", title: "Active", desc: "Full academy access and learning privileges" },
                    { val: "frozen", title: "Frozen (Suspended)", desc: "Temporarily locks access; student cannot login" },
                    { val: "closed", title: "Closed / Terminated", desc: "Permanent closure of student records" },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      onClick={() => setNewStatus(opt.val)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        newStatus === opt.val
                          ? "border-[#2A0066] bg-[#2A0066]/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={newStatus === opt.val}
                        onChange={() => setNewStatus(opt.val)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-xs font-black text-slate-900">{opt.title}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={modalLoading}
                  onClick={handleUpdateAccountStatus}
                  className="flex-1 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  {modalLoading ? <Loader size={16} className="animate-spin" /> : "Apply Status"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

