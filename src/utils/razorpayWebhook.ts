import { PaymentDocument } from '@/types/appwrite';
import { savePaymentToAppwrite } from '@/lib/appwrite';

type RazorpayWebhookEvent = {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: 'captured' | 'failed' | 'refunded' | 'disputed';
        method?: string;
        bank?: string;
        card_id?: string;
        vpa?: string;
        wallet?: string;
        error_description?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

export async function handleRazorpayWebhook(event: RazorpayWebhookEvent) {
  const { event: eventType, payload } = event;
  const payment = payload.payment.entity;
  const { id: paymentId, order_id: orderId, amount, currency, notes = {} } = payment;

  try {
    const paymentData: Omit<PaymentDocument, keyof Document> = {
      userId: notes.userId || 'unknown',
      courseId: notes.courseId || 'unknown',
      paymentId,
      orderId,
      amount: amount / 100, // Convert from paise to currency unit
      currency,
      status: payment.status,
      receipt: notes.receipt || `rcpt_${Date.now()}`,
      metadata: {
        paymentMethod: payment.method,
        bank: payment.bank,
        cardId: payment.card_id,
        vpa: payment.vpa,
        wallet: payment.wallet,
        notes: notes,
        processedAt: new Date().toISOString(),
      },
    };

    // Save or update payment in Appwrite
    await savePaymentToAppwrite(paymentData);

    console.log(`Processed ${eventType} for payment ${paymentId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error processing ${eventType} webhook:`, error);
    throw error;
  }
}

// Helper to verify webhook signature
export function verifyWebhookSignature(
  webhookBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookBody)
    .digest('hex');

  return signature === expectedSignature;
}
