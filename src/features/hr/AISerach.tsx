import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Info } from 'lucide-react';
import { Logo } from '../../assets/common/Logo.tsx';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

const AI_SEARCH_UNAVAILABLE_MESSAGE =
  'AI Search is temporarily unavailable. An API key has not been configured yet. This feature will be enabled once Gemini credentials are set up.';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const AISearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAiSearchEnabled = false;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!query.trim() || !isAiSearchEnabled) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
  };

   const suggestions = [
    "Show all employees under the MIS department.",
    "Find employees eligible for retirement (60+).",
    "Show employee profile of Juan Dela Cruz.",
    "Summarize gender distribution in Accounting /Finance Department."
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <Logo className="w-12 h-12" />
        <div>
          <h1 className="text-3xl font-black text-green-950 flex items-center gap-3">
            NMC-HR AI Insights
            <Sparkles className="text-yellow-500 fill-yellow-500" size={24} />
          </h1>
          <p className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">Intelligent Employee Query Assistant</p>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
        <div className="mx-6 mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-green-900">
          {AI_SEARCH_UNAVAILABLE_MESSAGE}
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                <Bot className="text-yellow-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-green-950 mb-2">AI Search is coming soon</h3>
              <p className="text-gray-500 text-sm mb-8 font-medium">
                This assistant will be available after the Gemini API key is configured.
              </p>
              
              <div className="w-full space-y-2 opacity-60">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    type="button"
                    disabled
                    className="w-full p-3 text-sm font-semibold text-green-800 bg-green-50/50 rounded-xl text-left flex items-center gap-2 cursor-not-allowed"
                  >
                    <Info size={14} className="text-green-600 opacity-50" />
                    {s}
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
                <div className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                  ${m.role === 'assistant' ? 'bg-green-900 text-yellow-400' : 'bg-yellow-400 text-green-950'}
                `}>
                  {m.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`
                  max-w-[80%] p-4 rounded-3xl shadow-sm
                  ${m.role === 'assistant' ? 'bg-gray-50 border border-gray-100 text-green-950' : 'bg-green-900 text-white'}
                `}>
                  <div className="prose prose-sm max-w-none prose-green">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  <div className={`text-[10px] mt-2 opacity-40 font-bold uppercase tracking-widest ${m.role === 'user' ? 'text-right' : ''}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="AI Search will be available after API key setup..."
                disabled
                className="w-full pl-6 pr-12 py-4 bg-white border border-gray-200 rounded-3xl shadow-inner outline-none font-medium text-green-950 opacity-60 cursor-not-allowed"
              />
              <button 
                type="button"
                disabled
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-800 opacity-30 cursor-not-allowed"
              >
                <Sparkles size={20} />
              </button>
            </div>
            <button 
              type="submit"
              disabled
              className="p-4 bg-green-900 text-yellow-400 rounded-3xl opacity-50 grayscale cursor-not-allowed shadow-lg"
            >
              <Send size={24} />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-4 font-bold uppercase tracking-[0.2em]">
            AI assistant disabled until Gemini API credentials are configured
          </p>
        </div>
      </div>
    </div>
  );
};
