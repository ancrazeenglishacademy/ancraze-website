"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderOpen,
  Upload,
  Link as LinkIcon,
  Search,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
  X,
  ExternalLink,
  Film,
  HardDrive,
  AlertCircle,
  Check,
  ChevronDown,
  Info,
} from "lucide-react";

export interface FirebaseVideoItem {
  name: string;
  fullPath: string;
  folder: string;
  downloadUrl: string;
  size: number;
  contentType: string;
  updated: string;
}

interface FirebaseVideoPickerProps {
  courseId: string;
  currentVideoUrl?: string;
  onVideoSelect: (video: {
    url: string;
    name: string;
    file?: File | null;
    thumbnailFile?: File | null;
    source: "firebase" | "url" | "upload";
    size?: number;
  }) => void;
  onClearVideo: () => void;
  uploadProgress?: number | null;
  uploadStats?: { transferred: number; total: number } | null;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function FirebaseVideoPicker({
  courseId,
  currentVideoUrl = "",
  onVideoSelect,
  onClearVideo,
  uploadProgress = null,
  uploadStats = null,
}: FirebaseVideoPickerProps) {
  // Mode: "firebase" (browse), "url" (paste direct URL/path), "upload" (device)
  const [activeTab, setActiveTab] = useState<"firebase" | "url" | "upload">("firebase");

  // Firebase videos listing
  const [videos, setVideos] = useState<FirebaseVideoItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [consoleUrl, setConsoleUrl] = useState<string>("");
  const [bucketName, setBucketName] = useState<string>("ancrazeenglish.firebasestorage.app");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Selected state
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    name: string;
    size?: number;
    source: "firebase" | "url" | "upload";
  } | null>(() => {
    if (currentVideoUrl) {
      return {
        url: currentVideoUrl,
        name: currentVideoUrl.split("/").pop()?.split("?")[0] || "Current Video",
        source: "url",
      };
    }
    return null;
  });

  // Preview state
  const [previewingVideoUrl, setPreviewingVideoUrl] = useState<string | null>(null);

  // Manual URL / Path input state
  const [manualInput, setManualInput] = useState("");
  const [urlVerified, setUrlVerified] = useState(false);
  const [urlError, setUrlError] = useState("");

  // Device file upload state
  const [deviceFile, setDeviceFile] = useState<File | null>(null);

  // Help info card toggle
  const [showHelperInfo, setShowHelperInfo] = useState(false);

