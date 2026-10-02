import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Info, RotateCcw, Loader2 } from 'lucide-react';
import { Logo } from '../../assets/common/Logo.tsx';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamAiChat, type ChatMessage } from '../../services/aiService';
import { AiChartCard } from '../../components/AiChartCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const AISearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStatus]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt ?? query).trim();
    if (!promptToSend || isGenerating) return;

    setStreamError(null);
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

    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, assistantPlaceholder]);
    setQuery('');
    setIsGenerating(true);
    setCurrentStatus('Analyzing query...');

    // Convert history for API (excluding the placeholder assistant message)
    const historyPayload: ChatMessage[] = updatedMessages.map((m) => ({
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
          onStatus: (status) => {
            setCurrentStatus(status);
          },
          onDelta: (delta) => {
            setCurrentStatus(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + delta }
                  : m
              )
            );
          },
          onDone: () => {
            setIsGenerating(false);
            setCurrentStatus(null);
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
        controller.signal
      );
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        const errorMsg = err instanceof Error ? err.message : 'Failed to communicate with AI service';
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

  const handleClear = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setStreamError(null);
    setIsGenerating(false);
    setCurrentStatus(null);
  };

  const suggestions = [
    '📊 Visualize employee headcount distribution across all departments.',
    '🍩 Chart the gender and marital status distribution among staff.',
    '📈 Chart punctuality and attendance rates across departments.',
    '💰 Compare average basic salary and allowances by department.',
    '👥 Visualize retirement eligibility (employees aged 60+ vs active workforce).',
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-black text-green-950 flex items-center gap-3">
              NMC-HR AI Insights
              <Sparkles className="text-yellow-500 fill-yellow-500" size={24} />
            </h1>
            <p className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">
              Intelligent Employee & Database Assistant (Claude 3.5 Haiku)
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-green-900 bg-gray-100 hover:bg-green-50 rounded-xl transition-all border border-gray-200"
            title="Reset conversation"
          >
            <RotateCcw size={14} />
            <span>Reset Chat</span>
          </button>
        )}
      </header>

      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
        {streamError && (
          <div className="mx-6 mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 flex items-center justify-between">
            <span>{streamError}</span>
            <button
              onClick={() => setStreamError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
              <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <Bot size={40} className="text-green-800" />
              </div>
              <h3 className="text-2xl font-black text-green-950 mb-2">
                Ask NMC-HR Database
              </h3>
              <p className="text-gray-500 text-sm mb-8 font-medium">
                Query verified employee records, department rosters, payroll, leaves, and attendance with real-time database intelligence.
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
                    className="w-full p-3.5 text-xs font-semibold text-green-900 bg-green-50/70 hover:bg-green-100/80 rounded-2xl text-left flex items-center justify-between transition-all border border-green-100 group shadow-xs hover:shadow-sm"
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
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                  ${m.role === 'assistant' ? 'bg-green-900 text-yellow-400' : 'bg-yellow-400 text-green-950 font-bold'}
                `}
                >
                  {m.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div
                  className={`
                  max-w-[85%] p-5 rounded-3xl shadow-xs
                  ${
                    m.role === 'assistant'
                      ? 'bg-gray-50/90 border border-gray-100 text-green-950'
                      : 'bg-green-900 text-white'
                  }
                `}
                >
                  {m.role === 'assistant' && !m.content && isGenerating ? (
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

                  <div
                    className={`text-[10px] mt-2 opacity-40 font-bold uppercase tracking-widest ${
                      m.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isGenerating && currentStatus && (
            <div className="flex items-center gap-2 pl-14 text-xs font-semibold text-green-800 animate-pulse">
              <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-ping" />
              <span>{currentStatus}</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about employees, positions, retirement eligibility, leaves..."
                disabled={isGenerating}
                className="w-full pl-6 pr-12 py-4 bg-white border border-gray-200 rounded-3xl shadow-xs outline-none font-medium text-green-950 focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-800 opacity-60"
              >
                <Sparkles size={20} />
              </button>
            </div>
            <button
              type="submit"
              disabled={isGenerating || !query.trim()}
              className="p-4 bg-green-900 text-yellow-400 rounded-3xl shadow-md hover:bg-green-800 disabled:opacity-50 disabled:grayscale transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Send size={24} />
              )}
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-3 font-bold uppercase tracking-[0.15em]">
            Verified NMC-HR Database Grounding &bull; Read-Only Querying
          </p>
        </div>
      </div>
    </div>
  );
};
