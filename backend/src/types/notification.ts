export type NotificationType =
  | 'request_received'
  | 'request_approved'
  | 'request_declined'
  | 'return_requested'
  | 'return_confirmed'
  | 'request_cancelled'
  | 'id_verified'
  | 'id_rejected'
  | 'counter_offered'
  | 'counter_accepted'
  | 'counter_declined'
  | 'account_disabled'
  | 'account_enabled'
  | 'item_disabled';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  requestId?: string;
  createdAt: string;
}
