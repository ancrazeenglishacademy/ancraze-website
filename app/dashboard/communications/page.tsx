"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Send,
  Loader,
  X,
  Trash2,
  Bell,
  Users,
  GraduationCap,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: "all" | "students" | "trainers" | "admins";
  priority: "normal" | "urgent";
  authorName: string;
  createdAt: string;
}

export default function CommunicationsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<"all" | "students" | "trainers">("students");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcements", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setModalLoading(true);
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          title,
          content,
          targetRole,
          priority,
          authorName: "Academy Administration",
        }),
      });

      if (!res.ok) throw new Error("Failed to post announcement");
      setShowModal(false);
      setTitle("");
      setContent("");
      await fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this announcement?")) return;
    try {
      await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      await fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academy Communications & Broadcasts</h1>
          <p className="text-xs text-slate-500 font-medium">Dispatch announcements, cohort reminders, and onboarding notices directly to student & trainer dashboards</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> Broadcast Announcement
        </button>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-100">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading broadcasts...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-2">
            <Megaphone size={36} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 text-xs font-bold">No announcements broadcasted yet.</p>
          </div>
        ) : (
          announcements.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        a.priority === "urgent"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {a.priority === "urgent" ? "⚠️ Urgent Notice" : "Official Notice"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                      Audience: {a.targetRole}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900">{a.title}</h3>
                </div>

                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                  title="Delete Announcement"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                {a.content}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>By {a.authorName}</span>
                <span>{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">New Broadcast Announcement</h3>
                  <p className="text-xs text-slate-400 font-medium">Publish a message to student & trainer consoles</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Announcement Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Speaking Assessment Submissions Schedule Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Target Audience
                    </label>
                    <select
                      value={targetRole}
                      onChange={(e: any) => setTargetRole(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="all">Everyone (All Users)</option>
                      <option value="students">Enrolled Students Only</option>
                      <option value="trainers">Instructors / Trainers Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="normal">Normal Information</option>
                      <option value="urgent">Urgent Alert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Message Content *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your announcement details, instructions, or deadlines..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
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
                    Broadcast Now
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

