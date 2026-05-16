'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';

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
  chatId: string | null;
  draftMessage?: string;
  onInputChange?: (value: string) => void;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  chatId,
  draftMessage = '',
  onInputChange,
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState(draftMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync Input when chat (and draft) changes
  useEffect(() => {
    setInputMessage(draftMessage || '');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [chatId, draftMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      if (onInputChange) onInputChange('');
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        handleSubmit(e);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputMessage(newValue);
    if (onInputChange) onInputChange(newValue);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const renderInputForm = (isCentered: boolean) => (
    <form onSubmit={handleSubmit} className={`mx-auto max-w-3xl w-full ${isCentered ? '' : ''}`}>
      <div className="relative flex items-end">
        <div
          onClick={handleContainerClick}
          className="flex-1 cursor-text rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 transition-all hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20"
        >
          <div className="flex items-center">
            <textarea
              ref={inputRef}
              id={isCentered ? "centeredMessageInput" : "messageInput"}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-lg bg-transparent px-5 py-4 pr-14 text-base text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none"
              style={{ maxHeight: '150px' }}
              required
            />
            <Button
              id={isCentered ? "sendButtonCentered" : "sendButton"}
              type="submit"
              variant="none"
              size="none"
              disabled={!inputMessage.trim() || isLoading}
              className={`group absolute right-3 flex h-10 w-10 items-center justify-center rounded-lg bg-transparent transition-all duration-300 hover:bg-blue-50 disabled:opacity-50 ${!inputMessage.trim() || isLoading ? 'pointer-events-none' : 'cursor-pointer'
                }`}
            >
              <svg
                height="20"
                width="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-300"
              >
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke={inputMessage.trim() && !isLoading ? '#3b82f6' : '#9ca3af'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className={`transition-all duration-300 ${inputMessage.trim() && !isLoading ? 'group-hover:stroke-blue-500 group-hover:fill-blue-500' : ''}`}
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );

  const renderSkeleton = () => (
    <div className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-4">
            <Skeleton className="h-4 w-24 opacity-50" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-[90%]" />
              <Skeleton className="h-8 w-[75%]" />
              <Skeleton className="h-8 w-[85%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-1 flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto px-4 md:px-6 pt-16 md:pt-6 pb-4 md:pb-6 ${!chatId ? 'flex items-center justify-center' : ''}`}>
        {!chatId ? (
          <div className="w-full max-w-2xl px-2 text-center pb-20">
            {/* Centered Initial View */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                How can I help you today?
              </h2>
            </div>
            {renderInputForm(true)}
          </div>
        ) : messages.length === 0 ? (
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
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Persistent Bottom Input Area (Only visible when a chat is selected) */}
      {chatId && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 md:px-6 md:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {renderInputForm(false)}
        </div>
      )}
    </div>
  );
}

