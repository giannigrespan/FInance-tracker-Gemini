import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';
import { 
  LayoutDashboard, Receipt, TrendingUp, TrendingDown, 
  Wallet, Plus, Trash2, Sparkles, Calendar, Loader2,
  Users, User, Gift, ArrowRightLeft
} from './components/Icons';
import TransactionModal from './components/TransactionModal';
import { Transaction, TransactionType, Category, FinancialSummary, SplitType, Payer } from './types';
import { getFinancialAdvice } from './services/geminiService';

// Mock Data for initial state with new fields
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-25', merchant: 'Whole Foods', amount: 124.50, type: TransactionType.EXPENSE, category: Category.FOOD, payer: 'ME', splitType: SplitType.SHARED },
  { id: '2', date: '2023-10-26', merchant: 'Personal Game', amount: 59.99, type: TransactionType.EXPENSE, category: Category.ENTERTAINMENT, payer: 'ME', splitType: SplitType.PERSONAL },
  { id: '3', date: '2023-10-27', merchant: 'Uber', amount: 24.00, type: TransactionType.EXPENSE, category: Category.TRANSPORT, payer: 'PARTNER', splitType: SplitType.SHARED },
  { id: '4', date: '2023-10-28', merchant: 'Gift for Laura', amount: 45.00, type: TransactionType.EXPENSE, category: Category.SHOPPING, payer: 'ME', splitType: SplitType.FOR_PARTNER },
  { id: '5', date: '2023-10-29', merchant: 'Utilities', amount: 150.00, type: TransactionType.EXPENSE, category: Category.UTILITIES, payer: 'PARTNER', splitType: SplitType.SHARED },
];

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('familyfinance_transactions_v2');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'insights'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('familyfinance_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  // Derived State: Financial Summary (Calculates Settlement)
  const summary: FinancialSummary = useMemo(() => {
    let paidByMe = 0;
    let paidByPartner = 0;
    let totalShared = 0;
    
    // Settlement Balance: Positive = Partner owes Me, Negative = I owe Partner
    let balance = 0; 

    transactions.forEach(t => {
        // Track totals
        if (t.payer === 'ME') paidByMe += t.amount;
        else paidByPartner += t.amount;

        if (t.splitType === SplitType.SHARED) totalShared += t.amount;

        // Logic for Settlement
        if (t.payer === 'ME') {
            if (t.splitType === SplitType.SHARED) {
                balance += t.amount / 2; // Partner owes me half
            } else if (t.splitType === SplitType.FOR_PARTNER) {
                balance += t.amount; // Partner owes me full
            }
            // If PERSONAL, balance change is 0 (my money for me)
        } else { // PARTNER paid
            if (t.splitType === SplitType.SHARED) {
                balance -= t.amount / 2; // I owe partner half
            } else if (t.splitType === SplitType.FOR_PARTNER) {
                // This means Partner paid FOR_PARTNER (which implies 'For the other person', i.e., Me)
                balance -= t.amount; // I owe partner full
            }
            // If PERSONAL, balance change is 0
        }
    });

    return {
      totalPaidByMe: paidByMe,
      totalPaidByPartner: paidByPartner,
      totalShared: totalShared,
      settlementBalance: balance
    };
  }, [transactions]);

  // Derived State: Category Data for Charts
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.forEach(t => {
        // Count total expense regardless of who paid for Category view
        data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Derived State: Daily Spending for Bar Chart
  const dailyData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.slice(0, 14).forEach(t => {
       data[t.date] = (data[t.date] || 0) + t.amount;
    });
    // Sort dates
    return Object.entries(data)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, amount]) => ({ date, amount }));
  }, [transactions]);

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const generateAdvice = async () => {
    if (loadingAdvice) return;
    setLoadingAdvice(true);
    const adviceText = await getFinancialAdvice(transactions);
    setAdvice(adviceText);
    setLoadingAdvice(false);
  };

  // Colors for charts
  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      
      {/* Sidebar Navigation */}
      <nav className="bg-white border-r border-slate-200 w-full md:w-64 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Wallet size={18} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            FamilyFinance
          </span>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'transactions' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Receipt size={20} />
            Transactions
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'insights' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Sparkles size={20} />
            AI Advisor
          </button>
        </div>

        <div className="p-4 border-t border-slate-100 hidden md:block">
            <div className={`rounded-xl p-4 text-white shadow-lg transition-colors ${summary.settlementBalance >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'}`}>
                <p className="text-xs font-medium text-white/80 mb-1">
                    {summary.settlementBalance >= 0 ? "Partner owes you" : "You owe partner"}
                </p>
                <p className="text-2xl font-bold">${Math.abs(summary.settlementBalance).toFixed(2)}</p>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    {activeTab === 'dashboard' && 'Financial Overview'}
                    {activeTab === 'transactions' && 'Transaction History'}
                    {activeTab === 'insights' && 'Smart Insights'}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Track expenses, split bills, and settle up.
                </p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="hidden md:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                <Plus size={18} />
                Add Expense
            </button>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <span className="text-slate-500 font-medium">You Paid</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">${summary.totalPaidByMe.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-2">Total from all categories</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <span className="text-slate-500 font-medium">Partner Paid</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">${summary.totalPaidByPartner.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-2">Total from all categories</p>
                </div>
                <div className={`p-6 rounded-2xl shadow-sm border ${summary.settlementBalance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${summary.settlementBalance >= 0 ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                            <ArrowRightLeft size={20} />
                        </div>
                        <span className={`font-medium ${summary.settlementBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                           Settlement
                        </span>
                    </div>
                    <p className={`text-3xl font-bold ${summary.settlementBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                        ${Math.abs(summary.settlementBalance).toFixed(2)}
                    </p>
                    <p className={`text-xs mt-2 ${summary.settlementBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {summary.settlementBalance >= 0 ? 'Partner owes you' : 'You owe partner'}
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-semibold mb-6">Total Spending by Category</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value}`} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-semibold mb-6">Spending Trend (Last 14 Days)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <XAxis dataKey="date" tick={{fontSize: 10}} interval={1} />
                                <YAxis tick={{fontSize: 12}} />
                                <Tooltip formatter={(value: number) => `$${value}`} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Transactions View */}
        {activeTab === 'transactions' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="p-4">Date</th>
                                <th className="p-4">Merchant</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-center">Split</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {t.date}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800">{t.merchant}</div>
                                        <div className="text-xs text-slate-500">Paid by {t.payer === 'ME' ? 'Me' : 'Partner'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600`}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center justify-center gap-1" title={t.splitType}>
                                            {t.splitType === SplitType.SHARED && <span className="text-xl">👥</span>}
                                            {t.splitType === SplitType.PERSONAL && <span className="text-xl">👤</span>}
                                            {t.splitType === SplitType.FOR_PARTNER && <span className="text-xl">🎁</span>}
                                            
                                        </div>
                                    </td>
                                    <td className={`p-4 text-right font-semibold text-slate-800`}>
                                        ${t.amount.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleDeleteTransaction(t.id)}
                                            className="text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No transactions found. Add one to get started!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
        )}

        {/* Insights View */}
        {activeTab === 'insights' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Gemini Financial Advisor</h2>
                        <p className="text-indigo-100 mb-8 max-w-lg">
                            Get personalized advice based on your recent spending habits and debt settlement. Our AI analyzes your transaction history to help you save more.
                        </p>
                        <button 
                            onClick={generateAdvice}
                            disabled={loadingAdvice}
                            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {loadingAdvice ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                            {loadingAdvice ? 'Analyzing Finances...' : 'Generate New Advice'}
                        </button>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl"></div>
                </div>

                {advice && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 prose prose-slate max-w-none">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="text-amber-400 fill-current" size={24}/>
                            Your Personal Insights
                        </h3>
                        <div className="markdown-body text-slate-600 leading-relaxed">
                             {/* Simple markdown rendering for bullet points */}
                             {advice.split('\n').map((line, i) => (
                                 <p key={i} className="mb-2">{line}</p>
                             ))}
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl z-20"
      >
        <Plus size={24} />
      </button>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddTransaction} 
      />
    </div>
  );
};

export default App;