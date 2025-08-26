import React, { useEffect, useState } from 'react';
import { databases } from '../Services/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { Query } from 'appwrite';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';

const TEST_RESULTS_COLLECTION_ID = "684da84500159ddfea6f";
const DATABASE_ID = '68261b6a002ba6c3b584';

interface TestReportData {
  $id: string;
  testName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  takenAt: string;
  userId: string; // Added missing property based on the query filter
}

const ReportCard: React.FC<{ report: TestReportData }> = ({ report }) => {
  const data = [
    { name: 'Correct', value: report.percentage },
    { name: 'Incorrect', value: 100 - report.percentage },
  ];
  const COLORS = ['#4CAF50', '#F44336'];

  return (
    <div className="bg-white dark:bg-dark-700 rounded-xl shadow-md border border-gray-200 dark:border-dark-600 p-4 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{report.testName || 'Unnamed Test'}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${report.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {report.percentage >= 50 ? 'Passed' : 'Failed'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 items-center">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#8884d8">
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${report.percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>
            {report.percentage?.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Score: {report.score}/{report.totalMarks}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {new Date(report.takenAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const TestReport: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<TestReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        setError('You must be logged in to view test reports.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          TEST_RESULTS_COLLECTION_ID,
          [Query.equal('userId', user.$id), Query.orderDesc('takenAt')]
        );
        // Added type assertion with proper error handling
        if (response.documents && Array.isArray(response.documents)) {
          setReports(response.documents as TestReportData[]);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to fetch test reports:', err);
        setError('Failed to load test reports. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-500">
        <Inbox className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold">No Test Reports Found</h3>
        <p>Your test results will appear here once you complete a test.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold dark:text-white mb-6">Test Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {reports.map(report => (
          <ReportCard key={report.$id} report={report} />
        ))}
      </div>
    </div>
  );
};

export default TestReport;