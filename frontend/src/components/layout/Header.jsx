"use client";

import React, { useState, useEffect } from 'react';
import { Search, Bell, Globe, Sun, Moon, Settings, Menu, Grid, LayoutGrid } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

const Header = ({ onMenuClick }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [userName, setUserName] = useState('Michelle');
    const [userRole, setUserRole] = useState('Admin');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserName(Cookies.get('user_name') || 'Michelle');
         
        setUserRole(Cookies.get('user_role') || 'Admin');
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    const getBreadcrumbs = () => {
        const parts = pathname.split('/').filter(p => p);
        if (parts.length === 0) return 'Home / Dashboard';
        return `Home / ${parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')}`;
    };

    return (
        <header className="bg-white border-b border-gray-100 min-h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 w-full shrink-0">
            {/* Left Section: Breadcrumbs & Toggle */}
            <div className="flex items-center gap-6">
                <button
                    className="p-2 -ml-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all"
                    onClick={onMenuClick}
                >
                    <Menu size={20} />
                </button>

                <div className="hidden lg:flex flex-col">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                        Workspace
                    </span>
                    <span className="text-sm font-bold text-gray-800 tracking-tight">
                        {getBreadcrumbs()}
                    </span>
                </div>
            </div>

            {/* Middle Section: Search Bar */}
            <div className="flex-1 max-w-xl mx-8 hidden md:block">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-gray-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for templates, apps or data..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-2.5 text-[13px] font-semibold text-gray-600 placeholder-gray-400 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Right Section: Utility Icons & Profile */}
            <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all">
                        <LayoutGrid size={20} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all">
                        <Globe size={20} />
                    </button>
                    <button onClick={toggleDarkMode} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-gray-50 rounded-xl transition-all">
                        {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button onClick={() => router.push('/settings')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all">
                        <Settings size={20} />
                    </button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-gray-800 leading-none mb-0.5">{userName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Pro Account</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm border-2 border-white shadow-sm ring-1 ring-gray-100 overflow-hidden cursor-pointer hover:ring-blue-200 transition-all">
                        <img
                            src={`https://ui-avatars.com/api/?name=${userName}&background=E0E7FF&color=4F46E5&bold=true`}
                            alt="User Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
