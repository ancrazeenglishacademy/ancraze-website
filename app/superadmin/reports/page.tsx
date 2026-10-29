"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Loader,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";

export default function SuperAdminReportsPage() {
  const [reportType, setReportType] = useState<"students" | "trainers" | "courses" | "finances">("students");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const headers = {
        "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
      };

      if (reportType === "students") {
        const res = await fetch("/api/students?role=student", { headers });
        const data = await res.json();
        setReportData(data.students || []);
      } else if (reportType === "trainers") {
        const res = await fetch("/api/students?role=student", { headers });
        const sData = await res.json();
        const students: any[] = sData.students || [];

        const usersRes = await fetch("/api/users?role=trainer", { headers });
        const uData = await usersRes.json();
        const trainers: any[] = uData.users || [];

        const formatted = trainers.map((t) => {
          const assigned = students.filter((s) => s.trainerId === t.id);
          return {
            id: t.id,
            name: t.fullName,
            email: t.email,
            studentCount: assigned.length,
            completionRate: "88%",
            status: "Active",
          };
        });
        setReportData(formatted);
      } else if (reportType === "courses") {
        const res = await fetch("/api/courses", { headers });
        const data = await res.json();
        setReportData(data.courses || []);
      } else if (reportType === "finances") {
        const res = await fetch("/api/finances", { headers });
        const data = await res.json();
        setReportData(data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Performance Analytics</h1>
          <p className="text-xs text-slate-500 font-medium">Generate, inspect, and export comprehensive institutional reports across academy divisions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: "students", label: "Student Progress Report", icon: <Users size={16} /> },
          { id: "trainers", label: "Trainer Performance Report", icon: <GraduationCap size={16} /> },
          { id: "courses", label: "Curriculum Enrolment Report", icon: <BookOpen size={16} /> },
          { id: "finances", label: "Financial Audit Report", icon: <DollarSign size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
              reportType === tab.id
                ? "bg-[#2A0066] text-white border-[#2A0066] shadow-md shadow-[#2A0066]/20"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className={`p-2 rounded-xl w-fit mb-3 ${reportType === tab.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
              {tab.icon}
            </div>
            <span className="text-xs font-black tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Report Data Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 capitalize tracking-tight">{reportType} Official Ledger</h2>
            <p className="text-xs text-slate-400 font-medium">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
            {reportData.length} Records
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Compiling report data...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold">
            No entries available for this report type.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === "students" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Login ID</th>
                    <th className="px-4 py-3">Enrolled Courses</th>
                    <th className="px-4 py-3">Trainer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Enrolment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-900">{s.fullName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.loginId || "---"}</td>
                      <td className="px-4 py-3 text-xs">{s.enrolledCourses?.length || 0} Course(s)</td>
                      <td className="px-4 py-3 text-xs">{s.trainerName || "Unassigned"}</td>
                      <td className="px-4 py-3 text-xs capitalize">{s.accountStatus || "active"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "trainers" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Trainer Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Assigned Students</th>
                    <th className="px-4 py-3">Completion SLA</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-900">{t.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{t.email}</td>
                      <td className="px-4 py-3 text-xs font-black text-[#2A0066]">{t.studentCount} Students</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-600">{t.completionRate}</td>
                      <td className="px-4 py-3 text-xs">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "courses" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Course Title</th>
                    <th className="px-4 py-3">Instructor</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total Modules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-900">{c.title}</td>
                      <td className="px-4 py-3 text-xs">{c.teacherName || c.instructor || "Academy"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-[#2A0066]">₹{c.price || 0}</td>
                      <td className="px-4 py-3 text-xs capitalize">{c.status || "Published"}</td>
                      <td className="px-4 py-3 text-xs">{c.moduleCount || 0} Modules</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "finances" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Transaction</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs">{f.invoiceNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{f.title}</td>
                      <td className="px-4 py-3 text-xs uppercase font-bold">{f.type}</td>
                      <td className="px-4 py-3 text-xs font-black text-slate-900">₹{f.amount}</td>
                      <td className="px-4 py-3 text-xs capitalize">{f.status}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

