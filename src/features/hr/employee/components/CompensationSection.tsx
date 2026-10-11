import React from 'react';
import { Coins } from 'lucide-react';
import type { EmployeeFormData } from '../types';
import { inputCls, labelCls, sectionHeadingCls } from '../constants';

interface CompensationSectionProps {
  formData: EmployeeFormData;
  isReadOnly: boolean;
  updateField: <K extends keyof EmployeeFormData>(
    key: K,
    value: EmployeeFormData[K]
  ) => void;
}

export const CompensationSection: React.FC<CompensationSectionProps> = ({
  formData,
  isReadOnly,
  updateField,
}) => {
  return (
    <section className="space-y-4">
      <div className={sectionHeadingCls}>
        <Coins size={16} className="text-emerald-700 shrink-0" />
        <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
          Compensation Settings
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Daily Functional Rate (₱)</label>
          <input
            type="number"
            min={0}
            value={formData.functionalRate}
            onChange={(e) =>
              updateField('functionalRate', Number(e.target.value))
            }
            className={inputCls}
            disabled={isReadOnly}
            placeholder="1500"
          />
        </div>
        <div>
          <label className={labelCls}>Gasoline Allowance (₱)</label>
          <input
            type="number"
            min={0}
            value={formData.gasoline}
            onChange={(e) => updateField('gasoline', Number(e.target.value))}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="1000"
          />
        </div>
        <div>
          <label className={labelCls}>Cash Advance (₱)</label>
          <input
            type="number"
            min={0}
            value={formData.cashAdvance}
            onChange={(e) => updateField('cashAdvance', Number(e.target.value))}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="0"
          />
        </div>
        <div>
          <label className={labelCls}>Employee Share (₱)</label>
          <input
            type="number"
            min={0}
            value={formData.employeeShare}
            onChange={(e) =>
              updateField('employeeShare', Number(e.target.value))
            }
            className={inputCls}
            disabled={isReadOnly}
            placeholder="1200"
          />
        </div>
      </div>
    </section>
  );
};
