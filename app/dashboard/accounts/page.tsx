"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  UserX,
  Search,
  Filter,
  Loader,
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentAccount {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  isBlocked?: boolean;
  accountStatus?: "active" | "frozen" | "closure_requested" | "closed";
  createdAt: string;
}

export default function AccountManagementPage() {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Closure Request Modal
  const [closureStudent, setClosureStudent] = useState<StudentAccount | null>(null);
  const [closureReason, setClosureReason] = useState("");
  const [submittingClosure, setSubmittingClosure] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students?role=student", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async (student: StudentAccount) => {
    const shouldFreeze = !student.isBlocked;
    const actionText = shouldFreeze ? "Freeze (Suspend)" : "Restore (Unfreeze)";
    if (!confirm(`Are you sure you want to ${actionText} access for ${student.fullName}?`)) return;

    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId: student.id,
          isBlocked: shouldFreeze,
          accountStatus: shouldFreeze ? "frozen" : "active",
        }),
      });

      if (!res.ok) throw new Error("Failed to update account");
      await fetchAccounts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInitiateClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureStudent || !closureReason) return;

    try {
      setSubmittingClosure(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId: closureStudent.id,
          studentName: closureStudent.fullName,
          studentLoginId: closureStudent.loginId,
          type: "account_closure",
          reason: closureReason,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit closure request");
      alert("Account closure request submitted to Super Admin for approval.");
      setClosureStudent(null);
      setClosureReason("");
      await fetchAccounts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingClosure(false);
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Account Governance</h1>
        <p className="text-xs text-slate-500 font-medium">Freeze student access, restore accounts, or initiate permanent account closure requests for Super Admin authorization</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, email, or ID..."
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
            <option value="all">All Account States</option>
            <option value="active">Active Accounts</option>
            <option value="frozen">Frozen (Suspended)</option>
            <option value="closure_requested">Closure Pending</option>
            <option value="closed">Closed Accounts</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading student accounts...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold">
            No accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Login ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const currentStatus = s.accountStatus || (s.isBlocked ? "frozen" : "active");
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{s.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {s.loginId || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            currentStatus === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : currentStatus === "frozen"
                              ? "bg-rose-100 text-rose-800"
                              : currentStatus === "closure_requested"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {currentStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleFreeze(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              s.isBlocked
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            {s.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                            {s.isBlocked ? "Restore Access" : "Freeze Account"}
                          </button>

                          {currentStatus !== "closure_requested" && currentStatus !== "closed" && (
                            <button
                              onClick={() => setClosureStudent(s)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <UserX size={14} /> Request Closure
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Closure Modal */}
      <AnimatePresence>
        {closureStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Request Account Closure</h3>
                  <p className="text-xs text-slate-400 font-medium">Student: {closureStudent.fullName} ({closureStudent.loginId})</p>
                </div>
                <button
                  onClick={() => setClosureStudent(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleInitiateClosure} className="space-y-4">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Super Admin Review Required</p>
                  <p className="text-[11px] text-amber-800">
                    Account closure marks the account as pending termination. The Super Admin will review this request before permanent archival.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Reason for Closure *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Student requested cancellation due to relocation, or disciplinary reasons..."
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setClosureStudent(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClosure}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition flex items-center justify-center gap-2"
                  >
                    {submittingClosure ? <Loader size={16} className="animate-spin" /> : <Send size={15} />}
                    Forward to Super Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

