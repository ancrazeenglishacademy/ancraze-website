"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  BookOpen,
  Menu,
  X,
  LogOut,
  ChevronRight,
  UsersRound,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userDataCookie = Cookies.get("userData");
    let userData: { role?: string; isBlocked?: boolean; fullName?: string } = {};

    if (userDataCookie) {
      try {
        userData = JSON.parse(userDataCookie);
      } catch {
        router.replace("/");
        return;
      }
    }

    // Check if blocked
    if (userData.isBlocked === true) {
      router.replace("/blocked");
      return;
    }

    const role = userData.role || Cookies.get("role");
    setUserRole(role || null);

    if (role === "admin" || role === "user" || role === "superadmin") {
      setAuthorized(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // Clear all client-side cookies
    Cookies.remove("role");
    Cookies.remove("authToken");
    Cookies.remove("uid");
    Cookies.remove("userData");
    Cookies.remove("fullName");
    Cookies.remove("email");
    Cookies.remove("photoURL");

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Close sidebar and redirect
    setOpen(false);
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 border-4 border-gray-100 border-t-[#2A0066] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans ">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-[#2A0066]/40 backdrop-blur-md z-[60] "
            />

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 z-[70] h-full w-72 bg-[#2A0066] text-white shadow-[20px_0_50px_rgba(42,0,102,0.2)] flex flex-col"
            >
              {/* Logo Row */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0">
                      <Image
                        src="https://res.cloudinary.com/dvj3mphwu/image/upload/v1768824256/Asset_6_4x-8_1_fkpe8l.png"
                        alt="Ancraze Logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    <span className="text-lg font-bold tracking-tight uppercase">
                      ANCRAZE
                    </span>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 cursor-pointer text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <nav className="space-y-2">
                  <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={isActive("/dashboard")}
                    onClick={() => {
                      router.push("/dashboard");
                      setOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<BookOpen size={20} />}
                    label="Courses"
                    active={isActive("/dashboard/course")}
                    onClick={() => {
                      router.push("/dashboard/course");
                      setOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<UsersRound size={20} />}
                    label="Students"
                    active={isActive("/dashboard/students")}
                    onClick={() => {
                      router.push("/dashboard/students");
                      setOpen(false);
                    }}
                  />
                  {userRole === "admin" && (
                    <SidebarItem
                      icon={<User size={20} />}
                      label="Trainer"
                      active={isActive("/dashboard/staff")}
                      onClick={() => {
                        router.push("/dashboard/staff");
                        setOpen(false);
                      }}
                    />
                  )}
                </nav>
              </div>

              {/* Bottom Logout */}
              <div className="mt-auto p-6 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-100 transition-all duration-200 group cursor-pointer"
                >
                  <LogOut
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="font-semibold ">Log Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-[#2A0066] sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded-xl text-white hover:bg-white/10 transition  cursor-pointer shadow-sm"
            >
              <Menu size={22} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-white">
                Admin Account
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                ● Online
              </span>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-xl relative">
              <Image
                src="https://res.cloudinary.com/dvj3mphwu/image/upload/v1768824256/Asset_6_4x-8_1_fkpe8l.png"
                alt="Avatar"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="p-4 sm:p-6 w-full min-h-screen overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
        active
          ? "bg-white text-[#2A0066] shadow-lg"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {active && <ChevronRight size={16} />}
    </button>
  );
}
