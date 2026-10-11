import type { Employee } from '../../../types/types';
import type { ChecklistCategoryConfig } from './types';

export const EMPTY_CHECKLIST: NonNullable<Employee['checklist']> = {
  personalInfo: {},
  educational: {},
  employment: {},
  government: {},
  training: {},
  administrative: {},
};

export const EMPTY_ATTACHMENTS: NonNullable<Employee['attachments']> = {
  personalInfo: {},
  educational: {},
  employment: {},
  government: {},
  training: {},
  administrative: {},
};

export const CHECKLIST_STRUCTURE: ChecklistCategoryConfig[] = [
  {
    id: 'personalInfo',
    title: 'A. Personal Information',
    items: [
      'Personal Data Sheet / Bio Data',
      'Updated Resume or Curriculum Vitae',
      'Birth Certificate (PSA Copy)',
      'Marriage Certificate (if applicable)',
      'Valid Government IDs',
      '2x2 or Passport Size ID Picture',
      'Emergency Contact Information',
    ],
  },
  {
    id: 'educational',
    title: 'B. Educational Credentials',
    items: [
      'Diploma (College)',
      'Transcript of Records (TOR)',
      "Master's Degree Diploma / TOR (if applicable)",
      'Doctorate Degree Documents (if applicable)',
      'Professional License (PRC)',
      'Board Rating (if applicable)',
    ],
  },
  {
    id: 'employment',
    title: 'C. Employment Documents',
    items: [
      'Application Letter',
      'Appointment Paper / Employment Contract',
      'Job Description',
      'Oath of Office (if applicable)',
      'Service Record',
    ],
  },
  {
    id: 'government',
    title: 'D. Government Requirements',
    items: [
      'SSS Number / SSS ID',
      'PhilHealth Number / ID',
      'Pag-IBIG Number / MDF',
      'TIN / BIR Form',
      'NBI Clearance',
      'Police Clearance',
      'Medical Certificate / Health Clearance',
    ],
  },
  {
    id: 'training',
    title: 'E. Training & Development',
    items: [
      'Certificates of Training',
      'Seminar Certificates',
      'Workshop Participation Certificates',
    ],
  },
  {
    id: 'administrative',
    title: 'F. Administrative & Performance',
    items: [
      'Performance Evaluation Reports',
      'Promotion or Salary Adjustment Documents',
      'Commendations / Awards',
      'Disciplinary Records (if any)',
    ],
  },
];

export const EDUCATION_LEVEL_OPTIONS = [
  'Elementary',
  'High School',
  'Senior High School',
  'College',
  'Post Graduate',
  'Vocational',
] as const;

export const BACHELORS_DEGREE_OPTIONS = [
  'BEED',
  'BSCRIM',
  'BSIT',
  'BSBA MM',
  'BSBA HRDM',
  'BSBA FINANCE',
  'BS NURSING',
  'BS COMPUTER SCIENCE',
  'BS HRM',
  'BPEd',
  'AB GUIDANCE COUNSELOR',
  'AB POL. SCI',
  'BSED ENGLISH',
  'BSED FILIPINO',
  'BSED MATHEMATICS',
  'BS PSYCHOLOGY',
  'AB PSYCHOLOGY',
  'BS BIOLOGY',
  'BS ACCOUNTANCY',
  'Other',
] as const;

export const DEGREE_STATUS_OPTIONS = [
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Graduating', label: 'Graduating' },
  { value: 'Graduated', label: 'Graduated' },
  { value: 'Discontinue', label: 'Discontinued' },
] as const;

export const inputCls =
  'w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-100';

export const labelCls = 'block text-xs font-bold text-stone-700 mb-1.5';

export const sectionHeadingCls =
  'flex items-center gap-2 pb-3 border-b border-stone-100 mb-4';
