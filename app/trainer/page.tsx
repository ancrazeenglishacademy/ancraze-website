"use client";
import React from "react";
import { 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  FileText 
} from "lucide-react";
import { motion } from "framer-motion";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function TrainerDashboard() {
  const [stats, setStats] = useState([
    { label: "Total Students", value: "0", icon: <Users size={24} />, trend: "Update live", color: "bg-blue-50 text-blue-600" },
    { label: "Tasks Pending", value: "0", icon: <CheckCircle2 size={24} />, trend: "Awaiting review", color: "bg-orange-50 text-orange-600" },
    { label: "Active Courses", value: "0", icon: <TrendingUp size={24} />, trend: "Curriculum load", color: "bg-purple-50 text-purple-600" },
    { label: "Completion Rate", value: "0%", icon: <Calendar size={24} />, trend: "Cohort average", color: "bg-emerald-50 text-emerald-600" },
  ]);
  const [trainerName, setTrainerName] = useState("Trainer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashData();
    setTrainerName(Cookies.get("fullName") || "Trainer");
  }, []);

  const fetchDashData = async () => {
    try {
      setLoading(true);
      
      const userDataCookie = Cookies.get("userData");
      let trainerUid = "";
      if (userDataCookie) {
        try {
          const parsedData = JSON.parse(userDataCookie);
          trainerUid = parsedData.uid || "";
        } catch (e) {
          console.error("Failed to parse trainer data", e);
        }
      }

      if (!trainerUid) {
        console.warn("No trainer UID found for dashboard stats");
        setLoading(false);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "";
      const res = await fetch(`/api/students?trainerId=${trainerUid}`, {
        headers: { "x-api-key": apiKey }
      });
      const data = await res.json();
      const studentCount = data.students?.length || 0;

      const courseRes = await fetch("/api/courses", {
        headers: { "x-api-key": apiKey }
      });
      const courseData = await courseRes.json();
      const courseCount = courseData.courses?.length || 0;

      setStats([
        { label: "Total Students", value: studentCount.toString(), icon: <Users size={24} />, trend: "Active roster", color: "bg-blue-50 text-blue-600" },
        { label: "Tasks Pending", value: "12", icon: <CheckCircle2 size={24} />, trend: "Review needed", color: "bg-orange-50 text-orange-600" },
        { label: "Active Courses", value: courseCount.toString(), icon: <TrendingUp size={24} />, trend: "Platform total", color: "bg-purple-50 text-purple-600" },
        { label: "Success Rate", value: "94%", icon: <Calendar size={24} />, trend: "High performance", color: "bg-emerald-50 text-emerald-600" },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex-1 space-y-4 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A0066]/5 text-[#2A0066] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#2A0066]/10 mb-2">
             <Clock size={14} /> Real-time Instructional Monitor
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
             Good Afternoon, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] to-[#6366F1]">{trainerName}</span> 👋
          </h1>
          <p className="text-slate-400 font-bold max-w-xl text-lg italic pr-4">
             "Your instructional dashboard is synchronized. You have students actively progressing through your curriculum modules."
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button className="px-8 py-5 bg-[#2A0066] text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-[#2A0066]/30 hover:opacity-90 transition-all flex items-center gap-2">
               Review Tasks <ArrowUpRight size={18} />
            </button>
            <button className="px-8 py-5 bg-white text-[#2A0066] border-2 border-[#2A0066] rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-[#2A0066]/5 transition-all">
               Manage Students
            </button>
          </div>
        </div>
        <div className="w-80 h-80 bg-slate-50 rounded-full flex items-center justify-center border-2 border-slate-100 relative group transition-all">
           <img src="https://ui-avatars.com/api/?name=Trainer&background=2A0066&color=fff&size=512" className="w-64 h-64 rounded-full object-cover shadow-2xl group-hover:scale-105 transition-all duration-500" />
           <div className="absolute -top-4 -right-4 h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center animate-bounce border border-slate-50">
              <span className="text-4xl font-black text-[#2A0066]">🔥</span>
           </div>
        </div>
        {/* Abstract shapes for premium feel */}
        <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-[#2A0066]/5 rounded-full blur-3xl" />
        <div className="absolute -top-24 -right-24 h-64 w-64 bg-blue-400/5 rounded-full blur-3xl" />
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500 cursor-pointer relative overflow-hidden"
          >
            <div className={`p-4 rounded-3xl w-fit ${stat.color} mb-6 group-hover:scale-110 transition-transform duration-500`}>
              {stat.icon}
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{stat.value}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-emerald-500 bg-emerald-50 w-fit px-3 py-1.5 rounded-full">
               <TrendingUp size={12} /> {stat.trend}
            </div>
            {/* Hover accent */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2A0066] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </motion.div>
        ))}
      </section>

      {/* Recent Activity/Tasks Split */}
      <section className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Task Updates</h3>
               <button className="text-[10px] font-black text-[#2A0066] uppercase tracking-widest hover:underline">View All Tasks</button>
            </div>
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
               {[1,2,3].map((task) => (
                 <div key={task} className="p-8 hover:bg-slate-50 transition flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                       <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#2A0066] transition group-hover:border-[#2A0066]/20">
                          <FileText size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-base">Module {task} Feedback Review</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Student: Arjun Patel • Physics Honors</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase whitespace-nowrap">Awaiting Action</span>
                       <span className="text-[9px] font-bold text-slate-300">Updated 2h ago</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Students</h3>
               <button className="text-[10px] font-black text-[#2A0066] uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 space-y-6">
               {[1,2,3,4].map((student) => (
                 <div key={student} className="flex items-center justify-between group cursor-pointer transition">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-full border-2 border-[#2A0066]/10 p-0.5 group-hover:border-[#2A0066] transition duration-300">
                          <img src={`https://i.pravatar.cc/150?u=${student}`} className="rounded-full w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-300" />
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-slate-800">Student {student}</h4>
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online Now</p>
                       </div>
                    </div>
                    <button className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#2A0066] group-hover:bg-[#2A0066]/5 transition">
                       <ArrowUpRight size={16} />
                    </button>
                 </div>
               ))}
               <div className="pt-4 border-t border-slate-50 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase italic">15 other students are currently active</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
