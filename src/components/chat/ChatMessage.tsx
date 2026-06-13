'use client';

import { useMemo, useState } from 'react';
import { getAgentTrace, type AgentPipelineTrace } from '@/services/chatService';

interface AgentMessageMetadata {
  kind?: string;
  metadataJson?: string;
  agentTraceId?: string;
  agentRoute?: string;
  agentStatus?: string;
  routeConfidence?: number;
  routeReason?: string;
}

interface ChatMessageProps extends AgentMessageMetadata {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

interface ParsedMetadata {
  traceId?: string;
  route?: string;
  status?: string;
  confidence?: number;
  reason?: string;
  resultService?: string;
  targetTrack?: string;
  objectiveProfile?: string;
  raw?: unknown;
}

const SHOW_AGENT_DEBUG = process.env.NEXT_PUBLIC_SHOW_AGENT_DEBUG === 'true';

function safeJsonParse(value?: string): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getPathValue(source: unknown, path: string): unknown {
  if (!source || typeof source !== 'object') return undefined;

  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

function getNestedString(source: unknown, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = getPathValue(source, key);
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function getNestedNumber(source: unknown, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = getPathValue(source, key);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function parseMetadata(props: AgentMessageMetadata): ParsedMetadata {
  const raw = safeJsonParse(props.metadataJson);
  const rawObject = raw && typeof raw === 'object' ? raw : undefined;

  return {
    traceId: props.agentTraceId || getNestedString(rawObject, ['agent.trace_id', 'trace_id']),
    route: props.agentRoute || getNestedString(rawObject, ['agent.route', 'route']),
    status: props.agentStatus || getNestedString(rawObject, ['agent.status', 'status']),
    confidence: props.routeConfidence ?? getNestedNumber(rawObject, ['agent.route_confidence', 'route_confidence', 'agent.router.confidence', 'router.confidence']),
    reason: props.routeReason || getNestedString(rawObject, ['agent.route_reason', 'route_reason', 'agent.router.reason', 'router.reason']),
    resultService: getNestedString(rawObject, ['result.service', 'result.source', 'result.kind']),
    targetTrack: getNestedString(rawObject, ['result.target_track', 'result.requested_target_track', 'agent.router.target_track', 'router.target_track']),
    objectiveProfile: getNestedString(rawObject, ['result.profile', 'result.objective_profile', 'result.requested_profile', 'agent.router.objective_profile', 'router.objective_profile']),
    raw: raw ?? undefined,
  };
}

function routeLabel(route?: string, kind?: string): string | null {
  switch (route) {
    case 'rag_only':
      return 'Policy answer';
    case 'rl_only':
      return 'Course recommendation';
    case 'mixed_rag_rl':
      return 'Policy + recommendation';
    case 'general_chat':
      return 'General chat';
    case 'unsupported':
      return 'Unsupported';
    default:
      if (kind === 'rag') return 'Policy answer';
      if (kind === 'rl') return 'Course recommendation';
      if (kind === 'mixed') return 'Policy + recommendation';
      if (kind === 'general') return 'General chat';
      return null;
  }
}

function trackLabel(track?: string): string | null {
  switch (track) {
    case 'general':
      return 'Track: General';
    case 'big_data':
      return 'Track: Big Data';
    case 'media':
      return 'Track: Media';
    default:
      return track ? `Track: ${track.replaceAll('_', ' ')}` : null;
  }
}

function statusLabel(status?: string): string | null {
  switch (status) {
    case 'partial':
      return 'Partial answer';
    case 'degraded':
      return 'Service degraded';
    case 'clarification_needed':
      return 'Needs clarification';
    case 'unsupported':
      return 'Unsupported';
    case 'ok':
    case undefined:
    case '':
      return null;
    default:
      return status.replaceAll('_', ' ');
  }
}

function formatConfidence(confidence?: number): string | null {
  if (confidence === undefined) return null;
  const clamped = Math.max(0, Math.min(1, confidence));
  return `${Math.round(clamped * 100)}% confidence`;
}

function prettyJson(value?: string): string {
  if (!value) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export default function ChatMessage({
  message,
  isUser,
  kind,
  metadataJson,
  agentTraceId,
  agentRoute,
  agentStatus,
  routeConfidence,
  routeReason,
}: ChatMessageProps) {
  const [showDebug, setShowDebug] = useState(false);
  const [trace, setTrace] = useState<AgentPipelineTrace | null>(null);
  const [isTraceLoading, setIsTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const metadata = useMemo(
    () => parseMetadata({ kind, metadataJson, agentTraceId, agentRoute, agentStatus, routeConfidence, routeReason }),
    [kind, metadataJson, agentTraceId, agentRoute, agentStatus, routeConfidence, routeReason]
  );

  const label = !isUser ? routeLabel(metadata.route, kind) : null;
  const status = !isUser ? statusLabel(metadata.status) : null;
  const confidence = !isUser ? formatConfidence(metadata.confidence) : null;
  const track = !isUser ? trackLabel(metadata.targetTrack) : null;
  const hasDebugDetails = Boolean(metadata.traceId || metadata.route || metadata.reason || metadata.resultService || metadata.targetTrack || metadata.objectiveProfile || metadata.raw);

  const handleLoadTrace = async () => {
    if (!metadata.traceId) return;

    setIsTraceLoading(true);
    setTraceError(null);

    try {
      const fullTrace = await getAgentTrace(metadata.traceId);
      if (!fullTrace) {
        setTraceError('Trace not found or not available yet.');
      } else {
        setTrace(fullTrace);
      }
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : 'Failed to load trace.');
    } finally {
      setIsTraceLoading(false);
    }
  };

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-400 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message}
        </p>

        {!isUser && (label || status || confidence || track) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] leading-none">
            {label && (
              <span className="rounded-full border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 font-medium text-blue-700 dark:text-blue-300">
                {label}
              </span>
            )}
            {status && (
              <span className="rounded-full border border-amber-100 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 font-medium text-amber-700 dark:text-amber-300">
                {status}
              </span>
            )}
            {track && (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-300">
                {track}
              </span>
            )}
            {confidence && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-medium text-slate-600 dark:text-slate-300">
                {confidence}
              </span>
            )}
          </div>
        )}

        {!isUser && SHOW_AGENT_DEBUG && hasDebugDetails && (
          <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-2">
            <button
              type="button"
              onClick={() => setShowDebug((prev) => !prev)}
              className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {showDebug ? 'Hide routing details' : 'Show routing details'}
            </button>
            {showDebug && (
              <div className="mt-2 space-y-2 rounded-lg bg-white/70 dark:bg-slate-900/70 p-2 text-[11px] text-slate-600 dark:text-slate-300">
                {metadata.traceId && <div><span className="font-semibold">Agent trace:</span> {metadata.traceId}</div>}
                {metadata.route && <div><span className="font-semibold">Route:</span> {metadata.route}</div>}
                {metadata.status && <div><span className="font-semibold">Status:</span> {metadata.status}</div>}
                {metadata.reason && <div><span className="font-semibold">Reason:</span> {metadata.reason}</div>}
                {metadata.resultService && <div><span className="font-semibold">Service:</span> {metadata.resultService}</div>}
                {metadata.targetTrack && <div><span className="font-semibold">Track:</span> {metadata.targetTrack}</div>}
                {metadata.objectiveProfile && <div><span className="font-semibold">Profile:</span> {metadata.objectiveProfile}</div>}

                {metadata.traceId && (
                  <button
                    type="button"
                    onClick={handleLoadTrace}
                    disabled={isTraceLoading}
                    className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isTraceLoading ? 'Loading full pipeline trace...' : 'Load full pipeline trace'}
                  </button>
                )}

                {traceError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {traceError}
                  </div>
                )}

                {trace && (
                  <div className="space-y-2">
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2">
                      <div><span className="font-semibold">Backend trace:</span> {trace.trace_id}</div>
                      <div><span className="font-semibold">Total:</span> {trace.total_duration_ms ? Math.round(trace.total_duration_ms) : 'n/a'} ms</div>
                      <div><span className="font-semibold">Events:</span> {trace.events?.length ?? 0}</div>
                    </div>

                    <div className="space-y-1">
                      {trace.events?.map((event) => (
                        <details
                          key={`${event.order}-${event.stage}`}
                          className="rounded-md border border-slate-200 dark:border-slate-700 p-2"
                        >
                          <summary className="cursor-pointer font-semibold">
                            {event.order}. {event.stage}
                            {event.duration_ms ? ` · ${Math.round(event.duration_ms)} ms` : ''}
                          </summary>
                          {event.error && (
                            <div className="mt-1 text-red-600 dark:text-red-300">{event.error}</div>
                          )}
                          {event.data_json && (
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 dark:bg-slate-950 p-2">
                              {prettyJson(event.data_json)}
                            </pre>
                          )}
                        </details>
                      ))}
                    </div>

                    {trace.agent_request_json && (
                      <details className="rounded-md border border-slate-200 dark:border-slate-700 p-2">
                        <summary className="cursor-pointer font-semibold">Full agent request JSON</summary>
                        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 dark:bg-slate-950 p-2">
                          {prettyJson(trace.agent_request_json)}
                        </pre>
                      </details>
                    )}

                    {trace.agent_response_json && (
                      <details className="rounded-md border border-slate-200 dark:border-slate-700 p-2">
                        <summary className="cursor-pointer font-semibold">Full agent response JSON</summary>
                        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 dark:bg-slate-950 p-2">
                          {prettyJson(trace.agent_response_json)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
