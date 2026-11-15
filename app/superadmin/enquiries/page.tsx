"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Trash2,
  ExternalLink,
  Copy,
  BookOpen,
  User,
  Check,
  X,
  FileText,
  ChevronDown,
  Download,
} from "lucide-react";

interface Enquiry {
  id: string;
  fullName: string;
  phone: string;
  course: string;
  message: string;
  status: "new" | "contacted" | "enrolled" | "closed";
  notes?: string;
  source?: string;
  createdAt: string;
  createdAtMs?: number;
}

export default function SuperAdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/enquiry");
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data.enquiries || []);
      }
    } catch (err) {
      console.error("Failed to load enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: "new" | "contacted" | "enrolled" | "closed") => {
    // Optimistic UI update
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );

    try {
      await fetch("/api/enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchEnquiries();
    }
  };

  const handleSaveNote = async (id: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, notes: tempNote } : e))
    );
    setEditingNoteId(null);

    try {
      await fetch("/api/enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: tempNote }),
      });
    } catch (err) {
      console.error("Failed to save note:", err);
      fetchEnquiries();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/enquiry?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (enquiries.length === 0) return;
    const headers = ["Full Name", "Phone", "Course", "Status", "Date", "Message", "Notes"];
    const rows = enquiries.map((e) => [
      `"${e.fullName.replace(/"/g, '""')}"`,
      `"${e.phone.replace(/"/g, '""')}"`,
      `"${e.course.replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${new Date(e.createdAt).toLocaleString()}"`,
      `"${(e.message || "").replace(/"/g, '""')}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ancraze_enquiries_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === "new").length;
  const contactedCount = enquiries.filter((e) => e.status === "contacted").length;
  const enrolledCount = enquiries.filter((e) => e.status === "enrolled").length;

  // Unique Courses for filter
  const uniqueCourses = Array.from(new Set(enquiries.map((e) => e.course).filter(Boolean)));

  // Filtered Enquiries
  const filteredEnquiries = enquiries.filter((e) => {
    const matchesSearch =
      e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesCourse = courseFilter === "all" || e.course === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#180036] via-[#2A0066] to-[#4A0E78] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#2A0066]/15 border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-black uppercase tracking-widest border border-amber-400/30">
              <Sparkles size={14} /> Lead & Admission Intake
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Admission Enquiries
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Real-time prospective learner enquiries submitted from website forms. Contact applicants directly via WhatsApp or phone call.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={enquiries.length === 0}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={fetchEnquiries}
              className="px-4 py-2.5 bg-white text-[#2A0066] hover:bg-slate-100 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div
          onClick={() => setStatusFilter("all")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-white border-[#2A0066] shadow-md ring-2 ring-[#2A0066]/10"
              : "bg-white border-slate-100 hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enquiries</span>
            <div className="p-2 rounded-xl bg-purple-50 text-[#2A0066]">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">All Time</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("new")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "new"
              ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-white border-slate-100 hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">New Leads</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 relative">
              <Clock size={18} />
              {newCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{newCount}</span>
            <span className="text-xs text-amber-600/80 font-bold">Require Attention</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("contacted")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "contacted"
              ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20"
              : "bg-white border-slate-100 hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Contacted</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Phone size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{contactedCount}</span>
            <span className="text-xs text-slate-400 font-medium">In Discussion</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("enrolled")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "enrolled"
              ? "bg-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20"
              : "bg-white border-slate-100 hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Enrolled</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{enrolledCount}</span>
            <span className="text-xs text-emerald-600/80 font-bold">Converted</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(["all", "new", "contacted", "enrolled", "closed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Course Dropdown */}
          {uniqueCourses.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#2A0066]"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Enquiries Grid / List */}
      {loading ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-[#2A0066] mx-auto" />
          <p className="text-sm font-bold text-slate-600">Loading admission enquiries...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="w-14 h-14 bg-purple-50 text-[#2A0066] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-base font-black text-slate-800">No Enquiries Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all" || courseFilter !== "all"
              ? "No enquiries match your current search or filter criteria."
              : "When prospective students submit the Quick Enquiry form on the website, they will appear here in real time."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnquiries.map((enquiry) => {
            const cleanPhone = enquiry.phone.replace(/[^0-9]/g, "");
            const whatsappText = encodeURIComponent(
              `Hello ${enquiry.fullName}, thank you for your enquiry at Ancraze English Academy regarding the ${enquiry.course}. We are pleased to assist you with course details and admission!`
            );
            const whatsappLink = `https://wa.me/${cleanPhone}?text=${whatsappText}`;

            return (
              <div
                key={enquiry.id}
                className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-5"
              >
                {/* Left: Applicant details */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] flex items-center justify-center font-black text-lg shrink-0">
                    {enquiry.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        {enquiry.fullName}
                      </h3>
                      {/* Status Selector */}
                      <div className="relative inline-block">
                        <select
                          value={enquiry.status}
                          onChange={(e) =>
                            handleStatusChange(enquiry.id, e.target.value as any)
                          }
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full cursor-pointer focus:outline-none border ${
                            enquiry.status === "new"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : enquiry.status === "contacted"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                              : enquiry.status === "enrolled"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          <option value="new">● New</option>
                          <option value="contacted">● Contacted</option>
                          <option value="enrolled">● Enrolled</option>
                          <option value="closed">● Closed</option>
                        </select>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 ml-auto md:ml-0">
                        <Calendar size={12} />
                        {new Date(enquiry.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Course Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-[#2A0066] text-xs font-bold border border-purple-100">
                        <BookOpen size={13} />
                        {enquiry.course}
                      </span>
                    </div>

                    {/* Message */}
                    {enquiry.message && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-700">Message: </span>
                        &ldquo;{enquiry.message}&rdquo;
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div className="pt-1">
                      {editingNoteId === enquiry.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Add internal remarks/notes..."
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#2A0066]"
                          />
                          <button
                            onClick={() => handleSaveNote(enquiry.id)}
                            className="p-1.5 bg-[#2A0066] text-white rounded-lg text-xs font-bold hover:bg-[#3D0099]"
                            title="Save note"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          {enquiry.notes ? (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                              <strong>Note:</strong> {enquiry.notes}
                            </span>
                          ) : null}
                          <button
                            onClick={() => {
                              setEditingNoteId(enquiry.id);
                              setTempNote(enquiry.notes || "");
                            }}
                            className="text-[11px] font-bold text-[#2A0066] hover:underline"
                          >
                            {enquiry.notes ? "Edit note" : "+ Add internal note"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Contact & Action Buttons */}
                <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      title="Open WhatsApp Chat"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${enquiry.phone}`}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      title="Direct Phone Call"
                    >
                      <Phone size={14} />
                      <span>Call</span>
                    </a>

                    <button
                      onClick={() => handleCopyPhone(enquiry.id, enquiry.phone)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition"
                      title="Copy phone number"
                    >
                      {copiedId === enquiry.id ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>

                    <button
                      onClick={() => setDeleteTarget(enquiry)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      title="Delete enquiry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 hidden md:block">
                    {enquiry.phone}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 size={22} />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Delete Enquiry</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete the enquiry from{" "}
                  <strong className="text-slate-800">{deleteTarget.fullName}</strong> ({deleteTarget.phone})?
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-2"
                >
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
