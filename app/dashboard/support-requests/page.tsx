"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Send,
  Loader,
  X,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupportRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentLoginId: string;
  type: "refund" | "account_closure" | "exception";
  reason: string;
  amount?: number;
  status: "pending" | "approved" | "rejected";
  requestedByAdminName: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function SupportRequestsPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [requestType, setRequestType] = useState<"refund" | "exception">("refund");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // 1. Fetch Requests
      const rRes = await fetch("/api/requests", { headers });
      const rData = await rRes.json();
      setRequests(rData.requests || []);

      // 2. Fetch Students for dropdown
      const sRes = await fetch("/api/students?role=student", { headers });
      const sData = await sRes.json();
      setStudents(sData.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !reason) return;

    const student = students.find((s) => s.id === selectedStudentId);

    try {
      setModalLoading(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          studentName: student?.fullName || "Student",
          studentLoginId: student?.loginId || "---",
          type: requestType,
          amount: amount ? Number(amount) : null,
          reason,
          requestedByAdminName: "Admissions Admin",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit request");
      setShowModal(false);
      setSelectedStudentId("");
      setAmount("");
      setReason("");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Enquiries & Escalations</h1>
          <p className="text-xs text-slate-500 font-medium">Handle student support cases and escalate fee refund or exceptional policy requests directly to Super Admin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> Escalate Refund Request
        </button>
      </div>

      {/* Requests History List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-100">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-2">
            <HelpCircle size={36} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 text-xs font-bold">No active escalations recorded.</p>
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      r.type === "refund" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-[#2A0066]"
                    }`}
                  >
                    {r.type === "refund" ? <DollarSign size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                      {r.type === "refund" ? "Fee Refund Request" : "Policy Exception Request"} — {r.studentName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Student ID: {r.studentLoginId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {r.amount && (
                    <span className="text-sm font-black text-[#2A0066] px-2.5 py-1 bg-purple-50 rounded-xl">
                      ₹{r.amount.toLocaleString()}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      r.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : r.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                <span className="font-bold text-slate-400 block mb-1">Reason:</span>
                <p className="font-medium">{r.reason}</p>
              </div>

              {r.resolutionNotes && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-[#2A0066]">
                  <span className="font-bold">Super Admin Feedback:</span> {r.resolutionNotes}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Raised on {new Date(r.createdAt).toLocaleDateString()}</span>
                {r.resolvedAt && <span>Resolved on {new Date(r.resolvedAt).toLocaleDateString()}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Raise Escalation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Escalate to Super Admin</h3>
                  <p className="text-xs text-slate-400 font-medium">Forward refund or exceptional requests</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Select Student *
                  </label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="">Choose Student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.loginId || s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Request Type
                    </label>
                    <select
                      value={requestType}
                      onChange={(e: any) => setRequestType(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="refund">Fee Refund</option>
                      <option value="exception">Policy Exception</option>
                    </select>
                  </div>

                  {requestType === "refund" && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Refund Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 3000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Reason & Student Enquiry Details *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe student's request, eligibility, and administrative justification..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader size={16} className="animate-spin" /> : <Send size={15} />}
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

