import { Order, PaymentSettings, EmailDraft } from "../types";

export const generatePaymentEmail = async (
  order: Order,
  settings: PaymentSettings
): Promise<EmailDraft> => {
  return {
    subject: `Payment Reminder: ${order.itemName}`,
    body: `Hi ${order.userName},\n\nPlease pay €${order.price.toFixed(2)} for your ${order.itemName}.\nDetails: ${settings.paymentMethodDetails}\n\nThanks!`
  };
};
