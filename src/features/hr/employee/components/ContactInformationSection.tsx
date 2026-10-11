import React from 'react';
import { MapPin } from 'lucide-react';
import type { EmployeeFormData } from '../types';
import { inputCls, labelCls, sectionHeadingCls } from '../constants';

interface ContactInformationSectionProps {
  formData: EmployeeFormData;
  isReadOnly: boolean;
  updateField: <K extends keyof EmployeeFormData>(
    key: K,
    value: EmployeeFormData[K]
  ) => void;
}

export const ContactInformationSection: React.FC<
  ContactInformationSectionProps
> = ({ formData, isReadOnly, updateField }) => {
  return (
    <section className="space-y-4">
      <div className={sectionHeadingCls}>
        <MapPin size={16} className="text-emerald-700 shrink-0" />
        <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
          Contact Information
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className={labelCls}>Home Address</label>
          <input
            type="text"
            required
            value={formData.homeAddress}
            onChange={(e) => updateField('homeAddress', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="House No., Street, Barangay, City"
          />
        </div>
        <div>
          <label className={labelCls}>Contact Number</label>
          <input
            type="tel"
            required
            value={formData.contactNumber}
            onChange={(e) => updateField('contactNumber', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="09xx xxx xxxx"
          />
        </div>
        <div>
          <label className={labelCls}>Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="email@example.com"
          />
        </div>
      </div>
    </section>
  );
};
