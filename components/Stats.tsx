import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Order, OrderStatus } from '../types';

interface StatsProps {
  orders: Order[];
}

export const Stats: React.FC<StatsProps> = ({ orders }) => {
  const data = useMemo(() => {
    const pending = orders.filter(o => o.status === OrderStatus.PENDING).reduce((acc, o) => acc + o.price, 0);
    const ordered = orders.filter(o => o.status === OrderStatus.ORDERED).reduce((acc, o) => acc + o.price, 0);
    const paid = orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, o) => acc + o.price, 0);

    return [
      { name: 'Pending', value: pending, color: '#fcd34d' }, // yellow
      { name: 'Ordered', value: ordered, color: '#60a5fa' }, // blue
      { name: 'Paid', value: paid, color: '#4ade80' },       // green
    ].filter(item => item.value > 0);
  }, [orders]);

  const total = orders.reduce((acc, o) => acc + o.price, 0);

  if (total === 0) return null;

  return (
    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
        <h3 className="text-xl font-bold text-black uppercase mb-4 text-center border-b-2 border-black pb-2">Money Talk</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="#000000"
                strokeWidth={2}
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        border: '2px solid black', 
                        borderRadius: '0px', 
                        boxShadow: '4px 4px 0px 0px black' 
                    }} 
                    formatter={(value: number) => `€${value.toFixed(2)}`} 
                />
                <Legend 
                    wrapperStyle={{ paddingTop: '10px' }} 
                    iconType="square"
                />
            </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="text-center mt-4 bg-black text-white p-2 border-2 border-transparent shadow-[4px_4px_0px_0px_#8b5cf6]">
            <span className="text-2xl font-bold">€{total.toFixed(2)}</span>
            <span className="text-gray-300 ml-2 text-sm uppercase">Total Value</span>
        </div>
    </div>
  );
};