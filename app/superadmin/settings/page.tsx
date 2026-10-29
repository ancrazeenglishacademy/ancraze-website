"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Bell,
  Palette,
  Globe,
  Save,
  Loader,
  CheckCircle2,
  Lock,
  Smartphone,
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    academyName: "Ancraze English Academy",
    academyTagline: "Precision English Learning Platform",
    brandColor: "#2A0066",
    contactEmail: "support@ancraze.com",
    contactPhone: "+91 98765 43210",
    address: "Bangalore, Karnataka, India",
    studentIdPrefix: "ANC",
    currencySymbol: "₹",
    maxActiveDevicesPerStudent: 1,
    maintenanceMode: false,
    allowNewRegistrations: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update system settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Academy Settings</h1>
          <p className="text-xs text-slate-500 font-medium">Configure institution branding, notification triggers, device binding rules, and platform security</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-100">
          <Loader size={24} className="animate-spin text-[#2A0066]" />
          <p className="text-xs font-bold text-slate-400">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Academy Branding */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-[#2A0066]/10 text-[#2A0066] rounded-xl">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Academy Branding & Identity</h2>
                <p className="text-xs text-slate-400 font-medium">Controls the public display name, contact information, and institutional identity</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Academy Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.academyName}
                  onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Platform Tagline
                </label>
                <input
                  type="text"
                  value={settings.academyTagline}
                  onChange={(e) => setSettings({ ...settings, academyTagline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Contact Support Email *
                </label>
                <input
                  type="email"
                  required
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Support Contact Phone
                </label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>
            </div>
          </div>

          {/* Security & Access Controls */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-[#2A0066]/10 text-[#2A0066] rounded-xl">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Security & Device Binding</h2>
                <p className="text-xs text-slate-400 font-medium">Protect course material with single-device verification and access policies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Student ID Prefix
                </label>
                <input
                  type="text"
                  value={settings.studentIdPrefix}
                  onChange={(e) => setSettings({ ...settings, studentIdPrefix: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
                <p className="text-[10px] text-slate-400 mt-1">e.g. "ANC" generates IDs like ANC-891042</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Max Active Devices per Student
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={settings.maxActiveDevicesPerStudent}
                  onChange={(e) => setSettings({ ...settings, maxActiveDevicesPerStudent: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowNewRegistrations}
                  onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#2A0066]"
                />
                <div>
                  <p className="text-xs font-black text-slate-900">Allow New Admissions & Registrations</p>
                  <p className="text-[11px] text-slate-400 font-medium">Enables admins to register new students and issue credentials</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#2A0066]"
                />
                <div>
                  <p className="text-xs font-black text-rose-600">Maintenance Mode</p>
                  <p className="text-[11px] text-slate-400 font-medium">Temporarily display a maintenance banner for non-admin users</p>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Settings saved successfully!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition flex items-center gap-2"
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              Save All Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

