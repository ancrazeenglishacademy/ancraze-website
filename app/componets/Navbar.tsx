"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Menu, X } from "lucide-react";

const PHONE_CLEAN = "919382452699";
const WHATSAPP_URL = `https://wa.me/${PHONE_CLEAN}?text=${encodeURIComponent(
  "Hello Ancraze Team! I am interested in enrolling in your Spoken English Course. Please guide me."
)}`;

interface NavbarProps {
  hasFaculties?: boolean;
}

export default function Navbar({ hasFaculties }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFaculties, setShowFaculties] = useState<boolean>(!!hasFaculties);

  useEffect(() => {
    if (hasFaculties !== undefined) {
      setShowFaculties(hasFaculties);
      return;
    }
    // Auto-detect faculties if not passed
    const checkFaculties = async () => {
      try {
        const res = await fetch("/api/faculties?active=true");
        if (res.ok) {
          const data = await res.json();
          setShowFaculties(Array.isArray(data.faculties) && data.faculties.length > 0);
        }
      } catch {
        setShowFaculties(false);
      }
    };
    checkFaculties();
  }, [hasFaculties]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Our Courses", href: "/courses" },
    ...(showFaculties ? [{ name: "Faculties", href: "/faculties" }] : []),
    { name: "Why Ancraze", href: "/why-ancraze" },
    { name: "What We Provide", href: "/what-we-provide" },
    { name: "Contact Us", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
  ANCRAZE
</span>
            <span className="text-[9px] font-bold text-[#2A0066] tracking-widest uppercase mt-0.5">
              English Academy
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[13px] font-bold transition-colors relative group py-1 ${
                  active ? "text-[#2A0066]" : "text-slate-600 hover:text-[#2A0066]"
                }`}
              >
                {link.name}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-[#2A0066] rounded-full transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
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
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2.5 text-sm font-bold rounded-xl transition ${
                      active
                        ? "bg-[#2A0066]/10 text-[#2A0066]"
                        : "text-slate-700 hover:text-[#2A0066] hover:bg-purple-50/60"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-[#2A0066] text-white text-center font-black rounded-xl text-xs uppercase tracking-wider shadow-md"
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
