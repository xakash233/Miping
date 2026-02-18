'use client';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function PricingPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Fetch from public route
                const res = await axios.get('/plans');
                setPlans(res.data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Pricing plans for teams of all sizes
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Choose the perfect plan to grow your business with WhatsApp automation.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center mt-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div key={plan.id} className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div>
                                    <div className="flex items-center justify-between gap-x-4">
                                        <h3 className="text-lg font-semibold leading-8 text-gray-900">{plan.name}</h3>
                                        <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-600">Most Popular</div>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-gray-600">{plan.description}</p>
                                    <p className="mt-6 flex items-baseline gap-x-1">
                                        <span className="text-4xl font-bold tracking-tight text-gray-900">₹{plan.price}</span>
                                        <span className="text-sm font-semibold leading-6 text-gray-600">/{plan.duration_days} days</span>
                                    </p>
                                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                        <li className="flex gap-x-3">
                                            <svg className="h-6 w-5 flex-none text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                            </svg>
                                            {plan.message_limit.toLocaleString()} Messages
                                        </li>
                                        <li className="flex gap-x-3">
                                            <svg className="h-6 w-5 flex-none text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                            </svg>
                                            {plan.contact_limit.toLocaleString()} Contacts
                                        </li>
                                        <li className="flex gap-x-3">
                                            <svg className="h-6 w-5 flex-none text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                            </svg>
                                            Full API Access
                                        </li>
                                    </ul>
                                </div>
                                <a
                                    href="/signup"
                                    className="mt-8 block rounded-md bg-indigo-600 px-3.5 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Get started
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
