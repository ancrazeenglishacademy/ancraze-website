"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  GripVertical
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

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim() || !moduleDuration.trim() || !videoFile) {
      alert("Please fill all required fields: Title, Duration, and Video.");
      return;
    }

    setModalLoading(true);
    try {
      let videoUrl = "";
      let thumbnailUrl = "";
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append("video", videoFile);
        if (thumbnailFile) videoFormData.append("thumbnail", thumbnailFile);
        videoFormData.append("courseId", courseId);
        const videoRes = await fetch("/api/upload-video", { method: "POST", body: videoFormData });
        if (videoRes.ok) {
          const result = await videoRes.json();
          videoUrl = result.videoUrl;
          thumbnailUrl = result.thumbnailUrl || "";
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

  const handleSaveModuleEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModuleTitle.trim() || !editingModule) return;

    setModalLoading(true);
    try {
      let videoUrl = editModuleVideoUrl;
      if (editModuleVideoFile) {
        const videoFormData = new FormData();
        videoFormData.append("video", editModuleVideoFile);
        videoFormData.append("courseId", courseId);
        const videoRes = await fetch("/api/upload-video", { method: "POST", body: videoFormData });
        if (videoRes.ok) videoUrl = (await videoRes.json()).videoUrl;
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
    } catch (error) {
       console.error(error);
    } finally {
      setModalLoading(false);
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
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-[#2A0066] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:opacity-95 transition-all"
        >
          <Plus size={18} />
          Add New Module
        </button>
      </div>

      {/* Modules List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white/50 rounded-[32px] border border-dashed border-slate-200">
             <Loader size={32} className="animate-spin text-[#2A0066]" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-[32px] border border-dashed border-slate-200">
            <PlayCircle size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No modules added to this day yet</p>
          </div>
        ) : (
          modules.map((module, idx) => (
            <div key={module.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
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
                   onClick={() => {
                     setEditingModule(module);
                     setEditModuleTitle(module.title);
                     setEditModuleDescription(module.description || "");
                     setEditModuleQuestions(module.questions || []);
                     setEditModuleVideoUrl(module.videoUrl || "");
                     setEditModuleDuration(module.duration || "");
                     setShowEditModuleModal(true);
                   }}
                   className="p-3 text-slate-300 hover:text-[#2A0066] hover:bg-slate-50 rounded-xl transition"
                 >
                   <Settings size={18} />
                 </button>
                 <button 
                   onClick={() => handleDeleteModule(module.id)}
                   className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                 >
                   <Trash2 size={18} />
                 </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Module Modal (Create) */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={() => !modalLoading && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Create Module</h2>
                 <button onClick={() => setShowModal(false)}><X size={24} /></button>
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

                  {/* Video Upload */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Module Video (Required) <span className="text-red-500">*</span></label>
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-[#2A0066] transition cursor-pointer relative bg-slate-50/50">
                      <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Upload size={32} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">
                        {videoFile ? videoFile.name : "Select Video from Device"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">MP4, WebM up to 50MB</p>
                    </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={() => !modalLoading && setShowEditModuleModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Module</h2>
                 <button onClick={() => setShowEditModuleModal(false)}><X size={24} /></button>
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
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Module Video</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center bg-slate-50/50 relative">
                      <input type="file" accept="video/*" onChange={(e) => setEditModuleVideoFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Upload size={24} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">
                        {editModuleVideoFile ? editModuleVideoFile.name : (editModuleVideoUrl ? "Video Uploaded (Click to change)" : "Select Video")}
                      </p>
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
