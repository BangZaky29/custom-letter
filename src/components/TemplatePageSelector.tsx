
import React from 'react';
import { Icon } from './Icon';

interface TemplatePageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  pageCount: number;
  onSelectPage: (pageIndex: number) => void;
  templateName: string;
}

export const TemplatePageSelector: React.FC<TemplatePageSelectorProps> = ({
  isOpen,
  onClose,
  pageCount,
  onSelectPage,
  templateName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Import Template</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon name="x" size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-600 mb-6">
          Where would you like to place the <strong>{templateName}</strong>?
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {Array.from({ length: pageCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPage(idx)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Page {idx + 1}</span>
              <Icon name="chevron-left" className="rotate-180 text-slate-300 group-hover:text-blue-500" size={16} />
            </button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
             <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">Cancel</button>
        </div>
      </div>
    </div>
  );
};
