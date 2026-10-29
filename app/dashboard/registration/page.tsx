"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Key,
  BookOpen,
  User,
  Mail,
  Phone,
  Copy,
  CheckCircle2,
  Share2,
  Loader,
  Sparkles,
  MessageSquare,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  title: string;
}

interface Trainer {
  id: string;
  fullName: string;
}

export default function StudentRegistrationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [initialFee, setInitialFee] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"completed" | "pending">("completed");

  // Success Slip State
  const [registeredStudent, setRegisteredStudent] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setInitialLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      // 1. Courses
      const cRes = await fetch("/api/courses", { headers });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourses(cData.courses || []);
      }

      // 2. Trainers
      const uRes = await fetch("/api/users?role=trainer", { headers });
      if (uRes.ok) {
        const uData = await uRes.json();
        setTrainers(uData.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    try {
      setLoading(true);
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          enrolledCourses: selectedCourses,
          trainerId: selectedTrainer || null,
          initialFee: initialFee ? Number(initialFee) : 0,
          paymentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register student");

      setRegisteredStudent(data.student);

      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setSelectedCourses([]);
      setSelectedTrainer("");
      setInitialFee("");
    } catch (err: any) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!registeredStudent) return;
    const text = `🎉 Welcome to Ancraze English Academy!\n\nDear ${registeredStudent.fullName},\nYour admission is confirmed. Here are your portal login credentials:\n\n🔗 Portal URL: ${window.location.origin}/login\n👤 Student ID / Password: ${registeredStudent.loginId}\n📧 Registered Email: ${registeredStudent.email}\n\n⚠️ Note: Keep this Student ID secure. You can sign in using your email and Student ID as password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    if (!registeredStudent) return;
    const text = encodeURIComponent(
      `🎉 *Welcome to Ancraze English Academy!*\n\nDear ${registeredStudent.fullName},\nYour student registration has been processed successfully.\n\n*Your Student Login ID:* ${registeredStudent.loginId}\n*Portal Link:* ${window.location.origin}/login\n\nPlease log in to access your modules, tasks, and connect with your trainer.`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Admission & Onboarding</h1>
        <p className="text-xs text-slate-500 font-medium">Add newly admitted students, generate formatted Student IDs (`ANC-XXXXXX`), and prepare instant onboarding credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registration Intake Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-[#2A0066]/10 text-[#2A0066] rounded-xl">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Student Admission Intake</h2>
              <p className="text-xs text-slate-400 font-medium">Auto-generates student login credentials upon submission</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. david@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  WhatsApp / Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Assign Trainer
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="">Unassigned (Allocate Later)</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Courses Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Enrolled Course(s)
              </label>
              {courses.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No courses found in system.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {courses.map((c) => {
                    const isSelected = selectedCourses.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCourses(selectedCourses.filter((id) => id !== c.id));
                          } else {
                            setSelectedCourses([...selectedCourses, c.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                          isSelected
                            ? "bg-[#2A0066] text-white border-[#2A0066]"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className="truncate">{c.title}</span>
                        {isSelected && <CheckCircle2 size={14} className="flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fee Collection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Admission Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 4500"
                  value={initialFee}
                  onChange={(e) => setInitialFee(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="completed">Paid in Full</option>
                  <option value="pending">Outstanding / Partial</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#2A0066] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <>
                    Confirm Admission & Generate Student ID <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Shareable Onboarding Card / Output Slip */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-[#180036] via-[#2A0066] to-[#4A0E78] p-6 sm:p-7 rounded-3xl text-white shadow-xl shadow-[#2A0066]/20 border border-white/15 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <Sparkles size={13} /> Onboarding Credential Slip
              </span>
              <span className="text-[10px] text-white/60 font-bold">Official Academy Pass</span>
            </div>

            {registeredStudent ? (
              <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2">
                  <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Student Name</p>
                  <p className="text-xl font-black text-white tracking-tight">{registeredStudent.fullName}</p>
                  <p className="text-xs text-slate-300 font-medium">{registeredStudent.email}</p>
                </div>

                <div className="p-4 bg-amber-400 text-slate-950 rounded-2xl shadow-md space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Generated Student ID</p>
                  <p className="text-2xl font-mono font-black tracking-wider">{registeredStudent.loginId}</p>
                  <p className="text-[10px] font-bold text-slate-700">Used as initial login password</p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={copyCredentials}
                    className="w-full py-3 bg-white text-[#2A0066] hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                  >
                    {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    {copied ? "Copied to Clipboard!" : "Copy Full Welcome Message"}
                  </button>

                  {phone && (
                    <button
                      onClick={shareWhatsApp}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} /> Send via WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-white/50 space-y-2">
                <Key size={36} className="mx-auto text-white/30" />
                <p className="text-xs font-bold">No student registered in this session.</p>
                <p className="text-[11px] text-white/40">Complete the admission form to generate a live shareable onboarding pass.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

