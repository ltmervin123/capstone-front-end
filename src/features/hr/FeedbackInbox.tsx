import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Loader2,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  useDeleteFeedback,
  useFeedbackQuery,
  useReplyToFeedback,
  useUpdateFeedbackStatus,
} from '../../hooks/useFeedback';
import {
  FEEDBACK_CATEGORIES,
  replyFeedbackFormSchema,
} from '../../schemas/feedback.schema';
import { ApiRequestError } from '../../utils/apiClient';
import { Logo } from '../../assets/common/Logo.tsx';
import { type FeedbackItem } from '../../types/types.ts';
import { motion, AnimatePresence } from 'motion/react';

type StatusTab = 'All' | 'New' | 'Under Review' | 'Resolved';

interface FeedbackInboxCardProps {
  item: FeedbackItem;
  index: number;
  onStatusChange: (item: FeedbackItem, status: FeedbackItem['status']) => void;
  onReply: (item: FeedbackItem) => void;
  onDeleteRequest: (item: FeedbackItem) => void;
}

const FeedbackInboxCard = memo(function FeedbackInboxCard({
  item,
  index,
  onStatusChange,
  onReply,
  onDeleteRequest,
}: FeedbackInboxCardProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getStatusBadge = (status: FeedbackItem['status']) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Under Review':
        return 'bg-amber-100 text-amber-900';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(index * 0.04, 0.3) }}
      className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
    >
      <div>
        {/* Header Row: Sender Details & Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            {item.senderProfilePicture && !item.isAnonymous ? (
              <img
                src={item.senderProfilePicture}
                alt={item.senderName}
                className="w-10 h-10 rounded-xl object-cover shadow-inner shrink-0"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  item.isAnonymous
                    ? 'bg-stone-100 text-stone-600'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {item.isAnonymous ? 'AN' : item.senderName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm text-green-950">
                  {item.senderName}
                </h3>
                {item.isAnonymous && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-[11px] font-semibold rounded-md">
                    <ShieldAlert size={12} className="text-amber-600" />
                    Anonymous
                  </span>
                )}
                {item.senderEmployeeId && (
                  <span className="text-xs font-mono text-stone-500 font-medium">
                    ({item.senderEmployeeId})
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium">{item.senderEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-lg border border-stone-200/60">
              {item.category}
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getStatusBadge(
                item.status,
              )}`}
            >
              {item.status}
            </span>
            <span className="text-xs text-stone-500 font-medium tabular-nums">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Message Subject & Body */}
        <div className="py-4 space-y-2">
          <h4 className="font-bold text-base text-green-950 tracking-tight">
            {item.subject}
          </h4>
          <div className="text-xs sm:text-sm text-stone-700 bg-stone-50/70 p-4 rounded-xl border border-stone-200/60 whitespace-pre-wrap leading-relaxed font-sans">
            {item.message}
          </div>
        </div>

        {/* Recorded Official HR Response */}
        {item.adminResponse && (
          <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <CheckCircle2 size={14} className="text-amber-600" />
              <span>Official HR Response</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed pl-5">
              {item.adminResponse}
            </p>
          </div>
        )}
      </div>

      {/* Action Footer: Status Switcher & Reply / Delete buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-600 mr-1">
            Status:
          </span>
          <button
            type="button"
            onClick={() => onStatusChange(item, 'New')}
            aria-pressed={item.status === 'New'}
            className={`min-h-[34px] px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
              item.status === 'New'
                ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold shadow-2xs'
                : 'bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100 hover:text-green-950'
            }`}
          >
            New
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(item, 'Under Review')}
            aria-pressed={item.status === 'Under Review'}
            className={`min-h-[34px] px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
              item.status === 'Under Review'
                ? 'bg-amber-100 text-amber-900 border-amber-200 font-bold shadow-2xs'
                : 'bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100 hover:text-green-950'
            }`}
          >
            Under Review
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(item, 'Resolved')}
            aria-pressed={item.status === 'Resolved'}
            className={`min-h-[34px] px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
              item.status === 'Resolved'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold shadow-2xs'
                : 'bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100 hover:text-green-950'
            }`}
          >
            Resolved
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReply(item)}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[36px] bg-green-900 hover:bg-green-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
          >
            <Send size={13} className="text-amber-300" />
            <span>{item.adminResponse ? 'Edit Response' : 'Reply & Resolve'}</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(item)}
            aria-label={`Delete message from ${item.senderName}`}
            title="Delete feedback message"
            className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:outline-hidden"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
});

export const FeedbackInbox: React.FC = () => {
  const feedbackQuery = useFeedbackQuery();
  const updateStatus = useUpdateFeedbackStatus();
  const replyToFeedback = useReplyToFeedback();
  const deleteFeedback = useDeleteFeedback();
  const mutateStatus = updateStatus.mutate;
  const mutateDelete = deleteFeedback.mutate;
  const rawFeedbacks = feedbackQuery.data;
  const feedbacks = useMemo(() => rawFeedbacks ?? [], [rawFeedbacks]);

  const listError =
    feedbackQuery.error instanceof ApiRequestError
      ? feedbackQuery.error.message
      : feedbackQuery.error instanceof Error
        ? feedbackQuery.error.message
        : feedbackQuery.error
          ? 'Failed to load feedback messages.'
          : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusTab>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [deletingFeedback, setDeletingFeedback] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'New' | 'Under Review' | 'Resolved'>('Resolved');
  const [actionError, setActionError] = useState<string | null>(null);

  const actionErrorMessage = (err: unknown) =>
    err instanceof ApiRequestError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'Request failed. Please try again.';

  const closeReplyModal = useCallback(() => {
    setSelectedFeedback(null);
    setResponseText('');
    setActionError(null);
  }, []);

  const openReplyModal = useCallback((item: FeedbackItem) => {
    setSelectedFeedback(item);
    setResponseText(item.adminResponse || '');
    setResponseStatus(item.status);
    setActionError(null);
  }, []);

  const handleStatusChange = useCallback(
    (item: FeedbackItem, status: FeedbackItem['status']) => {
      if (item.status === status) return;
      setActionError(null);
      mutateStatus(
        { id: item.id, status },
        { onError: (err) => setActionError(actionErrorMessage(err)) },
      );
    },
    [mutateStatus],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingFeedback) return;
    setActionError(null);
    mutateDelete(deletingFeedback.id, {
      onSuccess: () => setDeletingFeedback(null),
      onError: (err) => {
        setActionError(actionErrorMessage(err));
        setDeletingFeedback(null);
      },
    });
  }, [deletingFeedback, mutateDelete]);

  const handleSaveResponse = () => {
    if (!selectedFeedback || replyToFeedback.isPending) return;

    const parsed = replyFeedbackFormSchema.safeParse({
      adminResponse: responseText,
      status: responseStatus,
    });

    if (!parsed.success) {
      setActionError(
        parsed.error.issues[0]?.message ??
          'Please enter a response for the employee.',
      );
      return;
    }

    setActionError(null);
    replyToFeedback.mutate(
      {
        id: selectedFeedback.id,
        adminResponse: parsed.data.adminResponse,
        status: parsed.data.status,
      },
      {
        onSuccess: () => closeReplyModal(),
        onError: (err) => setActionError(actionErrorMessage(err)),
      },
    );
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedFeedback) closeReplyModal();
        if (deletingFeedback) setDeletingFeedback(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFeedback, deletingFeedback, closeReplyModal]);

  // Derived filtered items and counts (memoized for performance)
  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        f.subject.toLowerCase().includes(query) ||
        f.message.toLowerCase().includes(query) ||
        f.senderName.toLowerCase().includes(query) ||
        (f.senderEmployeeId && f.senderEmployeeId.toLowerCase().includes(query)) ||
        f.category.toLowerCase().includes(query);
      const matchesStatus =
        filterStatus === 'All' || f.status === filterStatus;
      const matchesCategory =
        filterCategory === 'All' || f.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [feedbacks, searchQuery, filterStatus, filterCategory]);

  const totalCount = feedbacks.length;
  const newCount = useMemo(
    () => feedbacks.filter((f) => f.status === 'New').length,
    [feedbacks],
  );
  const reviewCount = useMemo(
    () => feedbacks.filter((f) => f.status === 'Under Review').length,
    [feedbacks],
  );
  const resolvedCount = useMemo(
    () => feedbacks.filter((f) => f.status === 'Resolved').length,
    [feedbacks],
  );

  const statCards = [
    {
      label: 'Total Feedback',
      subtitle: 'Logged submissions',
      value: totalCount,
      icon: Inbox,
      iconBg: 'bg-emerald-50 text-emerald-800',
    },
    {
      label: 'New Unread',
      subtitle: 'Awaiting initial review',
      value: newCount,
      icon: MessageSquare,
      iconBg: 'bg-blue-50 text-blue-800',
    },
    {
      label: 'Under Review',
      subtitle: 'In active review',
      value: reviewCount,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-900',
    },
    {
      label: 'Resolved',
      subtitle: 'Closed & addressed',
      value: resolvedCount,
      icon: CheckCircle2,
      iconBg: 'bg-green-50 text-green-800',
    },
  ];

  const statusTabs: { id: StatusTab; label: string; count: number }[] = [
    { id: 'All', label: 'All Inquiries', count: totalCount },
    { id: 'New', label: 'New', count: newCount },
    { id: 'Under Review', label: 'Under Review', count: reviewCount },
    { id: 'Resolved', label: 'Resolved', count: resolvedCount },
  ];

  if (feedbackQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-green-800" />
        <span className="text-sm font-medium text-stone-600">
          Loading feedback records...
        </span>
      </div>
    );
  }

  if (listError && feedbacks.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-700">
          {listError}
        </p>
        <button
          type="button"
          onClick={() => feedbackQuery.refetch()}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Page Header matching Dashboard */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              Feedback & Inquiries Inbox
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Human Resources Information System
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <MessageSquare size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  HR Office
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => void feedbackQuery.refetch()}
            disabled={feedbackQuery.isFetching}
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 bg-white border border-stone-200/80 hover:bg-stone-50 hover:text-green-950 rounded-xl px-3.5 py-2 shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                feedbackQuery.isFetching
                  ? 'animate-spin text-green-800'
                  : 'text-stone-500'
              }
            />
            <span>
              {feedbackQuery.isFetching ? 'Refreshing...' : 'Refresh Messages'}
            </span>
          </button>
        </div>
      </header>

      {/* Global Action / Sync Error Banner */}
      {actionError && !selectedFeedback && !deletingFeedback && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-800 font-medium">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <section
        aria-label="Key feedback metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group transition-all"
          >
            <div
              className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}
            >
              <stat.icon size={22} />
            </div>
            <h2 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
              {stat.value}
            </h2>
            <p className="text-sm font-bold text-stone-800 mt-2">
              {stat.label}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
          </div>
        ))}
      </section>

      {/* Operational Overview & Inquiries Section */}
      <section aria-label="Operational inquiries and feedback" className="mt-8 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <Inbox size={22} className="text-amber-500" />
              Inquiries & Responses
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Review staff submissions, investigate concerns, and record official HR administrative resolutions.
            </p>
          </div>

          {/* Segmented Tab Filter Switcher */}
          <div
            role="tablist"
            aria-label="Filter feedback records by status"
            className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {statusTabs.map((tab) => {
              const isActive = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                    isActive
                      ? 'bg-green-900 text-amber-300 shadow-xs'
                      : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
                  }`}
                >
                  {tab.label}{' '}
                  <span className="text-[11px] opacity-80 tabular-nums">
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject, message, sender, or ID..."
              aria-label="Search feedback messages"
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 placeholder:text-stone-400 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus:outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={14} className="text-green-900 shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filter by feedback category"
                className="px-3.5 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus:outline-hidden transition-all cursor-pointer w-full md:w-auto"
              >
                <option value="All">All Categories</option>
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Cards List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200/80 text-center space-y-3 shadow-xs">
              <Inbox size={40} className="mx-auto text-stone-400" />
              <h3 className="text-sm font-bold text-green-950">
                No Feedback Messages Found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                There are no feedback submissions matching your selected filter criteria.
              </p>
            </div>
          ) : (
            filtered.map((item, index) => (
              <FeedbackInboxCard
                key={item.id}
                item={item}
                index={index}
                onStatusChange={handleStatusChange}
                onReply={openReplyModal}
                onDeleteRequest={(target) => setDeletingFeedback(target)}
              />
            ))
          )}
        </div>
      </section>

      {/* Reply Modal Dialog */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReplyModal}
              className="absolute inset-0 bg-green-950/75 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reply-dialog-title"
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200/80 p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3
                  id="reply-dialog-title"
                  className="text-base font-bold text-green-950 tracking-tight"
                >
                  Reply to Employee Feedback
                </h3>
                <button
                  type="button"
                  onClick={closeReplyModal}
                  aria-label="Close dialog"
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-800 font-medium">
                    <AlertCircle size={16} className="shrink-0 text-red-600" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-green-950">
                      {selectedFeedback.subject}
                    </p>
                    <span className="text-[11px] text-stone-500 font-medium">
                      From {selectedFeedback.senderName}
                    </span>
                  </div>
                  <p className="text-stone-600 line-clamp-3 leading-relaxed">
                    {selectedFeedback.message}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="admin-reply-textarea"
                    className="block text-xs font-bold text-stone-700 mb-1.5"
                  >
                    Official HR Response
                  </label>
                  <textarea
                    id="admin-reply-textarea"
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter official resolution details or response for the employee..."
                    className="w-full p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 placeholder:text-stone-400 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="response-status-select"
                    className="block text-xs font-bold text-stone-700 mb-1.5"
                  >
                    Update Status
                  </label>
                  <select
                    id="response-status-select"
                    value={responseStatus}
                    onChange={(e) =>
                      setResponseStatus(
                        e.target.value as 'New' | 'Under Review' | 'Resolved',
                      )
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={replyToFeedback.isPending}
                  onClick={handleSaveResponse}
                  className="px-5 py-2.5 bg-green-900 hover:bg-green-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden disabled:opacity-50"
                >
                  {replyToFeedback.isPending
                    ? 'Saving Response...'
                    : 'Save & Notify Employee'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accessible Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingFeedback(null)}
              className="absolute inset-0 bg-green-950/75 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200/80 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3
                    id="delete-dialog-title"
                    className="text-base font-bold text-green-950"
                  >
                    Delete Feedback Message
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Permanent action
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Are you sure you want to delete this feedback message from{' '}
                <span className="font-bold text-green-950">
                  {deletingFeedback.senderName}
                </span>{' '}
                regarding{' '}
                <span className="font-semibold text-stone-800">
                  &ldquo;{deletingFeedback.subject}&rdquo;
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDeletingFeedback(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteFeedback.isPending}
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:outline-hidden disabled:opacity-50"
                >
                  {deleteFeedback.isPending ? 'Deleting...' : 'Delete Message'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
