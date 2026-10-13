import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Role } from '../../../../types/types';
import { useCurrentUser } from '../../../../hooks/useAuth';
import {
  useApprovePromotionMutation,
  useDeletePromotionMutation,
  useEmployeePromotionsQuery,
} from '../../../../hooks/useEmployees';
import { storageService } from '../../../../services/storageService';

interface PromotionHistorySectionProps {
  employeeNumber?: string;
  employeeName?: string;
  onPromote?: () => void;
}

export const PromotionHistorySection: React.FC<PromotionHistorySectionProps> = ({
  employeeNumber,
  employeeName,
  onPromote,
}) => {
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === Role.ADMIN;

  const { data: promotions, isLoading, error } = useEmployeePromotionsQuery(
    employeeNumber,
    { enabled: Boolean(employeeNumber) }
  );

  const approveMutation = useApprovePromotionMutation();
  const deleteMutation = useDeletePromotionMutation();

  const handleApprove = async (promotionId: string, roleTitle: string) => {
    if (!employeeNumber) return;
    try {
      await approveMutation.mutateAsync({
        employeeNumber,
        promotionId,
      });
      storageService.addLog(
        currentUser?.username ?? 'Admin',
        'Approved employee promotion',
        `${employeeNumber} — promotion to ${roleTitle} approved.`
      );
    } catch {
      // Error handled by react-query / global error boundary
    }
  };

  const handleDelete = async (promotionId: string, roleTitle: string) => {
    if (!employeeNumber) return;
    if (
      !window.confirm(
        `Are you sure you want to discard this pending promotion recommendation for ${roleTitle}?`
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({
        employeeNumber,
        promotionId,
      });
      storageService.addLog(
        currentUser?.username ?? 'Admin',
        'Discarded promotion recommendation',
        `${employeeNumber} — promotion recommendation for ${roleTitle} was discarded.`
      );
    } catch {
      // Error handled by react-query
    }
  };

  if (!employeeNumber) return null;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-800 rounded-lg">
            <TrendingUp size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
              Career Progression & Promotion History
            </h4>
            <p className="text-[11px] text-stone-500">
              Historical position elevation and career trail{employeeName ? ` for ${employeeName}` : ''}
            </p>
          </div>
        </div>

        {onPromote && (
          <button
            type="button"
            onClick={onPromote}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <TrendingUp size={13} />
            <span>Promote</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div className="py-6 flex items-center justify-center gap-2 text-stone-500 text-xs font-medium">
          <Loader2 size={15} className="animate-spin text-amber-600" />
          <span>Loading promotion records...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
          Failed to load promotion history.
        </div>
      )}

      {!isLoading && !error && (!promotions || promotions.length === 0) && (
        <div className="py-6 px-4 bg-stone-50/70 border border-stone-200/70 rounded-2xl text-center space-y-2">
          <Award size={24} className="mx-auto text-stone-400" />
          <p className="text-xs font-semibold text-stone-700">
            No promotion records on file
          </p>
          <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
            This employee is currently serving under their initial appointment. Use the Promote button to record an advancement.
          </p>
          {onPromote && (
            <button
              type="button"
              onClick={onPromote}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <TrendingUp size={12} className="text-amber-600" />
              <span>Initiate Promotion</span>
            </button>
          )}
        </div>
      )}

      {!isLoading && promotions && promotions.length > 0 && (
        <div className="space-y-3">
          {promotions.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/90 shadow-2xs hover:bg-white transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-stone-600">
                    {item.previousPosition}
                  </span>
                  <ArrowRight size={13} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-green-950">
                    {item.newPosition}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      item.isApproved
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {item.isApproved ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <Clock size={11} />
                    )}
                    {item.status}
                  </span>

                  <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {item.effectiveDate}
                  </span>
                </div>
              </div>

              {/* Department Assignment */}
              <div className="text-[11px] text-stone-600">
                <span className="font-semibold text-stone-500">Department: </span>
                {item.previousDepartment && item.newDepartment && item.previousDepartment !== item.newDepartment ? (
                  <span>
                    {item.previousDepartment} <ArrowRight size={11} className="inline mx-0.5 text-stone-400" /> {item.newDepartment}
                  </span>
                ) : (
                  <span>{item.newDepartment || item.previousDepartment || 'Current Assignment'}</span>
                )}
              </div>

              {/* Rationale / Remarks */}
              {item.remarks && (
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/70 text-xs text-stone-700 leading-relaxed font-medium">
                  <span className="text-stone-400 text-[11px] font-bold block mb-0.5">
                    Citation / Rationale:
                  </span>
                  {item.remarks}
                </div>
              )}

              {/* Reviewer / Approver & Actions */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                <span>
                  {item.approvedBy
                    ? `Approved by ${item.approvedBy}`
                    : item.createdBy
                    ? `Recommended by ${item.createdBy}`
                    : 'Recorded promotion'}
                </span>

                {/* Admin Actions for Pending Promotions */}
                {!item.isApproved && isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id, item.newPosition)}
                      disabled={approveMutation.isPending || deleteMutation.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      title="Approve promotion"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.newPosition)}
                      disabled={approveMutation.isPending || deleteMutation.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      title="Discard pending recommendation"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      <span>Discard</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
