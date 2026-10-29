"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LayoutDashboard,
  BookOpen,
  UsersRound,
  DollarSign,
  UserCheck,
  ShieldAlert,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(true); // Default open on desktop
  const [fullName, setFullName] = useState("Super Administrator");

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

    if (userData.isBlocked === true) {
      router.replace("/blocked");
      return;
    }

    if (userData.fullName) {
      setFullName(userData.fullName);
    } else {
      const storedName = Cookies.get("fullName");
      if (storedName) setFullName(storedName);
    }

    const role = userData.role || Cookies.get("role");
    if (role === "superadmin") {
      setAuthorized(true);
    } else {
      router.replace("/");
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

    setOpen(false);
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/superadmin") {
      return pathname === "/superadmin";
    }
    return pathname.startsWith(path);
  };

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
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans relative overflow-x-hidden">
      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-50 w-72 flex-col bg-gradient-to-b from-[#14002e] via-[#1f0047] to-[#0f0024] text-white border-r border-white/10 shadow-[10px_0_40px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          isActive={isActive}
          router={router}
          setOpen={setOpen}
          handleLogout={handleLogout}
          fullName={fullName}
        />
      </aside>

      {/* Mobile Drawer Overlay (< lg) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-[#14002e]/70 backdrop-blur-md z-[60] lg:hidden"
            />

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-72 bg-gradient-to-b from-[#14002e] via-[#1f0047] to-[#0f0024] text-white shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col lg:hidden border-r border-white/10"
            >
              <SidebarContent
                isActive={isActive}
                router={router}
                setOpen={setOpen}
                handleLogout={handleLogout}
                fullName={fullName}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          open ? "lg:pl-72" : "lg:pl-0"
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-[#2A0066] sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-white/10 shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpen(!open)}
              className="p-2.5 rounded-xl text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shadow-sm border border-white/15 active:scale-95"
              aria-label="Toggle navigation menu"
              title={open ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-white/80">
              <Sparkles size={16} className="text-amber-300 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-200">
                Super Admin Master Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-black text-white tracking-tight">
                {fullName}
              </span>
              <span className="text-[10px] text-amber-300 font-extrabold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Super Admin Access
              </span>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-2xl relative border-2 border-amber-400/40 p-1 bg-white shadow-md">
              <Image
                src="/logo.png"
                alt="Avatar"
                fill
                className="object-contain p-0.5"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Body */}
        <main className="p-4 sm:p-6 lg:p-8 w-full min-h-[calc(100vh-4rem)] overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  isActive,
  router,
  setOpen,
  handleLogout,
  fullName,
}: any) {
  const menuItems = [
    { label: "Dashboard", href: "/superadmin", icon: <LayoutDashboard size={19} /> },
    { label: "Courses", href: "/superadmin/courses", icon: <BookOpen size={19} /> },
    { label: "Students", href: "/superadmin/students", icon: <UsersRound size={19} /> },
    { label: "Finances", href: "/superadmin/finances", icon: <DollarSign size={19} /> },
    { label: "Staff & Workloads", href: "/superadmin/staff", icon: <UserCheck size={19} /> },
    { label: "Account Oversight", href: "/superadmin/oversight", icon: <ShieldAlert size={19} /> },
    { label: "Reports & Analytics", href: "/superadmin/reports", icon: <BarChart3 size={19} /> },
    { label: "System Settings", href: "/superadmin/settings", icon: <Settings size={19} /> },
  ];

  return (
    <div className="flex flex-col h-full p-4 sm:p-5 justify-between overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/10">
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
              <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-purple-200 uppercase">
                ANCRAZE
              </span>
              <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 self-start mt-0.5">
                SUPER ADMIN
              </span>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 cursor-pointer text-white border border-white/10 lg:hidden"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              onClick={() => router.push(item.href)}
            />
          ))}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="pt-4 mt-6 border-t border-white/10">
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-md mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-white/30 flex items-center justify-center relative shadow-sm">
            <Image src="/logo.png" alt="User" fill className="object-contain p-1" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">{fullName}</span>
            <span className="text-[10px] text-amber-300 font-medium truncate">Master Authority</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-200 group cursor-pointer border border-red-500/20 shadow-sm font-bold text-sm"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer text-left ${
        active
          ? "bg-gradient-to-r from-amber-500/30 to-purple-600/40 text-white shadow-md border-l-4 border-amber-400 font-bold translate-x-1"
          : "text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 font-semibold"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? "text-amber-300" : "text-purple-300/80"}>
          {icon}
        </span>
        <span className="text-xs sm:text-sm tracking-wide">{label}</span>
      </div>
      {active && <ChevronRight size={15} className="text-amber-300" />}
    </button>
  );
}
