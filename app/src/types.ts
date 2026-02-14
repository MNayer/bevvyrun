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
