"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Users, UserPlus, Upload, Search, Filter,
    MoreHorizontal, Download, Phone, CheckCircle2,
    X, Loader2, Save, AlertCircle
} from 'lucide-react';

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const fetchContacts = async () => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setContacts(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch contacts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleBulkImport = async (e) => {
        e.preventDefault();
        setImporting(true);
        setImportResult(null);

        try {
            const token = Cookies.get('token');
            // Parse CSV: Phone, Name
            const lines = importData.split('\n').filter(line => line.trim());
            const parsedContacts = lines.map(line => {
                const [phone, name] = line.split(',').map(s => s.trim());
                return { phone, name: name || 'Anonymous' };
            });

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/contacts/import`, {
                contacts: parsedContacts
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setImportResult(res.data.data);
                fetchContacts();
                // Close after a delay if successful
                setTimeout(() => {
                    if (res.data.data.imported > 0) setShowImportModal(false);
                }, 2000);
            }
        } catch (err) {
            console.error('Import failed', err);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
                    <p className="text-gray-500 mt-1">Manage and segment your audience directory</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => {
                            setImportResult(null);
                            setImportData('');
                            setShowImportModal(true);
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm"
                    >
                        <Upload size={18} /> Import
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-sm">
                        <UserPlus size={18} /> New Contact
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            placeholder="Search by name or number..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                            <Filter size={20} />
                        </button>
                        <button className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <th className="px-8 py-4">Contact</th>
                                    <th className="px-8 py-4">Phone Number</th>
                                    <th className="px-8 py-4">Added Date</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm uppercase">
                                                    {contact.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">{contact.name || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                                                <Phone size={14} className="text-gray-400" />
                                                {contact.phone_e164}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-gray-400">
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-50 px-3 py-1 rounded-full w-fit">
                                                <CheckCircle2 size={12} /> VERIFIED
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 text-gray-300 hover:text-gray-600 rounded-lg group-hover:bg-white transition-all">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {contacts.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-blue-50 text-blue-100 rounded-3xl flex items-center justify-center mb-4">
                                                    <Users size={32} />
                                                </div>
                                                <p className="text-gray-400 font-medium italic">Your directory is empty. Import contacts to start campaigns.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 italic">
                                <Upload className="text-blue-600" /> Bulk Import
                            </h2>
                            <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={24} /></button>
                        </div>

                        {importResult && (
                            <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-2xl flex flex-col gap-2 text-sm font-bold">
                                <div className="flex items-center gap-2"><CheckCircle2 size={18} /> Processing Complete</div>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="bg-white/50 p-2 rounded-lg">Imported: {importResult.imported}</div>
                                    <div className="bg-white/50 p-2 rounded-lg text-orange-600">Skipped: {importResult.duplicates_skipped}</div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Paste CSV Data (Format: Phone, Name)</label>
                            <textarea
                                className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm font-mono min-h-[200px]"
                                placeholder="+919999999999, John Doe\n+918888888888, Jane Smith"
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                            />
                            <p className="text-[10px] text-gray-400 font-medium italic">Note: One contact per line. Name is optional.</p>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkImport}
                                disabled={importing || !importData.trim()}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {importing ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Start Import</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
