"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Key,
  Calendar,
  ChevronRight,
  User,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Cookies from "js-cookie";

export default function TrainerStudents() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
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
        trainerUid = Cookies.get("uid") || "";
      }

      const apiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "";
      
      if (!trainerUid) {
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

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loginId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 relative pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Assigned <span className="text-[#2A0066]">Students Roster</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            View and manage exclusively the learners allocated to your instructional guidance.
          </p>
        </div>
      </div>

      {/* Stats Quick View & Search Section */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="bg-white p-5 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm w-full md:w-64 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#2A0066]/5 text-[#2A0066] rounded-2xl flex items-center justify-center border border-[#2A0066]/10">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned Learners</p>
              <h4 className="text-2xl font-black text-slate-900 leading-none">{students.length}</h4>
            </div>
          </div>
        </div>

        {/* Search Layer */}
        <div className="bg-white p-2 rounded-2xl md:rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 px-6 group focus-within:ring-2 focus-within:ring-[#2A0066]/20 transition-all flex-1 h-full min-h-[56px]">
          <Search size={18} className="text-slate-300 group-focus-within:text-[#2A0066]" />
          <input 
            placeholder="Search by student name, email, or Student ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none"
          />
        </div>
      </div>

      {/* Responsive List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Head */}
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
               <div className="col-span-5">Student</div>
               <div className="col-span-3">Student ID</div>
               <div className="col-span-2">Enrolled Course</div>
               <div className="col-span-2">Joined Date</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                  <div className="h-10 w-10 border-4 border-[#2A0066] border-t-transparent rounded-full animate-spin" />
                  <p className="font-black text-[10px] uppercase tracking-widest mt-4">Loading assigned cohort...</p>
                </div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <motion.div 
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50/50 transition duration-200 group"
                  >
                    {/* Student Info */}
                    <div className="col-span-5 flex items-center gap-4 w-full">
                      <div className="h-11 w-11 bg-[#2A0066]/5 rounded-2xl flex shrink-0 items-center justify-center text-[#2A0066] group-hover:bg-[#2A0066] group-hover:text-white transition-all font-black text-sm border border-[#2A0066]/10">
                        {student.fullName ? student.fullName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0 pr-4">
                        <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{student.fullName}</h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{student.email}</p>
                      </div>
                    </div>

                    {/* Login ID */}
                    <div className="col-span-3 flex items-center gap-2">
                      <Key size={14} className="text-amber-500" />
                      <code className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                        {student.loginId || "---"}
                      </code>
                    </div>

                    {/* Course Count */}
                    <div className="col-span-2">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-[#2A0066] rounded-xl text-[10px] font-black uppercase tracking-wider border border-purple-100">
                          {student.enrolledCoursesDetails?.[0]?.title || "Active Course"}
                       </span>
                    </div>

                    {/* Joined Date */}
                    <div className="col-span-2 flex items-center gap-2 text-slate-400">
                       <Calendar size={14} />
                       <span className="text-xs font-bold text-slate-600">{new Date(student.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-24 text-center">
                   <Users size={48} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 font-bold text-xs">No students found matching your search or roster.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
