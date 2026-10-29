"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Smartphone,
  Clock,
  Search,
  Filter,
  Loader,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface StudentMonitor {
  id: string;
  fullName: string;
  email: string;
  loginId?: string;
  deviceId?: string | null;
  lastLoginAt?: string | null;
  enrolledCoursesDetails?: any[];
  trainerName?: string;
  accountStatus?: string;
}

export default function StudentMonitoringPage() {
  const [students, setStudents] = useState<StudentMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students?role=student", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDevice = async (studentId: string, studentName: string) => {
    if (!confirm(`Reset registered device session for ${studentName}? This allows them to log in from a new device.`)) return;

    try {
      setResettingId(studentId);
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          studentId,
          resetDeviceId: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to reset device");
      await fetchMonitoringData();
      alert("Device binding cleared successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResettingId(null);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loginId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Activity & Device Monitoring</h1>
          <p className="text-xs text-slate-500 font-medium">Verify login sessions, device bindings, course access activity, and reset device hardware locks</p>
        </div>
        <button
          onClick={() => fetchMonitoringData()}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
          title="Refresh Monitoring Data"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, email, or Student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
          />
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading live monitoring sessions...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold">
            No active student sessions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Active Course</th>
                  <th className="px-6 py-4">Bound Device</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-right">Device Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{s.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {s.loginId || "---"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      {s.enrolledCoursesDetails?.[0]?.title || "Active Module"}
                    </td>
                    <td className="px-6 py-4">
                      {s.deviceId ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <Smartphone size={14} className="text-emerald-600" />
                          <span className="font-mono text-[11px] truncate max-w-[140px]">{s.deviceId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium italic">No Device Bound</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {s.lastLoginAt ? (
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{new Date(s.lastLoginAt).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not logged in yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleResetDevice(s.id, s.fullName)}
                        disabled={!s.deviceId || resettingId === s.id}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-[#2A0066] hover:text-white rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ml-auto"
                      >
                        {resettingId === s.id ? (
                          <Loader size={12} className="animate-spin" />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                        Reset Device
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

