"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Folder, Plus, Play, Pause, MoreVertical,
    MessageCircle, Calendar, CheckCircle2, Clock,
    Loader2, X, AlertCircle, Save, Phone
} from 'lucide-react';

export default function CampaignsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [contacts, setContacts] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [formData, setFormData] = useState({
        templateId: '',
        contactId: '',
        scheduleTime: ''
    });

    const fetchHistory = async () => {
        try {
            const token = Cookies.get('token');
            const res = await axios.get('http://localhost:8000/messages/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setJobs(res.data.data);
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const token = Cookies.get('token');
            const [cRes, tRes] = await Promise.all([
                axios.get('http://localhost:8000/contacts', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:8000/templates', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setContacts(cRes.data.data);
            setTemplates(tRes.data.data.filter(t => t.status === 'APPROVED' || t.status === 'PENDING'));
        } catch (err) {
            console.error('Failed to fetch dropdowns', err);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchDropdowns();
    }, []);

    const handleSchedule = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const token = Cookies.get('token');
            const res = await axios.post('http://localhost:8000/messages/schedule', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setShowModal(false);
                setFormData({ templateId: '', contactId: '', scheduleTime: '' });
                fetchHistory();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Scheduling failed');
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount = jobs.filter(j => j.status === 'PENDING').length;
    const sentCount = jobs.filter(j => j.status === 'SENT').length;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Campaigns</h1>
                    <p className="text-gray-500 mt-1">Broadcast and automate your messaging</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200"
                >
                    <Plus size={20} />
                    Create Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Jobs</p>
                    <div className="text-3xl font-black text-gray-800 mt-1">{pendingCount}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent Jobs</p>
                    <div className="text-3xl font-black text-blue-600 mt-1">{sentCount}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total History</p>
                    <div className="text-3xl font-black text-gray-800 mt-1">{jobs.length}</div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/30">
                                    <th className="px-8 py-5">Template & Contact</th>
                                    <th className="px-8 py-5">Phone</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5 text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center">
                                                    <MessageCircle size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{job.template_name}</p>
                                                    <p className="text-xs text-gray-400">{job.contact_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-semibold text-gray-500">{job.phone_e164}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`flex items-center gap-2 text-[10px] font-black tracking-widest px-3 py-1 rounded-full w-fit ${job.status === 'SENT' ? 'bg-green-50 text-green-600' :
                                                job.status === 'PENDING' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {job.status === 'PENDING' && <Clock size={10} />}
                                                {job.status === 'SENT' && <CheckCircle2 size={10} />}
                                                {job.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-gray-500">
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-bold text-gray-800">₹{job.cost}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Launch Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 italic">
                                <Plus className="text-blue-600" /> New Campaign
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={24} /></button>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSchedule} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Select Template</label>
                                <select
                                    className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                                    value={formData.templateId}
                                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                                    required
                                >
                                    <option value="">Choose a template...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Target Contact</label>
                                <select
                                    className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                                    value={formData.contactId}
                                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                                    required
                                >
                                    <option value="">Choose a contact...</option>
                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone_e164})</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Schedule Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                                    value={formData.scheduleTime}
                                    onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Launch Campaign</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
