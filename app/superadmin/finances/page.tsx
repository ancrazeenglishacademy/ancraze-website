"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Search,
  Filter,
  Loader,
  X,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FinanceRecord {
  id: string;
  type: "revenue" | "expense" | "refund";
  title: string;
  amount: number;
  currency: string;
  studentName?: string;
  courseTitle?: string;
  status: "completed" | "pending" | "refunded";
  paymentMethod: string;
  invoiceNumber: string;
  notes?: string;
  createdAt: string;
}

export default function SuperAdminFinancesPage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingBalances: 0,
    totalRefunds: 0,
    netProfit: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formType, setFormType] = useState<"revenue" | "expense">("revenue");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [studentName, setStudentName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI / Online");
  const [status, setStatus] = useState<"completed" | "pending">("completed");

  useEffect(() => {
    fetchFinances();
  }, [filterType]);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const url =
        filterType === "all"
          ? "/api/finances"
          : `/api/finances?type=${filterType}`;

      const res = await fetch(url, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch finances");
      const data = await res.json();
      setRecords(data.records || []);
      if (data.summary) setSummary(data.summary);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    try {
      setModalLoading(true);
      const res = await fetch("/api/finances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          type: formType,
          title,
          amount: Number(amount),
          studentName: studentName || null,
          paymentMethod,
          status,
        }),
      });

      if (!res.ok) throw new Error("Failed to add transaction");

      setShowAddModal(false);
      setTitle("");
      setAmount("");
      setStudentName("");
      await fetchFinances();
    } catch (err: any) {
      alert(err.message || "Failed to create transaction");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academy Financial Management</h1>
          <p className="text-xs text-slate-500 font-medium">Monitor revenue streams, admission fee balances, expenses, refunds, and financial audit logs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#2A0066]/20 hover:opacity-95 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> Record Transaction
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{summary.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">Completed Collections</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Profit</span>
            <div className="p-2 bg-[#2A0066]/10 text-[#2A0066] rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2A0066]">₹{summary.netProfit.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">After Expenses & Refunds</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Balances</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">₹{summary.pendingBalances.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">Awaiting Student Clearance</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refunds & Expenses</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600">₹{(summary.totalExpenses + summary.totalRefunds).toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">₹{summary.totalRefunds.toLocaleString()} Approved Refunds</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, student or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#2A0066] transition text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Transaction Types</option>
            <option value="revenue">Revenues & Admissions</option>
            <option value="expense">Academy Expenses</option>
            <option value="refund">Student Refunds</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader size={24} className="animate-spin text-[#2A0066]" />
            <p className="text-xs font-bold text-slate-400">Loading financial records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold">
            No financial records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Transaction / Student</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{r.title}</p>
                        {r.studentName && (
                          <p className="text-[11px] text-slate-400 font-medium">Student: {r.studentName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {r.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`capitalize px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          r.type === "revenue"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : r.type === "expense"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-sm">
                      {r.type === "expense" || r.type === "refund" ? "-" : "+"}₹{r.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {r.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          r.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Record Financial Transaction</h3>
                  <p className="text-xs text-slate-400 font-medium">Log fee collection, expense, or accounting adjustment</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormType("revenue")}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                      formType === "revenue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Revenue / Fee
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("expense")}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                      formType === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Academy Expense
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Title / Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Admission Fee - John Doe or Server Infrastructure"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="completed">Completed / Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {formType === "revenue" && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Student Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Smith"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2A0066]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="UPI / Online">UPI / Online Transfer</option>
                    <option value="Bank Wire">Bank Wire Transfer</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Cash / Intake Desk">Cash / Intake Desk</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 bg-[#2A0066] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader size={16} className="animate-spin" /> : "Save Entry"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

