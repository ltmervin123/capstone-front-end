import React from 'react';
import { Briefcase } from 'lucide-react';
import { DEPARTMENTS } from '../../../../types/types';
import type { EmployeeFormData } from '../types';
import { inputCls, labelCls, sectionHeadingCls } from '../constants';

interface EmploymentDetailsSectionProps {
  formData: EmployeeFormData;
  isReadOnly: boolean;
  updateField: <K extends keyof EmployeeFormData>(
    key: K,
    value: EmployeeFormData[K]
  ) => void;
}

export const EmploymentDetailsSection: React.FC<
  EmploymentDetailsSectionProps
> = ({ formData, isReadOnly, updateField }) => {
  return (
    <section className="space-y-4">
      <div className={sectionHeadingCls}>
        <Briefcase size={16} className="text-emerald-700 shrink-0" />
        <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
          Employment Details
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Position / Job Title</label>
          <input
            type="text"
            required
            value={formData.position}
            onChange={(e) => updateField('position', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
          />
        </div>
        <div>
          <label className={labelCls}>Department</label>
          <select
            value={formData.department}
            onChange={(e) => updateField('department', e.target.value)}
            className={inputCls}
            required
            disabled={isReadOnly}
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date of Employment</label>
          <input
            type="date"
            required
            value={formData.employmentDate}
            onChange={(e) => updateField('employmentDate', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
          />
        </div>
        <div>
          <label className={labelCls}>Years of Service</label>
          <input
            type="text"
            value={formData.serviceDuration}
            onChange={(e) => updateField('serviceDuration', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="e.g. 5 years"
          />
        </div>
      </div>
    </section>
  );
};
