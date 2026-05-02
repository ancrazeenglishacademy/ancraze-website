'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, X, CheckCircle2, Loader, BookOpen, User } from 'lucide-react';

export default function AddCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        teacherName: '',
        price: '',
        coverImage: null as File | null,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                coverImage: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({
            ...prev,
            coverImage: null
        }));
        setImagePreview(null);
    };

    const validateForm = () => {
        if (formData.title.trim().length < 3) {
            setError("Title must be at least 3 characters long");
            return false;
        }
        if (formData.description.trim().length < 10) {
            setError("Description must be at least 10 characters long");
            return false;
        }
        if (formData.teacherName.trim().length < 2) {
            setError("Teacher Name must be at least 2 characters long");
            return false;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            setError("Price must be a positive number");
            return false;
        }
        if (!formData.coverImage) {
            setError("Cover Image is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            // Scroll to top to see error
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('teacherName', formData.teacherName);
            formDataToSend.append('price', formData.price);
            if (formData.coverImage) {
                formDataToSend.append('coverImage', formData.coverImage);
            }

            const response = await fetch('/api/addcourse', {
                method: 'POST',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Failed to create course');
            }

            const data = await response.json();
            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/dashboard/course');
            }, 2000);
        } catch (error) {
            console.error('Error creating course:', error);
            setError('Error creating course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 md:px-6 py-8 md:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100"
            >
                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-10">
                                <button
                                    onClick={() => router.push('/dashboard/course')}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900">Create New Course</h1>
                                    <p className="text-gray-500 text-sm font-medium mt-1">Add a new course to your platform</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    {/* Course Title */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="title" className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">
                                            Course Title <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <BookOpen className="text-gray-400" size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition text-black font-semibold"
                                                placeholder="e.g : Introduction to English language"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="description" className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none resize-none transition text-black font-medium"
                                            placeholder="Describe what students will learn in this course..."
                                        />
                                    </div>

                                    {/* Teacher Name & Price - Side by Side */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        {/* Teacher Name */}
                                        <div>
                                            <label htmlFor="teacherName" className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">
                                                Teacher Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <User className="text-gray-400" size={20} />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="teacherName"
                                                    name="teacherName"
                                                    value={formData.teacherName}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition text-black font-semibold"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label htmlFor="price" className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">
                                                Price (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-gray-400 font-bold">₹</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    id="price"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    required
                                                    step="0.01"
                                                    min="0"
                                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition text-black font-semibold"
                                                    placeholder="999.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cover Image */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Cover Image <span className="text-red-500">*</span>
                                        </label>

                                        {!imagePreview ? (
                                            <label
                                                htmlFor="coverImage"
                                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#2A0066] hover:bg-gray-50 transition-all"
                                            >
                                                <Upload className="text-gray-400 mb-2" size={40} />
                                                <p className="text-sm font-semibold text-gray-600">Click to upload cover image</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                                <input
                                                    type="file"
                                                    id="coverImage"
                                                    name="coverImage"
                                                    onChange={handleImageChange}
                                                    required
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </label>
                                        ) : (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Cover preview"
                                                    className="w-full h-64 object-cover rounded-xl border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-lg"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-red-50 border border-red-100 rounded-lg"
                                        >
                                            <p className="text-red-600 text-xs font-medium">{error}</p>
                                        </motion.div>
                                    )}

                                    {/* Submit Buttons */}
                                    {/* Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 md:pt-8 border-t border-gray-100 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => router.push('/dashboard/course')}
                                            className="w-full sm:flex-1 py-4 px-6 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition duration-200 uppercase tracking-wide text-xs md:text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full sm:flex-[2] py-4 px-6 bg-[#2A0066] hover:opacity-90 text-white font-bold rounded-xl transition duration-200 shadow-xl shadow-[#2A0066]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-xs md:text-sm"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="animate-spin" size={20} />
                                                    Creating Course...
                                                </>
                                            ) : (
                                                'Create Course'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle2 className="text-green-600" size={40} />
                            </motion.div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Course Created Successfully!</h2>
                            <p className="text-gray-500 font-medium">Redirecting to courses page...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}