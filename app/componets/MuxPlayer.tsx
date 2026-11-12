"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  Loader,
} from "lucide-react";

interface MuxPlayerProps {
  playbackId?: string;
  streamUrl?: string;
  poster?: string;
  posterUrl?: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export default function MuxPlayer({
  playbackId,
  streamUrl,
  poster,
  posterUrl,
  title,
  autoPlay = false,
  className = "",
  onEnded,
  onTimeUpdate,
}: MuxPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive effective playbackId and stream source
  const effectivePlaybackId = React.useMemo(() => {
    if (playbackId) return playbackId;
    if (streamUrl && streamUrl.includes("stream.mux.com/")) {
      const match = streamUrl.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)(?:\.m3u8)?/);
      if (match && match[1]) return match[1];
    }
    return null;
  }, [playbackId, streamUrl]);

  const effectiveStreamUrl = React.useMemo(() => {
    if (effectivePlaybackId) {
      return `https://stream.mux.com/${effectivePlaybackId}.m3u8`;
    }
    return streamUrl || "";
  }, [effectivePlaybackId, streamUrl]);

  const effectivePoster = React.useMemo(() => {
    if (poster) return poster;
    if (posterUrl) return posterUrl;
    if (effectivePlaybackId) {
      return `https://image.mux.com/${effectivePlaybackId}/thumbnail.jpg?time=1`;
    }
    return "";
  }, [poster, posterUrl, effectivePlaybackId]);

  // Player UI states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setup HLS or Native playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveStreamUrl) return;

    let hlsInstance: any = null;
    const isHlsUrl = effectiveStreamUrl.includes(".m3u8");

    // Check native HLS support (Safari, iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = effectiveStreamUrl;
    } else if (isHlsUrl && typeof window !== "undefined") {
      // Dynamic load hls.js from CDN if not already loaded
      const attachHls = () => {
        const Hls = (window as any).Hls;
        if (Hls && Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsInstance.loadSource(effectiveStreamUrl);
          hlsInstance.attachMedia(video);
        } else {
          // Fallback to direct src
          video.src = effectiveStreamUrl;
        }
      };

      if ((window as any).Hls) {
        attachHls();
      } else {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js";
        script.async = true;
        script.onload = attachHls;
        document.head.appendChild(script);
      }
    } else {
      // Standard MP4 or video format fallback
      video.src = effectiveStreamUrl;
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [effectiveStreamUrl]);

  // Handle Controls Timeout
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 2800);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    video.muted = val === 0;
    setIsMuted(val === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const targetTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), duration);
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative group bg-black rounded-3xl overflow-hidden shadow-2xl select-none aspect-video ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={effectivePoster}
        autoPlay={autoPlay}
        playsInline
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onTimeUpdate={() => {
          const video = videoRef.current;
          if (video) {
            setCurrentTime(video.currentTime);
            onTimeUpdate?.(video.currentTime, video.duration || 0);
          }
        }}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) setDuration(video.duration || 0);
        }}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="p-4 bg-black/60 rounded-full backdrop-blur-md">
            <Loader size={36} className="text-[#A855F7] animate-spin" />
          </div>
        </div>
      )}

      {/* Large Center Play Button when Paused */}
      {!isPlaying && !isBuffering && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer transition-opacity"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-tr from-[#2A0066] to-[#7928CA] rounded-full flex items-center justify-center shadow-2xl shadow-[#2A0066]/60 border border-white/20 transform hover:scale-110 active:scale-95 transition duration-300">
            <Play size={32} className="text-white fill-white ml-1.5" />
          </div>
        </div>
      )}

      {/* Gradient Overlay for Controls */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Top Bar with Title and Mux badge */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between text-white transition-opacity duration-300 z-10 ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 max-w-[80%]">
          <span className="p-1 bg-[#2A0066]/80 border border-purple-400/30 rounded-lg text-purple-300 flex-shrink-0">
            <Sparkles size={14} />
          </span>
          <span className="text-xs sm:text-sm font-black truncate drop-shadow-md">
            {title || "Lesson Video Stream"}
          </span>
        </div>

        {effectivePlaybackId && (
          <span className="px-2.5 py-0.5 bg-black/50 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-purple-300 backdrop-blur-md">
            Mux HD HLS
          </span>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-5 flex flex-col gap-2.5 transition-opacity duration-300 z-10 ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber / Progress Bar */}
        <div className="relative group/scrub flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full appearance-none cursor-pointer accent-[#A855F7] transition-all"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/15 rounded-xl transition cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause size={19} className="fill-white" /> : <Play size={19} className="fill-white ml-0.5" />}
            </button>

            {/* Skip Back 10s */}
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 hover:bg-white/15 rounded-xl transition cursor-pointer text-slate-300 hover:text-white"
              title="Skip back 10s"
            >
              <RotateCcw size={17} />
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => handleSkip(10)}
              className="p-2 hover:bg-white/15 rounded-xl transition cursor-pointer text-slate-300 hover:text-white"
              title="Skip forward 10s"
            >
              <RotateCw size={17} />
            </button>

            {/* Volume & Slider */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/15 rounded-xl transition cursor-pointer"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#A855F7] hidden sm:block"
              />
            </div>

            {/* Time Indicator */}
            <span className="text-[11px] font-mono font-bold text-slate-300 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1 hover:bg-white/15 rounded-xl text-xs font-mono font-bold transition cursor-pointer text-slate-200"
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-10 right-0 bg-[#180036]/95 border border-white/10 rounded-2xl p-1 shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[70px] z-20">
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-xl text-left transition ${
                        playbackSpeed === s ? "bg-[#2A0066] text-white font-black" : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/15 rounded-xl transition cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
