"use client";
import { useState, useEffect } from "react";
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
  Grid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FirebaseVideoPicker from "@/app/componets/FirebaseVideoPicker";

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
  const [selectedFirebaseVideoUrl, setSelectedFirebaseVideoUrl] = useState("");
  const [moduleDuration, setModuleDuration] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [questions, setQuestions] = useState<Array<{ question: string; answer: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStats, setUploadStats] = useState<{ transferred: number, total: number } | null>(null);

  // Module edit states
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDescription, setEditModuleDescription] = useState("");
  const [editModuleQuestions, setEditModuleQuestions] = useState<any[]>([]);
  const [editModuleVideoUrl, setEditModuleVideoUrl] = useState("");
  const [editSelectedFirebaseVideoUrl, setEditSelectedFirebaseVideoUrl] = useState("");
  const [editModuleThumbnailUrl, setEditModuleThumbnailUrl] = useState("");
  const [editModuleVideoFile, setEditModuleVideoFile] = useState<File | null>(null);
  const [editModuleDuration, setEditModuleDuration] = useState("");

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Generate thumbnail
      try {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.currentTime = 0.1; // Seek to first frame
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
        
        // Fetch specific day info (we need a way to get one day, or we fetch all and find it)
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
        console.error("Error fetching data:", error);
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
    const hasVideo = !!selectedFirebaseVideoUrl || !!videoFile;
    if (!moduleTitle.trim() || !moduleDuration.trim() || !hasVideo) {
      alert("Please fill all required fields: Title, Duration, and Video (selected from Firebase or uploaded).");
      return;
    }

    setModalLoading(true);
    try {
      let videoUrl = selectedFirebaseVideoUrl;
      let thumbnailUrl = "";
      if (videoFile) {
        setUploadProgress(0);
        const cleanName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const videoPath = `modules/${courseId}/${Date.now()}_${cleanName}`;
        videoUrl = await uploadFile(videoFile, videoPath, (progress, transferred, total) => {
          setUploadProgress(progress);
          if (transferred !== undefined && total !== undefined) {
            setUploadStats({ transferred, total });
          }
        });
      }
      if (thumbnailFile) {
        const cleanThumbName = thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const thumbPath = `modules/${courseId}/thumb_${Date.now()}_${cleanThumbName}`;
        thumbnailUrl = await uploadFile(thumbnailFile, thumbPath, () => {});
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
          day: dayId, // Storing dayId in the 'day' field
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
      setThumbnailFile(null);
      setSelectedFirebaseVideoUrl("");
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
    }
  };

  const handleSaveModuleEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModuleTitle.trim() || !editingModule) return;

    setModalLoading(true);
    if (editModuleVideoFile) {
      setUploadProgress(0);
    }
    try {
      let videoUrl = editSelectedFirebaseVideoUrl || editModuleVideoUrl;
      if (editModuleVideoFile) {
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
      setEditSelectedFirebaseVideoUrl("");
    } catch (error) {
       console.error(error);
    } finally {
      setModalLoading(false);
      setUploadProgress(null);
      setUploadStats(null);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/modules?courseId=${courseId}&moduleId=${moduleId}`, { 
        method: "DELETE",
        headers: { "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "" }
      });
      setModules(modules.filter(m => m.id !== moduleId));
    } catch (error) { console.error(error); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5 pb-8">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/superadmin/course/${courseId}`)}
            className="h-12 w-12 bg-slate-50 text-slate-400 hover:text-[#2A0066] rounded-2xl flex items-center justify-center transition-all border border-slate-100"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
              {dayData?.title || "Day Details"}
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
               Manage modules for this curriculum block
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-white text-[#2A0066] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <List size={18} />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-[#2A0066] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <Grid size={18} />
            </button>
          </div>
          <button
            onClick={() => {
              setUploadProgress(null);
              setUploadStats(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:opacity-95 transition-all"
          >
            <Plus size={18} />
            Add New Module
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid gap-4"}>
        {loading ? (
          <div className="flex items-center justify-center py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200">
             <Loader size={32} className="animate-spin text-[#2A0066]" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200">
            <PlayCircle size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No modules added to this day yet</p>
          </div>
        ) : (
          modules.map((module, idx) => (
            viewMode === "list" ? (
              <div 
                key={module.id} 
                onClick={() => {
                  setUploadProgress(null);
                  setUploadStats(null);
                  setEditingModule(module);
                  setEditModuleTitle(module.title);
                  setEditModuleDescription(module.description || "");
                  setEditModuleQuestions(module.questions || []);
                  setEditModuleVideoUrl(module.videoUrl || "");
                        setEditSelectedFirebaseVideoUrl(module.videoUrl || "");
                  setEditModuleThumbnailUrl(module.thumbnailUrl || "");
                  setEditModuleVideoFile(null);
                  setEditModuleDuration(module.duration || "");
                  setShowEditModuleModal(true);
                }}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-[#2A0066]/20 transition-all cursor-pointer"
              >
                 <div className="flex items-center gap-6 flex-1">
                    <div className="text-lg font-black text-slate-200 w-8">{String(idx + 1).padStart(2, '0')}</div>
                    <div>
                      <h4 className="font-bold text-slate-800">{module.title}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {module.videoUrl ? "Video Lesson" : "Text Lesson"} • {module.questions?.length || 0} Questions • {module.duration || "N/A"}
                      </p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setUploadProgress(null);
                       setUploadStats(null);
                       setEditingModule(module);
                       setEditModuleTitle(module.title);
                       setEditModuleDescription(module.description || "");
                       setEditModuleQuestions(module.questions || []);
                       setEditModuleVideoUrl(module.videoUrl || "");
                        setEditSelectedFirebaseVideoUrl(module.videoUrl || "");
                       setEditModuleThumbnailUrl(module.thumbnailUrl || "");
                       setEditModuleVideoFile(null);
                       setEditModuleDuration(module.duration || "");
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
                  setUploadProgress(null);
                  setUploadStats(null);
                  setEditingModule(module);
                  setEditModuleTitle(module.title);
                  setEditModuleDescription(module.description || "");
                  setEditModuleQuestions(module.questions || []);
                  setEditModuleVideoUrl(module.videoUrl || "");
                        setEditSelectedFirebaseVideoUrl(module.videoUrl || "");
                  setEditModuleThumbnailUrl(module.thumbnailUrl || "");
                  setEditModuleVideoFile(null);
                  setEditModuleDuration(module.duration || "");
                  setShowEditModuleModal(true);
                }} 
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#2A0066]/20 transition-all cursor-pointer flex flex-col"
              >
                {/* Thumbnail area */}
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
                {/* Details area */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] font-black text-[#2A0066] bg-[#2A0066]/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                       Mod {String(idx + 1).padStart(2, '0')}
                     </span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg">
                       {module.duration || "N/A"}
                     </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1">{module.title}</h4>
                  <p className="text-[11px] font-semibold text-slate-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {module.description || "No description provided for this module."}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mt-auto pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md"><HelpCircle size={14} className="text-slate-300" /> {module.questions?.length || 0} Qs</div>
                    {module.videoUrl && <div className="flex items-center gap-1.5 bg-[#2A0066]/5 text-[#2A0066] px-2 py-1 rounded-md"><PlayCircle size={14} /> Video</div>}
                  </div>
                </div>
              </div>
            )
          ))
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

                  {/* Video Selection / Upload */}
                  <FirebaseVideoPicker
                    courseId={courseId}
                    currentVideoUrl={selectedFirebaseVideoUrl}
                    onVideoSelect={(v) => {
                      if (v.source === "upload" && v.file) {
                        setVideoFile(v.file);
                        setThumbnailFile(v.thumbnailFile || null);
                        setSelectedFirebaseVideoUrl("");
                      } else {
                        setSelectedFirebaseVideoUrl(v.url);
                        setVideoFile(null);
                        setThumbnailFile(null);
                      }
                    }}
                    onClearVideo={() => {
                      setSelectedFirebaseVideoUrl("");
                      setVideoFile(null);
                      setThumbnailFile(null);
                    }}
                    uploadProgress={uploadProgress}
                    uploadStats={uploadStats}
                  />

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

                  {/* Video Edit */}
                  <FirebaseVideoPicker
                    courseId={courseId}
                    currentVideoUrl={editSelectedFirebaseVideoUrl || editModuleVideoUrl}
                    onVideoSelect={(v) => {
                      if (v.source === "upload" && v.file) {
                        setEditModuleVideoFile(v.file);
                        setEditSelectedFirebaseVideoUrl("");
                      } else {
                        setEditSelectedFirebaseVideoUrl(v.url);
                        setEditModuleVideoFile(null);
                      }
                    }}
                    onClearVideo={() => {
                      setEditSelectedFirebaseVideoUrl("");
                      setEditModuleVideoUrl("");
                      setEditModuleVideoFile(null);
                    }}
                    uploadProgress={uploadProgress}
                    uploadStats={uploadStats}
                  />

                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setShowEditModuleModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                     {editingModule && (
                       editModuleTitle !== editingModule.title ||
                       editModuleDescription !== (editingModule.description || "") ||
                       editModuleDuration !== (editingModule.duration || "") ||
                       editModuleVideoFile !== null || (editSelectedFirebaseVideoUrl !== "" && editSelectedFirebaseVideoUrl !== editingModule.videoUrl)
                     ) && (
                       <button type="submit" disabled={modalLoading} className="flex-1 py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-[#2A0066]/20">
                         {modalLoading ? <Loader className="animate-spin mx-auto" size={20} /> : "Save Changes"}
                       </button>
                     )}
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
