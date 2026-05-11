"use client";
import { useState, useEffect } from "react";
import {
  Search,
  User,
  Calendar,
  X,
  Loader,
  Users,
  ChevronRight,
  SearchX,
  ShieldAlert,
  Edit2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface AppUser {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  role: string;
  createdAt: string;
  createdByAdminName?: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [modalLoading, setModalLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState("user");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setModalLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({ userId: userToEdit.id, role: editRole }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role");

      alert("User role updated successfully!");
      setShowEditModal(false);
      setUserToEdit(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredUsers = (users || []).filter((u) => {
    const matchesSearch =
      u?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u?.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            User <span className="text-[#2A0066]">Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Manage roles, permissions, and accounts across the platform.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#2A0066]/5 text-[#2A0066] rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Total Users
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {users.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium cursor-pointer text-slate-700 min-w-[160px]"
        >
          <option value="all">All Roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="trainer">Trainer</option>
          <option value="user">User</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  User
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Role
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Joined
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader
                        className="animate-spin text-[#2A0066]"
                        size={32}
                      />
                      <p className="text-slate-500 font-medium">
                        Loading users...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <SearchX size={48} />
                      <p className="text-lg font-bold">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">
                            {user.fullName || "Unnamed User"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <span>{user.email}</span>
                            {user.role === "student" &&
                              user.createdByAdminName && (
                                <>
                                  <span className="hidden sm:inline text-slate-300">
                                    •
                                  </span>
                                  <span className="text-emerald-600 font-bold">
                                    Added by: {user.createdByAdminName}
                                  </span>
                                </>
                              )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert
                          size={14}
                          className={
                            user.role === "superadmin"
                              ? "text-[#2A0066]"
                              : "text-amber-500"
                          }
                        />
                        <code className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded capitalize">
                          {user.role || "user"}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right w-24">
                      <button
                        onClick={() => {
                          setUserToEdit(user);
                          setEditRole(user.role || "user");
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#2A0066]"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && userToEdit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !modalLoading && setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 uppercase">
                    Update User Role
                  </h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleUpdateRole} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Editing User
                    </label>
                    <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                      <div className="h-10 w-10 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066]">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-none">
                          {userToEdit?.fullName || "Unnamed User"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {userToEdit?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      New Role
                    </label>
                    <div className="relative">
                      <ShieldAlert
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <select
                        required
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="trainer">Trainer</option>
                        <option value="student">Student</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight
                          size={16}
                          className="text-slate-400 rotate-90"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 ml-1 mt-2 font-medium">
                      Select the appropriate role for this account.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="w-full py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {modalLoading ? (
                        <Loader className="animate-spin" size={20} />
                      ) : (
                        "Update Role"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
