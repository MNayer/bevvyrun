export enum OrderStatus {
  PENDING = 'PENDING',
  ORDERED = 'ORDERED',
  PAID = 'PAID'
}

export interface Order {
  id: string;
  userName: string;
  userEmail: string;
  itemName: string;
  price: number;
  status: OrderStatus;
  createdAt: number;
}

export interface PaymentSettings {
  recipientName: string;
  recipientEmail: string;
  paymentMethodDetails: string; // e.g., "PayPal: my@email.com" or "IBAN: ..."
}

export interface EmailDraft {
  subject: string;
  body: string;
}

// WebRTC Message Types
export type MessageType = 'SYNC_STATE' | 'ADD_ORDER' | 'DELETE_ORDER' | 'UPDATE_STATUS' | 'LOCK_ALL';

export interface SyncMessage {
  type: 'SYNC_STATE';
  payload: Order[];
}

export interface AddOrderMessage {
  type: 'ADD_ORDER';
  payload: Order;
}

export interface DeleteOrderMessage {
  type: 'DELETE_ORDER';
  payload: string; // Order ID
}

export interface UpdateStatusMessage {
  type: 'UPDATE_STATUS';
  payload: { id: string; status: OrderStatus };
}

export interface LockAllMessage {
  type: 'LOCK_ALL';
}

export type WebRTCMessage = SyncMessage | AddOrderMessage | DeleteOrderMessage | UpdateStatusMessage | LockAllMessage;
