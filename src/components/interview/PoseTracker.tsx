"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FrameScores,
  scorePoseFrame,
} from "@/lib/interview/bodyLanguage";

const POSE_CDN_VER = "0.5.1675469404";
const CAMERA_CDN_VER = "0.3.1675466862";

type PoseTrackerProps = {
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

/** Globals registered by MediaPipe UMD builds */
type MediaPipeGlobals = {
  Pose: new (options: { locateFile: (file: string) => string }) => {
    setOptions: (o: Record<string, unknown>) => void;
    onResults: (
      cb: (r: {
        poseLandmarks?: { x: number; y: number; z?: number; visibility?: number }[];
      }) => void
    ) => void;
    send: (input: { image: HTMLVideoElement }) => Promise<void>;
    close: () => void;
  };
  Camera: new (
    video: HTMLVideoElement,
    options: {
      onFrame: () => Promise<void>;
      width: number;
      height: number;
    }
  ) => {
    start: () => Promise<void>;
    stop: () => void;
  };
};

async function ensureMediaPipe(): Promise<MediaPipeGlobals> {
  await loadScript(
    `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${CAMERA_CDN_VER}/camera_utils.js`
  );
  await loadScript(
    `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${POSE_CDN_VER}/pose.js`
  );
  const w = window as unknown as MediaPipeGlobals;
  if (!w.Pose || !w.Camera) {
    throw new Error("MediaPipe globals not available after loading scripts");
  }
  return w;
}

export default function PoseTracker({ active, onSamplesChange }: PoseTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const samplesRef = useRef<FrameScores[]>([]);
  const frameCountRef = useRef(0);
  const cameraRef = useRef<{ stop: () => void } | null>(null);
  const poseRef = useRef<{
    close: () => void;
    send: (input: { image: HTMLVideoElement }) => Promise<void>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "live">("idle");

  const flushSamples = useCallback(() => {
    onSamplesChange([...samplesRef.current]);
  }, [onSamplesChange]);

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      setError(null);
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      poseRef.current?.close();
      poseRef.current = null;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    samplesRef.current = [];
    frameCountRef.current = 0;
    flushSamples();

    const run = async () => {
      setError(null);
      setStatus("starting");
      try {
        const { Pose, Camera } = await ensureMediaPipe();
        if (cancelled) return;

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

        const camera = new Camera(video, {
          onFrame: async () => {
            if (cancelled || !poseRef.current) return;
            await poseRef.current.send({ image: video });
          },
          width: 480,
          height: 360,
        });
        cameraRef.current = camera;
        await camera.start();
        if (!cancelled) setStatus("live");
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not start camera / pose"
          );
          setStatus("idle");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      poseRef.current?.close();
      poseRef.current = null;
      
      // Stop the hardware camera tracks to turn off the green light
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      flushSamples();
    };
  }, [active, flushSamples]);

  useEffect(() => {
    if (!active) flushSamples();
  }, [active, flushSamples]);

  if (!active) return null;

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
              ? "Pose tracking on (shoulders & facing)"
              : "Starting camera…"}
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
