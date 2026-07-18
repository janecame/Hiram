export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
export type PaymentMethod = 'paymongo' | 'cash';

export interface Payment {
  id: string;
  requestId: string;
  borrowerId: string;
  listerId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paymongoCheckoutSessionId?: string;
  paymongoPaymentId?: string;
  checkoutUrl?: string;
  paidAt?: string;
  createdAt: string;
}
