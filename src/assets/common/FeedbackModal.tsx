import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  MessageCircle,
  Clock,
  Bell,
  Loader2,
} from 'lucide-react';
import {
  useCreateFeedback,
  useFeedbackQuery,
  useMarkFeedbackNotificationsRead,
} from '../../hooks/useFeedback';
import {
  createFeedbackFormSchema,
  FEEDBACK_CATEGORIES,
} from '../../schemas/feedback.schema';
import { ApiRequestError } from '../../utils/apiClient';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [category, setCategory] =
    useState<(typeof FEEDBACK_CATEGORIES)[number]>(
      'General Feedback / Suggestion'
    );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const feedbackQuery = useFeedbackQuery({
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false,
  });
  const createFeedback = useCreateFeedback();
  const markNotificationsRead = useMarkFeedbackNotificationsRead();
  const myFeedbacks = feedbackQuery.data ?? [];
  const submitting = createFeedback.isPending;
  const unreadCount = myFeedbacks.filter(
    (item) => item.hasUnreadNotification
  ).length;
  const viewedHistoryRef = useRef(false);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      viewedHistoryRef.current = true;
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen && viewedHistoryRef.current) {
      viewedHistoryRef.current = false;
      markNotificationsRead.mutate();
    }
  }, [isOpen, markNotificationsRead]);

  const handleClose = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

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
      setErrorMessage(
        parsed.error.issues[0]?.message ?? 'Please complete the feedback form.'
      );
      return;
    }

    createFeedback.mutate(parsed.data, {
      onSuccess: () => {
        setSuccessMessage(
          'Thank you! Your feedback has been sent directly to HR and Admin.'
        );
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
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          onClick={handleClose}
          className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col h-[560px] sm:h-[620px] max-h-[calc(100vh-2rem)] relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-200/80 flex items-start justify-between gap-4 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3
                    id="feedback-modal-title"
                    className="font-bold text-lg text-green-950 tracking-tight"
                  >
                    Employee Feedback Box
                  </h3>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    Northern Mindanao Colleges, Inc. • HR & Admin Communication
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-navigation tabs */}
            <div className="px-6 py-3 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <div
                role="tablist"
                aria-label="Feedback views"
                className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'submit'}
                  onClick={() => setActiveTab('submit')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                    activeTab === 'submit'
                      ? 'bg-white text-green-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  Send Feedback
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                    activeTab === 'history'
                      ? 'bg-white text-green-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  <span>My Sent Messages</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      unreadCount > 0
                        ? 'bg-amber-400 text-green-950'
                        : 'bg-stone-300 text-stone-700'
                    }`}
                  >
                    {myFeedbacks.length}
                  </span>
                </button>
              </div>

              {unreadCount > 0 && activeTab !== 'history' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200/60 text-[11px] font-bold hover:bg-amber-200/70 transition-colors cursor-pointer"
                >
                  <Bell size={12} className="text-amber-700" />
                  <span>
                    {unreadCount} new {unreadCount === 1 ? 'update' : 'updates'}
                  </span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            {activeTab === 'submit' ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 max-h-[65vh]">
                  {errorMessage && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs shadow-xs"
                    >
                      <AlertCircle
                        size={16}
                        className="shrink-0 text-red-600 mt-0.5"
                      />
                      <div>
                        <span className="font-bold">Submission error:</span>{' '}
                        {errorMessage}
                      </div>
                    </div>
                  )}

                  {successMessage && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs shadow-xs"
                    >
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-emerald-600 mt-0.5"
                      />
                      <div>
                        <span className="font-bold">Sent successfully:</span>{' '}
                        {successMessage}
                      </div>
                    </div>
                  )}

                  {/* Category Dropdown */}
                  <div>
                    <label
                      htmlFor="feedback-category-select"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      Feedback Category
                    </label>
                    <select
                      id="feedback-category-select"
                      value={category}
                      onChange={(e) =>
                        setCategory(
                          e.target.value as (typeof FEEDBACK_CATEGORIES)[number]
                        )
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all cursor-pointer"
                    >
                      <option value="General Feedback / Suggestion">
                        General Feedback / Suggestion
                      </option>
                      <option value="Leave Inquiry">
                        Leave Inquiry / Allowance Request
                      </option>
                      <option value="Payroll Inquiry">
                        Payroll / Compensation Inquiry
                      </option>
                      <option value="Workplace Suggestion">
                        Workplace / Facilities Concern
                      </option>
                      <option value="Confidential HR Concern">
                        Confidential HR Concern
                      </option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="feedback-subject-input"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      Subject / Title
                    </label>
                    <input
                      id="feedback-subject-input"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of your feedback or inquiry..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="feedback-message-input"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      Message Details
                    </label>
                    <textarea
                      id="feedback-message-input"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Provide details regarding your inquiry, idea, or concern..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400 resize-none"
                    />
                  </div>

                  {/* Anonymous Toggle Card */}
                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg shrink-0">
                        <ShieldAlert size={16} />
                      </div>
                      <div>
                        <label
                          htmlFor="feedback-anonymous-check"
                          className="text-xs font-bold text-green-950 cursor-pointer block"
                        >
                          Submit Anonymously
                        </label>
                        <p className="text-[11px] text-stone-500 font-medium">
                          Hide your name and email address from HR view
                        </p>
                      </div>
                    </div>
                    <input
                      id="feedback-anonymous-check"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-green-800 rounded border-stone-300 focus:ring-green-800 cursor-pointer accent-green-900"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-stone-200/80 bg-stone-50/50 flex flex-col-reverse sm:flex-row gap-2.5 justify-end shrink-0 mt-auto">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-4 py-2.5 bg-white border border-stone-200/80 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="p-6 overflow-y-auto space-y-3 flex-1 min-h-0 max-h-[65vh] flex flex-col">
                  {feedbackQuery.isPending ? (
                    <div className="my-auto py-12 flex flex-col items-center justify-center gap-2 text-stone-500">
                      <Loader2 size={24} className="animate-spin text-green-800" />
                      <span className="text-xs font-semibold">
                        Loading your messages...
                      </span>
                    </div>
                  ) : feedbackQuery.error ? (
                    <div
                      role="alert"
                      className="my-auto p-4 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs font-semibold text-center"
                    >
                      {feedbackQuery.error instanceof ApiRequestError
                        ? feedbackQuery.error.message
                        : 'Failed to load your sent messages.'}
                    </div>
                  ) : myFeedbacks.length === 0 ? (
                    <div className="my-auto py-12 px-4 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 space-y-2">
                      <MessageCircle
                        size={32}
                        className="mx-auto text-stone-400"
                      />
                      <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        No feedback sent yet
                      </p>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        Your sent messages and official HR responses will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    myFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className={`p-4 bg-white rounded-xl border space-y-3 transition-all ${
                          fb.hasUnreadNotification
                            ? 'border-amber-400 ring-1 ring-amber-300 shadow-xs'
                            : 'border-stone-200/80 shadow-2xs hover:border-stone-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold rounded-full">
                            {fb.category}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {fb.hasUnreadNotification ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-green-950 text-[10px] font-black uppercase rounded-full shadow-2xs">
                                <Bell size={10} />
                                New update
                              </span>
                            ) : fb.employeeNotified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-800 text-amber-300 text-[10px] font-bold uppercase rounded-full">
                                <CheckCircle2 size={10} />
                                Notified
                              </span>
                            ) : null}
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                fb.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : fb.status === 'Under Review'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200/60'
                              }`}
                            >
                              {fb.status}
                            </span>
                            <span className="text-[11px] text-stone-400 font-medium tabular-nums">
                              {new Date(fb.createdAt).toLocaleDateString(
                                'en-PH',
                                {
                                  timeZone: 'Asia/Manila',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-green-950">
                            {fb.subject}
                          </h4>
                          <div className="mt-1.5 text-xs text-stone-700 bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 whitespace-pre-wrap leading-relaxed">
                            {fb.message}
                          </div>
                        </div>

                        {fb.adminResponse && (
                          <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                              <Clock size={12} className="text-amber-700" />
                              <span>HR / Admin Response</span>
                            </div>
                            <p className="text-xs text-stone-800 font-medium leading-relaxed pl-4">
                              {fb.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* History Footer */}
                <div className="p-6 border-t border-stone-200/80 bg-stone-50/50 flex items-center justify-between shrink-0 mt-auto">
                  <span className="text-xs text-stone-500 font-medium">
                    {myFeedbacks.length}{' '}
                    {myFeedbacks.length === 1 ? 'message' : 'messages'} recorded
                  </span>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-white border border-stone-200/80 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
