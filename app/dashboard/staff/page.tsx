"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  User,
  Mail,
  Calendar,
  X,
  Loader,
  Key,
  Users,
  ChevronRight,
  SearchX,
  UserCheck,
  Trash2,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Staff {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Role update state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newName, setNewName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const apiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "";

      const response = await fetch("/api/students?role=trainer", {
        headers: { "x-api-key": apiKey }
      });
      if (!response.ok) throw new Error("Failed to fetch trainers");
      const data = await response.json();

      // Fetch new users (potential trainers)
      const userResponse = await fetch("/api/students?role=user", {
        headers: { "x-api-key": apiKey }
      });
      const userData = await userResponse.json();

      setStaffList([...(data.students || []), ...(userData.students || [])]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;

    if (newName.trim().length < 2) {
      alert("Name must be at least 2 characters long");
      return;
    }

    try {
      setIsUpdating(true);
      const apiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "";
      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          studentId: selectedStaff.id,
          fullName: newName !== selectedStaff.fullName ? newName : undefined,
          role: newRole !== selectedStaff.role ? newRole : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to update staff");

      setIsModalOpen(false);
      fetchStaff(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      setIsUpdating(true);
      const apiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "";
      const response = await fetch(
        `/api/students?studentId=${selectedStaff.id}`,
        {
          method: "DELETE",
          headers: { "x-api-key": apiKey }
        },
      );

      if (!response.ok) throw new Error("Failed to delete staff member");

      setIsModalOpen(false);
      setShowDeleteConfirm(false);
      fetchStaff(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const openUpdateModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setNewRole(staff.role);
    setNewName(staff.fullName);
    setShowDeleteConfirm(false);
    setIsModalOpen(true);
  };

  const filteredStaff = useMemo(() => {
    return (staffList || []).filter(
      (staff) =>
        staff?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [staffList, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Trainer <span className="text-[#2A0066]">Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Manage trainers, admins, and promote new members.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Total Trainers
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {staffList.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
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

      {/* Staff List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Trainer Name
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Role
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
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader
                        className="animate-spin text-[#2A0066]"
                        size={32}
                      />
                      <p className="text-slate-500 font-medium">
                        Loading trainers...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <SearchX size={48} />
                      <p className="text-lg font-bold">
                        No trainers found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    onClick={() => openUpdateModal(staff)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">
                            {staff.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                          staff.role === "admin"
                            ? "text-purple-600 bg-purple-50"
                            : staff.role === "trainer"
                              ? "text-amber-600 bg-amber-50"
                              : "text-slate-500 bg-slate-100"
                        }`}
                      >
                        {staff.role === "user" ? "New User" : staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUpdateModal(staff);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Management Modal */}
      <AnimatePresence>
        {isModalOpen && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Manage <span className="text-[#2A0066]">Trainer</span>
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                {!showDeleteConfirm ? (
                  <>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                          Full Name
                        </label>
                        <div className="relative">
                          <User
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                            size={18}
                          />
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#2A0066]/10 focus:border-[#2A0066] outline-none transition-all font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                            size={18}
                          />
                          <input
                            type="email"
                            value={selectedStaff.email}
                            disabled
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-400 font-bold cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                          Access Role
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setNewRole("user")}
                            className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 ${
                              newRole === "user"
                                ? "border-[#2A0066] bg-[#2A0066]/5"
                                : "border-slate-50 hover:border-slate-100"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${newRole === "user" ? "bg-[#2A0066]" : "bg-slate-300"}`}
                            />
                            <span
                              className={`text-xs font-bold ${newRole === "user" ? "text-[#2A0066]" : "text-slate-500"}`}
                            >
                              User
                            </span>
                          </button>
                          <button
                            onClick={() => setNewRole("trainer")}
                            className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 ${
                              newRole === "trainer"
                                ? "border-[#2A0066] bg-[#2A0066]/5"
                                : "border-slate-50 hover:border-slate-100"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${newRole === "trainer" ? "bg-[#2A0066]" : "bg-slate-300"}`}
                            />
                            <span
                              className={`text-xs font-bold ${newRole === "trainer" ? "text-[#2A0066]" : "text-slate-500"}`}
                            >
                              Trainer
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleUpdateStaff}
                        disabled={
                          isUpdating ||
                          (newName === selectedStaff.fullName &&
                            newRole === selectedStaff.role)
                        }
                        className="w-full py-4 bg-[#2A0066] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 font-bold"
                      >
                        {isUpdating ? "Saving Changes..." : "Save Changes"}
                      </button>

                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-4 text-rose-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 font-bold"
                      >
                        <Trash2 size={16} />
                        Delete Trainer
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 text-center mb-2 tracking-tight">
                      Are you sure?
                    </h3>
                    <p className="text-slate-500 text-center text-sm font-medium mb-8">
                      This will permanently delete{" "}
                      <span className="font-bold text-slate-800">
                        {selectedStaff.fullName}
                      </span>{" "}
                      and all their access. This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteStaff}
                        disabled={isUpdating}
                        className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50 font-bold"
                      >
                        {isUpdating ? "Deleting..." : "Yes, Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
