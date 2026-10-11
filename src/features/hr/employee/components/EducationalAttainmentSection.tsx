import React from 'react';
import { GraduationCap } from 'lucide-react';
import type { EmployeeFormData } from '../types';
import {
  BACHELORS_DEGREE_OPTIONS,
  DEGREE_STATUS_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  inputCls,
  labelCls,
  sectionHeadingCls,
} from '../constants';

interface EducationalAttainmentSectionProps {
  formData: EmployeeFormData;
  isReadOnly: boolean;
  updateField: <K extends keyof EmployeeFormData>(
    key: K,
    value: EmployeeFormData[K]
  ) => void;
}

export const EducationalAttainmentSection: React.FC<
  EducationalAttainmentSectionProps
> = ({ formData, isReadOnly, updateField }) => {
  return (
    <section className="space-y-4">
      <div className={sectionHeadingCls}>
        <GraduationCap size={16} className="text-emerald-700 shrink-0" />
        <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
          Educational Attainment
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Education Level</label>
          <select
            value={formData.educationLevel}
            onChange={(e) => updateField('educationLevel', e.target.value)}
            className={inputCls}
            required
            disabled={isReadOnly}
          >
            <option value="">Select Level</option>
            {EDUCATION_LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Bachelor's Degree</label>
          <select
            value={formData.bachelorsDegree}
            onChange={(e) => updateField('bachelorsDegree', e.target.value)}
            className={inputCls}
            required
            disabled={isReadOnly}
          >
            <option value="">Select Degree</option>
            {BACHELORS_DEGREE_OPTIONS.map((deg) => (
              <option key={deg} value={deg}>
                {deg}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Master's Degree</label>
          <input
            type="text"
            value={formData.mastersDegreeName}
            onChange={(e) => updateField('mastersDegreeName', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="e.g. MA in Educational Management"
          />
        </div>
        <div>
          <label className={labelCls}>Master's Status</label>
          <select
            value={formData.mastersStatus}
            onChange={(e) => updateField('mastersStatus', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
          >
            {DEGREE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Doctorate Status</label>
          <select
            value={formData.doctorateStatus}
            onChange={(e) => updateField('doctorateStatus', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
          >
            {DEGREE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};
