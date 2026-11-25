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
  Trash2,
  CheckSquare,
  Square,
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
  isTrainerPreviewAccount?: boolean;
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
  const [editIsTrainerPreview, setEditIsTrainerPreview] = useState<boolean>(false);

  // Bulk Selection States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

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
          isTrainerPreviewAccount: editIsTrainerPreview,
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

  const isAllFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.includes(s.id));

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const visibleSet = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const next = new Set(selectedStudentIds);
      filteredStudents.forEach((s) => next.add(s.id));
      setSelectedStudentIds(Array.from(next));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedStudentIds.length} selected student(s)?`
      )
    )
      return;

    try {
      setBulkLoading(true);
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      if (!res.ok) throw new Error("Failed to delete selected students");
      setSelectedStudentIds([]);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || "Error deleting students");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status: "active" | "frozen") => {
    if (selectedStudentIds.length === 0) return;
    try {
      setBulkLoading(true);
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          isBlocked: status === "frozen",
          accountStatus: status,
        }),
      });
      if (!res.ok) throw new Error("Failed to update selected students");
      setSelectedStudentIds([]);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || "Error updating students");
    } finally {
      setBulkLoading(false);
    }
  };

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

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedStudentIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-[#2A0066] text-white rounded-2xl shadow-lg shadow-[#2A0066]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/15 rounded-xl text-xs font-black uppercase tracking-wider">
                {selectedStudentIds.length} Selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="text-xs text-purple-200 hover:text-white underline font-bold cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkStatusUpdate("active")}
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Unlock size={14} /> Activate Selected
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkStatusUpdate("frozen")}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock size={14} /> Freeze Selected
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={handleBulkDelete}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete Selected ({selectedStudentIds.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <th className="pl-5 pr-2 py-4 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="p-1 rounded-lg text-slate-400 hover:text-[#2A0066] transition cursor-pointer flex items-center justify-center"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare size={17} className="text-[#2A0066]" />
                      ) : (
                        <Square size={17} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-4">Student</th>
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
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`transition ${
                        isSelected ? "bg-purple-50/50 hover:bg-purple-50/80" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="pl-5 pr-2 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectStudent(s.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#2A0066] transition cursor-pointer flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare size={17} className="text-[#2A0066]" />
                          ) : (
                            <Square size={17} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#2A0066]/10 text-[#2A0066] font-black text-xs flex items-center justify-center">
                            {s.fullName?.charAt(0) || "S"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">{s.fullName}</p>
                              {s.isTrainerPreviewAccount && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-[#2A0066] border border-purple-200">
                                  Trainer Preview
                                </span>
                              )}
                            </div>
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
                            setEditIsTrainerPreview(Boolean(s.isTrainerPreviewAccount));
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

              {/* Trainer Preview Account Checkbox */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="superAdminTrainerPreview"
                  checked={editIsTrainerPreview}
                  onChange={(e) => setEditIsTrainerPreview(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#2A0066] focus:ring-[#2A0066] cursor-pointer"
                />
                <label htmlFor="superAdminTrainerPreview" className="cursor-pointer select-none">
                  <p className="text-xs font-black text-slate-900">Trainer Preview Account</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Unlock all course videos immediately without waiting for daily drip releases or task completions.
                  </p>
                </label>
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

