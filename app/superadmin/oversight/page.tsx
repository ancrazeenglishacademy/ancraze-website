"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  UserX,
  AlertTriangle,
  Loader,
  RefreshCw,
  Search,
  Filter,
  FileText,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OversightRequest {
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

export default function SuperAdminOversightPage() {
  const [requests, setRequests] = useState<OversightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "all"
          ? "/api/requests"
          : `/api/requests?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch oversight requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      setActionLoading(requestId);
      const notes = resolutionNotes[requestId] || "";

      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          requestId,
          status,
          resolutionNotes: notes,
          resolvedBy: "Super Administrator",
        }),
      });

      if (!res.ok) throw new Error("Failed to resolve request");
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to submit decision");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Oversight & Approvals</h1>
          <p className="text-xs text-slate-500 font-medium">Review and authorize student fee refunds, permanent account closures, and exceptional administrative actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRequests()}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Refresh List"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: "pending", label: "Pending Approvals" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
          { id: "all", label: "All Requests" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition ${
              statusFilter === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-100">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading requests queue...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-2">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-slate-900">All Clear</h3>
            <p className="text-xs text-slate-400 font-medium">No {statusFilter} requests requiring attention.</p>
          </div>
        ) : (
          requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl ${
                      req.type === "refund"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {req.type === "refund" ? <DollarSign size={20} /> : <UserX size={20} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {req.type === "refund" ? "Fee Refund Request" : "Account Closure Request"}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          req.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : req.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900">
                      Student: {req.studentName}{" "}
                      <span className="text-xs font-mono font-bold text-slate-400">
                        ({req.studentLoginId})
                      </span>
                    </h3>

                    <p className="text-xs text-slate-500">
                      Submitted by Admin: <span className="font-bold text-slate-700">{req.requestedByAdminName}</span> on{" "}
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {req.type === "refund" && req.amount && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-right self-start">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Refund Amount</span>
                    <span className="text-xl font-black text-[#2A0066]">₹{req.amount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Justification Reason */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-500 block mb-1">Administrative Justification / Reason:</span>
                <p className="text-slate-800 font-medium leading-relaxed">{req.reason}</p>
              </div>

              {/* Resolution or Action Footer */}
              {req.status === "pending" ? (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <input
                    type="text"
                    placeholder="Optional notes or feedback for admin & records..."
                    value={resolutionNotes[req.id] || ""}
                    onChange={(e) =>
                      setResolutionNotes({ ...resolutionNotes, [req.id]: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] text-slate-900"
                  />

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => handleResolve(req.id, "rejected")}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <XCircle size={15} /> Reject Request
                    </button>
                    <button
                      onClick={() => handleResolve(req.id, "approved")}
                      disabled={actionLoading === req.id}
                      className="px-5 py-2 bg-[#2A0066] text-white hover:opacity-95 rounded-xl text-xs font-bold transition shadow-md shadow-[#2A0066]/15 flex items-center gap-1.5"
                    >
                      {actionLoading === req.id ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}
                      Authorize & Approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                  <span>Resolved on {req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString() : "---"}</span>
                  {req.resolutionNotes && (
                    <span className="italic text-slate-600">Note: "{req.resolutionNotes}"</span>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

