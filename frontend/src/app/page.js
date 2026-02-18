'use client';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import {
  Zap, Rocket, Target, Globe, CheckCircle,
  ArrowRight, MessageSquare, BarChart, Database,
  Shield, Star, Smile
} from 'lucide-react';

// --- Components ---

const Navbar = () => (
  <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Miping</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-indigo-600 transition">Features</a>
          <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
          <a href="#testimonials" className="hover:text-indigo-600 transition">Testimonials</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600">Login</Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="pt-32 pb-20 overflow-hidden relative">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 -z-10" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
          <Zap size={12} fill="currentColor" /> Authorized Business Partner
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter mb-8 leading-[0.9]">
          SCALE YOUR <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            REVENUE ON WHATSAPP
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium">
          The #1 Growth Platform for digital agencies. Automate sales, engage leads, and broadcast at scale with official Meta integration.
        </p>
        <div className="flex flex-col sm:row gap-4 justify-center items-center">
          <Link href="/signup" className="px-10 py-5 bg-indigo-600 text-white rounded-full font-black text-xl hover:bg-indigo-700 transition shadow-2xl shadow-indigo-300 flex items-center justify-center gap-3">
            START FREE TRIAL <ArrowRight size={24} strokeWidth={3} />
          </Link>
          <p className="text-sm text-gray-400 font-bold">No credit card required • 7-day free trial</p>
        </div>
      </motion.div>
    </div>
  </section>
);

const Features = () => (
  <section id="features" className="py-24 bg-white relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">Built for modern <br />marketing specialists.</h2>
          <div className="space-y-8">
            {[
              { icon: MessageSquare, title: 'Smart Auto-Responders', detail: 'Reply to FAQs instantly and qualify leads before your team wakes up.' },
              { icon: Target, title: 'Hyper-Targeted Broadcasting', detail: 'Upload contacts and blast personalized templates to thousands in seconds.' },
              { icon: BarChart, title: 'Real-time ROI Tracking', detail: 'Monitor read rates, clicks, and conversions with millisecond precision.' }
            ].map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <f.icon size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-3xl -rotate-3 -z-10" />
          <div className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
              alt="Analytics Dashboard"
              className="rounded-2xl w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get('/plans');
        setPlans(res.data.data);
      } catch (error) {
        console.error("Failed to load plans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <section id="pricing" className="py-24 bg-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Pricing that scales with you.</h2>
          <p className="text-gray-400 text-lg">Simple plans for small businesses and enterprises.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={plan.id} className={`p-8 rounded-3xl border ${index === 1 ? 'bg-indigo-600 border-indigo-500 text-white scale-105 shadow-2xl z-10' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${index === 1 ? 'text-indigo-100' : 'text-gray-400'}`}>{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-black">₹{plan.price}</span>
                  <span className="text-xs font-bold uppercase opacity-60"> / {plan.duration_days} days</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle size={18} className={index === 1 ? 'text-white' : 'text-indigo-400'} />
                    <span><strong>{plan.message_limit.toLocaleString()}</strong> Messages</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle size={18} className={index === 1 ? 'text-white' : 'text-indigo-400'} />
                    <span><strong>{plan.contact_limit.toLocaleString()}</strong> Contacts</span>
                  </li>
                </ul>

                <Link
                  href={`/signup?planId=${plan.id}`}
                  className={`block w-full py-4 rounded-full font-black text-center transition ${index === 1 ? 'bg-white text-indigo-600 hover:bg-gray-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  CHOOSE PLAN
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen font-sans bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <Hero />
      <section className="py-12 bg-white border-y border-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-8">Trusted by 500+ Digital Agencies</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale saturate-0 items-center">
            <div className="text-2xl font-black italic">CLICKS_MODERN</div>
            <div className="text-2xl font-black underline decoration-indigo-500">QUANTUM_ADS</div>
            <div className="text-2xl font-bold tracking-tighter">ELITE_CONVERSION</div>
            <div className="text-2xl font-black bg-black text-white px-2">VIRTUE_SOCIAL</div>
          </div>
        </div>
      </section>
      <Features />
      <Pricing />
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg" />
            <span className="text-lg font-bold">Miping</span>
          </div>
          <p className="text-sm text-gray-400 font-medium">© {new Date().getFullYear()} Miping Platform. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
