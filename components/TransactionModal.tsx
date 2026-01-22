import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, Users, User, Gift } from './Icons';
import { Transaction, TransactionType, Category, Payer, SplitType } from '../types';
import { parseReceiptImage } from '../services/geminiService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: Omit<Transaction, 'id'>) => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<Category>(Category.FOOD);
  
  // New State for Split Logic
  const [payer, setPayer] = useState<Payer>('ME');
  const [splitType, setSplitType] = useState<SplitType>(SplitType.SHARED);

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      amount: parseFloat(amount),
      merchant,
      date,
      type,
      category,
      payer,
      splitType
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAmount('');
    setMerchant('');
    setDate(new Date().toISOString().split('T')[0]);
    setType(TransactionType.EXPENSE);
    setCategory(Category.FOOD);
    setPayer('ME');
    setSplitType(SplitType.SHARED);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        const result = await parseReceiptImage(base64Data);
        
        if (result.amount) setAmount(result.amount.toString());
        if (result.merchant) setMerchant(result.merchant);
        if (result.date) setDate(result.date);
        if (result.category) setCategory(result.category);
        
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Scanning failed", error);
      setIsScanning(false);
      alert("Failed to read receipt. Please try manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Add Expense
          </h2>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
            {/* AI Action */}
            <div className="mb-6">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-medium disabled:opacity-70"
                >
                    {isScanning ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
                    {isScanning ? "Analyzing Receipt..." : "Scan Receipt with AI"}
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Payer Toggle */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Who paid?</label>
                  <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl">
                      <button
                          type="button"
                          onClick={() => setPayer('ME')}
                          className={`py-2 rounded-lg text-sm font-medium transition-all ${payer === 'ME' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          Me
                      </button>
                      <button
                          type="button"
                          onClick={() => setPayer('PARTNER')}
                          className={`py-2 rounded-lg text-sm font-medium transition-all ${payer === 'PARTNER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          Partner
                      </button>
                  </div>
              </div>

              {/* Amount & Merchant */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input 
                            type="number" 
                            step="0.01" 
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-7 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                        type="date" 
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant / Description</label>
                <input 
                    type="text" 
                    required
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Grocery Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    {Object.values(Category).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
              </div>

              {/* Split Type Selection */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Split Type</label>
                  <div className="grid grid-cols-3 gap-2">
                      <button
                          type="button"
                          onClick={() => setSplitType(SplitType.SHARED)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${splitType === SplitType.SHARED ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                      >
                          <Users size={20} className="mb-1" />
                          <span className="text-xs font-medium">Shared</span>
                          <span className="text-[10px] opacity-70">50/50</span>
                      </button>

                      <button
                          type="button"
                          onClick={() => setSplitType(SplitType.PERSONAL)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${splitType === SplitType.PERSONAL ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                      >
                          <User size={20} className="mb-1" />
                          <span className="text-xs font-medium">Personal</span>
                          <span className="text-[10px] opacity-70">No split</span>
                      </button>

                      <button
                          type="button"
                          onClick={() => setSplitType(SplitType.FOR_PARTNER)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${splitType === SplitType.FOR_PARTNER ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                      >
                          <Gift size={20} className="mb-1" />
                          <span className="text-xs font-medium">{payer === 'ME' ? 'For Partner' : 'For Me'}</span>
                          <span className="text-[10px] opacity-70">100% owed</span>
                      </button>
                  </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm mt-4"
              >
                Save Expense
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;