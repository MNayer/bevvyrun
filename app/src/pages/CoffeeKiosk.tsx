import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coffee, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const CoffeeKiosk: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [inputEmail, setInputEmail] = useState('');
    
    const [active, setActive] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [price, setPrice] = useState(0);
    const [userCoffees, setUserCoffees] = useState(0);
    const [userSpent, setUserSpent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);
    
    // Animation state
    const [justOrdered, setJustOrdered] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem('coffee_email');
        if (storedEmail) {
            setEmail(storedEmail);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchActiveRun = async (userEmail: string) => {
        try {
            const res = await fetch(`/api/coffee-run/active?email=${encodeURIComponent(userEmail)}`);
            if (res.ok) {
                const data = await res.json();
                setActive(data.active);
                if (data.active) {
                    setSession(data.session);
                    setPrice(data.currentCoffeePrice);
                    setUserCoffees(data.userCoffees);
                    setUserSpent(data.userSpent);
                }
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (email) {
            setLoading(true);
            fetchActiveRun(email);
        }
    }, [email]);

    const handleSaveEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputEmail.trim() && inputEmail.includes('@')) {
            localStorage.setItem('coffee_email', inputEmail.trim());
            setEmail(inputEmail.trim());
        } else {
            alert('Please enter a valid email address.');
        }
    };

    const handleOrder = async () => {
        if (ordering) return;
        setOrdering(true);
        try {
            const res = await fetch('/api/coffee-run/active/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                const data = await res.json();
                // Play animation and update optimistic UI
                setJustOrdered(true);
                setUserCoffees(prev => prev + 1);
                setUserSpent(prev => prev + data.price);
                setTimeout(() => setJustOrdered(false), 2000);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to order');
            }
        } catch (e) {
            console.error(e);
            alert('Error ordering coffee');
        }
        setOrdering(false);
    };

    const handleChangeEmail = () => {
        localStorage.removeItem('coffee_email');
        setEmail('');
        setInputEmail('');
        setActive(false);
        setSession(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen font-black text-2xl uppercase">Loading...</div>;
    }

    if (!email) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
                <Coffee className="w-16 h-16 mx-auto mb-6 text-[#8b5cf6]" />
                <h1 className="text-3xl font-black uppercase mb-2">Welcome to Coffee Run!</h1>
                <p className="text-gray-600 font-bold mb-8">Enter your email to get your quick-order dashboard.</p>
                
                <form onSubmit={handleSaveEmail} className="space-y-4">
                    <input 
                        type="email" 
                        value={inputEmail}
                        onChange={e => setInputEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#fce7f3] text-black border-4 border-black p-4 font-black text-lg focus:outline-none focus:bg-[#fbcfe8] transition-colors"
                        required
                    />
                    <Button type="submit" className="w-full bg-[#10b981] text-black text-xl py-4 border-4 border-black hover:bg-[#059669]">
                        Start Ordering
                    </Button>
                </form>
            </div>
        );
    }

    if (!active) {
        return (
            <div className="max-w-lg mx-auto mt-20 p-8 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
                <div className="bg-gray-200 border-4 border-black p-6 inline-block mb-6 transform -rotate-2">
                    <Coffee className="w-16 h-16 text-gray-500" />
                </div>
                <h1 className="text-4xl font-black uppercase mb-4">No Active Run</h1>
                <p className="text-gray-600 font-bold text-lg mb-8">There is currently no coffee run happening. Ask your host to start one!</p>
                <div className="flex gap-4 justify-center">
                    <Link to="/">
                        <Button className="bg-[#8b5cf6] text-white border-4 border-black">Go to Dashboard</Button>
                    </Link>
                    <Button onClick={handleChangeEmail} className="bg-gray-200 text-black border-4 border-black">Change Email</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <Link to="/" className="inline-flex items-center gap-2 font-black hover:underline uppercase text-sm border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
                <button onClick={handleChangeEmail} className="text-sm font-bold text-gray-500 hover:text-black underline">
                    Not {email}? Change
                </button>
            </div>

            <div className="bg-[#fcd34d] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 text-center relative overflow-hidden">
                <h2 className="text-3xl font-black uppercase mb-2 tracking-tighter">{session.name}</h2>
                <div className="inline-block bg-white border-4 border-black px-4 py-2 font-black text-xl mb-8 transform rotate-2">
                    ${price.toFixed(2)} / cup
                </div>

                <div className="flex flex-col items-center justify-center mb-10">
                    <button 
                        onClick={handleOrder}
                        disabled={ordering}
                        className={`group relative bg-[#ec4899] border-4 border-black text-white font-black uppercase text-3xl px-12 py-8 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all ${ordering ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {justOrdered ? (
                            <span className="flex items-center gap-3 animate-pulse">
                                <CheckCircle className="w-10 h-10" /> Got It!
                            </span>
                        ) : (
                            <span className="flex items-center gap-3">
                                Add Coffee <Coffee className="w-10 h-10 group-hover:animate-bounce" />
                            </span>
                        )}
                    </button>
                    {justOrdered && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl pointer-events-none animate-[ping_1s_ease-out_forwards]">
                            ☕
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border-4 border-black p-4 text-left">
                        <div className="text-sm font-bold text-gray-500 uppercase">Your Coffees</div>
                        <div className={`text-5xl font-black text-[#8b5cf6] transition-transform ${justOrdered ? 'scale-125' : 'scale-100'}`}>
                            {userCoffees}
                        </div>
                    </div>
                    <div className="bg-white border-4 border-black p-4 text-left">
                        <div className="text-sm font-bold text-gray-500 uppercase">Total Spent</div>
                        <div className={`text-5xl font-black text-[#10b981] transition-transform ${justOrdered ? 'scale-125' : 'scale-100'}`}>
                            ${userSpent.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
