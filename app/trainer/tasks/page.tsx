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
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";

export default function TrainerTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const trainerId = (function () {
    const userData = Cookies.get("userData");
    if (userData) {
      try {
        return JSON.parse(userData).uid;
      } catch (e) {
        return null;
      }
    }
    return null;
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

  // Lock scroll when modal is open
  useEffect(() => {
    if (isModalOpen || isEditModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isEditModalOpen]);

  const fetchStudents = async () => {
    try {
      // Use the existing student API which already supports trainerId filtering
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
    if (!taskTitle || !selectedStudentId) {
      alert("Please enter a title and select a student.");
      return;
    }

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
          studentId: selectedStudentId,
          trainerId: trainerId,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      setIsModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setSelectedStudentId("");
      setDueDate("");
      fetchTasks(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !trainerId) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          taskId: editingTask.id,
          title: editTitle,
          description: editDescription,
          status: editStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update task");

      setIsEditModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      alert("Error updating task: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!filterDate) return true;
    const taskAssignedDate = new Date(t.createdAt).toISOString().split("T")[0];
    return taskAssignedDate === filterDate;
  });

  return (
    <div className="space-y-6 md:space-y-10 pb-12 px-1 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Task <span className="text-[#2A0066]">Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Track, prioritize, and manage all instructional and administrative tasks.
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2A0066] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          Create New Task
        </button>
      </div>

      {/* Main KPI Grid - 3 cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="animate-spin text-[#2A0066]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <KPICard
            label="Pending Tasks"
            value={tasks.filter((t) => t.status === "pending").length.toString()}
            icon={<Clock size={22} />}
            percentage="Awaiting action"
          />
          <KPICard
            label="Completed Tasks"
            value={tasks.filter((t) => t.status === "completed").length.toString()}
            icon={<CheckCircle2 size={22} />}
            percentage="Done"
          />
          <KPICard
            label="Tasks In Progress"
            value={tasks.filter((t) => t.status === "in-progress" || t.status === "progress").length.toString()}
            icon={<AlertCircle size={22} />}
            percentage="Active workload"
            isHighlight
          />
        </div>
      )}

      {/* Task List Section */}
      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              Active Workload Queue
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs font-medium mt-1">
              Your assigned tasks and pending reviews
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar size={14} />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-8 bg-slate-50/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader className="animate-spin text-[#2A0066]" size={32} />
              <p className="font-bold text-slate-400 text-sm mt-4">
                Loading Task Queue...
              </p>
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleOpenEdit(task)}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066] group-hover:bg-[#2A0066] group-hover:text-white transition-all shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-[#2A0066] transition-colors line-clamp-1">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-300 hover:text-[#2A0066] transition-colors">
                      <Edit3 size={18} />
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <User size={12} className="text-[#2A0066]" />{" "}
                        {task.student?.fullName || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-l border-slate-100 pl-3">
                        <Calendar size={12} className="text-[#2A0066]" />{" "}
                        Assigned: {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-l border-slate-100 pl-3">
                          <Clock size={12} className="text-red-500" />{" "}
                          Deadline: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                        task.status === "pending"
                          ? "bg-orange-50 text-orange-600 border border-orange-100"
                          : task.status === "progress" || task.status === "in-progress"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : task.status === "rejected"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <FileText size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold text-sm">
                {filterDate
                  ? `No tasks found for ${new Date(filterDate).toLocaleDateString()}`
                  : "No active tasks in your workload queue."}
              </p>
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="mt-4 text-[11px] font-black uppercase tracking-widest text-[#2A0066] hover:underline"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2A0066]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-lg shadow-2xl relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Assign <span className="text-[#2A0066]">Task</span>
                </h2>
                <p className="text-slate-500 font-medium text-sm mt-1">
                  Create a new task for your student
                </p>
              </div>

              <form onSubmit={handleAddTask} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Review Lab Report"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none text-sm font-bold text-slate-700 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Assign Student
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none text-sm font-bold text-slate-700 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Select a student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none text-sm font-bold text-slate-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Description / Instructions
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Enter task details..."
                    rows={3}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none text-sm font-bold text-slate-700 resize-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <>
                        Assign Task <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2A0066]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-lg shadow-2xl relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Edit <span className="text-[#2A0066]">Task</span>
                </h2>
                <p className="text-slate-500 font-medium text-sm mt-1">
                  Update task details for {editingTask?.student?.fullName}
                </p>
              </div>

              <form onSubmit={handleUpdateTask} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none text-sm font-bold text-slate-700 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none text-sm font-bold text-slate-700 resize-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none text-sm font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="progress">Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <>
                        Update Task <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Responsive Helper Components ---

function KPICard({
  label,
  value,
  icon,
  percentage,
  isHighlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  percentage: string;
  isHighlight?: boolean;
}) {
  return (
    <motion.div className="p-5 md:p-7 rounded-2xl cursor-pointer border transition-all duration-300 bg-white border-slate-100 shadow-sm hover:shadow-md ">
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div
          className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl ${isHighlight ? "bg-[#2A0066] text-white" : "bg-[#2A0066]/5 text-[#2A0066]"}`}
        >
          {icon}
        </div>
        <button className="text-slate-300 cursor-pointer">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div>
        <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]">
          {label}
        </p>
        <h4 className="text-xl md:text-3xl font-black text-slate-900 mt-1">
          {value}
        </h4>
        <p
          className={`text-[9px] md:text-[10px] font-bold mt-2 ${isHighlight ? "text-[#2A0066]" : "text-slate-400"}`}
        >
          {percentage}
        </p>
      </div>
    </motion.div>
  );
}
