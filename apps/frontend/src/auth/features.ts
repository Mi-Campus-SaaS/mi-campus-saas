import type { Role } from './context';

export interface FeatureConfig {
  enabled: boolean;
  roles: Role[];
  message?: string;
}

export type FeatureKey =
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  | 'classes.view'
  | 'classes.create'
  | 'classes.edit'
  | 'classes.delete'
  | 'classes.enroll'
  | 'grades.view'
  | 'grades.edit'
  | 'grades.export'
  | 'attendance.view'
  | 'attendance.take'
  | 'attendance.edit'
  | 'materials.view'
  | 'materials.upload'
  | 'materials.edit'
  | 'materials.delete'
  | 'announcements.view'
  | 'announcements.create'
  | 'announcements.edit'
  | 'announcements.delete'
  | 'announcements.publish'
  | 'finance.view'
  | 'finance.create'
  | 'finance.edit'
  | 'finance.delete'
  | 'schedule.view'
  | 'schedule.edit'
  | 'reports.view'
  | 'reports.export'
  | 'settings.view'
  | 'settings.edit';

export const FEATURE_FLAGS: Record<FeatureKey, FeatureConfig> = {
  // Students
  'students.view': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'You need admin or teacher access to view students',
  },
  'students.create': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can create new students',
  },
  'students.edit': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can edit student information',
  },
  'students.delete': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can delete students',
  },

  // Teachers
  'teachers.view': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can view teachers',
  },
  'teachers.create': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can create new teachers',
  },
  'teachers.edit': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can edit teacher information',
  },
  'teachers.delete': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can delete teachers',
  },

  // Classes
  'classes.view': {
    enabled: true,
    roles: ['admin', 'teacher', 'student', 'parent'],
    message: 'You need appropriate access to view classes',
  },
  'classes.create': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can create new classes',
  },
  'classes.edit': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can edit classes',
  },
  'classes.delete': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can delete classes',
  },
  'classes.enroll': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can enroll students in classes',
  },

  // Grades
  'grades.view': {
    enabled: true,
    roles: ['admin', 'teacher', 'student', 'parent'],
    message: 'You need appropriate access to view grades',
  },
  'grades.edit': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can edit grades',
  },
  'grades.export': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can export grades',
  },

  // Attendance
  'attendance.view': {
    enabled: true,
    roles: ['admin', 'teacher', 'student', 'parent'],
    message: 'You need appropriate access to view attendance',
  },
  'attendance.take': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can take attendance',
  },
  'attendance.edit': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can edit attendance',
  },

  // Materials
  'materials.view': {
    enabled: true,
    roles: ['admin', 'teacher', 'student', 'parent'],
    message: 'You need appropriate access to view materials',
  },
  'materials.upload': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can upload materials',
  },
  'materials.edit': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can edit materials',
  },
  'materials.delete': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can delete materials',
  },

  // Announcements
  'announcements.view': {
    enabled: true,
    roles: ['admin', 'teacher', 'student', 'parent'],
    message: 'You need appropriate access to view announcements',
  },
  'announcements.create': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can create announcements',
  },
  'announcements.edit': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can edit announcements',
  },
  'announcements.delete': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can delete announcements',
  },
  'announcements.publish': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can publish announcements',
  },

  // Finance
  'finance.view': {
    enabled: true,
    roles: ['admin', 'parent'],
    message: 'Only administrators and parents can view finance information',
  },
  'finance.create': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can create finance records',
  },
  'finance.edit': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can edit finance records',
  },
  'finance.delete': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can delete finance records',
  },

  // Schedule
  'schedule.view': {
    enabled: true,
    roles: ['admin', 'teacher', 'student', 'parent'],
    message: 'You need appropriate access to view schedules',
  },
  'schedule.edit': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can edit schedules',
  },

  // Reports
  'reports.view': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can view reports',
  },
  'reports.export': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can export reports',
  },

  // Settings
  'settings.view': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can view settings',
  },
  'settings.edit': {
    enabled: true,
    roles: ['admin'],
    message: 'Only administrators can edit settings',
  },
};

export const checkFeature = (feature: FeatureKey, userRole?: Role): boolean => {
  const config = FEATURE_FLAGS[feature];
  if (!config.enabled) return false;
  if (!userRole) return false;
  return config.roles.includes(userRole);
};

export const getFeatureMessage = (feature: FeatureKey): string => {
  return FEATURE_FLAGS[feature].message || 'Access denied';
};

export const getAvailableFeatures = (userRole?: Role): FeatureKey[] => {
  if (!userRole) return [];
  return Object.keys(FEATURE_FLAGS).filter((feature) => checkFeature(feature as FeatureKey, userRole)) as FeatureKey[];
};
