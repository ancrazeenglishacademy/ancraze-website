"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  Users,
  Search,
  Filter,
  Loader,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

interface Student {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  trainerId?: string;
  trainerName?: string;
  enrolledCoursesDetails?: any[];
}

interface Trainer {
  id: string;
  fullName: string;
  email: string;
  studentCount: number;
}

export default function TrainerAllocationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrainer, setFilterTrainer] = useState("all");

  // Selection for bulk re-assignment
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetTrainerId, setTargetTrainerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchAllocationsData();
  }, []);

  const fetchAllocationsData = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // 1. Fetch Students
      const sRes = await fetch("/api/students?role=student", { headers });
      const sData = await sRes.json();
      const allStudents: Student[] = sData.students || [];
      setStudents(allStudents);

      // 2. Fetch Trainers
      const uRes = await fetch("/api/users?role=trainer", { headers });
      const uData = await uRes.json();
      const allTrainers = uData.users || [];

      // Calculate student count per trainer
      const countsMap = new Map<string, number>();
      allStudents.forEach((s) => {
        if (s.trainerId) {
          countsMap.set(s.trainerId, (countsMap.get(s.trainerId) || 0) + 1);
        }
      });

      const formattedTrainers: Trainer[] = allTrainers.map((t: any) => ({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        studentCount: countsMap.get(t.id) || 0,
      }));

      setTrainers(formattedTrainers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStudentIds.length === 0 || !targetTrainerId) return;

    try {
      setAssigning(true);
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          trainerId: targetTrainerId,
        }),
      });

      if (!res.ok) throw new Error("Failed to assign students");
      setSelectedStudentIds([]);
      setTargetTrainerId("");
      await fetchAllocationsData();
    } catch (err: any) {
      alert(err.message || "Failed to complete allocation");
    } finally {
      setAssigning(false);
    }
  };

  const handleSingleAssign = async (studentId: string, trainerId: string) => {
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId,
          trainerId: trainerId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to reassign trainer");
      await fetchAllocationsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loginId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrainer =
      filterTrainer === "all"
        ? true
        : filterTrainer === "unassigned"
        ? !s.trainerId
        : s.trainerId === filterTrainer;

    return matchesSearch && matchesTrainer;
  });

  const unassignedCount = students.filter((s) => !s.trainerId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trainer Allocation & Capacity</h1>
          <p className="text-xs text-slate-500 font-medium">Assign admitted students to personal trainers and rebalance cohorts dynamically</p>
        </div>
        {unassignedCount > 0 && (
          <span className="px-3.5 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-xs font-black flex items-center gap-1.5">
            <AlertCircle size={15} /> {unassignedCount} Students Need Trainers
          </span>
        )}
      </div>

      {/* Trainer Workload Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {trainers.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-black text-slate-900 truncate">{t.fullName}</p>
              <p className="text-[10px] text-slate-400 font-medium">Instructor</p>
            </div>
            <span className="px-2 py-1 bg-[#2A0066]/10 text-[#2A0066] text-xs font-black rounded-lg">
              {t.studentCount}
            </span>
          </div>
        ))}
      </div>

      {/* Bulk Allocation Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="p-4 bg-[#2A0066] text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wider">
            {selectedStudentIds.length} Student(s) Selected for Allocation
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={targetTrainerId}
              onChange={(e) => setTargetTrainerId(e.target.value)}
              className="px-3 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-xs font-bold outline-none cursor-pointer"
            >
              <option value="" className="text-slate-900">Select Target Trainer</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id} className="text-slate-900">
                  {t.fullName} ({t.studentCount} active)
                </option>
              ))}
            </select>

            <button
              onClick={handleBulkAssign}
              disabled={assigning || !targetTrainerId}
              className="px-4 py-2 bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-300 transition disabled:opacity-50"
            >
              {assigning ? "Assigning..." : "Apply Allocation"}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={filterTrainer}
            onChange={(e) => setFilterTrainer(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Rosters</option>
            <option value="unassigned">⚠️ Unassigned Only</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}'s Students
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Allocation Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading allocation list...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold">
            No students found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedStudentIds.length > 0 &&
                        selectedStudentIds.length === filteredStudents.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds(filteredStudents.map((s) => s.id));
                        } else {
                          setSelectedStudentIds([]);
                        }
                      }}
                      className="rounded text-[#2A0066]"
                    />
                  </th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Student ID</th>
                  <th className="px-5 py-4">Enrolled Course</th>
                  <th className="px-5 py-4">Current Trainer</th>
                  <th className="px-5 py-4 text-right">Quick Reassign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds([...selectedStudentIds, s.id]);
                            } else {
                              setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id));
                            }
                          }}
                          className="rounded text-[#2A0066]"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{s.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {s.loginId || "---"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {s.enrolledCoursesDetails?.[0]?.title || "General"}
                      </td>
                      <td className="px-5 py-4">
                        {s.trainerId ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#2A0066] border border-purple-100">
                            {s.trainerName || "Assigned Trainer"}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <select
                          value={s.trainerId || ""}
                          onChange={(e) => handleSingleAssign(s.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="">None (Unassigned)</option>
                          {trainers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

