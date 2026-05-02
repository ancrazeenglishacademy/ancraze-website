"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Key,
  Calendar,
  ChevronRight,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import Cookies from "js-cookie";

export default function TrainerStudents() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      
      // Extract trainer ID from the client-accessible 'userData' cookie
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

      const apiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "";
      
      if (!trainerUid) {
        console.warn("No trainer UID found in session");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/students?trainerId=${trainerUid}`, {
        headers: { "x-api-key": apiKey }
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2A0066]">
            Student <span className="text-slate-900">Management</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm">
            View, track, and support your assigned students.
          </p>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm w-full md:w-64">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Students</p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">{students.length}</h4>
          </div>
        </div>
      </div>

      {/* Search Layer */}
      <div className="bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 px-6 group focus-within:ring-2 focus-within:ring-[#2A0066]/5 transition-all">
        <Search size={18} className="text-slate-300 group-focus-within:text-[#2A0066]" />
        <input 
          placeholder="Search by name, email or Login ID..." 
          className="w-full bg-transparent border-none focus:ring-0 py-4 text-sm font-bold text-slate-600 placeholder:text-slate-300"
        />
      </div>

      {/* Table-Style List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Head */}
        <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50/50 border-b border-slate-100">
           <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</div>
           <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Login ID</div>
           <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Courses</div>
           <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</div>
           <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-40">
              <div className="h-10 w-10 border-4 border-[#2A0066] border-t-transparent rounded-full animate-spin" />
              <p className="font-black text-[10px] uppercase tracking-widest mt-4">Synchronizing Cohort...</p>
            </div>
          ) : students.length > 0 ? (
            students.map((student, idx) => (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-slate-50/50 transition duration-300 group cursor-pointer"
              >
                {/* Student Info */}
                <div className="col-span-4 flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066] group-hover:bg-[#2A0066] group-hover:text-white transition-all font-black text-lg border border-[#2A0066]/10">
                    {student.fullName ? student.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{student.fullName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{student.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-50 text-[8px] font-black text-orange-600 uppercase tracking-widest border border-orange-100 rounded-md">
                      Trainer: {Cookies.get("fullName") || "Me"}
                    </span>
                  </div>
                </div>

                {/* Login ID */}
                <div className="col-span-3 flex items-center gap-2">
                  <Key size={14} className="text-orange-400" />
                  <code className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono font-bold text-[#2A0066]">
                    {student.loginId || "---"}
                  </code>
                </div>

                {/* Course Count */}
                <div className="col-span-2">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                      {student.enrolledCoursesDetails?.length || 0} {(student.enrolledCoursesDetails?.length === 1) ? 'Course' : 'Courses'}
                   </div>
                </div>

                {/* Joined Date */}
                <div className="col-span-2 flex items-center gap-2 text-slate-400">
                   <Calendar size={14} />
                   <span className="text-xs font-bold text-slate-600">{new Date(student.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Action Arrow */}
                <div className="col-span-1 text-right">
                  <ChevronRight size={18} className="ml-auto text-slate-200 group-hover:text-[#2A0066] group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-24 text-center">
               <Users size={48} className="mx-auto text-slate-100 mb-4" />
               <p className="text-slate-400 font-bold italic text-sm">No students found matching your search or roster.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
