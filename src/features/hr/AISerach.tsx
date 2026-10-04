import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Info,
  RotateCcw,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
  Search,
  Copy,
  CheckCheck,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { Logo } from '../../assets/common/Logo.tsx';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  aiService,
  streamAiChat,
  type ChatMessage,
  type ConversationSummary,
} from '../../services/aiService';
import { AiChartCard } from '../../components/AiChartCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY_ACTIVE_CONV = 'nmc_ai_active_conv_id';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'nmc_ai_sidebar_collapsed';

export const AISearch: React.FC = () => {
  // Conversation list & active selection
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_CONV);
  });
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Search & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED) !== 'true';
  });

  // Inline rename state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Delete modal state
  const [convToDelete, setConvToDelete] = useState<ConversationSummary | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Copy indicator state: messageId -> boolean
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Active chat state
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save sidebar preference
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(!next));
      return next;
    });
  };

  // Auto-scroll chat area
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStatus]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Fetch conversations list on mount
  const refreshConversations = useCallback(async () => {
    try {
      const list = await aiService.listConversations();
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  // Load conversation messages when activeConversationId changes
  const loadConversation = useCallback(async (convId: string | null) => {
    if (!convId) {
      setMessages([]);
      setActiveConversationId(null);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV);
      return;
    }

    setIsLoadingMessages(true);
    setStreamError(null);
    try {
      const data = await aiService.getConversation(convId);
      setActiveConversationId(convId);
      localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, convId);
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        }))
      );
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setActiveConversationId(null);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // On first load, restore active conversation if exists
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_CONV);
    if (savedId) {
      void loadConversation(savedId);
    }
  }, [loadConversation]);

  // Start a new chat draft (ChatGPT-style: empty screen, saved on first prompt)
  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setCurrentStatus(null);
    setStreamError(null);
    setActiveConversationId(null);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV);
    setMessages([]);
    setQuery('');
  };

  // Handle Send / Prompt submission
  const handleSend = async (overridePrompt?: string, regenerateUserPrompt?: string) => {
    const promptToSend = (regenerateUserPrompt ?? overridePrompt ?? query).trim();
    if (!promptToSend || isGenerating) return;

    setStreamError(null);

    // If regenerating, we remove the trailing assistant message if present
    let currentMessageList = messages;
    if (regenerateUserPrompt && currentMessageList.length > 0) {
      if (currentMessageList[currentMessageList.length - 1]?.role === 'assistant') {
        currentMessageList = currentMessageList.slice(0, -1);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      timestamp: Date.now(),
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // If it's a standard new prompt, add both user & placeholder
    // If regenerating, keep prior context and add placeholder
    const updatedMessages = regenerateUserPrompt
      ? [...currentMessageList, assistantPlaceholder]
      : [...currentMessageList, userMessage, assistantPlaceholder];

    setMessages(updatedMessages);
    if (!regenerateUserPrompt) {
      setQuery('');
    }
    setIsGenerating(true);
    setCurrentStatus('Analyzing query...');

    // Convert history for API (all messages before the assistant placeholder)
    const historyPayload: ChatMessage[] = (
      regenerateUserPrompt ? currentMessageList : [...currentMessageList, userMessage]
    ).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamAiChat(
        promptToSend,
        historyPayload,
        {
          onConversationId: (newConvId) => {
            setActiveConversationId(newConvId);
            localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, newConvId);
            void refreshConversations();
          },
          onStatus: (status) => {
            setCurrentStatus(status);
          },
          onDelta: (delta) => {
            setCurrentStatus(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId ? { ...m, content: m.content + delta } : m
              )
            );
          },
          onDone: (meta) => {
            setIsGenerating(false);
            setCurrentStatus(null);
            if (meta?.conversationId) {
              setActiveConversationId(meta.conversationId);
              localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, meta.conversationId);
            }
            void refreshConversations();
          },
          onError: (err) => {
            setIsGenerating(false);
            setCurrentStatus(null);
            setStreamError(err.message);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId && !m.content
                  ? {
                      ...m,
                      content: `⚠️ **Unable to complete request**: ${err.message}`,
                    }
                  : m
              )
            );
          },
        },
        activeConversationId ?? undefined,
        controller.signal
      );
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to communicate with AI service';
        setStreamError(errorMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId && !m.content
              ? {
                  ...m,
                  content: `⚠️ **Error**: ${errorMsg}`,
                }
              : m
          )
        );
      }
      setIsGenerating(false);
      setCurrentStatus(null);
    }
  };

  // Stop Generating
  const handleStopGenerating = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setCurrentStatus(null);
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (isGenerating || messages.length === 0) return;
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        void handleSend(undefined, messages[i]?.content);
        return;
      }
    }
  };

  // Copy message text to clipboard
  const handleCopy = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch {
      console.warn('Clipboard write failed');
    }
  };

  // Rename conversation
  const startEditing = (conv: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = async (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanTitle = editingTitle.trim();
    if (!cleanTitle) {
      setEditingConvId(null);
      return;
    }

    try {
      await aiService.renameConversation(id, cleanTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: cleanTitle } : c))
      );
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    } finally {
      setEditingConvId(null);
    }
  };

  // Delete conversation
  const confirmDeleteConversation = async () => {
    if (!convToDelete) return;
    const targetId = convToDelete.id;
    try {
      await aiService.deleteConversation(targetId);
      setConversations((prev) => prev.filter((c) => c.id !== targetId));
      if (activeConversationId === targetId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setConvToDelete(null);
    }
  };

  // Clear all conversations
  const confirmClearAll = async () => {
    try {
      await aiService.clearAllConversations();
      setConversations([]);
      handleNewChat();
    } catch (err) {
      console.error('Failed to clear conversations:', err);
    } finally {
      setIsClearAllModalOpen(false);
    }
  };

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group conversations by date (Today, Yesterday, Previous 7 Days, Older)
  const groupedConversations = useMemo(() => {
    const groups: {
      today: ConversationSummary[];
      yesterday: ConversationSummary[];
      last7Days: ConversationSummary[];
      older: ConversationSummary[];
    } = {
      today: [],
      yesterday: [],
      last7Days: [],
      older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = todayStart - 6 * 24 * 60 * 1000;

    for (const conv of filteredConversations) {
      const updated = new Date(conv.updatedAt).getTime();
      if (updated >= todayStart) {
        groups.today.push(conv);
      } else if (updated >= yesterdayStart) {
        groups.yesterday.push(conv);
      } else if (updated >= sevenDaysAgo) {
        groups.last7Days.push(conv);
      } else {
        groups.older.push(conv);
      }
    }

    return groups;
  }, [filteredConversations]);

  const activeTitle = useMemo(() => {
    if (!activeConversationId) return 'New Chat';
    const found = conversations.find((c) => c.id === activeConversationId);
    return found ? found.title : 'Chat History';
  }, [activeConversationId, conversations]);

  const suggestions = [
    '📊 Visualize employee headcount distribution across all departments.',
    '🍩 Chart the gender and marital status distribution among staff.',
    '📈 Chart punctuality and attendance rates across departments.',
    '💰 Compare average basic salary and allowances by department.',
    '👥 Visualize retirement eligibility (employees aged 60+ vs active workforce).',
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-11 h-11" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-green-950 flex items-center gap-2">
                NMC-HR AI Chat
                <Sparkles className="text-yellow-500 fill-yellow-500" size={22} />
              </h1>
              {activeConversationId && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-bold max-w-[260px] truncate border border-green-200">
                  {activeTitle}
                </span>
              )}
            </div>
            <p className="text-green-700 font-bold uppercase text-[10px] tracking-[0.2em] mt-0.5">
              Intelligent PostgreSQL Database Assistant (Claude 3.5 Haiku)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-green-950 bg-yellow-400 hover:bg-yellow-300 rounded-xl transition-all shadow-xs border border-yellow-500/40 cursor-pointer active:scale-95"
            title="Start a new chat"
          >
            <Plus size={16} className="text-green-950 stroke-[2.5]" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-green-900 bg-white hover:bg-green-50 rounded-xl transition-all border border-gray-200 cursor-pointer"
              title="Reset view"
            >
              <RotateCcw size={14} />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container: Collapsible Sidebar + Chat Panel */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex min-h-0">
        {/* Left History Sidebar */}
        <aside
          className={`
            transition-all duration-300 ease-in-out border-r border-gray-100 flex flex-col bg-gray-50/70
            ${isSidebarOpen ? 'w-72 lg:w-80' : 'w-0 border-r-0'}
            overflow-hidden
          `}
        >
          {isSidebarOpen && (
            <div className="flex flex-col h-full w-72 lg:w-80 p-4">
              {/* Sidebar Header & New Chat button */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-200/70">
                <button
                  onClick={handleNewChat}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-green-900 hover:bg-green-800 text-yellow-400 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer group"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span>New Conversation</span>
                </button>
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-gray-400 hover:text-green-900 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              {/* Search Conversations */}
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-green-950 focus:border-green-600 focus:ring-1 focus:ring-green-100 outline-none transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {isLoadingConversations ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
                    <Loader2 size={20} className="animate-spin mb-2 text-green-700" />
                    <span>Loading conversations...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-center px-4">
                    <MessageSquare size={28} className="mb-2 opacity-30 text-green-900" />
                    <p className="text-xs font-semibold text-gray-500">
                      {searchQuery ? 'No matching conversations' : 'No saved conversations'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Your chats will automatically be saved here.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Render Date Groups */}
                    {[
                      { label: 'Today', list: groupedConversations.today },
                      { label: 'Yesterday', list: groupedConversations.yesterday },
                      { label: 'Previous 7 Days', list: groupedConversations.last7Days },
                      { label: 'Older', list: groupedConversations.older },
                    ].map(
                      (group) =>
                        group.list.length > 0 && (
                          <div key={group.label} className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1">
                              {group.label}
                            </p>
                            {group.list.map((conv) => {
                              const isActive = conv.id === activeConversationId;
                              const isEditing = conv.id === editingConvId;

                              return (
                                <div
                                  key={conv.id}
                                  onClick={() => {
                                    if (!isEditing && conv.id !== activeConversationId) {
                                      void loadConversation(conv.id);
                                    }
                                  }}
                                  className={`
                                    group relative flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all text-xs font-medium border
                                    ${
                                      isActive
                                        ? 'bg-green-900 text-white border-green-900 shadow-sm'
                                        : 'bg-white hover:bg-green-50/80 text-green-950 border-gray-100 hover:border-green-100'
                                    }
                                  `}
                                >
                                  {isEditing ? (
                                    <form
                                      onSubmit={(e) => handleSaveRename(conv.id, e)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1.5 w-full"
                                    >
                                      <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        autoFocus
                                        className="flex-1 bg-white text-green-950 px-2 py-1 rounded-lg border border-green-500 text-xs outline-none"
                                      />
                                      <button
                                        type="submit"
                                        className="p-1 text-green-600 hover:text-green-800"
                                        title="Save"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingConvId(null)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                        title="Cancel"
                                      >
                                        <X size={14} />
                                      </button>
                                    </form>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                        <MessageSquare
                                          size={14}
                                          className={`flex-shrink-0 ${
                                            isActive
                                              ? 'text-yellow-400'
                                              : 'text-green-700 opacity-60'
                                          }`}
                                        />
                                        <span className="truncate">{conv.title}</span>
                                      </div>

                                      <div
                                        className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                                          isActive ? 'text-white' : 'text-gray-500'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => startEditing(conv, e)}
                                          className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                                          title="Rename chat"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConvToDelete(conv);
                                          }}
                                          className="p-1 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                          title="Delete chat"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )
                    )}
                  </>
                )}
              </div>

              {/* Sidebar Footer: Clear all chats */}
              {conversations.length > 0 && (
                <div className="pt-3 border-t border-gray-200/70 mt-2">
                  <button
                    onClick={() => setIsClearAllModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-[11px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Clear all conversation history</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Main Chat Pane */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* Collapsed Sidebar Restore Button */}
          {!isSidebarOpen && (
            <div className="absolute top-4 left-4 z-10">
              <button
                onClick={toggleSidebar}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-xs border border-gray-200 text-green-900 rounded-xl text-xs font-bold shadow-xs hover:bg-green-50 transition-all cursor-pointer"
                title="Expand chat history"
              >
                <PanelLeft size={16} />
                <span className="hidden sm:inline">History</span>
              </button>
            </div>
          )}

          {/* Stream Error Alert */}
          {streamError && (
            <div className="mx-6 mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-600" />
                <span>{streamError}</span>
              </span>
              <button
                onClick={() => setStreamError(null)}
                className="text-red-500 hover:text-red-700 font-bold ml-4 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoadingMessages ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Loader2 size={32} className="animate-spin text-green-700 mb-3" />
                <p className="text-sm font-bold text-green-950">Loading conversation...</p>
                <p className="text-xs text-gray-400 mt-1">Retrieving verified message history</p>
              </div>
            ) : messages.length === 0 ? (
              /* Welcoming Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
                <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-green-100">
                  <Bot size={40} className="text-green-800" />
                </div>
                <h3 className="text-2xl font-black text-green-950 mb-2">
                  Ask NMC-HR Database
                </h3>
                <p className="text-gray-500 text-sm mb-8 font-medium leading-relaxed">
                  Query verified employee records, department rosters, payroll, leaves, and attendance with real-time database intelligence. Conversations are saved automatically.
                </p>

                <div className="w-full space-y-2.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left mb-1">
                    Suggested Queries
                  </p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="w-full p-3.5 text-xs font-semibold text-green-900 bg-green-50/70 hover:bg-green-100/80 rounded-2xl text-left flex items-center justify-between transition-all border border-green-100 group shadow-xs hover:shadow-sm cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Info size={14} className="text-green-700 flex-shrink-0" />
                        <span>{s}</span>
                      </span>
                      <Sparkles
                        size={14}
                        className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List */
              <AnimatePresence initial={false}>
                {messages.map((m, index) => {
                  const isAssistant = m.role === 'assistant';
                  const isLatestAssistant =
                    isAssistant &&
                    index === messages.length - 1 &&
                    !isGenerating;

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 md:gap-4 ${
                        m.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`
                        w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                        ${
                          isAssistant
                            ? 'bg-green-900 text-yellow-400'
                            : 'bg-yellow-400 text-green-950 font-bold'
                        }
                      `}
                      >
                        {isAssistant ? <Bot size={20} /> : <User size={20} />}
                      </div>

                      <div
                        className={`
                        max-w-[85%] md:max-w-[80%] p-5 rounded-3xl shadow-xs relative group
                        ${
                          isAssistant
                            ? 'bg-gray-50/90 border border-gray-100 text-green-950'
                            : 'bg-green-900 text-white'
                        }
                      `}
                      >
                        {isAssistant && !m.content && isGenerating ? (
                          <div className="flex items-center gap-2 py-1 text-sm text-green-800 font-medium animate-pulse">
                            <Loader2 size={16} className="animate-spin text-green-700" />
                            <span>{currentStatus ?? 'Thinking...'}</span>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none prose-green prose-table:border-collapse prose-th:bg-green-100/60 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-gray-200">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ className, children, ...props }) {
                                  const match = /language-(\S+)/.exec(className || '');
                                  const language = match ? match[1] : '';
                                  const rawCode = String(children).replace(/\n$/, '');

                                  if (language === 'json:chart' || language === 'chart') {
                                    return <AiChartCard rawContent={rawCode} />;
                                  }

                                  if (
                                    language === 'json' &&
                                    rawCode.includes('"type"') &&
                                    (rawCode.includes('"bar"') ||
                                      rawCode.includes('"donut"') ||
                                      rawCode.includes('"pie"') ||
                                      rawCode.includes('"line"')) &&
                                    rawCode.includes('"data"')
                                  ) {
                                    return <AiChartCard rawContent={rawCode} />;
                                  }

                                  return (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Message Actions / Controls */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-200/50">
                          <span
                            className={`text-[10px] opacity-40 font-bold uppercase tracking-widest ${
                              m.role === 'user' ? 'text-white' : 'text-gray-500'
                            }`}
                          >
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {isAssistant && m.content && (
                            <div className="flex items-center gap-1.5">
                              {/* One-click Copy */}
                              <button
                                type="button"
                                onClick={() => handleCopy(m.id, m.content)}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-green-900 bg-white hover:bg-green-50 rounded-lg border border-gray-200 shadow-2xs transition-all cursor-pointer"
                                title="Copy response to clipboard"
                              >
                                {copiedMessageId === m.id ? (
                                  <>
                                    <CheckCheck size={12} className="text-green-600" />
                                    <span className="text-green-600 font-bold text-[10px]">
                                      Copied!
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span className="text-[10px]">Copy</span>
                                  </>
                                )}
                              </button>

                              {/* Regenerate Response */}
                              {isLatestAssistant && (
                                <button
                                  type="button"
                                  onClick={handleRegenerate}
                                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-green-900 bg-white hover:bg-green-50 rounded-lg border border-gray-200 shadow-2xs transition-all cursor-pointer"
                                  title="Regenerate this response"
                                >
                                  <RotateCcw size={12} />
                                  <span className="text-[10px]">Regenerate</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {isGenerating && currentStatus && (
              <div className="flex items-center gap-2 pl-12 md:pl-14 text-xs font-semibold text-green-800 animate-pulse">
                <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-ping" />
                <span>{currentStatus}</span>
              </div>
            )}
          </div>

          {/* Bottom Input Area */}
          <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-center gap-3"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about employees, positions, retirement eligibility, leaves, payroll..."
                  disabled={isGenerating}
                  className="w-full pl-6 pr-12 py-3.5 md:py-4 bg-white border border-gray-200 rounded-3xl shadow-xs outline-none font-medium text-green-950 focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-800 opacity-60"
                >
                  <Sparkles size={20} />
                </button>
              </div>

              {/* Dynamic Action Button: Stop Generating vs Send */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="p-3.5 md:p-4 bg-red-600 hover:bg-red-700 text-white rounded-3xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs"
                  title="Stop generating response"
                >
                  <Square size={18} className="fill-white" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="p-3.5 md:p-4 bg-green-900 text-yellow-400 rounded-3xl shadow-md hover:bg-green-800 disabled:opacity-50 disabled:grayscale transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="Send prompt"
                >
                  <Send size={22} />
                </button>
              )}
            </form>

            <p className="text-[10px] text-gray-400 text-center mt-3 font-bold uppercase tracking-[0.15em]">
              Verified NMC-HR Database Grounding &bull; Read-Only Querying &bull; Claude 3.5 Haiku
            </p>
          </div>
        </div>
      </div>

      {/* Delete Single Conversation Modal */}
      {convToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-green-950">Delete Conversation</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 font-medium">
              Are you sure you want to delete{' '}
              <strong className="text-green-950">&quot;{convToDelete.title}&quot;</strong>? All
              messages and generated charts in this chat will be removed.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteConversation}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-3 bg-red-50 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-green-950">Clear All Chat History</h3>
                <p className="text-xs text-gray-500">Permanent conversation removal</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 bg-red-50/50 p-3.5 rounded-2xl border border-red-100 font-medium">
              Are you sure you want to delete <strong className="text-red-900">all</strong> your
              saved conversations? This will permanently erase your entire chat history with the
              AI Assistant.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Clear All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
