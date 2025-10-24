import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import React, { ReactNode, FC } from 'react';
import { GeminiProvider } from './contexts/GeminiContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types/user.types';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CourseProvider } from './contexts/CourseContext';
// TestProvider is no longer needed as we're using component state
import { ChatProvider } from './contexts/ChatContext';
import { TestProvider } from './components/test/TestConductor/context/TestContext';
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import TermsAndConditions from './pages/policies/TermsAndConditions';
import CourseDetailPage from './pages/CourseDetailPage';
import VideoLectures from './pages/VideoLectures';
// import TestConductor from './components/test/TestConductor/TestConductor';
import DynamicTestConductor from './components/test/TestConductor/DynamicTestConductor';
import ErrorBoundary from './components/ErrorBoundary';
import VideoPlayerPage from './pages/VideoPlayerPage';
import ResetPassword from './pages/ResetPassword';
import TeacherPanel from './pages/TeacherPanel';
import LiveLecturesSection from './pages/LiveLecturesSection';
import LiveLecture from './pages/LiveLecture';
import TestLayout from '@/components/layout/TestLayout';
// TestsPage import removed as it's not being used
import NotesPage from './pages/NotesPage';
import ProtectedRoute from './components/ProtectedRoute';
import { LayoutProvider } from './contexts/LayoutContext';
import Layout from './components/layout/Layout';
// Using a simple button component instead of the UI library button
const Button: React.FC<{ onClick?: () => void, children: ReactNode }> = ({ onClick, children }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
  >
    {children}
  </button>
);
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PublicCoursesPage from './pages/CoursesPage';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './components/admin/AdminLayout';
import SubAdminLayout from './components/admin/SubAdminLayout';
import SubAdmins from './pages/admin/SubAdmins';
import AdminDashboard from './pages/admin/Dashboard';
import TestzPage from './pages/Testz';
import TestConductorDashboard from './pages/TestConductorDashboard';
import TestimonialsPage from './pages/admin/TestimonialsPage';
import Testimonials from './pages/admin/Testimonials';
import IntelliTestRoutes from './routes/IntelliTestRoutes';
import TestConductorLogin from './pages/TestConductorLogin';
import CreateExamPage from './pages/CreateExamPage';
import { TestConductorAuthProvider } from './contexts/TestConductorAuthContext';
import TestConductorRoute from './components/TestConductorRoute';
import InternshipsDashboard from './pages/admin/InternshipsDashboard';
import CreateInternshipPage from './pages/admin/CreateInternshipPage';
import TestLinksManager from './pages/admin/TestLinksManager';
import EditInternshipPage from './pages/admin/EditInternshipPage';
import InternshipsPage from './pages/InternshipsPage';
import InternshipDetail from './pages/InternshipDetail';
import NewInternshipTestConductor from './pages/NewInternshipTestConductor';
import TeachersPage from './pages/admin/Teachers';
import StudentsPage from './pages/admin/Students';
import ReelsPage from './pages/admin/Reels';
import ProfilePage from './pages/ProfilePage';
import ScholarshipPage from './pages/ScholarshipPage';
import AdminCoursesPage from './pages/admin/Courses';
import NotificationsPage from './pages/admin/Notifications';
import VideoReviewPage from './pages/admin/VideoReview';
import NotesReviewPage from './pages/admin/NotesReview';
import ContactPage from './pages/ContactPage';
import VerifyNotice from './pages/VerifyNotice';
import VerifyEmailPage from './pages/VerifyEmail';
import TestLoader from './pages/TestLoader';
import ForgotPassword from './pages/ForgotPassword';
import InstructorsPage from './pages/instructors';
import TestLinkAuth from './components/test/TestLinkAuth';
import TestsAdmin from './pages/admin/TestsAdmin';
import TestConductor from './pages/TestConductor';
import InternTest from './pages/InternTest';
import InternshipTestLogin from './pages/InternshipTestLogin';
import InternshipTestQuestions from './pages/InternshipTestQuestions';
import InternExams from './pages/admin/InternExams';
import VerifyUsers from './components/admin/VerifyUsers';
import EnrollmentPage from './pages/EnrollmentPage';
import InternshipDashboard from './pages/InternshipDashboard';
import Overview from './pages/internship/Overview';
import LiveClasses from './pages/internship/LiveClasses';
import Notes from './pages/internship/Notes';
import PaymentVerification from './components/internships/PaymentVerification';

