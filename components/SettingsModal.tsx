
import React, { useState, useEffect } from 'react';
import { XIcon } from './ui/Icons';
import { TRANSLATIONS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: typeof TRANSLATIONS['zh-TW']['settingsModal'];
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, labels }) => {
  const [systemInstruction, setSystemInstruction] = useState('');
  const [usePoe, setUsePoe] = useState(false);
  const [poeApiKey, setPoeApiKey] = useState('');
  
  // Initialize from localStorage whenever isOpen becomes true
  useEffect(() => {
    if (isOpen) {
      setSystemInstruction(localStorage.getItem('gemini_system_instruction') || '');
      // Explicitly check for 'true' string
      const storedUsePoe = localStorage.getItem('use_poe_api') === 'true';
      setUsePoe(storedUsePoe);
      
      const storedKey = localStorage.getItem('poe_api_key');
      setPoeApiKey(storedKey || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('gemini_system_instruction', systemInstruction.trim());
    localStorage.setItem('use_poe_api', String(usePoe));
    
    // Sanitize API Key: Remove whitespace and non-ASCII chars before saving
    const sanitizedKey = poeApiKey.trim().replace(/[^\x00-\x7F]/g, "");
    localStorage.setItem('poe_api_key', sanitizedKey);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#27272a] rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-slide-in transform transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {labels.title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
            
            {/* System Instruction Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {labels.sysInstructionLabel}
                </label>
                <textarea 
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500 transition-shadow resize-none"
                />
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-700 pt-4 space-y-4">
                {/* Use Poe Switch */}
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer" htmlFor="usePoe">
                        {labels.usePoeLabel}
                    </label>
                    <button
                        id="usePoe"
                        role="switch"
                        aria-checked={usePoe}
                        onClick={() => setUsePoe(!usePoe)}
                        className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500
                            ${usePoe ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}
                        `}
                    >
                        <span
                            className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${usePoe ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </div>

                {/* Poe API Key Input */}
                {usePoe && (
                    <div className="space-y-2 animate-fade-in">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {labels.poeApiKeyLabel}
                        </label>
                        <input 
                            type="password"
                            value={poeApiKey}
                            onChange={(e) => setPoeApiKey(e.target.value)}
                            placeholder={labels.poeApiKeyPlaceholder}
                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500 transition-shadow"
                            autoComplete="off"
                        />
                    </div>
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-700 flex justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-800/50">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
                {labels.cancel}
            </button>
            <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity"
            >
                {labels.save}
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
