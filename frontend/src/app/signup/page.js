'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Shield, CreditCard, Mail,
    Lock, User, Globe, ArrowRight, Loader2,
    Check
} from 'lucide-react';

import { Suspense } from 'react';

function SignupFlow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPlanId = searchParams.get('planId');

    const [step, setStep] = useState(1); // 1: Info, 2: OTP, 3: Payment, 4: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [plans, setPlans] = useState([]);

    const [formData, setFormData] = useState({
        adminName: '',
        email: '',
        password: '',
        tenantName: '',
        slug: '',
        planId: initialPlanId || ''
    });

    const [otp, setOtp] = useState('');
    const [verificationToken, setVerificationToken] = useState('');

    useEffect(() => {
        axios.get('/plans').then(res => setPlans(res.data.data));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'tenantName' && !formData.slug) {
            setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/ /g, '-') }));
        }
    };

    const handleInitSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post('/auth/signup/init', formData);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start registration');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/auth/signup/verify', {
                email: formData.email,
                otp
            });
            setVerificationToken(res.data.verificationToken);
            setStep(3);
        } catch (err) {
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Simulate Payment Processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            await axios.post('/auth/signup/complete', {
                verificationToken,
                paymentData: { method: 'card', status: 'success' }
            });
            setStep(4);
        } catch (err) {
            setError('Payment succeeded but account creation failed. Please contact support.');
        } finally {
            setLoading(false);
        }
    };

    const selectedPlan = plans.find(p => p.id == formData.planId);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full grid md:grid-cols-5 gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

                {/* Left Sidebar - Progress */}
                <div className="md:col-span-2 bg-indigo-600 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-12">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 font-bold">M</div>
                            <span className="text-xl font-bold tracking-tight">Miping</span>
                        </div>

                        <div className="space-y-8">
                            {[
                                { s: 1, t: 'Account Info', d: 'Enter your basic details' },
                                { s: 2, t: 'Verification', d: 'Check your email for OTP' },
                                { s: 3, t: 'Secure Payment', d: 'Choose your plan & pay' },
                                { s: 4, t: 'Get Started', d: 'Access your dashboard' }
                            ].map((item) => (
                                <div key={item.s} className="flex gap-4 items-start">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${step >= item.s ? 'bg-white text-indigo-600 border-white' : 'border-indigo-400 text-indigo-400'
                                        }`}>
                                        {step > item.s ? <Check size={16} /> : item.s}
                                    </div>
                                    <div>
                                        <p className={`font-bold leading-none ${step >= item.s ? 'text-white' : 'text-indigo-300'}`}>{item.t}</p>
                                        <p className="text-xs text-indigo-200 mt-1">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                        <h4 className="font-bold mb-2">Selected Plan</h4>
                        {selectedPlan ? (
                            <div>
                                <p className="text-2xl font-black">₹{selectedPlan.price}</p>
                                <p className="text-xs text-indigo-200 opacity-80">{selectedPlan.name} • {selectedPlan.duration_days} Days</p>
                            </div>
                        ) : (
                            <p className="text-sm opacity-60">No plan selected</p>
                        )}
                    </div>

                    {/* Decor */}
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50" />
                </div>

                {/* Right Area - Form Content */}
                <div className="md:col-span-3 p-10 md:p-16 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-3xl font-black text-gray-900 leading-tight">Create your <br />Business Account</h2>
                                {error && <p className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</p>}

                                <form onSubmit={handleInitSignup} className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Organization Name</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input name="tenantName" value={formData.tenantName} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Acme Digital" />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input name="adminName" value={formData.adminName} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="John Doe" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="john@email.com" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="••••••••" />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Choose Plan</label>
                                        <select name="planId" value={formData.planId} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-white">
                                            <option value="">Select Plan</option>
                                            {plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button type="submit" disabled={loading} className="col-span-2 bg-indigo-600 text-white py-4 rounded-xl font-black text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center justify-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" /> : 'Send Verification OTP'} <ArrowRight size={20} />
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center space-y-8"
                            >
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                                    <Shield size={40} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900">Verify Email</h2>
                                    <p className="text-gray-500 mt-2">We sent a 6-digit code to <b>{formData.email}</b></p>
                                </div>

                                {error && <p className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</p>}

                                <div className="flex justify-center gap-3">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="------"
                                        className="w-48 text-center text-4xl font-black tracking-[10px] py-4 border-b-4 border-gray-100 focus:border-indigo-600 outline-none transition-all"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>

                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={loading || otp.length < 6}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="mx-auto animate-spin" /> : 'Verify & Continue'}
                                </button>
                                <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-400 hover:text-indigo-600 italic">Incorrect email? Go back</button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                        <CreditCard size={24} />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900">Final Step: <br />Secure Payment</h2>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-gray-500">Selected Plan</span>
                                        <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-indigo-600 uppercase border border-indigo-100">{selectedPlan?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-3xl font-black text-gray-900">₹{selectedPlan?.price}</p>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Includes GST @ 18%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 font-bold italic">Simulating secure checkout via Razorpay...</p>
                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-lg hover:bg-green-700 shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Pay Now'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8"
                            >
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                    <CheckCircle size={48} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-gray-900">Payment Successful!</h2>
                                    <p className="text-gray-500 mt-4 leading-relaxed">
                                        Welcome aboard! We&apos;ve sent your <b>Admin Credentials</b> <br />
                                        to your email: <b>{formData.email}</b>
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                                >
                                    Login to Dashboard
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        }>
            <SignupFlow />
        </Suspense>
    );
}