// Create a wrapper component that includes all providers
const AppWithProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <NotificationProvider>
      <CourseProvider>
        <ChatProvider>
          <LayoutProvider>
            <GeminiProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </GeminiProvider>
          </LayoutProvider>
        </ChatProvider>
      </CourseProvider>
    </NotificationProvider>
  </AuthProvider>
);

// Create a minimal wrapper for test routes
const TestProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AppWithProviders>
      {children}
    </AppWithProviders>
  );
};

// Type for route elements that need authentication
interface ProtectedRouteElementProps {
  children: ReactNode;
  requiredRole?: UserRole | 'student' | 'user';
}

const ProtectedRouteElement = ({ children, requiredRole = 'student' }: ProtectedRouteElementProps) => {
  // Map 'user' role to 'student' for the ProtectedRoute component
  const mappedRole = requiredRole === 'user' ? 'student' : requiredRole;
  
  return (
    <ProtectedRoute requiredRole={mappedRole as any}>
      {children}
    </ProtectedRoute>
  );
};

// Wrapper component for test routes
const TestWrapper: FC = () => {
  const { testId } = useParams();
  
  if (!testId) {
    return <div>Error: No test ID provided</div>;
  }

  return (
    <TestProvider testId={testId}>
      <div style={{ padding: '20px' }}>
        <DynamicTestConductor />
      </div>
    </TestProvider>
  );
};

// Simple wrapper components for protected routes
interface AdminRouteProps {
  children?: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4">Checking admin access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">You don't have permission to access the admin panel.</p>
          <p className="text-sm text-gray-500 mb-6">Required role: admin | Your role: {user?.role || 'none'}</p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const SubAdminRoute: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <SubAdminLayout>
    <ProtectedRoute requiredRole="subadmin">
      {children}
    </ProtectedRoute>
  </SubAdminLayout>
);

