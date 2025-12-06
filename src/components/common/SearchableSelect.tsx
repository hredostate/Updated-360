
import React, { useState, useEffect, useRef, useMemo } from 'react';

interface SearchableSelectProps {
  options: { value: string | number; label: string }[];
  value: string | number | null | (string | number)[]; // Support array for multi
  onChange: (value: string | number | (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  multi?: boolean; // New prop
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Select...', disabled = false, multi = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle single vs multi value display
  const displayValue = useMemo(() => {
    if (multi && Array.isArray(value)) {
        if (value.length === 0) return placeholder;
        if (value.length === 1) return options.find(o => o.value === value[0])?.label || placeholder;
        return `${value.length} selected`;
    }
    return options.find(option => option.value === value)?.label || placeholder;
  }, [options, value, placeholder, multi]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  ), [options, searchTerm]);

  const handleSelect = (optionValue: string | number) => {
    if (multi) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValue = currentValues.includes(optionValue)
            ? currentValues.filter(v => v !== optionValue)
            : [...currentValues, optionValue];
        onChange(newValue);
        // Don't close on multi select
    } else {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    }
  };

  const commonClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-left text-base rounded-xl border border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm truncate";
  const disabledClasses = "disabled:bg-slate-200/50 dark:disabled:bg-slate-700/50 cursor-not-allowed";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${commonClasses} ${disabled ? disabledClasses : ''}`}
        disabled={disabled}
      >
        <span className={value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}>
          {displayValue}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.12 1.004l-3.25 3.5a.75.75 0 01-1.12 0l-3.25-3.5a.75.75 0 01.06-1.044z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white dark:bg-slate-800 shadow-lg border border-slate-300 dark:border-slate-700 max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border-slate-300 bg-white/80 dark:border-slate-600 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ul className="overflow-auto flex-1">
            {filteredOptions.length > 0 ? filteredOptions.map(option => {
                const isSelected = multi && Array.isArray(value) ? value.includes(option.value) : value === option.value;
                return (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 text-sm ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    <div className="flex items-center">
                        {multi && (
                            <input type="checkbox" checked={isSelected} readOnly className="mr-2 h-4 w-4 rounded border-slate-300 text-blue-600 pointer-events-none" />
                        )}
                        <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                    </div>
                  </li>
                )
            }) : (
              <li className="cursor-default select-none relative py-2 px-3 text-slate-500 text-sm">
                No options found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
