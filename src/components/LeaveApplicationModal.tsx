import React, { useState } from 'react';
import { CalendarDays, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
// import { useCreateLeave } from '../../hooks/useLeaves';
// import { createLeaveFormSchema } from '../../schemas/leave.schema';
// import { ApiRequestError } from '../../utils/apiClient';
// import { Logo } from '../../assets/common/Logo.tsx';
// import { LeaveType } from '../../types/types';
import { motion, AnimatePresence } from 'motion/react';
import { useCreateLeave } from '../hooks/useLeaves';
import { LeaveType } from '../types/types';
import { createLeaveFormSchema } from '../schemas/leave.schema';
import { ApiRequestError } from '../utils/apiClient';
import { Logo } from '../assets/common/Logo';

interface LeaveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingCredits: number;
  employeeName: string;
  employeeDepartment: string;
  employeeNumber: string;
}

export const LeaveApplicationModal: React.FC<LeaveApplicationModalProps> = ({
  isOpen,
  onClose,
  remainingCredits,
  employeeName,
  employeeDepartment,
  employeeNumber,
}) => {
  const createLeave = useCreateLeave();

  const [leaveType, setLeaveType] = useState<LeaveType>(
    LeaveType.LEAVE_CREDITS
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [customDays, setCustomDays] = useState<number | null>(null);

  const resetForm = () => {
    setLeaveType(LeaveType.LEAVE_CREDITS);
    setStartDate('');
    setEndDate('');
    setReason('');
    setTimeFrom('');
    setTimeTo('');
    setCustomDays(null);
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Number.isNaN(diffDays) ? 0 : diffDays;
  };

  const requestedDays = customDays || calculateDays();

  const handleFileLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeNumber) {
      setFormError('Your account is not linked to an employee record.');
      return;
    }

    const parsed = createLeaveFormSchema.safeParse({
      employeeNumber,
      type: leaveType,
      startDate,
      endDate,
      numberOfDays: requestedDays,
      timeFrom,
      timeTo,
      reason,
    });

    if (!parsed.success) {
      setFormError(
        parsed.error.issues.map((issue) => issue.message).join(', ')
      );
      return;
    }

    if (
      parsed.data.type === LeaveType.LEAVE_CREDITS &&
      parsed.data.numberOfDays > remainingCredits
    ) {
      setFormError(
        `Leave Limit Reached: You are requesting ${parsed.data.numberOfDays} day(s), but only have ${remainingCredits} leave credit(s) remaining for this year.`
      );
      return;
    }

    try {
      await createLeave.mutateAsync(parsed.data);
      handleClose();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to submit leave request.';
      setFormError(message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-green-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[32px] w-full max-w-3xl border border-green-50 shadow-2xl overflow-hidden flex flex-col my-8"
          >
            {/* Modal Control Header */}
            <div className="bg-green-905 px-8 py-4 flex items-center justify-between text-white border-b border-green-900">
              <div className="flex items-center gap-3">
                <FileText className="text-yellow-400" size={20} />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Leave of Absence Application
                  </h3>
                  <p className="text-[9px] text-green-200 font-bold uppercase tracking-widest">
                    FM-NORMI-HRDO-020 Official Template
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body - Document Form */}
            <form
              onSubmit={(e) => void handleFileLeave(e)}
              className="p-8 space-y-6 overflow-y-auto max-h-[80vh]"
            >
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-2xl font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Leave Balance Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-green-50/80 rounded-2xl border border-green-200 text-xs gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-green-800 shrink-0" />
                  <span className="font-extrabold text-green-950 uppercase tracking-tight">
                    Leave Credits Balance:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-green-900 bg-white px-3 py-1 rounded-xl border border-green-200 shadow-2xs">
                    {remainingCredits}.0 Days Left
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">
                    (Max 15.0 Days/Year Limit)
                  </span>
                </div>
              </div>

              {/* Physical Document Form Wrapper */}
              <div className="border-2 border-green-900 bg-white text-black font-sans shadow-lg rounded-2xl overflow-hidden">
                {/* Letterhead Header Grid */}
                <div className="grid grid-cols-12 border-b border-green-900/40">
                  {/* Logo Section */}
                  <div className="col-span-3 md:col-span-2 flex flex-col items-center justify-center border-r border-green-900/30 p-3 bg-white">
                    <div className="w-16 h-16 rounded-full border border-green-800 flex items-center justify-center p-1 bg-white relative shadow-xs">
                      <Logo className="w-14 h-14" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-green-900 mt-1.5 font-mono">
                      NORMI
                    </span>
                  </div>

                  {/* School Info Section */}
                  <div className="col-span-9 md:col-span-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-green-900/30">
                    <div className="bg-green-900 text-yellow-400 font-black text-center py-1.5 text-xs px-2 leading-tight uppercase font-mono tracking-wide">
                      NORTHERN MINDANAO COLLEGES, INC.
                    </div>
                    <div className="p-2.5 text-[9px] text-gray-700 font-bold leading-tight flex flex-col justify-center">
                      <div className="text-[10px] font-black text-green-950">
                        City of Cabadbaran
                      </div>
                      <div className="text-green-800 font-semibold">
                        (085) 818-5051 / 818-5510
                      </div>
                      <div className="text-green-900 font-black text-[9px] uppercase mt-1 border-t border-green-900/10 pt-1 tracking-wider">
                        HUMAN RESOURCE & DEVELOPMENT OFFICE
                      </div>
                    </div>
                  </div>

                  {/* ISO Document control Section */}
                  <div className="col-span-12 md:col-span-4 flex flex-col text-[8px] font-bold border-t md:border-t-0 border-green-900/30">
                    <div className="border-b border-green-900/30 px-2.5 py-1.5 flex justify-between bg-green-50/20">
                      <span className="text-green-850 uppercase tracking-tight font-black">
                        DOCUMENT CODE NUMBER
                      </span>
                      <span className="font-mono text-[9px] font-black text-green-950">
                        FM-NORMI-HRDO-020
                      </span>
                    </div>
                    <div className="grid grid-cols-4 h-full text-center divide-x divide-green-900/30">
                      <div className="flex flex-col justify-between p-1.5 bg-white">
                        <span className="text-[6.5px] text-gray-500 uppercase leading-none">
                          ISSUE STATUS
                        </span>
                        <span className="font-mono font-black text-green-950 text-[9px]">
                          01
                        </span>
                      </div>
                      <div className="flex flex-col justify-between p-1.5 bg-white">
                        <span className="text-[6.5px] text-gray-500 uppercase leading-none">
                          REV. NO.
                        </span>
                        <span className="font-mono font-black text-green-950 text-[9px]">
                          00
                        </span>
                      </div>
                      <div className="flex flex-col justify-between p-1.5 bg-white">
                        <span className="text-[6.5px] text-gray-500 uppercase leading-none font-sans">
                          EFFECTIVE DATE
                        </span>
                        <span className="font-mono font-black text-green-950 text-[9px] whitespace-nowrap">
                          12.12.2022
                        </span>
                      </div>
                      <div className="flex flex-col justify-between p-1.5 bg-white">
                        <span className="text-[6.5px] text-gray-500 uppercase leading-none">
                          PAGE NO.
                        </span>
                        <span className="font-mono font-black text-green-950 text-[9px]">
                          1 of 1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Title Bar */}
                <div className="bg-green-50 text-center font-black py-2.5 text-xs uppercase tracking-widest border-b border-green-900/40 text-green-950 font-mono">
                  LEAVE OF ABSENCE FORM
                </div>

                {/* Employee Metadata Fields row */}
                <div className="grid grid-cols-1 md:grid-cols-3 text-[10px] font-bold border-b border-green-900/40 divide-y md:divide-y-0 md:divide-x divide-green-900/30 bg-green-50/5">
                  {/* Name display */}
                  <div className="p-3 flex flex-col justify-center bg-white min-h-[56px]">
                    <span className="text-[8px] text-green-850 uppercase tracking-wider font-extrabold">
                      Name:
                    </span>
                    <span className="font-black text-xs text-green-950 mt-1">
                      {employeeName}
                    </span>
                  </div>

                  {/* Department / Position */}
                  <div className="p-3 flex flex-col justify-center bg-white min-h-[56px]">
                    <span className="text-[8px] text-green-850 uppercase tracking-wider font-extrabold">
                      Position / Department:
                    </span>
                    <span className="font-black text-xs text-green-950 mt-1">
                      {employeeDepartment || 'N/A'}
                    </span>
                  </div>

                  {/* Date Filed */}
                  <div className="p-3 flex flex-col justify-center bg-white min-h-[56px]">
                    <span className="text-[8px] text-green-850 uppercase tracking-wider font-extrabold">
                      Date Filed:
                    </span>
                    <span className="font-mono font-black text-xs text-green-950 mt-1">
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Section Title 2 */}
                <div className="bg-green-900 text-yellow-400 text-center font-black py-1.5 text-[9px] uppercase tracking-widest border-b border-green-900/40">
                  TO BE FILLED OUT BY EMPLOYEE
                </div>

                {/* Checkboxes Leave Types selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-green-900/40 divide-y md:divide-y-0 md:divide-x divide-green-900/30 text-[10px] font-sans">
                  {/* Left Column of options */}
                  <div className="p-4 space-y-3 bg-white">
                    <div className="font-black text-[9px] text-green-900 uppercase tracking-wider mb-1">
                      Please check (✔) one:
                    </div>

                    {/* Leave Credits */}
                    <div
                      onClick={() => setLeaveType(LeaveType.LEAVE_CREDITS)}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.LEAVE_CREDITS ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                      >
                        ✔
                      </div>
                      <span
                        className={`font-black tracking-tight ${leaveType === LeaveType.LEAVE_CREDITS ? 'text-green-950' : 'text-gray-700'}`}
                      >
                        LEAVE CREDITS
                      </span>
                    </div>

                    {/* Benefit for Woman Subgroup */}
                    <div className="pl-3 py-2 border-t border-dotted border-green-900/20">
                      <div className="font-black text-[7.5px] text-rose-850 uppercase tracking-widest mb-2 font-mono">
                        BENEFIT FOR WOMAN
                      </div>
                      <div className="space-y-2.5">
                        {/* Maternity Leave */}
                        <div
                          onClick={() => setLeaveType(LeaveType.MATERNITY)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.MATERNITY ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                          >
                            ✔
                          </div>
                          <span
                            className={`font-bold ${leaveType === LeaveType.MATERNITY ? 'text-green-950 font-black' : 'text-gray-700'}`}
                          >
                            MATERNITY LEAVE
                          </span>
                        </div>

                        {/* Leave for Victims of VAW-C */}
                        <div
                          onClick={() => setLeaveType(LeaveType.VAWC)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.VAWC ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                          >
                            ✔
                          </div>
                          <span
                            className={`font-bold ${leaveType === LeaveType.VAWC ? 'text-green-950 font-black' : 'text-gray-700'}`}
                          >
                            LEAVE FOR VICTIMS OF VAW-C
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-dotted border-green-900/20">
                      {/* Paternity Leave */}
                      <div
                        onClick={() => setLeaveType(LeaveType.PATERNITY)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.PATERNITY ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                        >
                          ✔
                        </div>
                        <span
                          className={`font-black tracking-tight ${leaveType === LeaveType.PATERNITY ? 'text-green-950' : 'text-gray-700'}`}
                        >
                          PATERNITY LEAVE
                        </span>
                      </div>

                      {/* Solo Parents Leave */}
                      <div
                        onClick={() => setLeaveType(LeaveType.SOLO_PARENT)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.SOLO_PARENT ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                        >
                          ✔
                        </div>
                        <span
                          className={`font-black tracking-tight ${leaveType === LeaveType.SOLO_PARENT ? 'text-green-950' : 'text-gray-700'}`}
                        >
                          SOLO PARENTS LEAVE
                        </span>
                      </div>

                      {/* Study Leave */}
                      <div
                        onClick={() => setLeaveType(LeaveType.STUDY)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.STUDY ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                        >
                          ✔
                        </div>
                        <span
                          className={`font-black tracking-tight ${leaveType === LeaveType.STUDY ? 'text-green-950' : 'text-gray-700'}`}
                        >
                          STUDY LEAVE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column of options */}
                  <div className="p-4 space-y-4 bg-white flex flex-col justify-start">
                    <div className="font-black text-[9px] text-green-900 uppercase tracking-wider mb-1 opacity-0 hidden md:block">
                      Spacers
                    </div>

                    {/* Special Leave */}
                    <div
                      onClick={() => setLeaveType(LeaveType.SPECIAL)}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.SPECIAL ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                      >
                        ✔
                      </div>
                      <span
                        className={`font-black tracking-tight ${leaveType === LeaveType.SPECIAL ? 'text-green-950' : 'text-gray-700'}`}
                      >
                        SPECIAL LEAVE
                      </span>
                    </div>

                    {/* Authorized Absence */}
                    <div
                      onClick={() => setLeaveType(LeaveType.AUTHORIZED_ABSENCE)}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.AUTHORIZED_ABSENCE ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                      >
                        ✔
                      </div>
                      <span
                        className={`font-black tracking-tight ${leaveType === LeaveType.AUTHORIZED_ABSENCE ? 'text-green-950' : 'text-gray-700'}`}
                      >
                        AUTHORIZED ABSENCE
                      </span>
                    </div>

                    {/* Authorized Undertime */}
                    <div
                      onClick={() =>
                        setLeaveType(LeaveType.AUTHORIZED_UNDERTIME)
                      }
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded border border-green-900 flex items-center justify-center font-black transition-all ${leaveType === LeaveType.AUTHORIZED_UNDERTIME ? 'bg-green-900 text-yellow-400' : 'bg-white text-transparent group-hover:text-gray-300'}`}
                      >
                        ✔
                      </div>
                      <span
                        className={`font-black tracking-tight ${leaveType === LeaveType.AUTHORIZED_UNDERTIME ? 'text-green-950' : 'text-gray-700'}`}
                      >
                        AUTHORIZED UNDERTIME
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date, Time, and Reasons Horizontal Grid Block */}
                <div>
                  {/* Grid Table Header row */}
                  <div className="grid grid-cols-12 border-b border-green-900/40 text-[9px] text-center font-black font-mono tracking-wider text-green-900 bg-green-50/80">
                    <div className="col-span-2 border-r border-green-900/30 py-2.5 flex items-center justify-center">
                      Number of Days
                    </div>
                    <div className="col-span-3 border-r border-green-900/30 py-1">
                      <div className="border-b border-green-900/20 pb-0.5 mb-0.5">
                        Date
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="border-r border-green-900/20 text-[8px]">
                          FROM
                        </div>
                        <div className="text-[8px]">TO</div>
                      </div>
                    </div>
                    <div className="col-span-3 border-r border-green-900/30 py-1">
                      <div className="border-b border-green-900/20 pb-0.5 mb-0.5">
                        Time
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="border-r border-green-900/20 text-[8px]">
                          FROM
                        </div>
                        <div className="text-[8px]">TO</div>
                      </div>
                    </div>
                    <div className="col-span-4 py-2.5 flex items-center justify-center">
                      Reason/s
                    </div>
                  </div>

                  {/* Grid Table Input row */}
                  <div className="grid grid-cols-12 border-b border-green-900/40 text-xs font-bold text-center bg-white items-stretch">
                    {/* Number of Days box */}
                    <div className="col-span-2 border-r border-green-900/30 p-2 flex items-center justify-center">
                      <input
                        type="number"
                        min={1}
                        required
                        placeholder="Days"
                        value={customDays || calculateDays() || ''}
                        onChange={(e) =>
                          setCustomDays(parseInt(e.target.value) || null)
                        }
                        className="w-full text-center bg-transparent border-none outline-none font-black text-sm p-0 focus:ring-0 text-green-950"
                      />
                    </div>

                    {/* Date FROM and TO inputs */}
                    <div className="col-span-3 border-r border-green-900/30 grid grid-cols-2 items-stretch divide-x divide-green-900/30">
                      <div className="p-1 flex items-center justify-center">
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white border border-green-900/20 rounded p-1 text-[10px] font-mono outline-none text-green-950 focus:border-green-800 focus:ring-1 focus:ring-green-850"
                        />
                      </div>
                      <div className="p-1 flex items-center justify-center">
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white border border-green-900/20 rounded p-1 text-[10px] font-mono outline-none text-green-950 focus:border-green-800 focus:ring-1 focus:ring-green-850"
                        />
                      </div>
                    </div>

                    {/* Time FROM and TO inputs */}
                    <div className="col-span-3 border-r border-green-900/30 grid grid-cols-2 items-stretch divide-x divide-green-900/30">
                      <div className="p-1 flex items-center justify-center">
                        <input
                          type="text"
                          placeholder="8:00 AM"
                          value={timeFrom}
                          onChange={(e) => setTimeFrom(e.target.value)}
                          className="w-full bg-white border border-green-900/20 rounded px-1 py-1 text-[9px] outline-none text-green-950 placeholder:text-gray-300 focus:border-green-800 focus:ring-1 focus:ring-green-850 text-center"
                        />
                      </div>
                      <div className="p-1 flex items-center justify-center">
                        <input
                          type="text"
                          placeholder="5:00 PM"
                          value={timeTo}
                          onChange={(e) => setTimeTo(e.target.value)}
                          className="w-full bg-white border border-green-900/20 rounded px-1 py-1 text-[9px] outline-none text-green-950 placeholder:text-gray-300 focus:border-green-800 focus:ring-1 focus:ring-green-850 text-center"
                        />
                      </div>
                    </div>

                    {/* Reason/s textarea */}
                    <div className="col-span-4 p-2 flex items-center bg-white h-full">
                      <textarea
                        required
                        rows={2}
                        placeholder="State clear reasons here..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full text-[10px] font-semibold bg-transparent border-none outline-none resize-none leading-relaxed p-1 text-green-950 focus:ring-0 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Signatures and Sign-off fields Block */}
                <div className="p-6 bg-white space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[9px] font-sans">
                    {/* Row 1 */}
                    <div className="flex flex-col items-center text-center">
                      <span className="font-extrabold text-green-950 uppercase border-b border-green-900/60 pb-1.5 w-48 text-center tracking-tight h-5 flex items-end justify-center font-mono">
                        {employeeName || '________________________'}
                      </span>
                      <span className="text-[7.5px] text-green-800 font-black mt-1 font-mono tracking-wider">
                        Employee Signature
                      </span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <span className="font-extrabold text-amber-900 uppercase border-b border-green-900/60 pb-1.5 w-48 text-center tracking-tight h-5 flex items-end justify-center font-mono">
                        PENDING SUPERVISOR
                      </span>
                      <span className="text-[7.5px] text-green-800 font-black mt-1 font-mono tracking-wider">
                        Recommending Approval: Name of Supervisor
                      </span>
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-col items-center text-center">
                      <span className="font-extrabold text-indigo-900 uppercase border-b border-green-900/60 pb-1.5 w-48 text-center tracking-tight h-5 flex items-end justify-center font-mono">
                        PENDING MONITORING
                      </span>
                      <span className="text-[7.5px] text-green-800 font-black mt-1 font-mono tracking-wider">
                        Noted: Monitoring Officer
                      </span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <span className="font-extrabold text-green-850 uppercase border-b border-green-900/60 pb-1.5 w-48 text-center tracking-tight h-5 flex items-end justify-center font-mono">
                        PENDING HR FINAL
                      </span>
                      <span className="text-[7.5px] text-green-800 font-black mt-1 font-mono tracking-wider">
                        Approved: Head of Human Resource Dept
                      </span>
                    </div>
                  </div>

                  {/* Row 3 - Available Leave Credits */}
                  <div className="flex justify-end pr-4 text-[10px] font-sans border-t border-green-100 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[8.5px] text-green-900 uppercase font-black tracking-widest font-mono">
                        Available Leave Credits:
                      </span>
                      <span className="font-mono font-black border border-amber-200 bg-amber-50 text-amber-900 px-4 rounded-lg py-1.5 text-xs shadow-xs">
                        {remainingCredits}.0 Days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Bottom submission buttons row */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 text-xs tracking-wider font-extrabold uppercase">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={createLeave.isPending}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLeave.isPending}
                  className="px-6 py-3.5 bg-green-900 hover:bg-green-800 text-yellow-400 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {createLeave.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  {createLeave.isPending
                    ? 'Submitting...'
                    : 'Submit Application'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
