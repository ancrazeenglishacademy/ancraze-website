"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Smartphone,
  Calendar,
  BookOpen,
  Sparkles,
  MessageSquare,
  Users,
  Award,
  Video,
  CheckCircle2,
  Check,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";

const PHONE_CLEAN = "919382452699";
const WHATSAPP_URL = `https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
  "Hello Ancraze Team! I want to know more about the features and learning app provided in your Spoken English Course."
)}`;
const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=app.ancraze.com";
const APPSTORE_URL = "https://apps.apple.com/in/app/ancraze/id6773675253";

export default function WhatWeProvidePage() {
  const provisions = [
    {
      icon: <Smartphone size={24} />,
      title: "24/7 Access to the Ancraze App",
      desc: "Access structured video lessons, listening drills, translation tasks, and practice exercises anytime from anywhere. Your classroom stays in your pocket.",
      highlights: ["iOS & Android support", "Offline playback caching", "Instant lesson revision"],
    },
    {
      icon: <Calendar size={24} />,
      title: "Six Months of App Validity",
      desc: "Even though your core course is 30 or 60 days, you retain full access to all lessons, quizzes, and vocabulary for 6 full months to maintain long-term fluency.",
      highlights: ["Revisit tricky lessons", "Continuous practice", "Lifetime study notes"],
    },
    {
      icon: <BookOpen size={24} />,
      title: "20 Codes Method Lessons",
      desc: "High-definition recorded video lessons explaining sentence formation in Bangla. Understand the underlying mechanics of English without confusing grammar rules.",
      highlights: ["Taught in simple Bangla", "Real-world sentence examples", "Zero memorization needed"],
    },
    {
      icon: <Sparkles size={24} />,
      title: "300 Essential English Verbs",
      desc: "Master the 300 most common everyday English verbs with their 3 forms, sentence context, pronunciation, and Bengali translations.",
      highlights: ["Daily practical vocabulary", "Contextual example sentences", "Pronunciation audio guide"],
    },
    {
      icon: <Users size={24} />,
      title: "1-on-1 Personal Speaking Trainer",
      desc: "Dedicated personal trainer assigned specifically to you for individual speaking calls every single day. Practice conversations without peer judgment.",
      highlights: ["10/20/30-minute daily slots", "Real-time mistake correction", "Accent & hesitation removal"],
    },
    {
      icon: <Award size={24} />,
      title: "Live Revision & Certifications",
      desc: "Engage in live group practice sessions for confidence in public meetings, presentations, and interviews, capped by a recognized completion certificate.",
      highlights: ["Interactive group sessions", "Q&A with lead mentors", "Official course certificate"],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-36 sm:pt-44 pb-16 bg-gradient-to-b from-purple-50/70 via-white to-slate-50 border-b border-slate-200/70 text-center">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2A0066]/10 border border-[#2A0066]/20 rounded-full text-[#2A0066] text-xs font-black uppercase tracking-widest mb-6">
            <CheckCircle2 size={14} />
            <span>A COMPLETE SPOKEN ENGLISH ECOSYSTEM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
            English Speaking Practice{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] via-[#5B13B9] to-[#7928CA]">
              App and Training
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto mt-5">
            See what Ancraze provides to help you speak English confidently: Bangla lessons, the 20 Codes Method, app-based practice and personal speaking trainers in trainer-guided courses.
          </p>
        </div>
      </section>

      {/* Feature Provisions Grid */}
      <section className="py-20 bg-white border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {provisions.map((item, idx) => (
              <div
                key={item.title}
                className="p-8 rounded-[32px] bg-slate-50/70 border border-slate-200/80 hover:border-[#2A0066]/30 hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-lg shadow-[#2A0066]/20 mb-6 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#2A0066] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mt-3">
                    {item.desc}
                  </p>

                  <div className="pt-6 border-t border-slate-200/60 mt-6 space-y-2">
                    {item.highlights.map((hl) => (
                      <div key={hl} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 bg-gradient-to-br from-[#2A0066] via-[#35007F] to-[#1A0040] text-white relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 text-center space-y-8 relative z-10">
          <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-purple-200 border border-white/15">
            YOUR ENGLISH CLASSROOM. ALWAYS WITH YOU.
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight max-w-3xl mx-auto">
            Experience the Ancraze App with a 3-Day Free Trial
          </h2>
          <p className="text-purple-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Download our app for Android and iOS. Explore pre-recorded lessons, 20 Codes exercises, and vocabulary builders before enrolling.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-3"
            >
              <Smartphone size={18} className="text-[#2A0066]" />
              <span>Google Play Store</span>
            </a>
            <a
              href={APPSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-3"
            >
              <Smartphone size={18} className="text-purple-300" />
              <span>Apple App Store</span>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-white border-t border-slate-200/70">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ready to Begin Your Spoken English Journey?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Our admissions counsellors are available on WhatsApp to answer your questions and match you with your personal speaking trainer.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-xl shadow-[#2A0066]/25 flex items-center gap-2"
            >
              <MessageSquare size={16} className="fill-white" />
              <span>Enroll on WhatsApp</span>
            </a>
            <Link
              href="/courses"
              className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs uppercase tracking-wider transition"
            >
              View Course Options
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
