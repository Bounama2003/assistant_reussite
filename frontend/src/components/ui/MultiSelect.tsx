import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelect({ options, selected, onChange, placeholder = 'Sélectionner...', label }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const remove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm text-nuit-300 mb-1.5">{label}</label>}
      <div
        className="input-field min-h-[2.75rem] py-2 cursor-pointer flex flex-wrap items-center gap-1.5"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 ? (
          <span className="text-nuit-400 text-sm">{placeholder}</span>
        ) : (
          selected.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 bg-emeraude-500/10 text-emeraude-400 text-xs px-2 py-1 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                {opt?.label || v}
                <button onClick={() => remove(v)} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </span>
            );
          })
        )}
        <ChevronDown size={14} className="text-nuit-400 ml-auto" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full glass rounded-lg max-h-48 overflow-y-auto shadow-xl">
          {options.length === 0 ? (
            <p className="text-sm text-nuit-400 p-3">Aucune option</p>
          ) : (
            options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                    isSelected ? 'bg-emeraude-500/10 text-emeraude-400' : 'text-nuit-200 hover:bg-white/5'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-emeraude-500 border-emeraude-500' : 'border-nuit-400'
                  }`}>
                    {isSelected && <span className="text-nuit-900 text-[10px] font-bold">✓</span>}
                  </span>
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
