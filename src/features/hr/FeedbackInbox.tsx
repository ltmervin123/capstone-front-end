import React, { useState } from 'react';
import { MessageSquare, Inbox, Search, Filter, CheckCircle2, Clock, Trash2, Send, ShieldAlert, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { type FeedbackItem } from '../../types/types';
import { Logo } from '../../assets/common/Logo.tsx';
import { motion, AnimatePresence } from 'motion/react';

export const FeedbackInbox: React.FC = () => {
  const currentUser = storageService.getCurrentUser();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => storageService.getFeedback());
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Response Modal State
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'New' | 'Under Review' | 'Resolved'>('Resolved');

  const reloadFeedbacks = () => {
    setFeedbacks(storageService.getFeedback());
  };

  const filtered = feedbacks.filter(f => {
    const matchesSearch = f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || f.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalCount = feedbacks.length;
  const newCount = feedbacks.filter(f => f.status === 'New').length;
  const reviewCount = feedbacks.filter(f => f.status === 'Under Review').length;
  const resolvedCount = feedbacks.filter(f => f.status === 'Resolved').length;

  const handleOpenReplyModal = (f: FeedbackItem) => {
    setSelectedFeedback(f);
    setResponseText(f.adminResponse || '');
    setResponseStatus(f.status);
  };

  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;

    const updated: FeedbackItem = {
      ...selectedFeedback,
      adminResponse: responseText.trim(),
      status: responseStatus,
      updatedAt: Date.now()
    };

    storageService.saveFeedback(updated);
    reloadFeedbacks();
    setSelectedFeedback(null);
    setResponseText('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback message?')) {
      storageService.deleteFeedback(id);
      reloadFeedbacks();
    }
  };

  const handleQuickStatusChange = (f: FeedbackItem, newStatus: 'New' | 'Under Review' | 'Resolved') => {
    const updated: FeedbackItem = {
      ...f,
      status: newStatus,
      updatedAt: Date.now()
    };
    storageService.saveFeedback(updated);
    reloadFeedbacks();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">Feedback Inbox</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">Employee Inquiries & Suggestions</span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900 rounded-full shadow-sm">
                <MessageSquare size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">HR / ADMIN PORTAL</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={reloadFeedbacks}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-green-900 font-bold text-xs rounded-xl shadow-xs transition-all self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={14} />
          Refresh Messages
        </button>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Feedback</p>
            <p className="text-2xl font-black text-green-950 mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-800 rounded-xl">
            <Inbox size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">New Unread</p>
            <p className="text-2xl font-black text-blue-900 mt-1">{newCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
            <MessageSquare size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-yellow-600">Under Review</p>
            <p className="text-2xl font-black text-yellow-800 mt-1">{reviewCount}</p>
          </div>
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-xl">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-green-700">Resolved</p>
            <p className="text-2xl font-black text-green-900 mt-1">{resolvedCount}</p>
          </div>
          <div className="p-3 bg-green-100 text-green-900 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback subject, message, sender..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-green-950 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-green-900 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-green-950 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="New">New Only</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-green-950 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="General Feedback / Suggestion">General Feedback</option>
            <option value="Leave Inquiry">Leave Inquiry</option>
            <option value="Payroll Inquiry">Payroll Inquiry</option>
            <option value="Workplace Suggestion">Workplace Concern</option>
            <option value="Confidential HR Concern">Confidential Concern</option>
          </select>
        </div>
      </div>

      {/* Feedback Messages List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3">
            <Inbox size={48} className="mx-auto text-gray-300" />
            <h3 className="text-sm font-black uppercase tracking-wider text-green-950">No Messages Found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">There are no feedback submissions matching your current filter criteria.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md ${
                item.status === 'New' ? 'border-l-4 border-l-blue-600 border-gray-150' : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                    item.isAnonymous ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-900'
                  }`}>
                    {item.isAnonymous ? 'AN' : item.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-green-950">{item.senderName}</h4>
                      {item.isAnonymous && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-black uppercase rounded-md flex items-center gap-1">
                          <ShieldAlert size={10} /> Anonymous
                        </span>
                      )}
                      {item.senderEmployeeId && (
                        <span className="text-[10px] font-mono text-gray-400 font-bold">({item.senderEmployeeId})</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">{item.senderEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-50 text-green-900 text-[10px] font-black uppercase rounded-full border border-green-100">
                    {item.category}
                  </span>
                  <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                    item.status === 'Resolved' ? 'bg-green-800 text-yellow-400' :
                    item.status === 'Under Review' ? 'bg-yellow-400 text-green-950' :
                    'bg-blue-100 text-blue-900'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div className="py-4 space-y-2">
                <h3 className="font-black text-sm text-green-900 uppercase tracking-tight">{item.subject}</h3>
                <p className="text-xs text-gray-700 bg-gray-50/70 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {item.message}
                </p>
              </div>

              {/* Existing Response preview if any */}
              {item.adminResponse && (
                <div className="p-3 bg-yellow-50/80 border border-yellow-200/60 rounded-xl space-y-1 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-green-900">Recorded HR/Admin Response:</p>
                  <p className="text-xs text-green-950 font-medium leading-relaxed">{item.adminResponse}</p>
                </div>
              )}

              {/* Card Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Change Status:</span>
                  <button
                    onClick={() => handleQuickStatusChange(item, 'New')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border cursor-pointer ${
                      item.status === 'New' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    New
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange(item, 'Under Review')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border cursor-pointer ${
                      item.status === 'Under Review' ? 'bg-yellow-400 text-green-950 border-yellow-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Review
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange(item, 'Resolved')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border cursor-pointer ${
                      item.status === 'Resolved' ? 'bg-green-900 text-yellow-400 border-green-900' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Resolved
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenReplyModal(item)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-900 text-yellow-400 font-black text-xs uppercase rounded-xl shadow-xs hover:bg-green-800 transition-all cursor-pointer"
                  >
                    <Send size={12} />
                    {item.adminResponse ? 'Edit Response' : 'Reply / Resolve'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeedback(null)}
              className="absolute inset-0 bg-green-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-black text-green-950 uppercase tracking-tight">Reply to Feedback</h3>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <p className="font-bold text-green-900">{selectedFeedback.subject}</p>
                  <p className="text-gray-500 text-[11px] mt-1">{selectedFeedback.message}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-green-900 mb-1">
                    HR / Admin Official Response
                  </label>
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type official reply or resolution details for the employee..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-green-950 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-green-900 mb-1">
                    Update Status
                  </label>
                  <select
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-green-950 focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveResponse}
                  className="px-5 py-2 bg-green-900 text-yellow-400 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-green-800 transition-all cursor-pointer"
                >
                  Save & Notify Employee
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
