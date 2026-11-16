"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Award,
  BookOpen,
  Clock,
  ArrowRight,
  Target,
  Users,
  Compass,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";

const PHONE_CLEAN = "919382452699";
const WHATSAPP_URL = `https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
  "Hello Ancraze Team! I want to learn more about Ancraze and your Spoken English courses in Bangla. Please guide me."
)}`;

export default function AboutPage() {
  const journeySteps = [
    {
      title: "Learn in Bangla",
      desc: "Understand English sentence construction naturally through our 20 Codes Method, explained clearly in Bangla without complicated grammar jargon.",
      icon: <BookOpen size={22} />,
    },
    {
      title: "Daily Structured Practice",
      desc: "Reinforce what you learn with targeted daily vocabulary, translation exercises, and 300 essential verbs in everyday context.",
      icon: <Clock size={22} />,
    },
    {
      title: "1-on-1 Personal Trainer",
      desc: "Engage in individual daily speaking practice with your dedicated trainer. Speak aloud, overcome hesitation, and get real-time feedback.",
      icon: <MessageSquare size={22} />,
    },
    {
      title: "Continuous Evaluation",
      desc: "Receive weekly live revision sessions, interactive exercises, and customized tips to eliminate regional accent hesitation.",
      icon: <Award size={22} />,
    },
    {
      title: "Natural Fluency",
      desc: "Speak English smoothly, comfortably, and naturally in interviews, business meetings, college presentations, and everyday life.",
      icon: <Sparkles size={22} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-36 sm:pt-44 pb-20 relative overflow-hidden bg-gradient-to-b from-purple-50/60 via-white to-slate-50 border-b border-slate-200/70">
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-[#2A0066]/5 blur-3xl rounded-full pointer-events-none" />
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2A0066]/10 border border-[#2A0066]/20 rounded-full text-[#2A0066] text-xs font-black uppercase tracking-widest mb-6">
            <Compass size={14} className="text-[#2A0066]" />
            <span>ABOUT ANCRAZE ENGLISH ACADEMY</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
            We Don&apos;t Just Teach English.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] via-[#5B13B9] to-[#7928CA]">
              We Help You Speak It.
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-3xl mx-auto mt-6">
            Ancraze Online Spoken English Academy was founded on a simple realization: millions of Bengali speakers spend years studying grammar rules in books, yet freeze when having to speak a single sentence in public. We changed the entire learning paradigm.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#2A0066]/25 flex items-center gap-2"
            >
              <MessageSquare size={16} className="fill-white" />
              <span>Connect on WhatsApp</span>
            </a>
            <Link
              href="/courses"
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-sm"
            >
              Explore Our Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="py-24 bg-white border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
                OUR MISSION
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Breaking the Fear of Spoken English for Bengali Speakers
              </h2>
              <div className="space-y-4 text-slate-600 font-normal leading-relaxed text-sm sm:text-base">
                <p>
                  Most language classes fail because they treat speaking like a written examination. They teach names of tenses, participle clauses, and memorize vocabulary lists that nobody uses in daily life.
                </p>
                <p>
                  At Ancraze, our entire curriculum is designed for practical, spoken communication. Every lesson is explained in your mother tongue, <strong>Bangla</strong>, so you instantly connect how ideas form and how sentences flow.
                </p>
                <div className="p-5 bg-purple-50/70 border-l-4 border-[#2A0066] rounded-r-2xl text-slate-800 font-medium">
                  We replace endless grammar rules with the <strong>20 Codes Method</strong> — 20 simple patterns that unlock over 90% of everyday conversations in English.
                </div>
              </div>
            </div>

            {/* Visual Highlight Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-lg shadow-[#2A0066]/20 mb-4">
                  <Target size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Practical Fluency</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Focus on real conversations, job interviews, college seminars, and everyday situations rather than exam memorization.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[#2A0066] text-white shadow-xl shadow-[#2A0066]/20 flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold">1-on-1 Mentorship</h3>
                <p className="text-xs text-purple-200 mt-2 leading-relaxed">
                  Dedicated speaking trainers who work with you individually every day to correct hesitations and build speaking stamina.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[#2A0066] text-white shadow-xl shadow-[#2A0066]/20 flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md mb-4">
                  <GraduationCap size={24} />
                </div>
                <h3 className="text-lg font-bold">Taught in Bangla</h3>
                <p className="text-xs text-purple-200 mt-2 leading-relaxed">
                  Zero language barrier. Deep clarity from sentence structure to pronunciation, explained comfortably in Bangla.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-lg shadow-[#2A0066]/20 mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">24/7 Mobile App</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Access video lessons, quizzes, listening practice, and writing drills anytime, anywhere with 6 months of app validity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 5-Step Learning Journey */}
      <section className="py-24 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
              STEP-BY-STEP SYSTEM
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How You Build Fluency with Ancraze
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              A proven step-by-step pathway crafted specifically for Bengali speakers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {journeySteps.map((step, idx) => (
              <div
                key={step.title}
                className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-[#2A0066]/10 text-[#2A0066] flex items-center justify-center group-hover:bg-[#2A0066] group-hover:text-white transition-colors duration-300">
                      {step.icon}
                    </div>
                    <span className="text-xs font-black text-slate-300">0{idx + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#2A0066] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 bg-gradient-to-br from-[#2A0066] via-[#35007F] to-[#1A0040] text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Start Speaking English with Confidence?
          </h2>
          <p className="text-purple-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Join thousands of Bengali learners who have overcome their hesitation and spoken their first fluent sentences with Ancraze English Academy.
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
              href="/contact"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl text-xs uppercase tracking-wider transition"
            >
              Contact Admissions
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
