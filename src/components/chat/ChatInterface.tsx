'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';


function EyeTracker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const maxMovement = 15;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const dist = Math.min(maxMovement, Math.hypot(e.clientX - cx, e.clientY - cy) / 5);
      setPupil({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 select-none w-[34px] h-[34px] flex items-center justify-center relative"
      aria-hidden="true"
    >
      <div
        className="relative w-44 h-44 flex-shrink-0 pointer-events-none"
        style={{ transform: 'scale(0.193)', transformOrigin: 'center center' }}
      >
        <div className="absolute inset-0 omni-rotate-animate">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-5 h-5 rounded-[30%] left-1/2 top-0"
              style={{
                backgroundColor: '#60a5fa',
                boxShadow: '0 0 15px rgba(96,165,250,0.25)',
                marginLeft: '-10px',
                transformOrigin: '10px 88px',
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>
        <div
          className="absolute flex items-center justify-center gap-4"
          style={{ width: '80px', left: '50%', top: '50%', transform: `translate(calc(-50% + ${pupil.x}px), calc(-50% + ${pupil.y}px))` }}
        >
          <div className="w-6 h-6 rounded-[30%] eye-blink-animate" style={{ backgroundColor: '#60a5fa', boxShadow: '0 0 15px rgba(96,165,250,0.3)' }} />
          <div className="w-6 h-6 rounded-[30%] eye-blink-animate" style={{ backgroundColor: '#60a5fa', boxShadow: '0 0 15px rgba(96,165,250,0.3)' }} />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes eye-blink { 0%,15%,100%{transform:scaleY(1)} 7%{transform:scaleY(0.05)} }
        @keyframes omni-rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .omni-rotate-animate { animation: omni-rotate 6s linear infinite; }
        .eye-blink-animate   { animation: eye-blink 6s ease-in-out infinite; }
      `}} />
    </div>
  );
}


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

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isChatsLoading?: boolean;
  chatId: string | null;
  draftMessage?: string;
  onInputChange?: (value: string) => void;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  isChatsLoading = false,
  chatId,
  draftMessage = '',
  onInputChange,
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState(draftMessage);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const prevChatIdRef = useRef<string | null>(null);
  const shouldScrollOnLoadRef = useRef<boolean>(false);

  useEffect(() => {
    setInputMessage(draftMessage || '');
  }, [chatId, draftMessage]);

  // Auto-resize textarea whenever inputMessage changes
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [inputMessage]);

  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      shouldScrollOnLoadRef.current = true;
    }
  }, [chatId]);


  useEffect(() => {
    if (!bottomAnchorRef.current || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.isUser === true;

    if (shouldScrollOnLoadRef.current || isUserMessage) {
      bottomAnchorRef.current.scrollIntoView({ block: 'end' });
      shouldScrollOnLoadRef.current = false;
    }
 
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      if (onInputChange) onInputChange('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputMessage(newValue);
    if (onInputChange) onInputChange(newValue);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

 
  const renderSkeleton = () => (
    <div className="mx-auto max-w-3xl space-y-4 py-4">
      <div className="flex w-full justify-end mb-4">
        <Skeleton className="h-10 w-[40%] max-w-[70%] rounded-2xl bg-blue-200 dark:bg-blue-900/40" />
      </div>
      <div className="flex w-full justify-start mb-4">
        <Skeleton className="h-14 w-[55%] max-w-[70%] rounded-2xl" />
      </div>
      <div className="flex w-full justify-end mb-4">
        <Skeleton className="h-10 w-[35%] max-w-[70%] rounded-2xl bg-blue-200 dark:bg-blue-900/40" />
      </div>
      <div className="flex w-full justify-start mb-4">
        <Skeleton className="h-20 w-[65%] max-w-[70%] rounded-2xl" />
      </div>
      <div className="flex w-full justify-end mb-4">
        <Skeleton className="h-10 w-[30%] max-w-[70%] rounded-2xl bg-blue-200 dark:bg-blue-900/40" />
      </div>
    </div>
  );

  // ─── Input form ─────────────────────────────────────────────────────────────
  const renderInputForm = (isCentered: boolean) => (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl w-full">
      {/* Wrapper keeps eye + box perfectly centred with equal side margins */}
      <div className="relative flex items-end">
        {/* Eye sits outside the box, flush on the left */}
        {/* {!isCentered && (
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{ width: '34px', marginRight: '8px', marginBottom: '10px' }}
          >
            <EyeTracker />
          </div>
        )} */}

        {/* Input box fills remaining space */}
        <div
          onClick={handleContainerClick}
          className="flex-1 cursor-text rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 transition-all hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20"
        >
          <div className="flex items-end">
            <textarea
              ref={inputRef}
              id={isCentered ? 'centeredMessageInput' : 'messageInput'}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-3xl bg-transparent px-5 py-4 pr-14 text-base text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none overflow-hidden"
              required
            />
            <Button
              id={isCentered ? 'sendButtonCentered' : 'sendButton'}
              type="submit"
              variant="none"
              size="none"
              disabled={!inputMessage.trim() || isLoading}
              className={`group absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                inputMessage.trim() && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 pointer-events-none'
              }`}
            >
              <svg
                height="16"
                width="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-200"
              >
                <path
                  d="M12 19V5M12 5L5 12M12 5L19 12"
                  stroke={inputMessage.trim() && !isLoading ? '#ffffff' : '#9ca3af'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );


  return (
    <div className="flex h-full flex-1 flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {!chatId ? (
        <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 md:px-6 pt-16 md:pt-6 pb-4 md:pb-6">
          <div className="w-full max-w-2xl px-2 text-center pb-20">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                How can I help you today?
              </h2>
            </div>
            {renderInputForm(true)}
          </div>
        </div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 pt-16 md:pt-6 pb-4 md:pb-6"
          >
            {messages.length === 0 && (isChatsLoading || isLoading) ? (
              renderSkeleton()
            ) : (
              <div className="mx-auto max-w-3xl">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message.text}
                    isUser={message.isUser}
                    kind={message.kind}
                    metadataJson={message.metadataJson}
                    agentTraceId={message.agentTraceId}
                    agentRoute={message.agentRoute}
                    agentStatus={message.agentStatus}
                    routeConfidence={message.routeConfidence}
                    routeReason={message.routeReason}
                  />
                ))}

                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[70%] rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 animate-bounce rounded-[30%] bg-slate-400 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-[30%] bg-slate-400 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-[30%] bg-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomAnchorRef} style={{ height: 1 }} />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 px-4 py-3 md:px-6 md:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {renderInputForm(false)}
          </div>
        </>
      )}
    </div>
  );
}
