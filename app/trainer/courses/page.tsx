"use client";
import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  BookOpen, 
  Users, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Filter,
  MoreVertical,
  PlayCircle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Cookies from "js-cookie";

export default function TrainerCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/courses"); // We'll filter them by the trainer's trainerId in Firestore shortly
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-32">
      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border border-amber-100">
             <PlayCircle size={12} /> Instructional Content Management
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
             My Courses 
             <span className="text-slate-200 text-6xl !not-italic">/</span>
          </h1>
          <p className="text-slate-400 font-bold mt-2">Create and monitor your curriculum modules and student enrollment.</p>
        </div>
        <Link href="/dashboard/course">
           <button className="flex items-center justify-center gap-3 px-10 py-5 bg-[#2A0066] text-white rounded-[28px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-[#2A0066]/20 transition-all hover:scale-[1.03] active:scale-95 group">
              New Course <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
           </button>
        </Link>
      </section>

      {/* Grid of Courses */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1,2,3].map(i => (
             <div key={i} className="h-96 rounded-[48px] bg-slate-100 animate-pulse" />
           ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {courses.map((course, idx) => (
             <motion.div 
               key={course.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:border-[#2A0066]/10 transition-all duration-500 flex flex-col"
             >
                {/* Image Wrap */}
                <div className="relative h-56 overflow-hidden">
                   <img 
                     src={course.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"} 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                   />
                   <div className="absolute top-6 right-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                      {course.price > 0 ? `$${course.price}` : 'Free'}
                   </div>
                   <div className="absolute inset-x-4 bottom-4 flex justify-center">
                     <span className="bg-white text-[#2A0066] px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                        View Curriculum
                     </span>
                   </div>
                </div>

                {/* Content */}
                <div className="p-10 flex-1 flex flex-col">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-[#2A0066] transition-colors mb-3">{course.title}</h3>
                   <p className="text-slate-400 font-bold text-sm line-clamp-2 mb-8 leading-relaxed italic pr-4">
                     "{course.description || "No description provided for this curriculum."}"
                   </p>
                   
                   <div className="mt-auto space-y-6">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <div className="flex items-center gap-2">
                            <Users size={16} className="text-[#2A0066]" />
                            <span>152 Students</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-400" />
                            <span className="text-emerald-500">92% Progress</span>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                         <Link href={`/dashboard/course/${course.id}`} className="flex-1">
                            <button className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-slate-50 hover:bg-[#2A0066] text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-inner transition-all duration-300 group/btn">
                               Edit Course <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                         </Link>
                         <button className="h-12 w-12 flex items-center justify-center text-slate-300 hover:text-[#2A0066] transition">
                            <MoreVertical size={20} />
                         </button>
                      </div>
                   </div>
                </div>
             </motion.div>
           ))}
        </section>
      )}

      {/* Course Analytics Snippet */}
      <section className="bg-[#2A0066] rounded-[64px] p-12 md:p-20 text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4 max-w-xl text-center lg:text-left">
               <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight italic uppercase">
                  Curriculum Performance 
                  <span className="text-[#6366F1] block">Insights</span>
               </h2>
               <p className="text-white/40 font-bold leading-relaxed text-lg italic pr-8">
                  Your courses are seeing a 15% increase in student completion this week. Review your analytics to see which modules are trending.
               </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:w-auto">
               <div className="p-8 bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 text-center">
                  <h4 className="text-4xl font-black tracking-tighter mb-1">856</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Enrolled</p>
               </div>
               <div className="p-8 bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 text-center">
                  <h4 className="text-4xl font-black tracking-tighter mb-1">124</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Module Hours</p>
               </div>
            </div>
         </div>
         {/* Decoration */}
         <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
         <div className="absolute bottom-0 left-0 h-48 w-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
      </section>
    </div>
  );
}
