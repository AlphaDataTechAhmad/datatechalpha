export type UserRole = 'user' | 'teacher' | 'admin' | 'subadmin';

export interface SubAdminPermissions {
  videoReview: boolean;
  notesReview: boolean;
  teacherManagement: boolean;
  studentManagement: boolean;
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
}
