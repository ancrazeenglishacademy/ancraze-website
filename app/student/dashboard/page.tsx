"use client";
import { useState, useEffect } from "react";
import {
    BookOpen,
    Clock,
    ArrowRight,
    Trophy,
    Target,
    Zap
} from "lucide-react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import Link from "next/link";
import Image from "next/image";

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    moduleCount?: number;
}

export default function StudentDashboardPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const uid = Cookies.get("uid");
        // Fetch student's specific courses and info
        // For now, we fetch all courses just to show something, 
        // but in a real app, we'd filter by the student's enrollment.
        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/courses");
            if (!response.ok) throw new Error("Failed to fetch courses");
            const data = await response.json();
            setCourses(data.courses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Welcome Section */}
            <div className="mb-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Welcome back, <span className="text-[#2A0066]">Student!</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Continue your learning journey where you left off.
                    </p>
                </motion.div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Enrolled Courses", value: courses.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Hours Learned", value: "12.5", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Certificates", value: "2", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Learning Streak", value: "5 Days", icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
                    >
                        <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl w-fit mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Courses Section */}
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Your Courses</h2>
                    <Link href="#" className="text-sm font-bold text-[#2A0066] hover:underline flex items-center gap-2">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-100 rounded-[32px] animate-pulse" />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-white p-12 rounded-[32px] border border-dashed border-slate-200 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No courses yet</h3>
                        <p className="text-slate-500 mt-1">You haven't been enrolled in any courses yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {courses.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all overflow-hidden cursor-pointer"
                            >
                                <div className="h-48 bg-slate-900 relative">
                                    {course.thumbnail ? (
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2A0066] to-[#4D00B8] opacity-90">
                                            <BookOpen size={48} className="text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/30">
                                            Premium
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-[#2A0066] transition-colors line-clamp-1">{course.title}</h3>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Clock size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">{course.moduleCount || 0} Modules</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Target size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Self-paced</span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-6 py-3.5 bg-slate-50 text-[#2A0066] group-hover:bg-[#2A0066] group-hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm">
                                        Continue Learning
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) }
            </div>
        </div>
    );
}
