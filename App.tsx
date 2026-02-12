import React, { useState, useEffect } from 'react';
import { Coffee, Settings, FileText, CheckCheck } from 'lucide-react';
import { OrderForm } from './components/OrderForm';
import { OrderList } from './components/OrderList';
import { Stats } from './components/Stats';
import { SessionBar } from './components/SessionBar';
import { OrderStatus, PaymentSettings } from './types';
import { Button } from './components/Button';
import { summarizeOrders } from './services/geminiService';
import { useWebRTC } from './hooks/useWebRTC';

const App: React.FC = () => {
  // Replace local state orders with WebRTC hook
  const { 
    orders, 
    isHost, 
    isConnected, 
    peerId, 
    connectionCount, 
    addOrder, 
    deleteOrder, 
    updateStatus, 
    markAllPendingAsOrdered 
  } = useWebRTC();

  const [settings, setSettings] = useState<PaymentSettings>(() => {
    try {
      const saved = localStorage.getItem('bevvy_settings');
      return saved ? JSON.parse(saved) : {
        recipientName: 'The Organizer',
        recipientEmail: 'my@email.com',
        paymentMethodDetails: 'PayPal: my@email.com'
      };
    } catch (e) {
      console.error("Failed to load settings from local storage:", e);
      return {
        recipientName: 'The Organizer',
        recipientEmail: 'my@email.com',
        paymentMethodDetails: 'PayPal: my@email.com'
      };
    }
  });

  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    localStorage.setItem('bevvy_settings', JSON.stringify(settings));
  }, [settings]);

  const handleMarkAllOrdered = () => {
    if (confirm("Are you sure you want to lock all pending orders?")) {
        markAllPendingAsOrdered();
    }
  };

  const handleSummarize = async () => {
    const pendingOrOrdered = orders.filter(o => o.status !== OrderStatus.PAID);
    if (pendingOrOrdered.length === 0) return;
    
    setIsSummarizing(true);
    const result = await summarizeOrders(pendingOrOrdered);
    setSummary(result);
    setIsSummarizing(false);
  };

  const inputClasses = "mt-1 block w-full bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-black p-3 font-medium transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

  return (
    <div className="min-h-screen font-sans text-black pb-20">
      {/* Header */}
      <header className="bg-[#fcd34d] border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Coffee className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic hidden sm:block">BevvyRun</h1>
            <h1 className="text-xl font-black tracking-tighter uppercase italic sm:hidden">Bevvy</h1>
          </div>
          <nav className="flex gap-4">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-3 sm:px-4 py-2 text-sm font-bold border-2 border-black uppercase transition-all ${activeTab === 'orders' ? 'bg-[#8b5cf6] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              Orders
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 sm:px-4 py-2 text-sm font-bold border-2 border-black uppercase transition-all ${activeTab === 'settings' ? 'bg-[#8b5cf6] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              Config
            </button>
          </nav>
        </div>
      </header>

      {/* Session Info Bar */}
      <SessionBar isHost={isHost} peerId={peerId} connectionCount={connectionCount} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {activeTab === 'settings' ? (
           <div className="max-w-2xl mx-auto bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
             <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase border-b-4 border-black pb-4">
               <Settings className="w-8 h-8" /> Config
             </h2>
             <div className="space-y-6">
               <div className="p-4 bg-yellow-100 border-2 border-black text-sm mb-4">
                  <strong>Note:</strong> Settings are local to your browser and used for generating emails. They are not synced with other users.
               </div>
               <div>
                 <label className="block text-sm font-bold uppercase mb-2">Organizer Name</label>
                 <input 
                   type="text" 
                   value={settings.recipientName}
                   onChange={e => setSettings({...settings, recipientName: e.target.value})}
                   className={inputClasses}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold uppercase mb-2">Organizer Email</label>
                 <input 
                   type="email" 
                   value={settings.recipientEmail}
                   onChange={e => setSettings({...settings, recipientEmail: e.target.value})}
                   className={inputClasses}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold uppercase mb-2">Payment Instructions</label>
                 <textarea 
                   value={settings.paymentMethodDetails}
                   onChange={e => setSettings({...settings, paymentMethodDetails: e.target.value})}
                   rows={3}
                   className={inputClasses}
                   placeholder="e.g. Venmo: @MyTag or Cash on delivery"
                 />
               </div>
               <div className="pt-6">
                  <Button onClick={() => setActiveTab('orders')} className="w-full bg-[#8b5cf6] text-white">Save & Return</Button>
               </div>
             </div>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form & Stats */}
            <div className="lg:col-span-1 space-y-8">
              <OrderForm onSubmit={addOrder} />
              <Stats orders={orders} />
              
              {/* Summary Generator Card (Only Host typically generates this, but anyone can if they want) */}
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
                    <FileText className="w-6 h-6"/> AI Summary
                 </h3>
                 <p className="text-sm text-gray-600 mb-4 font-medium">Generate a shopping list for Flaschenpost.</p>
                 <Button 
                    variant="secondary" 
                    className="w-full mb-4" 
                    onClick={handleSummarize} 
                    isLoading={isSummarizing}
                    disabled={orders.filter(o => o.status !== OrderStatus.PAID).length === 0}
                 >
                    {summary ? 'Regenerate' : 'Generate List'}
                 </Button>
                 
                 {summary && (
                    <div className="bg-[#f3f4f6] p-4 text-sm whitespace-pre-wrap border-2 border-black font-mono">
                        {summary}
                    </div>
                 )}
              </div>
            </div>

            {/* Right Column: List */}
            <div className="lg:col-span-2">
              <div className="bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 min-h-[600px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b-4 border-black pb-4">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Orders</h2>
                    <p className="text-sm font-bold text-gray-500">
                        {isHost ? 'You are the Host' : 'Connected as Guest'}
                    </p>
                  </div>
                  
                  {orders.some(o => o.status === OrderStatus.PENDING) && (
                      <Button 
                        variant="primary" 
                        onClick={handleMarkAllOrdered} 
                        className="bg-[#ec4899] hover:bg-[#db2777]"
                        disabled={!isHost && !isConnected} // Only host typically locks, but we allowed syncing commands. Let's allow guests to lock if they want, but usually host.
                      >
                         <CheckCheck className="w-5 h-5 mr-2" />
                         LOCK ORDERS
                      </Button>
                  )}
                </div>

                <OrderList 
                  orders={orders} 
                  onDelete={deleteOrder} 
                  onStatusChange={updateStatus}
                  paymentSettings={settings}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;