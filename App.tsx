
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import ModelSelector from './components/ModelSelector';
import SettingsModal from './components/SettingsModal';
import { MenuIcon, SparklesIcon, SidebarOpenIcon, PlusIcon, UndoIcon } from './components/ui/Icons';
import { MODELS, TRANSLATIONS, Language } from './constants';
import { geminiService } from './services/geminiService';
import { ChatSession, Message, Role, Attachment, ModelParameters } from './types';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
  // --- State ---
  // Initialize sessions from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('chat_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load sessions', e);
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  
  // Input State (Lifted)
  const [inputText, setInputText] = useState('');
  
  // UI State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Initialize Theme from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
        return localStorage.getItem('theme_mode') === 'dark';
    } catch { return false; }
  });

  // Initialize Language from localStorage
  const [language, setLanguage] = useState<Language>(() => {
    try {
        const saved = localStorage.getItem('app_language');
        return (saved === 'en' || saved === 'zh-TW') ? saved : 'zh-TW';
    } catch { return 'zh-TW'; }
  });

  const t = TRANSLATIONS[language];
  const [suggestions, setSuggestions] = useState<string[]>(t.suggestions);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevMessagesLength = useRef(0);

  // Derived State
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Localize Models
  const localizedModels = MODELS.map(m => ({
    ...m,
    description: (t.modelDescriptions as any)[m.id] || m.description
  }));

  // --- Effects ---

  // Persistence Effect for Sessions
  useEffect(() => {
    try {
      localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions (likely storage limit reached)', e);
    }
  }, [sessions]);

  // Persistence Effect for Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [isDarkMode]);

  // Persistence Effect for Language
  useEffect(() => {
    localStorage.setItem('app_language', language);
    setSuggestions(TRANSLATIONS[language].suggestions);
  }, [language]);

  // Scroll on Session Change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    prevMessagesLength.current = messages.length;
  }, [currentSessionId]);

  // Scroll on New Message
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // --- Handlers ---

  const handleToggleLanguage = () => {
    setLanguage(prev => prev === 'zh-TW' ? 'en' : 'zh-TW');
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: t.newChat,
      messages: [],
      modelId: selectedModelId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInputText('');
    
    // Generate new suggestions
    geminiService.generateSuggestions(language).then(newS => {
        if (newS.length > 0) setSuggestions(newS);
    });
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    // Sync the model selector with the session's last used model
    const session = sessions.find(s => s.id === id);
    if (session) {
        setSelectedModelId(session.modelId);
    }
    setInputText('');
  };

  const updateSession = (sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  };

  const handleClearContext = () => {
    if (currentSessionId) {
        updateSession(currentSessionId, s => {
             // Mark all currently visible (and non-excluded) messages as excluded
             // But simpler: just mark everything so far as excluded.
             // We also want to keep track that we did this, so we add a special divider message.
             
             const newMessages = s.messages.map(m => ({ ...m, excludeFromContext: true }));
             
             const dividerMessage: Message = {
                 id: generateId(),
                 role: Role.SYSTEM,
                 text: 'Context Cleared', // Placeholder, text comes from translation
                 timestamp: Date.now(),
                 isContextDivider: true,
                 excludeFromContext: true // Dividers are never sent to model
             };

             return {
                 ...s,
                 messages: [...newMessages, dividerMessage]
             };
        });
    }
  };

  const handleUndoClearContext = (dividerId: string) => {
      if (!currentSessionId) return;

      updateSession(currentSessionId, s => {
          const dividerIndex = s.messages.findIndex(m => m.id === dividerId);
          if (dividerIndex === -1) return s;

          const newMessages = [...s.messages];
          
          // Remove the divider
          newMessages.splice(dividerIndex, 1);

          // Iterate backwards from where the divider was
          // Restore messages until we hit the start OR another divider
          for (let i = dividerIndex - 1; i >= 0; i--) {
              if (newMessages[i].isContextDivider) {
                  break; // Stop at previous divider
              }
              // Restore context
              newMessages[i] = { ...newMessages[i], excludeFromContext: false };
          }

          return { ...s, messages: newMessages };
      });
  };

  const handleSend = async (text: string, attachments: Attachment[], params: ModelParameters) => {
    
    if (!currentSessionId) {
       handleNewChat();
    }
    
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
        const newSession: ChatSession = {
            id: generateId(),
            title: t.newChat,
            messages: [],
            modelId: selectedModelId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        activeSessionId = newSession.id;
    }

    // Check if this is the first message to generate title
    const currentSessionObj = sessions.find(s => s.id === activeSessionId);
    const isFirstMessage = !currentSessionObj || currentSessionObj.messages.length === 0;

    const userMsg: Message = {
      id: generateId(),
      role: Role.USER,
      text: text,
      timestamp: Date.now(),
      attachments: attachments
    };

    // Optimistic update for User Message
    updateSession(activeSessionId!, session => ({
      ...session,
      modelId: selectedModelId, 
      messages: [...session.messages, userMsg],
      updatedAt: Date.now()
    }));

    // Trigger Title Generation in Background if first message
    if (isFirstMessage) {
        geminiService.generateTitle(text)
            .then(title => {
                updateSession(activeSessionId!, s => ({ ...s, title }));
            })
            .catch(() => { /* Ignore title generation errors */ });
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const currentSessionLatest = sessions.find(s => s.id === activeSessionId);
      const msgs = currentSessionLatest ? currentSessionLatest.messages : [];
      const historyForCall = msgs.some(m => m.id === userMsg.id) ? msgs : [...msgs, userMsg];

      const botMsgId = generateId();
      const botMsg: Message = {
        id: botMsgId,
        role: Role.MODEL,
        text: '',
        timestamp: Date.now(),
        modelId: selectedModelId
      };

      updateSession(activeSessionId!, session => ({
        ...session,
        messages: [...session.messages, botMsg]
      }));

      let fullResponse = "";
      
      const stream = geminiService.sendMessageStream(
          historyForCall, 
          selectedModelId, 
          params,
          abortControllerRef.current.signal
      );

      for await (const chunk of stream) {
        fullResponse = chunk; 
        const thinkingMarker = "*Thinking...*";
        const parts = fullResponse.split(thinkingMarker);
        let validResponse = fullResponse;
        
        if (parts.length > 2) {
             validResponse = thinkingMarker + parts[parts.length - 1];
        }
        
        updateSession(activeSessionId!, session => ({
          ...session,
          messages: session.messages.map(m => 
            m.id === botMsgId ? { ...m, text: validResponse } : m
          )
        }));
      }

      // Fetch Usage after stream completes
      // Short delay to ensure API has processed usage
      setTimeout(async () => {
          const usage = await geminiService.getLatestUsage();
          if (usage) {
              updateSession(activeSessionId!, session => ({
                  ...session,
                  messages: session.messages.map(m => 
                    m.id === botMsgId ? { ...m, usage: usage } : m
                  )
              }));
          }
      }, 2000);

    } catch (error: any) {
      if (error.name === 'AbortError') {
          // Stopped by user
      } else {
          console.error(error);
          const errorMessage = error?.message ? `API Error: ${error.message}` : t.error;
          
          const errorMsg: Message = {
            id: generateId(),
            role: Role.MODEL,
            text: errorMessage,
            timestamp: Date.now(),
            isError: true,
            modelId: selectedModelId
          };
          updateSession(activeSessionId!, session => ({
            ...session,
            messages: [...session.messages, errorMsg]
          }));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // --- Action Handlers ---

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleEdit = (msg: Message) => {
    if (!currentSessionId) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const index = session.messages.findIndex(m => m.id === msg.id);
    if (index === -1) return;
    setInputText(msg.text);
    updateSession(currentSessionId, s => ({
        ...s,
        messages: s.messages.slice(0, index)
    }));
  };

  const handleRegenerate = (msg: Message) => {
    if (!currentSessionId || isLoading) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const index = session.messages.findIndex(m => m.id === msg.id);
    if (index === -1) return;

    const prevMsg = session.messages[index - 1];
    if (prevMsg && prevMsg.role === Role.USER) {
        updateSession(currentSessionId, s => ({
            ...s,
            messages: s.messages.slice(0, index - 1)
        }));
        // Use default params for regen for now, or could store last params in session
        const defaultParams: ModelParameters = { webSearch: false, thinkingLevel: 'low' }; 
        handleSend(prevMsg.text, prevMsg.attachments || [], defaultParams); 
    }
  };

  // --- Render ---

  return (
    <div className="flex w-full bg-white dark:bg-[#27272a] transition-colors duration-300 font-sans min-h-screen md:h-[100dvh] md:overflow-hidden">
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        labels={t.settingsModal}
      />

      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        labels={t}
        onToggleLanguage={handleToggleLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col relative w-full md:h-full md:min-w-0">
        
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-4 z-30 sticky top-0 bg-white/85 dark:bg-[#27272a]/85 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-700/50">
          <div className="flex items-center gap-2">
             <button 
                className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                onClick={() => setIsMobileSidebarOpen(true)}
             >
                <MenuIcon className="w-6 h-6" />
             </button>

             <button
                className={`hidden md:flex p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all ${isSidebarCollapsed ? 'opacity-100' : 'opacity-0 w-0 p-0 overflow-hidden'}`}
                onClick={() => setIsSidebarCollapsed(false)}
                title="Open Sidebar"
             >
                <SidebarOpenIcon className="w-5 h-5" />
             </button>

             <ModelSelector 
                models={localizedModels} 
                selectedModelId={selectedModelId} 
                onSelectModel={setSelectedModelId}
                disabled={isLoading} 
             />
          </div>

           <button
             onClick={handleNewChat}
             className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
           >
             <PlusIcon className="w-6 h-6" />
           </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 p-4 md:p-0 pb-36 md:pb-0 md:overflow-y-auto md:scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in min-h-[50vh]">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-6 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">{t.howCanIHelp}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-lg w-full">
                  {suggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSend(suggestion, [], { webSearch: false })}
                        className="p-3 text-sm text-left rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                      >
                          {suggestion}
                      </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 md:py-10 space-y-2 min-h-full flex flex-col justify-start">
               {messages.map((msg, index) => {
                  if (msg.isContextDivider) {
                    return (
                        <div key={msg.id} className="relative flex items-center py-6 animate-fade-in">
                            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
                            <div className="flex-shrink-0 mx-4 flex items-center gap-3">
                                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                                    {t.contextCleared}
                                </span>
                                <button
                                    onClick={() => handleUndoClearContext(msg.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors"
                                >
                                    <UndoIcon className="w-3 h-3" />
                                    <span>{t.undo}</span>
                                </button>
                            </div>
                            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
                        </div>
                    );
                  }

                  return (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        modelId={currentSession?.modelId} 
                        userLabel={t.you}
                        isLast={index === messages.length - 1}
                        isLoading={isLoading}
                        onCopy={handleCopy}
                        onEdit={handleEdit}
                        onRegenerate={handleRegenerate}
                        onStop={handleStop}
                        labels={t}
                    />
                  );
               })}
               
               <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 z-20 md:static md:z-auto bg-white/95 dark:bg-[#27272a]/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#27272a]/60 border-t border-zinc-200 dark:border-zinc-700 md:border-none pb-[env(safe-area-inset-bottom)]">
           <InputArea 
             onSend={handleSend} 
             onClearContext={handleClearContext}
             isLoading={isLoading} 
             placeholderText={t.typeMessage}
             disclaimerText={t.aiDisclaimer}
             uploadTooltip={t.uploadTooltip}
             inputText={inputText}
             setInputText={setInputText}
             selectedModelId={selectedModelId}
             language={language}
           />
        </div>

      </main>
    </div>
  );
};

export default App;
