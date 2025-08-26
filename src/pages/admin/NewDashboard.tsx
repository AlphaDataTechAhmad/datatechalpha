import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, GraduationCap, Clock, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

interface StatCardProps {
  name: string;
  value: string | number;
  icon: React.ElementType;
  change: string;
  changeType: 'increase' | 'decrease';
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ name, value, icon: Icon, change, changeType, isLoading = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
  >
    <div className="p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {name}
          </p>
          {isLoading ? (
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          changeType === 'increase' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {changeType === 'increase' ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {change} {name.includes('Courses') ? 'this week' : 'from last week'}
        </div>
        <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="inline h-3 w-3 mr-1" />
          Updated just now
        </div>
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { name: 'Total Students', value: '0', icon: GraduationCap, change: '0', changeType: 'increase' as const },
    { name: 'Total Teachers', value: '0', icon: Users, change: '0', changeType: 'increase' as const },
    { name: 'Total Courses', value: '0', icon: BookOpen, change: '0', changeType: 'increase' as const },
    { name: 'Active Users', value: '0', icon: Users, change: '0', changeType: 'increase' as const },
  ]);
  
  const [analytics, setAnalytics] = useState({
    newStudents: 0,
    courseCompletion: '0%',
    avgSession: '0 min'
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API calls
        const mockData = {
          students: 1245,
          teachers: 42,
          courses: 35,
          activeUsers: 876,
          newStudents: 187,
          courseCompletion: '78%',
          avgSession: '24 min'
        };

        setStats([
          { 
            ...stats[0], 
            value: mockData.students.toLocaleString(),
            change: '12%',
            changeType: 'increase'
          },
          { 
            ...stats[1], 
            value: mockData.teachers.toLocaleString(),
            change: '5%',
            changeType: 'increase'
          },
          { 
            ...stats[2], 
            value: mockData.courses.toString(),
            change: '3',
            changeType: 'increase'
          },
          { 
            ...stats[3], 
            value: mockData.activeUsers.toString(),
            change: '8%',
            changeType: 'increase'
          },
        ]);

        setAnalytics({
          newStudents: mockData.newStudents,
          courseCompletion: mockData.courseCompletion,
          avgSession: mockData.avgSession
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 p-6">
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          Dashboard
        </motion.h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Real-time insights and analytics for your learning platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.name}
            name={stat.name}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Analytics Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Analytics</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Key metrics and performance indicators
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New Students</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isLoading ? '--' : analytics.newStudents.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Course Completion</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isLoading ? '--' : analytics.courseCompletion}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Session</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isLoading ? '--' : analytics.avgSession}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
