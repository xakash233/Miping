"use client";

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, FileText, Layers, LogOut, X, Box,
    ChevronDown, PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const SidebarItem = ({ icon: Icon, label, href, active, hasSubmenu }) => (
    <Link
        href={href}
        className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all group ${active
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} className={active ? 'text-white' : 'group-hover:text-blue-600'} />
            <span className="font-semibold text-[13px]">{label}</span>
        </div>
        {hasSubmenu && <ChevronDown size={14} className={active ? 'text-white' : 'text-gray-400'} />}
    </Link>
);

const SidebarGroup = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="px-4 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
            {title}
        </h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const Sidebar = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserRole(Cookies.get('user_role'));
         
        setUserName(Cookies.get('user_name'));
        setMounted(true);
    }, []);

    const isActive = (path) => pathname === path;

    if (!mounted) return null;

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('user_role');
        Cookies.remove('user_name');
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[240px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo & Select App */}
                <div className="p-4 space-y-4 shrink-0">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            V
                        </div>
                        <span className="text-xl font-black text-gray-800 tracking-tight uppercase">BVITE</span>
                        <button onClick={onClose} className="md:hidden ml-auto text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Select App</span>
                            <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                                Miping App <ChevronDown size={14} className="text-gray-400" />
                            </span>
                        </div>
                        <PlusCircle size={20} className="text-blue-600" />
                    </div>
                </div>

                {/* Scrollable Menu */}
                <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
                    <SidebarGroup title="WORKSPACE">
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={isActive('/dashboard')} />
                    </SidebarGroup>

                    <SidebarGroup title="APPS">
                        <SidebarItem icon={Users} label="Contacts" href="/contacts" active={isActive('/contacts')} />
                        <SidebarItem icon={FileText} label="Templates" href="/templates" active={isActive('/templates')} />
                    </SidebarGroup>

                    {userRole === 'SUPER_ADMIN' && (
                        <SidebarGroup title="PLATFORM ADMIN">
                            <SidebarItem icon={Layers} label="Plans" href="/admin/plans" active={isActive('/admin/plans')} />
                            <SidebarItem icon={Users} label="Subscriptions" href="/admin/subscriptions" active={isActive('/admin/subscriptions')} />
                        </SidebarGroup>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-50 space-y-2 shrink-0">
                    <SidebarItem icon={Box} label="Settings" href="/settings/whatsapp" active={isActive('/settings/whatsapp')} />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg w-full transition-colors group"
                    >
                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-[13px]">Logout</span>
                    </button>
                    <p className="text-[10px] text-gray-400 text-center font-bold mt-4">© 2024 BVITE PREMIUM</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
