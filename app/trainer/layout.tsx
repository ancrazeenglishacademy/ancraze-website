"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import { 
  Users, 
  CheckSquare, 
  LayoutDashboard, 
  LogOut, 
  Bell,
  Menu,
  X,
  Search,
  BookOpen,
  ChevronRight,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const userDataCookie = Cookies.get("userData");
    let userData: { role?: string; isBlocked?: boolean } = {};

    if (userDataCookie) {
      try {
        userData = JSON.parse(userDataCookie);
      } catch {
        router.replace("/login");
        return;
      }
    }

    // Check if blocked
    if (userData.isBlocked === true) {
      router.replace("/blocked");
      return;
    }

    const role = userData.role || Cookies.get("role");
    // Strictly allowed for the 'trainer' role only
    if (role === "trainer") {
      setAuthorized(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    Cookies.remove("role");
    Cookies.remove("authToken");
    Cookies.remove("uid");
    Cookies.remove("userData");
    Cookies.remove("fullName");
    Cookies.remove("email");
    Cookies.remove("photoURL");

    localStorage.clear();
    sessionStorage.clear();

    setSidebarOpen(false);
    router.push("/");
  };

  const menuItems = [
    { title: "Trainer Panel", icon: <LayoutDashboard size={20} />, href: "/trainer" },
    { title: "Student Management", icon: <Users size={20} />, href: "/trainer/students" },
    { title: "Task Management", icon: <CheckSquare size={20} />, href: "/trainer/tasks" },
  ];

  if (!authorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 border-4 border-slate-100 border-t-[#2A0066] rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying Trainer Access...</p>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-[Outfit,sans-serif]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-[#2A0066]/40 backdrop-blur-md z-[60]"
            />

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 z-[70] h-full w-72 bg-[#2A0066] text-white shadow-[20px_0_50px_rgba(42,0,102,0.2)] flex flex-col"
            >
              {/* Logo Section */}
              <div className="p-6 h-full flex flex-col">
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
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 cursor-pointer text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Nav Items */}
                <nav className="space-y-2 flex-1 relative z-10">
                  {menuItems.map((item) => (
                    <SidebarItem
                      key={item.title}
                      icon={item.icon}
                      label={item.title}
                      active={isActive(item.href)}
                      onClick={() => {
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                    />
                  ))}
                </nav>

                {/* Bottom Logout */}
                <div className="mt-auto pt-6 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-100 transition-all duration-200 group cursor-pointer"
                  >
                    <LogOut
                      size={20}
                      className="group-hover:-translate-x-1 transition-transform"
                    />
                    <span className="font-semibold">Log Out</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-[#2A0066] sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8">
           <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-white hover:bg-white/10 transition cursor-pointer shadow-sm"
              >
                <Menu size={22} />
              </button>
           </div>

           <div className="flex items-center gap-3 text-white font-bold opacity-80">
              <span className="hidden sm:inline uppercase text-xs tracking-widest font-black">Trainer Panel</span>
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                 <Image
                    src="https://res.cloudinary.com/dvj3mphwu/image/upload/v1768824256/Asset_6_4x-8_1_fkpe8l.png"
                    alt="Logo"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
              </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-4 sm:p-8 w-full min-h-screen">
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

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
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
