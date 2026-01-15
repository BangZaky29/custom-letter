import React from 'react';
import { useDocument } from '../store/documentStore';
import { PaperSize } from '../types';
import { PAPER_DIMENSIONS } from '../constants/paperSizes';

export const PageSettings: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useDocument();
  const { pageConfig } = state;

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-20 flex flex-col animate-slide-up md:animate-none">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="font-semibold text-slate-700">Page Settings</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
           ×
        </button>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto">
        {/* Paper Size */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paper Size</label>
          <div className="grid grid-cols-2 gap-2">
            {(['A4', 'A3', 'A5', 'A6'] as PaperSize[]).map((size) => (
              <button
                key={size}
                onClick={() => dispatch({ type: 'SET_PAGE_SIZE', payload: { size } })}
                className={`py-2 px-3 border rounded text-sm transition-colors ${
                  pageConfig.size === size 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' 
                    : 'border-slate-200 hover:border-blue-300 text-slate-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div className="space-y-3">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orientation</label>
           <div className="flex bg-slate-100 p-1 rounded-lg">
             <button
                onClick={() => dispatch({ type: 'SET_ORIENTATION', payload: 'portrait' })}
                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                  pageConfig.orientation === 'portrait' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-slate-500'
                }`}
             >
               Portrait
             </button>
             <button
                onClick={() => dispatch({ type: 'SET_ORIENTATION', payload: 'landscape' })}
                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                  pageConfig.orientation === 'landscape' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-slate-500'
                }`}
             >
               Landscape
             </button>
           </div>
        </div>

        {/* Margins */}
        <div className="space-y-3">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margins (mm)</label>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs text-slate-400 mb-1 block">Top</label>
               <input 
                 type="number" 
                 className="w-full border border-slate-200 rounded p-2 text-sm focus:border-blue-500 outline-none"
                 value={pageConfig.margins.top}
                 onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { top: Number(e.target.value) } })}
               />
             </div>
             <div>
               <label className="text-xs text-slate-400 mb-1 block">Bottom</label>
               <input 
                 type="number" 
                 className="w-full border border-slate-200 rounded p-2 text-sm focus:border-blue-500 outline-none"
                 value={pageConfig.margins.bottom}
                 onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { bottom: Number(e.target.value) } })}
               />
             </div>
             <div>
               <label className="text-xs text-slate-400 mb-1 block">Left</label>
               <input 
                 type="number" 
                 className="w-full border border-slate-200 rounded p-2 text-sm focus:border-blue-500 outline-none"
                 value={pageConfig.margins.left}
                 onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { left: Number(e.target.value) } })}
               />
             </div>
             <div>
               <label className="text-xs text-slate-400 mb-1 block">Right</label>
               <input 
                 type="number" 
                 className="w-full border border-slate-200 rounded p-2 text-sm focus:border-blue-500 outline-none"
                 value={pageConfig.margins.right}
                 onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { right: Number(e.target.value) } })}
               />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};