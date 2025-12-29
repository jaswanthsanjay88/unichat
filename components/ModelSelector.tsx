import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AiModel, ModelOption } from '../types';

interface ModelSelectorProps {
  currentModel: AiModel;
  onSelect: (model: AiModel) => void;
  disabled?: boolean;
  models: ModelOption[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onSelect, disabled, models }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = models.find(m => m.value === currentModel) || models[0] || { label: 'Loading...', group: '...' };

  // Group models
  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelOption[]> = {};
    models.forEach(model => {
      if (!groups[model.group]) {
        groups[model.group] = [];
      }
      groups[model.group].push(model);
    });
    return groups;
  }, [models]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (models.length === 0) {
      return (
        <div className="w-full max-w-xs px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 text-sm font-mono flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin"></div>
            Loading models...
        </div>
      );
  }

  return (
    <div className="relative w-full max-w-xs" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-zinc-900 border border-zinc-800 rounded-lg 
          text-white font-mono text-sm tracking-wide transition-colors
          hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-white
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="truncate flex flex-col items-start">
             <span className="text-[10px] text-zinc-500 uppercase leading-none mb-1">{selectedOption.group}</span>
             <span>{selectedOption.label}</span>
        </span>
        <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-y-auto max-h-[60vh] animate-in fade-in zoom-in-95 duration-100">
          {Object.entries(groupedModels).map(([groupName, groupOptions]) => (
            <div key={groupName}>
                <div className="px-4 py-2 bg-zinc-900/90 text-[10px] font-bold text-zinc-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                    {groupName}
                </div>
                {(groupOptions as ModelOption[]).map((option) => (
                    <button
                    key={option.value}
                    onClick={() => {
                        onSelect(option.value);
                        setIsOpen(false);
                    }}
                    className={`
                        w-full text-left px-4 py-3 hover:bg-zinc-900 transition-colors
                        flex flex-col gap-1 border-b border-zinc-900/50 last:border-0
                        ${currentModel === option.value ? 'bg-zinc-900' : ''}
                    `}
                    >
                    <span className={`text-sm font-medium ${currentModel === option.value ? 'text-white' : 'text-zinc-300'}`}>
                        {option.label}
                    </span>
                    </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};