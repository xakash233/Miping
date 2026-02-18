"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';

const AppLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const publicPaths = ['/login', '/', '/pricing', '/signup'];
    const isPublicPage = publicPaths.includes(pathname);

    if (isPublicPage) {
        return <div className="font-sans text-gray-900 overflow-x-hidden">{children}</div>;
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden w-full relative">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
