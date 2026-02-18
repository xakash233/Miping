"use client";

import React, { useState } from 'react';
import {
    Inbox, Search, Filter, MoreVertical,
    Send, Smile, Paperclip, Phone, Info,
    MessageSquare, Clock
} from 'lucide-react';

export default function InboxPage() {
    // Empty state - Real data to be integrated with incoming webhook module
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6 pb-4 animate-in fade-in duration-500">
            {/* Sidebar */}
            <div className="w-80 shrink-0 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-white">
                    <h1 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                        <Inbox size={20} className="text-blue-600" /> Inbox
                    </h1>
                </div>
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input placeholder="Search conversations..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none text-[11px] font-bold transition-all" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
                    <div className="w-16 h-16 bg-white rounded-3xl border border-gray-100 flex items-center justify-center text-gray-200 mb-4 shadow-sm">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">No Messages</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tighter leading-relaxed">
                        Incoming messages from your customers will appear here automatically.
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                {selectedChat ? (
                    <>
                        {/* Chat Header would go here */}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-20 h-20 bg-blue-50 text-blue-100 rounded-[2rem] flex items-center justify-center mb-6">
                            <Inbox size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Direct Messaging</h2>
                        <p className="text-gray-400 text-sm max-w-sm mt-2 font-medium">
                            Select a conversation to start replying. Real-time two-way messaging is currently being synchronized with your Meta account.
                        </p>
                        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Syncing Nodes...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
