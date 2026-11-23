"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Smartphone } from "lucide-react";

const PHONE_NUMBER = "+91 93824 52699";
const CONTACT_EMAIL = "Ancrazeenglishacademy@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/ancrazeenglish?utm_source=qr&psln=MWI3MDMxeDk5d2xueQ==";
const FACEBOOK_URL = "https://www.facebook.com/share/19tbcqR6iw/";
const YOUTUBE_URL = "https://www.youtube.com/@AncrazeEnglishAcademy";
const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=app.ancraze.com";
const APPSTORE_URL = "https://apps.apple.com/in/app/ancraze/id6773675253";
const OFFICE_ADDRESS = "Ancraze office Kolkata, Abedin Arcade, Tiljala Rd, 3D, Gobra, Kolkata, West Bengal 700046";

interface FooterProps {
  hasFaculties?: boolean;
}

export default function Footer({ hasFaculties = false }: FooterProps) {
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
              Ancraze English Academy
            </p>
            <p className="text-sm text-purple-200/80 leading-relaxed font-normal max-w-sm">
              Learn English Through Bangla. Build Confidence. Speak with Our 20 Codes.
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
              Navigation
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
                <Link href="/contact" className="hover:text-white transition">Contact Us & Admissions</Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition">Frequently Asked Questions</Link>
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
                Contact Admissions
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
            ©️ 2026 Ancraze English Academy. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-purple-300/60 font-medium">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
