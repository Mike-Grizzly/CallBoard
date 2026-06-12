"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { VideoProvider } from "@/features/videos/constants";

/**
 * Imperative API the notes panel uses to drive playback (seek to a note's
 * timestamp, capture the current time when pinning a note, change speed).
 * `getCurrentTime` is async so YouTube (sync) and Vimeo (promise-based) share
 * one shape.
 */
export type PlayerHandle = {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => Promise<number>;
  setPlaybackRate: (rate: number) => void;
};

type Props = {
  provider: VideoProvider;
  videoId: string;
  embedHash: string | null;
  /** Fires once the player reports its runtime (seconds). */
  onReady?: (durationSeconds: number) => void;
};

// ---- Minimal structural types for the two third-party players. We load both
// SDKs from a <script> tag rather than adding an npm dependency. ----

type YTPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: (e: { target: YTPlayer }) => void };
    },
  ) => YTPlayer;
};

type VimeoPlayer = {
  getDuration: () => Promise<number>;
  getCurrentTime: () => Promise<number>;
  setCurrentTime: (seconds: number) => Promise<number>;
  setPlaybackRate: (rate: number) => Promise<number>;
  ready: () => Promise<void>;
  destroy: () => Promise<void>;
};

type VimeoNamespace = {
  Player: new (
    el: HTMLElement,
    opts: { id: string; h?: string; responsive?: boolean },
  ) => VimeoPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: { Player: VimeoNamespace["Player"] };
  }
}

/** Inject a script once (keyed by id) and resolve when it has loaded. */
function loadScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject());
      }
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    s.addEventListener("load", () => {
      s.dataset.loaded = "1";
      resolve();
    });
    s.addEventListener("error", () => reject());
    document.body.appendChild(s);
  });
}

/** Resolve the YouTube IFrame API, chaining the global ready callback so
 *  multiple players on a page don't clobber each other. */
function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    void loadScript("yt-iframe-api", "https://www.youtube.com/iframe_api");
  });
}

function loadVimeo(): Promise<VimeoNamespace> {
  if (window.Vimeo?.Player) {
    return Promise.resolve({ Player: window.Vimeo.Player });
  }
  return loadScript("vimeo-player-api", "https://player.vimeo.com/api/player.js").then(
    () => {
      if (!window.Vimeo) throw new Error("Vimeo SDK failed to load");
      return { Player: window.Vimeo.Player };
    },
  );
}

export const VideoPlayer = forwardRef<PlayerHandle, Props>(function VideoPlayer(
  { provider, videoId, embedHash, onReady },
  ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const ytRef = useRef<YTPlayer | null>(null);
  const vimeoRef = useRef<VimeoPlayer | null>(null);

  // Keep the latest onReady without making it an effect dependency — otherwise
  // a new callback identity each render would needlessly rebuild the player.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      ytRef.current?.seekTo(seconds, true);
      void vimeoRef.current?.setCurrentTime(seconds);
    },
    async getCurrentTime() {
      if (ytRef.current) return ytRef.current.getCurrentTime();
      if (vimeoRef.current) return vimeoRef.current.getCurrentTime();
      return 0;
    },
    setPlaybackRate(rate: number) {
      ytRef.current?.setPlaybackRate(rate);
      void vimeoRef.current?.setPlaybackRate(rate);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    if (!mount) return;

    // Fresh element for the SDK to take over (so re-mounts/strict-mode don't
    // stack iframes).
    mount.innerHTML = "";
    const host = document.createElement("div");
    host.style.width = "100%";
    host.style.height = "100%";
    mount.appendChild(host);

    if (provider === "youtube") {
      void loadYouTube().then((YT) => {
        if (cancelled) return;
        ytRef.current = new YT.Player(host, {
          videoId,
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              const d = e.target.getDuration();
              if (d > 0) onReadyRef.current?.(d);
            },
          },
        });
      });
    } else {
      void loadVimeo().then(({ Player }) => {
        if (cancelled) return;
        const player = new Player(host, {
          id: videoId,
          ...(embedHash ? { h: embedHash } : {}),
          responsive: true,
        });
        vimeoRef.current = player;
        void player.ready().then(() =>
          player.getDuration().then((d) => {
            if (!cancelled && d > 0) onReadyRef.current?.(d);
          }),
        );
      });
    }

    return () => {
      cancelled = true;
      try {
        ytRef.current?.destroy();
      } catch {
        /* player may not be initialised yet */
      }
      void vimeoRef.current?.destroy().catch(() => {});
      ytRef.current = null;
      vimeoRef.current = null;
    };
    // Rebuild the player whenever the selected video changes.
  }, [provider, videoId, embedHash]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
});
