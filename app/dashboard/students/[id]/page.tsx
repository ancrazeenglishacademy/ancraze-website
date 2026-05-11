"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Mail,
  Key,
  BookOpen,
  Calendar,
  ArrowLeft,
  Loader,
  Smartphone,
  Save,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Edit3,
  X,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: string;
  fullName: string;
  email: string;
  loginId: string;
  deviceId: string | null;
  enrolledCourses: string[];
  trainerId?: string;
  createdAt: string;
  createdByAdminName?: string;
}

interface Trainer {
  id: string;
  fullName: string;
}

interface Course {
  id: string;
  title: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCourses, setEditCourses] = useState<string[]>([]);
  const [editTrainer, setEditTrainer] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentRes, coursesRes] = await Promise.all([
        fetch(`/api/students?studentId=${studentId}`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
          },
        }),
        fetch("/api/courses", {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
          },
        }),
      ]);

      if (!studentRes.ok) throw new Error("Student not found");
      if (!coursesRes.ok) throw new Error("Failed to fetch courses");

      const studentData = await studentRes.json();
      const coursesData = await coursesRes.json();

      setStudent(studentData.student);
      setCourses(coursesData.courses);

      // Fetch trainers
      const trainersRes = await fetch("/api/students?role=trainer", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (trainersRes.ok) {
        const trainersData = await trainersRes.json();
        setTrainers(trainersData.students || []);
      }

      // Sync edit states
      setEditName(studentData.student.fullName);
      setEditCourses(studentData.student.enrolledCourses || []);
      setEditTrainer(studentData.student.trainerId || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId,
          fullName: editName,
          enrolledCourses: editCourses,
          trainerId: editTrainer || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update student");

      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetDevice = async () => {
    if (
      !confirm(
        "Are you sure you want to reset this student's device access? They will be able to log in from a new device.",
      )
    )
      return;

    try {
      setUpdating(true);
      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId,
          resetDeviceId: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to reset device access");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "ARE YOU SURE? This will permanently delete this student and their access.",
      )
    )
      return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/students?studentId=${studentId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });

      if (!response.ok) throw new Error("Failed to delete student");
      router.push("/dashboard/students");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setEditCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader className="animate-spin text-[#2A0066]" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
          Loading Student Profile...
        </p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-full">
          <User size={40} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Student Not Found</h2>
        <button
          onClick={() => router.back()}
          className="text-[#2A0066] font-bold underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 px-2 sm:px-0">
      {/* Header - Fully Responsive */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 sm:p-3 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all text-slate-400 hover:text-slate-900 group flex-shrink-0"
        >
          <ArrowLeft
            size={20}
            className="sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform"
          />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight truncate">
            {student.fullName}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-2 mt-1">
            <span className="hidden sm:inline">Student Profile •</span>
            <span className="truncate">{student.email}</span>
          </p>
        </div>
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Information Sidebar */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm space-y-6 md:space-y-8"
          >
            {/* Core Identity */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">
                Core Identity
              </p>
              <div className="space-y-4">
                <InfoItem
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={student.email}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
                />
                <InfoItem
                  icon={<Key size={18} />}
                  label="Student Login ID"
                  value={student.loginId}
                  bgColor="bg-amber-50"
                  textColor="text-amber-600"
                  isCode
                />
                <InfoItem
                  icon={<Calendar size={18} />}
                  label="Enrollment Date"
                  value={new Date(student.createdAt).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                  bgColor="bg-[#2A0066]/5"
                  textColor="text-[#2A0066]"
                />
                {student.trainerId && (
                  <InfoItem
                    icon={<User size={18} />}
                    label="Assigned Trainer"
                    value={
                      trainers.find((t) => t.id === student.trainerId)
                        ?.fullName || "Unknown Trainer"
                    }
                    bgColor="bg-amber-50"
                    textColor="text-amber-600"
                  />
                )}
                {student.createdByAdminName && (
                  <InfoItem
                    icon={<User size={18} />}
                    label="Created By"
                    value={student.createdByAdminName}
                    bgColor="bg-indigo-50"
                    textColor="text-indigo-600"
                  />
                )}
              </div>
            </div>

            {/* Device Security */}
            <div className="pt-6 md:pt-8 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">
                Device Security
              </p>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Smartphone
                    className={
                      student.deviceId
                        ? "text-green-500 flex-shrink-0"
                        : "text-slate-300 flex-shrink-0"
                    }
                    size={20}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Registered Device
                    </p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {student.deviceId || "No device linked"}
                    </p>
                  </div>
                </div>
                {student.deviceId && (
                  <button
                    onClick={handleResetDevice}
                    disabled={updating}
                    className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                    title="Reset Device Access"
                  >
                    <RefreshCw
                      size={16}
                      className={updating ? "animate-spin" : ""}
                    />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-3 italic font-medium">
                {student.deviceId
                  ? "Student is locked to this device. Reset to allow login from another device."
                  : "Student hasn't logged in yet."}
              </p>
            </div>

            {/* Delete Button */}
            <div className="pt-6 md:pt-8 border-t border-slate-50">
              <button
                onClick={handleDelete}
                disabled={updating}
                className="w-full py-3 md:py-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl md:rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Permanent Delete
              </button>
            </div>
          </motion.div>
        </div>

        {/* Main Content - Courses */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066] flex-shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">
                    Enrolled Courses
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm font-medium">
                    Manage course access for this student.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[#2A0066] text-white rounded-xl sm:rounded-2xl text-sm font-bold shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isEditing ? (
                  <>
                    <X size={16} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 size={16} />
                    Manage Access & Trainer
                  </>
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4"
                >
                  {student.enrolledCourses?.length > 0 ? (
                    courses
                      .filter((c) => student.enrolledCourses.includes(c.id))
                      .map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-[24px] border border-slate-100 group hover:shadow-sm transition-all"
                        >
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-[#2A0066] shadow-sm border border-slate-100 flex-shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                          <span className="font-bold text-sm md:text-base text-slate-900 truncate">
                            {course.title}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-2 py-12 md:py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl md:rounded-[32px]">
                      <BookOpen
                        className="mx-auto text-slate-300 mb-2"
                        size={32}
                      />
                      <p className="text-slate-500 font-bold italic text-sm">
                        No courses assigned to this student.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Trainer Selection */}
                  <div>
                    <label className="text-[10px] font-black text-[#2A0066] uppercase tracking-[2px] ml-1 block mb-4">
                      Assigned Trainer
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <select
                        value={editTrainer}
                        onChange={(e) => setEditTrainer(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="">No Trainer Assigned</option>
                        {trainers.map((trainer) => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Course Selection */}
                  <div>
                    <label className="text-[10px] font-black text-[#2A0066] uppercase tracking-[2px] ml-1 block mb-4">
                      Select Courses to Assign
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => toggleCourse(course.id)}
                          className={`flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border-2 ${
                            editCourses.includes(course.id)
                              ? "border-[#2A0066] bg-[#2A0066]/5"
                              : "border-slate-50 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`text-xs md:text-sm font-bold truncate ${editCourses.includes(course.id) ? "text-[#2A0066]" : "text-slate-600"}`}
                          >
                            {course.title}
                          </span>
                          {editCourses.includes(course.id) && (
                            <CheckCircle2
                              size={16}
                              className="text-[#2A0066] flex-shrink-0 ml-2"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditCourses(student.enrolledCourses || []);
                          setEditTrainer(student.trainerId || "");
                        }}
                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="flex-1 px-4 py-3 bg-[#2A0066] text-white rounded-xl font-bold shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {updating ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Helper component for info items
function InfoItem({
  icon,
  label,
  value,
  bgColor,
  textColor,
  isCode = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  textColor: string;
  isCode?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 md:gap-4">
      <div
        className={`p-2.5 md:p-3 ${bgColor} ${textColor} rounded-xl md:rounded-2xl flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-400">{label}</p>
        {isCode ? (
          <code className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded italic block truncate">
            {value}
          </code>
        ) : (
          <p className="font-bold text-sm md:text-base text-slate-900 truncate">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
