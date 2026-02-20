"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Plus, Search, FileText, CheckCircle2, Clock, AlertCircle,
    X, Loader2, Save, Trash2
} from 'lucide-react';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        category: 'MARKETING',
        language: 'en_US',
        body: ''
    });
    const [variableMappings, setVariableMappings] = useState({});

    // Available values for variables (10 values as requested)
    const VARIABLE_OPTIONS = [
        { value: 'contact.name', label: 'Contact Name' },
        { value: 'contact.phone', label: 'Contact Phone' },
        { value: 'custom.company', label: 'Company Name' },
        { value: 'custom.orderId', label: 'Order ID' },
        { value: 'custom.trackingNumber', label: 'Tracking Number' },
        { value: 'custom.amount', label: 'Amount Due' },
        { value: 'custom.date', label: 'Date/Time' },
        { value: 'custom.field1', label: 'Custom Field 1' },
        { value: 'custom.field2', label: 'Custom Field 2' },
        { value: 'custom.field3', label: 'Custom Field 3' }
    ];

    // Detect variables {{1}} to {{10}}
    const detectedVariables = Array.from(new Set(formData.body.match(/{{\d+}}/g) || []))
        .map(v => parseInt(v.replace(/\D/g, '')))
        .filter(n => n >= 1 && n <= 10)
        .sort((a, b) => a - b);

    const fetchTemplates = async () => {
        try {
            const token = Cookies.get('token');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setTemplates(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch templates', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const token = Cookies.get('token');

            // Format variables as an array matching the order of 1, 2, 3...
            // Or save as JSON depending on backend. We'll send an array of mapped values.
            const mappedVariables = detectedVariables.map(num => variableMappings[num] || 'custom.field1');

            const payload = {
                name: formData.name,
                category: formData.category,
                language: formData.language,
                content: formData.body,
                variables: mappedVariables
            };

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/templates`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setShowModal(false);
                setFormData({ name: '', category: 'MARKETING', language: 'en_US', body: '' });
                setVariableMappings({});
                fetchTemplates();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create template');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Message Templates</h1>
                    <p className="text-gray-500 mt-1">Design and manage your Meta-approved templates</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                >
                    <Plus size={20} />
                    Create Template
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((tpl) => (
                            <div key={tpl.id} className="p-6 rounded-[2rem] border border-gray-50 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all group bg-white">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <FileText size={24} />
                                    </div>
                                    <div className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full ${tpl.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                                        tpl.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                        {tpl.status}
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{tpl.name}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tpl.category}</p>

                                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 line-clamp-2">
                                    {tpl.body || 'No content preview'}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {tpl.status === 'APPROVED' ? <CheckCircle2 size={14} className="text-green-500" /> : <Clock size={14} className="text-orange-500" />}
                                        <span className="text-xs text-gray-400">Synced to Meta</span>
                                    </div>
                                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 italic">
                                <FileText className="text-blue-600" /> New Template
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={24} /></button>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Name</label>
                                    <input
                                        className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                                        placeholder="welcome_msg"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/ /g, '_') })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Category</label>
                                    <select
                                        className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="MARKETING">Marketing</option>
                                        <option value="UTILITY">Utility</option>
                                        <option value="AUTHENTICATION">Authentication</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Content (Use {'{{1}}'}, {'{{2}}'} for variables)</label>
                                    <textarea
                                        className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium min-h-[120px]"
                                        placeholder="Hello {{1}}, thanks for choosing us!"
                                        value={formData.body}
                                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Dynamic Variable Mapping Dropdowns */}
                                {detectedVariables.length > 0 && (
                                    <div className="p-4 bg-blue-50/50 rounded-2xl space-y-3 border border-blue-100">
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Map Variables</p>
                                        {detectedVariables.map((num) => (
                                            <div key={num} className="flex items-center gap-4">
                                                <div className="w-12 text-center text-sm font-bold text-indigo-600 bg-indigo-100 py-2 rounded-xl">
                                                    {`{{${num}}}`}
                                                </div>
                                                <select
                                                    className="flex-1 px-4 py-3 bg-white border border-blue-200 focus:border-blue-500 rounded-xl outline-none transition-all text-sm font-bold text-gray-700"
                                                    value={variableMappings[num] || ''}
                                                    onChange={(e) => setVariableMappings({ ...variableMappings, [num]: e.target.value })}
                                                    required
                                                >
                                                    <option value="" disabled>Select Mapping</option>
                                                    {VARIABLE_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Create Template</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