  // Fetch videos from Firebase Storage API
  const fetchVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const res = await fetch("/api/firebase-videos", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        setFolders(data.folders || []);
        if (data.consoleUrl) setConsoleUrl(data.consoleUrl);
        if (data.bucketName) setBucketName(data.bucketName);
        setHasLoadedOnce(true);
      }
    } catch (err) {
      console.error("Error fetching Firebase videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedOnce) {
      fetchVideos();
    }
  }, [hasLoadedOnce, fetchVideos]);

  // Filtered videos based on folder & search query
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesFolder =
        selectedFolder === "all" ||
        v.folder === selectedFolder ||
        (selectedFolder === "course" && v.folder.includes(courseId));

      const matchesSearch =
        !searchQuery.trim() ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.folder.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFolder && matchesSearch;
    });
  }, [videos, selectedFolder, searchQuery, courseId]);

  // Handler when selecting a video from Firebase Storage list
  const handleSelectFirebaseVideo = (video: FirebaseVideoItem) => {
    const sel = {
      url: video.downloadUrl,
      name: video.name,
      size: video.size,
      source: "firebase" as const,
    };
    setSelectedVideo(sel);
    setDeviceFile(null);
    onVideoSelect({
      url: video.downloadUrl,
      name: video.name,
      size: video.size,
      source: "firebase",
    });
  };

  // Handler for manual URL verification & selection
  const handleVerifyManualUrl = () => {
    setUrlError("");
    const trimmed = manualInput.trim();
    if (!trimmed) {
      setUrlError("Please enter a URL or storage file path.");
      return;
    }

    let finalUrl = trimmed;
    let displayName = trimmed.split("/").pop()?.split("?")[0] || "Custom Firebase Video";

    // Format 1: gs://bucket/path
    if (trimmed.startsWith("gs://")) {
      const withoutGs = trimmed.replace("gs://", "");
      const slashIndex = withoutGs.indexOf("/");
      if (slashIndex !== -1) {
        const bName = withoutGs.substring(0, slashIndex);
        const path = withoutGs.substring(slashIndex + 1);
        finalUrl = `https://firebasestorage.googleapis.com/v0/b/${bName}/o/${encodeURIComponent(path)}?alt=media`;
        displayName = path.split("/").pop() || displayName;
      }
    }
    // Format 2: relative path like COURSEFILES/video.mp4 or modules/...
    else if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      finalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(trimmed)}?alt=media`;
      displayName = trimmed.split("/").pop() || displayName;
    }

    setUrlVerified(true);
    const sel = {
      url: finalUrl,
      name: displayName,
      source: "url" as const,
    };
    setSelectedVideo(sel);
    setDeviceFile(null);
    onVideoSelect({
      url: finalUrl,
      name: displayName,
      source: "url",
    });
  };

  // Handler for local device file selection
  const handleDeviceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDeviceFile(file);
      const sel = {
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        source: "upload" as const,
      };
      setSelectedVideo(sel);

      // Generate thumbnail
      let thumbFile: File | null = null;
      try {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.currentTime = 0.1;
        video.onloadeddata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              thumbFile = new File([blob], `thumb_${file.name.split(".")[0]}.jpg`, {
                type: "image/jpeg",
              });
              onVideoSelect({
                url: "",
                name: file.name,
                file,
                thumbnailFile: thumbFile,
                size: file.size,
                source: "upload",
              });
            }
          }, "image/jpeg", 0.75);
        };
      } catch (err) {
        console.warn("Could not generate thumbnail:", err);
      }

      onVideoSelect({
        url: "",
        name: file.name,
        file,
        size: file.size,
        source: "upload",
      });
    }
  };

  // Clear selected video
  const handleClear = () => {
    setSelectedVideo(null);
    setDeviceFile(null);
    setManualInput("");
    setUrlVerified(false);
    setUrlError("");
    setPreviewingVideoUrl(null);
    onClearVideo();
  };

  return (
    <div className="space-y-3">
      {/* Top Bar / Label */}
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          Module Video <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setShowHelperInfo(!showHelperInfo)}
          className="text-[10px] font-black text-[#2A0066] hover:underline flex items-center gap-1 uppercase tracking-wider"
        >
          <Info size={12} />
          {showHelperInfo ? "Hide Firebase Upload Guide" : "Manual Firebase Upload Guide"}
        </button>
      </div>

      {/* Expandable Firebase Upload Guide */}
      {showHelperInfo && (
        <div className="p-4 bg-purple-50/70 border border-purple-200/60 rounded-2xl text-xs space-y-2 text-slate-700 animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-[#2A0066] flex items-center gap-1.5">
              <HardDrive size={15} /> Upload Huge Videos (1GB–10GB) Directly to Firebase
            </div>
            {consoleUrl && (
              <a
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-[#2A0066] text-white text-[10px] font-black rounded-lg hover:bg-purple-900 transition flex items-center gap-1"
              >
                Open Firebase Console <ExternalLink size={10} />
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            To avoid browser timeout on large video files, you can upload your videos directly in
            the Firebase Storage Console. Once uploaded, click the <strong>Refresh</strong> button
            in the video list below to select it instantly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
              <span className="font-bold text-slate-800">Storage Bucket:</span>
              <p className="font-mono text-[10px] text-purple-900 break-all select-all">{bucketName}</p>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
              <span className="font-bold text-slate-800">Suggested Folders:</span>
              <p className="font-mono text-[10px] text-purple-900 select-all">COURSEFILES/ or modules/{courseId}/</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Video Card Preview (if chosen) */}
      {selectedVideo && (
        <div className="p-3.5 bg-gradient-to-r from-purple-50 via-white to-purple-50/40 border-2 border-[#2A0066]/30 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#2A0066] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-[#2A0066]/20">
                <CheckCircle2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2A0066]/10 text-[#2A0066]">
                    {selectedVideo.source === "firebase"
                      ? "From Firebase Storage"
                      : selectedVideo.source === "upload"
                      ? "Device Upload"
                      : "Direct Link"}
                  </span>
                  {selectedVideo.size ? (
                    <span className="text-[10px] font-bold text-slate-400">
                      {formatBytes(selectedVideo.size)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-black text-slate-900 truncate mt-0.5" title={selectedVideo.name}>
                  {selectedVideo.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {selectedVideo.url && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewingVideoUrl(
                      previewingVideoUrl === selectedVideo.url ? null : selectedVideo.url
                    )
                  }
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-[#2A0066] text-[#2A0066] text-[11px] font-bold rounded-xl transition flex items-center gap-1"
                >
                  <Play size={12} />
                  {previewingVideoUrl === selectedVideo.url ? "Hide Preview" : "Preview"}
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition"
                title="Remove selected video"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Inline Video Preview Player */}
          {previewingVideoUrl && previewingVideoUrl === selectedVideo.url && (
            <div className="mt-3 pt-3 border-t border-purple-100">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
                <video
                  src={previewingVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full max-h-[260px] object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("firebase")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "firebase"
              ? "bg-[#2A0066] text-white shadow-md shadow-[#2A0066]/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FolderOpen size={14} />
          <span>Browse Firebase</span>
          {videos.length > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "firebase" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {videos.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("url")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "url"
              ? "bg-[#2A0066] text-white shadow-md shadow-[#2A0066]/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LinkIcon size={14} />
          <span>Paste URL / Path</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "upload"
              ? "bg-[#2A0066] text-white shadow-md shadow-[#2A0066]/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Upload size={14} />
          <span>Device Upload</span>
        </button>
      </div>

      {/* TAB 1: BROWSE FIREBASE STORAGE */}
      {activeTab === "firebase" && (
        <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
          {/* Controls: Search, Folder Filter, Refresh */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Firebase videos..."
                className="w-full pl-9 pr-8 py-2 bg-white rounded-xl text-xs font-semibold text-slate-800 border border-slate-200 outline-none focus:border-[#2A0066] focus:ring-1 focus:ring-[#2A0066]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Folder Dropdown / Filter */}
            {folders.length > 0 && (
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#2A0066]"
              >
                <option value="all">📁 All Folders ({videos.length})</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    📁 {f} ({videos.filter((v) => v.folder === f).length})
                  </option>
                ))}
              </select>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchVideos}
              disabled={loadingVideos}
              title="Refresh videos from Firebase Storage"
              className="p-2 bg-white border border-slate-200 hover:border-[#2A0066] text-[#2A0066] rounded-xl transition flex items-center justify-center gap-1 text-xs font-bold disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingVideos ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Video List */}
          {loadingVideos ? (
            <div className="py-10 text-center space-y-2">
              <RefreshCw size={22} className="animate-spin mx-auto text-[#2A0066]" />
              <p className="text-xs font-bold text-slate-500">Scanning Firebase Storage...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-8 text-center space-y-2 bg-white rounded-xl border border-dashed border-slate-200">
              <Film size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">
                {videos.length === 0 ? "No videos found in Firebase Storage" : "No videos match your search"}
              </p>
              <p className="text-[11px] text-slate-400">
                Upload videos in the Firebase Console or switch to "Device Upload" tab.
              </p>
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredVideos.map((video) => {
                const isSelected = selectedVideo?.url === video.downloadUrl;
                return (
                  <div
                    key={video.fullPath}
                    onClick={() => handleSelectFirebaseVideo(video)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#2A0066]/10 border-[#2A0066] shadow-sm"
                        : "bg-white border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-[#2A0066] text-white" : "bg-purple-100 text-[#2A0066]"
                        }`}
                      >
                        {isSelected ? <Check size={16} /> : <Film size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={video.name}>
                          {video.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span className="font-bold text-slate-500">{formatBytes(video.size)}</span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{video.folder}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingVideoUrl(
                            previewingVideoUrl === video.downloadUrl ? null : video.downloadUrl
                          );
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-[#2A0066] hover:text-white text-slate-600 rounded-lg transition"
                        title="Preview video"
                      >
                        <Play size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectFirebaseVideo(video)}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition ${
                          isSelected
                            ? "bg-[#2A0066] text-white"
                            : "bg-slate-100 hover:bg-[#2A0066] text-slate-700 hover:text-white"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PASTE FIREBASE URL OR PATH */}
      {activeTab === "url" && (
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Firebase Storage URL or Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value);
                  setUrlVerified(false);
                  setUrlError("");
                }}
                placeholder="e.g. COURSEFILES/video.mp4 or https://firebasestorage.googleapis.com/..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#2A0066] focus:ring-1 focus:ring-[#2A0066]"
              />
              <button
                type="button"
                onClick={handleVerifyManualUrl}
                className="px-4 py-2.5 bg-[#2A0066] hover:bg-purple-900 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>

          {urlError && (
            <p className="text-xs text-red-500 font-bold flex items-center gap-1">
              <AlertCircle size={13} /> {urlError}
            </p>
          )}

          <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-xl border border-slate-200/60">
            <span className="font-bold text-slate-700">Supported formats:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 font-mono text-[10px]">
              <li>Storage path: COURSEFILES/29-Among and Between 2.MP4</li>
              <li>Public Firebase URL: https://firebasestorage.googleapis.com/v0/b/...</li>
              <li>Google Cloud Storage URL: https://storage.googleapis.com/...</li>
              <li>GS URI: gs://ancrazeenglish.firebasestorage.app/COURSEFILES/...</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD FROM DEVICE */}
      {activeTab === "upload" && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-200 hover:border-[#2A0066] rounded-3xl p-6 text-center transition cursor-pointer relative bg-slate-50/50">
            <input
              type="file"
              accept="video/*"
              onChange={handleDeviceFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload size={30} className="mx-auto mb-2 text-[#2A0066]/70" />
            <p className="text-xs font-bold text-slate-700">
              {deviceFile ? deviceFile.name : "Click to select video from your device"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">
              MP4, WebM, MOV • Resumable Upload
            </p>
            {deviceFile && (
              <p className="text-[10px] font-bold text-[#2A0066] mt-1">
                Size: {formatBytes(deviceFile.size)}
              </p>
            )}
          </div>

          {/* Upload Progress Bar (when active) */}
          {uploadProgress !== null && (
            <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden relative shadow-inner border border-slate-200">
              <div
                className="bg-gradient-to-r from-[#2A0066] to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <div className="flex justify-between items-center mt-2 px-1">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                  {uploadStats
                    ? `${(uploadStats.transferred / (1024 * 1024)).toFixed(1)} MB / ${(
                        uploadStats.total /
                        (1024 * 1024)
                      ).toFixed(1)} MB`
                    : "Uploading to Firebase Storage..."}
                </p>
                <p className="text-[11px] font-black text-[#2A0066]">{uploadProgress}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
