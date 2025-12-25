
import React, { useRef, useEffect, useState } from 'react';
import { SendIcon, PaperclipIcon, SlidersIcon, BroomIcon } from './ui/Icons';
import { Attachment, ModelParameters } from '../types';
import { MODELS, TRANSLATIONS, ASPECT_RATIOS, Language, TTS_VOICES, TTS_EMOTIONS, TTS_LANGUAGES, TTS_EMOTION_MAP, TTS_LANGUAGE_MAP, TTS_VOICE_MAP } from '../constants';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[], params: ModelParameters) => void;
  onClearContext: () => void;
  isLoading: boolean;
  placeholderText: string;
  disclaimerText: string;
  uploadTooltip: string;
  
  // Lifted State
  inputText: string;
  setInputText: (text: string) => void;
  selectedModelId: string;
  language: Language;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  onClearContext,
  isLoading, 
  placeholderText, 
  disclaimerText,
  uploadTooltip,
  inputText,
  setInputText,
  selectedModelId,
  language
}) => {
  const t = TRANSLATIONS[language];
  const currentModel = MODELS.find(m => m.id === selectedModelId);
  
  // Params State
  const [showSettings, setShowSettings] = useState(false);
  const [params, setParams] = useState<ModelParameters>({
      webSearch: false,
      thinkingLevel: 'low',
      imageSize: undefined,
      aspectRatio: undefined,
      imageOnly: false,
      // TTS Defaults
      ttsVoice: 'Wise_Woman',
      ttsEmotion: 'None',
      ttsLanguage: 'auto',
      ttsSpeed: 1,
      ttsVolume: 1, 
      ttsPitch: 1,
      ttsHd: false
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for click outside logic
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate scrollHeight (shrinking)
      textareaRef.current.style.height = 'auto';
      
      const maxHeight = 200;
      const scrollHeight = textareaRef.current.scrollHeight;
      
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      
      // Fix: Force scrollTop to 0 to prevent placeholder from shifting due to minor scroll offsets
      textareaRef.current.scrollTop = 0;

      // Manage overflow to prevent "scroll when empty" issues
      if (scrollHeight > maxHeight) {
          textareaRef.current.style.overflowY = 'auto';
      } else {
          textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  // Optimized Interaction Logic: Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Logic: Close ONLY if click is outside the settings panel AND outside the toggle button
      if (
        showSettings &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  // Reset/Adjust params when model changes
  useEffect(() => {
    setParams(prev => ({
        ...prev,
        // Reset unsupported params if needed, or keep defaults
        thinkingLevel: currentModel?.supportsThinking ? prev.thinkingLevel || 'low' : undefined,
        webSearch: prev.webSearch // Keep web search pref
    }));
  }, [selectedModelId]);

  const handleSend = () => {
    if ((inputText.trim() || attachments.length > 0) && !isLoading) {
      onSend(inputText, attachments, params);
      setInputText('');
      setAttachments([]);
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.overflowY = 'hidden';
      }
      setShowSettings(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setAttachments(prev => [...prev, {
                name: file.name,
                mimeType: file.type,
                data: base64String
            }]);
        };
        reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-3 pb-2 md:px-4 md:pb-6 pt-2 relative">
      
      {/* Settings Popover */}
      {showSettings && (
          <div ref={settingsRef} className="absolute bottom-full left-3 right-3 md:left-4 md:right-auto md:w-80 mb-2 bg-white dark:bg-[#27272a] rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl p-4 z-50 animate-fade-in max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.params.title}</h3>
                  <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">&times;</button>
              </div>
              
              <div className="space-y-4">
                  
                  {/* Web Search Toggle */}
                  <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.webSearch}</label>
                      <button 
                        onClick={() => setParams(p => ({...p, webSearch: !p.webSearch}))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${params.webSearch ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                      >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${params.webSearch ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                      </button>
                  </div>

                  {/* Thinking Level */}
                  {currentModel?.supportsThinking && (
                      <div className="space-y-1.5">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.thinkingLevel}</label>
                          <select 
                            value={params.thinkingLevel}
                            onChange={(e) => setParams(p => ({...p, thinkingLevel: e.target.value as any}))}
                            className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                          >
                              {currentModel.allowedThinkingLevels?.map(level => (
                                  <option key={level} value={level}>{t.params.levels[level]}</option>
                              ))}
                          </select>
                      </div>
                  )}

                  {/* Image Options */}
                  {currentModel?.supportsImageOptions && (
                      <>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.imageSize}</label>
                            <select 
                                value={params.imageSize || ''}
                                onChange={(e) => setParams(p => ({...p, imageSize: e.target.value as any || undefined}))}
                                className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                            >
                                <option value="">{t.params.sizes.default}</option>
                                <option value="1K">{t.params.sizes['1K']}</option>
                                <option value="2K">{t.params.sizes['2K']}</option>
                                <option value="4K">{t.params.sizes['4K']}</option>
                            </select>
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.aspectRatio}</label>
                            <select 
                                value={params.aspectRatio || ''}
                                onChange={(e) => setParams(p => ({...p, aspectRatio: e.target.value || undefined}))}
                                className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                            >
                                <option value="">{t.params.ratios.default}</option>
                                {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.imageOnly}</label>
                            <button 
                                onClick={() => setParams(p => ({...p, imageOnly: !p.imageOnly}))}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${params.imageOnly ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${params.imageOnly ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                            </button>
                        </div>
                      </>
                  )}

                  {/* TTS Options */}
                  {currentModel?.supportsTTS && (
                      <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
                        <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t.params.ttsSection}</div>

                        {/* Voice */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.voice}</label>
                            <select 
                                value={params.ttsVoice}
                                onChange={(e) => setParams(p => ({...p, ttsVoice: e.target.value}))}
                                className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                            >
                                {TTS_VOICES.map(v => <option key={v} value={v}>{TTS_VOICE_MAP[v] || v.replace(/_/g, ' ')}</option>)}
                            </select>
                        </div>

                        {/* Emotion */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.emotion}</label>
                            <select 
                                value={params.ttsEmotion}
                                onChange={(e) => setParams(p => ({...p, ttsEmotion: e.target.value}))}
                                className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                            >
                                {TTS_EMOTIONS.map(e => <option key={e} value={e}>{TTS_EMOTION_MAP[e] || e}</option>)}
                            </select>
                        </div>

                        {/* Language */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.language}</label>
                            <select 
                                value={params.ttsLanguage}
                                onChange={(e) => setParams(p => ({...p, ttsLanguage: e.target.value}))}
                                className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                            >
                                {TTS_LANGUAGES.map(l => <option key={l} value={l}>{TTS_LANGUAGE_MAP[l] || l.replace(',', ', ')}</option>)}
                            </select>
                        </div>

                        {/* Sliders: Speed, Volume, Pitch */}
                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-xs">
                                <label className="font-medium text-zinc-600 dark:text-zinc-400">{t.params.speed}</label>
                                <span className="font-mono text-zinc-500">{params.ttsSpeed}x</span>
                             </div>
                             <input 
                                type="range" min="0.5" max="2" step="0.1" 
                                value={params.ttsSpeed} 
                                onChange={(e) => setParams(p => ({...p, ttsSpeed: parseFloat(e.target.value)}))}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                             />
                        </div>

                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-xs">
                                <label className="font-medium text-zinc-600 dark:text-zinc-400">{t.params.volume}</label>
                                <span className="font-mono text-zinc-500">{params.ttsVolume}</span>
                             </div>
                             <input 
                                type="range" min="0" max="10" step="1" 
                                value={params.ttsVolume} 
                                onChange={(e) => setParams(p => ({...p, ttsVolume: parseInt(e.target.value)}))}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                             />
                        </div>

                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-xs">
                                <label className="font-medium text-zinc-600 dark:text-zinc-400">{t.params.pitch}</label>
                                <span className="font-mono text-zinc-500">{params.ttsPitch}</span>
                             </div>
                             <input 
                                type="range" min="-12" max="12" step="1" 
                                value={params.ttsPitch} 
                                onChange={(e) => setParams(p => ({...p, ttsPitch: parseInt(e.target.value)}))}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                             />
                        </div>

                        {/* HD Switch */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.params.hd}</label>
                            <button 
                                onClick={() => setParams(p => ({...p, ttsHd: !p.ttsHd}))}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${params.ttsHd ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${params.ttsHd ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                            </button>
                        </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="relative flex flex-col bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl shadow-sm focus-within:shadow-md transition-all">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-zinc-100 dark:border-zinc-700/50">
                {attachments.map((att, i) => (
                    <div key={i} className="relative group flex-shrink-0">
                        {att.mimeType.startsWith('image/') ? (
                             <img src={`data:${att.mimeType};base64,${att.data}`} className="h-16 w-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700" alt="preview" />
                        ) : (
                             <div className="h-16 w-16 flex items-center justify-center bg-zinc-100 dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600 text-xs text-center break-all p-1">
                                 {att.name.slice(0, 10)}...
                             </div>
                        )}
                        <button 
                            onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex items-end gap-2 p-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/*,application/pdf,text/plain"
            />
            
            <div className="flex items-center gap-1 mb-1.5 ml-1">
                {/* Clear Context Button */}
                <button 
                    onClick={onClearContext}
                    className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-full transition-colors"
                    title={t.contextCleared}
                >
                    <BroomIcon className="w-5 h-5" />
                </button>

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-full transition-colors"
                    title={uploadTooltip}
                >
                    <PaperclipIcon className="w-5 h-5" />
                </button>

                <button 
                    ref={settingsButtonRef}
                    onClick={() => setShowSettings(prev => !prev)}
                    className={`relative p-2 rounded-full transition-colors ${showSettings || params.webSearch ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-700/50' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'}`}
                    title={t.paramsTooltip}
                >
                    <SlidersIcon className="w-5 h-5" />
                    {/* Status Dot */}
                    {(params.webSearch || (currentModel?.supportsThinking && params.thinkingLevel !== 'low') || (currentModel?.supportsTTS)) && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-zinc-800 box-content shadow-sm"></span>
                    )}
                </button>
            </div>

            <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent border-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none focus:ring-0 focus:outline-none py-3 px-2 max-h-[200px] scrollbar-hide text-base overflow-hidden"
            />
            
            <div className="mb-1.5 mr-1">
                <button
                onClick={handleSend}
                disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
                className={`
                    p-2 rounded-full flex items-center justify-center transition-all duration-200
                    ${(inputText.trim() || attachments.length > 0) && !isLoading 
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90' 
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-300 dark:text-zinc-500 cursor-not-allowed'}
                `}
                >
                <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {disclaimerText}
        </p>
      </div>
    </div>
  );
};

export default InputArea;
