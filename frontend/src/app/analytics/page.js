"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    BarChart2, TrendingUp, Users, Zap, MessageSquare,
    Filter, ArrowUpRight, ArrowDownRight, Loader2,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';

const StatCard = ({ title, value, change, trend, icon: Icon }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                <Icon size={22} />
            </div>
            {change && (
                <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-green-500' : 'text-blue-500'}`}>
                    {change} {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
            )}
        </div>
        <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3>
        </div>
    </div>
);

export default function AnalyticsPage() {
    const [timeframe, setTimeframe] = useState('24h');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            const token = Cookies.get('token');
            const role = Cookies.get('user_role');
            const endpoint = role === 'SUPER_ADMIN'
                ? 'http://localhost:3000/admin/dashboard'
                : 'http://localhost:3000/tenants/dashboard';

            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setStats(res.data.data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnalytics(); }, []);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!stats) return null;

    const pieData = [
        { name: 'Delivered', value: stats.deliveredMessages || stats.totalMessages || 0, color: '#3b82f6' },
        { name: 'Read', value: stats.readMessages || 0, color: '#10b981' },
        { name: 'Failed', value: stats.failedMessages || 0, color: '#ef4444' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Advanced Analytics</h1>
                    <p className="text-gray-500 mt-1">Deep insights into communication performance</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    {['24h', '7d', '30d', '90d'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeframe === t ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Volume"
                    value={stats.totalMessages || 0}
                    change="+12%" trend="up" icon={MessageSquare}
                />
                <StatCard
                    title="Delivery Rate"
                    value={stats.totalMessages > 0 ? `${((stats.deliveredMessages / stats.totalMessages) * 100).toFixed(1)}%` : '0%'}
                    change="+0.4%" trend="up" icon={Zap}
                />
                <StatCard
                    title="User Growth"
                    value={stats.totalContacts || stats.totalTenants || 0}
                    change="+5%" trend="up" icon={Users}
                />
                <StatCard
                    title="Active Now"
                    value={stats.totalActiveTenants || stats.pendingJobs || 0}
                    change="+2" trend="up" icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Flow */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Engagement Flow</h3>
                            <p className="text-xs text-gray-400">Activity trend over the last 24 hours</p>
                        </div>
                        <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600">
                            <Filter size={14} /> Filter Data
                        </button>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trafficTrend || []}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">Status Breakdown</h3>
                    <p className="text-xs text-gray-400 mb-8 text-center">Distribution of message outcomes</p>

                    <div className="flex-1 min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-gray-800">92%</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Health</span>
                        </div>
                    </div>

                    <div className="space-y-3 mt-8">
                        {pieData.map((item) => (
                            <div key={item.name} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-bold text-gray-600">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-gray-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
