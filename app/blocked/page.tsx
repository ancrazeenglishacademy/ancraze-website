"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldBan } from "lucide-react";
import Cookies from "js-cookie";

export default function BlockedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    Cookies.remove("role");
    Cookies.remove("userData");
    Cookies.remove("authToken");
    Cookies.remove("uid");
    Cookies.remove("fullName");
    Cookies.remove("email");
    Cookies.remove("photoURL");
    localStorage.clear();
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-red-100 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-50 rounded-full">
            <ShieldBan size={48} className="text-red-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Account Blocked
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Your account has been blocked by an administrator. Please contact
          support for assistance.
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-[#2A0066] hover:opacity-90 text-white font-bold rounded-xl transition duration-200"
        >
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
