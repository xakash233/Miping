"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  DollarSign, TrendingUp, Calendar, Loader2, AlertCircle,
  ExternalLink, Share2, Award, ArrowUpRight, MessageSquare,
  Users, Shield, Zap, History, LayoutGrid, Clock
} from 'lucide-react';

const Card = ({ children, className }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className || 'p-6'}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, subtext, percentage }) => (
  <Card className="p-5">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
    </div>
    <div className="flex items-end justify-between">
      <h3 className="text-2xl font-black text-gray-800 tracking-tight">{value}</h3>
      {percentage !== undefined && (
        <div className="flex items-center gap-1 text-[11px] font-black text-blue-500">
          {percentage}% <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        </div>
      )}
    </div>
    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{subtext}</p>
    <div className="h-1 w-full bg-gray-50 rounded-full mt-4 overflow-hidden">
      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percentage || 100}%` }}></div>
    </div>
  </Card>
);

const LogItem = ({ title, status, time, icon: Icon }) => (
  <div className="flex gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-all">
    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-400">
      <Icon size={18} />
    </div>
    <div className="flex flex-col">
      <h4 className="text-[13px] font-bold text-gray-800 leading-tight line-clamp-1">{title}</h4>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-[10px] font-bold uppercase ${status === 'SENT' || status === 'SUCCESS' ? 'text-green-500' : 'text-orange-500'}`}>
          {status}
        </span>
        <span className="w-1 h-1 rounded-full bg-gray-200"></span>
        <span className="text-[10px] text-gray-400 font-medium">{time}</span>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState({ name: '', email: '', role: '' });
  const [activeTab, setActiveTab] = useState('Today');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const role = Cookies.get('user_role');
    setUser({
      name: Cookies.get('user_name') || 'Administrator',
      email: Cookies.get('email') || 'system@miping.com',
      role: role
    });

    fetchData(role, token);
  }, []);

  const fetchData = async (role, token) => {
    try {
      const endpoint = role === 'SUPER_ADMIN'
        ? 'http://localhost:3000/admin/dashboard'
        : 'http://localhost:3000/tenants/dashboard';

      const [statsRes, activityRes] = await Promise.all([
        axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/messages/history', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (activityRes.data.success) setRecentActivity(activityRes.data.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
      const msg = err.response?.data?.message || err.message || 'Connection issue. Please retry.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (error) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="text-red-500 mb-2" size={48} />
      <h3 className="text-xl font-bold text-gray-800">Oops! Something went wrong</h3>
      <p className="text-gray-400 text-sm max-w-xs">{error}</p>
      <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all">Retry Connection</button>
    </div>
  );

  const isSuper = user.role === 'SUPER_ADMIN';

  return (
    <div className="flex flex-col xl:flex-row gap-8 min-h-screen">
      <div className="flex-1 space-y-6">

        {/* Header Welcome Card */}
        <Card className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Status: Online</p>
                <h1 className="text-4xl font-black text-gray-800 tracking-tight">Main Dashboard</h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-gray-50 overflow-hidden shadow-sm flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-2xl uppercase">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Hello, {user.name}!</h2>
                  <p className="text-sm text-gray-400 font-medium">{user.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium italic">
                {isSuper ? "Monitorting platform-wide communication metrics and tenant activity." : "Managing your organization's messaging campaigns and balance."}
              </p>
            </div>

            {/* Stats Summary */}
            <div className="lg:col-span-3 space-y-6 py-2 border-l border-gray-50 pl-8 hidden lg:block">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Total Volume</div>
                <h4 className="text-xl font-black text-gray-800">{stats.totalMessages?.toLocaleString() || 0}</h4>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Success Rate</div>
                <h4 className="text-xl font-black text-blue-500">
                  {stats.totalMessages > 0 ? ((stats.deliveredMessages || stats.metaStats?.delivered || 0) / stats.totalMessages * 100).toFixed(1) : 100}%
                </h4>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">{isSuper ? 'Active Tenants' : 'Available Balance'}</div>
                <h4 className="text-xl font-black text-gray-800">
                  {isSuper ? stats.totalActiveTenants : `₹${stats.balance?.toLocaleString() || 0}`}
                </h4>
              </div>
              <button onClick={() => router.push(isSuper ? '/manage-admins' : '/wallet')} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black transition-all mt-4 uppercase tracking-[0.15em]">
                {isSuper ? 'Manage Tenants' : 'Recharge Wallet'}
              </button>
            </div>

            {/* Traffic Bar Chart (Real Data) */}
            <div className="lg:col-span-5 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trafficTrend?.length > 0 ? stats.trafficTrend : [{ hour: '00:00', count: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hourly Traffic</span></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Real Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={isSuper ? "Revenue" : "Sent"}
            value={isSuper ? `₹${stats.totalRevenue?.toLocaleString() || 0}` : (stats.sentMessages || 0)}
            percentage={isSuper ? 100 : Math.min(100, Math.round((stats.sentMessages / stats.totalMessages) * 100)) || 0}
            subtext={isSuper ? "Platform Lifetime" : "Successfully Dispatched"}
          />
          <StatCard
            title={isSuper ? "Tenants" : "Delivered"}
            value={isSuper ? stats.totalTenants : (stats.deliveredMessages || 0)}
            percentage={isSuper ? Math.round((stats.totalActiveTenants / stats.totalTenants) * 100) || 0 : Math.round((stats.deliveredMessages / stats.totalMessages) * 100) || 0}
            subtext={isSuper ? "Registered Entities" : "Handed over to User"}
          />
          <StatCard
            title={isSuper ? "Total Jobs" : "Read Count"}
            value={isSuper ? (stats.totalMessages || 0) : (stats.readMessages || 0)}
            percentage={isSuper ? 100 : Math.round((stats.readMessages / stats.totalMessages) * 100) || 0}
            subtext={isSuper ? "All-time Operations" : "Engagement Rate"}
          />
          <StatCard
            title={isSuper ? "Pending" : "Failed"}
            value={isSuper ? stats.pendingJobs : stats.failedMessages}
            percentage={isSuper ? Math.round((stats.pendingJobs / (stats.totalMessages || 1)) * 100) || 0 : Math.round((stats.failedMessages / (stats.totalMessages || 1)) * 100) || 0}
            subtext={isSuper ? "Queued for Dispatch" : "Issues Encountered"}
          />
        </div>

        {/* Bottom Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest italic flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" /> Volume Analytics
              </h3>
              <div className="flex gap-2">
                <button className="p-2 text-gray-300 hover:text-blue-600"><ExternalLink size={16} /></button>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trafficTrend?.length > 0 ? stats.trafficTrend : [{ hour: '0', count: 0 }]}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest italic flex items-center gap-2">
                <Zap size={16} className="text-blue-600" /> Operational Status
              </h3>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Meta API Node', value: 'Operational', color: 'bg-green-500', width: '100%' },
                { label: 'Message Scheduler', value: isSuper ? 'High Intensity' : 'Active', color: 'bg-blue-500', width: '90%' },
                { label: 'Webhook Listeners', value: 'Healthy', color: 'bg-cyan-500', width: '95%' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    <span className="text-[10px] font-black text-gray-800 uppercase">{item.value}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Right Side Panel */}
      <div className="w-full xl:w-[320px] space-y-8">
        <div className="flex items-center gap-6 border-b border-gray-100 px-2">
          {['Today', 'Logs', 'Tasks'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>}
            </button>
          ))}
        </div>

        {/* System Health Section */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-50">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400">System Balance</h4>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Assets</p>
            <h2 className="text-3xl font-black tracking-tight">{isSuper ? `₹${stats.totalRevenue?.toLocaleString()}` : `₹${stats.balance?.toLocaleString()}`}</h2>
            <div className="mt-6 flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
              <Shield size={16} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400">Secured Node Connection</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="space-y-6">
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] px-2 italic">Recent Activity</h4>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((log, idx) => (
              <div key={log.id} className="flex items-start gap-4">
                <span className="text-xl font-black text-gray-100">{String(idx + 1).padStart(2, '0')}</span>
                <LogItem
                  title={log.template_name || 'Message Dispatch'}
                  status={log.status}
                  time={new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  icon={MessageSquare}
                />
              </div>
            )) : (
              <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <History size={24} className="mx-auto text-gray-200 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase">No Recent Logs</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-widest italic">Node Status</h4>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-800 leading-tight">Your infrastructure is operating at peak efficiency today.</p>
              <span className="text-[10px] font-black text-blue-600 mt-2 block uppercase tracking-widest">View System Logs</span>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2024 MIPING COMMUNICATIONS. AUTHENTICATED ACCESS.</p>
        </div>
      </div>
    </div>
  );
}
