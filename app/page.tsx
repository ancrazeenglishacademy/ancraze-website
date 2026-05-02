"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { ArrowRight, Shield, Rocket, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import Cookies from "js-cookie";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const role = Cookies.get("role");
    if (role === "admin" || role === "user") {
      router.push("/dashboard");
      return;
    }

    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#2A0066] rounded-xl flex items-center justify-center">
              <span className="font-black text-xl text-white">A</span>
            </div>
            <span className="text-xl font-black text-gray-900">Ancraze</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-semibold text-gray-600 hover:text-[#2A0066] transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-sm font-semibold text-gray-600 hover:text-[#2A0066] transition-colors">
              About
            </Link>
            <Link href="#security" className="text-sm font-semibold text-gray-600 hover:text-[#2A0066] transition-colors">
              Security
            </Link>
          </div>

          <Link
            href={user ? "/dashboard" : "/login"}
            className="px-6 py-2.5 bg-[#2A0066] hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-md text-sm"
          >
            {user ? "Go to Dashboard" : "Login"}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-full text-[#2A0066] text-xs font-bold uppercase tracking-wider">
            Next-Gen Learning Management
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight">
            Master Your Skills <br />
            <span className="text-[#2A0066]">With Ancraze</span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-gray-600 text-lg md:text-xl font-medium leading-relaxed">
            Unlock absolute clarity in your learning journey. Experience the most powerful
            and intuitive courses platform designed for elite high-impact education.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 bg-[#2A0066] hover:opacity-90 text-white rounded-xl text-base font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-10 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-900 rounded-xl text-base font-bold transition-all"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
        >
          <div className="group p-8 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-[#2A0066] mb-6 group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">One-Device Security</h3>
            <p className="text-gray-600 leading-relaxed">
              Restricted access to a single device per student ensuring account integrity and compliance.
            </p>
          </div>

          <div className="group p-8 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all md:-translate-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <Rocket size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Elite Performance</h3>
            <p className="text-gray-600 leading-relaxed">
              Lightning-fast load times and optimized video playback for a seamless learning experience globally.
            </p>
          </div>

          <div className="group p-8 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Worldwide Access</h3>
            <p className="text-gray-600 leading-relaxed">
              Study from anywhere in the world. Your progress is synced instantly across our cloud infrastructure.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            © 2026 ANCRAZE EDU SYSTEM • PRECISION BUILT
          </p>
        </div>
      </footer>
    </div>
  );
}
