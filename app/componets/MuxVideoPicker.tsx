"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Upload,
  Film,
  Search,
  RefreshCw,
  CheckCircle2,
  X,
  Play,
  Sparkles,
  Link as LinkIcon,
  HardDrive,
  AlertCircle,
  Loader,
  Clock,
  Layers,
} from "lucide-react";
import MuxPlayer from "./MuxPlayer";

export interface MuxVideoItem {
  id: string; // asset ID
  status: "preparing" | "ready" | "errored";
  duration?: number;
  aspectRatio?: string;
  playbackId?: string | null;
  streamUrl?: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
  passthrough?: string;
}

interface MuxVideoPickerProps {
  courseId?: string;
  currentVideoUrl?: string;
  currentPlaybackId?: string;
  onVideoSelect: (video: {
    url: string;
    playbackId: string;
    assetId?: string;
    thumbnailUrl?: string;
    duration?: string;
    name: string;
    source: "mux_upload" | "mux_library" | "mux_id" | "legacy_url";
    size?: number;
  }) => void;
  onClearVideo: () => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MuxVideoPicker({
  courseId,
  currentVideoUrl = "",
  currentPlaybackId = "",
  onVideoSelect,
  onClearVideo,
}: MuxVideoPickerProps) {
  // Tab modes: "upload" (direct to Mux), "library" (browse Mux assets), "id" (paste playbackId / URL)
  const [activeTab, setActiveTab] = useState<"upload" | "library" | "id">("upload");

  // Direct Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Mux Library State
  const [assets, setAssets] = useState<MuxVideoItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadedLibrary, setHasLoadedLibrary] = useState(false);

  // Manual Input State
  const [manualInput, setManualInput] = useState("");

