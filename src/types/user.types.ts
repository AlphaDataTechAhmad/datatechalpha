export type UserRole = 'admin' | 'subadmin' | 'teacher' | 'testconductor' | 'student' | 'user';

export interface SubAdminPermissions {
  videoReview: boolean;
  notesReview: boolean;
  teacherManagement: boolean;
  reelsManagement: boolean;
}

export interface User {
  $id: string;
  accountId: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  imageUrl: string;
  enrolledCourses: any[];
  $createdAt: string;
  role?: UserRole;
  isVerified?: boolean;
  teacherId?: string;
  is_teacher_verified?: boolean;
  is_active?: boolean;
  status?: 'active' | 'suspended' | 'pending';
  subAdminPermissions?: SubAdminPermissions;
  testConductorPermissions?: TestConductorPermissions;
}

export interface TestConductorPermissions {
  canCreateTests: boolean;
  canGradeTests: boolean;
  canManageTestSessions: boolean;
  canViewAllResults: boolean;
}
