"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Plus,
  ChevronLeft,
  PlayCircle,
  FileText,
  HelpCircle,
  X,
  Upload,
  Loader,
  Trash2,
  Settings,
  GripVertical,
  List,
  Grid,
  Search,
  Film,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const dayId = params.dayId as string;

  const [dayData, setDayData] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);

  // Module form states
  const [moduleTitle, setModuleTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [moduleDuration, setModuleDuration] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [questions, setQuestions] = useState<Array<{ question: string; answer: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStats, setUploadStats] = useState<{ transferred: number, total: number } | null>(null);

  // Firebase video browser states (create modal)
  const [videoPickerMode, setVideoPickerMode] = useState<"upload" | "firebase">("firebase");
  const [selectedFirebaseVideo, setSelectedFirebaseVideo] = useState<{ name: string; fullPath: string; downloadUrl: string; size: number } | null>(null);
  const [firebaseVideos, setFirebaseVideos] = useState<any[]>([]);
  const [firebaseVideosLoading, setFirebaseVideosLoading] = useState(false);
  const [firebaseVideoSearch, setFirebaseVideoSearch] = useState("");
  const [firebaseVideosLoaded, setFirebaseVideosLoaded] = useState(false);

  // Firebase video browser states (edit modal)
  const [editVideoPickerMode, setEditVideoPickerMode] = useState<"upload" | "firebase">("firebase");
  const [editSelectedFirebaseVideo, setEditSelectedFirebaseVideo] = useState<{ name: string; fullPath: string; downloadUrl: string; size: number } | null>(null);
  const [editFirebaseVideoSearch, setEditFirebaseVideoSearch] = useState("");

  // Module edit states
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDescription, setEditModuleDescription] = useState("");
  const [editModuleQuestions, setEditModuleQuestions] = useState<any[]>([]);
  const [editModuleVideoUrl, setEditModuleVideoUrl] = useState("");
  const [editModuleThumbnailUrl, setEditModuleThumbnailUrl] = useState("");
  const [editModuleVideoFile, setEditModuleVideoFile] = useState<File | null>(null);
  const [editModuleDuration, setEditModuleDuration] = useState("");

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setSelectedFirebaseVideo(null);
      // Generate thumbnail
      try {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.currentTime = 0.1;
        video.onloadeddata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const thumb = new File([blob], `thumb_${file.name.split('.')[0]}.jpg`, { type: "image/jpeg" });
              setThumbnailFile(thumb);
            }
          }, "image/jpeg", 0.7);
        };
      } catch (err) {
        console.error("Error generating thumbnail:", err);
      }
    }
  };

  const loadFirebaseVideos = useCallback(async () => {
    if (firebaseVideosLoading) return;
    setFirebaseVideosLoading(true);
    try {
      const res = await fetch('/api/firebase-videos', {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_INTERNAL_API_KEY || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setFirebaseVideos(data.videos || []);
        setFirebaseVideosLoaded(true);
      }
    } catch (err) {
      console.error('Error loading Firebase videos:', err);
    } finally {
      setFirebaseVideosLoading(false);
    }
  }, [firebaseVideosLoading]);

  const openCreateModal = () => {
    setShowModal(true);
    setVideoPickerMode('firebase');
    setSelectedFirebaseVideo(null);
    setVideoFile(null);
    setFirebaseVideoSearch('');
    if (!firebaseVideosLoaded) loadFirebaseVideos();
  };

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
        
        // Fetch specific day info
        const daysRes = await fetch(`/api/days?courseId=${courseId}`, { headers });
        if (daysRes.ok) {
          const daysData = await daysRes.json();
          const currentDay = daysData.days.find((d: any) => d.id === dayId);
          setDayData(currentDay);
        }

        // Fetch modules for this day
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

  const uploadFile = (file: File, path: string, onProgress: (progress: number, transferred?: number, total?: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress), snapshot.bytesTransferred, snapshot.totalBytes);
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final video URL
    const hasUploadVideo = videoPickerMode === 'upload' && videoFile;
    const hasFirebaseVideo = videoPickerMode === 'firebase' && selectedFirebaseVideo;

    if (!moduleTitle.trim() || !moduleDuration.trim() || (!hasUploadVideo && !hasFirebaseVideo)) {
      alert("Please fill all required fields: Title, Duration, and a Video (either uploaded or selected from Firebase).");
      return;
    }

    setModalLoading(true);
    try {
      let videoUrl = "";
      let thumbnailUrl = "";

      if (hasFirebaseVideo) {
        // Use the already-uploaded Firebase video URL directly
        videoUrl = selectedFirebaseVideo!.downloadUrl;
      } else if (hasUploadVideo) {
        // Upload from device as before
        setUploadProgress(0);
        const cleanName = videoFile!.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const videoPath = `modules/${courseId}/${Date.now()}_${cleanName}`;
        videoUrl = await uploadFile(videoFile!, videoPath, (progress, transferred, total) => {
          setUploadProgress(progress);
          if (transferred !== undefined && total !== undefined) {
            setUploadStats({ transferred, total });
          }
        });
        if (thumbnailFile) {
          const cleanThumbName = thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const thumbPath = `modules/${courseId}/thumb_${Date.now()}_${cleanThumbName}`;
          thumbnailUrl = await uploadFile(thumbnailFile, thumbPath, () => {});
        }
      }

      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "" 
        },
        body: JSON.stringify({
          courseId,
          moduleTitle,
          day: dayId,
          videoUrl,
          thumbnailUrl,
          questions,
          duration: moduleDuration,
          description: moduleDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to create module");

      const data = await response.json();
      setModules([...modules, { id: data.moduleId, ...data.module, createdAt: new Date().toISOString() }]);
      
      // Reset
      setModuleTitle("");
      setModuleDescription("");
      setVideoFile(null);
      setSelectedFirebaseVideo(null);
      setFirebaseVideoSearch("");
      setQuestions([]);
      setModuleDuration("");
      setUploadProgress(null);
      setUploadStats(null);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error creating module");
    } finally {
      setModalLoading(false);
      setUploadProgress(null);
      setUploadStats(null);
    }
  };

  const handleSaveModuleEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModuleTitle.trim() || !editingModule) return;

    setModalLoading(true);
    try {
      let videoUrl = editModuleVideoUrl;

      if (editVideoPickerMode === 'firebase' && editSelectedFirebaseVideo) {
        // Use selected Firebase video directly
        videoUrl = editSelectedFirebaseVideo.downloadUrl;
      } else if (editVideoPickerMode === 'upload' && editModuleVideoFile) {
        // Upload new file
        setUploadProgress(0);
        const cleanName = editModuleVideoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const videoPath = `modules/${courseId}/${Date.now()}_${cleanName}`;
        videoUrl = await uploadFile(editModuleVideoFile, videoPath, (progress, transferred, total) => {
          setUploadProgress(progress);
          if (transferred !== undefined && total !== undefined) {
            setUploadStats({ transferred, total });
          }
        });
      }

      const response = await fetch("/api/modules/update", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" ,
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || ""
        },
        body: JSON.stringify({
          courseId,
          moduleId: editingModule.id,
          title: editModuleTitle,
          day: dayId,
          questions: editModuleQuestions,
          videoUrl,
          duration: editModuleDuration,
          description: editModuleDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to update module");

      setModules(modules.map(m => m.id === editingModule.id ? { ...m, title: editModuleTitle, description: editModuleDescription, questions: editModuleQuestions, videoUrl, duration: editModuleDuration } : m));
      setShowEditModuleModal(false);
      setEditModuleVideoFile(null);
      setEditSelectedFirebaseVideo(null);
      setUploadProgress(null);
      setUploadStats(null);
    } catch (error) {
      console.error(error);
      alert("Error saving edits");
    } finally {
      setModalLoading(false);
      setUploadProgress(null);
      setUploadStats(null);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    
    try {
      const headers = { "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "" };
      const response = await fetch(`/api/modules?courseId=${courseId}&moduleId=${moduleId}`, { 
        method: "DELETE",
        headers
      });
      if (response.ok) {
        setModules(modules.filter(m => m.id !== moduleId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(`/dashboard/course/${courseId}`)} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">{dayData?.title || "Loading..."}</h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Manage Modules for this Day</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">Modules ({modules.length})</h2>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white text-[#2A0066] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                <List size={16} />
              </button>
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-[#2A0066] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                <Grid size={16} />
              </button>
            </div>
            <button onClick={openCreateModal} className="px-5 py-3 bg-[#2A0066] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#2A0066]/20 flex items-center gap-2">
              <Plus size={16} /> Add New Module
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader className="animate-spin mx-auto text-[#2A0066]" size={32} />
          </div>
        ) : modules.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold">No modules added to this day yet.</div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {modules.map((module, index) => (
              viewMode === "list" ? (
                <div 
                  key={module.id} 
                  onClick={() => {
                    setEditingModule(module);
                    setEditModuleTitle(module.title);
                    setEditModuleDescription(module.description || "");
                    setEditModuleQuestions(module.questions || []);
                    setEditModuleVideoUrl(module.videoUrl || "");
                    setEditModuleThumbnailUrl(module.thumbnailUrl || "");
                    setEditModuleVideoFile(null);
                    setEditModuleDuration(module.duration || "");
                    setEditSelectedFirebaseVideo(null);
                    setEditVideoPickerMode('firebase');
                    setEditFirebaseVideoSearch('');
                    if (!firebaseVideosLoaded) loadFirebaseVideos();
                    setShowEditModuleModal(true);
                  }}
                  className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-purple-200 transition group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 flex items-center justify-center rounded-2xl font-black text-[#2A0066]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{module.title}</h3>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">
                        {module.duration || "N/A"} • {module.questions?.length || 0} Questions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModule(module);
                        setEditModuleTitle(module.title);
                        setEditModuleDescription(module.description || "");
                        setEditModuleQuestions(module.questions || []);
                        setEditModuleVideoUrl(module.videoUrl || "");
                        setEditModuleThumbnailUrl(module.thumbnailUrl || "");
                        setEditModuleVideoFile(null);
                        setEditModuleDuration(module.duration || "");
                        setEditSelectedFirebaseVideo(null);
                        setEditVideoPickerMode('firebase');
                        setEditFirebaseVideoSearch('');
                        if (!firebaseVideosLoaded) loadFirebaseVideos();
                        setShowEditModuleModal(true);
                      }}
                      className="p-3 text-slate-300 hover:text-[#2A0066] hover:bg-slate-50 rounded-xl transition"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  key={module.id} 
                  onClick={() => {
                    setEditingModule(module);
                    setEditModuleTitle(module.title);
                    setEditModuleDescription(module.description || "");
                    setEditModuleQuestions(module.questions || []);
                    setEditModuleVideoUrl(module.videoUrl || "");
                    setEditModuleThumbnailUrl(module.thumbnailUrl || "");
                    setEditModuleVideoFile(null);
                    setEditModuleDuration(module.duration || "");
                    setEditSelectedFirebaseVideo(null);
                    setEditVideoPickerMode('firebase');
                    setEditFirebaseVideoSearch('');
                    if (!firebaseVideosLoaded) loadFirebaseVideos();
                    setShowEditModuleModal(true);
                  }} 
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#2A0066]/20 transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                    {module.videoUrl ? (
                      <>
                        <img src={module.thumbnailUrl || "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&q=80"} alt={module.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover:scale-110 transition-transform">
                            <PlayCircle size={24} className="fill-white/20" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <FileText size={48} className="text-slate-200" />
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }} className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-sm text-slate-400 hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[10px] font-black text-[#2A0066] bg-[#2A0066]/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                         Mod {String(index + 1).padStart(2, '0')}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg">
                         {module.duration || "N/A"}
                       </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1">{module.title}</h4>
                    <p className="text-[11px] font-semibold text-slate-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
                      {module.description || "No description provided for this module."}
                    </p>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Module Modal (Create) */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={() => { if (!modalLoading && uploadProgress === null) setShowModal(false) }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Create Module</h2>
                 <button onClick={() => { if (!modalLoading && uploadProgress === null) setShowModal(false) }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors absolute top-6 right-6">
                   <X size={20} />
                 </button>
               </div>
               <form onSubmit={handleSubmitModule} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Module Title <span className="text-red-500">*</span></label>
                    <input type="text" required value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Duration <span className="text-red-500">*</span></label>
                    <input type="text" value={moduleDuration} onChange={e => setModuleDuration(e.target.value)} placeholder="e.g. 15 mins" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea value={moduleDescription} onChange={e => setModuleDescription(e.target.value)} placeholder="Module description..." rows={3} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" />
                  </div>

                  {/* Video Picker — Firebase or Upload */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Module Video <span className="text-red-500">*</span></label>

                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => { setVideoPickerMode('firebase'); if (!firebaseVideosLoaded) loadFirebaseVideos(); }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          videoPickerMode === 'firebase'
                            ? 'bg-[#2A0066] text-white shadow-lg shadow-[#2A0066]/20'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <FolderOpen size={14} /> Browse Firebase
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoPickerMode('upload')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          videoPickerMode === 'upload'
                            ? 'bg-[#2A0066] text-white shadow-lg shadow-[#2A0066]/20'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Upload size={14} /> Upload from Device
                      </button>
                    </div>

                    {/* Firebase Browser */}
                    {videoPickerMode === 'firebase' && (
                      <div className="space-y-3">
                        {/* Search + Refresh bar */}
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={firebaseVideoSearch}
                              onChange={e => setFirebaseVideoSearch(e.target.value)}
                              placeholder="Search videos by name..."
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 border-none outline-none focus:ring-2 focus:ring-[#2A0066]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => { setFirebaseVideosLoaded(false); loadFirebaseVideos(); }}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                            title="Refresh list"
                          >
                            <RefreshCw size={16} className={firebaseVideosLoading ? 'animate-spin' : ''} />
                          </button>
                        </div>

                        {/* Selected Preview */}
                        {selectedFirebaseVideo && (
                          <div className="flex items-center gap-3 p-3 bg-[#2A0066]/5 border border-[#2A0066]/20 rounded-2xl">
                            <CheckCircle2 size={18} className="text-[#2A0066] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-[#2A0066] truncate">{selectedFirebaseVideo.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{(selectedFirebaseVideo.size / (1024 * 1024)).toFixed(1)} MB — selected</p>
                            </div>
                            <button type="button" onClick={() => setSelectedFirebaseVideo(null)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Video Grid */}
                        {firebaseVideosLoading ? (
                          <div className="py-8 text-center">
                            <Loader className="animate-spin mx-auto text-[#2A0066]" size={24} />
                            <p className="text-xs font-bold text-slate-400 mt-2">Loading videos from Firebase...</p>
                          </div>
                        ) : firebaseVideos.filter(v => v.name.toLowerCase().includes(firebaseVideoSearch.toLowerCase())).length === 0 ? (
                          <div className="py-8 text-center">
                            <Film size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-xs font-bold text-slate-400">
                              {firebaseVideos.length === 0 ? 'No videos found in Firebase Storage' : 'No videos match your search'}
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                            {firebaseVideos
                              .filter(v => v.name.toLowerCase().includes(firebaseVideoSearch.toLowerCase()))
                              .map((video, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedFirebaseVideo(video)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border ${
                                    selectedFirebaseVideo?.fullPath === video.fullPath
                                      ? 'bg-[#2A0066]/5 border-[#2A0066]/30'
                                      : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-xl bg-[#2A0066]/10 flex items-center justify-center flex-shrink-0">
                                    {selectedFirebaseVideo?.fullPath === video.fullPath
                                      ? <CheckCircle2 size={18} className="text-[#2A0066]" />
                                      : <Film size={18} className="text-[#2A0066]/60" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate">{video.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{video.folder !== '/' ? video.folder : 'Root'} • {(video.size / (1024 * 1024)).toFixed(1)} MB</p>
                                  </div>
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload from Device */}
                    {videoPickerMode === 'upload' && (
                      <div>
                        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-[#2A0066] transition cursor-pointer relative bg-slate-50/50">
                          <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Upload size={32} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-sm font-bold text-slate-600">
                            {videoFile ? videoFile.name : "Select Video from Device"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">MP4, WebM up to 10GB</p>
                        </div>
                        {uploadProgress !== null && (
                          <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden relative shadow-inner border border-slate-200">
                            <div className="bg-gradient-to-r from-[#2A0066] to-purple-600 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            <div className="flex justify-between items-center mt-2 px-1">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                                {uploadStats ? `${(uploadStats.transferred / (1024 * 1024)).toFixed(2)} MB / ${(uploadStats.total / (1024 * 1024)).toFixed(2)} MB` : "Uploading..."}
                              </p>
                              <p className="text-[11px] font-black text-[#2A0066]">{uploadProgress}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                     <button type="submit" disabled={modalLoading} className="flex-1 py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-[#2A0066]/20">
                       {modalLoading ? <Loader className="animate-spin mx-auto" size={20} /> : "Create Module"}
                     </button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Module Modal */}
      <AnimatePresence>
        {showEditModuleModal && editingModule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={() => { if (!modalLoading && uploadProgress === null) setShowEditModuleModal(false) }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Module</h2>
                 <button onClick={() => { if (!modalLoading && uploadProgress === null) setShowEditModuleModal(false) }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors absolute top-6 right-6">
                   <X size={20} />
                 </button>
               </div>
               <form onSubmit={handleSaveModuleEdits} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Module Title <span className="text-red-500">*</span></label>
                    <input type="text" required value={editModuleTitle} onChange={e => setEditModuleTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" />
                  </div>
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Duration <span className="text-red-500">*</span></label>
                    <input type="text" value={editModuleDuration} onChange={e => setEditModuleDuration(e.target.value)} placeholder="e.g. 15 mins" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea value={editModuleDescription} onChange={e => setEditModuleDescription(e.target.value)} placeholder="Module description..." rows={3} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800" />
                  </div>

                  {/* Video Picker */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Module Video</label>

                    {/* Current Video Preview (if exists and not replacing) */}
                    {editModuleVideoUrl && !editSelectedFirebaseVideo && editVideoPickerMode !== 'upload' && (
                      <div className="mb-4 space-y-3">
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
                          <video src={editModuleVideoUrl} poster={editModuleThumbnailUrl} controls className="max-w-full max-h-full" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Current video — select a new one below to replace it</p>
                      </div>
                    )}

                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => { setEditVideoPickerMode('firebase'); if (!firebaseVideosLoaded) loadFirebaseVideos(); }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          editVideoPickerMode === 'firebase'
                            ? 'bg-[#2A0066] text-white shadow-lg shadow-[#2A0066]/20'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <FolderOpen size={14} /> Browse Firebase
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditVideoPickerMode('upload')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          editVideoPickerMode === 'upload'
                            ? 'bg-[#2A0066] text-white shadow-lg shadow-[#2A0066]/20'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Upload size={14} /> Upload from Device
                      </button>
                    </div>

                    {/* Firebase Browser (edit) */}
                    {editVideoPickerMode === 'firebase' && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={editFirebaseVideoSearch}
                              onChange={e => setEditFirebaseVideoSearch(e.target.value)}
                              placeholder="Search videos by name..."
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 border-none outline-none focus:ring-2 focus:ring-[#2A0066]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => { setFirebaseVideosLoaded(false); loadFirebaseVideos(); }}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                          >
                            <RefreshCw size={16} className={firebaseVideosLoading ? 'animate-spin' : ''} />
                          </button>
                        </div>

                        {editSelectedFirebaseVideo && (
                          <div className="flex items-center gap-3 p-3 bg-[#2A0066]/5 border border-[#2A0066]/20 rounded-2xl">
                            <CheckCircle2 size={18} className="text-[#2A0066] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-[#2A0066] truncate">{editSelectedFirebaseVideo.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{(editSelectedFirebaseVideo.size / (1024 * 1024)).toFixed(1)} MB — will replace current video</p>
                            </div>
                            <button type="button" onClick={() => setEditSelectedFirebaseVideo(null)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg">
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {firebaseVideosLoading ? (
                          <div className="py-8 text-center">
                            <Loader className="animate-spin mx-auto text-[#2A0066]" size={24} />
                            <p className="text-xs font-bold text-slate-400 mt-2">Loading videos from Firebase...</p>
                          </div>
                        ) : firebaseVideos.filter(v => v.name.toLowerCase().includes(editFirebaseVideoSearch.toLowerCase())).length === 0 ? (
                          <div className="py-8 text-center">
                            <Film size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-xs font-bold text-slate-400">
                              {firebaseVideos.length === 0 ? 'No videos found in Firebase Storage' : 'No videos match your search'}
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                            {firebaseVideos
                              .filter(v => v.name.toLowerCase().includes(editFirebaseVideoSearch.toLowerCase()))
                              .map((video, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setEditSelectedFirebaseVideo(video)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border ${
                                    editSelectedFirebaseVideo?.fullPath === video.fullPath
                                      ? 'bg-[#2A0066]/5 border-[#2A0066]/30'
                                      : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-xl bg-[#2A0066]/10 flex items-center justify-center flex-shrink-0">
                                    {editSelectedFirebaseVideo?.fullPath === video.fullPath
                                      ? <CheckCircle2 size={18} className="text-[#2A0066]" />
                                      : <Film size={18} className="text-[#2A0066]/60" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate">{video.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{video.folder !== '/' ? video.folder : 'Root'} • {(video.size / (1024 * 1024)).toFixed(1)} MB</p>
                                  </div>
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload from Device (edit) */}
                    {editVideoPickerMode === 'upload' && (
                      <div>
                        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-[#2A0066] transition cursor-pointer relative bg-slate-50/50">
                          <input type="file" accept="video/*" onChange={(e) => setEditModuleVideoFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Upload size={32} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-sm font-bold text-slate-600">
                            {editModuleVideoFile ? editModuleVideoFile.name : "Select Video from Device"}
                          </p>
                          {editModuleVideoFile && (
                            <button type="button" onClick={(e) => { e.preventDefault(); setEditModuleVideoFile(null); }} className="mt-4 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 inline-flex items-center gap-1">
                              <X size={14} /> Remove Selected
                            </button>
                          )}
                          {!editModuleVideoFile && <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">MP4, WebM</p>}
                        </div>
                        {uploadProgress !== null && (
                          <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden relative shadow-inner border border-slate-200">
                            <div className="bg-gradient-to-r from-[#2A0066] to-purple-600 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            <div className="flex justify-between items-center mt-2 px-1">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                                {uploadStats ? `${(uploadStats.transferred / (1024 * 1024)).toFixed(2)} MB / ${(uploadStats.total / (1024 * 1024)).toFixed(2)} MB` : "Uploading..."}
                              </p>
                              <p className="text-[11px] font-black text-[#2A0066]">{uploadProgress}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Questions Edit */}
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Practice Questions</label>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
                        {editModuleQuestions.map((q, idx) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex items-start justify-between gap-3 border border-slate-100">
                             <div className="flex-1">
                               <p className="text-xs font-bold text-slate-800">Q: {q.question}</p>
                             </div>
                             <button type="button" onClick={() => setEditModuleQuestions(editModuleQuestions.filter((_, i) => i !== idx))} className="text-red-400 p-1"><X size={14} /></button>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setShowEditModuleModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                     <button type="submit" disabled={modalLoading} className="flex-1 py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-[#2A0066]/20">
                       {modalLoading ? <Loader className="animate-spin mx-auto" size={20} /> : "Save Changes"}
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
