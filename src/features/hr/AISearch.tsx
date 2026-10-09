import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { Logo } from '../../assets/common/Logo';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQueryClient } from '@tanstack/react-query';
import type {
  ChatMessage,
  ConversationSummary,
} from '../../services/aiService';
import {
  AI_CONVERSATIONS_QUERY_KEY,
  aiConversationQueryKey,
  useAiConversationsQuery,
  useAiConversationQuery,
  useRenameAiConversation,
  useDeleteAiConversation,
  useClearAllAiConversations,
  useStreamAiChat,
} from '../../hooks/useAiChat';
import { AiChartCard } from '../../components/AiChartCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY_ACTIVE_CONV = 'nmc_ai_active_conv_id';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'nmc_ai_sidebar_collapsed';

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTimestamp(): number {
  return Date.now();
}

export const AISearch: React.FC = () => {
  // Active selection
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_CONV);
  });

  // React Query hooks for conversations list and active conversation
  const conversationsQuery = useAiConversationsQuery();
  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data]
  );
  const isLoadingConversations = conversationsQuery.isPending;

  const activeConversationQuery = useAiConversationQuery(activeConversationId);

  const queryClient = useQueryClient();

  // React Query mutations for conversation management and chat streaming
  const renameMutation = useRenameAiConversation();
  const deleteMutation = useDeleteAiConversation();
  const clearAllMutation = useClearAllAiConversations();
  const streamChatMutation = useStreamAiChat();

  // Search & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED) !== 'true';
  });

  // Inline rename state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Delete modal state
  const [convToDelete, setConvToDelete] = useState<ConversationSummary | null>(
    null
  );
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Copy indicator state: messageId -> boolean
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Active chat state
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive server messages from React Query active conversation cache
  const serverMessages = useMemo<Message[]>(() => {
    if (!activeConversationQuery.data?.messages) return [];
    return activeConversationQuery.data.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.createdAt).getTime(),
    }));
  }, [activeConversationQuery.data]);

  // Live streaming messages (overrides server messages during active prompt streaming)
  const [streamMessages, setStreamMessages] = useState<Message[] | null>(null);
  const messages = streamMessages ?? serverMessages;

  const isLoadingMessages =
    Boolean(activeConversationId) &&
    activeConversationQuery.isLoading &&
    messages.length === 0;

  // Save sidebar preference
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(!next));
      return next;
    });
  };

  // Auto-scroll chat area with requestAnimationFrame for render performance
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, currentStatus]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Select conversation from history
  const handleSelectConversation = (convId: string) => {
    if (convId === activeConversationId) return;
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setCurrentStatus(null);
    setStreamError(null);
    setStreamMessages(null);
    setActiveConversationId(convId);
    localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, convId);
  };

  // Start a new conversation draft
  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setCurrentStatus(null);
    setStreamError(null);
    setActiveConversationId(null);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV);
    setStreamMessages(null);
    setQuery('');
  };

  // Handle Send / Prompt submission
  const handleSend = async (
    overridePrompt?: string,
    regenerateUserPrompt?: string
  ) => {
    const promptToSend = (
      regenerateUserPrompt ??
      overridePrompt ??
      query
    ).trim();
    if (!promptToSend || isGenerating) return;

    setStreamError(null);

    // If regenerating, we remove the trailing assistant message if present
    let currentMessageList = messages;
    if (regenerateUserPrompt && currentMessageList.length > 0) {
      if (
        currentMessageList[currentMessageList.length - 1]?.role === 'assistant'
      ) {
        currentMessageList = currentMessageList.slice(0, -1);
      }
    }

    const currentTimestamp = getTimestamp();
    const userMessage: Message = {
      id: createMessageId(),
      role: 'user',
      content: promptToSend,
      timestamp: currentTimestamp,
    };

    const assistantMessageId = createMessageId();
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: currentTimestamp,
    };

    const updatedMessages = regenerateUserPrompt
      ? [...currentMessageList, assistantPlaceholder]
      : [...currentMessageList, userMessage, assistantPlaceholder];

    setStreamMessages(updatedMessages);
    if (!regenerateUserPrompt) {
      setQuery('');
    }
    setIsGenerating(true);
    setCurrentStatus('Analyzing query...');

    const historyPayload: ChatMessage[] = (
      regenerateUserPrompt
        ? currentMessageList
        : [...currentMessageList, userMessage]
    ).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamChatMutation.mutateAsync({
        message: promptToSend,
        history: historyPayload,
        callbacks: {
          onConversationId: (newConvId) => {
            setActiveConversationId(newConvId);
            localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, newConvId);
          },
          onStatus: (status) => {
            setCurrentStatus(status);
          },
          onDelta: (delta) => {
            setCurrentStatus(null);
            setStreamMessages((prev) =>
              (prev ?? []).map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + delta }
                  : m
              )
            );
          },
          onDone: async (meta) => {
            setIsGenerating(false);
            setCurrentStatus(null);
            const resolvedConvId = meta?.conversationId ?? activeConversationId;
            if (resolvedConvId) {
              setActiveConversationId(resolvedConvId);
              localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, resolvedConvId);
              await queryClient.invalidateQueries({
                queryKey: AI_CONVERSATIONS_QUERY_KEY,
              });
              await queryClient.invalidateQueries({
                queryKey: aiConversationQueryKey(resolvedConvId),
              });
              setStreamMessages(null);
            }
          },
          onError: (err) => {
            setIsGenerating(false);
            setCurrentStatus(null);
            setStreamError(err.message);
            setStreamMessages((prev) =>
              (prev ?? []).map((m) =>
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
        conversationId: activeConversationId ?? undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Failed to communicate with AI service';
        setStreamError(errorMsg);
        setStreamMessages((prev) =>
          (prev ?? []).map((m) =>
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
      await renameMutation.mutateAsync({ id, title: cleanTitle });
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
      await deleteMutation.mutateAsync(targetId);
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
      await clearAllMutation.mutateAsync();
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
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
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

  const suggestions = [
    '📊 Visualize employee headcount distribution across all departments.',
    '🍩 Chart the gender and marital status distribution among staff.',
    '📈 Chart punctuality and attendance rates across departments.',
    '💰 Compare average basic salary and allowances by department.',
    '👥 Visualize retirement eligibility (employees aged 60+ vs active workforce).',
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-5.5rem)] space-y-6 animate-in fade-in duration-300">
      {/* Page Header - Aligned with Dashboard.tsx pattern */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight flex items-center gap-2">
                AI Assistant & Records Search
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Human Resources Information System
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <Bot size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  HR Intelligence
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-green-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs border border-amber-500/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden active:scale-95"
            title="Start a new conversation"
          >
            <Plus size={16} className="text-green-950 stroke-[2.5]" />
            <span>New Conversation</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-green-950 bg-white hover:bg-stone-50 rounded-xl transition-all border border-stone-200/80 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              title="Reset current conversation view"
            >
              <RotateCcw size={14} />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container Card - Aligned with Dashboard.tsx rounded-2xl & stone-200/80 border */}
      <div className="flex-1 bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden flex min-h-0">
        {/* Left History Sidebar */}
        <aside
          className={`
            transition-all duration-300 ease-in-out border-r border-stone-200/80 flex flex-col bg-stone-50/70
            ${isSidebarOpen ? 'w-72 lg:w-80' : 'w-0 border-r-0'}
            overflow-hidden
          `}
        >
          {isSidebarOpen && (
            <div className="flex flex-col h-full w-72 lg:w-80 p-4">
              {/* Sidebar Header & New Chat button */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-200/80">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-900 hover:bg-green-800 text-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                >
                  <Plus
                    size={16}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  <span>New Conversation</span>
                </button>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-2 text-stone-400 hover:text-green-950 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              {/* Search Conversations */}
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:border-green-800 focus:ring-2 focus:ring-green-800/20 outline-hidden transition-all placeholder:text-stone-400"
                  aria-label="Search conversation history"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    aria-label="Clear search query"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Conversation List */}
              <div
                className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin"
                role="region"
                aria-label="Saved conversations list"
              >
                {isLoadingConversations ? (
                  <div className="flex flex-col items-center justify-center py-10 text-stone-400 text-xs">
                    <Loader2
                      size={20}
                      className="animate-spin mb-2 text-green-800"
                    />
                    <span>Loading conversations...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-stone-400 text-center px-4">
                    <MessageSquare
                      size={28}
                      className="mb-2 opacity-30 text-green-900"
                    />
                    <p className="text-xs font-semibold text-stone-600">
                      {searchQuery
                        ? 'No matching conversations'
                        : 'No saved conversations'}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Your chats will automatically be saved here.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {[
                      { label: 'Today', list: groupedConversations.today },
                      {
                        label: 'Yesterday',
                        list: groupedConversations.yesterday,
                      },
                      {
                        label: 'Previous 7 Days',
                        list: groupedConversations.last7Days,
                      },
                      { label: 'Older', list: groupedConversations.older },
                    ].map(
                      (group) =>
                        group.list.length > 0 && (
                          <div key={group.label} className="space-y-1">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-1">
                              {group.label}
                            </p>
                            {group.list.map((conv) => {
                              const isActive = conv.id === activeConversationId;
                              const isEditing = conv.id === editingConvId;

                              return (
                                <div
                                  key={conv.id}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Open conversation: ${conv.title}`}
                                  aria-current={isActive ? 'true' : undefined}
                                  onClick={() => {
                                    if (
                                      !isEditing &&
                                      conv.id !== activeConversationId
                                    ) {
                                      handleSelectConversation(conv.id);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      (e.key === 'Enter' || e.key === ' ') &&
                                      !isEditing &&
                                      conv.id !== activeConversationId
                                    ) {
                                      e.preventDefault();
                                      handleSelectConversation(conv.id);
                                    }
                                  }}
                                  className={`
                                    group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs font-medium border focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden
                                    ${
                                      isActive
                                        ? 'bg-green-900 text-white border-green-900 shadow-xs'
                                        : 'bg-white hover:bg-stone-100/80 text-green-950 border-stone-200/60 hover:border-stone-300'
                                    }
                                  `}
                                >
                                  {isEditing ? (
                                    <form
                                      onSubmit={(e) =>
                                        handleSaveRename(conv.id, e)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1.5 w-full"
                                    >
                                      <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) =>
                                          setEditingTitle(e.target.value)
                                        }
                                        autoFocus
                                        className="flex-1 bg-white text-green-950 px-2 py-1 rounded-lg border border-green-700 text-xs outline-hidden"
                                        aria-label="Edit conversation title"
                                      />
                                      <button
                                        type="submit"
                                        className="p-1 text-emerald-700 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden rounded-md"
                                        title="Save"
                                        aria-label="Save conversation title"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingConvId(null)}
                                        className="p-1 text-stone-400 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden rounded-md"
                                        title="Cancel"
                                        aria-label="Cancel editing title"
                                      >
                                        <X size={14} />
                                      </button>
                                    </form>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                        <MessageSquare
                                          size={14}
                                          className={`shrink-0 ${
                                            isActive
                                              ? 'text-amber-300'
                                              : 'text-emerald-800 opacity-60'
                                          }`}
                                        />
                                        <span className="truncate">
                                          {conv.title}
                                        </span>
                                      </div>

                                      <div
                                        className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                                          isActive
                                            ? 'text-white'
                                            : 'text-stone-500'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => startEditing(conv, e)}
                                          className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-black/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden cursor-pointer"
                                          title="Rename conversation"
                                          aria-label={`Rename conversation: ${conv.title}`}
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConvToDelete(conv);
                                          }}
                                          className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-red-500 hover:text-white rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-hidden cursor-pointer"
                                          title="Delete conversation"
                                          aria-label={`Delete conversation: ${conv.title}`}
                                        >
                                          <Trash2 size={13} />
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
                <div className="pt-3 border-t border-stone-200/80 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsClearAllModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:outline-hidden"
                    aria-label="Clear all conversation history"
                  >
                    <Trash2 size={13} />
                    <span>Clear All History</span>
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
                type="button"
                onClick={toggleSidebar}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-xs border border-stone-200/80 text-green-950 rounded-xl text-xs font-bold shadow-xs hover:bg-stone-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                title="Expand conversation history"
                aria-label="Expand conversation history"
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
                type="button"
                onClick={() => setStreamError(null)}
                className="text-red-500 hover:text-red-700 font-bold ml-4 cursor-pointer p-1"
                aria-label="Dismiss error notification"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages Area with A11y Live Region */}
          <div
            ref={scrollRef}
            role="log"
            aria-label="Conversation message stream"
            aria-live="polite"
            aria-atomic="false"
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {isLoadingMessages ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Loader2
                  size={32}
                  className="animate-spin text-green-800 mb-3"
                />
                <p className="text-sm font-bold text-green-950">
                  Loading conversation...
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Retrieving verified message history
                </p>
              </div>
            ) : messages.length === 0 ? (
              /* Welcoming Empty State - Aligned with Dashboard Overview style */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 shadow-xs">
                  <Bot size={32} className="text-emerald-800" />
                </div>
                <h2 className="text-2xl font-extrabold text-green-950 tracking-tight mb-2">
                  HR Intelligence Assistant
                </h2>
                <p className="text-stone-600 text-xs sm:text-sm mb-7 font-medium leading-relaxed max-w-lg">
                  Query verified employee records, departmental headcounts,
                  payroll calculations, leaves, and attendance with automated
                  database intelligence.
                </p>

                <div className="w-full space-y-2.5">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Suggested Inquiries
                    </span>
                  </div>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="w-full p-3.5 text-xs font-semibold text-green-950 bg-stone-50/80 hover:bg-emerald-50/70 rounded-xl text-left flex items-center justify-between transition-all border border-stone-200/70 hover:border-emerald-200 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                    >
                      <span className="flex items-center gap-2.5">
                        <Info size={15} className="text-emerald-800 shrink-0" />
                        <span>{s}</span>
                      </span>
                      <Sparkles
                        size={14}
                        className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 md:gap-4 ${
                        m.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`
                          w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs
                          ${
                            isAssistant
                              ? 'bg-green-900 text-amber-300'
                              : 'bg-amber-400 text-green-950 font-bold'
                          }
                        `}
                      >
                        {isAssistant ? <Bot size={20} /> : <User size={20} />}
                      </div>

                      <div
                        className={`
                          max-w-[85%] md:max-w-[80%] p-5 rounded-2xl shadow-xs relative group
                          ${
                            isAssistant
                              ? 'bg-stone-50 border border-stone-200/80 text-green-950'
                              : 'bg-green-900 text-white'
                          }
                        `}
                      >
                        {isAssistant && !m.content && isGenerating ? (
                          <div className="flex items-center gap-2 py-1 text-sm text-green-800 font-medium animate-pulse">
                            <Loader2
                              size={16}
                              className="animate-spin text-green-700"
                            />
                            <span>
                              {currentStatus ?? 'Analyzing database records...'}
                            </span>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none prose-green prose-table:border-collapse prose-th:bg-stone-100 prose-th:text-green-950 prose-th:p-2.5 prose-th:border prose-th:border-stone-200 prose-td:p-2.5 prose-td:border prose-td:border-stone-200">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ className, children, ...props }) {
                                  const match = /language-(\S+)/.exec(
                                    className || ''
                                  );
                                  const language = match ? match[1] : '';
                                  const rawCode = String(children).replace(
                                    /\n$/,
                                    ''
                                  );

                                  if (
                                    language === 'json:chart' ||
                                    language === 'chart'
                                  ) {
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
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-200/60">
                          <span
                            className={`text-[11px] font-semibold tracking-wide ${
                              m.role === 'user'
                                ? 'text-emerald-200'
                                : 'text-stone-500'
                            }`}
                          >
                            {new Date(m.timestamp).toLocaleTimeString('en-PH', {
                              timeZone: 'Asia/Manila',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>

                          {isAssistant && m.content && (
                            <div className="flex items-center gap-1.5">
                              {/* One-click Copy */}
                              <button
                                type="button"
                                onClick={() => handleCopy(m.id, m.content)}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-green-950 bg-white hover:bg-stone-50 rounded-lg border border-stone-200/80 shadow-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                                title="Copy response to clipboard"
                                aria-label="Copy response to clipboard"
                              >
                                {copiedMessageId === m.id ? (
                                  <>
                                    <CheckCheck
                                      size={13}
                                      className="text-emerald-600"
                                    />
                                    <span className="text-emerald-700 font-bold text-[11px]">
                                      Copied!
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
                                    <span className="text-[11px]">Copy</span>
                                  </>
                                )}
                              </button>

                              {/* Regenerate Response */}
                              {isLatestAssistant && (
                                <button
                                  type="button"
                                  onClick={handleRegenerate}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-green-950 bg-white hover:bg-stone-50 rounded-lg border border-stone-200/80 shadow-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                                  title="Regenerate this response"
                                  aria-label="Regenerate this response"
                                >
                                  <RotateCcw size={13} />
                                  <span className="text-[11px]">
                                    Regenerate
                                  </span>
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
              <div className="flex items-center gap-2 pl-12 md:pl-14 text-xs font-semibold text-green-900 animate-pulse">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>{currentStatus}</span>
              </div>
            )}
          </div>

          {/* Bottom Input Area - Aligned with Dashboard Form standards */}
          <div className="p-4 md:p-5 bg-stone-50/80 border-t border-stone-200/80 shrink-0">
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
                  className="w-full pl-5 pr-12 py-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-xs outline-hidden font-medium text-xs sm:text-sm text-green-950 focus:border-green-800 focus:ring-2 focus:ring-green-800/20 transition-all disabled:opacity-50"
                  aria-label="Prompt input for HR Intelligence Assistant"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 opacity-60 pointer-events-none"
                  aria-hidden="true"
                >
                  <Sparkles size={18} />
                </button>
              </div>

              {/* Dynamic Action Button: Stop Generating vs Send */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:outline-hidden"
                  title="Stop generating response"
                  aria-label="Stop generating response"
                >
                  <Square size={16} className="fill-white" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="p-3.5 bg-green-900 text-amber-300 rounded-xl shadow-xs hover:bg-green-800 disabled:opacity-40 disabled:grayscale transition-all cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                  title="Send prompt"
                  aria-label="Send query to HR Assistant"
                >
                  <Send size={18} />
                </button>
              )}
            </form>

            <p className="text-[11px] text-stone-500 text-center mt-3 font-medium">
              Verified HRIS Grounding &bull; Read-Only Database Queries &bull;
              Institutional Records Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Delete Single Conversation Modal */}
      {convToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 bg-rose-50 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-green-950 tracking-tight">
                  Delete Conversation
                </h3>
                <p className="text-xs text-stone-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-600 mb-6 bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 font-medium">
              Are you sure you want to delete{' '}
              <strong className="text-green-950">
                &quot;{convToDelete.title}&quot;
              </strong>
              ? All messages and generated charts in this chat will be removed.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-hidden"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteConversation}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:outline-hidden"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-green-950 tracking-tight">
                  Clear All History
                </h3>
                <p className="text-xs text-stone-500">
                  Permanent conversation removal
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-600 mb-6 bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 font-medium">
              Are you sure you want to delete{' '}
              <strong className="text-rose-900">all</strong> your saved
              conversations? This will permanently erase your entire chat
              history with the HR Assistant.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-hidden"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:outline-hidden"
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
