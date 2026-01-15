import React from 'react';
import { Icon } from '../components/Icon';

interface DashboardProps {
  onNewDocument: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewDocument }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-4">
           <div className="bg-blue-600 p-3 rounded-xl inline-flex">
            <Icon name="file-text" size={40} className="text-white" />
           </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Custom Letter Generator</h1>
          <p className="text-slate-500">Create professional, free-form documents instantly. No templates, just your creativity.</p>
        </div>

        <button 
          onClick={onNewDocument}
          className="w-full group bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
        >
          <span className="bg-white/20 p-1 rounded-md">
            <Icon name="plus" size={20} />
          </span>
          Create New Document
        </button>

        <div className="pt-8 border-t border-slate-200">
           <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">Features</p>
           <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="flex flex-col items-center gap-2">
                <span className="p-2 bg-white rounded-lg shadow-sm"><Icon name="align-left" className="text-blue-500" /></span>
                <span>Drag & Drop</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <span className="p-2 bg-white rounded-lg shadow-sm"><Icon name="image" className="text-purple-500" /></span>
                <span>Images</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <span className="p-2 bg-white rounded-lg shadow-sm"><Icon name="download" className="text-green-500" /></span>
                <span>PDF Export</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};