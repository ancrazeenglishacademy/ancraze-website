"use client";
import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    User,
    Mail,
    Calendar,
    BookOpen,
    X,
    Loader,
    Key,
    Users,
    ChevronRight,
    SearchX,
    UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Student {
    id: string;
    fullName: string;
    email: string;
    loginId: string;
    enrolledCourses: string[];
    enrolledCoursesDetails?: any[];
    trainerId?: string;
    createdAt: string;
}

interface Course {
    id: string;
    title: string;
}

interface Trainer {
    id: string;
    fullName: string;
}

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [selectedTrainer, setSelectedTrainer] = useState<string>("");

    useEffect(() => {
        fetchStudents();
        fetchCourses();
        fetchTrainers();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/students?role=student", {
                headers: {
                    "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch students");
            const data = await response.json();
            setStudents(data.students);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch("/api/courses", {
                headers: {
                    "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch courses");
            const data = await response.json();
            setCourses(data.courses);
        } catch (err: any) {
            console.error("Error fetching courses:", err);
        }
    };

    const fetchTrainers = async () => {
        try {
            const response = await fetch("/api/students?role=trainer", {
                headers: {
                    "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch trainers");
            const data = await response.json();
            setTrainers(data.students || []);
        } catch (err: any) {
            console.error("Error fetching trainers:", err);
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !email) return;

        setModalLoading(true);
        try {
            const response = await fetch("/api/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    enrolledCourses: selectedCourses,
                    trainerId: selectedTrainer || null,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to add student");

            alert(`Student added successfully!\nLogin ID: ${data.student.loginId}`);
            setShowAddModal(false);
            setFullName("");
            setEmail("");
            setSelectedCourses([]);
            setSelectedTrainer("");
            fetchStudents();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const toggleCourse = (courseId: string) => {
        setSelectedCourses(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    const filteredStudents = (students || []).filter(student =>
        student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student?.loginId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Student <span className="text-[#2A0066]">Management</span>
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">
                        View, add, and manage your students access.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2A0066] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                >
                    <Plus size={18} />
                    Add New Student
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Students</p>
                        <h3 className="text-2xl font-black text-slate-900">{students.length}</h3>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by name, email or Login ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium"
                />
            </div>

            {/* Students List */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Login ID</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Courses</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Joined</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader className="animate-spin text-[#2A0066]" size={32} />
                                            <p className="text-slate-500 font-medium">Loading students...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <SearchX size={48} />
                                            <p className="text-lg font-bold">No students found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/dashboard/students/${student.id}`)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-[#2A0066]/5 rounded-xl flex items-center justify-center text-[#2A0066] font-black text-sm border border-[#2A0066]/10">
                                                    {student.fullName ? student.fullName.charAt(0).toUpperCase() : "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-none">{student.fullName}</p>
                                                    <p className="text-[11px] text-slate-400 mt-1">{student.email}</p>
                                                    {student.trainerId && (
                                                        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-1">
                                                            Trainer: {trainers.find(t => t.id === student.trainerId)?.fullName || 'Unknown'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Key size={14} className="text-amber-500" />
                                                <code className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{student.loginId}</code>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex -space-x-2">
                                                {(student.enrolledCoursesDetails?.length || 0) > 0 ? (
                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 uppercase tracking-widest whitespace-nowrap">
                                                        {student.enrolledCoursesDetails?.length} {(student.enrolledCoursesDetails?.length === 1) ? 'Course' : 'Courses'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-300 uppercase italic">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={14} />
                                                <span className="text-xs font-medium">
                                                    {new Date(student.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/students/${student.id}`);
                                                }}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Student Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => !modalLoading && setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase">Add Student</h2>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddStudent} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium"
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium"
                                                placeholder="e.g. john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assign Trainer (Optional)</label>
                                        <div className="relative">
                                            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                value={selectedTrainer}
                                                onChange={(e) => setSelectedTrainer(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2A0066] outline-none transition-all font-medium appearance-none cursor-pointer text-slate-700"
                                            >
                                                <option value="">Select a Trainer</option>
                                                {trainers.map((trainer) => (
                                                    <option key={trainer.id} value={trainer.id}>
                                                        {trainer.fullName}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronRight size={16} className="text-slate-400 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                                            Assign Courses
                                            <span className="text-[#2A0066]">{selectedCourses.length} selected</span>
                                        </label>
                                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {courses.map((course) => (
                                                <button
                                                    key={course.id}
                                                    type="button"
                                                    onClick={() => toggleCourse(course.id)}
                                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${selectedCourses.includes(course.id)
                                                        ? "border-[#2A0066] bg-[#2A0066]/5"
                                                        : "border-slate-50 bg-slate-50 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen size={18} className={selectedCourses.includes(course.id) ? "text-[#2A0066]" : "text-slate-400"} />
                                                        <span className={`text-sm font-bold ${selectedCourses.includes(course.id) ? "text-[#2A0066]" : "text-slate-600"}`}>
                                                            {course.title}
                                                        </span>
                                                    </div>
                                                    {selectedCourses.includes(course.id) && (
                                                        <div className="h-5 w-5 bg-[#2A0066] rounded-full flex items-center justify-center">
                                                            <Plus size={12} className="text-white rotate-45" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={modalLoading}
                                            className="w-full py-4 bg-[#2A0066] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#2A0066]/20 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            {modalLoading ? (
                                                <Loader className="animate-spin" size={20} />
                                            ) : (
                                                "Confirm & Generate Login ID"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}