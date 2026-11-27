"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import {
  ArrowRight,
  Shield,
  Sparkles,
  Globe,
  Download,
  Phone, 
  Star,
  UserCheck,
  Clock,
  MessageSquare,
  Award,
  Zap,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Youtube,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  Headphones,
  FileCheck,
  Send,
  Smartphone,
  Calendar,
  Layers,
  HelpCircle,
  Menu,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import studentAvatar from "@/public/student-avatar.png";

const PHONE_NUMBER = "+91 93824 52699";
const PHONE_CLEAN = "919382452699";
const CONTACT_EMAIL = "Ancrazeenglishacademy@gmail.com";
const WHATSAPP_URL = `https://wa.me/${PHONE_CLEAN}?text=Hello%20Ancraze%20Team!%20I%20am%20interested%20in%20enrolling%20in%20your%20Spoken%20English%20Course.%20Please%20guide%20me.`;
const INSTAGRAM_URL = "https://www.instagram.com/ancrazeenglish?utm_source=qr&psln=MWI3MDMxeDk5d2xueQ==";
const FACEBOOK_URL = "https://www.facebook.com/share/19tbcqR6iw/";
const YOUTUBE_URL = "https://www.youtube.com/@AncrazeEnglishAcademy";
const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=app.ancraze.com";
const APPSTORE_URL = "https://apps.apple.com/in/app/ancraze/id6773675253";
const OFFICE_ADDRESS = "Ancraze office Kolkata, Abedin Arcade, Tiljala Rd, 3D, Gobra, Kolkata, West Bengal 700046";

export default function LandingPage({ initialCourses = [] }: { initialCourses?: CourseItem[] }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any | null>(null);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);

  useEffect(() => {
    const role = Cookies.get("role");
    if (role === "admin" || role === "user" || role === "superadmin") {
      router.push("/dashboard");
      return;
    }
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

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
        console.error("Failed to fetch faculties:", err);
      }
    };
    fetchFaculties();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar hasFaculties={faculties.length > 0} />
      <Hero />
      <WhatIsAncraze />
      <OurCourses initialCourses={initialCourses} onOpenCourseModal={(course) => setSelectedCourseDetail(course)} />
      <WhyChooseAncraze />
      <WhatWeProvide />
      <LearningJourney />
      <AboutUs />
      <DownloadAppSection />
      {faculties.length > 0 && <OurFaculties faculties={faculties} />}
      <FAQSection />
      <ContactSection />
      <FinalCTA />
      <Footer hasFaculties={faculties.length > 0} />

      {/* Course Detail Modal */}
      <CourseDetailModal
        course={selectedCourseDetail}
        onClose={() => setSelectedCourseDetail(null)}
      />
    </div>
  );
}

