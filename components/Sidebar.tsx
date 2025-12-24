
import React from 'react';
import { ChatSession } from '../types';
import { PlusIcon, TrashIcon, SunIcon, MoonIcon, SidebarCloseIcon, GlobeIcon, SettingsIcon } from './ui/Icons';
import { TRANSLATIONS } from '../constants';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onCloseMobile: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  labels: typeof TRANSLATIONS['zh-TW'];
  onToggleLanguage: () => void;
  onOpenSettings: () => void; // New prop
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession,
  isOpen,
  isCollapsed,
  toggleCollapse,
  onCloseMobile,
  isDarkMode,
  toggleTheme,
  labels,
  onToggleLanguage,
  onOpenSettings
}) => {
  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
                onClick={onCloseMobile}
            />
        )}

        <aside 
            className={`
                fixed md:relative z-40 inset-y-0 left-0 flex flex-col
                bg-zinc-50 dark:bg-[#202023] border-r border-zinc-200 dark:border-zinc-700
                transition-all duration-300 ease-in-out
                w-[260px]
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-0 md:border-none' : ''}
            `}
        >
            <div className={`flex flex-col h-full w-full overflow-hidden ${isCollapsed ? 'invisible' : 'visible'}`}>
                {/* Header */}
                <div className="p-3 flex items-center justify-between min-w-[260px]">
                    <button
                        onClick={() => {
                            onNewChat();
                            if (window.innerWidth < 768) onCloseMobile();
                        }}
                        className="flex-1 flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors py-2.5 px-3 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>{labels.newChat}</span>
                    </button>
                    
                    <button 
                        onClick={toggleCollapse} 
                        className="md:flex hidden ml-2 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        title="Close Sidebar"
                    >
                        <SidebarCloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-w-[260px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">{labels.recents}</div>
                    {sessions.length === 0 ? (
                        <div className="px-2 text-sm text-zinc-500 dark:text-zinc-500 italic whitespace-nowrap">
                            {labels.noChats}
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => {
                                    onSelectSession(session.id);
                                    if (window.innerWidth < 768) onCloseMobile();
                                }}
                                className={`
                                    group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors
                                    ${currentSessionId === session.id 
                                        ? 'bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-900 dark:text-zinc-100 font-medium' 
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}
                                `}
                            >
                                <div className="truncate pr-2 w-full whitespace-nowrap min-w-0">
                                    {session.title || labels.newChat}
                                </div>
                                <button
                                    onClick={(e) => onDeleteSession(e, session.id)}
                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded text-zinc-500 hover:text-red-500 transition-all shrink-0"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 mt-auto min-w-[260px] space-y-1">
                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                    >
                        <SettingsIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{labels.settings}</span>
                    </button>
                    <button
                        onClick={onToggleLanguage}
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                    >
                        <GlobeIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{labels.languageName}</span>
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                    >
                        {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{isDarkMode ? labels.lightMode : labels.darkMode}</span>
                    </button>
                </div>
            </div>
        </aside>
    </>
  );
};

export default Sidebar;
