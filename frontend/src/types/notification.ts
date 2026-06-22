export type NotificationType =
  | 'request_received'
  | 'request_approved'
  | 'request_declined'
  | 'return_requested'
  | 'return_confirmed'
  | 'request_cancelled';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  requestId?: string;
  createdAt: string;
}
