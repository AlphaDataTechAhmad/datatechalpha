import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load components for better performance
const IntelliTestHome = React.lazy(() => import('../pages/intellitest'));
const StudentDashboard = React.lazy(() => import('../pages/intellitest/StudentDashboard'));
const ExamInterface = React.lazy(() => import('../pages/intellitest/ExamInterface'));
const ExamResults = React.lazy(() => import('../pages/intellitest/ExamResults'));

// Loading component for suspense fallback
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const IntelliTestRoutes = () => {
  return (
    <React.Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<IntelliTestHome />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/exam/:examId" element={<ExamInterface />} />
        <Route path="/results/:examId" element={<ExamResults />} />
        
        {/* Redirect any unknown routes to the home page */}
        <Route path="*" element={<Navigate to="/intellitest" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default IntelliTestRoutes;