// We'll add authentication checks in the layout components instead
// This is a simpler approach that avoids the hooks-in-router issue
export const router = createBrowserRouter([
  // Simple test route for debugging
  {
    path: '/test-debug',
    element: (
      <div style={{ padding: '20px', backgroundColor: 'lightyellow' }}>
        <h1>Test Debug Route</h1>
        <p>If you can see this, routing is working.</p>
      </div>
    ),
  },
  
  // Redirects
  {
    path: '/blog',
    element: <Navigate to="/about" replace />
  },
  {
    path: '/careers',
    element: <Navigate to="/about" replace />
  },
  {
    path: '/instructors',
    element: <Navigate to="/instructor" replace />
  },
  {
    path: '/terms',
    element: <Navigate to="/terms-and-conditions" replace />
  },
  {
    path: '/privacy',
    element: <Navigate to="/privacy-policy" replace />
  },
  {
    path: '/cookies',
    element: <Navigate to="/privacy-policy#cookies" replace />
  },
  // Test route for DynamicTestConductor
  {
    path: '/test/:testId',
    element: (
      <AppWithProviders>
        <ErrorBoundary>
          <TestWrapper />
        </ErrorBoundary>
      </AppWithProviders>
    )
  },
  // Reset password route - must be outside the main layout
  {
    path: '/reset-password',
    element: (
      <AppWithProviders>
        <ResetPassword />
      </AppWithProviders>
    )
  },
  // Test link authentication route
  {
    path: '/test/auth/:testId',
    element: (
      <AppWithProviders>
        <ErrorBoundary>
          <TestLinkAuth />
        </ErrorBoundary>
      </AppWithProviders>
    ),
  },
  {
    path: '/test/:testId',
    element: (
      <AppWithProviders>
        <TestWrapper />
      </AppWithProviders>
    )
  },

  // Test loader route for debugging
  {
    path: '/test-loader/:testId',
    element: (
      <TestProviders>
        <TestLoader />
      </TestProviders>
    ),
  },
  // Main app routes
  {
    path: '/',
    element: (
      <AppWithProviders>
        <Layout />
      </AppWithProviders>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'scholarship', element: <ScholarshipPage /> },
      { path: 'intellitest/*', element: <IntelliTestRoutes /> },
      { path: 'courses', element: <PublicCoursesPage /> },
      { path: 'testz', element: <TestzPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      {
        path: 'internship-test/:testId',
        element: (
          <TestProviders>
            <TestLayout>
              <InternshipTestLogin />
            </TestLayout>
          </TestProviders>
        )
      },
      {
        path: 'internship-test/:testId/take',
        element: (
          <TestProviders>
            <TestLayout>
              <NewInternshipTestConductor />
            </TestLayout>
          </TestProviders>
        )
      },
      // Keep old routes for backward compatibility
      { path: 'internship-test-old/:testId', element: <InternTest /> },
      { path: 'internship-test-old/:testId/login', element: <InternshipTestLogin /> },
      { path: 'test/:testId', element: <TestLinkAuth /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'verify-notice', element: <VerifyNotice /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      // Intern test route with TestLayout (no header/footer)
      {
        path: 'intern-test',
        element: (
          <TestLayout>
            <ProtectedRoute requiredRole="user">
              <InternTest />
            </ProtectedRoute>
          </TestLayout>
        )
      },
      { path: 'privacy-policy', element: <PrivacyPolicy /> },
      { path: 'terms-and-conditions', element: <TermsAndConditions /> },
      { 
        path: 'internships', 
        children: [
          { index: true, element: <InternshipsPage /> },
          { 
            path: ':id',
            children: [
              {
                index: true,
                element: <InternshipDetail />
              },
              {
                path: 'test',
                element: <InternshipTestQuestions />
              },
              {
                path: 'verify-payment',
                element: <PaymentVerification />
              },
              {
                path: 'dashboard',
                element: (
                  <ProtectedRoute requiredRole="user">
                    <InternshipDashboard />
                  </ProtectedRoute>
                ),
                children: [
                  {
                    index: true,
                    element: <Navigate to="overview" replace />
                  },
                  {
                    path: 'overview',
                    element: <Overview />
                  },
                  {
                    path: 'live-classes',
                    element: <LiveClasses />
                  },
                  {
                    path: 'notes',
                    element: <Notes />
                  }
                ]
              }
            ]
          },
        ]
      },
      { path: 'internship-test/:testId', element: <InternshipTestLogin /> },
      { path: 'internship-test/:testId/take', element: <NewInternshipTestConductor /> },
      { 
        path: 'internship-test/:testId/questions', 
        element: (
          <TestProviders>
            <TestLayout>
              <InternshipTestQuestions />
            </TestLayout>
          </TestProviders>
        ) 
      },
      { 
        path: 'enroll/:courseId/:courseName', 
        element: <EnrollmentPage /> 
      },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'contact', element: <ContactPage /> },
      { 
        path: 'instructor', 
        element: <InstructorsPage /> 
      },
      { 
        path: 'courses/:courseId',
        element: <CourseDetailPage />,
        children: [
          { index: true, element: null },
          { path: 'videos', element: <VideoLectures /> },
          { path: 'videos/player', element: <VideoPlayerPage /> },
          { path: 'material', element: <NotesPage /> },
          { 
            path: 'teacher',
            element: (
              <ProtectedRoute>
                <TeacherPanel />
              </ProtectedRoute>
            ) 
          },
          {
            path: 'live-lectures',
            element: (
              <ProtectedRoute>
                <LiveLecturesSection />
              </ProtectedRoute>
            )
          },
          {
            path: 'live-lecture/:lectureId',
            element: (
              <ProtectedRouteElement requiredRole="user">
                <LiveLecture />
              </ProtectedRouteElement>
            )
          }
        ]
      },
      {
        path: 'test/:testId',
        element: (
          <ProtectedRouteElement requiredRole="teacher">
            <TestConductor />
          </ProtectedRouteElement>
        ),
      },
      // Test Conductor Authentication Routes
      {
        path: 'test-conductor',
        element: (
          <TestConductorAuthProvider>
            <TestLayout>
              <Outlet />
            </TestLayout>
          </TestConductorAuthProvider>
        ),
        children: [
          {
            path: 'login',
            element: <TestConductorLogin />,
          },
        ],
      },
      
      // Exam Creation Route
      {
        path: 'exams/new',
        element: (
          <TestConductorAuthProvider>
            <TestConductorRoute>
              <TestLayout>
                <CreateExamPage />
              </TestLayout>
            </TestConductorRoute>
          </TestConductorAuthProvider>
        ),
      },
      
      // Test Dashboard Routes (protected, requires test conductor authentication)
      {
        path: 'test-dashboard',
        element: (
          <TestConductorAuthProvider>
            <TestConductorRoute>
              <TestLayout>
                <TestConductorDashboard />
              </TestLayout>
            </TestConductorRoute>
          </TestConductorAuthProvider>
        ),
      },
      {
        path: 'test-dashboard/:testId',
        element: (
          <TestConductorAuthProvider>
            <TestConductorRoute>
              <TestLayout>
                <TestConductorDashboard />
              </TestLayout>
            </TestConductorRoute>
          </TestConductorAuthProvider>
        ),
      },
      
      // Test routes (use TestLayout without header/footer)
      {
        path: 'test',
        element: (
          <TestLayout>
            <Outlet />
          </TestLayout>
        ),
        children: [
          { 
            path: 'web-development-internship', 
            element: (
              <ProtectedRouteElement requiredRole="user">
                <DynamicTestConductor />
              </ProtectedRouteElement>
            )
          },
          { 
            path: ':testId', 
            element: <TestConductor />
          },
          { 
            path: 'legacy/:testId', 
            element: (
              <ProtectedRouteElement requiredRole="user">
                <DynamicTestConductor />
              </ProtectedRouteElement>
            )
          },
        ]
      },

      // Admin routes
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'testimonials', element: <TestimonialsPage /> },
          { path: 'testimonials/manage', element: <Testimonials /> },
          { 
            path: 'subadmins', 
            element: <SubAdmins /> 
          },
          {
            path: 'internships',
            element: <Outlet />,
            children: [
              { index: true, element: <InternshipsDashboard /> },
              { path: 'new', element: <CreateInternshipPage /> },
              { path: 'edit/:id', element: <EditInternshipPage /> },
            ]
          },
          // Users management
          {
            path: 'students',
            element: <StudentsPage />
          },
          {
            path: 'teachers',
            element: <TeachersPage />
          },
          {
            path: 'reels',
            element: <ReelsPage />
          },
          {
            path: 'courses',
            element: <AdminCoursesPage />
          },
          {
            path: 'test-links',
            element: <TestLinksManager />
          },
          {
            path: 'notifications',
            element: <NotificationsPage />
          },
          {
            path: 'video-review',
            element: <VideoReviewPage />
          },
          {
            path: 'notes-review',
            element: <NotesReviewPage />
          },
          // Intern Exams
          {
            path: 'intern-exams',
            element: <InternExams />
          },
          {
            path: 'verify-users',
            element: <VerifyUsers />
          },
          // Test management
          {
            path: 'tests',
            element: <Outlet />,
            children: [
              { index: true, element: <TestsAdmin /> },
              { path: 'new', element: <div>New Test Form</div> },
              { path: ':testId', element: <div>Test Details</div> },
              { path: 'edit/:testId', element: <div>Edit Test</div> }
            ]
          },
          // Add other admin routes here
        ],
      },
      
      // Sub-admin routes
      {
        path: 'subadmin',
        element: <SubAdminRoute />,
        children: [
          { index: true, element: <Navigate to="/subadmin" replace /> },
          // Add sub-admin routes here
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);