"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Users, Plus, Trash2, Shield, Globe,
    Mail, Link as LinkIcon, AlertTriangle, X,
    Loader2, CheckCircle2
} from 'lucide-react';

export default function ManageAdminsPage() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState(null);
    const [verificationNumber, setVerificationNumber] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        tenantName: '',
        adminEmail: '',
        adminPassword: '',
        adminFullName: '',
        countryCode: 'IN'
    });

    const fetchTenants = async () => {
        try {
            const token = Cookies.get('token');
            const res = await axios.get('http://localhost:3000/admin/tenants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setTenants(res.data.data);
        } catch (err) {
            console.error('Failed to fetch tenants', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTenants(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = Cookies.get('token');
            await axios.post('http://localhost:3000/admin/tenants', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData({ tenantName: '', adminEmail: '', adminPassword: '', adminFullName: '', countryCode: 'IN' });
            fetchTenants();
        } catch (err) {
            alert(err.response?.data?.message || 'Creation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (tenant) => {
        setTenantToDelete(tenant);
        setVerificationNumber('');
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (verificationNumber !== '7904549387') return;

        try {
            const token = Cookies.get('token');
            await axios.delete(`http://localhost:3000/admin/tenants/${tenantToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowDeleteModal(false);
            fetchTenants();
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">System Administration</h1>
                <p className="text-gray-500 mt-1">Manage platform tenants and administrative access</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left - Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 sticky top-24">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Plus size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">New Tenant</h2>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Organization Name</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm font-bold"
                                        placeholder="Acme Corp"
                                        value={formData.tenantName}
                                        onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Admin Full Name</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm font-bold"
                                        placeholder="John Carter"
                                        value={formData.adminFullName}
                                        onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">System Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="email"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm font-bold"
                                        placeholder="admin@acme.com"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Master Password</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all text-sm font-bold"
                                    placeholder="••••••••"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Provision Tenant</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right - Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h2 className="font-bold text-gray-800 text-lg">Active Portals</h2>
                            <span className="text-[10px] font-black tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">
                                {tenants.length} TOTAL
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                            <th className="px-8 py-5">Tenant / Slug</th>
                                            <th className="px-8 py-5">Administrator</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {tenants.map((tenant) => (
                                            <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl uppercase ring-4 ring-white">
                                                            {tenant.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">{tenant.name}</p>
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                <LinkIcon size={10} /> /{tenant.slug}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-gray-700">{tenant.admin_name || 'No Admin'}</p>
                                                    <p className="text-xs text-gray-400">{tenant.admin_email}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full ${tenant.is_active ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {tenant.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleDeleteClick(tenant)}
                                                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {tenants.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center opacity-20">
                                                        <Users size={48} className="mb-4" />
                                                        <p className="italic font-bold">No tenants registered</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                <AlertTriangle size={32} />
                            </div>
                            <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={24} /></button>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2 italic">Confirm Deletion</h2>
                        <p className="text-gray-500 text-sm mb-8">
                            You are about to delete <span className="font-bold text-gray-800 underline">"{tenantToDelete?.name}"</span>.
                            This action is permanent and will wipe all associated data.
                        </p>

                        <div className="space-y-6">
                            <div className="space-y-2 text-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Master Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={verificationNumber}
                                    onChange={(e) => setVerificationNumber(e.target.value)}
                                    className="w-full px-4 py-5 bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-2xl outline-none transition-all font-mono text-center text-xl tracking-[0.3em] font-black"
                                    placeholder="••••••••"
                                />
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-2">
                                    Contact Super Admin for the master code
                                </p>
                            </div>

                            <button
                                onClick={confirmDelete}
                                className={`w-full py-5 rounded-2xl font-bold text-white transition-all shadow-xl ${verificationNumber === '7904549387'
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                                        : 'bg-gray-200 cursor-not-allowed'
                                    }`}
                                disabled={verificationNumber !== '7904549387'}
                            >
                                EXECUTE DELETION
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
