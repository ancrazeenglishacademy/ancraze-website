"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  Users,
  Plus,
  Search,
  Shield,
  GraduationCap,
  Loader,
  X,
  Trash2,
  Edit2,
  Mail,
  Calendar,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "trainer" | "superadmin";
  assignedStudentCount?: number;
  createdAt: string;
}

export default function SuperAdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "trainer">("trainer");

  useEffect(() => {
    fetchStaffAndWorkloads();
  }, []);

  const fetchStaffAndWorkloads = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // 1. Fetch users
      const usersRes = await fetch("/api/users", { headers });
      if (!usersRes.ok) throw new Error("Failed to fetch staff");
      const usersData = await usersRes.json();
      const allUsers: any[] = usersData.users || [];

      // Filter staff: admin, trainer, superadmin
      const staffOnly = allUsers.filter(
        (u) => u.role === "admin" || u.role === "trainer" || u.role === "superadmin"
      );

      // 2. Fetch all students to count workloads
      const studentsRes = await fetch("/api/students?role=student", { headers });
      let students: any[] = [];
      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        students = sData.students || [];
      }

      // Map workloads
      const workloadMap = new Map<string, number>();
      students.forEach((s) => {
        if (s.trainerId) {
          workloadMap.set(s.trainerId, (workloadMap.get(s.trainerId) || 0) + 1);
        }
      });

      const formattedStaff: StaffMember[] = staffOnly.map((st) => ({
        id: st.id,
        fullName: st.fullName,
        email: st.email,
        role: st.role,
        assignedStudentCount: workloadMap.get(st.id) || 0,
        createdAt: st.createdAt,
      }));

      setStaffList(formattedStaff);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    try {
      setModalLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      // Update role
      const uid = data.user?.uid;
      if (uid) {
        await fetch("/api/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
          },
          body: JSON.stringify({ userId: uid, role }),
        });
      }

      setShowAddModal(false);
      setFullName("");
      setEmail("");
      setPassword("");
      await fetchStaffAndWorkloads();
    } catch (err: any) {
      alert(err.message || "Failed to add staff member");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedStaff) return;
    try {
      setModalLoading(true);
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({ userId: selectedStaff.id, role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");
      setShowEditModal(false);
      setSelectedStaff(null);
      await fetchStaffAndWorkloads();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member ${name}?`)) return;
    try {
      const res = await fetch(`/api/students?studentId=${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });

      if (!res.ok) throw new Error("Failed to remove staff member");
      await fetchStaffAndWorkloads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredStaff = staffList.filter((st) => {
    const matchesSearch =
      st.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || st.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Management & Workload Balancing</h1>
          <p className="text-xs text-slate-500 font-medium">Create administrator and trainer accounts, define permissions, and monitor active student capacities</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Staff Account
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Staff Roles</option>
            <option value="trainer">Trainers (Instructors)</option>
            <option value="admin">Admins (Operations)</option>
            <option value="superadmin">Super Administrators</option>
          </select>
        </div>
      </div>

      {/* Staff Workload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading staff rosters & workloads...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-xs font-bold">
            No staff accounts found.
          </div>
        ) : (
          filteredStaff.map((st) => (
            <div
              key={st.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] font-black text-sm flex items-center justify-center">
                      {st.fullName?.charAt(0) || "S"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">{st.fullName}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">{st.email}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      st.role === "superadmin"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : st.role === "admin"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-purple-100 text-[#2A0066] border border-purple-200"
                    }`}
                  >
                    {st.role}
                  </span>
                </div>

                {st.role === "trainer" && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Active Student Workload</span>
                      <span className="text-[#2A0066] font-black">{st.assignedStudentCount || 0} Students</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (st.assignedStudentCount || 0) > 20
                            ? "bg-rose-500"
                            : (st.assignedStudentCount || 0) > 10
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, ((st.assignedStudentCount || 0) / 25) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Capacity target: 25 students</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium text-[11px]">
                  Joined {new Date(st.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedStaff(st);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-[#2A0066] rounded-xl hover:bg-slate-50 transition"
                    title="Change Role"
                  >
                    <Edit2 size={15} />
                  </button>
                  {st.role !== "superadmin" && (
                    <button
                      onClick={() => handleDeleteStaff(st.id, st.fullName)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                      title="Remove Account"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Create Staff Account</h3>
                  <p className="text-xs text-slate-400 font-medium">Provision a new Admin or Trainer account</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rachel@ancraze.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Role & Permissions *
                  </label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="trainer">Trainer (Student support & task evaluation)</option>
                    <option value="admin">Admin (Student operations & admissions)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader size={16} className="animate-spin" /> : "Create Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Update Role: {selectedStaff.fullName}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {["trainer", "admin", "superadmin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleUpdateRole(r)}
                    disabled={modalLoading}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-left border transition capitalize ${
                      selectedStaff.role === r
                        ? "bg-[#2A0066] text-white border-[#2A0066]"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

