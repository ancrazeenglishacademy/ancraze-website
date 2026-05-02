"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import Cookies from "js-cookie";

export default function RegisterPage() {
    const router = useRouter();
    const { registerWithEmail, user, loading } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        const role = Cookies.get("role");
        if (role === "admin" || role === "user") {
            router.push("/dashboard");
            return;
        }

        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    const validateForm = () => {
        if (fullName.trim().length < 3) {
            setError("Full Name must be at least 3 characters long");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return false;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        setFormLoading(true);

        try {
            await registerWithEmail(email, password, fullName);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-gray-100"
            >
                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-[#2A0066]">Create Account</h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    Register as staff to manage Ancraze
                                </p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-6">
                                {/* Full Name Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        disabled={formLoading}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition disabled:bg-gray-50 text-black"
                                        required
                                    />
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="name@company.com"
                                        disabled={formLoading}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition disabled:bg-gray-50 text-black"
                                        required
                                    />
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        disabled={formLoading}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition disabled:bg-gray-50 text-black"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {/* Confirm Password Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        disabled={formLoading}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition disabled:bg-gray-50 text-black"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-red-600 text-xs font-medium">{error}</p>
                                    </div>
                                )}

                                {/* Register Button */}
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-full py-3.5 px-4 bg-[#2A0066] hover:opacity-90 text-white font-bold rounded-xl transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {formLoading ? "Creating Account..." : "Register"}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                                Already have an account?{" "}
                                <Link href="/login" className="text-[#2A0066] font-bold hover:underline">
                                    Login here
                                </Link>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    className="w-8 h-8 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    Your staff account has been registered successfully.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full py-3.5 px-4 bg-[#2A0066] hover:opacity-90 text-white font-bold rounded-xl transition duration-200 shadow-md"
                            >
                                Proceed to Login
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
