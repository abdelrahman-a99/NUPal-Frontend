'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
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

  // Clear active chat ID from localStorage when navigating away from chat route
  useEffect(() => {
    return () => {
      // Cleanup function runs when component unmounts (navigating away)
      localStorage.removeItem('activeChatId');
    };
  }, []);

  // Restore active chat ID from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const savedChatId = localStorage.getItem('activeChatId');
    if (savedChatId) {
      setActiveChatId(savedChatId);
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

  // Generate chat title from first message
  const generateChatTitle = (message: string): string => {
    const trimmed = message.trim();
    if (trimmed.length === 0) return 'New Chat';
    // Take first 30 characters or first sentence
    const firstSentence = trimmed.split(/[.!?]/)[0];
    const title = firstSentence.length > 30
      ? trimmed.substring(0, 30) + '...'
      : firstSentence || trimmed.substring(0, 30);
    return title || 'New Chat';
  };

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    // Clear from localStorage when starting new chat
    localStorage.removeItem('activeChatId');
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

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
        setActiveChatId(newChatId);
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

      // Update chat with user message and generate title if it's the first message
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            const isFirstMessage = chat.messages.length === 0;
            return {
              ...chat,
              messages: [...chat.messages, userMessage],
              lastMessage: messageText,
              timestamp: 'Just now',
              title: isFirstMessage ? generateChatTitle(messageText) : chat.title,
            };
          }
          return chat;
        })
      );

      setLoadingChatId(currentChatId);

      try {
        // Prepare API request
        // If the ID starts with 'chat-', it's a local temporary ID, so don't send it as conversation_id
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
                messages: [...chat.messages, ...botMessages],
                lastMessage: botMessages[botMessages.length - 1]?.text || chat.lastMessage,
                timestamp: 'Just now',
              };
            }
            return chat;
          })
        );

        // Also update activeChatId if it was the one we just updated
        if (activeChatId === currentChatId) {
          setActiveChatId(newConversationId);
        }

        // If we were loading this chat, update loading state to follow the ID change
        setLoadingChatId(prev => (prev === currentChatId ? null : prev));

      } catch (error: any) {
        console.error('Failed to get bot response:', error);
        // Add an error message to the chat
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
    [activeChatId]
  );



  const handleSearchChange = useCallback((query: string) => {
    // Search is handled in ChatSidebar component
    // This callback can be used for additional search logic if needed
  }, []);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    // Optimistically update UI
    const previousChats = chats;
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

    if (activeChatId === chatId) {
      setActiveChatId(null);
      // Clear from localStorage if deleting active chat
      localStorage.removeItem('activeChatId');
    }

    try {
      if (!chatId.startsWith('chat-')) {
        await deleteConversation(chatId);
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
      // Revert on failure
      setChats(previousChats);
      if (activeChatId === chatId) setActiveChatId(chatId);
    }
  }, [activeChatId, chats]);

  // Load conversations on mount
  useEffect(() => {
    async function loadChats() {
      try {
        const convos = await getConversations();
        const mappedChats: Chat[] = convos.map((c: any) => ({
          id: c.id,
          title: c.title,
          lastMessage: '', // We don't get last message from this endpoint effectively yet, or user might not notice. 
          // Ideally backend returns last message snippet, but title is fine for now.
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

  // Fetch messages when selecting a chat
  const handleSelectChat = useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    // Save to localStorage for persistence on refresh
    localStorage.setItem('activeChatId', chatId);

    // Auto-close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    // Check if we already have messages for this chat (basic caching)
    // If messages are empty, try to fetch them. 
    // Note: This logic assumes if messages is empty array [], it implies not loaded or truly empty. 
    // A better way is to check if we fetched before. 
    // For now, let's just fetch if empty.
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return;

    if (targetChat.messages.length === 0 && !chatId.startsWith('chat-')) {
      setLoadingChatId(chatId);
      try {
        const msgs = await getMessages(chatId);
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

        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: mappedMessages, lastMessage: mappedMessages[mappedMessages.length - 1]?.text || "" } : c));
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoadingChatId(null);
      }
    }
  }, [chats]);

  // Handle input changes for drafts
  const handleDraftChange = useCallback((value: string) => {
    // Use current activeChatId or a specialized key for new chat if null
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
          chatId={activeChatId}
          draftMessage={drafts[activeChatId || '__new_chat__'] || ''}
          onInputChange={handleDraftChange}
        />
      </div>
    </div>
  );
}
