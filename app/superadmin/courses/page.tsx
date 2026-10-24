"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { BookOpen, Users, Layers, Loader, Plus, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  students: number;
  status: string;
  price: string;
  coverImage: string;
  moduleCount: number;
  createdAt: string;
}

export default function SuperAdminCoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      const formattedCourses = (data.courses || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        instructor: course.teacherName,
        students: course.studentCount || 0,
        status: "Active",
        price: course.price,
        coverImage: course.coverImage,
        moduleCount: course.moduleCount || 0,
        createdAt: course.createdAt,
      }));
      setCourses(formattedCourses);
      setError(null);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Course <span className="text-[#2A0066]">Management</span>
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs sm:text-sm font-medium">
            Manage curriculum offerings across the platform.
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          onClick={() => router.push("/superadmin/addCourse")}
        >
          <Plus size={16} />
          Create New Course
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mt-4">
        {loading && (
          <div className="col-span-full flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-2">
              <Loader className="animate-spin text-[#2A0066]" size={28} />
              <p className="text-slate-500 text-xs font-medium">Loading courses...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && courses.length === 0 && !error && (
          <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-bold">
              No courses found on the platform.
            </p>
          </div>
        )}

        <AnimatePresence>
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Card Thumbnail */}
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  {course.coverImage ? (
                    <Image
                      src={course.coverImage}
                      alt={course.title}
                      fill
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#2A0066]/5 flex items-center justify-center">
                      <BookOpen size={36} className="text-[#2A0066]/20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 leading-snug group-hover:text-[#2A0066] transition-colors line-clamp-1 text-sm sm:text-base">
                      {course.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-xs font-medium pt-1 line-clamp-2 h-[34px]">
                    {course.description}
                  </p>

                  <p className="text-slate-400 text-[11px] font-semibold pt-1">
                    Teacher: {course.instructor || "Platform Faculty"}
                  </p>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 mt-3">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users size={14} className="text-[#2A0066]" />
                      <span className="text-[11px] font-bold">
                        {course.students.toLocaleString()} Students
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Layers size={14} className="text-[#2A0066]" />
                      <span className="text-[11px] font-bold">
                        {course.moduleCount} Modules
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-4 sm:px-5 py-3 bg-slate-50/70 flex items-center justify-between border-t border-slate-100">
                <span className="text-base font-black text-[#2A0066]">
                  ₹{course.price}
                </span>
                <div className="flex gap-2">
                  <button
                    className="p-1.5 bg-white text-slate-400 hover:text-[#2A0066] rounded-lg border border-slate-200/80 transition shadow-xs cursor-pointer"
                    onClick={() =>
                      router.push(`/superadmin/course/${course.id}`)
                    }
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
