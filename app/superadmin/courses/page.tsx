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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Course <span className="text-[#2A0066]">Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Manage curriculum offerings across the platform.
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2A0066] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          onClick={() => router.push("/superadmin/addCourse")}
        >
          <Plus size={18} />
          Create New Course
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {loading && (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="animate-spin text-[#2A0066]" size={32} />
              <p className="text-slate-500 font-medium">Loading courses...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && courses.length === 0 && !error && (
          <div className="col-span-full text-center py-12">
            <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">
              No courses found on the platform.
            </p>
          </div>
        )}

        <AnimatePresence>
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
            >
              {/* Card Thumbnail */}
              <div className="h-56 bg-slate-100 relative overflow-hidden">
                {course.coverImage ? (
                  <Image
                    src={course.coverImage}
                    alt={course.title}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#2A0066]/5 flex items-center justify-center">
                    <BookOpen size={48} className="text-[#2A0066]/20" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-slate-900 leading-tight group-hover:text-[#2A0066] transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                </div>
                <p className="text-slate-800 text-xs font-bold pt-2 line-clamp-2 block h-[40px]">
                  {course.description}
                </p>

                <p className="text-slate-400 text-xs font-bold italic pt-2">
                  Teacher: {course.instructor}
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6 mt-6">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users size={16} className="text-[#2A0066]" />
                    <span className="text-xs font-bold">
                      {course.students.toLocaleString()} Students
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Layers size={16} className="text-[#2A0066]" />
                    <span className="text-xs font-bold">
                      {course.moduleCount} Modules
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                <span className="text-lg font-black text-[#2A0066]">
                  ₹{course.price}
                </span>
                <div className="flex gap-2">
                  <button
                    className="p-2 bg-white text-slate-400 hover:text-[#2A0066] rounded-xl border border-slate-100 transition shadow-sm cursor-pointer"
                    onClick={() =>
                      router.push(`/superadmin/course/${course.id}`)
                    }
                  >
                    <Edit3 size={16} />
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
