'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned?: boolean;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onPinChat: (chatId: string) => void;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
}

export default function ChatSidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  onSearchChange,
  onToggleSidebar,
  isLoading,
}: ChatSidebarProps & { isLoading?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleToggleMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setOpenMenuId(openMenuId === chatId ? null : chatId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onDeleteChat(chatId);
    setOpenMenuId(null);
  };

  const handleStartRename = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditingTitle(chat.title);
    setOpenMenuId(null);
  };

  const handleSaveRename = (chatId: string) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(chatId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handlePinChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onPinChat(chatId);
    setOpenMenuId(null);
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70">
      {/* Sidebar Header with Toggle */}
      <div className="flex items-center justify-between md:justify-end px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 md:hidden">My Chats</h2>
        <Button
          variant="none"
          size="none"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900"
          ariaLabel="Close sidebar"
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
            {/* Show an X on mobile when open, sidebar icon on desktop */}
            <g className="md:hidden">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </g>
            <g className="hidden md:block">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="9" x2="9" y1="3" y2="21" />
            </g>
          </svg>
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 py-3">
        <Button
          variant="primary"
          size="md"
          onClick={onNewChat}
          className="w-full"
        >
          + New Chat
        </Button>
      </div>

      {/* Search Section */}
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-4 py-2.5 pl-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* My Chats Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            My Chats
          </h3>
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'No chats found' : 'No chats yet'}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative ${openMenuId === chat.id ? 'z-20' : 'z-0'}`}
                >
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full rounded-lg pl-3 pr-9 py-2.5 text-left transition-colors duration-200 relative ${activeChatId === chat.id
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {chat.isPinned && (
                        <svg className="h-3.5 w-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 9V4l1 0V2H7v2h1v5L6 11v2h5v7l1 1 1-1v-7h5v-2l-2-2z" />
                        </svg>
                      )}
                      {editingId === chat.id ? (
                        <input
                          autoFocus
                          className="w-full bg-white dark:bg-slate-900 border border-blue-400 rounded px-1 py-0.5 text-sm font-semibold outline-none"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(chat.id)}
                          onKeyDown={(e) => handleKeyDown(e, chat.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="truncate text-sm font-semibold block w-full"
                          title={chat.title}
                        >
                          {chat.title}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Three Dots Button (Absolute positioned) */}
                  <div
                    className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 ${openMenuId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                  >
                    <button
                      onClick={(e) => handleToggleMenu(e, chat.id)}
                      className="p-1 hover:bg-slate-200/50 rounded cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {openMenuId === chat.id && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 animate-in fade-in zoom-in duration-200 origin-top-right">
                      <button
                        onClick={(e) => handlePinChat(e, chat.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 text-left"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 9V4l1 0V2H7v2h1v5L6 11v2h5v7l1 1 1-1v-7h5v-2l-2-2z" />
                        </svg>
                        {chat.isPinned ? "Unpin Chat" : "Pin Chat"}
                      </button>
                      <button
                        onClick={(e) => handleStartRename(e, chat)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 text-left"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Rename
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 text-left"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

