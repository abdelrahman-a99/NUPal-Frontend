import { getToken } from '../lib/auth';

import { API_ENDPOINTS } from '../config/api';


export interface ChatSendRequest {
  conversation_id?: string;
  message: string;
  lang?: string;
}

export interface ChatReply {
  kind: string;
  content: string;
  metadata_json?: string;
  agent_trace_id?: string;
  agent_route?: string;
  agent_status?: string;
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant' | string;
  kind?: string;
  content: string;
  metadata_json?: string;
  agent_trace_id?: string;
  agent_route?: string;
  agent_status?: string;
  route_confidence?: number;
  route_reason?: string;
  created_at: string;
}

export interface AgentPipelineTraceEvent {
  order: number;
  stage: string;
  status: string;
  at: string;
  duration_ms?: number;
  data_json?: string;
  error?: string;
}

export interface AgentPipelineTrace {
  id: string;
  trace_id: string;
  agent_trace_id?: string;
  student_id: string;
  conversation_id: string;
  user_message: string;
  user_message_id?: string;
  assistant_message_ids: string[];
  status: string;
  agent_route?: string;
  agent_intent?: string;
  agent_user_kind?: string;
  agent_status?: string;
  route_confidence?: number;
  route_reason?: string;
  total_duration_ms?: number;
  agent_request_json?: string;
  agent_response_json?: string;
  error?: string;
  events: AgentPipelineTraceEvent[];
  created_at: string;
  completed_at?: string;
}

export interface ChatSendResponse {
  conversation_id: string;
  replies: ChatReply[];
}

export async function sendMessage(request: ChatSendRequest): Promise<ChatSendResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes (300,000 ms)

  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_ENDPOINTS.CHAT}/send`, {

      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to send message: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Request timed out');
      throw new Error('The request timed out. The server is taking too long to respond.');
    }
    console.error('Error sending message:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getConversations() {
  const token = getToken();
  if (!token) return [];

  const response = await fetch(`${API_ENDPOINTS.CHAT}/conversations`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) return [];
  return await response.json();
}

export async function getMessages(conversationId: string): Promise<ChatHistoryMessage[]> {
  const token = getToken();
  if (!token) return [];

  const response = await fetch(`${API_ENDPOINTS.CHAT}/conversations/${conversationId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) return [];
  return await response.json();
}

export async function deleteConversation(conversationId: string) {
  const token = getToken();
  if (!token) return;

  await fetch(`${API_ENDPOINTS.CHAT}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

export async function togglePinConversation(conversationId: string, isPinned: boolean) {
  const token = getToken();
  if (!token) return;

  await fetch(`${API_ENDPOINTS.CHAT}/conversations/${conversationId}/pin`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(isPinned)
  });
}

export async function renameConversation(conversationId: string, newTitle: string) {
  const token = getToken();
  if (!token) return;

  await fetch(`${API_ENDPOINTS.CHAT}/conversations/${conversationId}/title`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTitle)
  });
}

export async function getAgentTrace(traceId: string): Promise<AgentPipelineTrace | null> {
  const token = getToken();
  if (!token || !traceId) return null;

  const response = await fetch(`${API_ENDPOINTS.CHAT}/traces/${encodeURIComponent(traceId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  return await response.json();
}
