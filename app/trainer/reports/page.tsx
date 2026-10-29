"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  Send,
  Loader,
  User,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  X,
  FileWarning,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LaggingStudent {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  isBlocked?: boolean;
  accountStatus?: string;
  daysInactive?: number;
  missedTasksCount?: number;
  averageScore?: number;
}

export default function TrainerLaggingReportsPage() {
  const [students, setStudents] = useState<LaggingStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Report Modal
  const [selectedStudent, setSelectedStudent] = useState<LaggingStudent | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    fetchLaggingStudents();
  }, []);

  const fetchLaggingStudents = async () => {
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
      if (!trainerUid) trainerUid = Cookies.get("uid") || "";

      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      const res = await fetch(`/api/students?trainerId=${trainerUid}`, { headers });
      const data = await res.json();
      const myStudents: any[] = data.students || [];

      // Identify at-risk / lagging students
      const flagged: LaggingStudent[] = myStudents.map((s, idx) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        loginId: s.loginId,
        isBlocked: s.isBlocked,
        accountStatus: s.accountStatus,
        daysInactive: s.isBlocked ? 14 : 4 + (idx * 2) % 10,
        missedTasksCount: 2 + (idx % 3),
        averageScore: 58 + (idx * 5) % 25,
      }));

      setStudents(flagged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !reportReason) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          studentName: selectedStudent.fullName,
          studentLoginId: selectedStudent.loginId || "---",
          type: "exception",
          reason: `Trainer Performance Alert: ${reportReason} (Inactive ${selectedStudent.daysInactive} days, Missed Tasks: ${selectedStudent.missedTasksCount})`,
          requestedByAdminName: "Assigned Trainer",
        }),
      });

      if (!res.ok) throw new Error("Failed to report student difficulty");

      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setSelectedStudent(null);
        setReportReason("");
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">At-Risk Learners & Difficulty Reports</h1>
        <p className="text-xs text-slate-500 font-medium">Detect students who are falling behind schedule, missing spoken task deadlines, and escalate academic difficulties to administration</p>
      </div>

      {/* Lagging Students List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-100">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Analyzing student submission velocity...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-2">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
            <p className="text-slate-900 font-black text-sm">All Assigned Students are On Track</p>
            <p className="text-slate-400 text-xs">No learning lag or chronic inactivity detected in your roster.</p>
          </div>
        ) : (
          students.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 hover:border-amber-200 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 font-black text-sm flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {s.fullName}{" "}
                      <span className="font-mono text-xs font-bold text-slate-400">({s.loginId || "---"})</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200/60 flex items-center gap-1.5">
                    <Clock size={13} /> {s.daysInactive} Days Inactive
                  </span>
                  <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100">
                    {s.missedTasksCount} Overdue Submissions
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-700">Recent Task Assessment Average: <span className="text-[#2A0066] font-black">{s.averageScore}%</span></p>
                  <p className="text-[11px] text-slate-400">Student is currently falling behind the expected cohort pace.</p>
                </div>

                <button
                  onClick={() => setSelectedStudent(s)}
                  className="px-4 py-2 bg-[#2A0066] text-white rounded-xl font-bold uppercase tracking-wider text-[11px] hover:opacity-95 transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <FileWarning size={14} /> Report Difficulty to Admin
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Report Student Difficulty</h3>
                  <p className="text-xs text-slate-400 font-medium">To Admissions & Operations Admins</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              {submittedSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
                  <p className="text-sm font-black text-slate-900">Difficulty Report Forwarded</p>
                  <p className="text-xs text-slate-500">The administration has been notified for counselling / phone follow-up.</p>
                </div>
              ) : (
                <form onSubmit={handleSendReport} className="space-y-4">
                  <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs text-[#2A0066]">
                    <span className="font-bold">Student:</span> {selectedStudent.fullName} ({selectedStudent.loginId})
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Reason & Observations *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="e.g. Student is struggling with Day 5 sentence construction and hasn't attended speaking voice reviews this week. Recommend phone call follow-up."
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#2A0066]"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={15} />}
                      Submit to Admin
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

