"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Wallet, Plus, ArrowUpRight, ArrowDownRight,
    CreditCard, History, Zap, ShieldCheck, Loader2,
    X, AlertCircle, Save
} from 'lucide-react';

export default function WalletPage() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const token = Cookies.get('token');
            const [bRes, tRes] = await Promise.all([
                axios.get('${process.env.NEXT_PUBLIC_API_URL}/billing/balance', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('${process.env.NEXT_PUBLIC_API_URL}/billing/transactions', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setBalance(bRes.data.data.balance);
            setTransactions(tRes.data.data);
        } catch (err) {
            console.error('Failed to fetch wallet data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddCredits = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = Cookies.get('token');
            // In a real app, this would trigger Razorpay
            await axios.post('${process.env.NEXT_PUBLIC_API_URL}/billing/add-credits', { amount }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setAmount('');
            fetchData();
        } catch (err) {
            console.error('Failed to add credits', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Wallet</h1>
                    <p className="text-gray-500 mt-1">Manage credits and billing history</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                    <Plus size={20} />
                    Add Credits
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Balance Card */}
                        <div className="lg:col-span-1 bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="p-3 bg-white/10 rounded-2xl">
                                        <Wallet size={24} />
                                    </div>
                                    <CreditCard size={24} className="opacity-40" />
                                </div>
                                <div className="mt-auto">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Current Balance</p>
                                    <h2 className="text-5xl font-black mb-6 tracking-tight">₹{balance.toLocaleString()}</h2>
                                    <div className="flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-xl border border-white/10">
                                        <ShieldCheck size={16} className="text-blue-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Verified Account</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20 transform translate-x-10 -translate-y-10"></div>
                        </div>

                        {/* Stats */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                        <ArrowUpRight size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Total Transactions</h4>
                                        <p className="text-xs text-gray-400">All time count</p>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-gray-800">{transactions.length}</h3>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Efficiency</h4>
                                        <p className="text-xs text-gray-400">Campaign performance</p>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-gray-800">₹0.18</h3>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                            <History className="text-gray-400" size={20} />
                            <h2 className="font-bold text-gray-800">Transaction History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                                        <th className="px-8 py-4">Transaction Details</th>
                                        <th className="px-8 py-4">Type</th>
                                        <th className="px-8 py-4 text-right">Amount</th>
                                        <th className="px-8 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-gray-800 capitalize">{tx.type.toLowerCase()} Operation</p>
                                                <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${tx.type === 'REFUND' ? 'text-green-600 bg-green-50' :
                                                        tx.type === 'CREDIT' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`text-sm font-black ${tx.type === 'REFUND' || tx.type === 'CREDIT' ? 'text-green-600' : 'text-gray-800'}`}>
                                                    {tx.type === 'REFUND' || tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
                                                    SUCCESS
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Plus className="text-blue-600" /> Add Credits
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddCredits} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Amount (INR)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-xl font-black"
                                    placeholder="5000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CreditCard size={20} /> Pay Now</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
