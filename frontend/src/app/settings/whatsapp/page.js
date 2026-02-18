'use client';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FB_APP_ID';

export default function WhatsAppSettings() {
    const [account, setAccount] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load FB SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: FACEBOOK_APP_ID,
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

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [accRes, subRes] = await Promise.all([
                axios.get('/whatsapp/status').catch(() => null), // If 404, returns null
                axios.get('/plans/my-subscription').catch(() => null)
            ]);
            setAccount(accRes?.data?.data || null);
            setSubscription(subRes?.data?.data || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const launchWhatsAppSignup = () => {
        const configId = 'Your_Config_ID'; // Ideally from backend, or hardcoded for now if static
        // Start Embedded Signup
        window.FB.login(function (response) {
            if (response.authResponse) {
                const code = response.authResponse.code;
                // Wait for message from popup containing WABA selection
                // Actually, clean Embedded Signup v2 returns code if using system user access token flow
                // Or we use the standard OAuth flow.

                // For Embedded Signup, we typically listen for message event or use returning payload
                // Assuming standard OAuth flow for simplicity here:
                connectAccount(code);
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {
            scope: 'whatsapp_business_management,  whatsapp_business_messaging',
            extras: {
                feature: 'whatsapp_embedded_signup',
                sessionInfoVersion: '2',
            }
        });
    };

    // Simplified fallback: Just paste token (Dev/Manual Mode) or use proper OAuth
    // But since we built the backend for 'code', let's simulate the connect call
    const connectAccount = async (code) => {
        try {
            // In real embedded signup, we also get wabaId and phoneNumberId from the flow callbacks
            // For this implementation, we might need a more robust collection of those IDs
            // For now, let's assume successful OAuth and we fetch IDs from Graph API in backend?
            // Actually, backend expects { code, phoneNumberId, wabaId }.
            // The Frontend SDK flow usually returns these via window message event.

            // Placeholder for flow completion
            alert('OAuth Code received: ' + code + '. Backend implementation requires full Embedded Signup flow data.');

            // await axios.post('/whatsapp/connect', { code, ... });
            // fetchData();
        } catch (error) {
            alert('Connection Failed');
        }
    };

    // Since users struggle with full Embedded Signup Setup without HTTPS/App Review,
    // I will simplify this to a "Status View" + "Manual Connect (if needed)"
    // Or just "Plan View" + "Connection Status".

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            {/* Subscription Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-bold mb-4">Your Subscription</h2>
                {loading ? <p>Loading...</p> : subscription ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-500">Current Plan</p>
                                <p className="text-xl font-bold text-indigo-600">{subscription.plan_name}</p>
                            </div>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Message Limit</p>
                                <p className="text-2xl font-bold">{subscription.message_limit.toLocaleString()}</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Contact Limit</p>
                                <p className="text-2xl font-bold">{subscription.contact_limit.toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 text-right">Valid until: {new Date(subscription.end_date).toLocaleDateString()}</p>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No active subscription found.</p>
                        <p className="text-sm text-gray-400 mt-1">Please contact support to upgrade.</p>
                    </div>
                )}
            </div>

            {/* WhatsApp Connection Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold mb-4">WhatsApp Connection</h2>

                {loading ? <p>Loading...</p> : account ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">Connected</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">WABA ID</p>
                                <p className="font-mono bg-gray-50 p-1 rounded">{account.wabaId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Phone ID</p>
                                <p className="font-mono bg-gray-50 p-1 rounded">{account.phoneNumberId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Messaging Tier</p>
                                <p className="font-medium">{account.tier || 'TIER_1K'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Quality Rating</p>
                                <p className="font-medium text-green-600">{account.quality || 'GREEN'}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="mb-4 text-gray-500">
                            <p>Connect your WhatsApp Business Account to start sending messages.</p>
                        </div>
                        <button
                            onClick={launchWhatsAppSignup}
                            className="bg-[#1877F2] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#166fe5] shadow-md transition flex items-center gap-2 mx-auto disabled:opacity-50"
                            disabled={!FACEBOOK_APP_ID || FACEBOOK_APP_ID === 'YOUR_FB_APP_ID'}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            Connect with Facebook
                        </button>
                        {(!FACEBOOK_APP_ID || FACEBOOK_APP_ID === 'YOUR_FB_APP_ID') && (
                            <p className="text-xs text-red-500 mt-2">
                                * Facebook App ID not configured in .env
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