// ==========================================
// 1. NAVBAR
// ==========================================
function Navbar({ hasFaculties = false }: { hasFaculties?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Our Courses", href: "/courses" },
    ...(hasFaculties ? [{ name: "Faculties", href: "/faculties" }] : []),
    { name: "Why Ancraze", href: "/why-ancraze" },
    { name: "What We Provide", href: "/what-we-provide" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <nav className="fixed w-full top-4 sm:top-6 z-50 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-[1320px] mx-auto px-5 py-3 sm:py-3.5 flex items-center justify-between bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[28px] shadow-[0_12px_40px_rgba(42,0,102,0.06)] pointer-events-auto">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white border border-slate-200/90 rounded-xl flex items-center justify-center shadow-md shadow-[#2A0066]/5 group-hover:rotate-6 transition-transform duration-300 relative p-1">
            <Image src="/logo.png" alt="Ancraze Logo" width={36} height={36} className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
              Ancraze
            </span>
            <span className="text-[9px] font-bold text-[#2A0066] tracking-widest uppercase mt-0.5">
              Spoken English Academy
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[13px] font-bold text-slate-600 hover:text-[#2A0066] transition-colors relative group py-1"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2A0066] transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 sm:px-6 py-2.5 bg-[#2A0066] hover:bg-[#3D0099] text-white font-black rounded-full text-xs uppercase tracking-wider transition-all transform hover:scale-105 shadow-md shadow-[#2A0066]/25 flex items-center gap-1.5"
          >
            <MessageSquare size={13} className="fill-white" />
            <span>Enroll Now</span>
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 lg:hidden text-slate-600 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden mt-3 max-w-[1320px] mx-auto bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-5 shadow-2xl pointer-events-auto"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-slate-700 hover:text-[#2A0066] hover:bg-purple-50/60 rounded-xl transition"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-[#2A0066] text-white text-center font-black rounded-xl text-xs uppercase tracking-wider"
                >
                  Enroll Now
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ==========================================
// 2. HERO SECTION
// ==========================================
function Hero() {
  return (
    <section id="home" className="relative min-h-screen pt-32 sm:pt-36 pb-20 flex items-center bg-gradient-to-b from-purple-50/50 via-white to-slate-50 overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-purple-200/30 to-violet-300/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-[#2A0066]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[1320px] mx-auto px-5 sm:px-6 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left"
          >
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2A0066]/10 border border-[#2A0066]/20 rounded-full text-[#2A0066] text-xs font-black tracking-wide mx-auto lg:mx-0 w-fit">
              <Sparkles size={14} className="text-[#2A0066]" />
              <span>Best Spoken English Course in Bangla Language</span>
            </div>

            {/* Main Headline */}
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] via-[#5B13B9] to-[#7928CA]">
    Speak English Through Bangla 
  </span>{" "}
  with Our 20 Codes Method
</h1>


            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              <strong className="text-slate-900 font-bold">Join ANCRAZE's online spoken English course in Bengali.</strong> Learn with our 20 Codes Method, a personal speaking trainer and daily practice on our app. Made for students, job seekers, housewives and working professionals across West Bengal. 
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform hover:scale-105 shadow-xl shadow-[#2A0066]/25 flex items-center justify-center gap-2.5 text-center group"
              >
                <MessageSquare size={16} className="fill-white" />
                <span>Enroll Now</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#courses"
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider transition text-center shadow-sm"
              >
                Explore Courses
              </a>
            </div>

            {/* App Store Buttons */}
            <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Download Our App:
              </span>
              <div className="flex items-center gap-3">
                {/* Google Play */}
                <a
                  href={PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-xl border border-slate-200 shadow-sm transition group"
                >
                  <svg viewBox="0 0 512 512" className="w-5 h-5">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#ffb900" />
                    <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" fill="#00a1f1" />
                    <path d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" fill="#f65314" />
                    <path d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="#7db700" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[8px] font-semibold text-slate-400 leading-tight uppercase">GET IT ON</p>
                    <p className="text-xs font-black text-slate-900 leading-tight">Google Play</p>
                  </div>
                </a>

                {/* App Store */}
                <a
                  href={APPSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-xl border border-slate-200 shadow-sm transition group"
                >
                  <svg viewBox="0 0 384 512" className="w-5 h-5 fill-slate-900">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[8px] font-semibold text-slate-400 leading-tight uppercase">Download on</p>
                    <p className="text-xs font-black text-slate-900 leading-tight">App Store</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Image / Hero Showcase Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-[460px] h-[500px] sm:h-[530px] rounded-[36px] bg-gradient-to-b from-[#2A0066] via-[#380082] to-[#180036] p-6 shadow-2xl shadow-[#2A0066]/30 overflow-hidden flex flex-col justify-end border border-purple-400/20">
              {/* Ambient Glow Orbs */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-fuchsia-500/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/3 -left-12 w-56 h-56 bg-purple-400/25 rounded-full blur-3xl pointer-events-none" />

              {/* Decorative Circular Spotlight */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 pointer-events-none" />

              {/* Brand Avatar Image */}
              <div className="relative w-full h-[400px] sm:h-[430px] z-10 flex items-end justify-center">
                <Image
                  src={studentAvatar}
                  alt="Ancraze Student Brand Avatar"
                  fill
                  unoptimized
                  className="object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)] select-none pointer-events-none"
                  priority
                />
              </div>

              {/* Floating Badge 1: 20 Codes (Top Left) */}
              <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-white/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2A0066] flex items-center justify-center text-white font-black text-xs shadow-md">
                  20
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Method</p>
                  <p className="text-xs font-black text-slate-900 leading-tight">20 Codes Method</p>
                </div>
              </div>

              {/* Floating Badge 2: Speech Bubble (Top Right) */}
              <div className="absolute top-6 right-6 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-white/60 flex items-center gap-2">
                <span className="text-sm">🗣️</span>
                <p className="text-[11px] font-black text-[#2A0066] leading-tight">
                  Taught in Bangla
                </p>
              </div>

              {/* Floating Badge 3: 1-on-1 Mentor (Bottom Left) */}
              <div className="absolute bottom-5 left-5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
                  <UserCheck size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Practice</p>
                  <p className="text-xs font-black text-slate-900 leading-tight">Personal Trainer</p>
                </div>
              </div>

              {/* Floating Badge 4: Rating (Bottom Right) */}
              <div className="absolute bottom-5 right-5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/60 flex items-center gap-2">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Learners</p>
                  <p className="text-xs font-black text-slate-900 leading-tight">4.9/5 Rating</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 3. WHAT IS ANCRAZE?
// ==========================================
function WhatIsAncraze() {
  return (
    <section className="py-24 bg-white border-y border-slate-200/70 relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
            WHAT IS ANCRAZE?
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            A Better Way to Learn Spoken English in Bangla 
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed pt-2">
            ANCRAZE is an online spoken English academy designed for Bengali-speaking learners who want to speak English confidently. Learn through simple explanations in Bangla, our unique 20 Codes Method, personal speaking trainers and structured daily practice. 
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-16">
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#2A0066]/30 transition-all hover:shadow-xl hover:shadow-[#2A0066]/5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-lg shadow-[#2A0066]/20">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Learn English Beyond Theory</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Learn spoken English through simple Bengali explanations, our 20 Codes Method, personal speaking trainers and structured daily practice. Get a complete learning experience with 24/7 app access.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#2A0066] to-[#45059E] text-white shadow-xl shadow-[#2A0066]/15 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md">
                <Award size={24} />
              </div>
              <h3 className="text-xl font-bold">Speak English with Confidence</h3>
              <p className="text-sm text-purple-100 leading-relaxed font-normal">
                Build the confidence to use English in everyday conversations, job interviews, meetings and real-life situations. Focus on practical communication, not just grammar and theory.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#2A0066]/30 transition-all hover:shadow-xl hover:shadow-[#2A0066]/5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-lg shadow-[#2A0066]/20">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Daily English Speaking Practice</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
               Don't just learn English – use it every day. Practise speaking, build sentences and improve your communication skills through regular activities and personal speaking sessions. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. WHY CHOOSE ANCRAZE?
// ==========================================
function WhyChooseAncraze() {
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

  return (
    <section id="why-ancraze" className="py-28 bg-slate-50 border-b border-slate-200/70 relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
            WHY CHOOSE ANCRAZE?
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Because Speaking English Requires More Than Just Attending Classes.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed pt-1">
           Knowing English grammar and vocabulary is only the beginning. The real challenge is using English naturally in conversations. ANCRAZE helps Bengali-speaking learners overcome hesitation, improve fluency and develop practical communication skills through a structured, interactive learning experience.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="p-8 sm:p-9 rounded-[28px] bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/8 transition-all flex flex-col justify-between h-full group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-lg shadow-[#2A0066]/20 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-300 font-mono">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs font-bold text-[#2A0066] uppercase tracking-wider mt-1">
                    {item.tagline}
                  </p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}

          {/* The Ancraze Difference Card */}
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
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-3.5 bg-white hover:bg-slate-100 text-[#2A0066] font-black rounded-2xl text-xs uppercase tracking-wider text-center transition shadow-lg block cursor-pointer"
            >
              Enroll Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. OUR COURSES
// ==========================================
interface CourseItem {
  id: string;
  name: string;
  duration?: string;
  validity?: string;
  liveSessions?: string;
  tagline?: string;
  overview?: string;
  badge?: string;
  features?: string[];
  whoShouldJoin?: string;
  experience?: { title: string; desc: string }[];
}

function OurCourses({ initialCourses, onOpenCourseModal }: { initialCourses: CourseItem[]; onOpenCourseModal: (course: CourseItem) => void }) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);

  useEffect(() => {
    const fetchHomeCourses = async () => {
      try {
        const res = await fetch("/api/courses?showOnHomePage=true");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Failed to fetch home courses:", errData.message || errData.error || res.statusText);
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.courses || []);
        if (Array.isArray(list)) {
          // Only courses with showOnHomePage !== false
          const homeCourses = list.filter((c: any) => c.showOnHomePage !== false);
          const mapped: CourseItem[] = homeCourses.map((c: any) => ({
            id: c.id,
            name: c.title || c.name || "Spoken English Course",
            duration: c.duration || "",
            validity: c.validity || "",
            liveSessions: c.liveSessions || "",
            tagline: c.tagline || "",
            overview: c.description || c.overview || "",
            badge: c.badge || undefined,
            features: Array.isArray(c.features)
              ? c.features
              : typeof c.features === "string" && c.features.trim()
              ? c.features.split("\n").map((f: string) => f.trim()).filter(Boolean)
              : Array.isArray(c.lessons) && c.lessons.length > 0
              ? c.lessons.map((l: any) => (typeof l === "string" ? l : l.title || "Interactive lesson"))
              : [],
            whoShouldJoin: c.whoShouldJoin || "",
            experience: Array.isArray(c.experience) ? c.experience : [],
          }));
          setCourses(mapped);
        }
      } catch (err) {
        console.error("Error loading home courses:", err);
      }
    };
    fetchHomeCourses();
  }, []);

  return (
    <section id="courses" className="py-28 bg-white border-b border-slate-200/70 relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
            OUR COURSES
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Explore Our Online Spoken English Courses in Bangla
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed pt-1">
            Choose the right spoken English course for your learning goals. Whether you want guided training with live speaking sessions or flexible self-paced lessons, ANCRAZE offers practical English learning programmes to help you build fluency and communication skills.
          </p>
        </div>

        {/* Courses Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          {courses.map((course, idx) => (
            <div
              key={course.id}
              className={`rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 relative ${
                idx === 1
                  ? "bg-gradient-to-b from-purple-50/60 to-white border-2 border-[#2A0066] shadow-2xl shadow-[#2A0066]/10 lg:-translate-y-2"
                  : "bg-slate-50/70 border border-slate-200 hover:shadow-xl hover:shadow-[#2A0066]/5"
              }`}
            >
              {/* Badge */}
              {course.badge && (
                <div className="absolute -top-3.5 left-8 px-3.5 py-1 bg-[#2A0066] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                  {course.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {course.name}
                  </h3>
                  <p className="text-xs font-bold text-[#2A0066] mt-2 leading-snug">
                    {course.tagline}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {course.overview}
                </p>

                {/* Metrics Pill */}
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between text-center gap-2">
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Duration</p>
                    <p className="text-xs font-black text-slate-900">{course.duration || "—"}</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Validity</p>
                    <p className="text-xs font-black text-slate-900">{course.validity || "—"}</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Live Sessions</p>
                    <p className="text-xs font-black text-[#2A0066]">{course.liveSessions || "—"}</p>
                  </div>
                </div>

                {/* Features List Preview */}
                {(course.features && course.features.length > 0) && (
                  <div className="space-y-2.5 pt-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Course Features:
                    </p>
                    <ul className="space-y-2">
                      {course.features.slice(0, 6).map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 size={14} className="text-[#2A0066] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                      {course.features.length > 6 && (
                        <li className="text-[11px] font-bold text-[#2A0066] pl-5">
                          + {course.features.length - 6} more included features
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-8 space-y-2.5">
                <button
                  type="button"
                  onClick={() => onOpenCourseModal(course)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  View Course Details
                </button>
                <a
                  href={`https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
                    `Hello Ancraze! I want to enroll in the ${course.name}. Please share details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#2A0066]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={14} className="fill-white" />
                  <span>Enroll Now</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 6. WHAT WE PROVIDE (PAGE 6)
// ==========================================
function WhatWeProvide() {
  const provisions = [
    {
      num: "01",
      title: "24/7 Ancraze App",
      headline: "Your Classroom Is Just a Click Away.",
      desc: "Access your lessons and learning materials whenever and wherever you want.",
      bullets: [
        "Available on Google Play Store and Apple App Store",
        "24/7 unlimited access to all lessons and materials",
        "Convenient lesson access & flexible self-paced learning",
        "3-day free trial to experience the complete learning system",
      ],
      icon: <Smartphone size={26} />,
    },
    {
      num: "02",
      title: "Your Personal Speaking Trainer",
      headline: "Don't Just Learn English. Speak It Every Day.",
      desc: "Develop your speaking skills through individual practice with your personal trainer.",
      bullets: [
        "Experienced one-to-one personal speaking trainer",
        "10, 20 and 30-minute daily speaking practice options",
        "Personal feedback, pronunciation, and sentence corrections",
        "Empathetic guidance to overcome hesitation and fear",
      ],
      icon: <UserCheck size={26} />,
    },
    {
      num: "03",
      title: "Daily Practice",
      headline: "Make English a Part of Your Everyday Life.",
      desc: "Consistent practice is essential for developing speaking confidence.",
      bullets: [
        "Practise Ancraze 20 Codes with daily sentence construction",
        "Daily translation and useful conversation practice",
        "Learn essential everyday English vocabulary and useful phrases",
        "Master 300 important English verbs and their real-world usage",
        "Daily writing exercises in applicable foundational courses",
      ],
      icon: <Clock size={26} />,
    },
    {
      num: "04",
      title: "Weekly Tests and Live Revision Sessions",
      headline: "Revise What You Learn. Practise What You Know.",
      desc: "Structured tests and live group sessions ensure you never forget what you study.",
      bullets: [
        "Weekly tests and assessments to measure your progress",
        "Live interactive revision sessions with expert trainers",
        "Public-speaking practice in a supportive peer environment",
        "Confidence-building activities to eliminate performance anxiety",
      ],
      icon: <Award size={26} />,
    },
  ];

  return (
    <section id="what-we-provide" className="py-28 bg-slate-50 relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
            WHAT WE PROVIDE
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Online English Speaking Training with Personal Guidance and Daily Practice
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed pt-1">
            ANCRAZE offers practical online English speaking training through structured lessons, daily speaking exercises, personal trainer guidance and app-based learning. Develop your fluency, improve communication skills and gain confidence in real-life conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {provisions.map((item) => (
            <div
              key={item.title}
              className="p-8 sm:p-10 rounded-[32px] bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/6 transition-all flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-lg shadow-[#2A0066]/20">
                    {item.icon}
                  </div>
                  <span className="text-3xl font-black text-slate-200 font-mono">
                    {item.num}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{item.title}</h3>
                  <p className="text-xs font-bold text-[#2A0066] uppercase tracking-wider mt-1">
                    {item.headline}
                  </p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>

                <div className="pt-2 border-t border-slate-100">
                  <ul className="space-y-2.5">
                    {item.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 7. YOUR LEARNING JOURNEY
// ==========================================
function LearningJourney() {
  const steps = [
    { title: "Learn", desc: "Understand sentence formation through our 20 Codes Method.", icon: <BookOpen size={20} /> },
    { title: "Practise", desc: "Reinforce daily vocabulary, translation and writing exercises.", icon: <Clock size={20} /> },
    { title: "Speak", desc: "Engage in 1-on-1 daily speaking practice with your personal trainer.", icon: <MessageSquare size={20} /> },
    { title: "Improve", desc: "Receive personal feedback, corrections, and weekly live revision.", icon: <Award size={20} /> },
    { title: "Become Confident", desc: "Speak English fluently, effortlessly, and without hesitation.", icon: <Sparkles size={20} /> },
  ];

  return (
    <section className="py-24 bg-white border-b border-slate-200/70 relative overflow-hidden">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
            YOUR LEARNING JOURNEY
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Learn → Practise → Speak → Improve → Become Confident.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed pt-1">
            A structured learning experience designed to transform your English knowledge into practical speaking ability.
          </p>
        </div>

        {/* Steps Road */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 relative">
          {steps.map((st, i) => (
            <div
              key={st.title}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#2A0066]/40 transition-all flex flex-col items-center text-center space-y-3 relative group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2A0066] text-white flex items-center justify-center shadow-md shadow-[#2A0066]/20 group-hover:scale-110 transition-transform">
                {st.icon}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                Step 0{i + 1}
              </span>
              <h4 className="text-lg font-bold text-slate-900">{st.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 8. ABOUT US (PAGE 2)
// ==========================================
function AboutUs() {
  return (
    <section id="about" className="py-28 bg-slate-50 border-b border-slate-200/70 relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
              ABOUT ANCRAZE
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              How ANCRAZE Helps Bengali-Speaking Learners Master Spoken English
            </h2>
            <div className="space-y-4 text-slate-600 font-normal leading-relaxed text-sm sm:text-base">
              <p>
                <strong className="text-slate-900 font-bold">Ancraze </strong>is an online spoken English academy dedicated to helping Bengali-speaking learners develop practical English communication skills. Our learning approach combines innovative teaching methods in Bangla, modern technology and structured speaking practice.
              </p>
              <p>
                Many learners study English for years but still hesitate when speaking.  They may understand grammar, recognise vocabulary and construct sentences, yet struggle to communicate naturally in real-life conversations.
              </p>
              <p>
                At ANCRAZE, we focus on turning theoretical English knowledge into practical speaking ability. By explaining concepts in your mother tongue, Bangla, we make English learning easier to understand and apply.
              </p>
              <p className="p-4 bg-purple-50/70 border-l-4 border-[#2A0066] rounded-r-2xl text-slate-800 font-medium">
                Our approach combines the 20 Codes Method, personalised speaking guidance and practical English exercises to help Bengali-speaking learners turn their knowledge into confident communication.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#2A0066]/20"
              >
                <MessageSquare size={14} className="fill-white" />
                <span>Join Our Academy Today</span>
              </a>
            </div>
          </div>

          {/* Academy Highlights Grid */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all flex flex-col justify-between">
              <span className="text-4xl font-black text-[#2A0066]">20</span>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900">Innovative Codes</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Structured sentence formation methodology without memorising rules.
                </p>
              </div>
            </div>

            <div className="p-7 sm:p-8 rounded-3xl bg-[#2A0066] text-white shadow-xl shadow-[#2A0066]/20 flex flex-col justify-between">
              <span className="text-4xl font-black text-white">1-on-1</span>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-purple-200">Personal Trainers</h4>
                <p className="text-xs text-purple-200/70 mt-1 leading-relaxed">
                  Daily individual speaking practice, corrections & feedback.
                </p>
              </div>
            </div>

            <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all flex flex-col justify-between">
              <span className="text-4xl font-black text-emerald-600">24/7</span>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900">Ancraze App</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Access lessons, exercises & practice materials anytime.
                </p>
              </div>
            </div>

            <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-[#2A0066]/5 transition-all flex flex-col justify-between">
              <span className="text-4xl font-black text-[#2A0066]">300+</span>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900">Essential Verbs</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Master critical everyday English verbs and their practical usage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 9. DOWNLOAD APP SECTION
// ==========================================
function DownloadAppSection() {
  return (
    <section id="download-app" className="py-24 bg-gradient-to-tr from-[#2A0066] via-[#3B008F] to-[#5500CC] text-white relative overflow-hidden">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-block px-3.5 py-1 bg-white/10 text-purple-200 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md">
            DOWNLOAD THE ANCRAZE APP
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Learn and Practise English Anytime with the ANCRAZE Learning App
          </h2>
          <p className="text-purple-100 text-base sm:text-lg font-normal leading-relaxed">
            Improve your English with the ANCRAZE learning app. Access lessons, learning materials and speaking practice activities anytime, anywhere. Explore our digital English learning experience with a <strong className="text-white font-bold">3-day free trial</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* Google Play */}
            <a
              href={PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-purple-50 transition transform hover:scale-105"
            >
              <svg viewBox="0 0 512 512" className="w-6 h-6">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#ffb900" />
                <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" fill="#00a1f1" />
                <path d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" fill="#f65314" />
                <path d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="#7db700" />
              </svg>
              <div className="text-left">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">GET IT ON</p>
                <p className="text-sm font-black text-slate-900 leading-tight">Google Play Store</p>
              </div>
            </a>

            {/* Apple App Store */}
            <a
              href={APPSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-purple-50 transition transform hover:scale-105"
            >
              <svg viewBox="0 0 384 512" className="w-6 h-6 fill-slate-900">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <div className="text-left">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Download on</p>
                <p className="text-sm font-black text-slate-900 leading-tight">Apple App Store</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 10. OUR FACULTIES & EXPERT MENTORS
// ==========================================
interface FacultyItem {
  id: string;
  name: string;
  role: string;
  bio?: string;
  specialization?: string;
  experience?: string;
  imageUrl?: string;
}

function OurFaculties({ faculties }: { faculties: FacultyItem[] }) {
  if (!faculties || faculties.length === 0) return null;

  return (
    <section id="faculties" className="py-28 bg-white border-b border-slate-200/70 relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 w-max mx-auto">
            <GraduationCap size={14} />
            <span>OUR FACULTIES & EXPERT MENTORS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Learn From Dedicated Spoken English Mentors
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed pt-1">
            Our certified speaking trainers and language coaches provide dedicated 1-on-1 guidance, live corrections, and constant motivation to help you speak with natural fluency.
          </p>
        </div>

        {/* Faculties Grid */}
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
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-2xl font-black text-[#2A0066]">
                        {faculty.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 truncate group-hover:text-[#2A0066] transition-colors">
                      {faculty.name}
                    </h3>
                    <p className="text-xs font-bold text-[#2A0066] mt-0.5 leading-snug">
                      {faculty.role}
                    </p>
                    {faculty.experience && (
                      <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100/80 text-[#2A0066]">
                        {faculty.experience}
                      </span>
                    )}
                  </div>
                </div>

                {faculty.specialization && (
                  <div className="p-3 rounded-2xl bg-white border border-slate-200/70">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      Specialization
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {faculty.specialization}
                    </p>
                  </div>
                )}

                {faculty.bio && (
                  <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-4">
                    &ldquo;{faculty.bio}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/70">
                <a
                  href={`https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
                    `Hello Ancraze! I would like to learn with faculty mentor ${faculty.name}. Please guide me on enrollment.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-white hover:bg-[#2A0066] text-[#2A0066] hover:text-white border border-[#2A0066]/20 hover:border-transparent rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer group-hover:bg-[#2A0066] group-hover:text-white"
                >
                  <MessageSquare size={13} />
                  <span>Connect with Mentor</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 11. FAQ SECTION (PAGE 7)
// ==========================================
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "1. What is Ancraze?",
      a: "Ancraze is an online spoken English academy that helps Bengali-speaking learners develop practical English-speaking skills through lessons taught in Bangla, our 20 Codes Method, dedicated personal trainers, and structured daily practice.",
    },
    {
      q: "2. Is the course taught in Bangla language?",
      a: "Yes! All video lessons, grammar concepts, and explanations are taught in simple Bangla language so that you can understand sentence formation clearly and start speaking English naturally without confusion or fear.",
    },
    {
      q: "3. What are the 20 Codes?",
      a: "The 20 Codes Method is our structured learning methodology designed to help learners understand sentence formation and develop their speaking skills systematically without memorising complex grammar rules.",
    },
    {
      q: "4. Is the course completely online?",
      a: "Yes. Lessons and learning materials are accessed through the 24/7 Ancraze App, with individual speaking practice and live sessions conducted online according to your selected course.",
    },
    {
      q: "5. Do I get a personal speaking trainer?",
      a: "Yes! Personal trainer speaking practice is available in our trainer-guided courses with dedicated 1-on-1 daily speaking practice options.",
    },
    {
      q: "6. Will I receive a certificate?",
      a: "Yes. Our courses include an official course completion certificate, subject to applicable completion requirements.",
    },
    {
      q: "7. How can I enrol?",
      a: "Click any 'ENROLL NOW' button to connect directly with our admissions team on WhatsApp Business, and we will get you onboarded immediately.",
    },
  ];

  return (
    <section id="faq" className="py-28 bg-white border-b border-slate-200/70 relative">
      <div className="max-w-[960px] mx-auto px-5 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Have Questions? We Have Answers.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
            Everything you need to know about our courses, 20 Codes method, and enrolment.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-[#2A0066] transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {/* Answers stay in the HTML so search engines can read them */}
                <div
                  className={`${isOpen ? "block" : "hidden"} px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-200/60 bg-white`}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 11. CONTACT US & QUICK ENQUIRY (PAGE 8)
// ==========================================
function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    course: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      alert("Please enter your name and phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Submit lead to database
      await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setSubmitSuccess(true);

      // 2. Also open WhatsApp with pre-filled message for instant connection
      const text = encodeURIComponent(
        `Hello Ancraze! My name is ${formData.fullName}.\nPhone: ${formData.phone}\nInterested in: ${formData.course}\nMessage: ${formData.message || "I want more details about admission."}`
      );
      window.open(`https://wa.me/${PHONE_CLEAN}?text=${text}`, "_blank");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-28 bg-slate-50 relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-block px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
            CONTACT US
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            We&apos;d Love to Hear From You!
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed pt-1">
            Have questions about our courses, learning system or enrolment? Our team is ready to guide you and help you choose the right learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 p-8 sm:p-10 rounded-[32px] bg-[#2A0066] text-white shadow-xl shadow-[#2A0066]/15 flex flex-col justify-between">
            <div className="space-y-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                  Admissions Office
                </span>
                <h3 className="text-3xl font-black text-white mt-1">Get in Touch</h3>
                <p className="text-xs text-purple-200 mt-2 leading-relaxed">
                  Connect directly with our counsellors via WhatsApp, phone call, or email.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition border border-white/10 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                    <MessageSquare size={18} className="fill-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">WhatsApp Business</p>
                    <p className="text-sm font-black text-white">{PHONE_NUMBER}</p>
                    <p className="text-[10px] text-purple-200 mt-0.5">Instant WhatsApp chat & admission guidance</p>
                  </div>
                </a>

                <a
                  href={`tel:${PHONE_NUMBER.replace(/\s+/g, "")}`}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition border border-white/10 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Direct Phone Call</p>
                    <p className="text-sm font-black text-white">{PHONE_NUMBER}</p>
                    <p className="text-[10px] text-purple-200 mt-0.5">Call our admissions desk directly</p>
                  </div>
                </a>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition border border-white/10 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-400 text-slate-900 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Email Support</p>
                    <p className="text-sm font-black text-white break-all">{CONTACT_EMAIL}</p>
                    <p className="text-[10px] text-purple-200 mt-0.5">Click to email admissions directly</p>
                  </div>
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(OFFICE_ADDRESS)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition border border-white/10 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-300 text-slate-900 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Office Address</p>
                    <p className="text-sm font-black text-white leading-snug">{OFFICE_ADDRESS}</p>
                    <p className="text-[10px] text-purple-200 mt-1">Click to view on Google Maps</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-300 mb-3">
                Follow Us
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white hover:text-[#2A0066] text-white flex items-center justify-center transition"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white hover:text-[#2A0066] text-white flex items-center justify-center transition"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white hover:text-[#2A0066] text-white flex items-center justify-center transition"
                  aria-label="YouTube"
                >
                  <Youtube size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Enquiry Form Column */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-[32px] bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="space-y-1 mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#2A0066]">
                  Quick Enquiry
                </span>
                <h3 className="text-2xl font-black text-slate-900">Please provide your details</h3>
                <p className="text-xs text-slate-500 font-normal">
                  Our team will contact you within 24 hours to help you choose the best plan.
                </p>
              </div>

              {submitSuccess ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-lg font-black text-emerald-900">Enquiry Submitted!</h4>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    Thank you! We have opened WhatsApp to connect you directly with our counsellor.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-3 px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#2A0066] transition outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 93824 52699"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#2A0066] transition outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Course Interested In
                    </label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="Enter course name (optional)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#2A0066] transition outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Your Message (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your learning goals or questions..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#2A0066] transition outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#2A0066] hover:bg-[#3D0099] disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-[#2A0066]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? "Submitting..." : "Submit Enquiry"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 12. FINAL CALL TO ACTION (PAGE 1)
// ==========================================
function FinalCTA() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="rounded-[36px] bg-gradient-to-r from-[#2A0066] via-[#4805A3] to-[#6912CE] p-10 sm:p-16 text-center text-white shadow-2xl shadow-[#2A0066]/25 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md">
              START YOUR JOURNEY
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Your English-Speaking Journey Starts Here!
            </h2>
            <p className="text-purple-100 text-base sm:text-lg font-medium leading-relaxed">
              Don&apos;t let hesitation stop you. Take the first step towards speaking English confidently.
            </p>
            <div className="pt-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-9 py-4 bg-white hover:bg-slate-100 text-[#2A0066] rounded-2xl font-black text-xs uppercase tracking-widest transition transform hover:scale-105 shadow-xl shadow-black/10"
              >
                <MessageSquare size={16} className="fill-[#2A0066]" />
                <span>Enroll Now</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 13. COMMON FOOTER
// ==========================================
function Footer({ hasFaculties = false }: { hasFaculties?: boolean }) {
  return (
    <footer className="bg-[#1A0040] text-white pt-20 pb-12 border-t border-purple-950/60">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-16">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md">
                <Image src="/logo.png" alt="Ancraze Logo" width={36} height={36} className="object-contain" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Ancraze
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-purple-300">
              Ancraze Online Spoken English Academy
            </p>
            <p className="text-sm text-purple-200/80 leading-relaxed font-normal max-w-sm">
              Don&apos;t Just Learn English. Speak English with Our 20 Codes.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white hover:text-[#2A0066] text-white flex items-center justify-center transition"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white hover:text-[#2A0066] text-white flex items-center justify-center transition"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white hover:text-[#2A0066] text-white flex items-center justify-center transition"
                aria-label="YouTube"
              >
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-purple-300">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-purple-100/80">
              <li>
                <Link href="/" className="hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">About Us</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition">Our Courses</Link>
              </li>
              {hasFaculties && (
                <li>
                  <Link href="/faculties" className="hover:text-white transition">Faculties & Mentors</Link>
                </li>
              )}
              <li>
                <Link href="/why-ancraze" className="hover:text-white transition">Why Ancraze</Link>
              </li>
              <li>
                <Link href="/what-we-provide" className="hover:text-white transition">What We Provide</Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition">Frequently Asked Questions</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">Contact Us & Admissions</Link>
              </li>
            </ul>
          </div>

          {/* Download & Contact */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-purple-300">
              Download Our App
            </h4>
            <div className="flex flex-col gap-2 pt-1">
              <a
                href={PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-purple-100 hover:text-white transition font-bold"
              >
                <Smartphone size={14} className="text-emerald-400" />
                Google Play Store
              </a>
              <a
                href={APPSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-purple-100 hover:text-white transition font-bold"
              >
                <Smartphone size={14} className="text-purple-400" />
                Apple App Store
              </a>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                Contact
              </p>
              <p className="text-xs text-purple-200">WhatsApp & Call: {PHONE_NUMBER}</p>
              <p className="text-xs text-purple-200">
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white underline transition">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="text-xs text-purple-200 leading-relaxed">
                <strong className="text-white">Office:</strong> {OFFICE_ADDRESS}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[11px] text-purple-300/60 font-medium">
            ©️ 2026 Ancraze Online Spoken English Academy. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-purple-300/60 font-medium">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="#home" className="hover:text-white transition">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// 14. COURSE DETAIL MODAL (PAGE 4)
// ==========================================
function CourseDetailModal({
  course,
  onClose,
}: {
  course: CourseItem | null;
  onClose: () => void;
}) {
  if (!course) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-purple-50/70 to-white">
            <div className="space-y-1 pr-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2A0066]">
                Course Details
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {course.name}
              </h3>
              <p className="text-xs font-bold text-[#2A0066]">{course.tagline}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
            {/* Overview */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                Overview
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {course.overview}
              </p>
            </div>

            {/* Metrics */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-around text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                <p className="text-sm font-black text-slate-900">{course.duration || "—"}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">App Validity</p>
                <p className="text-sm font-black text-slate-900">{course.validity || "—"}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Live Sessions</p>
                <p className="text-sm font-black text-[#2A0066]">{course.liveSessions || "—"}</p>
              </div>
            </div>

            {/* Course Features */}
            {course.features && course.features.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  Course Features & What You Will Receive
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                  {course.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What You Will Experience */}
            {course.experience && course.experience.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  What You Will Experience
                </h4>
                <div className="space-y-3">
                  {course.experience.map((exp, idx) => (
                    <div
                      key={exp.title}
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

            {/* Who Should Join */}
            {course.whoShouldJoin && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Who Should Join?
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {course.whoShouldJoin}
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-5 sm:p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
            >
              Close
            </button>
            <a
              href={`https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
                `Hello Ancraze Team! I want to enroll in the ${course.name}. Please guide me on next steps.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-[#2A0066] hover:bg-[#3D0099] text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-[#2A0066]/20 flex items-center gap-1.5"
            >
              <MessageSquare size={14} className="fill-white" />
              <span>Enroll Now</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
