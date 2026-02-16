import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { Button } from '../components/Button';
import { ArrowLeft, Copy, Check, DollarSign, Trash2, Lock, Mail } from 'lucide-react';

export const SessionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { session, isHost, submitOrder, lockSession } = useSession(id!);

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [cartItems, setCartItems] = useState<{ itemName: string, price: number, quantity: number }[]>([]);
    const [newItem, setNewItem] = useState({ itemName: '', price: '', quantity: '1' });

    const [copied, setCopied] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [emailTemplate, setEmailTemplate] = useState("Please pay {ORDER_AMOUNT}€ with reference {ORDER_ID}. Thanks!");

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/email_template');
                if (res.ok) {
                    const data = await res.json();
                    if (data.value) setEmailTemplate(data.value);
                }
            } catch (e) { console.error(e); }
        };
        fetchSettings();
    }, []);

    if (!session) return <div className="p-10 font-bold text-xl">Loading session...</div>;

    const addToCart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.itemName) return;
        setCartItems([...cartItems, { 
            itemName: newItem.itemName, 
            price: parseFloat(newItem.price) || 0,
            quantity: parseInt(newItem.quantity) || 1
        }]);
        setNewItem({ itemName: '', price: '', quantity: '1' });
    };

    const removeFromCart = (index: number) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        setCartItems(newCart);
    };

    const handleSubmitOrder = async () => {
        if (!userName || !userEmail || cartItems.length === 0) {
            alert("Please fill in your name, email, and add at least one item.");
            return;
        }

        // Expand items based on quantity
        const expandedItems = cartItems.flatMap(item => 
            Array(item.quantity).fill({ itemName: item.itemName, price: item.price })
        );

        await submitOrder(userName, userEmail, expandedItems);
        setCartItems([]);
        alert("Order submitted!");
    };

    const handleLock = async () => {
        if (confirm("Lock session and send emails?")) {
            await lockSession(emailTemplate);
            setIsLocking(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const inputClasses = "mt-1 block w-full bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-black p-3 font-medium transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 font-bold hover:underline mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black uppercase tracking-tighter">{session.name}</h1>
                        {session.status === 'LOCKED' && <span className="text-red-600 font-bold border-2 border-red-600 px-2 uppercase">LOCKED</span>}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isHost && (
                        <>
                            <span className="bg-yellow-200 border-2 border-black px-3 py-1 font-bold text-sm uppercase">
                                👑 Host Mode
                            </span>
                            <Button onClick={() => setIsLocking(!isLocking)} className="bg-red-500 text-white border-2 border-black flex items-center gap-2" disabled={session.status === 'LOCKED'}>
                                <Lock className="w-4 h-4" /> {session.status === 'LOCKED' ? 'Locked' : 'Lock & Email'}
                            </Button>
                        </>
                    )}
                    <Button onClick={copyLink} className="bg-[#ec4899] text-white border-2 border-black flex items-center gap-2">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Share Link'}
                    </Button>
                </div>
            </div>

            {isLocking && (
                <div className="mb-8 p-6 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><Mail className="w-5 h-5" /> Email Configuration</h3>
                    <p className="mb-4 text-sm text-gray-600">This will lock the session and send payment emails to all users with pending balances.</p>
                    <textarea
                        className={inputClasses}
                        rows={4}
                        value={emailTemplate}
                        onChange={e => setEmailTemplate(e.target.value)}
                    />
                    <div className="mt-4 flex gap-4">
                        <Button onClick={handleLock} className="bg-green-500 text-white">Confirm Lock & Send</Button>
                        <Button onClick={() => setIsLocking(false)} className="bg-gray-200">Cancel</Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Shopping Cart / Add Order */}
                <div className="lg:col-span-1">
                    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sticky top-24">
                        <h3 className="text-xl font-black uppercase mb-4">Your Cart</h3>

                        {session.status !== 'LOCKED' ? (
                            <>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Your Name</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={e => setUserName(e.target.value)}
                                            className={inputClasses}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Your Email</label>
                                        <input
                                            type="email"
                                            value={userEmail}
                                            onChange={e => setUserEmail(e.target.value)}
                                            className={inputClasses}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="border-t-2 border-black pt-4 mt-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={newItem.quantity}
                                                onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                                                className={`${inputClasses} w-20`}
                                                placeholder="Qty"
                                            />
                                            <input
                                                type="text"
                                                value={newItem.itemName}
                                                onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                                                className={`${inputClasses} flex-1`}
                                                placeholder="Item Name"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newItem.price}
                                                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                                className={`${inputClasses} w-24`}
                                                placeholder="Price"
                                            />
                                        </div>
                                        <Button onClick={addToCart} className="w-full bg-blue-500 text-white mt-2">Add to Cart</Button>
                                    </div>
                                </div>

                                {cartItems.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-bold border-b-2 border-black pb-2 mb-2">Current Items:</h4>
                                        <ul className="space-y-2">
                                            {cartItems.map((item, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-sm">
                                                    <span>
                                                        {item.quantity > 1 && <span className="font-bold mr-1">{item.quantity}x</span>}
                                                        {item.itemName} (${(item.price * item.quantity).toFixed(2)})
                                                    </span>
                                                    <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 font-black text-right">Total: ${cartTotal.toFixed(2)}</div>
                                        <Button onClick={handleSubmitOrder} className="w-full bg-[#ec4899] text-white mt-4">Submit Order</Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center italic text-gray-500">Session is locked. No new orders.</div>
                        )}
                    </div>
                </div>

                {/* Global Orders List */}
                <div className="lg:col-span-2">
                    <div className="bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
                        <h3 className="text-2xl font-black uppercase mb-6">Group Orders</h3>
                        {session.userOrders.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 italic">No orders yet. Be the first!</div>
                        ) : (
                            <div className="space-y-6">
                                {session.userOrders.map(order => (
                                    <div key={order.id} className={`p-4 border-2 border-black transition-all ${order.isPaid ? 'bg-green-100 opacity-75' : 'bg-white'}`}>
                                        <div className="flex justify-between items-start mb-2 border-b-2 border-gray-200 pb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black uppercase text-lg">{order.userName}</span>
                                                    {order.isPaid ? (
                                                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">PAID</span>
                                                    ) : order.paidAmount > 0 ? (
                                                        <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-bold">PAID: ${order.paidAmount.toFixed(2)}</span>
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-gray-500">Ref: {order.id}</div>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <div className="font-black text-xl">${order.totalAmount.toFixed(2)}</div>
                                                {isHost && (
                                                    <Button
                                                        onClick={async () => {
                                                            const token = localStorage.getItem('host_token');
                                                            const hostId = localStorage.getItem(`session_host_${id}`);
                                                            if (!token && !hostId) return;

                                                            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                                            if (token) headers['Authorization'] = token;
                                                            if (hostId) headers['X-Host-ID'] = hostId;

                                                            await fetch(`/api/orders/${order.id}/mark-paid`, {
                                                                method: 'POST',
                                                                headers,
                                                                body: JSON.stringify({ isPaid: !order.isPaid })
                                                            });
                                                            // Real-time update will handle UI
                                                        }}
                                                        className={`px-2 py-1 text-xs ${order.isPaid ? 'bg-gray-300' : 'bg-green-500 text-white'}`}
                                                    >
                                                        {order.isPaid ? 'Unpaid' : 'Mark Paid'}
                                                    </Button>
                                                )}
                                                {isHost && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Delete entire order?')) return;
                                                            const token = localStorage.getItem('host_token');
                                                            const hostId = localStorage.getItem(`session_host_${id}`);
                                                            if (!token && !hostId) return;

                                                            const headers: Record<string, string> = {};
                                                            if (token) headers['Authorization'] = token;
                                                            if (hostId) headers['X-Host-ID'] = hostId;

                                                            await fetch(`/api/orders/${order.id}`, {
                                                                method: 'DELETE',
                                                                headers,
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-700 font-bold"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <ul className="space-y-1">
                                            {order.items && order.items.map((item, i) => (
                                                <li key={i} className="text-sm flex justify-between items-center group">
                                                    <span>{item.itemName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-600">${item.price.toFixed(2)}</span>
                                                        {isHost && (
                                                            <>
                                                                <button
                                                                    onClick={async () => {
                                                                        const newName = prompt("Edit Item Name:", item.itemName);
                                                                        const newPrice = prompt("Edit Price:", item.price.toString());
                                                                        if (newName && newPrice) {
                                                                            const token = localStorage.getItem('host_token');
                                                                            const hostId = localStorage.getItem(`session_host_${id}`);
                                                                            if (!token && !hostId) return;

                                                                            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                                                            if (token) headers['Authorization'] = token;
                                                                            if (hostId) headers['X-Host-ID'] = hostId;

                                                                            await fetch(`/api/orders/${order.id}/items/${item.id}`, {
                                                                                method: 'PATCH',
                                                                                headers,
                                                                                body: JSON.stringify({ itemName: newName, price: parseFloat(newPrice) })
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 font-bold text-xs mr-2"
                                                                >
                                                                    EDIT
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!confirm('Delete item?')) return;
                                                                        const token = localStorage.getItem('host_token');
                                                                        const hostId = localStorage.getItem(`session_host_${id}`);
                                                                        if (!token && !hostId) return;

                                                                        const headers: Record<string, string> = {};
                                                                        if (token) headers['Authorization'] = token;
                                                                        if (hostId) headers['X-Host-ID'] = hostId;

                                                                        await fetch(`/api/orders/${order.id}/items/${item.id}`, {
                                                                            method: 'DELETE',
                                                                            headers
                                                                        });
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 font-bold"
                                                                >
                                                                    X
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
