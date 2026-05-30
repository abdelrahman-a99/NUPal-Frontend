"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FrameScores,
  scorePoseFrame,
} from "@/lib/interview/bodyLanguage";

const POSE_CDN_VER = "0.5.1675469404";

type PoseTrackerFromStreamProps = {
  /** Shared camera+mic stream from parent — parent stops tracks on cleanup */
  stream: MediaStream | null;
  active: boolean;
  onSamplesChange: (samples: FrameScores[]) => void;
};

const THROTTLE_FRAMES = 4;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

type PoseInstance = {
  setOptions: (o: Record<string, unknown>) => void;
  onResults: (
    cb: (r: {
      poseLandmarks?: { x: number; y: number; z?: number; visibility?: number }[];
    }) => void
  ) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
};

export default function PoseTrackerFromStream({
  stream,
  active,
  onSamplesChange,
}: PoseTrackerFromStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const samplesRef = useRef<FrameScores[]>([]);
  const frameCountRef = useRef(0);
  const poseRef = useRef<PoseInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "live">("idle");

  const flushSamples = useCallback(() => {
    onSamplesChange([...samplesRef.current]);
  }, [onSamplesChange]);

  useEffect(() => {
    if (!active || !stream?.getVideoTracks().length) {
      setStatus("idle");
      setError(null);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      poseRef.current?.close();
      poseRef.current = null;
      const v = videoRef.current;
      if (v) v.srcObject = null;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    samplesRef.current = [];
    frameCountRef.current = 0;
    flushSamples();

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {});

    const run = async () => {
      setError(null);
      setStatus("starting");
      try {
        await loadScript(
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${POSE_CDN_VER}/pose.js`
        );
        if (cancelled) return;

        const Pose = (window as unknown as { Pose: new (o: { locateFile: (f: string) => string }) => PoseInstance }).Pose;
        if (!Pose) throw new Error("Pose not available");

        const pose = new Pose({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${POSE_CDN_VER}/${file}`,
        });
        pose.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
          if (cancelled || !results.poseLandmarks?.length) return;
          frameCountRef.current += 1;
          if (frameCountRef.current % THROTTLE_FRAMES !== 0) return;
          const scored = scorePoseFrame(results.poseLandmarks);
          if (scored) {
            samplesRef.current.push(scored);
            if (samplesRef.current.length % 10 === 0) flushSamples();
          }
        });

        poseRef.current = pose;

        const tick = async () => {
          if (cancelled) return;
          if (poseRef.current && video.readyState >= 2) {
            try {
              await poseRef.current.send({ image: video });
            } catch {
              /* frame drop */
            }
          }
          rafRef.current = requestAnimationFrame(() => void tick());
        };
        tick();
        if (!cancelled) setStatus("live");
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Pose tracking failed"
          );
          setStatus("idle");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      poseRef.current?.close();
      poseRef.current = null;
      video.srcObject = null;
      flushSamples();
    };
  }, [active, stream, flushSamples]);

  if (!active || !stream?.getVideoTracks().length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-inner">
      <video
        ref={videoRef}
        className="aspect-video w-full object-cover opacity-90"
        playsInline
        muted
        autoPlay
      />
      <div className="flex items-center justify-between gap-2 border-t border-slate-700 px-3 py-2 text-xs text-slate-200">
        <span>
          {error
            ? error
            : status === "live"
              ? "You on camera — posture tracked with voice"
              : "Starting pose…"}
        </span>
        {status === "live" && (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
            Live
          </span>
        )}
      </div>
    </div>
  );
}
