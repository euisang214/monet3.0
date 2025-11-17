export const SCHOOLS = [
  'Harvard Business School',
  'Wharton',
  'New York University',
  'Stanford University',
  'London School of Economics',
];

export const JOB_TITLES = [
  'Analyst',
  'Associate',
  'Vice President',
  'Consultant',
  'Research Analyst',
];

export const DEGREE_TITLES = [
  'MBA',
  'BBA',
  'BS in Economics',
  'BA in Finance',
  'Masters in Finance',
];

// Options for user selection including a fallback 'Other'
export const SCHOOL_OPTIONS = [...SCHOOLS, 'Other'];
export const TITLE_OPTIONS = [...JOB_TITLES, ...DEGREE_TITLES, 'Other'];
