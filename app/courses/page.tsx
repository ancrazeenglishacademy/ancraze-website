"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Clock,
  Calendar,
  CheckCircle2,
  Users,
  Video,
  Award,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";

const PHONE_CLEAN = "919382452699";
const WHATSAPP_URL = `https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
  "Hello Ancraze Team! I am interested in enrolling in your Spoken English Course. Please share course details and fee structure."
)}`;

interface CourseItem {
  id: string;
  name: string;
  price?: number;
  teacherName?: string;
  duration?: string;
  validity?: string;
  liveSessions?: string;
  tagline?: string;
  badge?: string;
  overview?: string;
  features?: string[];
  whoShouldJoin?: string;
  experience?: Array<{ title: string; desc: string }>;
  imageUrl?: string;
  isTrainerGuided?: boolean;
  refundDays?: number;
  showOnHomePage?: boolean;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/courses?showOnHomePage=true");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn("Failed to fetch courses:", errData.message || errData.error || res.statusText);
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.courses || []);
        if (Array.isArray(list)) {
          // Only show courses created from superadmin dashboard and checked in "Show on Home Page"
          const homeCourses = list.filter((c: any) => c.showOnHomePage !== false);
          const mapped: CourseItem[] = homeCourses.map((c: any) => ({
            id: c.id,
            name: c.title || c.name || "Spoken English Course",
            teacherName: c.teacherName || "Ancraze Spoken English Academy",
            duration: c.duration || "",
            validity: c.validity || "",
            liveSessions: c.liveSessions || "",
            tagline: c.tagline || "",
            badge: c.badge || "",
            overview: c.description || c.overview || "",
            price: c.price,
            features: Array.isArray(c.features)
              ? c.features
              : typeof c.features === "string" && c.features.trim()
              ? c.features.split("\n").map((f: string) => f.trim()).filter(Boolean)
              : Array.isArray(c.lessons) && c.lessons.length > 0
              ? c.lessons.map((l: any) => (typeof l === "string" ? l : l.title || "Interactive lesson"))
              : [],
            whoShouldJoin: c.whoShouldJoin || "",
            experience: Array.isArray(c.experience) ? c.experience : [],
            imageUrl: c.coverImage || c.coverImageUrl || c.imageUrl,
            isTrainerGuided: Boolean(c.isTrainerGuided),
            refundDays: typeof c.refundDays === "number" ? c.refundDays : 0,
            showOnHomePage: c.showOnHomePage !== false,
          }));
          setCourses(mapped);
        }
      } catch (err) {
        console.warn("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-36 sm:pt-44 pb-16 bg-gradient-to-b from-purple-50/70 via-white to-slate-50 border-b border-slate-200/70 text-center">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2A0066]/10 border border-[#2A0066]/20 rounded-full text-[#2A0066] text-xs font-black uppercase tracking-widest mb-6">
            <BookOpen size={14} />
            <span>SPOKEN ENGLISH COURSES IN BANGLA</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Choose the Perfect Plan for Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] via-[#5B13B9] to-[#7928CA]">
              Speaking Goals
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto mt-5">
            Every course is taught in simple Bangla with our 20 Codes Method, 1-on-1 personal speaking trainers, and 24/7 app access.
          </p>
        </div>
      </section>

      {/* Course Cards Grid */}
      <section className="py-20 bg-white border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-[32px] p-7 sm:p-8 bg-slate-50 border border-slate-200/80 animate-pulse space-y-6 h-[480px]"
                >
                  <div className="h-6 bg-slate-200 rounded-xl w-3/4 mx-auto" />
                  <div className="h-4 bg-slate-200 rounded-lg w-1/2 mx-auto" />
                  <div className="h-16 bg-slate-200 rounded-2xl w-full" />
                  <div className="space-y-3">
                    <div className="h-3.5 bg-slate-200 rounded w-full" />
                    <div className="h-3.5 bg-slate-200 rounded w-5/6" />
                    <div className="h-3.5 bg-slate-200 rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-800">No Courses Available Right Now</h3>
              <p className="text-xs text-slate-500 mt-1">
                Courses enabled for homepage display in the Super Admin dashboard will appear here.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {courses.map((course, index) => {
              const isPopular = index === 1; // Highlight the 60-day or middle course
              return (
                <div
                  key={course.id}
                  className={`rounded-[32px] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                    isPopular
                      ? "bg-white border-2 border-[#2A0066] shadow-2xl shadow-[#2A0066]/15 lg:-translate-y-2"
                      : "bg-slate-50/80 border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/5"
                  }`}
                >
                  {/* Badge */}
                  {course.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#2A0066] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap">
                      {course.badge}
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="text-center pt-2 pb-5 border-b border-slate-200/80">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                        {course.name}
                      </h2>
                      {course.tagline && (
                        <p className="text-xs text-[#2A0066] font-bold mt-2 leading-snug">
                          {course.tagline}
                        </p>
                      )}
                      {course.overview && (
                        <p className="text-xs text-slate-600 leading-relaxed font-normal mt-3">
                          {course.overview}
                        </p>
                      )}
                    </div>

                    {/* Quick Specs Pill Box */}
                    <div className="grid grid-cols-3 gap-2 my-6 p-3 bg-white rounded-2xl border border-slate-200/70 text-center shadow-xs">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Duration</p>
                        <p className="text-xs font-black text-slate-900 mt-0.5">{course.duration || "—"}</p>
                      </div>
                      <div className="border-x border-slate-200/80">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Validity</p>
                        <p className="text-xs font-black text-slate-900 mt-0.5">{course.validity || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Live</p>
                        <p className="text-xs font-black text-[#2A0066] mt-0.5">{course.liveSessions || "—"}</p>
                      </div>
                    </div>

                    {/* Features Checklist */}
                    {(course.features && course.features.length > 0) && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          INCLUDED IN THIS COURSE:
                        </p>
                        <ul className="space-y-2.5">
                          {course.features.slice(0, 6).map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-snug">
                              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {course.features.length > 6 && (
                          <p className="text-[11px] font-bold text-[#2A0066] pt-1">
                            + {course.features.length - 6} more included features
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom CTAs */}
                  <div className="pt-8 space-y-3">
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider transition text-center shadow-xs cursor-pointer"
                    >
                      View Full Syllabus & Details
                    </button>

                    <a
                      href={`https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
                        `Hello Ancraze Team! I want to enroll in the ${course.name}. Please guide me on enrollment steps.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#2A0066] hover:bg-[#3D0099] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-[#2A0066]/20 flex items-center justify-center gap-2 text-center"
                    >
                      <MessageSquare size={14} className="fill-white" />
                      <span>Enroll Now on WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-24 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-6">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
              COMPARISON
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Compare Our Learning Plans
            </h2>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-900 font-black">
                    <th className="p-4 sm:p-5">Feature</th>
                    <th className="p-4 sm:p-5 text-center">30-Day Course</th>
                    <th className="p-4 sm:p-5 text-center bg-purple-50/70 text-[#2A0066]">60-Day Course</th>
                    <th className="p-4 sm:p-5 text-center">Self-Study</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">Teaching Language</td>
                    <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Bangla</td>
                    <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold bg-purple-50/30">Bangla</td>
                    <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Bangla</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">20 Codes Method</td>
                    <td className="p-4 sm:p-5 text-center">✓ Complete</td>
                    <td className="p-4 sm:p-5 text-center bg-purple-50/30">✓ Complete</td>
                    <td className="p-4 sm:p-5 text-center">✓ Complete</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">1-on-1 Speaking Trainer</td>
                    <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">✓ Daily Calls</td>
                    <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold bg-purple-50/30">✓ Daily Calls</td>
                    <td className="p-4 sm:p-5 text-center text-slate-400">Self-Paced</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">Live Revision Sessions</td>
                    <td className="p-4 sm:p-5 text-center">5 Live Sessions</td>
                    <td className="p-4 sm:p-5 text-center font-bold text-[#2A0066] bg-purple-50/30">10 Live Sessions</td>
                    <td className="p-4 sm:p-5 text-center text-slate-400">App-Based</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">Ancraze App Validity</td>
                    <td className="p-4 sm:p-5 text-center">6 Months</td>
                    <td className="p-4 sm:p-5 text-center bg-purple-50/30">6 Months</td>
                    <td className="p-4 sm:p-5 text-center">6 Months</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">Official Certificate</td>
                    <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold">Included</td>
                    <td className="p-4 sm:p-5 text-center text-emerald-600 font-bold bg-purple-50/30">Included</td>
                    <td className="p-4 sm:p-5 text-center text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
            >
              <div className="p-6 sm:p-8 bg-gradient-to-r from-[#2A0066] to-[#450099] text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">
                  {selectedCourse.badge || "SPOKEN ENGLISH PROGRAMME"}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black mt-1">{selectedCourse.name}</h3>
                <p className="text-xs text-purple-100 mt-2">{selectedCourse.tagline}</p>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-sm">
                {selectedCourse.overview && (
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-2">
                      Course Overview
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                      {selectedCourse.overview}
                    </p>
                  </div>
                )}

                {/* Key Metrics Bar */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-around text-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                    <p className="text-sm font-black text-slate-900">{selectedCourse.duration || "—"}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">App Validity</p>
                    <p className="text-sm font-black text-slate-900">{selectedCourse.validity || "—"}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Live Sessions</p>
                    <p className="text-sm font-black text-[#2A0066]">{selectedCourse.liveSessions || "—"}</p>
                  </div>
                </div>

                {(selectedCourse.features && selectedCourse.features.length > 0) && (
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-2.5">
                      Course Features & What You Will Receive
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {selectedCourse.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(selectedCourse.experience && selectedCourse.experience.length > 0) && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                      What You Will Experience
                    </h4>
                    <div className="space-y-2.5">
                      {selectedCourse.experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-100/70 flex items-start gap-3"
                        >
                          <span className="w-6 h-6 rounded-lg bg-[#2A0066] text-white flex items-center justify-center text-[10px] font-black shrink-0 font-mono mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{exp.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{exp.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCourse.whoShouldJoin && (
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-2">
                      Who Should Join
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      {selectedCourse.whoShouldJoin}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Close
                </button>
                <a
                  href={`https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
                    `Hello Ancraze Team! I want to enroll in the ${selectedCourse.name}. Please guide me on next steps.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-[#2A0066] hover:bg-[#3D0099] text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-[#2A0066]/20 flex items-center gap-1.5"
                >
                  <MessageSquare size={14} className="fill-white" />
                  <span>Enroll on WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
