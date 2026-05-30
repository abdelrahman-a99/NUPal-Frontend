"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Clock,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Signal,
  Volume2,
  Video,
  User,
  MoreHorizontal,
  MessageSquare,
  Sparkles,
  Smile,
  ShieldCheck,
  Eye,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getToken } from "@/lib/auth";

import Button from "@/components/ui/Button";
import InterviewFeedbackReport, {
  type InterviewFeedback,
} from "@/components/interview/InterviewFeedbackReport";
import { InterviewFeedbackSkeleton } from "@/components/interview/InterviewFeedbackSkeleton";
import { VOICE_STORAGE_KEY as STORAGE_KEY } from "@/components/interview/InterviewPracticeSession";
import {
  aggregateSamples,
  type FrameScores,
} from "@/lib/interview/bodyLanguage";

const PoseTrackerFromStream = dynamic(
  () => import("@/components/interview/PoseTrackerFromStream"),
  { ssr: false, loading: () => null }
);
import { careerServicesApiUrl } from "@/config/careerApi";

const CAREER_INTERVIEW_SETUP = "/career-hub?tab=interview-prep";

/** Safe parsing to catch empty/missing JSON bodies from proxies */
async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}


export type VoiceFormData = {
  topic: string;
  difficulty: string;
  interviewDuration: number;
  cvText?: string;
  /** Default true: same stream feeds Deepgram + MediaPipe pose */
  useCamera?: boolean;
  /** From Job Match — tailors the voice agent to this posting */
  jobDescription?: string;
  jobTitle?: string;
  companyName?: string;
};

type TranscriptItem = {
  speaker: "user" | "interviewer";
  text: string;
  timestamp: string;
};

