import { User } from '../types/user.types';

export const hasPermission = (user: User | null, permission: keyof NonNullable<User['subAdminPermissions']>): boolean => {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // For sub-admins, check specific permission
  if (user.role === 'subadmin' && user.subAdminPermissions) {
    return user.subAdminPermissions[permission] === true;
  }
  
  return false;
};

// Helper functions for specific permissions
export const canReviewVideos = (user: User | null): boolean => {
  return hasPermission(user, 'videoReview');
};

export const canReviewNotes = (user: User | null): boolean => {
  return hasPermission(user, 'notesReview');
};

export const canManageTeachers = (user: User | null): boolean => {
  return hasPermission(user, 'teacherManagement');
};

export const canManageStudents = (user: User | null): boolean => {
  return hasPermission(user, 'studentManagement');
};
