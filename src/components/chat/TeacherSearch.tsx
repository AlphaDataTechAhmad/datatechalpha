import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, PROFILE_COLLECTION_ID } from '@/Services/appwrite';
import { Query, Models, AppwriteException } from 'appwrite';

interface Teacher {
  $id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TeacherSearchProps {
  onSelectTeacher: (teacherId: string, teacherName: string) => void;
}

export const TeacherSearch: React.FC<TeacherSearchProps> = ({ onSelectTeacher }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchTeachers = async () => {
      if (searchTerm.length < 2) {
        setTeachers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await databases.listDocuments<Models.Document>(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          [
            Query.contains('name', searchTerm),
            Query.limit(10),
            Query.offset(0),
            Query.orderDesc('$createdAt'),
            Query.equal('role', 'teacher')
          ]
        );
        
        const teachers = response.documents.map(doc => ({
          $id: doc.$id,
          name: doc.name || 'Unknown Teacher',
          email: doc.email || '',
          avatar: doc.avatar || '/default-avatar.png'
        } as Teacher));
        
        setTeachers(teachers);
      } catch (error: any) {
        if (error instanceof AppwriteException) {
          console.error('Appwrite error searching teachers:', error.message);
        } else {
          console.error('Error searching teachers:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTeachers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search teachers by name..."
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-gray-500">Searching...</div>
          ) : teachers.length > 0 ? (
            teachers.map((teacher) => (
              <div
                key={teacher.$id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => {
                  onSelectTeacher(teacher.$id, teacher.name);
                  setSearchTerm('');
                  setTeachers([]);
                }}
              >
                {teacher.avatar && (
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <div>
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-sm text-gray-500">{teacher.email}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No teachers found</div>
          )}
        </div>
      )}
    </div>
  );
};
