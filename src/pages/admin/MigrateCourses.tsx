import React, { useState } from 'react';
import { migrateAllCourses } from '../../utils/migrateCourses';
import { toast } from 'react-toastify';

const MigrateCourses = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: number;
    error: number;
  } | null>(null);

  const handleMigration = async () => {
    if (!window.confirm('Are you sure you want to migrate all courses to Appwrite? This will add all courses from your local data to the database.')) {
      return;
    }

    try {
      setIsMigrating(true);
      setMigrationResult(null);
      
      const result = await migrateAllCourses();
      setMigrationResult(result);
      
      if (result.error === 0) {
        toast.success(`Successfully migrated ${result.success} courses!`);
      } else {
        toast.warning(`Migrated ${result.success} courses, but failed to migrate ${result.error} courses.`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Failed to migrate courses. Please check the console for details.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Migrate Courses to Appwrite
        </h1>
        
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <h2 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">Important Notes</h2>
          <ul className="mt-2 text-yellow-700 dark:text-yellow-300 text-sm list-disc pl-5 space-y-1">
            <li>This will migrate all courses from your local data to Appwrite.</li>
            <li>Existing courses with the same ID will be skipped to prevent duplicates.</li>
            <li>This operation might take a few minutes depending on the number of courses.</li>
            <li>Make sure you have a stable internet connection.</li>
          </ul>
        </div>

        <div className="mt-6">
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isMigrating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isMigrating ? 'Migrating...' : 'Start Migration'}
          </button>
        </div>

        {migrationResult && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
            <h3 className="text-lg font-medium text-green-800 dark:text-green-200">Migration Complete</h3>
            <div className="mt-2 text-green-700 dark:text-green-300">
              <p>✅ Successfully migrated: {migrationResult.success} courses</p>
              {migrationResult.error > 0 && (
                <p>❌ Failed to migrate: {migrationResult.error} courses</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrateCourses;
