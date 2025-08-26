import React, { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import ReelsModal from './ReelsModal';
import { Reel } from '@/Services/reelService';

interface ReelsIconProps {
  reels: Reel[];
}

const ReelsIcon: React.FC<ReelsIconProps> = ({ reels }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const handleReelClick = (index: number) => {
    setInitialIndex(index);
    setIsModalOpen(true);
  };

  if (reels.length === 0) return null;

  return (
    <>
      <button
        onClick={() => handleReelClick(0)}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white relative"
        aria-label="View reels"
      >
        <Clapperboard className="h-6 w-6" />
      </button>
      
      {isModalOpen && (
        <ReelsModal
          reels={reels}
          initialIndex={initialIndex}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default ReelsIcon;
