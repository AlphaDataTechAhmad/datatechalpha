import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, PROFILE_COLLECTION_ID, Query } from '../../Services/appwrite';
import { User, SubAdminPermissions } from '../../types/user.types';
import { updateSubAdminPermissions } from '../../utils/subAdminUtils';
import { toast } from 'sonner';
import { Switch } from '../../components/ui/switch';

interface SubAdminWithPermissions extends User {
  subAdminPermissions: SubAdminPermissions;
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  // Add other required properties from the User type
  accountId: string;
  name: string;
  email: string;
  imageUrl: string;
  enrolledCourses: any[];
  role?: UserRole;
}

const SubAdmins: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [subAdmins, setSubAdmins] = useState<SubAdminWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdminWithPermissions | null>(null);
  const [permissions, setPermissions] = useState<SubAdminPermissions>({
    videoReview: false,
    notesReview: false,
    teacherManagement: false,
    studentManagement: false,
    reelsManagement: false,
  });
  

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  useEffect(() => {
    if (selectedSubAdmin?.subAdminPermissions) {
      setPermissions({
        videoReview: selectedSubAdmin.subAdminPermissions.videoReview || false,
        notesReview: selectedSubAdmin.subAdminPermissions.notesReview || false,
        teacherManagement: selectedSubAdmin.subAdminPermissions.teacherManagement || false,
        studentManagement: selectedSubAdmin.subAdminPermissions.studentManagement || false,
        reelsManagement: selectedSubAdmin.subAdminPermissions.reelsManagement || false,
      });
    } else {
      setPermissions({
        videoReview: false,
        notesReview: false,
        teacherManagement: false,
        studentManagement: false,
        reelsManagement: false,
      });
    }
  }, [selectedSubAdmin]);

  const fetchSubAdmins = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [
          Query.equal('role', ['subadmin']),
          Query.limit(100)
        ]
      );

      // Parse subAdminPermissions from JSON string if it exists
      const formattedSubAdmins = response.documents.map(doc => {
        let permissions: SubAdminPermissions;
        
        try {
          permissions = doc.subAdminPermissions 
            ? JSON.parse(doc.subAdminPermissions) 
            : {
                videoReview: false,
                notesReview: false,
                teacherManagement: false,
                studentManagement: false,
                reelsManagement: false
              };
        } catch (e) {
          console.error('Error parsing permissions:', e);
          permissions = {
            videoReview: false,
            notesReview: false,
            teacherManagement: false,
            studentManagement: false,
            reelsManagement: false
          };
        }

        // Ensure all required fields are present
        const subAdmin: SubAdminWithPermissions = {
          ...doc,
          accountId: doc.accountId || '',
          name: doc.name || 'Unknown',
          email: doc.email || '',
          imageUrl: doc.imageUrl || '',
          enrolledCourses: doc.enrolledCourses || [],
          subAdminPermissions: permissions
        };

        return subAdmin;
      });


      setSubAdmins(formattedSubAdmins);
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
      setError('Failed to load sub-admins');
    } finally {
      setLoading(false);
    }
  };





  const handleSelectSubAdmin = (admin: SubAdminWithPermissions) => {
    setSelectedSubAdmin(admin);
    // The permissions will be updated by the useEffect that watches selectedSubAdmin
  };

  const handleSavePermissions = async () => {
    if (!selectedSubAdmin) return;
    
    try {
      const updatedPermissions: SubAdminPermissions = {
        videoReview: permissions.videoReview || false,
        notesReview: permissions.notesReview || false,
        teacherManagement: permissions.teacherManagement || false,
        studentManagement: permissions.studentManagement || false,
        reelsManagement: permissions.reelsManagement || false
      };
      
      await updateSubAdminPermissions(selectedSubAdmin.$id, updatedPermissions);
      
      // Refresh user data and subadmins list
      if (refreshUserData) {
        await refreshUserData();
      }
      await fetchSubAdmins();
      
      // Show success message
      toast.success('Permissions updated successfully');
    } catch (err) {
      console.error('Error updating permissions:', err);
      toast.error('Failed to update permissions. Please try again.');
    }
  };



  const handlePermissionChange = async (permission: keyof SubAdminPermissions, value: boolean) => {
    if (!selectedSubAdmin) return;
    
    // Create new permissions object with the updated value
    const newPermissions: SubAdminPermissions = {
      ...permissions,
      [permission]: value
    };
    
    // Update local state immediately for a responsive UI
    setPermissions(newPermissions);
    
    // Create an updated subadmin object with the new permissions
    const updatedSubAdmin: SubAdminWithPermissions = {
      ...selectedSubAdmin,
      subAdminPermissions: newPermissions
    };
    
    // Update the selected subadmin in the list
    setSelectedSubAdmin(updatedSubAdmin);
    setSubAdmins(prev => 
      prev.map(admin => 
        admin.$id === selectedSubAdmin.$id ? updatedSubAdmin : admin
      )
    );
    
    try {
      // Save to the backend
      await updateSubAdminPermissions(selectedSubAdmin.$id, newPermissions);
      
      // If the current user updated their own permissions, refresh their data
      if (user?.$id === selectedSubAdmin.$id && refreshUserData) {
        await refreshUserData();
      }
      
      // Notify other components of the permission change
      window.dispatchEvent(new Event('permissionsUpdated'));
      toast.success('Permissions updated successfully');
    } catch (error) {
      console.error('Error updating permissions:', error);
      
      // Revert the UI if the update fails
      setPermissions(selectedSubAdmin.subAdminPermissions || {
        videoReview: false,
        notesReview: false,
        teacherManagement: false,
        studentManagement: false,
        reelsManagement: false
      });
      
      toast.error('Failed to update permissions');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sub-Admin Management</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sub-Admin List */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Sub-Admins</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {subAdmins.map((subAdmin) => (
              <div
                key={subAdmin.$id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSubAdmin?.$id === subAdmin.$id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-white'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
                onClick={() => setSelectedSubAdmin(subAdmin)}
              >
                <div className="font-medium">{subAdmin.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{subAdmin.email}</div>
              </div>
            ))}
            {subAdmins.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                No sub-admins found
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div className="lg:col-span-3 bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          {selectedSubAdmin ? (
            <>
              <h2 className="text-xl font-semibold mb-6">
                Permissions for {selectedSubAdmin.name}
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Video Review</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Allow access to video review section
                    </p>
                  </div>
                  <Switch
                    checked={permissions.videoReview}
                    onCheckedChange={(checked: boolean) => handlePermissionChange('videoReview', checked)}
                    className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Notes Review</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Allow access to notes review section
                    </p>
                  </div>
                  <Switch
                    checked={permissions.notesReview}
                    onCheckedChange={(checked: boolean) => handlePermissionChange('notesReview', checked)}
                    className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Teacher Management</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Allow managing teachers
                    </p>
                  </div>
                  <Switch
                    checked={permissions.teacherManagement}
                    onCheckedChange={(checked: boolean) => handlePermissionChange('teacherManagement', checked)}
                    className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Student Management</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Allow managing students
                    </p>
                  </div>
                  <Switch
                    checked={permissions.studentManagement}
                    onCheckedChange={(checked: boolean) => handlePermissionChange('studentManagement', checked)}
                    className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Reels Management</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Allow managing reels content
                    </p>
                  </div>
                  <Switch
                    checked={permissions.reelsManagement}
                    onCheckedChange={(checked: boolean) => handlePermissionChange('reelsManagement', checked)}
                    className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0111.317-2M17 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Select a sub-admin
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a sub-admin from the list to view and manage their permissions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubAdmins;
