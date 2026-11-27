"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  UserCheck,
  Smartphone,
  Award,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";

const PHONE_CLEAN = "919382452699";
const WHATSAPP_URL = `https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
  "Hello Ancraze Team! I want to know more about the 20 Codes Method and personal trainer sessions."
)}`;

export default function WhyAncrazePage() {
  const pillars = [
    {
      step: "01",
      title: "20 Codes Method",
      tagline: "Forget complicated grammar struggles.",
      desc: "Start constructing sentences and speaking English using our 20 Codes Method, explained simply in Bangla language. Stop memorising endless grammar rules and start expressing yourself naturally.",
      icon: <Sparkles size={24} />,
    },
    {
      step: "02",
      title: "Learn and Practise Every Day",
      tagline: "Learning doesn't stop at the lesson.",
      desc: "Practise what you learn through structured daily activities, vocabulary development, translation, and writing practice. Learn it, practise it, speak it.",
      icon: <Clock size={24} />,
    },
    {
      step: "03",
      title: "Your Personal Speaking Mentor",
      tagline: "You don't have to learn alone.",
      desc: "Get individual speaking practice with your dedicated personal trainer. Receive personal feedback, real-time corrections, and overcome hesitation.",
      icon: <UserCheck size={24} />,
    },
    {
      step: "04",
      title: "Learn Anytime, Anywhere",
      tagline: "Classroom in your pocket.",
      desc: "Access your pre-recorded video lessons, quizzes, and learning materials through the 24/7 Ancraze App whenever and wherever your schedule allows.",
      icon: <Smartphone size={24} />,
    },
    {
      step: "05",
      title: "Revise, Interact and Improve",
      tagline: "Weekly tests & live revision.",
      desc: "Reinforce what you learn through structured weekly tests, interact with expert trainers, and build confidence through active live speaking sessions.",
      icon: <Award size={24} />,
    },
  ];

  const comparison = [
    {
      criteria: "Language of Instruction",
      traditional: "Complicated English-only explanations",
      ancraze: "Crystal-clear explanations in Bangla",
    },
    {
      criteria: "Grammar Approach",
      traditional: "Memorising rules, tenses, and definitions",
      ancraze: "Practical 20 Codes Method without rote learning",
    },
    {
      criteria: "Speaking Opportunity",
      traditional: "Crowded classrooms where few get to talk",
      ancraze: "Dedicated 1-on-1 daily trainer calls",
    },
    {
      criteria: "Correction & Feedback",
      traditional: "Embarrassing corrections in front of peers",
      ancraze: "Private, supportive, real-time trainer guidance",
    },
    {
      criteria: "Schedule Flexibility",
      traditional: "Fixed batch timings that disrupt work/college",
      ancraze: "24/7 app access + flexible speaking slots",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-36 sm:pt-44 pb-16 bg-gradient-to-b from-purple-50/70 via-white to-slate-50 border-b border-slate-200/70 text-center">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2A0066]/10 border border-[#2A0066]/20 rounded-full text-[#2A0066] text-xs font-black uppercase tracking-widest mb-6">
            <ShieldCheck size={14} />
            <span>THE ANCRAZE DIFFERENCE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Why Learners Across Bengal{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] via-[#5B13B9] to-[#7928CA]">
              Trust Ancraze
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto mt-5">
            Discover the 5 pillars that make Ancraze the most effective spoken English academy for Bengali speakers.
          </p>
        </div>
      </section>

      {/* 5 Pillars Grid */}
      <section className="py-20 bg-white border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {pillars.map((pillar) => (
              <div
                key={pillar.step}
                className="p-8 sm:p-9 rounded-[28px] bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] flex items-center justify-center group-hover:bg-[#2A0066] group-hover:text-white transition-colors duration-300">
                      {pillar.icon}
                    </div>
                    <span className="text-xs font-black text-slate-300 tracking-widest">
                      {pillar.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-[#2A0066] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-bold text-[#2A0066] uppercase tracking-wider mt-1.5">
                    {pillar.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mt-3">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Summary Card */}
            <div className="p-8 sm:p-9 rounded-[28px] bg-[#2A0066] text-white shadow-xl shadow-[#2A0066]/20 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                  Summary
                </span>
                <h3 className="text-2xl font-black leading-tight">The Ancraze Difference</h3>
                <ul className="space-y-2.5 text-sm text-purple-100 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Taught & Explained in Bangla</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>20 Codes Method</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Personal Speaking Trainers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Daily Speaking Opportunities</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Flexible 24/7 App Learning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Structured Revision & Assessment</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-white text-[#2A0066] hover:bg-purple-50 font-black rounded-xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageSquare size={14} className="fill-[#2A0066]" />
                  <span>Enroll Now</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-6">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
              OLD WAY VS. ANCRAZE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Why Traditional Coaching Fails You
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              See how our practical methodology eliminates the hurdles you faced before.
            </p>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-900 font-black">
                    <th className="p-4 sm:p-5 w-1/3">Aspect</th>
                    <th className="p-4 sm:p-5 text-red-600 bg-red-50/40">Traditional Grammar Classes</th>
                    <th className="p-4 sm:p-5 text-[#2A0066] bg-purple-50/70">Ancraze 20 Codes Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {comparison.map((item) => (
                    <tr key={item.criteria}>
                      <td className="p-4 sm:p-5 font-bold text-slate-900">{item.criteria}</td>
                      <td className="p-4 sm:p-5 bg-red-50/15 text-slate-600">
                        <div className="flex items-center gap-2">
                          <XCircle size={15} className="text-red-500 shrink-0" />
                          <span>{item.traditional}</span>
                        </div>
                      </td>
                      <td className="p-4 sm:p-5 bg-purple-50/30 text-slate-900 font-semibold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          <span>{item.ancraze}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 bg-gradient-to-br from-[#2A0066] via-[#35007F] to-[#1A0040] text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Experience the Ancraze Difference Firsthand
          </h2>
          <p className="text-purple-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Take a 3-day free trial on the Ancraze app or connect with our academic counselors today.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-[#2A0066] hover:bg-purple-50 font-black rounded-2xl text-xs uppercase tracking-widest transition shadow-xl shadow-black/20 flex items-center gap-2"
            >
              <MessageSquare size={16} className="fill-[#2A0066]" />
              <span>Enroll on WhatsApp</span>
            </a>
            <Link
              href="/courses"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl text-xs uppercase tracking-wider transition"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
