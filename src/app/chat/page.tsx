'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getToken } from '@/lib/auth';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatInterface from '@/components/chat/ChatInterface';
import { sendMessage, getConversations, getMessages, deleteConversation, togglePinConversation, renameConversation } from '@/services/chatService';
import Button from '@/components/ui/Button';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  kind?: string;
  metadataJson?: string;
  agentTraceId?: string;
  agentRoute?: string;
  agentStatus?: string;
  routeConfidence?: number;
  routeReason?: string;
}

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned?: boolean;
  messages: Message[];
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get('id');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  // Isolated Mobile Initial State Logic: Prevent Flash
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Get active chat messages
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || [];

  // Sort chats: pinned first, then chronological
  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0; // Maintain relative order for same pin status
  });


  const handleNewChat = useCallback(() => {
    router.push('/chat');
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [router]);

  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    // Optimistic update
    const previousChats = chats;
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );

    try {
      if (!chatId.startsWith('chat-')) {
        await renameConversation(chatId, newTitle);
      }
    } catch (error) {
      console.error("Failed to rename chat", error);
      setChats(previousChats);
    }
  }, [chats]);

  const handlePinChat = useCallback(async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const newPinnedState = !chat.isPinned;
    const previousChats = chats;

    // Optimistic update
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === chatId ? { ...c, isPinned: newPinnedState } : c
      )
    );

    try {
      if (!chatId.startsWith('chat-')) {
        await togglePinConversation(chatId, newPinnedState);
      }
    } catch (error) {
      console.error("Failed to pin chat", error);
      setChats(previousChats);
    }
  }, [chats]);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      let currentChatId = activeChatId;

      // Create new chat if none is active
      if (!currentChatId) {
        const newChatId = `chat-${Date.now()}`;
        const newChat: Chat = {
          id: newChatId,
          title: 'New Chat',
          lastMessage: messageText,
          timestamp: 'Just now',
          messages: [],
        };
        setChats((prevChats) => [newChat, ...prevChats]);
        router.push(`/chat?id=${newChatId}`);
        currentChatId = newChatId;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Add the user message immediately. The real conversation title now comes from the backend AI title generator.
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, userMessage],
              lastMessage: messageText,
              timestamp: 'Just now',
            };
          }
          return chat;
        })
      );

      setLoadingChatId(currentChatId);

      try {
        // Prepare API request
        const apiConversationId = currentChatId.startsWith('chat-') ? undefined : currentChatId;

        const response = await sendMessage({
          conversation_id: apiConversationId,
          message: messageText,
        });

        const newConversationId = response.conversation_id;

        // Map replies to Message objects
        const botMessages: Message[] = response.replies.map((reply, index) => ({
          id: `${newConversationId}-${Date.now()}-${index}`,
          text: reply.content,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          kind: reply.kind,
          metadataJson: reply.metadata_json,
          agentTraceId: reply.agent_trace_id,
          agentRoute: reply.agent_route,
          agentStatus: reply.agent_status,
        }));

        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                id: newConversationId, // Update to the real conversation ID from backend
                title: response.conversation_title || chat.title,
                messages: [...chat.messages, ...botMessages],
                lastMessage: botMessages[botMessages.length - 1]?.text || chat.lastMessage,
                timestamp: 'Just now',
              };
            }
            return chat;
          })
        );

        router.replace(`/chat?id=${newConversationId}`);
        setLoadingChatId(null);

      } catch (error: any) {
        console.error('Failed to get bot response:', error);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          text: error.message || 'Sorry, I encountered an error. Please try again later.',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === currentChatId
              ? {
                ...chat,
                messages: [...chat.messages, errorMessage],
              }
              : chat
          )
        );
        setLoadingChatId(null);
      }
    },
    [activeChatId, router]
  );

  const handleSearchChange = useCallback((query: string) => {
    // Search is handled in ChatSidebar component
  }, []);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    const previousChats = chats;
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

    if (activeChatId === chatId) {
      router.push('/chat');
    }

    try {
      if (!chatId.startsWith('chat-')) {
        await deleteConversation(chatId);
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
      // Revert on failure
      setChats(previousChats);
      if (activeChatId === chatId) {
        router.push(`/chat?id=${chatId}`);
      }
    }
  }, [activeChatId, chats, router]);

  // Load conversations on mount
  useEffect(() => {
    async function loadChats() {
      try {
        const convos = await getConversations();
        const mappedChats: Chat[] = convos.map((c: any) => ({
          id: c.id,
          title: c.title,
          lastMessage: '',
          timestamp: new Date(c.last_activity_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: [],     // Will be loaded on demand
          isPinned: c.is_pinned || false
        }));
        setChats(mappedChats);
      } catch (err) {
        console.error("Failed to load chats", err);
      } finally {
        setIsChatsLoading(false);
      }
    }
    loadChats();
  }, []);

  // Fetch messages when selecting a chat or on initial load with a chat ID
  useEffect(() => {
    const currentId = activeChatId;
    if (!currentId || chats.length === 0 || currentId.startsWith('chat-')) return;

    const targetChat = chats.find(c => c.id === currentId);
    if (!targetChat) return;

    if (targetChat.messages.length === 0) {
      async function fetchActiveMessages() {
        setLoadingChatId(currentId);
        try {
          const msgs = await getMessages(currentId!);
          const mappedMessages: Message[] = msgs.map((m) => ({
            id: m.id,
            text: m.content,
            isUser: m.role === 'user',
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            kind: m.kind,
            metadataJson: m.metadata_json,
            agentTraceId: m.agent_trace_id,
            agentRoute: m.agent_route,
            agentStatus: m.agent_status,
            routeConfidence: m.route_confidence,
            routeReason: m.route_reason,
          }));

          setChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: mappedMessages, lastMessage: mappedMessages[mappedMessages.length - 1]?.text || "" } : c));
        } catch (err) {
          console.error("Failed to load messages", err);
        } finally {
          setLoadingChatId(null);
        }
      }
      fetchActiveMessages();
    }
  }, [activeChatId, chats]);

  const handleSelectChat = useCallback((chatId: string) => {
    router.push(`/chat?id=${chatId}`);

    // Auto-close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [router]);

  // Handle input changes for drafts
  const handleDraftChange = useCallback((value: string) => {
    const key = activeChatId || '__new_chat__';
    setDrafts(prev => ({
      ...prev,
      [key]: value
    }));
  }, [activeChatId]);

  return (
    <div className="flex h-[calc(100dvh-64px)] w-full overflow-hidden bg-white dark:bg-slate-900 relative">
      {/* Isolated Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-[1px] md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Floating Toggle Button (Visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <Button
          variant="none"
          size="none"
          onClick={toggleSidebar}
          className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
          ariaLabel="Open sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="9" x2="9" y1="3" y2="21" />
          </svg>
        </Button>
      )}

      {/* Isolated Sidebar Container: Slide-over for mobile, Push for desktop */}
      <div
        className={`flex flex-shrink-0 overflow-hidden fixed inset-y-0 left-0 z-[70] md:static md:z-auto md:h-full 
          transition-all duration-300 ease-in-out 
          ${!mounted ? 'max-md:-translate-x-full' : ''} 
          ${isSidebarOpen
            ? 'w-80 translate-x-0 md:w-80'
            : 'w-80 -translate-x-full md:w-0'
          }`}
      >
        <ChatSidebar
          chats={sortedChats}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onPinChat={handlePinChat}
          onSearchChange={handleSearchChange}
          onToggleSidebar={toggleSidebar}
          isLoading={isChatsLoading}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={activeChatId !== null && loadingChatId === activeChatId}
          isChatsLoading={isChatsLoading}
          chatId={activeChatId}
          draftMessage={drafts[activeChatId || '__new_chat__'] || ''}
          onInputChange={handleDraftChange}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100dvh-64px)] w-full items-center justify-center bg-white dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
