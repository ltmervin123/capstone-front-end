import React from 'react';
import { Camera, User } from 'lucide-react';
import type { Employee } from '../../../../types/types';
import type { EmployeeFormData } from '../types';
import { inputCls, labelCls, sectionHeadingCls } from '../constants';

interface PersonalIdentificationSectionProps {
  formData: EmployeeFormData;
  isReadOnly: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  updateField: <K extends keyof EmployeeFormData>(
    key: K,
    value: EmployeeFormData[K]
  ) => void;
}

export const PersonalIdentificationSection: React.FC<
  PersonalIdentificationSectionProps
> = ({
  formData,
  isReadOnly,
  fileInputRef,
  onPhotoUpload,
  onRemovePhoto,
  updateField,
}) => {
  return (
    <section className="space-y-5">
      <div className={sectionHeadingCls}>
        <User size={16} className="text-emerald-700 shrink-0" />
        <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
          Personal Identification
        </h4>
      </div>

      {/* Profile photo + identity fields */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Photo upload */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <label className={labelCls}>Employee Photo</label>
          <div
            className={`relative group w-28 h-28 rounded-2xl overflow-hidden bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center transition-all ${
              isReadOnly
                ? 'cursor-not-allowed opacity-75'
                : 'cursor-pointer hover:border-green-700'
            }`}
            onClick={() => {
              if (!isReadOnly) fileInputRef.current?.click();
            }}
          >
            {formData.profilePicture ? (
              <>
                <img
                  src={formData.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                {!isReadOnly && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </>
            ) : (
              <>
                <Camera
                  className="text-stone-300 group-hover:text-emerald-600 transition-colors"
                  size={32}
                />
                <span className="text-[9px] font-bold text-stone-400 uppercase mt-1.5">
                  {isReadOnly ? 'No photo' : 'Upload'}
                </span>
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            disabled={isReadOnly}
            onChange={onPhotoUpload}
          />
          {formData.profilePicture && !isReadOnly && (
            <button
              type="button"
              onClick={onRemovePhoto}
              className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Identity fields */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Employee ID</label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                value={formData.id}
                onChange={(e) => updateField('id', e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="EMP-000"
              />
            </div>
            <div>
              <label className={labelCls}>Employment Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  updateField('status', e.target.value as Employee['status'])
                }
                className={inputCls}
                disabled={isReadOnly}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Surname</label>
              <input
                type="text"
                required
                value={formData.surname}
                onChange={(e) => updateField('surname', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className={labelCls}>First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className={labelCls}>Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => updateField('middleName', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Biographical grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Date of Birth</label>
          <input
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
          />
        </div>
        <div>
          <label className={labelCls}>Sex</label>
          <select
            value={formData.sex}
            onChange={(e) =>
              updateField('sex', e.target.value as Employee['sex'])
            }
            className={inputCls}
            disabled={isReadOnly}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Marital Status</label>
          <select
            value={formData.maritalStatus}
            onChange={(e) => updateField('maritalStatus', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Religion</label>
          <input
            type="text"
            value={formData.religion}
            onChange={(e) => updateField('religion', e.target.value)}
            className={inputCls}
            disabled={isReadOnly}
            placeholder="e.g. Catholic"
          />
        </div>
      </div>
    </section>
  );
};
