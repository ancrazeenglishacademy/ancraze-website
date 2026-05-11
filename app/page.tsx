"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import {
  ArrowRight,
  Shield,
  Rocket,
  Globe,
  Download,
  Phone,
  Star,
  UserCheck,
  Clock,
  MessageSquare,
  Award,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import Cookies from "js-cookie";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar user={user} />
      <Hero />
      <FeatureSection />
      <SpecializationSection />
      <Footer />
    </div>
  );
}

// --- Sub-components ---

function Navbar({ user }: { user: any }) {
  return (
    <nav className="fixed w-full top-6 z-50 px-6 pointer-events-none">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 bg-[#2A0066] rounded-xl flex items-center justify-center shadow-lg shadow-[#2A0066]/20 group-hover:rotate-6 transition-transform duration-300">
            <span className="font-black text-lg text-white">A</span>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">
            Ancraze
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex items-center gap-8"
        >
          {[
            { name: "Features", href: "#features" },
            { name: "About", href: "#about" },
            { name: "Security", href: "#security" },
            { name: "Mobile", href: "#mobile" },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[13px] font-bold text-gray-500 hover:text-[#2A0066] transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2A0066] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href={user ? "/dashboard" : "/login"}
            className="px-8 py-3 bg-gray-900 text-white font-black rounded-full hover:bg-[#2A0066] hover:scale-105 transition-all text-xs uppercase tracking-widest shadow-xl shadow-gray-200"
          >
            {user ? "Dashboard" : "Login"}
          </Link>
        </motion.div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <main className="relative max-w-[1400px] mx-auto px-6 h-screen flex items-center pt-20 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col gap-8 text-center lg:text-left z-10"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1]">
            <div className="overflow-hidden">
              {"Master languages.".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.03,
                    ease: [0.2, 0.65, 0.3, 0.9],
                  }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
            <div className="overflow-hidden">
              {"Real progress.".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.5,
                    delay: 0.5 + i * 0.03,
                    ease: [0.2, 0.65, 0.3, 0.9],
                  }}
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] to-[#5500CC]"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
          </h1>

          <p className="text-gray-600 text-base lg:text-lg font-normal leading-relaxed max-w-lg mx-auto lg:mx-0">
            We help learners unlock their full potential through expert-led
            spoken language classes and intelligent interactive platforms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 w-full">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 w-full sm:w-auto">
              <Link
                href="#"
                className="flex-1 sm:flex-initial flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-[18px] border border-gray-200 shadow-sm min-w-[190px]"
              >
                <svg viewBox="0 0 384 512" className="w-7 h-7 fill-gray-900">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <div className="text-left flex flex-col justify-center">
                  <p className="text-[10px] leading-tight font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                    Download on the
                  </p>
                  <p className="text-[19px] font-bold leading-none tracking-tight">
                    App Store
                  </p>
                </div>
              </Link>

              <Link
                href="#"
                className="flex-1 sm:flex-initial flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-[18px] border border-gray-200 shadow-sm min-w-[190px]"
              >
                <svg viewBox="0 0 512 512" className="w-7 h-7">
                  <path
                    d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"
                    fill="#ffb900"
                  />
                  <path
                    d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z"
                    fill="#00a1f1"
                  />
                  <path
                    d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z"
                    fill="#f65314"
                  />
                  <path
                    d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
                    fill="#7db700"
                  />
                </svg>
                <div className="text-left flex flex-col justify-center">
                  <p className="text-[10px] leading-tight font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                    GET IT ON
                  </p>
                  <p className="text-[19px] font-bold leading-none tracking-tight">
                    Google Play
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative lg:absolute lg:right-0 lg:bottom-0 lg:w-[55%] lg:h-full flex items-end justify-center lg:justify-end pointer-events-none"
        >
          <div className="relative w-full h-full flex items-end justify-end">
            <Image
              src="https://res.cloudinary.com/dn78gpmdp/image/upload/q_auto/f_auto/v1777718783/front-view-female-student-white-shirt-holding-pen-copybook_cqoayb.png"
              alt="Student"
              width={1000}
              height={1000}
              className="object-contain w-full h-auto max-h-[75vh] lg:max-h-[85vh] object-bottom lg:object-right-bottom z-10"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 60%, transparent 95%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 60%, transparent 95%)",
              }}
              priority
            />
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function FeatureSection() {
  const courses = [
    {
      img: "https://i.pinimg.com/1200x/c8/c0/1f/c8c01fe648540336c9ae8924b0d95022.jpg",
      title: "Pronunciation & Accent",
    },
    {
      img: "https://i.pinimg.com/736x/d1/e7/38/d1e7381ce12e322b12ffe5abd07d3174.jpg",
      title: "Spoken Arabic Mastery",
    },
    {
      img: "https://i.pinimg.com/736x/9b/0c/e3/9b0ce3ec423ca44ce77a742f15bfd38c.jpg",
      title: "IELTS Preparation",
    },
  ];

  // Duplicate for seamless loop
  const infiniteCourses = [...courses, ...courses, ...courses];

  return (
    <section
      id="features"
      className="bg-white py-32 relative z-10 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight"
          >
            Featured Courses
          </motion.h2>
        </div>

        <div className="relative group overflow-hidden">
          {/* Subtle Fade Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

          <motion.div 
            className="flex gap-8"
            animate={{ 
              x: [0, -1446] // Exact width of one set: (450px + 32px gap) * 3 items
            }}
            transition={{ 
              duration: 25, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ width: "fit-content" }}
          >
            {infiniteCourses.map((course, i) => (
              <div key={i} className="w-[450px] flex-shrink-0">
                <div className="relative aspect-[1/1] rounded-[2rem] overflow-hidden group/card shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
                  <img
                    src={course.img}
                    alt={course.title}
                    className="w-full h-full object-cover transform transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end translate-y-4 group-hover/card:translate-y-0 opacity-0 group-hover/card:opacity-100 transition-all duration-500">
                    <h3 className="text-xl font-black text-white">
                      {course.title}
                    </h3>
                    <button className="px-5 py-2.5 bg-[#2A0066] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#5500CC] hover:scale-105 transition-all duration-300">
                      Join Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SpecializationSection() {
  return (
    <section
      id="about"
      className="bg-white h-screen flex items-center relative z-10 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          {/* Left Content Column */}
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight max-w-xl"
            >
              Explore our elite <br />
              language programs
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-lg font-medium leading-relaxed max-w-lg"
            >
              Focused on your unique needs, our team delivers immersive language
              solutions that blend deep expertise with cutting-edge interactive
              platforms.
            </motion.p>
          </div>

          {/* Right Grid Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {[
              {
                title: "Expert Tutors",
                desc: "Native speakers delivering elite language coaching.",
                icon: <UserCheck size={24} />,
                highlight: true,
              },
              {
                title: "Flexible Sessions",
                desc: "Customized 1-on-1 programs for your schedule.",
                icon: <Clock size={24} />,
                highlight: false,
              },
              {
                title: "Interactive Live",
                desc: "Real-world practice with intelligent platforms.",
                icon: <MessageSquare size={24} />,
                highlight: false,
              },
              {
                title: "India Focused",
                desc: "Expert-led programs tailored for the Indian market.",
                icon: (
                  <div className="relative">
                    <Globe size={24} />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-[#2A0066] rounded-full -z-10"
                    />
                  </div>
                ),
                highlight: false,
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-10 rounded-[1.5rem] flex flex-col gap-6 transition-all duration-500 ${
                  card.highlight
                    ? "bg-[#2A0066] text-white shadow-2xl shadow-[#2A0066]/20"
                    : "bg-[#F8F9FA] border border-gray-100/50 text-gray-900"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    card.highlight
                      ? "bg-white/10 text-white"
                      : "bg-white text-[#2A0066] shadow-sm border border-gray-100"
                  }`}
                >
                  {card.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">
                    {card.title}
                  </h3>
                  <p
                    className={`text-[13px] leading-relaxed font-medium ${
                      card.highlight ? "text-white/60" : "text-gray-400"
                    }`}
                  >
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#2A0066] rounded-xl flex items-center justify-center">
            <span className="font-black text-lg text-white">A</span>
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tighter">
            Ancraze
          </span>
        </div>

        <div className="flex items-center gap-8">
          {["Privacy", "Terms", "Support"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          © 2026 Ancraze Edu System • Precision Built
        </p>
      </div>
    </footer>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group p-10 bg-white border border-gray-100 rounded-[2.5rem] hover:border-[#2A0066]/20 hover:shadow-2xl hover:shadow-[#2A0066]/10 transition-all duration-500">
      <div className="w-16 h-16 bg-gray-50 shadow-inner rounded-2xl flex items-center justify-center text-[#2A0066] mb-8 group-hover:scale-110 group-hover:bg-[#2A0066] group-hover:text-white transition-all duration-500 ease-out">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#2A0066] transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
