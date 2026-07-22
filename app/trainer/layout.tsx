"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import { 
  Users, 
  CheckSquare, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
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

    if (userData.isBlocked === true) {
      router.replace("/blocked");
      return;
    }

    const role = userData.role || Cookies.get("role");
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans relative overflow-x-hidden">
      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-50 w-72 flex-col bg-gradient-to-b from-[#180036] via-[#250059] to-[#12002A] text-white border-r border-white/10 shadow-[10px_0_40px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          menuItems={menuItems}
          isActive={isActive}
          router={router}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Mobile Drawer Overlay (< lg) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-[#180036]/60 backdrop-blur-md z-[60] lg:hidden"
            />

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-72 bg-gradient-to-b from-[#180036] via-[#250059] to-[#12002A] text-white shadow-[20px_0_50px_rgba(0,0,0,0.4)] flex flex-col lg:hidden border-r border-white/10"
            >
              <SidebarContent
                menuItems={menuItems}
                isActive={isActive}
                router={router}
                setSidebarOpen={setSidebarOpen}
                handleLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-72" : "lg:pl-0"
        }`}
      >
        {/* Top Header */}
        <header className="h-20 bg-[#2A0066] sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 border-b border-white/10 shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shadow-sm border border-white/15 active:scale-95"
              aria-label="Toggle navigation menu"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-white/80">
              <Sparkles size={16} className="text-purple-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-200">
                Trainer Portal Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-black text-white tracking-tight">
                Trainer Account
              </span>
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Online
              </span>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-2xl relative border-2 border-purple-400/30 p-1 bg-white shadow-md">
              <Image
                src="/logo.png"
                alt="Avatar"
                fill
                className="object-contain p-0.5"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-4 sm:p-8 w-full min-h-screen overflow-x-hidden">
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

function SidebarContent({
  menuItems,
  isActive,
  router,
  setSidebarOpen,
  handleLogout,
}: any) {
  return (
    <div className="flex flex-col h-full p-5 justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 flex-shrink-0 bg-white rounded-2xl p-1.5 border border-white/30 shadow-lg shadow-black/20">
              <Image
                src="/logo.png"
                alt="Ancraze Logo"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-indigo-200 uppercase">
                ANCRAZE
              </span>
              <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/20 self-start mt-0.5">
                TRAINER PORTAL
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 cursor-pointer text-white border border-white/10"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2.5">
          {menuItems.map((item: any) => (
            <SidebarItem
              key={item.title}
              icon={item.icon}
              label={item.title}
              active={isActive(item.href)}
              onClick={() => {
                router.push(item.href);
              }}
            />
          ))}
        </nav>
      </div>

      {/* Footer Logout Section */}
      <div className="pt-4 border-t border-white/10">
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-md mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-white/30 flex items-center justify-center relative shadow-sm">
            <Image src="/logo.png" alt="User" fill className="object-contain p-1" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">Trainer Account</span>
            <span className="text-[10px] text-purple-300 font-medium truncate">Instructor</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-200 group cursor-pointer border border-red-500/20 shadow-sm font-bold text-sm"
        >
          <LogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
        active
          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/35 border-l-4 border-white font-bold translate-x-1"
          : "text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 font-semibold"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? "text-white" : "text-purple-300/80"}>
          {icon}
        </span>
        <span className="text-sm tracking-wide">{label}</span>
      </div>
      {active && <ChevronRight size={16} className="text-white/80" />}
    </button>
  );
}
