import React, { useState, useRef, useEffect } from 'react';
import { ModelConfig } from '../types';
import { ChevronDownIcon, SparklesIcon } from './ui/Icons';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModelId, onSelectModel, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="text-zinc-900 dark:text-zinc-100">{selectedModel.name}</span>
        <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in">
          <div className="p-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left p-2.5 rounded-md flex items-start gap-3 transition-colors
                  ${selectedModelId === model.id ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                `}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{model.name}</span>
                    {model.isPro && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold">PRO</span>}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{model.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
