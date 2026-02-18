'use client';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export default function PlansManagement() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlanId, setCurrentPlanId] = useState(null);

    const [formData, setFormData] = useState({
        name: '', description: '', price: '',
        message_limit: 1000, contact_limit: 500, duration_days: 30
    });

    const fetchPlans = async () => {
        try {
            const res = await axios.get('/plans');
            setPlans(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPlans();
    }, []);

    const handleEdit = (plan) => {
        setIsEditing(true);
        setCurrentPlanId(plan.id);
        setFormData({
            name: plan.name,
            description: plan.description || '',
            price: plan.price,
            message_limit: plan.message_limit,
            contact_limit: plan.contact_limit,
            duration_days: plan.duration_days
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await axios.delete(`/plans/${id}`);
            fetchPlans();
        } catch (error) {
            alert('Failed to delete plan');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.patch(`/plans/${currentPlanId}`, formData);
            } else {
                await axios.post('/plans', formData);
            }
            setShowModal(false);
            setIsEditing(false);
            setCurrentPlanId(null);
            fetchPlans();
            setFormData({ name: '', description: '', price: '', message_limit: 1000, contact_limit: 500, duration_days: 30 });
        } catch (error) {
            console.error(error);
            alert('Operation failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentPlanId(null);
        setFormData({ name: '', description: '', price: '', message_limit: 1000, contact_limit: 500, duration_days: 30 });
        setShowModal(true);
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-gray-500 mt-1">Create and manage pricing tiers.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    + Create New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? <p>Loading Plans...</p> : plans.map(plan => (
                    <div key={plan.id} className="border border-gray-200 p-6 rounded-xl shadow-sm bg-white hover:shadow-md transition relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <div className="text-2xl font-bold mt-2 text-blue-600">₹{plan.price}</div>
                                <span className="text-xs text-gray-500 font-medium">per {plan.duration_days} days</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(plan)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition">
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => handleDelete(plan.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-full text-red-500 transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-6 min-h-[40px]">{plan.description}</p>

                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span><strong>{plan.message_limit.toLocaleString()}</strong> Messages</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span><strong>{plan.contact_limit.toLocaleString()}</strong> Contacts</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {isEditing ? 'Edit Subscription Plan' : 'Create New Plan'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                                <input
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="e.g. Enterprise Gold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        className="w-full border border-gray-300 p-2.5 rounded-lg"
                                        type="number" step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                                    <input
                                        className="w-full border border-gray-300 p-2.5 rounded-lg"
                                        type="number"
                                        placeholder="30"
                                        value={formData.duration_days}
                                        onChange={e => setFormData({ ...formData, duration_days: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Limit</label>
                                    <input
                                        className="w-full border border-gray-300 p-2.5 rounded-lg"
                                        type="number"
                                        value={formData.message_limit}
                                        onChange={e => setFormData({ ...formData, message_limit: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Limit</label>
                                    <input
                                        className="w-full border border-gray-300 p-2.5 rounded-lg"
                                        type="number"
                                        value={formData.contact_limit}
                                        onChange={e => setFormData({ ...formData, contact_limit: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full border border-gray-300 p-2.5 rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Brief details about what is included..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-200"
                                >
                                    {isEditing ? 'Save Changes' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
