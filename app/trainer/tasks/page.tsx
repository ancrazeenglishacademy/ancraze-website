"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
  User,
  ArrowRight,
  MoreHorizontal,
  X,
  Loader,
  Edit3,
  Mic,
  RotateCcw,
  Check,
  MessageSquare,
  Award,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  taskType?: "assignment" | "exercise" | "quiz" | "speaking_recording";
  studentId: string;
  student?: {
    id: string;
    fullName: string;
    email: string;
    loginId?: string;
  };
  status: "pending" | "submitted" | "approved" | "needs_correction" | "completed";
  submission?: string;
  audioRecordingUrl?: string;
  trainerFeedback?: string;
  score?: number;
  dueDate?: string;
  createdAt: string;
}

export default function TrainerTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  // Create Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskType, setTaskType] = useState<"assignment" | "exercise" | "quiz" | "speaking_recording">("assignment");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Evaluate Task Modal
  const [evaluatingTask, setEvaluatingTask] = useState<TaskItem | null>(null);
  const [evalScore, setEvalScore] = useState<string>("");
  const [evalFeedback, setEvalFeedback] = useState<string>("");
  const [evaluatingLoading, setEvaluatingLoading] = useState(false);

  const trainerId = (function () {
    const userData = Cookies.get("userData");
    if (userData) {
      try {
        return JSON.parse(userData).uid;
      } catch (e) {
        return null;
      }
    }
    return Cookies.get("uid") || null;
  })();

  useEffect(() => {
    if (trainerId) {
      fetchTasks();
      fetchStudents();
    }
  }, [trainerId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks?trainerId=${trainerId}`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/students?trainerId=${trainerId}`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !selectedStudentId) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          taskType,
          studentId: selectedStudentId,
          trainerId,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to assign task");

      setIsModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setSelectedStudentId("");
      setDueDate("");
      await fetchTasks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluateDecision = async (decision: "approved" | "needs_correction") => {
    if (!evaluatingTask) return;

    try {
      setEvaluatingLoading(true);
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          taskId: evaluatingTask.id,
          status: decision,
          score: evalScore ? Number(evalScore) : evaluatingTask.score || 85,
          trainerFeedback: evalFeedback,
        }),
      });

      if (!res.ok) throw new Error("Failed to evaluate task");

      setEvaluatingTask(null);
      setEvalScore("");
      setEvalFeedback("");
      await fetchTasks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEvaluatingLoading(false);
    }
  };

  const openEvaluation = (task: TaskItem) => {
    setEvaluatingTask(task);
    setEvalScore(task.score ? task.score.toString() : "85");
    setEvalFeedback(task.trainerFeedback || "");
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterType === "all") return true;
    return t.status === filterType;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending" || t.status === "submitted").length;
  const approvedCount = tasks.filter((t) => t.status === "approved" || t.status === "completed").length;
  const needsCorrectionCount = tasks.filter((t) => t.status === "needs_correction").length;

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Task Evaluation & Spoken Audio Review
          </h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium">
            Review submitted assignments, listen to speaking recordings, grade quizzes, and approve or return tasks for correction.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#2A0066] text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#2A0066]/20 hover:opacity-95 transition cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} /> Assign New Task
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Awaiting Review</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">Pending Evaluation</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approved Tasks</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">Passed with SLA</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Returned for Correction</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <RotateCcw size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600">{needsCorrectionCount}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">Resubmission Required</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: "all", label: "All Tasks" },
          { id: "pending", label: "Pending Evaluation" },
          { id: "approved", label: "Approved" },
          { id: "needs_correction", label: "Needs Correction" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition ${
              filterType === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Queue Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-100">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading instructional tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-2">
            <FileText size={36} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 text-xs font-bold">No tasks found under this filter.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 hover:border-purple-200 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#2A0066] border border-purple-100">
                      {task.taskType === "speaking_recording"
                        ? "🎙️ Speaking Recording"
                        : task.taskType === "quiz"
                        ? "📝 Quiz Assessment"
                        : task.taskType === "exercise"
                        ? "✍️ Grammar Exercise"
                        : "📄 Written Assignment"}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        task.status === "approved" || task.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : task.status === "needs_correction"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900">{task.title}</h3>

                  <p className="text-xs text-slate-500 font-medium">
                    Student: <span className="font-bold text-slate-800">{task.student?.fullName || "Student"}</span>{" "}
                    {task.student?.loginId && (
                      <span className="font-mono text-[11px] text-slate-400 font-bold">
                        ({task.student.loginId})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {task.score !== undefined && task.score !== null && (
                    <span className="px-3 py-1.5 bg-purple-50 text-[#2A0066] rounded-xl text-xs font-black">
                      Score: {task.score}/100
                    </span>
                  )}
                  <button
                    onClick={() => openEvaluation(task)}
                    className="px-4 py-2 bg-[#2A0066] text-white hover:opacity-95 rounded-xl text-xs font-bold transition shadow-md shadow-[#2A0066]/15 flex items-center gap-1.5"
                  >
                    <CheckSquare size={14} /> Evaluate & Grade
                  </button>
                </div>
              </div>

              {/* Task Instructions */}
              {task.description && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-bold text-slate-400 block mb-0.5">Prompt:</span>
                  <p className="font-medium">{task.description}</p>
                </div>
              )}

              {/* Audio Player if Speaking Task */}
              {task.audioRecordingUrl && (
                <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center gap-3">
                  <Volume2 size={20} className="text-[#2A0066]" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#2A0066] mb-1">Student Speaking Voice Submission</p>
                    <audio controls className="w-full h-8" src={task.audioRecordingUrl} />
                  </div>
                </div>
              )}

              {/* Trainer Feedback snippet if evaluated */}
              {task.trainerFeedback && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                  <MessageSquare size={14} className="text-[#2A0066] mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-bold text-slate-700">Your Feedback:</span> {task.trainerFeedback}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Evaluate & Grade Modal */}
      <AnimatePresence>
        {evaluatingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Evaluate Task Submission</h3>
                  <p className="text-xs text-slate-400 font-medium">Student: {evaluatingTask.student?.fullName}</p>
                </div>
                <button
                  onClick={() => setEvaluatingTask(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Task Title</span>
                  <p className="text-xs font-bold text-slate-900">{evaluatingTask.title}</p>
                </div>

                {/* Audio Recording Review */}
                {evaluatingTask.audioRecordingUrl ? (
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#2A0066] tracking-wider block">
                      🎙️ Spoken Recording Playback
                    </span>
                    <audio controls className="w-full" src={evaluatingTask.audioRecordingUrl} />
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-400 block mb-1">Student Written Submission:</span>
                    <p className="font-medium italic leading-relaxed">
                      {evaluatingTask.submission || "No written text submitted. Verify verbal/audio submission."}
                    </p>
                  </div>
                )}

                {/* Score Input */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Score (out of 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    value={evalScore}
                    onChange={(e) => setEvalScore(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                {/* Trainer Correction Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Instructional Feedback & Correction Notes *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide constructive feedback on pronunciation, grammar, vocabulary, or slide flow..."
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={evaluatingLoading}
                  onClick={() => handleEvaluateDecision("needs_correction")}
                  className="flex-1 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={15} /> Return for Correction
                </button>
                <button
                  type="button"
                  disabled={evaluatingLoading}
                  onClick={() => handleEvaluateDecision("approved")}
                  className="flex-1 py-3 bg-[#2A0066] text-white hover:opacity-95 rounded-xl text-xs font-bold transition shadow-md shadow-[#2A0066]/15 flex items-center justify-center gap-1.5"
                >
                  {evaluatingLoading ? <Loader size={15} className="animate-spin" /> : <Check size={15} />}
                  Approve Completed Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Assign Task / Speaking Exercise</h3>
                  <p className="text-xs text-slate-400 font-medium">Issue task directly to your allocated student</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Select Allocated Student *
                  </label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="">Select a student...</option>
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
                      Task Type
                    </label>
                    <select
                      value={taskType}
                      onChange={(e: any) => setTaskType(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="speaking_recording">🎙️ Speaking Voice Recording</option>
                      <option value="assignment">📄 Written Assignment</option>
                      <option value="exercise">✍️ Grammar Exercise</option>
                      <option value="quiz">📝 Quiz Evaluation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Day 4: 2-Minute Speech on Future Ambitions"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Instructions / Guidelines
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific guidelines, pronunciation points to emphasize, or word count..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader size={16} className="animate-spin" /> : "Assign Task"}
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
