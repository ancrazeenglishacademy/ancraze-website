"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  MessageCircleQuestion,
  Search,
  Send,
  Loader,
  User,
  Clock,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface SupportThread {
  id: string;
  studentName: string;
  studentLoginId: string;
  topic: string;
  question: string;
  answer?: string;
  status: "open" | "answered";
  createdAt: string;
}

export default function TrainerSupportPage() {
  const [threads, setThreads] = useState<SupportThread[]>([
    {
      id: "thread-1",
      studentName: "Ananya Sharma",
      studentLoginId: "ANC-920412",
      topic: "Day 4: Consonant Clusters Pronunciation",
      question: "Trainer sir, I am finding it difficult to articulate 'th' in words like 'thought' vs 'taught'. Can you share a tongue placement exercise?",
      answer: "Place the tip of your tongue slightly between your upper and lower teeth and blow air gently without voicing. Listen to Day 4 audio snippet at 03:15 for exact mouth shape demonstration.",
      status: "answered",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "thread-2",
      studentName: "Rahul Verma",
      studentLoginId: "ANC-741982",
      topic: "Day 6: Business Presentation Task",
      question: "Should I record the audio task in one continuous take or can I pause between slides?",
      status: "open",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"all" | "open" | "answered">("all");

  const handleReply = (threadId: string) => {
    const text = replyText[threadId];
    if (!text) return;

    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, answer: text, status: "answered" } : t
      )
    );

    setReplyText({ ...replyText, [threadId]: "" });
  };

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || t.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Learning Support & Guidance</h1>
        <p className="text-xs text-slate-500 font-medium">Answer learning-related questions, clarify pronunciation doubts, and guide your assigned learners through their lessons</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: "all", label: "All Questions" },
          { id: "open", label: "Awaiting Reply" },
          { id: "answered", label: "Answered" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Questions Feed */}
      <div className="space-y-4">
        {filteredThreads.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] font-black text-sm flex items-center justify-center">
                  {t.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t.studentName}{" "}
                    <span className="font-mono text-xs text-slate-400 font-bold">({t.studentLoginId})</span>
                  </h3>
                  <p className="text-[11px] text-purple-700 font-bold">{t.topic}</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  t.status === "open"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {t.status === "open" ? "Needs Response" : "Resolved"}
              </span>
            </div>

            {/* Question Text */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed">
              <span className="font-bold text-slate-400 block mb-1">Student Inquiry:</span>
              "{t.question}"
            </div>

            {/* Existing Answer or Input Form */}
            {t.answer ? (
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs text-[#2A0066] space-y-1">
                <span className="font-black text-[11px] uppercase tracking-wider block">Your Guidance:</span>
                <p className="font-medium leading-relaxed">{t.answer}</p>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <textarea
                  rows={3}
                  placeholder="Type corrective guidance, pronunciation tips, or module references..."
                  value={replyText[t.id] || ""}
                  onChange={(e) => setReplyText({ ...replyText, [t.id]: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#2A0066]"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleReply(t.id)}
                    className="px-4 py-2 bg-[#2A0066] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition flex items-center gap-1.5 shadow-md shadow-[#2A0066]/15"
                  >
                    <Send size={13} /> Send Guidance Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

