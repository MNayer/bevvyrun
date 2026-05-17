import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

interface Purchase {
    id: string;
    name: string;
    amount: number;
    type: string;
    imageFilename: string | null;
    createdAt: number;
}

interface Withdrawal {
    id: string;
    amount: number;
    createdAt: number;
}

interface AccountingData {
    totalOrdersValue: number;
    totalUserDebt: number;
    totalCreditBalance: number;
    totalPurchases: number;
    totalWithdrawals: number;
    registerBalance: number;
    moneyCollectedFromOrders: number;
    purchases: Purchase[];
    withdrawals: Withdrawal[];
}

export const Accounting: React.FC = () => {
    const [view, setView] = useState<'general' | 'coffee'>('general');
    const [data, setData] = useState<AccountingData | null>(null);
    const [loading, setLoading] = useState(true);

    // New Purchase State
    const [purchaseName, setPurchaseName] = useState('');
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [purchaseType, setPurchaseType] = useState('COFFEE');
    const [purchaseImage, setPurchaseImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New Withdrawal State
    const [withdrawalAmount, setWithdrawalAmount] = useState('');

    const token = localStorage.getItem('host_token');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/accounting?view=${view}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [view]);

    if (!token) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="bg-red-100 border-2 border-red-500 p-4 font-bold">
                    Access Denied. You must be logged in as the host to view accounting.
                </div>
            </div>
        );
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPurchaseImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submitPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(purchaseAmount);
        if (!purchaseName || isNaN(amt)) return;

        await fetch('/api/purchases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                name: purchaseName,
                amount: amt,
                type: purchaseType,
                image: purchaseImage
            })
        });

        setPurchaseName('');
        setPurchaseAmount('');
        setPurchaseImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchData();
    };

    const submitWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(withdrawalAmount);
        if (isNaN(amt)) return;

        await fetch('/api/withdrawals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ amount: amt })
        });

        setWithdrawalAmount('');
        fetchData();
    };

    const inputClasses = "mt-1 block w-full bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 font-medium focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all";

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
            <div className="flex justify-between items-center bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-black hover:opacity-70">
                        <ArrowLeft className="w-8 h-8" />
                    </Link>
                    <h1 className="text-3xl font-black uppercase flex items-center gap-2">
                        <DollarSign className="w-8 h-8" /> Accounting
                    </h1>
                </div>
                <div className="flex gap-4">
                    <Button 
                        onClick={() => window.open('/physical-backup', '_blank')}
                        className="bg-purple-600 text-white"
                    >
                        Print Backup
                    </Button>
                    <div className="flex bg-gray-200 border-2 border-black p-1">
                        <button 
                            className={`px-4 py-2 font-bold uppercase transition-colors ${view === 'general' ? 'bg-black text-white' : 'hover:bg-gray-300'}`}
                            onClick={() => setView('general')}
                        >
                            General
                        </button>
                        <button 
                            className={`px-4 py-2 font-bold uppercase transition-colors ${view === 'coffee' ? 'bg-black text-white' : 'hover:bg-gray-300'}`}
                            onClick={() => setView('coffee')}
                        >
                            Coffee
                        </button>
                    </div>
                </div>
            </div>

            {loading || !data ? (
                <div className="text-center font-bold text-xl py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Summary Cards */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#10b981] text-black border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h3 className="font-black uppercase mb-2 text-lg">Expected Register Cash</h3>
                            <div className="text-5xl font-black">${data.registerBalance.toFixed(2)}</div>
                            {view === 'general' && (
                                <div className="mt-4 text-sm font-bold border-t-2 border-black pt-2">
                                    Total Collected: ${(data.moneyCollectedFromOrders + data.totalCreditBalance).toFixed(2)}<br/>
                                    - Expenses: ${data.totalPurchases.toFixed(2)}<br/>
                                    - Withdrawals: ${data.totalWithdrawals.toFixed(2)}
                                </div>
                            )}
                        </div>
                        <div className="bg-[#f59e0b] text-black border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h3 className="font-black uppercase mb-2 text-lg">Outstanding Claims (Debt)</h3>
                            <div className="text-5xl font-black">${data.totalUserDebt.toFixed(2)}</div>
                        </div>
                        <div className="bg-[#3b82f6] text-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h3 className="font-black uppercase mb-2 text-lg">Expenses</h3>
                            <div className="text-5xl font-black">${data.totalPurchases.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Purchases Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6" /> Add Expense / Invoice
                            </h2>
                            <form onSubmit={submitPurchase} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold uppercase mb-1">Name / Description</label>
                                    <input type="text" value={purchaseName} onChange={e => setPurchaseName(e.target.value)} required className={inputClasses} placeholder="e.g. Flaschenpost Order" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Amount ($)</label>
                                    <input type="number" step="0.01" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} required className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Type</label>
                                    <select value={purchaseType} onChange={e => setPurchaseType(e.target.value)} className={inputClasses}>
                                        <option value="COFFEE">Coffee Beans</option>
                                        <option value="OTHER">Other (Flaschenpost etc)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold uppercase mb-1">Invoice Image (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="file:border-2 file:border-black file:bg-yellow-300 file:text-black file:font-bold file:px-4 file:py-2 file:mr-4 hover:file:bg-yellow-400 cursor-pointer text-sm font-bold" />
                                        {purchaseImage && <span className="text-green-600 font-bold flex items-center gap-1"><ImageIcon className="w-4 h-4"/> Attached</span>}
                                    </div>
                                </div>
                                <div className="md:col-span-2 mt-2">
                                    <Button type="submit" className="w-full bg-black text-white">Save Expense</Button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h2 className="text-xl font-black uppercase mb-4">Expense History</h2>
                            {data.purchases.length === 0 ? (
                                <p className="text-gray-500 italic font-bold">No expenses found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.purchases.map(p => (
                                        <div key={p.id} className="border-2 border-gray-200 p-4 flex justify-between items-center">
                                            <div>
                                                <div className="font-black text-lg">{p.name}</div>
                                                <div className="text-sm font-bold text-gray-500">{new Date(p.createdAt).toLocaleDateString()} - {p.type}</div>
                                                {p.imageFilename && (
                                                    <a href={`/uploads/${p.imageFilename}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-xs mt-1 inline-block hover:underline">
                                                        View Invoice
                                                    </a>
                                                )}
                                            </div>
                                            <div className="font-black text-xl text-red-600">
                                                -${p.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Withdrawals Column */}
                    <div className="space-y-8">
                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h2 className="text-xl font-black uppercase mb-4 text-red-600 flex items-center gap-2">
                                <DollarSign className="w-6 h-6" /> Withdraw Cash
                            </h2>
                            <p className="text-xs font-bold text-gray-600 mb-4">Admin withdraws cash to pay for expenses upfront.</p>
                            <form onSubmit={submitWithdrawal} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Amount ($)</label>
                                    <input type="number" step="0.01" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} required className={inputClasses} />
                                </div>
                                <Button type="submit" className="w-full bg-red-600 text-white">Record Withdrawal</Button>
                            </form>
                        </div>

                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h2 className="text-xl font-black uppercase mb-4">Withdrawal History</h2>
                            {data.withdrawals.length === 0 ? (
                                <p className="text-gray-500 italic font-bold">No withdrawals found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.withdrawals.map(w => (
                                        <div key={w.id} className="border-b-2 border-gray-200 pb-2 flex justify-between items-center">
                                            <div className="text-sm font-bold text-gray-600">{new Date(w.createdAt).toLocaleString()}</div>
                                            <div className="font-black text-red-600">-${w.amount.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
