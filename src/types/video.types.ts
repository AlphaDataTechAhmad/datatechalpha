export interface AppwriteVideo {
  $id: string;
  videoId: string;
  courseId: string;
  courseName?: string;
  title: string;
  description?: string;
  escription?: string; // Legacy field
  type: 'youtube' | 'upload';
  url: string;
  fileId?: string;
  duration?: number;
  order?: number;
  isPublished?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  uploadedBy: string;
  createdAt: string;
  thumbnailUrl?: string;
}

export interface LocalVideo {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration?: string | number;
  url?: string;
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'youtube' | 'upload';
  videoId?: string;
}

export type VideoLecture = LocalVideo | AppwriteVideo;

export function isAppwriteVideo(video: VideoLecture): video is AppwriteVideo {
  return 'videoId' in video && 'type' in video;
}
