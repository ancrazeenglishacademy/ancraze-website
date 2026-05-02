"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  ChevronRight,
  PlayCircle,
  FileText,
  HelpCircle,
  MoreVertical,
  GripVertical,
  Settings,
  CheckCircle2,
  Eye,
  LayoutList,
  X,
  Upload,
  Loader,
  Trash2,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [courseTitle, setCourseTitle] = useState("Loading...");
  const [view, setView] = useState("modules");
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [courseData, setCourseData] = useState<any>(null);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  
  // Day states
  const [days, setDays] = useState<any[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [dayTitle, setDayTitle] = useState("");
  const [editingDay, setEditingDay] = useState<any>(null);
  const [dayOrder, setDayOrder] = useState("");

  // Course edit states
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDescription, setEditCourseDescription] = useState("");
  const [editCoursePrice, setEditCoursePrice] = useState("");
  const [editCoverImage, setEditCoverImage] = useState<string>("");
  const [editCoverImagePreview, setEditCoverImagePreview] = useState<string>("");

  // Module edit states
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDay, setEditModuleDay] = useState("");
  const [editModuleQuestions, setEditModuleQuestions] = useState<any[]>([]);
  const [editModuleVideoUrl, setEditModuleVideoUrl] = useState("");
  const [editModuleVideoFile, setEditModuleVideoFile] = useState<File | null>(null);
  const [editModuleDuration, setEditModuleDuration] = useState("");
  const [currentEditQuestion, setCurrentEditQuestion] = useState("");
  const [currentEditAnswer, setCurrentEditAnswer] = useState("");

  // Modal form states
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDay, setModuleDay] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [moduleDuration, setModuleDuration] = useState("");
  const [questions, setQuestions] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");

  // Fetch course details and modules
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "" };
        const courseRes = await fetch(`/api/courses?courseId=${courseId}`, { headers });
        if (courseRes.ok) {
           const courseResData = await courseRes.json();
           if (courseResData.course) {
             setCourseData(courseResData.course);
             setCourseTitle(courseResData.course.title);
           }
        }

        // Fetch Days
        const daysRes = await fetch(`/api/days?courseId=${courseId}`, { headers });
        if (daysRes.ok) {
          const daysData = await daysRes.json();
          setDays(daysData.days || []);
        }

        // Fetch modules (for "Other" or for global count)
        const modulesRes = await fetch(`/api/modules?courseId=${courseId}`, { headers });
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
  }, [courseId]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addQuestion = () => {
    if (currentQuestion.trim() && currentAnswer.trim()) {
      setQuestions([
        ...questions,
        { question: currentQuestion, answer: currentAnswer },
      ]);
      setCurrentQuestion("");
      setCurrentAnswer("");
    }
  };

  const addEditQuestion = () => {
    if (currentEditQuestion.trim() && currentEditAnswer.trim()) {
      setEditModuleQuestions([
        ...editModuleQuestions,
        { question: currentEditQuestion, answer: currentEditAnswer },
      ]);
      setCurrentEditQuestion("");
      setCurrentEditAnswer("");
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };
  const handleSubmitDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayTitle.trim()) return;

    setModalLoading(true);
    try {
      const response = await fetch("/api/days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          courseId,
          title: dayTitle,
          order: dayOrder ? parseInt(dayOrder) : days.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to create day");

      const data = await response.json();
      setDays([...days, { id: data.dayId, ...data.day, createdAt: new Date().toISOString() }]);
      setDayTitle("");
      setDayOrder("");
      setShowDayModal(false);
    } catch (error) {
      console.error("Error creating day:", error);
      alert("Error creating day");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayTitle.trim() || !editingDay) return;

    setModalLoading(true);
    try {
      const response = await fetch("/api/days/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          courseId,
          dayId: editingDay.id,
          title: dayTitle,
          order: dayOrder ? parseInt(dayOrder) : editingDay.order,
        }),
      });

      if (!response.ok) throw new Error("Failed to update day");

      setDays(days.map(d => d.id === editingDay.id ? { ...d, title: dayTitle, order: dayOrder ? parseInt(dayOrder) : d.order } : d));
      setShowEditDayModal(false);
      setEditingDay(null);
    } catch (error) {
      console.error("Error updating day:", error);
      alert("Error updating day");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm("Are you sure you want to delete this day? All lessons in this day might lose their parent.")) return;

    try {
      const response = await fetch(`/api/days?courseId=${courseId}&dayId=${dayId}`, {
        method: "DELETE",
        headers: { "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "" },
      });

      if (response.ok) {
        setDays(days.filter(d => d.id !== dayId));
      }
    } catch (error) {
      console.error("Error deleting day:", error);
    }
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) {
      alert("Please enter a module title");
      return;
    }
    if (moduleTitle.trim().length < 3) {
      alert("Module title must be at least 3 characters long");
      return;
    }

    setModalLoading(true);
    try {
      // First, handle video upload if exists
      let videoUrl = '';
      if (videoFile) {
        try {
          const videoFormData = new FormData();
          videoFormData.append('video', videoFile!);
          videoFormData.append('courseId', courseId);

          const videoRes = await fetch('/api/upload-video', {
            method: 'POST',
            body: videoFormData,
          });

          if (videoRes.ok) {
            const videoData = await videoRes.json();
            videoUrl = videoData.videoUrl;
            console.log('✅ Video uploaded:', videoUrl);
          }
        } catch (videoError) {
          console.error('⚠️ Video upload failed (continuing without video):', videoError);
          // Continue without video
        }
      }

      // Send module data as JSON (no files)
      const modulePayload = {
        courseId,
        moduleTitle,
        day: moduleDay,
        videoUrl,
        questions,
        duration: moduleDuration,
      };

      const response = await fetch("/api/modules", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modulePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.details || `Failed to create module: ${response.status}`);
      }

      const data = await response.json();

      // Add new module to list
      setModules([
        ...modules,
        {
          id: data.moduleId,
          title: moduleTitle,
          day: moduleDay,
          videoUrl: videoUrl,
          questions: questions,
          duration: moduleDuration,
          createdAt: new Date().toISOString(),
        }
      ]);

      // Reset form
      setModuleTitle("");
      setModuleDay("");
      setVideoFile(null);
      setVideoPreview("");
      setQuestions([]);
      setModuleDuration("");
      setCurrentQuestion("");
      setCurrentAnswer("");
      setShowModal(false);

      alert("Module created successfully!");
    } catch (error) {
      console.error("❌ Error creating module:", error);
      alert(`Error creating module: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      const response = await fetch(
        `/api/modules?courseId=${courseId}&moduleId=${moduleId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setModules(modules.filter((m) => m.id !== moduleId));
        alert("Module deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting module:", error);
      alert("Error deleting module");
    }
  };

  const openEditCourseModal = () => {
    setEditCourseTitle(courseData?.title || "");
    setEditCourseDescription(courseData?.description || "");
    setEditCoursePrice(courseData?.price?.toString() || "");
    setEditCoverImagePreview(courseData?.coverImage || "");
    setShowEditCourseModal(true);
  };

  const handleEditCourseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditCoverImage(reader.result as string);
        setEditCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCourseEdits = async () => {
    if (!editCourseTitle.trim()) {
      alert("Please enter a course title");
      return;
    }
    if (editCourseTitle.trim().length < 3) {
      alert("Course title must be at least 3 characters long");
      return;
    }
    if (!editCoursePrice || parseFloat(editCoursePrice) < 0) {
      alert("Price must be a valid positive number");
      return;
    }

    setModalLoading(true);
    try {
      const response = await fetch("/api/courses/update", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          courseId,
          title: editCourseTitle,
          description: editCourseDescription,
          price: editCoursePrice,
          coverImage: editCoverImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update course");
      }

      const data = await response.json();
      setCourseTitle(editCourseTitle);
      setCourseData({
        ...courseData,
        title: editCourseTitle,
        description: editCourseDescription,
        price: parseFloat(editCoursePrice),
        coverImage: editCoverImagePreview,
      });

      setShowEditCourseModal(false);
      alert("Course updated successfully!");
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Error updating course");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    setModalLoading(true);
    try {
      const response = await fetch(`/api/courses?courseId=${courseId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      alert("Course deleted successfully!");
      router.push("/dashboard/course");
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Error deleting course");
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModuleModal = (module: any) => {
    setEditingModule(module);
    setEditModuleTitle(module.title);
    setEditModuleDay(module.day || "");
    setEditModuleQuestions(module.questions || []);
    setEditModuleVideoUrl(module.videoUrl || "");
    setEditModuleDuration(module.duration || "");
    setShowEditModuleModal(true);
  };

  const handleEditModuleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditModuleVideoFile(file);
    }
  };

  const handleSaveModuleEdits = async () => {
    if (!editModuleTitle.trim()) {
      alert("Please enter a module title");
      return;
    }
    if (editModuleTitle.trim().length < 3) {
      alert("Module title must be at least 3 characters long");
      return;
    }

    setModalLoading(true);
    try {
      let videoUrl = editModuleVideoUrl;

      // Upload new video if selected
      if (editModuleVideoFile) {
        const videoFormData = new FormData();
        videoFormData.append("video", editModuleVideoFile!);
        videoFormData.append("courseId", courseId);

        const videoRes = await fetch("/api/upload-video", {
          method: "POST",
          body: videoFormData,
        });

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          videoUrl = videoData.videoUrl;
        }
      }

      const response = await fetch("/api/modules/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          moduleId: editingModule.id,
          title: editModuleTitle,
          day: editModuleDay,
          questions: editModuleQuestions,
          videoUrl,
          duration: editModuleDuration,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update module");
      }

      const updatedModule = {
        ...editingModule,
        title: editModuleTitle,
        day: editModuleDay,
        questions: editModuleQuestions,
        videoUrl,
        duration: editModuleDuration,
      };

      setModules(modules.map((m) => (m.id === editingModule.id ? updatedModule : m)));
      setShowEditModuleModal(false);
      alert("Module updated successfully!");
    } catch (error) {
      console.error("Error updating module:", error);
      alert("Error updating module");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 space-y-8 ">
      {/* Sticky Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 bg-[#2A0066] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2A0066]/20">
            <PlayCircle size={26} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {courseTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">

              {courseData?.teacherName && (
                <>
                  <span className="text-slate-300">•</span>
                  <p className="text-slate-600 text-xs font-semibold">
                    Teacher: {courseData.teacherName}
                  </p>
                </>
              )}
              {courseData?.price !== undefined && courseData?.price !== null && (
                <>
                  <span className="text-slate-300">•</span>
                  <p className="text-[#2A0066] text-xs font-bold">
                    ${Number(courseData.price).toFixed(2)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Toggled Curriculum */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Curriculum Structure
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Manage your course content flow
              </p>
            </div>
          </div>

          {/* Animated Content Area */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader size={32} className="animate-spin text-[#2A0066] mx-auto mb-4" />
                  <p className="text-slate-500">Loading modules...</p>
                </div>
              </div>
            ) : (
              <motion.div
                key="modules-list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                     {days.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No days added yet. Create your first day to start adding content.</p>
                  </div>
                ) : (
                  days.map((day, dIdx) => (
                    <div 
                      key={day.id} 
                      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
                      onClick={() => router.push(`/dashboard/course/${courseId}/day/${day.id}`)}
                    >
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 bg-[#2A0066]/5 rounded-2xl flex items-center justify-center text-[#2A0066] font-black group-hover:bg-[#2A0066] group-hover:text-white transition-all">
                          {String(dIdx + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 leading-tight">
                            {day.title}
                          </h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Click to manage modules for this day
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDay(day);
                            setDayTitle(day.title);
                            setShowEditDayModal(true);
                          }}
                          className="p-3 bg-slate-50 text-slate-400 hover:text-[#2A0066] rounded-xl border border-slate-100 transition"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDay(day.id);
                          }}
                          className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={() => setShowDayModal(true)}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs font-bold hover:border-[#2A0066] hover:text-[#2A0066] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add New Day
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2">
              <Settings size={18} className="text-[#2A0066]" />
              Course Details
            </h3>
            <div className="space-y-4">
              <DetailField label="Instructor" value={courseData?.teacherName || "N/A"} />
              <DetailField label="Price" value={`$${courseData?.price || "0"}`} />
              <DetailField label="Modules" value={`${modules.length} Modules`} />
              <DetailField label="Last Updated" value="Jan 21, 2026" />
            </div>
            <button
              onClick={openEditCourseModal}
              className="w-full mt-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800"
            >
              Edit Course Details
            </button>
            <button
              onClick={handleDeleteCourse}
              disabled={modalLoading}
              className="w-full mt-3 py-3 border border-red-100 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete Course
            </button>
          </div>
        </div>
      </div>

      {/* Add Day Modal */}
      <AnimatePresence>
        {showDayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
            onClick={() => !modalLoading && setShowDayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Create New Day</h2>
              <form onSubmit={handleSubmitDay} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Day Title</label>
                  <input
                    type="text"
                    required
                    value={dayTitle}
                    onChange={(e) => setDayTitle(e.target.value)}
                    placeholder="e.g., Week 1 - Introduction"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Order Index (Optional)</label>
                  <input
                    type="number"
                    value={dayOrder}
                    onChange={(e) => setDayOrder(e.target.value)}
                    placeholder="e.g., 0"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none font-bold text-slate-700"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDayModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader size={16} className="animate-spin" /> : "Create Day"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Day Modal */}
      <AnimatePresence>
        {showEditDayModal && editingDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
            onClick={() => !modalLoading && setShowEditDayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Edit Day</h2>
              <form onSubmit={handleUpdateDay} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Day Title</label>
                  <input
                    type="text"
                    required
                    value={dayTitle}
                    onChange={(e) => setDayTitle(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none font-bold text-slate-700"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditDayModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader size={16} className="animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Course Modal */}
      <AnimatePresence>
        {showEditCourseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !modalLoading && setShowEditCourseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                <h2 className="text-2xl font-black text-slate-900">Edit Course</h2>
                <button
                  onClick={() => !modalLoading && setShowEditCourseModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveCourseEdits(); }} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Course Title</label>
                  <input
                    type="text"
                    value={editCourseTitle}
                    onChange={(e) => setEditCourseTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                  <textarea
                    value={editCourseDescription}
                    onChange={(e) => setEditCourseDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none resize-none"
                    disabled={modalLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={editCoursePrice}
                    onChange={(e) => setEditCoursePrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Cover Image</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#2A0066] transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditCourseImageChange}
                      disabled={modalLoading}
                      className="hidden"
                      id="edit-cover-image"
                    />
                    <label htmlFor="edit-cover-image" className="cursor-pointer block">
                      <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-bold text-slate-600">Click to change cover image</p>
                    </label>
                  </div>
                  {editCoverImagePreview && (
                    <div className="mt-4">
                      <img
                        src={editCoverImagePreview}
                        alt="Cover preview"
                        className="max-w-xs h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => !modalLoading && setShowEditCourseModal(false)}
                    disabled={modalLoading}
                    className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 bg-[#2A0066] text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {modalLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !modalLoading && setShowEditModuleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                <h2 className="text-2xl font-black text-slate-900">Edit Module</h2>
                <button
                  onClick={() => !modalLoading && setShowEditModuleModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveModuleEdits(); }} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Module Title</label>
                  <input
                    type="text"
                    value={editModuleTitle}
                    onChange={(e) => setEditModuleTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Module Day (e.g., D1, D2)</label>
                  <input
                    type="text"
                    value={editModuleDay}
                    onChange={(e) => setEditModuleDay(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Module Duration</label>
                  <input
                    type="text"
                    value={editModuleDuration}
                    onChange={(e) => setEditModuleDuration(e.target.value)}
                    placeholder="e.g., 45 mins"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Upload New Video (Optional)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#2A0066] transition">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleEditModuleVideoChange}
                      disabled={modalLoading}
                      className="hidden"
                      id="edit-video-upload"
                    />
                    <label htmlFor="edit-video-upload" className="cursor-pointer block">
                      <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-bold text-slate-600">
                        {editModuleVideoFile ? editModuleVideoFile.name : "Click to upload new video"}
                      </p>
                    </label>
                  </div>
                  {editModuleVideoUrl && !editModuleVideoFile && (
                    <p className="text-xs text-slate-500 mt-2">Current video: {editModuleVideoUrl.split('/').pop()}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Practice Questions</h3>
                  <div className="space-y-3">
                    {editModuleQuestions.map((q, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-bold text-slate-700">Q{idx + 1}</p>
                          <button
                            type="button"
                            onClick={() => setEditModuleQuestions(editModuleQuestions.filter((_, i) => i !== idx))}
                            disabled={modalLoading}
                            className="text-red-500 hover:bg-red-100 p-1 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...editModuleQuestions];
                            updated[idx].question = e.target.value;
                            setEditModuleQuestions(updated);
                          }}
                          placeholder="Question"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2"
                          disabled={modalLoading}
                        />
                        <textarea
                          value={q.answer}
                          onChange={(e) => {
                            const updated = [...editModuleQuestions];
                            updated[idx].answer = e.target.value;
                            setEditModuleQuestions(updated);
                          }}
                          placeholder="Answer"
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                          disabled={modalLoading}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Add Question in Edit Modal */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-slate-600">Add New Question</p>
                    <textarea
                      value={currentEditQuestion}
                      onChange={(e) => setCurrentEditQuestion(e.target.value)}
                      placeholder="Enter question..."
                      rows={2}
                      disabled={modalLoading}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none resize-none"
                    />
                    <textarea
                      value={currentEditAnswer}
                      onChange={(e) => setCurrentEditAnswer(e.target.value)}
                      placeholder="Enter answer..."
                      rows={2}
                      disabled={modalLoading}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none resize-none"
                    />
                    <button
                      type="button"
                      onClick={addEditQuestion}
                      disabled={modalLoading || !currentEditQuestion.trim() || !currentEditAnswer.trim()}
                      className="w-full py-2 border border-[#2A0066] text-[#2A0066] text-xs font-bold rounded-lg hover:bg-[#2A0066]/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add This Question
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => !modalLoading && setShowEditModuleModal(false)}
                    disabled={modalLoading}
                    className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 bg-[#2A0066] text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {modalLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !modalLoading && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                <h2 className="text-2xl font-black text-slate-900">Create New Module</h2>
                <button
                  onClick={() => !modalLoading && setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmitModule} className="p-6 space-y-6">
                {/* Module Title */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Module Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="e.g., Introduction to Spanish Basics"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                {/* Module Day */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Module Day (e.g., D1, D2)
                  </label>
                  <input
                    type="text"
                    value={moduleDay}
                    onChange={(e) => setModuleDay(e.target.value)}
                    placeholder="e.g., D1"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Module Duration
                  </label>
                  <input
                    type="text"
                    value={moduleDuration}
                    onChange={(e) => setModuleDuration(e.target.value)}
                    placeholder="e.g., 45 mins"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none"
                    disabled={modalLoading}
                  />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Upload Video
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#2A0066] transition">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      disabled={modalLoading}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer block">
                      <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-bold text-slate-600">
                        {videoFile ? videoFile.name : "Click to upload video"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">MP4, WebM, or other video formats</p>
                    </label>
                  </div>
                </div>

                {/* Practice Questions Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <HelpCircle size={16} className="text-[#2A0066]" />
                    Practice Questions
                  </h3>

                  {/* Questions List */}
                  {questions.length > 0 && (
                    <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                      {questions.map((q, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 p-3 rounded-lg flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">Q{idx + 1}: {q.question}</p>
                            <p className="text-xs text-slate-500">Ans: {q.answer.substring(0, 50)}...</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            disabled={modalLoading}
                            className="flex-shrink-0 p-1 hover:bg-red-100 text-red-500 rounded transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Question Form */}
                  <div className="space-y-2">
                    <textarea
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      placeholder="Enter question..."
                      rows={2}
                      disabled={modalLoading}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none resize-none"
                    />
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Enter answer..."
                      rows={2}
                      disabled={modalLoading}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none resize-none"
                    />
                    <button
                      type="button"
                      onClick={addQuestion}
                      disabled={modalLoading || !currentQuestion.trim() || !currentAnswer.trim()}
                      className="w-full py-2 border border-[#2A0066] text-[#2A0066] text-xs font-bold rounded-lg hover:bg-[#2A0066]/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Question
                    </button>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => !modalLoading && setShowModal(false)}
                    disabled={modalLoading}
                    className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading || !moduleTitle.trim()}
                    className="flex-1 py-3 bg-[#2A0066] text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {modalLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Module
                      </>
                    )}
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

// Sub-components
function ModuleItem({
  index,
  title,
  type,
  questions,
  duration,
  onEdit,
  onDelete,
}: {
  index: string;
  title: string;
  type: string;
  questions?: number;
  duration?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div className="flex items-center gap-5 flex-1">
        <GripVertical size={18} className="text-slate-200" />
        <span className="text-lg font-black text-slate-200">{index}</span>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#2A0066] transition-colors">
            {title}
          </h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {type}
            {questions !== undefined && ` • ${questions} Questions`}
            {duration && ` • ${duration}`}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="text-slate-300 hover:text-[#2A0066] transition p-2 hover:bg-slate-100 rounded-lg"
        >
          <FileText size={18} />
        </button>
        <button
          onClick={onDelete}
          className="text-slate-300 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-lg"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function QuestionItem({
  title,
  module,
  answer,
}: {
  title: string;
  module: string;
  answer: string;
}) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066] flex-shrink-0">
          <HelpCircle size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 break-words">{title}</h4>
          <p className="text-[10px] font-black text-[#2A0066] uppercase tracking-widest mt-1 mb-2">
            Module: {module}
          </p>
          <p className="text-xs text-slate-600 break-words">Answer: {answer}</p>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}