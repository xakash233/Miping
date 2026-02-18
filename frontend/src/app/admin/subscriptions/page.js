'use client';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function SubscriptionsManagement() {
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form for new tenant
    const [formData, setFormData] = useState({
        tenantName: '',
        slug: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        planId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tenantsRes, plansRes] = await Promise.all([
                axios.get('/admin/tenants'),
                axios.get('/plans')
            ]);
            setTenants(tenantsRes.data.data);
            setPlans(plansRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/admin/create-tenant', formData);
            alert('Tenant Created & Email Sent!');
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || 'Failed'));
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Active Subscriptions</h1>
                    <p className="text-gray-500 mt-1">Monitor tenant subscriptions and status.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                    + Provision New Tenant
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant Organization</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Contact</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Plan</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading subscriptions...</td></tr> : tenants.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900">{t.name}</div>
                                    <div className="text-xs text-gray-500">Slug: {t.domain_slug}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{t.admin_email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {t.plan_name ? (
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {t.plan_name}
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            No Plan
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {t.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Provision New Tenant</h2>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    type="text" required
                                    placeholder="e.g. Acme Corp"
                                    value={formData.tenantName}
                                    onChange={e => setFormData({ ...formData, tenantName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug (Unique ID)</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    type="text" required placeholder="e.g. acme-corp"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-2.5"
                                        type="text" required
                                        value={formData.adminName}
                                        onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-2.5"
                                        type="email" required
                                        value={formData.adminEmail}
                                        onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    type="text" required value={formData.adminPassword}
                                    onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Plan</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.planId}
                                    onChange={e => setFormData({ ...formData, planId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a Plan</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200"
                                >
                                    Provision Tenant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