  // Current Selection
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    playbackId: string;
    assetId?: string;
    thumbnailUrl?: string;
    name: string;
    duration?: string;
    source: "mux_upload" | "mux_library" | "mux_id" | "legacy_url";
  } | null>(() => {
    if (currentPlaybackId) {
      return {
        url: `https://stream.mux.com/${currentPlaybackId}.m3u8`,
        playbackId: currentPlaybackId,
        thumbnailUrl: `https://image.mux.com/${currentPlaybackId}/thumbnail.jpg`,
        name: `Mux Video (${currentPlaybackId})`,
        source: "mux_id",
      };
    }
    if (currentVideoUrl) {
      const match = currentVideoUrl.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)/);
      const pbId = match ? match[1] : "";
      return {
        url: currentVideoUrl,
        playbackId: pbId,
        thumbnailUrl: pbId ? `https://image.mux.com/${pbId}/thumbnail.jpg` : "",
        name: pbId ? `Mux Video (${pbId})` : "Current Video Stream",
        source: pbId ? "mux_id" : "legacy_url",
      };
    }
    return null;
  });

  // Keep selected video in sync if props change
  useEffect(() => {
    if (currentPlaybackId && (!selectedVideo || selectedVideo.playbackId !== currentPlaybackId)) {
      setSelectedVideo({
        url: `https://stream.mux.com/${currentPlaybackId}.m3u8`,
        playbackId: currentPlaybackId,
        thumbnailUrl: `https://image.mux.com/${currentPlaybackId}/thumbnail.jpg`,
        name: `Mux Video (${currentPlaybackId})`,
        source: "mux_id",
      });
    } else if (!currentPlaybackId && currentVideoUrl && (!selectedVideo || selectedVideo.url !== currentVideoUrl)) {
      const match = currentVideoUrl.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)(?:\.m3u8)?/);
      const pbId = match ? match[1] : "";
      setSelectedVideo({
        url: currentVideoUrl,
        playbackId: pbId,
        thumbnailUrl: pbId ? `https://image.mux.com/${pbId}/thumbnail.jpg` : "",
        name: pbId ? `Mux Video (${pbId})` : "Current Video Stream",
        source: pbId ? "mux_id" : "legacy_url",
      });
    }
  }, [currentPlaybackId, currentVideoUrl]);

  // Fetch Mux Library
  const fetchMuxAssets = useCallback(async () => {
    try {
      setLoadingAssets(true);
      const res = await fetch("/api/mux/assets", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setHasLoadedLibrary(true);
      }
    } catch (err) {
      console.error("Failed to fetch Mux assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "library" && !hasLoadedLibrary) {
      fetchMuxAssets();
    }
  }, [activeTab, hasLoadedLibrary, fetchMuxAssets]);

  // Handle File Drag & Selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  // Direct Upload to Mux using Mux Direct Upload Endpoint
  const handleStartMuxUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadStatusText("Requesting Mux direct upload slot...");

      // 1. Get Direct Upload URL from backend
      const createRes = await fetch("/api/mux/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
        },
        body: JSON.stringify({
          passthrough: JSON.stringify({ courseId: courseId || "general", name: selectedFile.name }),
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || "Failed to create Mux direct upload session");
      }

      const { upload } = await createRes.json();
      const uploadUrl = upload.url;
      const uploadId = upload.id;

      setUploadStatusText("Uploading directly to Mux streaming engine...");

      // 2. Upload file via PUT to Mux uploadUrl with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Mux upload returned status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during direct Mux upload"));
        xhr.send(selectedFile);
      });

      setUploadProgress(100);
      setUploadStatusText("Transcoding into adaptive HLS streams on Mux...");

      // 3. Poll for Mux Asset & Playback ID
      let resolvedPlaybackId = "";
      let resolvedAssetId = "";
      let resolvedDuration = "";
      let attempts = 0;

      while (!resolvedPlaybackId && attempts < 25) {
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const checkRes = await fetch(`/api/mux/upload?uploadId=${uploadId}`, {
            headers: {
              "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY || "",
            },
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.playbackId) {
              resolvedPlaybackId = checkData.playbackId;
              resolvedAssetId = checkData.asset?.id || checkData.upload?.asset_id || "";
              resolvedDuration = formatDuration(checkData.asset?.duration);
              break;
            }
          }
        } catch {
          // continue polling
        }
      }

      if (!resolvedPlaybackId) {
        throw new Error(
          "Upload received by Mux, but transcoding is still preparing. Check the Mux library tab in a moment."
        );
      }

      const newVideo = {
        url: `https://stream.mux.com/${resolvedPlaybackId}.m3u8`,
        playbackId: resolvedPlaybackId,
        assetId: resolvedAssetId,
        thumbnailUrl: `https://image.mux.com/${resolvedPlaybackId}/thumbnail.jpg`,
        duration: resolvedDuration,
        name: selectedFile.name,
        source: "mux_upload" as const,
        size: selectedFile.size,
      };

      setSelectedVideo(newVideo);
      onVideoSelect(newVideo);
      setUploadStatusText("Video Ready & Live on Mux!");
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload video to Mux");
    } finally {
      setIsUploading(false);
    }
  };

  // Select an existing Asset from Mux Library
  const handleSelectAsset = (asset: MuxVideoItem) => {
    if (!asset.playbackId) {
      alert("This video is still preparing on Mux. Please wait a few moments.");
      return;
    }

    const item = {
      url: `https://stream.mux.com/${asset.playbackId}.m3u8`,
      playbackId: asset.playbackId,
      assetId: asset.id,
      thumbnailUrl: `https://image.mux.com/${asset.playbackId}/thumbnail.jpg`,
      duration: formatDuration(asset.duration),
      name: asset.passthrough || `Mux Asset ${asset.id.slice(0, 8)}`,
      source: "mux_library" as const,
    };

    setSelectedVideo(item);
    onVideoSelect(item);
  };

  // Handle Manual Playback ID or Stream URL
  const handleApplyManualInput = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;

    let pbId = trimmed;
    let streamUrl = trimmed;

    if (trimmed.includes("stream.mux.com/")) {
      const match = trimmed.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        pbId = match[1];
        streamUrl = `https://stream.mux.com/${pbId}.m3u8`;
      }
    } else if (!trimmed.includes("/") && !trimmed.includes(".")) {
      // Looks like a direct Playback ID
      pbId = trimmed;
      streamUrl = `https://stream.mux.com/${pbId}.m3u8`;
    }

    const item = {
      url: streamUrl,
      playbackId: pbId,
      thumbnailUrl: pbId ? `https://image.mux.com/${pbId}/thumbnail.jpg` : "",
      name: `Mux Video (${pbId})`,
      source: "mux_id" as const,
    };

    setSelectedVideo(item);
    onVideoSelect(item);
    setManualInput("");
  };

  const handleClear = () => {
    setSelectedVideo(null);
    setSelectedFile(null);
    onClearVideo();
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.playbackId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.passthrough?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Selected Video Card Preview */}
      {selectedVideo && (
        <div className="p-4 bg-gradient-to-r from-purple-900/10 via-[#2A0066]/10 to-indigo-900/10 rounded-2xl border border-purple-200/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#2A0066] text-white rounded-lg">
                <Sparkles size={14} />
              </span>
              <div>
                <p className="text-xs font-black text-slate-900 truncate max-w-xs sm:max-w-md">
                  {selectedVideo.name}
                </p>
                <p className="text-[10px] text-purple-700 font-bold font-mono">
                  Mux Playback ID: {selectedVideo.playbackId || "HLS Stream"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition"
              title="Remove Video"
            >
              <X size={16} />
            </button>
          </div>

          {/* Embedded Mux Video Player Preview */}
          <div className="w-full max-w-lg mx-auto overflow-hidden rounded-2xl shadow-md">
            <MuxPlayer
              playbackId={selectedVideo.playbackId}
              streamUrl={selectedVideo.url}
              title={selectedVideo.name}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === "upload"
              ? "bg-white text-[#2A0066] shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Upload size={14} /> Direct Upload to Mux
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === "library"
              ? "bg-white text-[#2A0066] shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Film size={14} /> Mux Video Library
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("id")}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === "id"
              ? "bg-white text-[#2A0066] shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <LinkIcon size={14} /> Playback ID / Stream URL
        </button>
      </div>

      {/* TAB 1: DIRECT UPLOAD TO MUX */}
      {activeTab === "upload" && (
        <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4">
          <input
            type="file"
            id="mux-video-file-input"
            accept="video/*"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />

          {!selectedFile ? (
            <label
              htmlFor="mux-video-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-4"
            >
              <div className="p-3 bg-[#2A0066]/10 text-[#2A0066] rounded-2xl">
                <Upload size={28} />
              </div>
              <p className="text-xs font-black text-slate-800">
                Click to browse video file or drag and drop
              </p>
              <p className="text-[11px] text-slate-400">
                MP4, MOV, WEBM, MKV up to high bitrate 4K (transcoded automatically by Mux)
              </p>
            </label>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-[#2A0066]/10 text-[#2A0066] rounded-xl flex-shrink-0">
                    <Film size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{uploadStatusText}</span>
                    <span className="font-mono text-[#2A0066]">{uploadProgress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-[#2A0066] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 text-left">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {!isUploading && (
                <button
                  type="button"
                  onClick={handleStartMuxUpload}
                  className="w-full py-3 bg-[#2A0066] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={15} /> Upload & Process with Mux
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MUX ASSET LIBRARY */}
      {activeTab === "library" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search videos by asset ID, playback ID, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#2A0066]"
              />
            </div>

            <button
              type="button"
              onClick={fetchMuxAssets}
              disabled={loadingAssets}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
              title="Refresh Mux Library"
            >
              <RefreshCw size={15} className={loadingAssets ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {loadingAssets ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader size={20} className="animate-spin text-[#2A0066]" />
                <span className="text-xs font-bold">Connecting to Mux Video assets...</span>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">
                No videos found in your Mux account. Upload one in the "Direct Upload" tab.
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className={`p-3 bg-white hover:bg-purple-50/50 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    selectedVideo?.playbackId === asset.playbackId
                      ? "border-[#2A0066] ring-1 ring-[#2A0066]"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-9 bg-slate-900 rounded-lg overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Film size={16} className="text-slate-500" />
                      )}
                      <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-white bg-black/60 px-1 rounded">
                        {formatDuration(asset.duration)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {asset.passthrough || `Asset ${asset.id.slice(0, 8)}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Playback ID: {asset.playbackId || "Preparing..."}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      asset.status === "ready"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PLAYBACK ID OR STREAM URL INPUT */}
      {activeTab === "id" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Paste a Mux Playback ID or HLS stream URL (`https://stream.mux.com/[PLAYBACK_ID].m3u8`):
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. DS00Spx1CV902MCtPjdNaWwyOCoRDU2Oh"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#2A0066]"
            />
            <button
              type="button"
              onClick={handleApplyManualInput}
              className="px-4 py-2.5 bg-[#2A0066] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-95 transition"
            >
              Apply Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

