import React from 'react';
import { LiveLecture, User } from '../../types/liveLecture.types';
import { Button } from '../ui/button';

interface LectureListProps {
  lectures: LiveLecture[];
  currentUser: User;
  onJoinLecture: (lecture: LiveLecture) => void;
}

export const LectureList: React.FC<LectureListProps> = ({
  lectures,
  currentUser,
  onJoinLecture,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'live':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'ended':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (lectures.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No lectures scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lectures.map((lecture) => (
        <div 
          key={lecture.$id}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{lecture.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{lecture.description}</p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                <span>📅 {formatDate(lecture.scheduledTime)}</span>
                <span>⏱ {lecture.duration} minutes</span>
                <span>👤 {lecture.teacherName || 'Teacher'}</span>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={getStatusBadge(lecture.status)}>
                {lecture.status.charAt(0).toUpperCase() + lecture.status.slice(1)}
              </span>
              {lecture.status !== 'ended' && (
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoinLecture(lecture);
                  }}
                >
                  {lecture.teacherId === currentUser.$id ? 'Start' : 'Join'}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
