"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  GraduationCap,
  MessageSquare,
  Award,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Users,
} from "lucide-react";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";

const PHONE_CLEAN = "919382452699";
const WHATSAPP_URL = `https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
  "Hello Ancraze Team! I want to know more about personal speaking mentors and trainers."
)}`;

interface FacultyItem {
  id: string;
  name: string;
  role: string;
  bio?: string;
  specialization?: string;
  experience?: string;
  imageUrl?: string;
}

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await fetch("/api/faculties?active=true");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.faculties)) {
            setFaculties(data.faculties);
          }
        }
      } catch (err) {
        console.error("Error fetching faculties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculties();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar hasFaculties={faculties.length > 0} />

      {/* Hero Header */}
      <section className="pt-36 sm:pt-44 pb-16 bg-gradient-to-b from-purple-50/70 via-white to-slate-50 border-b border-slate-200/70 text-center">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2A0066]/10 border border-[#2A0066]/20 rounded-full text-[#2A0066] text-xs font-black uppercase tracking-widest mb-6">
            <GraduationCap size={15} />
            <span>OUR FACULTIES & EXPERT MENTORS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Learn From Dedicated{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] via-[#5B13B9] to-[#7928CA]">
              Spoken English Mentors
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto mt-5">
            Our certified speaking trainers and language coaches provide dedicated 1-on-1 guidance, live corrections, and constant motivation in Bangla.
          </p>
        </div>
      </section>

      {/* Faculty Cards Grid or Info */}
      <section className="py-20 bg-white border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-[#2A0066]/20 border-t-[#2A0066] rounded-full animate-spin" />
            </div>
          ) : faculties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {faculties.map((faculty) => (
                <div
                  key={faculty.id}
                  className="rounded-[32px] p-7 sm:p-8 bg-slate-50/70 border border-slate-200/80 hover:border-[#2A0066]/40 hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#2A0066]/10 border-2 border-[#2A0066]/20 shrink-0 flex items-center justify-center shadow-md">
                        {faculty.imageUrl ? (
                          <Image
                            src={faculty.imageUrl}
                            alt={faculty.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xl font-black text-[#2A0066]">
                            {faculty.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <h2 className="text-lg font-black text-slate-900 group-hover:text-[#2A0066] transition-colors">
                          {faculty.name}
                        </h2>
                        <p className="text-xs font-bold text-slate-600">
                          {faculty.role || "Speaking Trainer & Mentor"}
                        </p>
                        {faculty.experience && (
                          <span className="inline-block px-2 py-0.5 bg-purple-100 text-[#2A0066] text-[10px] font-bold rounded-md">
                            {faculty.experience}
                          </span>
                        )}
                      </div>
                    </div>

                    {faculty.specialization && (
                      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/70 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Specialization
                        </span>
                        <p className="font-semibold text-slate-800">
                          {faculty.specialization}
                        </p>
                      </div>
                    )}

                    {faculty.bio && (
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        &ldquo;{faculty.bio}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-200/60 mt-6">
                    <a
                      href={`https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
                        `Hello Ancraze Team! I would like to learn with mentor ${faculty.name}. Please guide me on enrollment.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-white hover:bg-[#2A0066] text-slate-800 hover:text-white border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 group-hover:border-[#2A0066] shadow-xs"
                    >
                      <MessageSquare size={14} />
                      <span>Connect with Mentor</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto p-10 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 bg-[#2A0066]/10 text-[#2A0066] rounded-2xl flex items-center justify-center mx-auto">
                <Users size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                1-on-1 Personal Speaking Mentors
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Every student enrolled at Ancraze is allocated a dedicated certified speaking trainer for daily individual practice. Reach out to our admissions team to learn more about trainer allocation.
              </p>
              <div className="pt-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#2A0066] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#2A0066]/20 hover:bg-[#3D0099] transition"
                >
                  <MessageSquare size={14} className="fill-white" />
                  <span>Ask Admissions Team</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer hasFaculties={faculties.length > 0} />
    </div>
  );
}
