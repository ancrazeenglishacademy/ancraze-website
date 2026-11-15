"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Loader,
  Eye,
  EyeOff,
  Upload,
  X,
  Search,
  CheckCircle2,
  User,
  Sparkles,
  Award,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Faculty {
  id: string;
  name: string;
  role: string;
  experience: string;
  specialization: string;
  bio: string;
  photo: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export default function FacultiesManagementPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formSpecialization, setFormSpecialization] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string>("");
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faculties");
      const data = await res.json();
      if (data.success) {
        setFaculties(data.faculties || []);
      }
    } catch (err) {
      console.error("Error fetching faculties:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingFaculty(null);
    setFormName("");
    setFormRole("Senior Spoken English Trainer");
    setFormExperience("5+ Years Experience");
    setFormSpecialization("Sentence Formation & Fluency");
    setFormBio("");
    setFormPhotoUrl("");
    setFormPhotoFile(null);
    setFormPhotoPreview("");
    setFormActive(true);
    setFormOrder(faculties.length);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setFormName(faculty.name);
    setFormRole(faculty.role);
    setFormExperience(faculty.experience);
    setFormSpecialization(faculty.specialization);
    setFormBio(faculty.bio);
    setFormPhotoUrl(faculty.photo);
    setFormPhotoFile(null);
    setFormPhotoPreview(faculty.photo);
    setFormActive(faculty.active);
    setFormOrder(faculty.order);
    setFormError("");
    setShowModal(true);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Faculty name is required");
      return;
    }

    setModalLoading(true);
    setFormError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formName.trim());
      formDataToSend.append("role", formRole.trim());
      formDataToSend.append("experience", formExperience.trim());
      formDataToSend.append("specialization", formSpecialization.trim());
      formDataToSend.append("bio", formBio.trim());
      formDataToSend.append("active", formActive ? "true" : "false");
      formDataToSend.append("order", formOrder.toString());

      if (formPhotoFile) {
        formDataToSend.append("photo", formPhotoFile);
      } else if (formPhotoUrl) {
        formDataToSend.append("photoUrl", formPhotoUrl.trim());
      }

      const url = editingFaculty ? `/api/faculties/${editingFaculty.id}` : "/api/faculties";
      const method = editingFaculty ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save faculty");
      }

      setShowModal(false);
      fetchFaculties();
    } catch (err: any) {
      console.error("Save error:", err);
      setFormError(err.message || "An error occurred");
    } finally {
      setModalLoading(false);
    }
  };

  const toggleFacultyStatus = async (faculty: Faculty) => {
    const nextStatus = !faculty.active;
    // Optimistic update
    setFaculties((prev) =>
      prev.map((f) => (f.id === faculty.id ? { ...f, active: nextStatus } : f))
    );

    try {
      const res = await fetch(`/api/faculties/${faculty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
    } catch (err) {
      console.error("Failed to toggle status:", err);
      fetchFaculties();
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/faculties/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFaculties((prev) => prev.filter((f) => f.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting faculty:", err);
      alert("Failed to delete faculty member");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered faculties
  const filtered = faculties.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterActive === "active") return f.active;
    if (filterActive === "inactive") return !f.active;
    return true;
  });

  const totalActive = faculties.filter((f) => f.active).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-[11px] font-black uppercase tracking-wider mb-2">
            <GraduationCap size={14} />
            <span>Content Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Faculties & <span className="text-[#2A0066]">Mentors</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            Manage teaching faculty, speaking trainers and mentors displayed in the website faculties section.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-[#2A0066]/20 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Add New Faculty</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Faculty</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{faculties.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#2A0066] flex items-center justify-center">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active on Website</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totalActive}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Eye size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hidden / Draft</p>
            <p className="text-2xl font-black text-slate-600 mt-1">{faculties.length - totalActive}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <EyeOff size={22} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2A0066] outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {(["all", "active", "inactive"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterActive(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                filterActive === mode
                  ? "bg-[#2A0066] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader size={32} className="animate-spin text-[#2A0066]" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Faculty Members...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#2A0066] flex items-center justify-center mx-auto">
            <GraduationCap size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Faculty Members Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add your academy trainers, speaking mentors, and coaches so visitors can see them on the website.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#3D0099] transition inline-flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Add First Faculty Member</span>
          </button>
        </div>
      )}

      {/* Faculty Cards Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((faculty) => (
            <div
              key={faculty.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                faculty.active ? "border-slate-200" : "border-slate-200/60 opacity-75 bg-slate-50/50"
              }`}
            >
              <div>
                {/* Header with Photo & Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      {faculty.photo ? (
                        <Image
                          src={faculty.photo}
                          alt={faculty.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User size={24} className="text-[#2A0066]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {faculty.name}
                      </h3>
                      <p className="text-xs font-bold text-[#2A0066] mt-0.5">{faculty.role}</p>
                    </div>
                  </div>

                  {/* Active Toggle Badge */}
                  <button
                    onClick={() => toggleFacultyStatus(faculty)}
                    title={faculty.active ? "Visible on website. Click to hide." : "Hidden from website. Click to show."}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer flex items-center gap-1 ${
                      faculty.active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${faculty.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    <span>{faculty.active ? "Visible" : "Hidden"}</span>
                  </button>
                </div>

                {/* Experience & Specialization Pills */}
                <div className="space-y-2 mb-4">
                  {faculty.experience && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span>{faculty.experience}</span>
                    </div>
                  )}
                  {faculty.specialization && (
                    <div className="flex items-center gap-1.5 text-xs text-purple-900 font-medium bg-purple-50/70 px-2.5 py-1 rounded-lg border border-purple-100">
                      <Sparkles size={12} className="text-[#2A0066] shrink-0" />
                      <span className="truncate">{faculty.specialization}</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {faculty.bio && (
                  <p className="text-xs text-slate-500 leading-relaxed font-normal line-clamp-3 mb-4">
                    {faculty.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Order: #{faculty.order}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(faculty)}
                    className="p-2 text-slate-500 hover:text-[#2A0066] hover:bg-purple-50 rounded-lg transition"
                    title="Edit Faculty"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(faculty.id)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Faculty"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Faculty Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingFaculty ? "Edit Faculty Member" : "Add New Faculty Member"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This profile will be shown in the faculties section of your website.
                  </p>
                </div>
                <button
                  onClick={() => !modalLoading && setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFaculty} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#2A0066] outline-none"
                  />
                </div>

                {/* Role & Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Role / Designation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Speaking Trainer"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#2A0066] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Experience
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 6+ Years Experience"
                      value={formExperience}
                      onChange={(e) => setFormExperience(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#2A0066] outline-none"
                    />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20 Codes Method, Fluency & Accent Neutralization"
                    value={formSpecialization}
                    onChange={(e) => setFormSpecialization(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#2A0066] outline-none"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Short Bio / Teaching Philosophy
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description about their mentoring approach and experience helping learners speak confidently..."
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#2A0066] outline-none"
                  />
                </div>

                {/* Photo Upload or URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Faculty Photo
                  </label>
                  <div className="flex items-center gap-4">
                    {formPhotoPreview ? (
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                        <img
                          src={formPhotoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormPhotoFile(null);
                            setFormPhotoPreview("");
                            setFormPhotoUrl("");
                          }}
                          className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2A0066] flex flex-col items-center justify-center text-slate-400 hover:text-[#2A0066] cursor-pointer transition shrink-0">
                        <Upload size={18} />
                        <span className="text-[9px] font-bold mt-0.5">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    <div className="flex-1">
                      <p className="text-[11px] text-slate-500 font-medium mb-1">Or paste image URL:</p>
                      <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        value={formPhotoUrl}
                        onChange={(e) => {
                          setFormPhotoUrl(e.target.value);
                          if (!formPhotoFile) setFormPhotoPreview(e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#2A0066] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Visibility Checkbox & Display Order */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2A0066] focus:ring-[#2A0066] cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Show in Faculties Section</p>
                      <p className="text-[10px] text-slate-500">Visible to website visitors</p>
                    </div>
                  </label>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Order:</span>
                    <input
                      type="number"
                      min={0}
                      value={formOrder}
                      onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 0)}
                      className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={modalLoading}
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-6 py-2.5 bg-[#2A0066] hover:bg-[#3D0099] disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {modalLoading && <Loader size={14} className="animate-spin" />}
                    <span>{editingFaculty ? "Save Changes" : "Create Faculty"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Faculty Member?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This faculty member will be removed from your dashboard and the website faculties section.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  disabled={deleting}
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={() => handleDeleteFaculty(deleteConfirmId)}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                >
                  {deleting && <Loader size={14} className="animate-spin" />}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