export default function VoiceInterviewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<VoiceFormData | null>(null);
  const [phase, setPhase] = useState<"call" | "feedback" | "report">("call");
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [livePoseStats, setLivePoseStats] = useState({ symmetry: 0, gaze: 0 });
  const poseSamplesRef = useRef<FrameScores[]>([]);

  const formDataRef = useRef<VoiceFormData | null>(null);
  const transcriptRef = useRef<TranscriptItem[]>([]);
  const isMutedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;
  const intentionalCloseRef = useRef(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const currentAudioChunksRef = useRef<ArrayBuffer[]>([]);
  const isCollectingAudioRef = useRef(false);
  const audioChunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeGainNodeRef = useRef<GainNode | null>(null);
  const pendingTextRef = useRef<TranscriptItem[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userSpeakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAgentAudioCompleteRef = useRef(true);
  const timeAgentStartedSpeakingRef = useRef<number | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (phase === "call" && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [transcript, phase]);

  // Silence Timer Smart UX
  useEffect(() => {
    if (phase !== "call") return;
    if (!isUserSpeaking && !isInterviewerSpeaking && isConnected) {
      silenceTimerRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "InjectUserMessage",
              content: "[System Interaction: The user has been silent for 15 seconds. Please gently encourage them to continue or provide a hint depending on what was being asked. Keep your sentence very short and natural.]",
            })
          );
        } else {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: "interviewer",
              text: "Take your time... let me know when you are ready.",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }, 15000);
    } else {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isUserSpeaking, isInterviewerSpeaking, phase, isConnected]);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      router.replace(CAREER_INTERVIEW_SETUP);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as VoiceFormData;
      if (parsed.useCamera === undefined) parsed.useCamera = true;
      setFormData(parsed);
      formDataRef.current = parsed;
    } catch {
      router.replace(CAREER_INTERVIEW_SETUP);
    }
  }, [router]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && isConnected) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : t)), 1000);
    } else if (timeLeft === 0 && isConnected) {
      void endAndReportRef.current?.();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isConnected]);

  const cleanup = useCallback(() => {
    if (audioChunkTimerRef.current) {
      clearTimeout(audioChunkTimerRef.current);
      audioChunkTimerRef.current = null;
    }
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsConnected(false);
    setIsInterviewerSpeaking(false);
    setIsUserSpeaking(false);
    setLiveStream(null);
    setHasVideoTrack(false);
  }, []);

  const pcm16ToFloat32 = (buffer: ArrayBuffer): Float32Array => {
    const int16Array = new Int16Array(buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
  };

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;

    isPlayingRef.current = true;
    setIsInterviewerSpeaking(true);
    if (!timeAgentStartedSpeakingRef.current) {
      timeAgentStartedSpeakingRef.current = Date.now();
    }

    try {
      const audioData = audioQueueRef.current.shift();
      if (!audioData) {
        isPlayingRef.current = false;
        if (isAgentAudioCompleteRef.current) {
          setIsInterviewerSpeaking(false);
          timeAgentStartedSpeakingRef.current = null;
          if (pendingTextRef.current.length > 0) {
            const textsToFlush = [...pendingTextRef.current];
            setTranscript((prev) => [...prev, ...textsToFlush]);
            pendingTextRef.current = [];
          }
        }
        return;
      }

      let pcmData: ArrayBuffer;
      const view = new DataView(audioData);
      if (
        audioData.byteLength > 44 &&
        view.getUint32(0, false) === 0x52494646
      ) {
        pcmData = audioData.slice(44);
      } else {
        pcmData = audioData;
      }

      const float32Data = pcm16ToFloat32(pcmData);
      const audioBuffer = ctx.createBuffer(1, float32Data.length, 16000);
      audioBuffer.getChannelData(0).set(float32Data);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1;
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      activeAudioSourceRef.current = source;
      activeGainNodeRef.current = gainNode;
      
      const syncFlush = () => {
         setIsInterviewerSpeaking(false);
         timeAgentStartedSpeakingRef.current = null;
         if (pendingTextRef.current.length > 0) {
           const textsToFlush = [...pendingTextRef.current];
           setTranscript((prev) => [...prev, ...textsToFlush]);
           pendingTextRef.current = [];
         }
      };

      source.onended = () => {
        isPlayingRef.current = false;
        activeAudioSourceRef.current = null;
        activeGainNodeRef.current = null;
        if (audioQueueRef.current.length > 0) {
          void playAudioQueue();
        } else if (isAgentAudioCompleteRef.current) {
          syncFlush();
        } else {
          // Fallback if AgentAudioDone never arrives for this utterance
          setTimeout(() => {
             if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                syncFlush();
             }
          }, 1000);
        }
      };
      source.start(0);
    } catch {
      isPlayingRef.current = false;
      if (audioQueueRef.current.length > 0) {
        setTimeout(() => void playAudioQueue(), 100);
      } else {
        const syncFlush = () => {
           setIsInterviewerSpeaking(false);
           timeAgentStartedSpeakingRef.current = null;
           if (pendingTextRef.current.length > 0) {
             const textsToFlush = [...pendingTextRef.current];
             setTranscript((prev) => [...prev, ...textsToFlush]);
             pendingTextRef.current = [];
           }
        };
        if (isAgentAudioCompleteRef.current) {
          syncFlush();
        } else {
          setTimeout(() => {
             if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                syncFlush();
             }
          }, 1000);
        }
      }
    }
  }, []);

  const processAudioChunks = useCallback(() => {
    if (currentAudioChunksRef.current.length === 0) return;
    const totalSize = currentAudioChunksRef.current.reduce(
      (sum, chunk) => sum + chunk.byteLength,
      0
    );
    const combinedBuffer = new ArrayBuffer(totalSize);
    const combinedView = new Uint8Array(combinedBuffer);
    let offset = 0;
    for (const chunk of currentAudioChunksRef.current) {
      combinedView.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    audioQueueRef.current.push(combinedBuffer);
    currentAudioChunksRef.current = [];
    void playAudioQueue();
  }, [playAudioQueue]);

  const startAudioStream = useCallback(
    (stream: MediaStream) => {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      sourceRef.current = ctx.createMediaStreamSource(stream);
      processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
      sourceRef.current.connect(analyserRef.current!);
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(ctx.destination);

      processorRef.current.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          return;
        if (isMutedRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const outputData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = Math.max(
            -32768,
            Math.min(32767, inputData[i] * 32768)
          );
        }
        wsRef.current.send(outputData.buffer);
      };

      const checkAudioLevel = () => {
        if (!analyserRef.current || !wsRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average);
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();
    },
    []
  );

  const endAndReportRef = useRef<(() => Promise<void>) | null>(null);

  const onPoseSamples = useCallback((samples: FrameScores[]) => {
    poseSamplesRef.current = samples;
    // Update live stats every few frames or on change
    if (samples.length > 0) {
      const agg = aggregateSamples(samples);
      setLivePoseStats({ 
        symmetry: Math.round(agg.avgSymmetry), 
        gaze: Math.round(agg.avgFacing) 
      });
    }
  }, []);

  const endAndReport = useCallback(async () => {
    const lines = transcriptRef.current;
    const fd = formDataRef.current;

    const poseAgg =
      fd?.useCamera !== false && poseSamplesRef.current.length > 0
        ? aggregateSamples(poseSamplesRef.current)
        : undefined;
    const bodyLanguageSummary = poseAgg?.summaryForModel;

    // Mark as intentional so onclose doesn't trigger reconnect
    intentionalCloseRef.current = true;
    const ws = wsRef.current;
    wsRef.current = null;
    ws?.close();
    cleanup();

    if (lines.length > 0 && fd) {
      setLoading(true);
      setPhase("feedback");
      setError(null);
      try {
        const token = getToken();
        const response = await fetch(careerServicesApiUrl("/v1/interview/voice-agent"), {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "feedback",
            formData: fd,
            transcript: lines,
            bodyLanguageSummary,
            bodyLanguageMetrics: poseAgg,
          }),
        });
        const data = await safeJson<any>(response);
        if (!response.ok || !data) {
          throw new Error(data?.error || data?.message || "Feedback failed");
        }
        setFeedback((data.feedback || null) as InterviewFeedback);
        setPhase("report");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Feedback failed");
        setPhase("call");
      } finally {
        setLoading(false);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      router.push(CAREER_INTERVIEW_SETUP);
    }
  }, [cleanup, router]);

  endAndReportRef.current = endAndReport;

  const abandon = useCallback(() => {
    intentionalCloseRef.current = true;
    const ws = wsRef.current;
    wsRef.current = null;
    ws?.close();
    cleanup();
    sessionStorage.removeItem(STORAGE_KEY);
    router.push(CAREER_INTERVIEW_SETUP);
  }, [cleanup, router]);

  const connectToDeepgram = async () => {
    if (!formData) return;
    setError(null);
    setLoading(true);
    setConnectionStatus("connecting");
    poseSamplesRef.current = [];

    try {
      const token = getToken();
      const configRes = await fetch(careerServicesApiUrl("/v1/interview/voice-agent"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "start", formData }),
      });
      const configData = await safeJson<any>(configRes);
      if (!configRes.ok || !configData) {
        throw new Error(configData?.error || "Voice agent config failed");
      }

      const keyRes = await fetch(careerServicesApiUrl("/v1/interview/voice-agent"), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const keyData = await safeJson<any>(keyRes);
      if (!keyRes.ok || !keyData || !keyData.apiKey) {
        throw new Error(keyData?.error || "Deepgram key unavailable");
      }

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      };

      let stream: MediaStream;
      if (formData.useCamera !== false) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: audioConstraints,
          });
          setHasVideoTrack(stream.getVideoTracks().length > 0);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
          });
          setHasVideoTrack(false);
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
        setHasVideoTrack(false);
      }

      mediaStreamRef.current = stream;
      setLiveStream(stream);

      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)({ sampleRate: 16000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const wsUrl = "wss://agent.deepgram.com/v1/agent/converse";
      wsRef.current = new WebSocket(wsUrl, ["token", keyData.apiKey as string]);
      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => {
        retryCountRef.current = 0;
      };

      wsRef.current.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          isAgentAudioCompleteRef.current = false;
          if (!isCollectingAudioRef.current) {
            isCollectingAudioRef.current = true;
            currentAudioChunksRef.current = [];
          }
          currentAudioChunksRef.current.push(event.data);
          if (audioChunkTimerRef.current) {
            clearTimeout(audioChunkTimerRef.current);
          }
          audioChunkTimerRef.current = setTimeout(() => {
            if (currentAudioChunksRef.current.length >= 5) {
              processAudioChunks();
            }
          }, 150);
          return;
        }

        try {
          const data = JSON.parse(event.data as string) as {
            type?: string;
            role?: string;
            content?: string;
          };

          if (data.type === "Welcome" && wsRef.current) {
            wsRef.current.send(JSON.stringify(configData.config));
          }

          if (data.type === "SettingsApplied") {
            setIsConnected(true);
            setConnectionStatus("connected");
            setTimeLeft(formData.interviewDuration * 60);
            setLoading(false);
            startAudioStream(stream);
          }

          if (data.type === "AgentAudioDone") {
            isAgentAudioCompleteRef.current = true;
            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
              setIsInterviewerSpeaking(false);
              if (pendingTextRef.current.length > 0) {
                 const textsToFlush = [...pendingTextRef.current];
                 setTranscript((prev) => [...prev, ...textsToFlush]);
                 pendingTextRef.current = [];
              }
            }
            if (audioChunkTimerRef.current) {
              clearTimeout(audioChunkTimerRef.current);
              audioChunkTimerRef.current = null;
            }
            if (currentAudioChunksRef.current.length > 0) {
              processAudioChunks();
            }
            isCollectingAudioRef.current = false;
          }

          if (data.type === "UserStartedSpeaking") {
            setIsUserSpeaking(true);
            if (userSpeakingTimerRef.current) clearTimeout(userSpeakingTimerRef.current);
            userSpeakingTimerRef.current = setTimeout(() => setIsUserSpeaking(false), 4000);
            
            // INTERRUPT CONTROL: stop AI if user talks, with smooth fade out
            audioQueueRef.current = [];
            if (pendingTextRef.current.length > 0) {
              const spokenMs = timeAgentStartedSpeakingRef.current ? Date.now() - timeAgentStartedSpeakingRef.current : 0;
              let remainingChars = Math.floor((spokenMs / 1000) * 24);
              
              const textsToFlush: TranscriptItem[] = [];
              for (const item of pendingTextRef.current) {
                 if (remainingChars <= 0) {
                    if (textsToFlush.length === 0) {
                       textsToFlush.push({ ...item, text: item.text.slice(0, 3) + "..." });
                    }
                    break;
                 }
                 if (item.text.length > remainingChars + 10) {
                    textsToFlush.push({ ...item, text: item.text.slice(0, Math.max(1, remainingChars)) + "..." });
                    remainingChars = 0;
                 } else {
                    textsToFlush.push(item);
                    remainingChars -= item.text.length;
                 }
              }
              setTranscript((prev) => [...prev, ...textsToFlush]);
            }
            pendingTextRef.current = [];
            timeAgentStartedSpeakingRef.current = null;
            if (activeAudioSourceRef.current && activeGainNodeRef.current && audioContextRef.current) {
               const gain = activeGainNodeRef.current.gain;
               // Smoothly fade out over 200ms
               gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.2);
               const src = activeAudioSourceRef.current;
               setTimeout(() => {
                 try { src.stop(); } catch (e) {}
               }, 250);
               activeAudioSourceRef.current = null;
               activeGainNodeRef.current = null;
            } else if (activeAudioSourceRef.current) {
              activeAudioSourceRef.current.stop();
              activeAudioSourceRef.current = null;
            }
            setIsInterviewerSpeaking(false);
          }
          if (data.type === "UserStoppedSpeaking") {
            setIsUserSpeaking(false);
            if (userSpeakingTimerRef.current) clearTimeout(userSpeakingTimerRef.current);
          }

          if (data.type === "ConversationText" && data.content) {
            setIsUserSpeaking(false); // Clear listening UI since AI is talking
            if (userSpeakingTimerRef.current) clearTimeout(userSpeakingTimerRef.current);
            
            if (data.role === "user") {
              setIsUserSpeaking(true);
              if (userSpeakingTimerRef.current) clearTimeout(userSpeakingTimerRef.current);
              userSpeakingTimerRef.current = setTimeout(() => setIsUserSpeaking(false), 4000);
              
              if (data.content.startsWith("[System")) return;
              
              setTranscript((prev) => [
                ...prev,
                {
                  speaker: "user",
                  text: data.content!,
                  timestamp: new Date().toISOString(),
                },
              ]);
            } else {
              setCurrentQuestion(data.content!);
              // TEXT SYNC: Queue it instead of directly setting transcript
              pendingTextRef.current.push({
                speaker: "interviewer",
                text: data.content!,
                timestamp: new Date().toISOString(),
              });
              
              // Fallback flush to prevent text from being stuck forever if audio doesn't play
              setTimeout(() => {
                if (!isPlayingRef.current && pendingTextRef.current.length > 0) {
                  setTranscript((prev) => {
                    const texts = pendingTextRef.current;
                    if (texts.length === 0) return prev;
                    pendingTextRef.current = [];
                    return [...prev, ...texts];
                  });
                }
              }, 1500);
            }
          }

          if (data.type === "Error") {
            setConnectionStatus("error");
            setError("Agent reported an error");
          }
        } catch {
          /* non-json */
        }
      };

      wsRef.current.onerror = () => {
        // Browsers hide 401 WebSocket errors, but we can handle it generically
        // If it failed before connecting, we'll try to catch it in onclose
        if (connectionStatus === "connected") {
          setConnectionStatus("error");
          setLoading(false);
          setError("WebSocket error");
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus("disconnected");

        // Skip reconnect if the close was intentional (user ended/abandoned session)
        if (intentionalCloseRef.current) {
          intentionalCloseRef.current = false;
          return;
        }

        // Deepgram sends 1008 or 1011 for auth/token issues, or closes abnormally mid-session
        const isUnexpected = event.code === 1008 || event.code === 1011 || event.code !== 1000;
        if (isUnexpected) {
           if (retryCountRef.current < MAX_RETRIES) {
             retryCountRef.current += 1;
             const delay = Math.min(1000 * retryCountRef.current, 8000);
             console.warn(`Connection dropped. Reconnecting... (attempt ${retryCountRef.current})`);
             setError(`Connection dropped. Re-establishing... (attempt ${retryCountRef.current})`);
             setTimeout(() => {
                void connectToDeepgram();
             }, delay);
           } else {
             setError("Could not reconnect. Please restart the session manually.");
             retryCountRef.current = 0;
           }
        }
      };
    } catch (e) {
      setConnectionStatus("error");
      setLoading(false);
      setError(
        e instanceof Error ? e.message : "Microphone or connection failed"
      );
    }
  };

  const toggleMute = () => {
    setIsMuted((m) => {
      const next = !m;
      isMutedRef.current = next;
      mediaStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  };

  if (!formData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (phase === "feedback" || phase === "report") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12 bg-white dark:bg-slate-900 min-h-screen">
        <div className="mb-8">
          <button
            onClick={() => {
              sessionStorage.removeItem(STORAGE_KEY);
              router.push(CAREER_INTERVIEW_SETUP);
            }}
            className="group flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-all duration-300"
          >
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 group-hover:bg-slate-100 border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">Back to Dashboard</span>
          </button>
        </div>
        {phase === "feedback" || !feedback ? (
          <InterviewFeedbackSkeleton />
        ) : (
          <InterviewFeedbackReport
            feedback={feedback}
            cameraEnabled={formData?.useCamera !== false}
            onNewSession={() => {
              sessionStorage.removeItem(STORAGE_KEY);
              router.push(CAREER_INTERVIEW_SETUP);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* ── PREMIUM HEADER ────────────────────────────────────────── */}
      <header className="shrink-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={abandon}
              className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-sm"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {formData.jobTitle || formData.topic || "Technical Interview"}
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Live AI Session · {formData.difficulty} level
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isConnected && timeLeft !== null && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                <span className="font-mono text-sm font-bold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
            <button 
              onClick={() => isConnected ? void endAndReport() : abandon()}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
            >
               Stop Interview
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden mx-auto w-full max-w-[1600px] px-6 py-6 flex flex-col min-h-0">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 mb-6 rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 px-6 py-4 text-sm text-red-800 dark:text-red-200 flex items-center gap-3 shadow-sm"
          >
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
               <ArrowLeft className="h-4 w-4 bg-red-500 rotate-180" />
            </div>
            <p className="font-semibold">{error}</p>
          </motion.div>
        )}

        {/* feedback phase now handled above the call UI — skeleton shown there */}

        {phase === "call" && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0">
            
            {/* ── LEFT COLUMN: IMMERSION VIEW ──────────────────────────── */}
            <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
              
              {/* SIMPLIFIED REAL-TIME ANALYSIS (Moved to top for better eye-contact UX) */}
              <div className="shrink-0 grid grid-cols-2 gap-4">
                 <div className="flex items-center justify-between p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center border border-blue-100/50">
                          <Target className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Movement Symmetry</p>
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Body Stability</h4>
                       </div>
                    </div>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-300">{isConnected ? `${livePoseStats.symmetry}%` : '—'}</span>
                 </div>

                 <div className="flex items-center justify-between p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100/50">
                          <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Gaze Alignment</p>
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Focus Score</h4>
                       </div>
                    </div>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-300">{isConnected ? `${livePoseStats.gaze}%` : '—'}</span>
                 </div>
              </div>

              {/* PRIMARY VIDEO STAGE */}
              <div className="flex-1 group relative w-full rounded-[2.5rem] overflow-hidden bg-[#0A0F1E] shadow-lg flex flex-col border border-white/5 min-h-0">
                
                {/* User Camera Layer */}
                {formData.useCamera !== false && hasVideoTrack && liveStream ? (
                  <div className="absolute inset-0 [&>div]:h-full [&>div>video]:h-full [&>div>video]:object-cover [&>div]:border-none [&>div]:rounded-none">
                    <PoseTrackerFromStream
                      stream={liveStream}
                      active={isConnected}
                      onSamplesChange={onPoseSamples}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950">
                    <div className="relative block h-40 w-40 rounded-full border-4 border-white/5 bg-white/10 backdrop-blur-lg p-1.5 shadow-2xl">
                       <div className="h-full w-full rounded-full bg-white/20 dark:bg-slate-900/20 flex items-center justify-center overflow-hidden">
                          <User className="h-16 w-16 text-white/40" />
                       </div>
                       <motion.div 
                          animate={isConnected ? { scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -inset-2 rounded-full border border-white/20 dark:border-white/10"
                       />
                    </div>
                    <div className="mt-8 text-center px-10 text-white">
                       <p className="text-lg font-bold tracking-wide opacity-90 leading-tight">
                         {isConnected ? "Camera Feed Protected" : "Initialize Camera Permissions"}
                       </p>
                       <p className="text-sm text-slate-400 dark:text-slate-400 mt-2 font-medium">Standard audio-first AI protocols are active.</p>
                    </div>
                  </div>
                )}

                {/* REAL-TIME BIO OVERLAYS (Professional Badges & Captions) */}
                <AnimatePresence>
                  {isConnected && (
                    <>
                      {/* Top Left Badge */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-8 left-8 z-30 flex items-center gap-3 bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl"
                      >
                         <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Analysis</span>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* AI INTERVIEWER FLOATING OVERLAY (Regina Tanya Style) */}
                <AnimatePresence>
                  {isConnected && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="absolute top-8 right-8 z-30 overflow-hidden"
                    >
                       <div className="relative w-64 h-48 rounded-[2.5rem] bg-indigo-900/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 overflow-hidden p-1.5">
                          <div className="relative h-full w-full rounded-[2.2rem] bg-gradient-to-br from-indigo-500/80 to-blue-600/80 overflow-hidden flex items-center justify-center group/bot">
                             {/* Mock AI Avatar - using a glowing Bot icon for now */}
                             <motion.div 
                                animate={isInterviewerSpeaking ? { 
                                  scale: [1, 1.05, 1],
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="relative flex items-center justify-center h-20 w-20 rounded-full bg-white/10"
                             >
                                <Bot className={`h-10 w-10 ${isInterviewerSpeaking ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/40'}`} />
                                <div className="absolute -inset-2 rounded-full border border-white/20 dark:border-white/10 opacity-0 group-hover/bot:opacity-100 transition-opacity" />
                             </motion.div>
                             
                             {/* Label */}
                             <div className="absolute bottom-4 left-5 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">AI</span>
                                <span className="text-xs font-bold text-white tracking-wide">NUPAL Agent</span>
                             </div>

                             {/* Audio Wave Indicator (Top right of overlay) */}
                             {isInterviewerSpeaking && (
                               <div className="absolute top-5 right-5 flex gap-1 items-center h-6">
                                  {[1, 2, 3].map(i => (
                                    <motion.div 
                                      key={i}
                                      animate={{ height: ["40%", "100%", "40%"] }}
                                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                      className="w-1 rounded-full bg-white dark:bg-slate-900"
                                    />
                                  ))}
                               </div>
                             )}
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* BOTTOM FLOATING CONTROLS */}
                <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center px-10 pointer-events-none">
                   <motion.div 
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     className="flex items-center gap-3 bg-[#111827]/80 backdrop-blur-2xl p-2.5 rounded-full border border-white/10 shadow-2xl pointer-events-auto"
                   >
                     {!isConnected ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void connectToDeepgram()}
                          className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full text-white font-bold text-xs transition-all overflow-hidden active:scale-95"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4 fill-white" />}
                          INITIATE TECHNICAL CALL
                        </button>
                     ) : (
                       <>
                        <button
                          type="button"
                          onClick={toggleMute}
                          className={`group relative h-11 w-11 flex items-center justify-center rounded-full transition-all border shadow-lg ${isMuted ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                        >
                          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <button
                          type="button"
                          onClick={() => void endAndReport()}
                          className="group relative h-11 w-11 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-xl shadow-red-500/20 active:scale-95"
                        >
                          <PhoneOff className="h-5 w-5" />
                        </button>
                       </>
                     )}
                   </motion.div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: SMART TRANSCRIPT (Question List) ──────── */}
            <div className="lg:col-span-4 h-full relative min-h-0">
              <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                
                {/* Tabs / Header */}
                <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.15em]">Question List</h3>
                   <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>

                {/* Question Stream */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
                   {transcript.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 grayscale">
                         <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900/70 flex items-center justify-center mb-4">
                            <MessageSquare className="h-6 w-6 text-slate-300" />
                         </div>
                         <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">Begin Session</h4>
                         <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 leading-relaxed uppercase tracking-widest">Connect to start the dialogue stream.</p>
                      </div>
                   ) : (
                     <div className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                          {transcript.map((t, i) => (
                             <motion.div 
                               key={`${t.timestamp}-${i}`}
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all ${t.speaker === 'user' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/5 self-end w-[90%]' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800 shadow-sm self-start w-[90%]'}`}
                             >
                                <div className="flex items-start justify-between gap-3">
                                   <div className={`h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-[9px] font-black ${t.speaker === 'user' ? 'bg-white/20 dark:bg-slate-900/20 text-white' : 'bg-slate-900 text-white'}`}>
                                      {(i + 1).toString().padStart(2, '0')}
                                   </div>
                                   <div className="flex-1">
                                      <p className={`text-[12px] font-bold leading-relaxed ${t.speaker === 'user' ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                         {t.text}
                                      </p>
                                   </div>
                                   {t.speaker === 'interviewer' && (
                                      <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                         <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                                      </div>
                                   )}
                                </div>
                             </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={transcriptEndRef} />
                     </div>
                   )}
                </div>

                {/* Speaking Indicator Footer */}
                {isUserSpeaking && (
                   <motion.div 
                     initial={{ y: 20 }}
                     animate={{ y: 0 }}
                     className="px-6 py-4 bg-emerald-50/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                   >
                      <div className="flex items-center gap-2">
                         <div className="flex gap-1 items-center h-3">
                            {[1, 2, 3].map(i => (
                               <motion.div 
                                 key={i}
                                 animate={{ height: ["40%", "100%", "40%"] }}
                                 transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                 className="w-0.5 rounded-full bg-emerald-500"
                               />
                            ))}
                         </div>
                         <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest">Mic Active</span>
                      </div>
                      <Smile className="h-3.5 w-3.5 text-emerald-500" />
                   </motion.div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
