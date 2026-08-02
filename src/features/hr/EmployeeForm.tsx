import React, { useState, useRef } from 'react';
import { Save, X, RotateCcw, User, Briefcase, MapPin, GraduationCap, ClipboardCheck, Camera, Upload, Trash2, Eye, Coins } from 'lucide-react';
import { DEPARTMENTS, type Employee } from '../../types/types';
import { storageService } from '../../services/storageService';
import { motion, AnimatePresence } from 'motion/react';

type ChecklistCategory = keyof NonNullable<Employee['checklist']>;
type AttachmentCategory = keyof NonNullable<Employee['attachments']>;

const EMPTY_CHECKLIST: NonNullable<Employee['checklist']> = {
  personalInfo: {},
  educational: {},
  employment: {},
  government: {},
  training: {},
  administrative: {},
};

const EMPTY_ATTACHMENTS: NonNullable<Employee['attachments']> = {
  personalInfo: {},
  educational: {},
  employment: {},
  government: {},
  training: {},
  administrative: {},
};

type EmployeeFormData = Omit<Employee, 'updatedAt' | 'checklist' | 'attachments'> & {
  checklist: NonNullable<Employee['checklist']>;
  attachments: NonNullable<Employee['attachments']>;
};

interface EmployeeFormProps {
  employee: Employee | null;
  onCancel: () => void;
  onSuccess: () => void;
  title?: string;
  isReadOnly?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onCancel, onSuccess, title, isReadOnly = false }) => {
  const initialData: EmployeeFormData = {
    id: employee?.id || '',
    surname: employee?.surname || '',
    firstName: employee?.firstName || '',
    middleName: employee?.middleName || '',
    dateOfBirth: employee?.dateOfBirth || '',
    sex: employee?.sex || 'Male',
    maritalStatus: employee?.maritalStatus || 'Single',
    religion: employee?.religion || '',
    homeAddress: employee?.homeAddress || '',
    contactNumber: employee?.contactNumber || '',
    email: employee?.email || '',
    position: employee?.position || '',
    department: employee?.department || '',
    serviceDuration: employee?.serviceDuration || '',
    employmentDate: employee?.employmentDate || '',
    bachelorsDegree: employee?.bachelorsDegree || '',
    mastersStatus: employee?.mastersStatus || 'Ongoing',
    doctorateStatus: employee?.doctorateStatus || 'Ongoing',
    mastersDegreeName: employee?.mastersDegreeName || '',
    educationLevel: employee?.educationLevel || '',
    status: employee?.status || 'Active',
    profilePicture: employee?.profilePicture || '',
    functionalRate: employee?.functionalRate !== undefined ? employee.functionalRate : 1500,
    gasoline: employee?.gasoline !== undefined ? employee.gasoline : 1000,
    cashAdvance: employee?.cashAdvance !== undefined ? employee.cashAdvance : 0,
    employeeShare: employee?.employeeShare !== undefined ? employee.employeeShare : 1200,
    checklist: employee?.checklist ?? EMPTY_CHECKLIST,
    attachments: employee?.attachments ?? EMPTY_ATTACHMENTS,
  };

  const [formData, setFormData] = useState<EmployeeFormData>(initialData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checklistFileInputRef = useRef<HTMLInputElement>(null);
  const [activeChecklistPath, setActiveChecklistPath] = useState<{ category: ChecklistCategory; item: string } | null>(null);
  const [viewerAttachment, setViewerAttachment] = useState<{ name: string; data: string } | null>(null);
  const [showAllAttachmentsModal, setShowAllAttachmentsModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveEmployee({ ...formData, updatedAt: Date.now() });
    onSuccess();
  };

  const handleChecklistChange = (category: ChecklistCategory, item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [category]: {
          ...prev.checklist[category],
          [item]: checked
        }
      }
    }));
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChecklistFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChecklistPath) {
      const { category, item } = activeChecklistPath;
      
      // Limit file size to 2MB for base64 storage
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large. Please upload files smaller than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          checklist: {
            ...prev.checklist,
            [category]: {
              ...prev.checklist[category],
              [item]: true // Automatically check if uploaded
            }
          },
          attachments: {
            ...prev.attachments,
            [category]: {
              ...prev.attachments[category],
              [item]: reader.result as string
            }
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerChecklistUpload = (category: ChecklistCategory, item: string) => {
    setActiveChecklistPath({ category, item });
    setTimeout(() => {
      checklistFileInputRef.current?.click();
    }, 0);
  };

  const removeAttachment = (category: AttachmentCategory, item: string) => {
    setFormData(prev => {
      const categoryAttachments: Record<string, string> = { ...(prev.attachments[category] ?? {}) };
      delete categoryAttachments[item];
      return {
        ...prev,
        attachments: {
          ...prev.attachments,
          [category]: categoryAttachments,
        },
      };
    });
  };

  const checklistStructure = [
    {
      id: 'personalInfo' as const,
      title: 'A. Personal Information Documents',
      items: [
        'Personal Data Sheet / Bio Data',
        'Updated Resume or Curriculum Vitae',
        'Birth Certificate (PSA Copy)',
        'Marriage Certificate (if applicable)',
        'Valid Government IDs',
        '2x2 or Passport Size ID Picture',
        'Emergency Contact Information'
      ]
    },
    {
      id: 'educational' as const,
      title: 'B. Educational Credentials',
      items: [
        'Diploma (College)',
        'Transcript of Records (TOR)',
        'Master\'s Degree Diploma / TOR (if applicable)',
        'Doctorate Degree Documents (if applicable)',
        'Professional License (PRC)',
        'Board Rating (if applicable)'
      ]
    },
    {
      id: 'employment' as const,
      title: 'C. Employment Documents',
      items: [
        'Application Letter',
        'Appointment Paper / Employment Contract',
        'Job Description',
        'Oath of Office (if applicable)',
        'Service Record'
      ]
    },
    {
      id: 'government' as const,
      title: 'D. Government Mandatory Requirements',
      items: [
        'SSS Number / SSS ID',
        'PhilHealth Number / ID',
        'Pag-IBIG Number / MDF',
        'TIN / BIR Form',
        'NBI Clearance',
        'Police Clearance',
        'Medical Certificate / Health Clearance'
      ]
    },
    {
      id: 'training' as const,
      title: 'E. Training and Professional Development',
      items: [
        'Certificates of Training',
        'Seminar Certificates',
        'Workshop Participation Certificates'
      ]
    },
    {
      id: 'administrative' as const,
      title: 'F. Administrative and Performance Records',
      items: [
        'Performance Evaluation Reports',
        'Promotion or Salary Adjustment Documents',
        'Commendations / Awards',
        'Disciplinary Records (if any)'
      ]
    }
  ];

  const getAllAttachments = (): Array<{ categoryId: string, item: string, name: string, data: string }> => {
    const result: Array<{ categoryId: string, item: string, name: string, data: string }> = [];
    if (!formData.attachments) return result;
    
    checklistStructure.forEach((category) => {
      category.items.forEach((item) => {
        const data = formData.attachments?.[category.id]?.[item];
        if (data) {
          result.push({
            categoryId: category.id,
            item,
            name: item,
            data
          });
        }
      });
    });
    
    return result;
  };

  const allAttachments = getAllAttachments();
  const totalAttachments = allAttachments.length;

  const handleToggleAllChecklist = (checked: boolean) => {
    setFormData(prev => {
      const newChecklist: EmployeeFormData['checklist'] = { ...EMPTY_CHECKLIST, ...prev.checklist };
      checklistStructure.forEach((category) => {
        const catId = category.id;
        category.items.forEach((item) => {
          newChecklist[catId] = {
            ...newChecklist[catId],
            [item]: checked,
          };
        });
      });
      return { ...prev, checklist: newChecklist };
    });
  };

  const handleToggleCategoryChecklist = (categoryId: ChecklistCategory, checked: boolean) => {
    setFormData(prev => {
      const newChecklist: EmployeeFormData['checklist'] = { ...EMPTY_CHECKLIST, ...prev.checklist };
      const catObj = checklistStructure.find(c => c.id === categoryId);
      if (catObj) {
        catObj.items.forEach((item) => {
          newChecklist[categoryId] = {
            ...newChecklist[categoryId],
            [item]: checked,
          };
        });
      }
      return { ...prev, checklist: newChecklist };
    });
  };

  const isCategoryFullyChecked = (categoryId: ChecklistCategory) => {
    const catObj = checklistStructure.find(c => c.id === categoryId);
    if (!catObj) return false;
    return catObj.items.every(item => formData.checklist[categoryId]?.[item] || false);
  };

  const getChecklistStatistics = () => {
    let totalItemsCount = 0;
    let checkedItemsCount = 0;
    checklistStructure.forEach((category) => {
      category.items.forEach((item) => {
        totalItemsCount++;
        if (formData.checklist?.[category.id]?.[item]) {
          checkedItemsCount++;
        }
      });
    });
    return { totalItemsCount, checkedItemsCount };
  };

  const { totalItemsCount, checkedItemsCount } = getChecklistStatistics();
  const isAllChecklistChecked = totalItemsCount > 0 && checkedItemsCount === totalItemsCount;

  const handleClear = () => {
    if (window.confirm('Clear all fields?')) {
      setFormData(initialData);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium text-green-950 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100/50";
  const labelClasses = "block text-[11px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-green-900 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://normi.edu.ph/wp-content/uploads/2021/04/NMC-Logo.png" 
              alt="NMC Logo" 
              className="w-12 h-12 object-contain bg-white rounded-lg p-1"
            />
            <div>
              <h1 className="text-2xl font-black text-yellow-400 uppercase tracking-tight">
                {title || (employee ? 'Edit Employee Profile' : 'Add Employee Registration')}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-300 text-[10px] font-bold uppercase tracking-wider">Official Employment Record</span>
                <span className="h-1 w-1 rounded-full bg-yellow-400"></span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                  <ClipboardCheck size={10} className="text-yellow-400" />
                  <span className="text-[9px] font-black text-yellow-400 uppercase tracking-tighter">HR REGISTRY</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-green-300 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Identity Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <User size={18} className="text-green-800" />
              <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">Personal Identification</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Profile Picture Upload Area */}
              <div className="flex flex-col items-center gap-4">
                <label className={labelClasses}>Employee Photo</label>
                <div 
                  className={`relative group w-40 h-40 rounded-[32px] overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center transition-all ${isReadOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-yellow-400'}`}
                  onClick={() => { if (!isReadOnly) fileInputRef.current?.click(); }}
                >
                  {formData.profilePicture ? (
                    <>
                      <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      {!isReadOnly && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="text-white" size={32} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Camera className="text-gray-300 group-hover:text-yellow-500 transition-colors" size={48} />
                      <span className="text-[10px] font-black text-gray-400 uppercase mt-2">{isReadOnly ? 'No Photo' : 'Upload Photo'}</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  disabled={isReadOnly}
                  onChange={handleProfilePictureUpload} 
                />
                {formData.profilePicture && !isReadOnly && (
                  <button 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, profilePicture: '' }))}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {/* Identity Fields */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Employee ID</label>
                    <input 
                      type="text" 
                      required 
                      disabled={isReadOnly || !!employee}
                      value={formData.id}
                      onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})}
                      className={`${inputClasses} ${isReadOnly || employee ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                      placeholder="EMP-000"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Employment Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className={inputClasses}
                      disabled={isReadOnly}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Surname</label>
                    <input 
                      type="text" required 
                      value={formData.surname}
                      onChange={(e) => setFormData({...formData, surname: e.target.value})}
                      className={inputClasses} 
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>First Name</label>
                    <input 
                      type="text" required 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className={inputClasses} 
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Middle Name</label>
                    <input 
                      type="text" 
                      value={formData.middleName}
                      onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                      className={inputClasses} 
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClasses}>Date of Birth</label>
                <input 
                  type="date" required 
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className={labelClasses}>Sex</label>
                <select 
                  value={formData.sex}
                  onChange={(e) => setFormData({...formData, sex: e.target.value as any})}
                  className={inputClasses}
                  disabled={isReadOnly}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Marital Status</label>
                <select 
                   value={formData.maritalStatus}
                   onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                   className={inputClasses}
                   disabled={isReadOnly}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Religion</label>
                <input 
                  type="text" 
                  value={formData.religion}
                  onChange={(e) => setFormData({...formData, religion: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                  placeholder="e.g. Catholic"
                />
              </div>
            </div>
          </section>

          {/* Contact & Address */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <MapPin size={18} className="text-green-800" />
              <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className={labelClasses}>Home Address</label>
                <input 
                  type="text" required 
                  value={formData.homeAddress}
                  onChange={(e) => setFormData({...formData, homeAddress: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                  placeholder="House No, Street, Barangay, City"
                />
              </div>
              <div>
                <label className={labelClasses}>Contact Number</label>
                <input 
                  type="tel" required 
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                  placeholder="09xx xxx xxxx"
                />
              </div>
              <div>
                <label className={labelClasses}>Email Address</label>
                <input 
                  type="email" required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </section>

          {/* Employment Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Briefcase size={18} className="text-green-800" />
              <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">Employment Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Position</label>
                <input 
                  type="text" required 
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className={labelClasses}>Department</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className={inputClasses}
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Date of Employment</label>
                <input 
                  type="date" required 
                  value={formData.employmentDate}
                  onChange={(e) => setFormData({...formData, employmentDate: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className={labelClasses}>Service Duration</label>
                <input 
                  type="text" 
                  value={formData.serviceDuration}
                  onChange={(e) => setFormData({...formData, serviceDuration: e.target.value})}
                  className={inputClasses}
                  disabled={isReadOnly}
                  placeholder="e.g. 5 Years" 
                />
              </div>
            </div>
          </section>

          {/* Payroll Defaults Section */}
          <section className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Coins size={18} className="text-green-800" />
              <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">Compensation Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className={labelClasses}>Daily Functional Rate (₱)</label>
                <input 
                  type="number" 
                  min={0}
                  value={formData.functionalRate}
                  onChange={(e) => setFormData({...formData, functionalRate: Number(e.target.value)})}
                  className={inputClasses}
                  disabled={isReadOnly}
                  placeholder="e.g. 1500" 
                />
              </div>
            </div>
          </section>

          {/* Education Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <GraduationCap size={18} className="text-green-800" />
              <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">Educational Attainment</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClasses}>Education Level</label>
                <select 
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({...formData, educationLevel: e.target.value})}
                  className={inputClasses}
                  required
                  disabled={isReadOnly}
                >
                  <option value="">Select Level</option>
                  <option value="Elementary">Elementary</option>
                  <option value="High School">High School</option>
                  <option value="Senior High School">Senior High School</option>
                  <option value="College">College</option>
                  <option value="Post Graduate">Post Graduate</option>
                  <option value="Vocational">Vocational</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Bachelor's Degree</label>
                <select 
                  value={formData.bachelorsDegree}
                  onChange={(e) => setFormData({...formData, bachelorsDegree: e.target.value})}
                  className={inputClasses}
                  required
                  disabled={isReadOnly}
                >
                  <option value="">Select Degree</option>
                  <option value="BEED">BEED</option>
                  <option value="BSCRIM">BSCRIM</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSBA MM">BSBA MM</option>
                  <option value="BSBA HRDM">BSBA HRDM</option>
                  <option value="BSBA FINANCE">BSBA FINANCE</option>
                  <option value="BS NURSING">BS NURSING</option>
                  <option value="BS COMPUTER SCIENCE">BS COMPUTER SCIENCE</option>
                  <option value="BS HRM">BS HRM</option>
                  <option value="BPEd">BPEd</option>
                  <option value="AB GUIDANCE COUNSELOR">AB GUIDANCE COUNSELOR</option>
                  <option value="AB POL. SCI">AB POL. SCI</option>
                  <option value="BSED ENGLISH">BSED ENGLISH</option>
                  <option value="BSED FILIPINO">BSED FILIPINO</option>
                  <option value="BSED MATHEMATICS">BSED MATHEMATICS</option>
                  <option value="BS PSYCHOLOGY">BS PSYCHOLOGY</option>
                  <option value="AB PSYCHOLOGY">AB PSYCHOLOGY</option>
                  <option value="BS BIOLOGY">BS BIOLOGY</option>
                  <option value="BS ACCOUNTANCY">BS ACCOUNTANCY</option>
                  <option value="Other">Other:</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Master's Degree Name</label>
                <input 
                  type="text" 
                  value={formData.mastersDegreeName}
                  onChange={(e) => setFormData({...formData, mastersDegreeName: e.target.value})}
                  className={inputClasses} 
                  disabled={isReadOnly}
                  placeholder="e.g. Master of Arts in Educational Management (or N/A)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Master's Status</label>
                <select 
                  value={formData.mastersStatus}
                  onChange={(e) => setFormData({...formData, mastersStatus: e.target.value})}
                  className={inputClasses}
                  disabled={isReadOnly}
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Graduating">Graduating</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Discontinue">Discontinue</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Doctorate Status</label>
                <select 
                  value={formData.doctorateStatus}
                  onChange={(e) => setFormData({...formData, doctorateStatus: e.target.value})}
                  className={inputClasses}
                  disabled={isReadOnly}
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Graduating">Graduating</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Discontinue">Discontinue</option>
                </select>
              </div>
            </div>
          </section>
          
          {/* FORM 201 CHECKLIST Section */}
          <section className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={20} className="text-green-800" />
                  <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">FORM 201 CHECKLIST</h2>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 ml-7">(Employee Personnel File)</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {totalAttachments > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllAttachmentsModal(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-green-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-95 cursor-pointer shrink-0"
                  >
                    <Eye size={14} />
                    <span>View All Attached Files ({totalAttachments})</span>
                  </button>
                )}

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleToggleAllChecklist(!isAllChecklistChecked)}
                    className="w-full sm:w-auto px-4 py-2 bg-green-50 hover:bg-green-100 text-green-900 border border-green-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer shrink-0"
                  >
                    <input
                      type="checkbox"
                      checked={isAllChecklistChecked}
                      readOnly
                      className="h-3.5 w-3.5 cursor-pointer accent-green-900 rounded border-green-300 pointer-events-none"
                    />
                    <span>{isAllChecklistChecked ? 'Deselect All Items' : 'Select All Items'} ({checkedItemsCount}/{totalItemsCount})</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              {checklistStructure.map((category) => {
                const isCatChecked = isCategoryFullyChecked(category.id);
                return (
                  <div key={category.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-green-100 pb-2">
                      <h3 className="text-[11px] font-black text-green-800 uppercase tracking-widest">
                        {category.title}
                      </h3>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryChecklist(category.id, !isCatChecked)}
                          className="text-[9px] font-black text-green-700 hover:text-green-905 bg-green-50/85 hover:bg-green-100 px-2 py-1 rounded-lg uppercase tracking-wider transition-colors cursor-pointer select-none border border-green-100/50"
                        >
                          {isCatChecked ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                    {category.items.map((item) => (
                      <div key={item} className="flex items-center justify-between group/item p-1.5 rounded-xl hover:bg-white transition-all">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center mt-0.5">
                            <input 
                              type="checkbox"
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-green-200 bg-white checked:bg-green-900 checked:border-green-900 transition-all disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200"
                              checked={formData.checklist?.[category.id]?.[item] || false}
                              onChange={(e) => handleChecklistChange(category.id, item, e.target.checked)}
                              disabled={isReadOnly}
                            />
                            <svg
                              className="absolute h-3.5 w-3.5 text-yellow-400 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-green-900 group-hover:text-green-700 transition-colors leading-tight">
                            {item}
                          </span>
                        </label>
                        
                        <div className="flex items-center gap-2">
                          {formData.attachments?.[category.id]?.[item] && (
                            <button 
                              type="button"
                              onClick={() => {
                                const data = formData.attachments?.[category.id]?.[item];
                                if (data) {
                                  setViewerAttachment({ name: item, data });
                                }
                              }}
                              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-[10px] font-black text-green-850 hover:text-green-905 uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                              title="View Document"
                            >
                              <Eye size={12} className="text-green-700" />
                              <span>View</span>
                            </button>
                          )}
                          
                          {!isReadOnly ? (
                            <div className="flex items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => triggerChecklistUpload(category.id, item)}
                                className={`px-3 py-1.5 border text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 group/btn shadow-sm hover:shadow-md cursor-pointer shrink-0 ${
                                  formData.attachments?.[category.id]?.[item] 
                                    ? 'bg-white border-green-900 text-green-900' 
                                    : 'bg-white border-gray-100 text-gray-400 hover:text-green-900 hover:border-green-900'
                                }`}
                              >
                                <Upload size={12} className="group-hover/btn:scale-110 transition-transform" />
                                <span>{formData.attachments?.[category.id]?.[item] ? 'Replace' : 'Attach'}</span>
                              </button>
                              
                              {formData.attachments?.[category.id]?.[item] && (
                                <button 
                                  type="button"
                                  onClick={() => removeAttachment(category.id, item)}
                                  className="p-1.5 text-red-505 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-150/50 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                                  title="Remove Attachment"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ) : (
                            !formData.attachments?.[category.id]?.[item] && (
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider bg-gray-100 rounded-lg px-2.5 py-1.5 select-none shrink-0">
                                Not Sent
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </section>

          {/* Form Actions */}
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
            {isReadOnly ? (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-12 py-3.5 bg-green-900 text-yellow-400 hover:bg-green-800 font-extrabold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest text-xs"
              >
                Done / Close Preview
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto px-8 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full sm:w-auto px-8 py-3 text-green-700 font-bold bg-green-50 rounded-2xl hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Clear Fields
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-10 py-3 bg-green-900 text-yellow-400 font-black rounded-2xl shadow-xl shadow-green-900/20 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {employee ? 'Update Record' : 'Commit Record'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
      
      {/* Premium Inline Attachment Viewer Modal (Anti-Popup Block) */}
      <AnimatePresence>
        {viewerAttachment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-green-950/80 backdrop-blur-md"
            onClick={() => setViewerAttachment(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-green-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400/10 rounded-xl border border-yellow-400/30 text-yellow-400">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400">Document Reviewer</h3>
                    <p className="text-sm font-bold truncate max-w-md md:max-w-xl text-white">{viewerAttachment.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewerAttachment(null)} 
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-green-200 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 p-6 bg-gray-50 flex flex-col items-center justify-center overflow-auto min-h-0">
                {viewerAttachment.data.startsWith('data:application/pdf') ? (
                  <div className="w-full h-full flex flex-col gap-4">
                     <embed 
                      src={viewerAttachment.data} 
                      type="application/pdf"
                      className="w-full flex-1 rounded-2xl border border-gray-200 bg-white"
                    />
                    <div className="text-center shrink-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        PDF Sandboxed Presentation
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const win = window.open();
                          if (win) {
                            win.document.write(`
                              <title>View PDF - ${viewerAttachment.name}</title>
                              <style>body{margin:0;padding:20px;height:100vh;background:#111827;display:flex;justify-content:center;align-items:center;}</style>
                              <embed src="${viewerAttachment.data}" width="100%" height="100%" type="application/pdf">
                            `);
                          } else {
                            alert('Popup blocked. Please check your browser settings.');
                          }
                        }}
                        className="text-xs font-extrabold text-green-900 hover:underline hover:text-green-700 transition-colors uppercase tracking-wider"
                      >
                        🔗 Open PDF in standalone native previewer tab
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                    <img 
                      src={viewerAttachment.data} 
                      alt={viewerAttachment.name} 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-lg border border-gray-100"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View All Attachments Modal */}
      <AnimatePresence>
        {showAllAttachmentsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-green-950/80 backdrop-blur-md"
            onClick={() => setShowAllAttachmentsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-green-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={18} className="text-yellow-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400">Attached Documents</h3>
                    <p className="text-sm font-bold">Personnel File Portfolio ({totalAttachments})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAllAttachmentsModal(false)} 
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-green-200 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                <div className="text-[10px] font-black uppercase tracking-wider text-green-800 border-b border-green-100 pb-2">
                  List of Uploaded Official Documents
                </div>
                <div className="space-y-2">
                  {allAttachments.map((att, i) => {
                    const catObj = checklistStructure.find(c => c.id === att.categoryId);
                    const catTitleShort = catObj?.title.split('.')[0] || 'Doc';
                    return (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-all group">
                        <div className="flex items-start gap-3">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-green-50 text-green-850 rounded-lg mt-0.5 shrink-0 border border-green-100">
                            Category {catTitleShort}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-green-950">{att.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Type: {att.data.startsWith('data:application/pdf') ? 'PDF Document' : 'Image File'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setViewerAttachment({ name: att.name, data: att.data });
                          }}
                          className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-green-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 bg-gray-100/50 border-t border-gray-100 text-center shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAllAttachmentsModal(false)}
                  className="px-6 py-2 bg-green-900 text-yellow-400 font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-green-850 transition-all shadow cursor-pointer"
                >
                  Close Document List
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <input 
        type="file"
        ref={checklistFileInputRef}
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleChecklistFileUpload}
      />
    </motion.div>
  );
};
