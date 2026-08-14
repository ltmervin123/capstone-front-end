import React, { useState } from 'react';
import { MessageSquare, Send, X, AlertCircle, CheckCircle2, ShieldAlert, MessageCircle, Clock } from 'lucide-react';
import { useCreateFeedback, useFeedbackQuery } from '../../hooks/useFeedback';
import { createFeedbackFormSchema, FEEDBACK_CATEGORIES } from '../../schemas/feedback.schema';
import { ApiRequestError } from '../../utils/apiClient';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [category, setCategory] = useState<(typeof FEEDBACK_CATEGORIES)[number]>('General Feedback / Suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const feedbackQuery = useFeedbackQuery({ enabled: isOpen });
  const createFeedback = useCreateFeedback();
  const myFeedbacks = feedbackQuery.data ?? [];
  const submitting = createFeedback.isPending;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = createFeedbackFormSchema.safeParse({
      category,
      subject,
      message,
      isAnonymous,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Please complete the feedback form.');
      return;
    }

    createFeedback.mutate(parsed.data, {
      onSuccess: () => {
        setSuccessMessage('Thank you! Your feedback has been sent directly to HR and Admin.');
        setSubject('');
        setMessage('');
        setIsAnonymous(false);
        setTimeout(() => {
          setSuccessMessage(null);
          setActiveTab('history');
        }, 1500);
      },
      onError: (err) => {
        const messageText =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to submit feedback. Please try again.';
        setErrorMessage(messageText);
      },
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-green-950/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-green-900 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-400 rounded-xl text-green-950 shadow-sm">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight">Employee Feedback Box</h3>
                <p className="text-[10px] text-green-200 uppercase tracking-widest font-bold">Share inquiries, ideas, or workplace feedback</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-green-200 hover:text-white hover:bg-green-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub-tab bar */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 px-6">
            <button
              onClick={() => setActiveTab('submit')}
              className={`py-3 px-4 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                activeTab === 'submit' ? 'text-green-900' : 'text-gray-400 hover:text-green-800'
              }`}
            >
              Send Feedback
              {activeTab === 'submit' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                activeTab === 'history' ? 'text-green-900' : 'text-gray-400 hover:text-green-800'
              }`}
            >
              My Sent Messages ({myFeedbacks.length})
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
              )}
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {activeTab === 'submit' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-800 font-medium">
                    <AlertCircle size={16} className="shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-xs text-green-800 font-bold">
                    <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Category Dropdown */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-green-900 mb-1.5">
                    Feedback Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as (typeof FEEDBACK_CATEGORIES)[number])}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-xs text-green-950 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  >
                    <option value="General Feedback / Suggestion">💬 General Feedback / Suggestion</option>
                    <option value="Leave Inquiry">📅 Leave Inquiry / Allowance Request</option>
                    <option value="Payroll Inquiry">💵 Payroll / Compensation Inquiry</option>
                    <option value="Workplace Suggestion">🏢 Workplace / Facilities Concern</option>
                    <option value="Confidential HR Concern">🛡️ Confidential HR Concern</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-green-900 mb-1.5">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief title of your feedback or inquiry..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-xs text-green-950 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-green-900 mb-1.5">
                    Message Details
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your feedback, inquiry, or suggestion clearly here..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-xs text-green-950 focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Sender Option */}
                <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-green-800" />
                    <div>
                      <p className="text-xs font-bold text-green-900">Submit Anonymously</p>
                      <p className="text-[10px] text-gray-500">Hide your name and email address from HR view</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-green-800 rounded border-gray-300 focus:ring-yellow-400 cursor-pointer"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-green-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-900 text-yellow-400 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-green-800 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} />
                    {submitting ? 'Submitting...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {feedbackQuery.isPending ? (
                  <p className="py-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                    Loading your messages...
                  </p>
                ) : feedbackQuery.error ? (
                  <p className="py-12 text-center text-xs font-bold text-red-700">
                    {feedbackQuery.error instanceof ApiRequestError
                      ? feedbackQuery.error.message
                      : 'Failed to load your sent messages.'}
                  </p>
                ) : myFeedbacks.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <MessageCircle size={36} className="mx-auto opacity-30 text-green-900" />
                    <p className="text-xs font-bold uppercase tracking-wider">No feedback sent yet</p>
                    <p className="text-[11px]">Your sent messages and HR responses will appear here.</p>
                  </div>
                ) : (
                  myFeedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-900 text-[10px] font-black uppercase rounded-full">
                          {fb.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                            fb.status === 'Resolved' ? 'bg-green-800 text-yellow-400' :
                            fb.status === 'Under Review' ? 'bg-yellow-400 text-green-950' :
                            'bg-blue-100 text-blue-900'
                          }`}>
                            {fb.status}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-black text-xs text-green-950">{fb.subject}</h4>
                      <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                        {fb.message}
                      </p>

                      {fb.adminResponse && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200/60 rounded-xl space-y-1 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-green-900 uppercase">
                            <Clock size={12} className="text-yellow-600" />
                            <span>HR / Admin Response:</span>
                          </div>
                          <p className="text-xs text-green-950 font-medium leading-relaxed">
                            {fb.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
