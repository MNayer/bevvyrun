import React, { useState } from 'react';
import { Trash2, CheckCircle, Mail } from 'lucide-react';
import { Order, OrderStatus, PaymentSettings } from '../types';
import { Button } from './Button';
import { generatePaymentEmail } from '../services/geminiService';

interface OrderListProps {
  orders: Order[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  paymentSettings: PaymentSettings;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onDelete, onStatusChange, paymentSettings }) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleSendEmail = async (order: Order) => {
    setGeneratingId(order.id);
    try {
      const draft = await generatePaymentEmail(order, paymentSettings);
      const subject = encodeURIComponent(draft.subject);
      const body = encodeURIComponent(draft.body);
      const mailtoLink = `mailto:${order.userEmail}?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;
    } catch (error) {
      alert("Failed to generate email");
    } finally {
      setGeneratingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
        <div className="text-xl font-bold text-black">NO ORDERS YET</div>
        <div className="text-gray-500 mt-2">Add your beverage request above!</div>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    const base = "px-3 py-1 text-xs font-bold uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
    switch(status) {
      case OrderStatus.PENDING: return `${base} bg-[#fcd34d] text-black`; // Yellow
      case OrderStatus.ORDERED: return `${base} bg-[#60a5fa] text-black`; // Blue
      case OrderStatus.PAID: return `${base} bg-[#4ade80] text-black`;    // Green
      default: return base;
    }
  };

  return (
    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <ul className="divide-y-2 divide-black">
        {orders.map((order) => (
          <li key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-lg text-black">{order.userName}</span>
                <span className={getStatusBadge(order.status)}>
                  {order.status}
                </span>
              </div>
              <div className="text-base font-medium text-black">
                {order.itemName} — <span className="bg-black text-white px-1">€{order.price.toFixed(2)}</span>
              </div>
              {order.userEmail && <div className="text-xs text-gray-500 mt-1 font-mono">{order.userEmail}</div>}
            </div>

            <div className="flex items-center gap-3">
              {order.status === OrderStatus.PENDING && (
                <Button variant="secondary" onClick={() => onDelete(order.id)} aria-label="Delete" className="!p-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              )}

              {order.status === OrderStatus.ORDERED && (
                <Button 
                    variant="primary" 
                    onClick={() => handleSendEmail(order)}
                    isLoading={generatingId === order.id}
                    title="Generate & Send Reminder"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  REMIND
                </Button>
              )}

              {order.status !== OrderStatus.PAID && (
                 <Button 
                    variant="secondary"
                    onClick={() => {
                        const next = order.status === OrderStatus.PENDING ? OrderStatus.ORDERED : OrderStatus.PAID;
                        onStatusChange(order.id, next);
                    }}
                 >
                    {order.status === OrderStatus.PENDING ? <CheckCircle className="w-5 h-5" /> : "MARK PAID"}
                 </Button>
              )}

              {order.status === OrderStatus.PAID && (
                <div className="flex items-center text-black gap-1 font-bold bg-[#4ade80] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CheckCircle className="w-5 h-5" />
                    <span>DONE</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};