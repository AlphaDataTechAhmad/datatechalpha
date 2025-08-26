export interface NotificationMetadata {
  videoId?: string;
  videoTitle?: string;
  thumbnailUrl?: string;
  reason?: string;
  senderId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'video_rejected' | 'video_approved' | 'message' | 'info';
  createdAt: string;
  senderId?: string;
  senderName?: string;
  recipientType?: string;
  metadata?: NotificationMetadata;
  // Appwrite specific fields
  $id?: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
}

export interface ChatMessageMetadata {
  videoId?: string;
  videoTitle?: string;
  thumbnailUrl?: string;
  isRejection?: boolean;
  reason?: string;
  senderId?: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  timestamp?: string;
  isReply?: boolean;
  replyTo?: string | null;
  replyContent?: string;
  replySenderName?: string;
  receiverName?: string;
}

export type MessageType = 'message' | 'video_rejected' | 'video_approved' | 'info';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  type: MessageType;
  createdAt: string;
  metadata?: ChatMessageMetadata;
  // Appwrite specific fields
  $id?: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
}
