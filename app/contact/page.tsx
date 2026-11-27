"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Instagram,
  Facebook,
  Youtube,
  GraduationCap,
  CheckCircle2,
  Send,
  Sparkles,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

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

interface FacultyItem {
  id: string;
  name: string;
  role: string;
  bio?: string;
  specialization?: string;
  experience?: string;
  imageUrl?: string;
}

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    course: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
        console.error("Error fetching faculties on contact page:", err);
      } finally {
        setLoadingFaculties(false);
      }
    };
    fetchFaculties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      alert("Please enter your name and phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setSubmitSuccess(true);
      const text = encodeURIComponent(
        `Hello Ancraze! My name is ${formData.fullName}.\nPhone: ${formData.phone}\nInterested in: ${formData.course}\nMessage: ${formData.message || "I want to enquire about spoken English training."}`
      );
      window.open(`https://wa.me/${PHONE_CLEAN}?text=${text}`, "_blank");
    } catch (err) {
      console.error("Enquiry error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      {/* Top Navigation */}
      <nav className="fixed w-full top-4 sm:top-6 z-50 px-4 sm:px-6 pointer-events-none">
        <div className="max-w-[1320px] mx-auto px-5 py-3 sm:py-3.5 flex items-center justify-between bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[28px] shadow-[0_12px_40px_rgba(42,0,102,0.06)] pointer-events-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white border border-slate-200/90 rounded-xl flex items-center justify-center shadow-md shadow-[#2A0066]/5 group-hover:rotate-6 transition-transform duration-300 relative p-1">
              <Image src="/logo.png" alt="Ancraze Logo" width={36} height={36} className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                Ancraze
              </span>
              <span className="text-[9px] font-bold text-[#2A0066] tracking-widest uppercase mt-0.5">
                English Academy
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            <Link href="/" className="text-[13px] font-bold text-slate-600 hover:text-[#2A0066] transition-colors">
              Home
            </Link>
            <Link href="/#courses" className="text-[13px] font-bold text-slate-600 hover:text-[#2A0066] transition-colors">
              Our Courses
            </Link>
            {faculties.length > 0 && (
              <Link href="#faculties" className="text-[13px] font-bold text-[#2A0066] transition-colors">
                Faculties
              </Link>
            )}
            <Link href="#contact-details" className="text-[13px] font-bold text-slate-600 hover:text-[#2A0066] transition-colors">
              Contact Us
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 sm:px-6 py-2.5 bg-[#2A0066] hover:bg-[#3D0099] text-white font-black rounded-full text-xs uppercase tracking-wider transition-all transform hover:scale-105 shadow-md shadow-[#2A0066]/25 flex items-center gap-1.5"
            >
              <MessageSquare size={13} className="fill-white" />
              <span>Enroll Now</span>
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-600 hover:text-slate-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 max-w-[1320px] mx-auto bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-5 shadow-2xl pointer-events-auto flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 font-bold text-slate-700 hover:text-[#2A0066]">
              Home
            </Link>
            <Link href="/#courses" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 font-bold text-slate-700 hover:text-[#2A0066]">
              Our Courses
            </Link>
            {faculties.length > 0 && (
              <Link href="#faculties" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 font-bold text-[#2A0066]">
                Faculties & Mentors
              </Link>
            )}
            <Link href="#contact-details" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 font-bold text-slate-700 hover:text-[#2A0066]">
              Contact Us
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Header */}
      <header className="pt-36 pb-16 sm:pb-20 bg-gradient-to-b from-purple-100/50 via-slate-50 to-white text-center px-5 relative overflow-hidden border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2A0066]/10 text-[#2A0066] text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} className="text-[#2A0066]" />
            <span>Connect & Learn</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Spoken English Course Admissions {faculties.length > 0 ? (
              <>
                & Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A0066] to-purple-600">Expert Faculties</span>
              </>
            ) : null}
          </h1>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            Contact Ancraze by phone or WhatsApp for course details and admission to our online spoken English classes taught in Bangla.
          </p>
        </div>
      </header>

      {/* ============================================================ */}
      {/* FACULTIES SECTION (Only rendered if mentors are created) */}
      {/* ============================================================ */}
      {faculties.length > 0 && (
        <section id="faculties" className="py-24 bg-white border-b border-slate-200/70">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#2A0066]/10 text-[#2A0066] rounded-full text-xs font-black uppercase tracking-widest">
                <GraduationCap size={15} />
                <span>FACULTIES & MENTORS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Our Expert Faculties & Personal Trainers
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-medium">
                Every mentor at Ancraze is dedicated to turning hesitant speakers into confident, fluent communicators.
              </p>
            </div>

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
                        `Hello Ancraze! I want to enquire about training with faculty mentor ${faculty.name}.`
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
      )}

      {/* ============================================================ */}
      {/* CONTACT DETAILS & QUICK ENQUIRY SECTION */}
      {/* ============================================================ */}
      <section id="contact-details" className="py-24 bg-slate-50">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Admissions Office Column */}
            <div className="lg:col-span-5 p-8 sm:p-10 rounded-[32px] bg-[#2A0066] text-white shadow-xl shadow-[#2A0066]/15 flex flex-col justify-between">
              <div className="space-y-8">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                    Admissions Office
                  </span>
                  <h3 className="text-3xl font-black text-white mt-1">Get in Touch</h3>
                  <p className="text-xs text-purple-200 mt-2 leading-relaxed">
                    Have questions about admissions, trial sessions, or our 20-Code Method taught in Bangla? Reach out through any of our channels:
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
                      <p className="text-[10px] text-purple-200 mt-0.5">Instant chat & admission guidance</p>
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
                      <p className="text-[10px] text-purple-200 mt-0.5">Direct line to our admissions desk</p>
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
                      <p className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Email Address</p>
                      <p className="text-sm font-black text-white break-all">{CONTACT_EMAIL}</p>
                      <p className="text-[10px] text-purple-200 mt-0.5">Send us your queries anytime</p>
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
                  Follow Ancraze
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
                  <h3 className="text-2xl font-black text-slate-900">Send an Admission Enquiry</h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Submit your details and our academic counsellors will contact you within 24 hours.
                  </p>
                </div>

                {submitSuccess ? (
                  <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="text-lg font-black text-emerald-900">Enquiry Submitted!</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
                      Thank you for contacting Ancraze. We have opened WhatsApp to connect you directly with our counsellor!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitSuccess(false);
                        setFormData({
                          fullName: "",
                          phone: "",
                          course: "",
                          message: "",
                        });
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition mt-2 cursor-pointer"
                    >
                      Send Another Enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        WhatsApp / Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Interested Course
                      </label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="Enter course name (optional)"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your Message / Questions (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about your learning goals or any questions..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#2A0066] focus:bg-white transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#2A0066]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Submit Admission Enquiry</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Direct Hotline: <strong className="text-slate-800">{PHONE_NUMBER}</strong></span>
                <span>Response Time: &lt; 24 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-1 relative flex items-center justify-center">
              <Image src="/logo.png" alt="Ancraze" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-bold text-white">Ancraze English Academy</span>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Ancraze. All Rights Reserved. Master English Speaking with our 20 Codes.
          </p>

          <div className="flex items-center gap-4">
            <a href={PLAYSTORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Play Store
            </a>
            <span>•</span>
            <a href={APPSTORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              App Store
            </a>
            <span>•</span>
            <Link href="/" className="hover:text-white transition">
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
