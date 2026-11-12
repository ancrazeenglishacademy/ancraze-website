"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  PlayCircle,
  FileText,
  X,
  Loader,
  Trash2,
  Settings,
  List,
  Grid,
  Tv,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MuxVideoPicker from "@/app/componets/MuxVideoPicker";
import MuxPlayer from "@/app/componets/MuxPlayer";

export default function DayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const dayId = params.dayId as string;

  const [dayData, setDayData] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [previewingModule, setPreviewingModule] = useState<any>(null);

  // Create form state
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDuration, setModuleDuration] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [questions, setQuestions] = useState<Array<{ question: string; answer: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [selectedMuxVideo, setSelectedMuxVideo] = useState<{
    url: string;
    playbackId: string;
    assetId?: string;
    thumbnailUrl?: string;
    duration?: string;
    name: string;
  } | null>(null);

  // Edit form state
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDescription, setEditModuleDescription] = useState("");
  const [editModuleDuration, setEditModuleDuration] = useState("");
  const [editModuleQuestions, setEditModuleQuestions] = useState<any[]>([]);
  const [editSelectedMuxVideo, setEditSelectedMuxVideo] = useState<{
    url: string;
    playbackId: string;
    assetId?: string;
    thumbnailUrl?: string;
    duration?: string;
    name: string;
  } | null>(null);
  const [editModuleVideoUrl, setEditModuleVideoUrl] = useState("");
  const [editModulePlaybackId, setEditModulePlaybackId] = useState("");

  const addQuestion = () => {
    if (currentQuestion.trim() && currentAnswer.trim()) {
      setQuestions([...questions, { question: currentQuestion, answer: currentAnswer }]);
      setCurrentQuestion("");
      setCurrentAnswer("");
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "" };

        const daysRes = await fetch(`/api/days?courseId=${courseId}`, { headers });
        if (daysRes.ok) {
          const daysData = await daysRes.json();
          const currentDay = daysData.days.find((d: any) => d.id === dayId);
          setDayData(currentDay);
        }

        const modulesRes = await fetch(`/api/modules?courseId=${courseId}&dayId=${dayId}`, { headers });
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json();
          setModules(modulesData.modules || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, dayId]);

  const openCreateModal = () => {
    setShowModal(true);
    setModuleTitle("");
    setModuleDuration("");
    setModuleDescription("");
    setSelectedMuxVideo(null);
    setQuestions([]);
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleTitle.trim()) {
      alert("Please provide a module title.");
      return;
    }

    if (!selectedMuxVideo?.url && !selectedMuxVideo?.playbackId) {
      alert("Please upload or select a Mux video for this module.");
      return;
    }

    setModalLoading(true);
    try {
      const finalDuration = moduleDuration || selectedMuxVideo?.duration || "10 mins";
      const finalPlaybackId = selectedMuxVideo?.playbackId || "";
      const finalVideoUrl = selectedMuxVideo?.url || (finalPlaybackId ? `https://stream.mux.com/${finalPlaybackId}.m3u8` : "");
      const finalThumbnail = selectedMuxVideo?.thumbnailUrl || (finalPlaybackId ? `https://image.mux.com/${finalPlaybackId}/thumbnail.jpg` : "");

      const response = await fetch("/api/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          courseId,
          moduleTitle,
          day: dayId,
          videoUrl: finalVideoUrl,
          playbackId: finalPlaybackId,
          assetId: selectedMuxVideo?.assetId || "",
          thumbnailUrl: finalThumbnail,
          streamType: "mux",
          questions,
          duration: finalDuration,
          description: moduleDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to create module");

      const data = await response.json();
      setModules((prev) => [
        ...prev,
        {
          id: data.moduleId,
          ...data.module,
          createdAt: new Date().toISOString(),
        },
      ]);

      setModuleTitle("");
      setModuleDescription("");
      setSelectedMuxVideo(null);
      setQuestions([]);
      setModuleDuration("");
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error creating module");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditModal = (module: any) => {
    setEditingModule(module);
    setEditModuleTitle(module.title || "");
    setEditModuleDescription(module.description || "");
    setEditModuleDuration(module.duration || "");
    setEditModuleQuestions(module.questions || []);
    setEditModuleVideoUrl(module.videoUrl || "");
    setEditModulePlaybackId(module.playbackId || "");
    setEditSelectedMuxVideo(
      module.playbackId
        ? {
            url: module.videoUrl || `https://stream.mux.com/${module.playbackId}.m3u8`,
            playbackId: module.playbackId,
            assetId: module.assetId || "",
            thumbnailUrl: module.thumbnailUrl || `https://image.mux.com/${module.playbackId}/thumbnail.jpg`,
            duration: module.duration,
            name: module.title || "Current Video",
          }
        : null
    );
    setShowEditModuleModal(true);
  };

  const handleSaveModuleEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModuleTitle.trim() || !editingModule) return;

    setModalLoading(true);
    try {
      const finalPlaybackId = editSelectedMuxVideo?.playbackId || editModulePlaybackId || "";
      const finalVideoUrl = editSelectedMuxVideo?.url || editModuleVideoUrl || (finalPlaybackId ? `https://stream.mux.com/${finalPlaybackId}.m3u8` : "");
      const finalThumbnail = editSelectedMuxVideo?.thumbnailUrl || (finalPlaybackId ? `https://image.mux.com/${finalPlaybackId}/thumbnail.jpg` : "");
      const finalDuration = editModuleDuration || editSelectedMuxVideo?.duration || editingModule.duration || "10 mins";

      const response = await fetch("/api/modules/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          courseId,
          moduleId: editingModule.id,
          title: editModuleTitle,
          day: dayId,
          questions: editModuleQuestions,
          videoUrl: finalVideoUrl,
          playbackId: finalPlaybackId,
          assetId: editSelectedMuxVideo?.assetId || editingModule.assetId || "",
          thumbnailUrl: finalThumbnail,
          streamType: "mux",
          duration: finalDuration,
          description: editModuleDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to update module");

      setModules((prev) =>
        prev.map((m) =>
          m.id === editingModule.id
            ? {
                ...m,
                title: editModuleTitle,
                description: editModuleDescription,
                questions: editModuleQuestions,
                videoUrl: finalVideoUrl,
                playbackId: finalPlaybackId,
                thumbnailUrl: finalThumbnail,
                duration: finalDuration,
              }
            : m
        )
      );
      setShowEditModuleModal(false);
      setEditingModule(null);
      setEditSelectedMuxVideo(null);
    } catch (error) {
      console.error(error);
      alert("Error saving edits");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      const headers = { "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "" };
      const response = await fetch(`/api/modules?courseId=${courseId}&moduleId=${moduleId}`, {
        method: "DELETE",
        headers,
      });
      if (response.ok) {
        setModules((prev) => prev.filter((m) => m.id !== moduleId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/superadmin/course/${courseId}`)}
          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition text-slate-700"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#2A0066]">
              Super Admin • Mux HLS Streaming
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">{dayData?.title || "Day Modules"}</h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-0.5">
            Manage high-efficiency video lessons & tasks via Mux Video CDN
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Modules ({modules.length})</h2>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              Adaptive Bitrate (HLS)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "list" ? "bg-white text-[#2A0066] shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "grid" ? "bg-white text-[#2A0066] shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Grid size={16} />
              </button>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-[#2A0066] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#2A0066]/20 flex items-center gap-2 hover:bg-[#3d0099] transition active:scale-95"
            >
              <Plus size={16} /> Add New Module
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader className="animate-spin mx-auto text-[#2A0066]" size={36} />
            <p className="text-xs font-bold text-slate-400 mt-3">Loading modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#2A0066] mx-auto flex items-center justify-center mb-4">
              <Tv size={28} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No modules added yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your first lesson module with Mux adaptive video streaming, thumbnails, and questions.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#2A0066] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Module Now
            </button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {modules.map((module, index) => {
              const posterUrl =
                module.thumbnailUrl ||
                (module.playbackId ? `https://image.mux.com/${module.playbackId}/thumbnail.jpg` : null);

              return viewMode === "list" ? (
                <div
                  key={module.id}
                  onClick={() => handleOpenEditModal(module)}
                  className="flex items-center justify-between p-4 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/70 hover:border-[#2A0066]/30 transition group cursor-pointer shadow-sm hover:shadow"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-16 h-12 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:ring-2 ring-[#2A0066]/30 transition">
                      {posterUrl ? (
                        <img src={posterUrl} alt={module.title} className="w-full h-full object-cover" />
                      ) : (
                        <PlayCircle size={22} className="text-slate-500" />
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <PlayCircle size={18} className="text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#2A0066] bg-purple-50 px-2 py-0.5 rounded-md">
                          Mod {String(index + 1).padStart(2, "0")}
                        </span>
                        {module.playbackId && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            Mux HLS
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate mt-1">{module.title}</h3>
                      <p className="text-slate-400 text-xs font-medium truncate mt-0.5">
                        {module.duration || "N/A"} • {module.questions?.length || 0} Questions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {module.videoUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingModule(module);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#2A0066] text-[#2A0066] rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <PlayCircle size={14} /> Preview
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(module);
                      }}
                      className="p-2.5 text-slate-400 hover:text-[#2A0066] hover:bg-purple-50 rounded-xl transition"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id);
                      }}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={module.id}
                  onClick={() => handleOpenEditModal(module)}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden group hover:shadow-lg hover:border-[#2A0066]/30 transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                    {posterUrl ? (
                      <>
                        <img
                          src={posterUrl}
                          alt={module.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewingModule(module);
                            }}
                            className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover:scale-110 transition-transform shadow-lg"
                          >
                            <PlayCircle size={26} className="fill-white/30" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <FileText size={42} className="text-slate-600" />
                    )}

                    {module.playbackId && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 text-emerald-400 backdrop-blur-md">
                        Mux Live Stream
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-slate-500 hover:text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-[#2A0066] bg-purple-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        Mod {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {module.duration || "N/A"}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">{module.title}</h4>
                    <p className="text-xs font-normal text-slate-500 line-clamp-2 mb-4 flex-1">
                      {module.description || "No description provided."}
                    </p>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>{module.questions?.length || 0} Questions</span>
                      <span className="font-bold text-[#2A0066] group-hover:underline">Edit Module →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {previewingModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
            onClick={() => setPreviewingModule(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-bold text-white text-sm">{previewingModule.title}</h3>
                  {previewingModule.playbackId && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      ID: {previewingModule.playbackId}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setPreviewingModule(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="aspect-video w-full bg-black">
                <MuxPlayer
                  playbackId={previewingModule.playbackId}
                  streamUrl={previewingModule.videoUrl}
                  posterUrl={previewingModule.thumbnailUrl}
                  title={previewingModule.title}
                  autoPlay={true}
                />
              </div>

              <div className="p-4 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
                <span>Duration: {previewingModule.duration || "N/A"}</span>
                <span className="text-emerald-400 font-medium">Streamed via Mux Video CDN</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Modal (Create) */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4"
            onClick={() => {
              if (!modalLoading) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create New Module</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Upload video directly to Mux or select an existing asset from the Mux library.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!modalLoading) setShowModal(false);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitModule} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Module Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master English Tenses Part 1"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-[#2A0066] transition outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={moduleDuration}
                      onChange={(e) => setModuleDuration(e.target.value)}
                      placeholder="e.g. 15 mins"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-[#2A0066] transition outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Description
                  </label>
                  <textarea
                    value={moduleDescription}
                    onChange={(e) => setModuleDescription(e.target.value)}
                    placeholder="Brief description of this lesson and what students will learn..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:bg-white focus:border-[#2A0066] transition outline-none text-sm"
                  />
                </div>

                {/* Mux Video Picker */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Lesson Video (Mux Video Stream) <span className="text-red-500">*</span>
                  </label>
                  <MuxVideoPicker
                    courseId={courseId}
                    currentVideoUrl={selectedMuxVideo?.url || ""}
                    currentPlaybackId={selectedMuxVideo?.playbackId || ""}
                    onVideoSelect={(v) => {
                      setSelectedMuxVideo(v);
                      if (!moduleDuration && v.duration) {
                        setModuleDuration(v.duration);
                      }
                      if (!moduleTitle && v.name) {
                        setModuleTitle(v.name.replace(/\.[^/.]+$/, ""));
                      }
                    }}
                    onClearVideo={() => setSelectedMuxVideo(null)}
                  />
                </div>

                {/* Questions / Tasks */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700">Quiz / Checkpoint Questions ({questions.length})</span>
                    <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Question prompt..."
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Expected answer / model answer..."
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {questions.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {questions.map((q, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-slate-700">Q{idx + 1}: </span>
                            <span className="text-slate-600">{q.question}</span>
                            <span className="text-slate-400 ml-2">→ {q.answer}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold uppercase text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading || !selectedMuxVideo}
                    className="flex-1 py-3.5 bg-[#2A0066] hover:bg-[#3d0099] disabled:bg-slate-300 text-white rounded-2xl font-bold uppercase text-xs shadow-lg shadow-[#2A0066]/20 transition flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader className="animate-spin" size={18} /> : "Publish Module"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Modal (Edit) */}
      <AnimatePresence>
        {showEditModuleModal && editingModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4"
            onClick={() => {
              if (!modalLoading) setShowEditModuleModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Module</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Modify title, questions, or change the Mux video asset.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!modalLoading) setShowEditModuleModal(false);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveModuleEdits} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Module Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editModuleTitle}
                      onChange={(e) => setEditModuleTitle(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-[#2A0066] transition outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={editModuleDuration}
                      onChange={(e) => setEditModuleDuration(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-[#2A0066] transition outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Description
                  </label>
                  <textarea
                    value={editModuleDescription}
                    onChange={(e) => setEditModuleDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:bg-white focus:border-[#2A0066] transition outline-none text-sm"
                  />
                </div>

                {/* Video Picker */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Mux Video Asset
                  </label>
                  <MuxVideoPicker
                    courseId={courseId}
                    currentVideoUrl={editSelectedMuxVideo?.url || editModuleVideoUrl}
                    currentPlaybackId={editSelectedMuxVideo?.playbackId || editModulePlaybackId}
                    onVideoSelect={(v) => {
                      setEditSelectedMuxVideo(v);
                      setEditModuleVideoUrl(v.url);
                      setEditModulePlaybackId(v.playbackId);
                      if (v.duration && !editModuleDuration) {
                        setEditModuleDuration(v.duration);
                      }
                    }}
                    onClearVideo={() => {
                      setEditSelectedMuxVideo(null);
                      setEditModuleVideoUrl("");
                      setEditModulePlaybackId("");
                    }}
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModuleModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold uppercase text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3.5 bg-[#2A0066] hover:bg-[#3d0099] disabled:bg-slate-300 text-white rounded-2xl font-bold uppercase text-xs shadow-lg shadow-[#2A0066]/20 transition flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader className="animate-spin" size={18} /> : "Save Changes"}
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
