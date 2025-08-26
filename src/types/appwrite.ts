// Types for Appwrite database documents

export interface PaymentDocument {
  $id?: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
  
  // Payment fields
  userId: string;
  courseId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'created' | 'captured' | 'failed' | 'refunded' | 'disputed';
  receipt: string;
  metadata: {
    [key: string]: any;
    paymentMethod?: string;
    bank?: string;
    cardId?: string;
    vpa?: string;
    wallet?: string;
    error?: string;
    verifiedAt?: string;
    processedAt?: string;
    failedAt?: string;
  };
}
