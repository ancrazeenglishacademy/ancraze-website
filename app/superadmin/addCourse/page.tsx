'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  X,
  CheckCircle2,
  Loader,
  BookOpen,
  User,
  Sparkles,
  Clock,
  Calendar,
  Layers,
  MessageSquare,
  HelpCircle,
  Award,
  Eye,
} from 'lucide-react';

export default function AddCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    badge: 'POPULAR FOUNDATION',
    description: '',
    duration: '30 Days',
    validity: '6 Months',
    liveSessions: '5 Live Sessions',
    features: `24/7 access to the Ancraze App
Six months of app validity
Pre-recorded lessons
Innovative 20-Code Method
Daily vocabulary and useful phrases
Learn 300 important English verbs and their usage
Personal trainer speaking practice (10/20/30-minute plans)
Weekly revision and test sessions
Course completion certificate`,
    whoShouldJoin: 'Learners who want to establish a strong foundation in spoken English through a focused, structured learning programme.',
    teacherName: 'Ancraze Master Faculty',
    price: '1999',
    refundDays: '0',
    isTrainerGuided: false,
    showOnHomePage: true,
    coverImage: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        coverImage: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      coverImage: null,
    }));
    setImagePreview(null);
  };

  const validateForm = () => {
    if (formData.title.trim().length < 3) {
      setError('Course Title must be at least 3 characters long');
      return false;
    }
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return false;
    }
    if (formData.teacherName.trim().length < 2) {
      setError('Teacher Name must be at least 2 characters long');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Price must be a positive number');
      return false;
    }
    if (!formData.coverImage) {
      setError('Cover Image is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('tagline', formData.tagline);
      formDataToSend.append('badge', formData.badge);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('validity', formData.validity);
      formDataToSend.append('liveSessions', formData.liveSessions);
      formDataToSend.append('features', formData.features);
      formDataToSend.append('whoShouldJoin', formData.whoShouldJoin);
      formDataToSend.append('teacherName', formData.teacherName);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('refundDays', formData.refundDays || '0');
      formDataToSend.append('isTrainerGuided', formData.isTrainerGuided ? 'true' : 'false');
      formDataToSend.append('showOnHomePage', formData.showOnHomePage ? 'true' : 'false');
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }

      const response = await fetch('/api/addcourse', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to create course');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/superadmin/courses');
      }, 1800);
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.message || 'Error creating course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const featureList = formData.features
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/superadmin/courses')}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-[#2A0066]">
                  Curriculum Engine
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#2A0066]">
                  Homepage Enabled
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Create New Course
              </h1>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!success ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Column (7 Cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7">
                  {/* Section 1: Course Identity */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[#2A0066] flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Sparkles size={16} /> 1. Course Identity & Headlines
                    </h2>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Course Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        placeholder="e.g. 30-Day Foundational Spoken English Course"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Top Badge Pill
                        </label>
                        <input
                          type="text"
                          name="badge"
                          placeholder="e.g. POPULAR FOUNDATION, MOST COMPREHENSIVE"
                          value={formData.badge}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Floating label above course title</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Tagline / Subtitle
                        </label>
                        <input
                          type="text"
                          name="tagline"
                          placeholder="e.g. Build Your Foundation. Start Speaking with Confidence."
                          value={formData.tagline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Bold purple tagline under title</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Course Overview / Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        required
                        rows={3}
                        placeholder="A structured programme designed to help you understand sentence formation and develop practical English-speaking skills..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#2A0066] focus:bg-white transition resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Section 2: Homepage Key Metrics Pill Bar */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[#2A0066] flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Clock size={16} /> 2. Key Metrics Bar (Duration, Validity, Sessions)
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Duration
                        </label>
                        <input
                          type="text"
                          name="duration"
                          placeholder="e.g. 30 Days / 60 Days / Self-Paced"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          App Validity
                        </label>
                        <input
                          type="text"
                          name="validity"
                          placeholder="e.g. 6 Months / 1 Year"
                          value={formData.validity}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Live Sessions
                        </label>
                        <input
                          type="text"
                          name="liveSessions"
                          placeholder="e.g. 5 Live Sessions / App-Based"
                          value={formData.liveSessions}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Course Features Checklist */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h2 className="text-sm font-black uppercase tracking-wider text-[#2A0066] flex items-center gap-2">
                        <CheckCircle2 size={16} /> 3. Course Features (One per line)
                      </h2>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {featureList.length} items entered
                      </span>
                    </div>

                    <div>
                      <textarea
                        name="features"
                        rows={6}
                        placeholder={`24/7 access to the Ancraze App\nSix months of app validity\nPre-recorded lessons\nInnovative 20-Code Method\nDaily vocabulary and useful phrases\nLearn 300 important English verbs\nPersonal trainer speaking practice`}
                        value={formData.features}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-[#2A0066] focus:bg-white transition resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Type each feature on a new line. The first 6 items are previewed on the card, and additional items appear under &ldquo;+ X more included features&rdquo;.
                      </p>
                    </div>
                  </div>

                  {/* Section 4: Modal Detail (Who Should Join) */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[#2A0066] flex items-center gap-2 pb-2 border-b border-slate-100">
                      <HelpCircle size={16} /> 4. Detailed Modal View Info
                    </h2>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Who Should Join This Course?
                      </label>
                      <textarea
                        name="whoShouldJoin"
                        rows={2}
                        placeholder="e.g. Learners who want to establish a strong foundation in spoken English through a focused, structured 30-day programme."
                        value={formData.whoShouldJoin}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#2A0066] focus:bg-white transition resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Section 5: Pricing, Instructor & Media */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[#2A0066] flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Award size={16} /> 5. Course Fees & Cover Image
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Course Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="price"
                          required
                          min="0"
                          step="0.01"
                          placeholder="e.g. 1999"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Faculty / Teacher Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="teacherName"
                          required
                          placeholder="e.g. Ancraze Master Faculty"
                          value={formData.teacherName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Course Refund Days
                        </label>
                        <input
                          type="number"
                          name="refundDays"
                          min="0"
                          step="1"
                          placeholder="e.g. 7 (0 for non-refundable)"
                          value={formData.refundDays}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#2A0066] focus:bg-white transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Number of days eligible for refund (0 = no refund)</p>
                      </div>
                    </div>

                    {/* Trainer Guided Course */}
                    <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="isTrainerGuided"
                        name="isTrainerGuided"
                        checked={formData.isTrainerGuided}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, isTrainerGuided: e.target.checked }))
                        }
                        className="w-5 h-5 mt-0.5 rounded text-[#2A0066] focus:ring-[#2A0066] cursor-pointer"
                      />
                      <label htmlFor="isTrainerGuided" className="cursor-pointer select-none">
                        <p className="text-xs font-bold text-slate-900">Trainer Guided Course</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Check this if the course includes personal trainer guidance and speaking practice sessions.
                        </p>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Course Cover Image <span className="text-rose-500">*</span>
                      </label>
                      {!imagePreview ? (
                        <label
                          htmlFor="coverImage"
                          className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[#2A0066] hover:bg-purple-50/30 transition-all"
                        >
                          <Upload className="text-slate-400 mb-2" size={28} />
                          <p className="text-xs font-bold text-slate-600">Click to upload course cover</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 10MB</p>
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
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-44 bg-slate-100">
                          <img
                            src={imagePreview}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-3 right-3 p-2 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Show on Home Page */}
                    <div className="p-4 bg-purple-50/70 border border-purple-200/90 rounded-2xl flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="showOnHomePage"
                        name="showOnHomePage"
                        checked={formData.showOnHomePage}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, showOnHomePage: e.target.checked }))
                        }
                        className="w-5 h-5 mt-0.5 rounded text-[#2A0066] focus:ring-[#2A0066] cursor-pointer"
                      />
                      <label htmlFor="showOnHomePage" className="cursor-pointer select-none">
                        <p className="text-xs font-bold text-slate-900">Show on Home Page</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          When checked, this course will appear with the exact matching design in the &ldquo;Our Courses&rdquo; section on the website homepage.
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/superadmin/courses')}
                      className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-7 py-3 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#2A0066]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          <span>Creating Course...</span>
                        </>
                      ) : (
                        <span>Publish Course</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Preview Column (5 Cols) */}
              <div className="lg:col-span-5 sticky top-24 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-black uppercase tracking-widest text-[#2A0066] flex items-center gap-1.5">
                    <Eye size={14} /> Live Homepage Card Preview
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Exact Home Page Look
                  </span>
                </div>

                {/* EXACT HOMEPAGE CARD RENDERING */}
                <div className="rounded-[32px] p-7 sm:p-8 bg-gradient-to-b from-purple-50/60 to-white border-2 border-[#2A0066] shadow-xl shadow-[#2A0066]/10 relative transition-all">
                  {/* Badge */}
                  {formData.badge && (
                    <div className="absolute -top-3.5 left-7 px-3.5 py-1 bg-[#2A0066] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                      {formData.badge}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                        {formData.title || 'Course Title Preview'}
                      </h3>
                      {formData.tagline && (
                        <p className="text-xs font-bold text-[#2A0066] mt-2 leading-snug">
                          {formData.tagline}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {formData.description || 'Course overview and practical teaching methodology will be shown here...'}
                    </p>

                    {/* Metrics Pill */}
                    <div className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between text-center gap-2">
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Duration</p>
                        <p className="text-xs font-black text-slate-900">{formData.duration || '30 Days'}</p>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Validity</p>
                        <p className="text-xs font-black text-slate-900">{formData.validity || '6 Months'}</p>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Live Sessions</p>
                        <p className="text-xs font-black text-[#2A0066]">{formData.liveSessions || '5 Live Sessions'}</p>
                      </div>
                    </div>

                    {/* Features List Preview */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Course Features:
                      </p>
                      <ul className="space-y-2">
                        {featureList.slice(0, 6).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 size={14} className="text-[#2A0066] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                        {featureList.length > 6 && (
                          <li className="text-[11px] font-bold text-[#2A0066] pl-5">
                            + {featureList.length - 6} more included features
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 mt-4 border-t border-slate-100 space-y-2.5">
                    <button
                      type="button"
                      className="w-full py-3 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider pointer-events-none opacity-90"
                    >
                      View Course Details
                    </button>
                    <div className="w-full py-3.5 bg-[#2A0066] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#2A0066]/20 flex items-center justify-center gap-1.5 pointer-events-none">
                      <MessageSquare size={14} className="fill-white" />
                      <span>Enroll Now</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Tip:</strong> The live preview matches the design on the homepage and updates automatically as you type.
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-100 shadow-xl space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Course Created Successfully!</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your course has been added to the platform and will appear on the homepage if &ldquo;Show on Home Page&rdquo; was enabled.
              </p>
              <p className="text-xs text-[#2A0066] font-bold">Redirecting to course catalogue...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
