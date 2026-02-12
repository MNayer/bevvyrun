import { GoogleGenAI, Type } from "@google/genai";
import { Order, PaymentSettings, EmailDraft } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generatePaymentEmail = async (
  order: Order,
  settings: PaymentSettings
): Promise<EmailDraft> => {
  if (!apiKey) {
    // Fallback if no API key is present
    return {
      subject: `Payment Reminder: ${order.itemName}`,
      body: `Hi ${order.userName},\n\nPlease pay ${order.price} for your ${order.itemName}.\nDetails: ${settings.paymentMethodDetails}\n\nThanks!`
    };
  }

  try {
    const prompt = `
      Write a friendly, short, and polite payment reminder email from ${settings.recipientName} to ${order.userName}.
      The context is a casual office beverage order.
      
      Details:
      - Item Ordered: ${order.itemName}
      - Amount Due: $${order.price.toFixed(2)}
      - Payment Method: ${settings.paymentMethodDetails}
      
      The tone should be casual but clear about the money owed.
      Return the result as a JSON object with "subject" and "body" fields.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["subject", "body"]
        }
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("Empty response from Gemini");
    }
    
    return JSON.parse(text) as EmailDraft;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback on error
    return {
        subject: `Payment for ${order.itemName}`,
        body: `Hey ${order.userName}, could you please send $${order.price} for the ${order.itemName}? Thanks! (${settings.paymentMethodDetails})`
    };
  }
};

export const summarizeOrders = async (orders: Order[]): Promise<string> => {
    if (!apiKey || orders.length === 0) return "No orders to summarize.";

    try {
        const orderSummary = orders.map(o => `${o.userName} wants ${o.itemName} ($${o.price})`).join('\n');
        const prompt = `
            Summarize the following beverage orders into a concise list for the person ordering. 
            Group similar items if possible. 
            Calculate the total estimated cost.
            
            Orders:
            ${orderSummary}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "Could not generate summary.";
    } catch (e) {
        console.error(e);
        return "Error generating summary.";
    }
}
