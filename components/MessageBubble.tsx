
import React, { useState } from 'react';
import { Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { BotIcon, UserIcon, FileIcon, CopyIcon, EditIcon, RefreshIcon, StopIcon, CheckIcon } from './ui/Icons';
import { MODELS, TRANSLATIONS } from '../constants';

interface MessageBubbleProps {
  message: Message;
  modelId?: string; // Fallback session model ID
  userLabel: string;
  isLast: boolean;
  isLoading: boolean;
  onCopy: (text: string) => void;
  onEdit: (message: Message) => void;
  onRegenerate: (message: Message) => void;
  onStop: () => void;
  labels: typeof TRANSLATIONS['zh-TW']; // New prop for localization
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  modelId, 
  userLabel, 
  isLast, 
  isLoading,
  onCopy,
  onEdit,
  onRegenerate,
  onStop,
  labels
}) => {
  const isUser = message.role === Role.USER;
  // Use message specific modelId if available, otherwise use session modelId
  const activeModelId = message.modelId || modelId;
  const modelName = MODELS.find(m => m.id === activeModelId)?.name || 'AI';
  
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    onCopy(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Determine if we should show the typing indicator
  // Show if: It's a model message, it's the last one, it's loading, AND the text is empty/whitespace.
  const isTyping = !isUser && isLast && isLoading && !message.text.trim();

  // Construct label object for MarkdownRenderer
  const markdownLabels = {
      thinking: labels.thinkingProcess,
      copy: labels.copy,
      copied: labels.copied
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group mb-2`}>
      <div 
        className={`
          flex gap-3 md:gap-4 max-w-3xl w-full p-2
          ${isUser ? 'flex-row-reverse' : 'flex-row'} 
        `}
      >
        {/* Avatar */}
        <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border mt-1
            ${isUser 
                ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'}
        `}>
          {isUser ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
        </div>
        
        {/* Content Container */}
        <div className={`flex-1 min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Label */}
          <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {isUser ? userLabel : `Orbital (${modelName})`}
            </span>
          </div>
          
          {/* The Bubble */}
          <div className={`
             text-base leading-7 relative max-w-full break-words
             ${isUser 
                ? 'bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-sm text-zinc-900 dark:text-zinc-100 text-left' 
                : 'text-zinc-800 dark:text-zinc-200 pr-4 w-full' 
             }
          `}>
             
             {/* Attachments */}
             {message.attachments && message.attachments.length > 0 && (
                 <div className={`flex flex-wrap gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                     {message.attachments.map((att, idx) => (
                         att.mimeType.startsWith('image/') ? (
                             <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" className="max-w-xs rounded-lg border border-zinc-200 dark:border-zinc-700" />
                         ) : (
                             <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isUser ? 'bg-white dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                 <FileIcon className="w-4 h-4" />
                                 <span>{att.name}</span>
                             </div>
                         )
                     ))}
                 </div>
             )}

             {/* Content */}
             {isTyping ? (
                 <div className="flex items-center gap-1 h-7">
                     <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                     <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                 </div>
             ) : (
                isUser ? (
                    <p className="whitespace-pre-wrap font-sans break-words overflow-hidden">{message.text}</p>
                ) : (
                    <div className="min-w-0 overflow-hidden">
                        <MarkdownRenderer content={message.text} labels={markdownLabels} />
                    </div>
                )
             )}
          </div>

          {/* Footer Metadata & Action Bar */}
          {!isTyping && (
            <div className={`
                flex items-center flex-wrap gap-x-3 gap-y-1 mt-1
                ${isUser ? 'flex-row-reverse' : 'flex-row'}
            `}>
                {/* Actions */}
                <div className={`flex items-center gap-1 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100`}>
                    <button 
                        onClick={handleCopy}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={labels.copy}
                    >
                        {isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>

                    {isUser ? (
                        <button 
                            onClick={() => onEdit(message)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit"
                        >
                            <EditIcon className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <>
                            {isLoading && isLast ? (
                                <button 
                                    onClick={onStop}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Stop"
                                >
                                    <StopIcon className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => onRegenerate(message)}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Regenerate"
                                >
                                    <RefreshIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Usage Info */}
                {!isUser && message.usage && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium px-1">
                        <span>{labels.usageConsumed} {message.usage.points} {labels.usagePoints}</span>
                        <span>•</span>
                        <span>{new Date(message.usage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="max-w-[100px] truncate">{message.usage.appName}</span>
                    </div>
                )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
