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
  MoreVertical,
  GripVertical,
  X,
  Loader,
} from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
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

  return (
    <div className="space-y-12 relative">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Task <span className="text-[#2A0066]">Management</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Track, prioritize, and manage all instructional and administrative tasks.
          </p>
        </div>
      </section>

      {/* Task Summary Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Pending Tasks",
            count: tasks.filter((t) => t.status === "pending").length,
            icon: <Clock size={16} />,
            color: "text-orange-600 bg-orange-50 border-orange-100",
          },
          {
            label: "Completed Action",
            count: tasks.filter((t) => t.status === "completed").length,
            icon: <CheckCircle2 size={16} />,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100",
          },
          {
            label: "Tasks In Progress",
            count: tasks.filter((t) => t.status === "in-progress").length,
            icon: <AlertCircle size={16} />,
            color: "text-blue-600 bg-blue-50 border-blue-100",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-5 rounded-[24px] border flex items-center justify-between shadow-sm ${stat.color}`}
          >
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                {stat.label}
              </p>
              <h4 className="text-2xl font-black tracking-tight">
                {stat.count}
              </h4>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              {stat.icon}
            </div>
          </div>
        ))}
      </section>

      {/* Kanban / Task List Content */}
      <section className="space-y-6 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">
            Active Workload Queue
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#2A0066] transition-colors pointer-events-none">
                <Calendar size={12} />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-700 outline-none shadow-sm cursor-pointer h-9"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#2A0066] transition shadow-sm hidden sm:block h-9 w-9 flex items-center justify-center">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-40">
              <Loader className="animate-spin text-[#2A0066]" size={32} />
              <p className="font-black text-[10px] uppercase tracking-widest mt-4">
                Loading Task Queue...
              </p>
            </div>
          ) : tasks.filter((t) => {
              if (!filterDate) return true;
              const taskAssignedDate = new Date(t.createdAt)
                .toISOString()
                .split("T")[0];
              return taskAssignedDate === filterDate;
            }).length > 0 ? (
            <div className="space-y-4">
              {tasks
                .filter((t) => {
                  if (!filterDate) return true;
                  const taskAssignedDate = new Date(t.createdAt)
                    .toISOString()
                    .split("T")[0];
                  return taskAssignedDate === filterDate;
                })
                .map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleOpenEdit(task)}
                    className="bg-white p-4 md:p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-500 relative overflow-hidden active:border-[#2A0066]/30 cursor-pointer"
                  >
                    {/* TASK LEFT */}
                    <div className="flex items-center gap-5 flex-1">
                      <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-[18px] flex items-center justify-center text-slate-400 group-hover:text-[#2A0066] group-hover:border-[#2A0066]/20 transition duration-500">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base md:text-lg font-black text-slate-900 group-hover:text-[#2A0066] transition duration-500 truncate">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <User size={12} className="text-[#2A0066]/40" />{" "}
                            {task.student?.fullName || "Unassigned"}
                          </span>
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <Calendar size={12} className="text-[#2A0066]/60" />{" "}
                            Assigned:{" "}
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                              <Clock size={12} className="text-blue-400" />{" "}
                              Deadline:{" "}
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TASK RIGHT / STATS */}
                    <div className="flex items-center gap-8 pr-4">
                      <div className="flex flex-col items-center gap-2 min-w-[100px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          Status
                        </p>
                        <span
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border whitespace-nowrap ${
                            task.status === "pending"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : task.status === "progress"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : task.status === "rejected"
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {/* Subtle border top accent */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#2A0066]/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                  </motion.div>
                ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <FileText size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-slate-400 font-bold italic text-sm">
                {filterDate
                  ? `No tasks found for ${new Date(filterDate).toLocaleDateString()}`
                  : "No active tasks in your workload queue."}
              </p>
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#2A0066] hover:underline"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2A0066]/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto h-full w-full"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] p-6 md:p-8 w-full max-w-lg shadow-2xl relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
                  Assign <span className="text-[#2A0066]">Task</span>
                </h2>
                <p className="text-slate-500 font-bold text-[11px] mt-1 uppercase tracking-wider">
                  Create a new task for your student
                </p>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Review Lab Report"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2A0066]/5 focus:border-[#2A0066] outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Assign Student
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2A0066]/5 focus:border-[#2A0066] outline-none text-xs font-bold text-slate-700 transition-all cursor-pointer"
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
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2A0066]/5 focus:border-[#2A0066] outline-none text-xs font-bold text-slate-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Description / Instructions
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Enter task details..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2A0066]/5 focus:border-[#2A0066] outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3.5 border-2 border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] px-6 py-3.5 bg-[#2A0066] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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
            className="fixed inset-0 bg-[#2A0066]/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto h-full w-full"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] p-6 md:p-8 w-full max-w-lg shadow-2xl relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
                  Edit <span className="text-[#2A0066]">Task</span>
                </h2>
                <p className="text-slate-500 font-bold text-[11px] mt-1 uppercase tracking-wider">
                  Update task details for {editingTask?.student?.fullName}
                </p>
              </div>

              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2A0066]/5 focus:border-[#2A0066] outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 transition-all font-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2A0066]/5 focus:border-[#2A0066] outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2A0066]/5 focus:border-[#2A0066] outline-none text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="progress">Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-3.5 border-2 border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] px-6 py-3.5 bg-[#2A0066] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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

      {/* FAB - Global Quick Action */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 bg-[#2A0066] text-white rounded-2xl flex items-center justify-center shadow-3xl shadow-[#2A0066]/40 hover:scale-110 active:scale-95 transition-all z-[60] border-2 border-white cursor-pointer"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
