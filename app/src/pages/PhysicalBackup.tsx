import React, { useState, useEffect } from 'react';

export const PhysicalBackup: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch Accounting Data
                const accRes = await fetch('/api/accounting?view=general');
                const accData = await accRes.json();
                
                // Fetch Users
                const userRes = await fetch('/api/users');
                const userData = await userRes.json();
                
                // Fetch Sessions
                const sessRes = await fetch('/api/sessions');
                const sessData = await sessRes.json();

                setData(accData);
                setUsers(userData);
                setSessions(sessData);

                // Auto-print after a short delay to ensure rendering
                setTimeout(() => {
                    window.print();
                }, 500);

            } catch (e) {
                console.error(e);
            }
        };
        fetchAll();
    }, []);

    if (!data) return <div className="p-10 font-bold">Loading Backup Data...</div>;

    return (
        <div className="bg-white text-black p-8 max-w-4xl mx-auto" style={{ fontFamily: 'monospace' }}>
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-black uppercase">BevvyRun - Physical Backup</h1>
                <p className="font-bold">Generated on: {new Date().toLocaleString()}</p>
            </div>

            <div className="mb-8 border-2 border-black p-4">
                <h2 className="text-xl font-black uppercase mb-4 border-b border-black">Register & Accounting Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div><strong>Total Orders Value:</strong> ${data.totalOrdersValue.toFixed(2)}</div>
                    <div><strong>Total User Debt:</strong> ${data.totalUserDebt.toFixed(2)}</div>
                    <div><strong>Total User Credits:</strong> ${data.totalCreditBalance.toFixed(2)}</div>
                    <div><strong>Total Expenses:</strong> ${data.totalPurchases.toFixed(2)}</div>
                    <div><strong>Total Withdrawals:</strong> ${data.totalWithdrawals.toFixed(2)}</div>
                    <div className="col-span-2 text-xl mt-4">
                        <strong>Expected Register Cash:</strong> ${data.registerBalance.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-black uppercase mb-4 border-b border-black">User Balances</h2>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th className="py-1">Email</th>
                            <th className="py-1">Credit</th>
                            <th className="py-1">Debt</th>
                            <th className="py-1">Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.email} className="border-t border-gray-300">
                                <td className="py-1">{u.email}</td>
                                <td>${u.credit.toFixed(2)}</td>
                                <td>${u.debt.toFixed(2)}</td>
                                <td>${(u.credit - u.debt).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-black uppercase mb-4 border-b border-black">Expenses / Purchases</h2>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th className="py-1">Date</th>
                            <th className="py-1">Name</th>
                            <th className="py-1">Type</th>
                            <th className="py-1 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.purchases.map((p: any) => (
                            <tr key={p.id} className="border-t border-gray-300">
                                <td className="py-1">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td>{p.name}</td>
                                <td>{p.type}</td>
                                <td className="text-right">${p.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-black uppercase mb-4 border-b border-black">Withdrawals</h2>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th className="py-1">Date</th>
                            <th className="py-1 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.withdrawals.map((w: any) => (
                            <tr key={w.id} className="border-t border-gray-300">
                                <td className="py-1">{new Date(w.createdAt).toLocaleString()}</td>
                                <td className="text-right">${w.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-black uppercase mb-4 border-b border-black">Recent Sessions (Last 10)</h2>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th className="py-1">Date</th>
                            <th className="py-1">Name</th>
                            <th className="py-1">Items</th>
                            <th className="py-1">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.slice(0, 10).map((s: any) => (
                            <tr key={s.id} className="border-t border-gray-300">
                                <td className="py-1">{new Date(s.createdAt).toLocaleDateString()}</td>
                                <td>{s.name}</td>
                                <td>{s.totalItems}</td>
                                <td>{s.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-center text-sm mt-12 text-gray-500">
                End of Backup Report
            </div>
        </div>
    );
};
