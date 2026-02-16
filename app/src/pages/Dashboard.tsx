import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Plus, ArrowRight, Users } from 'lucide-react';
import { useSessions } from '../hooks/useSessions';
import { Button } from '../components/Button';

const UserBalanceList: React.FC = () => {
    const [users, setUsers] = useState<{ email: string, credit: number, debt: number }[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem('host_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = token;

        try {
            const res = await fetch('/api/users', { headers });
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const updateCredit = async (email: string, currentCredit: number) => {
        const newCredit = prompt(`Set new credit balance for ${email}:`, currentCredit.toString());
        if (newCredit === null) return;

        const floatCredit = parseFloat(newCredit);
        if (isNaN(floatCredit)) {
            alert("Invalid number");
            return;
        }

        const token = localStorage.getItem('host_token');
        if (!token) return;

        await fetch('/api/users/credit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ email, credit: floatCredit })
        });

        fetchUsers();
    };

    const handleRemind = async (email: string) => {
        const token = localStorage.getItem('host_token');
        if (!token) return;

        if (!confirm(`Send payment reminders to ${email} for all unpaid orders?`)) return;

        try {
            const res = await fetch(`/api/users/${email}/remind`, {
                method: 'POST',
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Sent ${data.count} reminder emails.`);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to send reminders.');
        }
    };

    const token = localStorage.getItem('host_token');

    return (
        <div className="mt-16 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                <Users className="w-8 h-8" /> User Accounts
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-4 border-black">
                            <th className="p-3 font-black uppercase">Email</th>
                            <th className="p-3 font-black uppercase">Outstanding Debt</th>
                            <th className="p-3 font-black uppercase">Credit Balance</th>
                            <th className="p-3 font-black uppercase">Net Total</th>
                            {token && <th className="p-3 font-black uppercase">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.email} className="border-b-2 border-gray-200">
                                <td className="p-3 font-bold">{u.email}</td>
                                <td className="p-3 text-red-600 font-bold">${u.debt.toFixed(2)}</td>
                                <td className="p-3 text-green-600 font-bold">${u.credit.toFixed(2)}</td>
                                <td className={`p-3 font-black ${u.credit - u.debt >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${(u.credit - u.debt).toFixed(2)}
                                </td>
                                <td className="p-3">
                                    {token && (
                                        <div className="flex gap-2">
                                            <Button onClick={() => updateCredit(u.email, u.credit)} className="bg-blue-500 text-white text-xs py-1 px-2">
                                                Edit Credit
                                            </Button>
                                            <Button onClick={() => handleRemind(u.email)} className="bg-yellow-500 text-white text-xs py-1 px-2">
                                                Remind
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    if (!confirm(`Delete account/credit for ${u.email}? This will verify clear their balance.`)) return;
                                                    const token = localStorage.getItem('host_token');
                                                    if (!token) return;
                                                    await fetch(`/api/users/${u.email}`, {
                                                        method: 'DELETE',
                                                        headers: { 'Authorization': token }
                                                    });
                                                    fetchUsers();
                                                }}
                                                className="bg-red-500 text-white text-xs py-1 px-2"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={token ? 5 : 4} className="p-4 text-center italic text-gray-500">{loading ? 'Loading...' : 'No user data found.'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const { sessions, createSession } = useSessions();
    const [newSessionName, setNewSessionName] = useState('');
    const [template, setTemplate] = useState('');

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/email_template');
                if (res.ok) {
                    const data = await res.json();
                    if (data.value) setTemplate(data.value);
                }
            } catch (e) { console.error(e); }
        };
        fetchSettings();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionName.trim()) return;
        await createSession(newSessionName);
        setNewSessionName('');
    };

    const inputClasses = "mt-1 block w-full bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-black p-3 font-medium transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Create Session */}
                <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 h-fit">
                    <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                        <Plus className="w-8 h-8" /> New Run
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold uppercase mb-2">Session Name</label>
                            <input
                                type="text"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                placeholder="e.g. Friday Coffee Run"
                                className={inputClasses}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-[#8b5cf6] text-white">
                            Start Session
                        </Button>
                    </form>
                </div>

                {/* Active Sessions */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-fit">
                        <Coffee className="w-8 h-8" /> Active Runs
                    </h2>

                    {sessions.length === 0 ? (
                        <div className="bg-white border-2 border-black p-6 italic text-gray-500">
                            No active runs. Start one!
                        </div>
                    ) : (
                        sessions.map(session => (
                            <Link key={session.id} to={`/session/${session.id}`} className="block group">
                                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold uppercase">{session.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {new Date(session.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                                            {/* Delete Button (Stop propagation to prevent navigation) */}
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const token = localStorage.getItem('host_token');
                                                    const hostId = localStorage.getItem(`session_host_${session.id}`);
                                                    if (!token && !hostId) return;
                                                    if (!confirm(`Delete session "${session.name}"? This cannot be undone.`)) return;

                                                    const headers: Record<string, string> = {};
                                                    if (token) headers['Authorization'] = token;
                                                    if (hostId) headers['X-Host-ID'] = hostId;

                                                    await fetch(`/api/sessions/${session.id}`, {
                                                        method: 'DELETE',
                                                        headers
                                                    });
                                                    // Refresh list
                                                    window.location.reload(); // Simple refresh or use useSessions hook update
                                                }}
                                                className="text-red-500 hover:text-red-700 font-bold text-xs bg-white border border-red-200 px-2 py-1 rounded z-10 hidden group-hover:block"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm font-bold">
                                        <span className="px-2 py-1 bg-yellow-200 border-2 border-black">
                                            {session.totalItems} Items
                                        </span>
                                        <span className="px-2 py-1 bg-green-200 border-2 border-black">
                                            {session.paidItems} Paid
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* User Accounts */}
            <UserBalanceList />

            {/* Settings */}
            <div className="mt-16 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-2xl">
                <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                    Settings
                </h2>
                <div className="space-y-4">
                    <label className="block text-sm font-bold uppercase">Default Email Template</label>
                    <textarea
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className={inputClasses}
                        rows={4}
                        placeholder="Please pay {ORDER_AMOUNT}..."
                    ></textarea>
                    <Button
                        onClick={async () => {
                            const token = localStorage.getItem('host_token');
                            if (!token) {
                                alert("Please login as host (in User Accounts section or separate login page) to save global settings.");
                                return;
                            }
                            await fetch('/api/settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                                body: JSON.stringify({ key: 'email_template', value: template })
                            });
                            alert('Saved!');
                        }}
                        className="bg-blue-500 text-white"
                    >
                        Save Default
                    </Button>
                </div>
            </div>
        </div>
    );
};
