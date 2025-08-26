import { RouteObject } from 'react-router-dom';
import SubAdminLayout from '@/components/admin/SubAdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminStudents from '@/pages/admin/Students';
import AdminCourses from '@/pages/admin/Courses';
import AdminNotifications from '@/pages/admin/Notifications';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const subadminRoutes: RouteObject[] = [
  {
    path: '/subadmin',
    element: (
      <ProtectedRoute requiredRole="subadmin">
        <SubAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'students', element: <AdminStudents /> },
      { path: 'courses', element: <AdminCourses /> },
      { path: 'notifications', element: <AdminNotifications /> },
    ],
  },
];

export default subadminRoutes;
