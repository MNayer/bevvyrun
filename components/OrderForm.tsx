import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { beverages, getPriceForBeverage, BeverageItem } from '../data/beverages';

interface OrderFormProps {
  onSubmit: (data: { userName: string; userEmail: string; itemName: string; price: number }) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onSubmit }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  
  // Custom Autocomplete State
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredBeverages, setFilteredBeverages] = useState<BeverageItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItemName(value);
    
    // Filter beverages
    if (value.trim() === '') {
      setFilteredBeverages([]);
      setShowDropdown(false);
    } else {
      const filtered = beverages.filter(b => 
        b.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBeverages(filtered);
      setShowDropdown(true);
    }

    // Auto-fill price if exact match found (user might type exact name without clicking)
    const foundPrice = getPriceForBeverage(value);
    if (foundPrice !== undefined) {
      setPrice(foundPrice.toFixed(2));
    }
  };

  const selectBeverage = (b: BeverageItem) => {
    setItemName(b.name);
    setPrice(b.price.toFixed(2));
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !itemName || !price) return;

    onSubmit({
      userName,
      userEmail,
      itemName,
      price: parseFloat(price)
    });

    setItemName('');
    setPrice('');
    setShowDropdown(false);
  };

  const inputClasses = "mt-1 block w-full bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-black sm:text-sm p-3 font-medium placeholder-gray-400 transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

  return (
    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-6 relative z-20">
      <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2 uppercase tracking-tight">
        <Plus className="w-6 h-6 text-black border-2 border-black p-0.5 bg-[#a3e635]" />
        Add Your Order
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-black uppercase mb-1">Your Name</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={inputClasses}
              placeholder="e.g. Alice"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black uppercase mb-1">Email (Optional)</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className={inputClasses}
              placeholder="alice@example.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-bold text-black uppercase mb-1">Beverage</label>
            <div className="relative">
                <input
                    type="text"
                    required
                    value={itemName}
                    onChange={handleItemChange}
                    onFocus={() => {
                        if (itemName && filteredBeverages.length > 0) setShowDropdown(true);
                        else if (!itemName) {
                            setFilteredBeverages(beverages);
                            setShowDropdown(true);
                        }
                    }}
                    className={inputClasses}
                    placeholder="Start typing..."
                    autoComplete="off"
                />
                <ChevronDown className="absolute right-3 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Custom Dropdown Menu */}
            {showDropdown && filteredBeverages.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mt-2 max-h-60 overflow-y-auto overflow-x-hidden">
                    {filteredBeverages.map((b) => (
                        <li 
                            key={b.name}
                            onClick={() => selectBeverage(b)}
                            className="p-3 border-b-2 border-black last:border-b-0 hover:bg-[#a3e635] cursor-pointer flex justify-between items-start transition-colors group"
                        >
                            <span className="font-bold text-black group-hover:underline mr-2 text-sm uppercase leading-tight">{b.name}</span>
                            <span className="font-mono text-sm bg-black text-white px-2 py-0.5 whitespace-nowrap">€{b.price.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-black uppercase mb-1">Price (€)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClasses}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" className="w-full md:w-auto bg-[#a3e635] text-black hover:bg-[#bef264]">
            ADD TO LIST
          </Button>
        </div>
      </form>
    </div>
  );
};