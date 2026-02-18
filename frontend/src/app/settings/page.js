"use client";

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import {
    Settings, User, Lock, Bell, Shield,
    Globe, CreditCard, Save, CheckCircle2,
    Loader2
} from 'lucide-react';

export default function SettingsPage() {
    const [user, setUser] = useState({ name: '', email: '', role: '' });
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setUser({
            name: Cookies.get('user_name') || 'Administrator',
            email: Cookies.get('email') || 'system@miping.com',
            role: Cookies.get('user_role') || 'ADMIN'
        });
        setMounted(true);
    }, []);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (!mounted) return null;

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard, roles: ['ADMIN'] },
        { id: 'system', label: 'System Settings', icon: Shield, roles: ['SUPER_ADMIN'] },
    ];

    const filteredTabs = tabs.filter(tab => !tab.roles || tab.roles.includes(user.role));

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">System Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your professional account and node preferences</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="md:w-64 shrink-0">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 space-y-1">
                        {filteredTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm font-bold">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight italic">{activeTab} preferences</h2>
                        </div>

                        <div className="p-8 space-y-8">
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl uppercase border-4 border-white shadow-sm ring-1 ring-gray-100">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <button className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                                                Update Avatar
                                            </button>
                                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">System Identity (MAX 800K)</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Display Name</label>
                                            <input
                                                defaultValue={user.name}
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Email</label>
                                            <input
                                                defaultValue={user.email}
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Current Master Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">New System Passcode</label>
                                            <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic">Authenticated Session: Node #{Math.floor(Math.random() * 9000) + 1000}</p>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-100 hover:bg-blue-700 uppercase text-xs tracking-widest"
                                >
                                    {saved ? <CheckCircle2 size={18} className="text-white" /> : <Save size={18} />}
                                    {saved ? "Synchronized!" : "Deploy Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
