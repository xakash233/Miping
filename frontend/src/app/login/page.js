"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Assuming Backend is running on port 3000
            const response = await axios.post('http://localhost:3000/auth/login', {
                email: formData.email,
                password: formData.password
            });

            const { token, user } = response.data.data;

            // Store Token & User Info
            Cookies.set('token', token, { expires: 1 }); // 1 day
            Cookies.set('user_role', user.role, { expires: 1 });
            Cookies.set('user_name', user.full_name || user.email.split('@')[0], { expires: 1 });
            Cookies.set('email', user.email, { expires: 1 });

            // Redirect based on role
            if (user.role === 'SUPER_ADMIN') {
                router.push('/'); // Or /admin/dashboard if separate
            } else {
                router.push('/');
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">

                {/* Left Side - Visual */}
                <div className="w-full md:w-1/2 bg-blue-600 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold mb-2">Miping</h1>
                        <p className="text-blue-100">Enterprise Communication Platform</p>
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                        <p className="text-blue-100 mb-8">Access your dashboard to manage tenants, messages, and payments.</p>
                    </div>

                    {/* Abstract Circles */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Login to Account</h2>
                        <p className="text-gray-500 text-sm mt-1">Please enter your credentials to continue.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                    placeholder="admin@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-gray-500">Remember me</span>
                            </label>
                            <a href="#" className="text-blue-600 hover:underline font-medium">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Login
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Don&apos;t have an account? <span className="text-gray-400">Please contact Super Admin.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
