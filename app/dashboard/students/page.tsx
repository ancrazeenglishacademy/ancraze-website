"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  User,
  Mail,
  Calendar,
  BookOpen,
  X,
  Loader,
  Key,
  Users,
  ChevronRight,
  SearchX,
  UserCheck,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  fullName: string;
  email: string;
  loginId: string;
  enrolledCourses: string[];
  enrolledCoursesDetails?: any[];
  trainerId?: string;
  isBlocked?: boolean;
  accountStatus?: string;
  isTrainerPreviewAccount?: boolean;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

interface Trainer {
  id: string;
  fullName: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Student Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Add Student Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [isTrainerPreviewAccount, setIsTrainerPreviewAccount] = useState(false);

  // Bulk Selection & Bulk Edit states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkTrainerMode, setBulkTrainerMode] = useState<"unchanged" | "assign" | "clear">("unchanged");
  const [bulkTrainerId, setBulkTrainerId] = useState<string>("");
  const [bulkStatusMode, setBulkStatusMode] = useState<"unchanged" | "active" | "frozen">("unchanged");
  const [bulkPreviewMode, setBulkPreviewMode] = useState<"unchanged" | "enable" | "disable">("unchanged");
  const [bulkCoursesMode, setBulkCoursesMode] = useState<"unchanged" | "set">("unchanged");
  const [bulkCourseIds, setBulkCourseIds] = useState<string[]>([]);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
    fetchTrainers();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/students?role=student", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data.students || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await fetch("/api/students?role=trainer", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch trainers");
      const data = await response.json();
      setTrainers(data.students || []);
    } catch (err: any) {
      console.error("Error fetching trainers:", err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setModalLoading(true);
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          fullName,
          email,
          enrolledCourses: selectedCourses,
          trainerId: selectedTrainer || null,
          isTrainerPreviewAccount,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add student");

      alert(`Student added successfully!\nLogin ID: ${data.student.loginId}`);
      setShowAddModal(false);
      setFullName("");
      setEmail("");
      setSelectedCourses([]);
      setSelectedTrainer("");
      setIsTrainerPreviewAccount(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleBulkCourse = (courseId: string) => {
    setBulkCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const filteredStudents = (students || []).filter(
    (student) =>
      student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.loginId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      const filteredIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const nextSet = new Set(selectedStudentIds);
      filteredStudents.forEach((s) => nextSet.add(s.id));
      setSelectedStudentIds(Array.from(nextSet));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    const confirmed = confirm(
      `Are you sure you want to permanently delete ${selectedStudentIds.length} selected student(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setBulkActionLoading(true);
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete selected students");

      setSelectedStudentIds([]);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || "Error deleting students");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleQuickBulkStatus = async (makeFrozen: boolean) => {
    if (selectedStudentIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          isBlocked: makeFrozen,
          accountStatus: makeFrozen ? "frozen" : "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update students");

      setSelectedStudentIds([]);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || "Error updating students");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const openBulkEditModal = () => {
    setBulkTrainerMode("unchanged");
    setBulkTrainerId("");
    setBulkStatusMode("unchanged");
    setBulkPreviewMode("unchanged");
    setBulkCoursesMode("unchanged");
    setBulkCourseIds([]);
    setShowBulkEditModal(true);
  };

  const handleSaveBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;

    const payload: Record<string, any> = {
      studentIds: selectedStudentIds,
    };
    let hasChanges = false;

    if (bulkTrainerMode === "assign") {
      payload.trainerId = bulkTrainerId || null;
      hasChanges = true;
    } else if (bulkTrainerMode === "clear") {
      payload.trainerId = null;
      hasChanges = true;
    }

    if (bulkStatusMode === "active") {
      payload.isBlocked = false;
      payload.accountStatus = "active";
      hasChanges = true;
    } else if (bulkStatusMode === "frozen") {
      payload.isBlocked = true;
      payload.accountStatus = "frozen";
      hasChanges = true;
    }

    if (bulkPreviewMode === "enable") {
      payload.isTrainerPreviewAccount = true;
      hasChanges = true;
    } else if (bulkPreviewMode === "disable") {
      payload.isTrainerPreviewAccount = false;
      hasChanges = true;
    }

    if (bulkCoursesMode === "set") {
      payload.enrolledCourses = bulkCourseIds;
      hasChanges = true;
    }

    if (!hasChanges) {
      alert("Please select at least one field to update.");
      return;
    }

    try {
      setBulkActionLoading(true);
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk edit students");

      setShowBulkEditModal(false);
      setSelectedStudentIds([]);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || "Error updating students");
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Student <span className="text-[#2A0066]">Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            View, add, bulk edit, and manage your students&apos; access.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2A0066] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Add New Student
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Total Students
            </p>
            <h3 className="text-2xl font-black text-slate-900">{students.length}</h3>
          </div>
        </div>
      </div>

      {/* Search Bar & Bulk Action Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name, email or Login ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-sm focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium"
          />
        </div>

        {/* Bulk Action Toolbar */}
        <AnimatePresence>
          {selectedStudentIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3.5 sm:p-4 bg-[#2A0066] text-white rounded-2xl shadow-lg shadow-[#2A0066]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                  disabled={bulkActionLoading}
                  onClick={openBulkEditModal}
                  className="px-3.5 py-2 bg-white text-[#2A0066] hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Edit3 size={14} />
                  <span>Bulk Edit</span>
                </button>

                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={() => handleQuickBulkStatus(false)}
                  className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Unlock size={14} />
                  <span>Unfreeze</span>
                </button>

                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={() => handleQuickBulkStatus(true)}
                  className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Lock size={14} />
                  <span>Freeze</span>
                </button>

                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={handleBulkDelete}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {bulkActionLoading ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>Delete Selected ({selectedStudentIds.length})</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pl-5 pr-2 py-3 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="p-1 rounded-lg text-slate-400 hover:text-[#2A0066] transition cursor-pointer flex items-center justify-center"
                    title={
                      isAllFilteredSelected
                        ? "Deselect all visible students"
                        : "Select all visible students"
                    }
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare size={18} className="text-[#2A0066]" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Student
                </th>
                <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Login ID
                </th>
                <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Courses
                </th>
                <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Joined
                </th>
                <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="animate-spin text-[#2A0066]" size={32} />
                      <p className="text-slate-500 font-medium">Loading students...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <SearchX size={48} />
                      <p className="text-lg font-bold">No students found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const isFrozen =
                    student.isBlocked || student.accountStatus === "frozen";

                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-purple-50/60 hover:bg-purple-50/90"
                          : "hover:bg-slate-50/50"
                      }`}
                      onClick={() => router.push(`/dashboard/students/${student.id}`)}
                    >
                      <td
                        className="pl-5 pr-2 py-3 sm:py-3.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectStudent(student.id);
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-[#2A0066] transition cursor-pointer flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-[#2A0066]" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 sm:py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066] font-black text-sm border border-[#2A0066]/10">
                            {student.fullName
                              ? student.fullName.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 leading-none">
                                {student.fullName}
                              </p>
                              {student.isTrainerPreviewAccount && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-[#2A0066] border border-purple-200">
                                  Trainer Preview
                                </span>
                              )}
                              {isFrozen && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                  Frozen
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {student.email}
                            </p>
                            {student.trainerId && (
                              <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-1">
                                Trainer:{" "}
                                {trainers.find((t) => t.id === student.trainerId)
                                  ?.fullName || "Unknown"}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 sm:py-3.5">
                        <div className="flex items-center gap-2">
                          <Key size={14} className="text-amber-500" />
                          <code className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {student.loginId}
                          </code>
                        </div>
                      </td>
                      <td className="px-5 py-3 sm:py-3.5">
                        <div className="flex -space-x-2">
                          {(student.enrolledCoursesDetails?.length || 0) > 0 ? (
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 uppercase tracking-widest whitespace-nowrap">
                              {student.enrolledCoursesDetails?.length}{" "}
                              {student.enrolledCoursesDetails?.length === 1
                                ? "Course"
                                : "Courses"}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-300 uppercase italic">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 sm:py-3.5">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={14} />
                          <span className="text-xs font-medium">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/students/${student.id}`);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Edit Students Modal */}
      <AnimatePresence>
        {showBulkEditModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !bulkActionLoading && setShowBulkEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-7 sm:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      Bulk Edit Students
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Applying changes to{" "}
                      <strong className="text-[#2A0066]">
                        {selectedStudentIds.length} selected student(s)
                      </strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBulkEditModal(false)}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSaveBulkEdit} className="space-y-5">
                  {/* 1. Assigned Trainer */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      1. Assigned Trainer
                    </label>
                    <select
                      value={bulkTrainerMode}
                      onChange={(e: any) => setBulkTrainerMode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#2A0066]"
                    >
                      <option value="unchanged">Keep Existing Trainer (No Change)</option>
                      <option value="assign">Assign a Specific Trainer</option>
                      <option value="clear">Remove / Unassign Trainer</option>
                    </select>

                    {bulkTrainerMode === "assign" && (
                      <select
                        value={bulkTrainerId}
                        onChange={(e) => setBulkTrainerId(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs font-bold text-[#2A0066] outline-none mt-2"
                      >
                        <option value="">Select Trainer...</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* 2. Account Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      2. Account Access Status
                    </label>
                    <select
                      value={bulkStatusMode}
                      onChange={(e: any) => setBulkStatusMode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#2A0066]"
                    >
                      <option value="unchanged">Keep Existing Status (No Change)</option>
                      <option value="active">Active (Unfreeze / Grant Login Access)</option>
                      <option value="frozen">Frozen (Suspend Login Access)</option>
                    </select>
                  </div>

                  {/* 3. Trainer Preview Account */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      3. Trainer Preview Account Mode
                    </label>
                    <select
                      value={bulkPreviewMode}
                      onChange={(e: any) => setBulkPreviewMode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#2A0066]"
                    >
                      <option value="unchanged">Keep Existing Setting (No Change)</option>
                      <option value="enable">
                        Enable Trainer Preview (Unlock All Videos Immediately)
                      </option>
                      <option value="disable">
                        Disable Trainer Preview (Standard Progressive Unlocking)
                      </option>
                    </select>
                  </div>

                  {/* 4. Enrolled Courses */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      4. Enrolled Courses
                    </label>
                    <select
                      value={bulkCoursesMode}
                      onChange={(e: any) => setBulkCoursesMode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#2A0066]"
                    >
                      <option value="unchanged">Keep Existing Courses (No Change)</option>
                      <option value="set">Overwrite Enrolled Courses for Selected Students</option>
                    </select>

                    {bulkCoursesMode === "set" && (
                      <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pt-2 pr-1">
                        {courses.map((course) => {
                          const isChecked = bulkCourseIds.includes(course.id);
                          return (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => toggleBulkCourse(course.id)}
                              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                                isChecked
                                  ? "border-[#2A0066] bg-[#2A0066]/5 text-[#2A0066]"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <span className="text-xs font-bold">{course.title}</span>
                              {isChecked ? (
                                <CheckSquare size={16} className="text-[#2A0066]" />
                              ) : (
                                <Square size={16} className="text-slate-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowBulkEditModal(false)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bulkActionLoading}
                      className="flex-1 py-3.5 bg-[#2A0066] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {bulkActionLoading ? (
                        <Loader className="animate-spin" size={16} />
                      ) : (
                        "Apply Bulk Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !modalLoading && setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 uppercase">
                    Add Student
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium"
                        placeholder="e.g. john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Assign Trainer (Optional)
                    </label>
                    <div className="relative">
                      <UserCheck
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <select
                        value={selectedTrainer}
                        onChange={(e) => setSelectedTrainer(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="">Select a Trainer</option>
                        {trainers.map((trainer) => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.fullName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight size={16} className="text-slate-400 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                      Assign Courses
                      <span className="text-[#2A0066]">
                        {selectedCourses.length} selected
                      </span>
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => toggleCourse(course.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                            selectedCourses.includes(course.id)
                              ? "border-[#2A0066] bg-[#2A0066]/5"
                              : "border-slate-50 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen
                              size={18}
                              className={
                                selectedCourses.includes(course.id)
                                  ? "text-[#2A0066]"
                                  : "text-slate-400"
                              }
                            />
                            <span
                              className={`text-sm font-bold ${
                                selectedCourses.includes(course.id)
                                  ? "text-[#2A0066]"
                                  : "text-slate-600"
                              }`}
                            >
                              {course.title}
                            </span>
                          </div>
                          {selectedCourses.includes(course.id) && (
                            <div className="h-5 w-5 bg-[#2A0066] rounded-full flex items-center justify-center">
                              <Plus size={12} className="text-white rotate-45" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trainer Preview Account Checkbox */}
                  <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="trainerPreviewAccountModal"
                      checked={isTrainerPreviewAccount}
                      onChange={(e) => setIsTrainerPreviewAccount(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-[#2A0066] focus:ring-[#2A0066] cursor-pointer"
                    />
                    <label
                      htmlFor="trainerPreviewAccountModal"
                      className="cursor-pointer select-none"
                    >
                      <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Trainer Preview Account
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        If checked, this account gets immediate access to all course
                        videos without waiting for daily releases or task completions.
                      </p>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="w-full py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {modalLoading ? (
                        <Loader className="animate-spin" size={20} />
                      ) : (
                        "Confirm & Generate Login ID"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
