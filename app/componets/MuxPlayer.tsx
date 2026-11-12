"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Sparkles,
  Loader,
  AlertCircle,
  RefreshCw,
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

// Helper to reliably load HLS.js from CDN with fallback
function loadHlsScript(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  if ((window as any).Hls) return Promise.resolve((window as any).Hls);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-hls-script="true"]') as HTMLScriptElement;
    if (existing) {
      if ((window as any).Hls) return resolve((window as any).Hls);
      existing.addEventListener("load", () => resolve((window as any).Hls));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
    script.setAttribute("data-hls-script", "true");
    script.async = true;

    script.onload = () => {
      if ((window as any).Hls) {
        resolve((window as any).Hls);
      } else {
        reject(new Error("Hls not found"));
      }
    };

    script.onerror = () => {
      // Fallback CDN if jsdelivr is blocked
      const fallback = document.createElement("script");
      fallback.src = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js";
      fallback.setAttribute("data-hls-script", "true");
      fallback.async = true;
      fallback.onload = () => resolve((window as any).Hls);
      fallback.onerror = reject;
      document.head.appendChild(fallback);
    };

    document.head.appendChild(script);
  });
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
  const effectivePlaybackId = useMemo(() => {
    if (playbackId) return playbackId.trim();
    if (streamUrl && streamUrl.includes("stream.mux.com/")) {
      const match = streamUrl.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)(?:\.m3u8)?/);
      if (match && match[1]) return match[1];
    }
    return null;
  }, [playbackId, streamUrl]);

  const effectiveStreamUrl = useMemo(() => {
    if (effectivePlaybackId) {
      return `https://stream.mux.com/${effectivePlaybackId}.m3u8`;
    }
    return streamUrl || "";
  }, [effectivePlaybackId, streamUrl]);

  const effectivePoster = useMemo(() => {
    if (poster) return poster;
    if (posterUrl) return posterUrl;
    if (effectivePlaybackId) {
      return `https://image.mux.com/${effectivePlaybackId}/thumbnail.jpg?time=1`;
    }
    return "";
  }, [poster, posterUrl, effectivePlaybackId]);

  // Player UI states - NOTE: isBuffering MUST default to false so play button is always clickable!
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
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
    let isDestroyed = false;
    setHasError(false);

    // Safari & iOS support native HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = effectiveStreamUrl;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    } else {
      // Chrome, Edge, Firefox require hls.js
      loadHlsScript()
        .then((Hls) => {
          if (isDestroyed || !videoRef.current) return;
          if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 60,
              maxBufferLength: 30,
            });

            hlsInstance.attachMedia(video);

            hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
              if (!isDestroyed) {
                hlsInstance.loadSource(effectiveStreamUrl);
              }
            });

            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
              if (isDestroyed) return;
              setIsBuffering(false);
              if (autoPlay) {
                video.play().catch(() => {});
              }
            });

            hlsInstance.on(Hls.Events.ERROR, (_event: any, data: any) => {
              console.warn("MuxPlayer HLS event:", data.type, data.details);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("MuxPlayer recovering from network error...");
                    hlsInstance.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("MuxPlayer recovering from media error...");
                    hlsInstance.recoverMediaError();
                    break;
                  default:
                    console.error("Fatal unrecoverable HLS error:", data);
                    hlsInstance.destroy();
                    // Fallback directly to video src
                    video.src = effectiveStreamUrl;
                    setIsBuffering(false);
                    break;
                }
              }
            });
          } else {
            video.src = effectiveStreamUrl;
          }
        })
        .catch((err) => {
          console.warn("HLS.js script load error, falling back to direct video.src:", err);
          if (!isDestroyed && video) {
            video.src = effectiveStreamUrl;
          }
        });
    }

    return () => {
      isDestroyed = true;
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [effectiveStreamUrl, autoPlay]);

  // Handle Controls Visibility Timeout
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

    if (video.paused || video.ended) {
      setIsBuffering(true);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            console.warn("Playback interrupted or blocked by browser:", err);
            setIsBuffering(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      setIsBuffering(false);
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
    if (!video || !duration) return;
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
      className={`relative group bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl select-none aspect-video ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={effectivePoster}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
        onClick={togglePlay}
        onPlay={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onPause={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
        onWaiting={() => {
          if (isPlaying) setIsBuffering(true);
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video && video.duration) {
            setDuration(video.duration);
          }
          setIsBuffering(false);
        }}
        onLoadedData={() => setIsBuffering(false)}
        onError={() => {
          setIsBuffering(false);
          setHasError(true);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsBuffering(false);
          onEnded?.();
        }}
        onTimeUpdate={() => {
          const video = videoRef.current;
          if (video) {
            setCurrentTime(video.currentTime);
            onTimeUpdate?.(video.currentTime, video.duration || 0);
          }
        }}
        className="w-full h-full object-contain cursor-pointer bg-black"
      />

      {/* Buffering Spinner: ONLY shown when video is actively attempting to play */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
          <div className="p-3.5 bg-black/70 rounded-full backdrop-blur-md shadow-xl border border-white/10">
            <Loader size={34} className="text-[#A855F7] animate-spin" />
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white p-4 z-20">
          <AlertCircle size={36} className="text-rose-400 mb-2" />
          <p className="text-xs font-bold">Unable to load Mux stream</p>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center">
            The video may still be encoding on Mux or your network is reconnecting.
          </p>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              const video = videoRef.current;
              if (video) video.load();
            }}
            className="mt-3 px-3 py-1.5 bg-[#2A0066] hover:bg-[#3d0099] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Large Center Play Button when Paused - ALWAYS visible & clickable when not playing! */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/10 cursor-pointer transition-all z-10 group/center"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-tr from-[#2A0066] to-[#7928CA] hover:from-[#3D0099] hover:to-[#9333EA] rounded-full flex items-center justify-center shadow-2xl shadow-[#2A0066]/70 border border-white/30 transform group-hover/center:scale-110 active:scale-95 transition duration-300">
            <Play size={32} className="text-white fill-white ml-1.5 drop-shadow" />
          </div>
        </div>
      )}

      {/* Top Bar with Title and Mux badge */}
      <div
        className={`absolute top-0 left-0 right-0 p-3.5 sm:p-4 flex items-center justify-between text-white transition-opacity duration-300 z-10 bg-gradient-to-b from-black/70 to-transparent ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 max-w-[75%]">
          <span className="p-1 bg-[#2A0066]/90 border border-purple-400/30 rounded-lg text-purple-300 flex-shrink-0">
            <Sparkles size={13} />
          </span>
          <span className="text-xs sm:text-sm font-bold truncate drop-shadow">
            {title || "Lesson Video Stream"}
          </span>
        </div>

        {effectivePlaybackId && (
          <span className="px-2 py-0.5 bg-black/60 border border-purple-500/30 rounded-full text-[9px] font-black uppercase tracking-wider text-purple-300 backdrop-blur-md">
            Mux HLS
          </span>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex flex-col gap-2 transition-opacity duration-300 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent ${
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
            className="w-full h-1.5 hover:h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#A855F7] transition-all"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white ml-0.5" />}
            </button>

            {/* Skip Back 10s */}
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer text-slate-300 hover:text-white"
              title="Skip back 10s"
            >
              <RotateCcw size={16} />
            </button>

            {/* Skip Forward 10s */}
            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer text-slate-300 hover:text-white"
              title="Skip forward 10s"
            >
              <RotateCw size={16} />
            </button>

            {/* Volume & Slider */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#A855F7] hidden sm:block"
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
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-0.5 hover:bg-white/15 rounded-lg text-xs font-mono font-bold transition cursor-pointer text-slate-200"
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 bg-slate-900/95 border border-white/10 rounded-2xl p-1 shadow-2xl backdrop-blur-xl flex flex-col gap-0.5 min-w-[70px] z-30">
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedChange(s)}
                      className={`px-3 py-1 text-xs font-mono rounded-xl text-left transition ${
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
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
