'use client';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import {
    MessageSquare, Users as UsersIcon, Send,
    TrendingUp, Activity, CreditCard, ChevronRight,
    CheckCircle, Loader2, Sparkles, Smartphone, Key, Hash, Facebook
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, trend, color, loading }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${color} text-white`}>
                <Icon size={24} />
            </div>
            {trend !== undefined && !loading && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
            {loading ? (
                <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
                <h3 className="text-3xl font-bold">{value}</h3>
            )}
        </div>
    </motion.div>
);

export default function Dashboard() {
    const [data, setData] = useState({
        stats: {
            messagesSent: 0,
            pendingTemplates: 0,
            activeContacts: 0,
            creditBalance: 0
        },
        activity: []
    });
    const [loading, setLoading] = useState(true);
    const [metaConnected, setMetaConnected] = useState(true);
    const [showMetaModal, setShowMetaModal] = useState(false);
    const [metaLoading, setMetaLoading] = useState(false);
    const [metaError, setMetaError] = useState('');
    const [metaForm, setMetaForm] = useState({
        permanentToken: '',
        phoneNumberId: '',
        wabaId: ''
    });

    useEffect(() => {
        // Load Facebook SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '544075195325595',
                cookie: true,
                xfbml: true,
                version: 'v19.0'
            });
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

        const fetchDashboard = async () => {
            try {
                const res = await axios.get('/dashboard/stats');
                setData(res.data.data);

                try {
                    await axios.get('/whatsapp/status');
                    setMetaConnected(true);
                } catch (waErr) {
                    if (waErr.response?.status === 404) {
                        setMetaConnected(false);
                        setShowMetaModal(true);
                    }
                }
            } catch (error) {
                console.error("Dashboard Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const handleMetaConnect = (e) => {
        e.preventDefault();
        if (!metaForm.wabaId || !metaForm.phoneNumberId) {
            setMetaError('Please enter WABA ID and Phone Number ID first.');
            return;
        }

        setMetaLoading(true);
        setMetaError('');

        if (typeof window.FB === 'undefined') {
            setMetaError('Facebook SDK is not loaded. Please disable adblockers or try again.');
            setMetaLoading(false);
            return;
        }

        window.FB.login(function (response) {
            if (response.authResponse) {
                const shortLivedToken = response.authResponse.accessToken;

                axios.post('/whatsapp/connect', {
                    wabaId: metaForm.wabaId,
                    phoneNumberId: metaForm.phoneNumberId,
                    shortLivedToken: shortLivedToken
                }).then(() => {
                    setMetaConnected(true);
                    setShowMetaModal(false);
                }).catch(err => {
                    setMetaError(err.response?.data?.message || 'Failed to connect Meta account.');
                }).finally(() => {
                    setMetaLoading(false);
                });
            } else {
                setMetaError('Facebook login was cancelled or failed.');
                setMetaLoading(false);
            }
        }, { scope: 'whatsapp_business_management,whatsapp_business_messaging' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        Dashboard <Sparkles className="text-amber-500 w-6 h-6" />
                    </h1>
                    <p className="text-gray-500 mt-1">Real-time pulse of your WhatsApp marketing engine.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm transition">
                        Reports
                    </button>
                    <button
                        onClick={() => window.location.href = '/campaigns/new'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition shadow-lg shadow-indigo-200"
                    >
                        New Campaign
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Send}
                    label="Successful Deliveries"
                    value={data.stats.messagesSent.toLocaleString()}
                    color="bg-blue-600"
                    loading={loading}
                />
                <StatCard
                    icon={UsersIcon}
                    label="Audience Size"
                    value={data.stats.activeContacts.toLocaleString()}
                    color="bg-indigo-600"
                    loading={loading}
                />
                <StatCard
                    icon={MessageSquare}
                    label="Pending Review"
                    value={data.stats.pendingTemplates}
                    color="bg-purple-600"
                    loading={loading}
                />
                <StatCard
                    icon={CreditCard}
                    label="Wallet Balance"
                    value={`₹${data.stats.creditBalance.toFixed(2)}`}
                    color="bg-pink-600"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Visual */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Weekly Engagement</h3>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Auto-updating</div>
                    </div>
                    {/* Charts require historical data, showing empty state if new */}
                    {data.stats.messagesSent === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
                            <Activity className="w-12 h-12 text-gray-200 mb-4" />
                            <p className="text-sm text-gray-400 font-medium text-center px-8">No campaign data yet. Start sending messages to see performance analytics.</p>
                        </div>
                    ) : (
                        <div className="h-64 relative flex items-end gap-3 px-4">
                            {[20, 45, 30, 80, 60, 40, 70].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.8 }}
                                    className="flex-1 bg-indigo-600/10 hover:bg-indigo-600 rounded-t-lg transition-colors group relative"
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20">
                                        {h}% Delivery
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                {/* Real-time Activity Logs */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">System Logs</h3>
                    <div className="space-y-6 flex-1 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide">
                        {data.activity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Activity className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider leading-relaxed">No recent pulses detected</p>
                            </div>
                        ) : data.activity.map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="mt-1 text-indigo-500">
                                    <Activity size={18} />
                                </div>
                                <div className="flex-1 border-b border-gray-50 pb-4">
                                    <p className="text-sm font-bold text-gray-800 leading-none mb-1">{item.title}</p>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase">{new Date(item.created_at).toLocaleString()}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Meta Connection Modal */}
            <AnimatePresence>
                {showMetaModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <Smartphone size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect WhatsApp API</h2>
                                <p className="text-gray-500 mb-6 text-sm">
                                    To unlock your dashboard and start sending campaigns, please securely connect your Meta credentials.
                                </p>

                                {metaError && (
                                    <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">{metaError}</div>
                                )}

                                <form onSubmit={handleMetaConnect} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">WhatsApp Business Account ID</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={metaForm.wabaId}
                                                onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium text-sm"
                                                placeholder="e.g. 1048291039485"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number ID</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={metaForm.phoneNumberId}
                                                onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium text-sm"
                                                placeholder="e.g. 1198472948574"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={metaLoading}
                                        className="w-full mt-6 bg-[#1877F2] text-white font-bold py-4 rounded-xl hover:bg-[#166fe5] transition shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
                                    >
                                        {metaLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                <Facebook className="text-white" size={24} />
                                                <span>Connect with Facebook</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
