import React, { useState } from 'react';
import { useDocument } from '../store/documentStore';
import { CanvasArea } from '../editor/CanvasArea';
import { Toolbar } from '../editor/Toolbar';
import { PageSettings } from '../editor/PageSettings';
import { Icon } from '../components/Icon';
import { downloadPDF, printPreview } from '../utils/downloadPDF';
import { downloadWORD } from '../utils/downloadWORD';
import { ElementType } from '../types';

export const Editor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, dispatch } = useDocument();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'RENAME_DOCUMENT', payload: e.target.value });
  };

  const handleAddElement = (type: ElementType) => {
    if (type === 'text') {
      dispatch({
        type: 'ADD_ELEMENT',
        payload: {
          type: 'text',
          x: 20,
          y: 20,
          width: 80, // mm
          height: 0, // auto
          content: 'Double click to edit text...',
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#000000',
          },
        },
      });
    } else if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            dispatch({
              type: 'ADD_ELEMENT',
              payload: {
                type: 'image',
                x: 40,
                y: 40,
                width: 60,
                height: 40, 
                content: event.target?.result as string,
              }
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleAction = async (action: 'pdf' | 'word' | 'print') => {
    setShowExportMenu(false);
    
    if (action === 'print') {
        printPreview();
        return;
    }

    setNotification(action === 'pdf' ? 'Generating PDF...' : 'Generating Word Doc...');
    
    // Clean filename
    const safeTitle = state.title.trim() || 'document';
    const filenameBase = safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Allow UI to update before heavy task
    setTimeout(async () => {
      try {
        if (action === 'pdf') {
          await downloadPDF(`${filenameBase}.pdf`);
        } else if (action === 'word') {
          await downloadWORD(state, `${filenameBase}.docx`);
        }
        setNotification('File saved successfully');
      } catch (e) {
        setNotification('Error saving file');
      }
      setTimeout(() => setNotification(null), 3000);
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      
      {/* Top Bar Container: High Z-Index to stay above canvas and sidebar */}
      <div className="relative z-50 flex flex-col bg-white shadow-sm border-b border-slate-200">
        
        {/* Main Header / Title Bar */}
        <header className="h-14 md:h-16 flex justify-between items-center px-4 md:px-6 relative">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <Icon name="chevron-left" />
            </button>
            <div className="flex flex-col justify-center">
              <input 
                type="text" 
                value={state.title}
                onChange={handleTitleChange}
                className="font-semibold text-slate-700 text-sm md:text-base leading-tight bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-1.5 -ml-1.5 py-0.5 outline-none transition-all w-48 md:w-64"
                placeholder="Untitled Document"
              />
              <span className="text-[10px] text-slate-400 hidden md:block px-0.5">Click to rename</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Add Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => handleAddElement('text')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
              >
                <Icon name="file-text" size={16} />
                <span>Text</span>
              </button>

              <button 
                onClick={() => handleAddElement('image')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
              >
                <Icon name="image" size={16} />
                <span>Image</span>
              </button>
              <div className="h-5 w-px bg-slate-200 mx-1"></div>
            </div>

            {/* Settings Toggle */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg transition-all ${isSettingsOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Page Settings"
            >
              <Icon name="settings" />
            </button>

            {/* Export Button - Fixed Z-Index Context */}
            <div className="relative z-50">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-200 transition-all text-sm font-medium"
              >
                <Icon name="download" size={18} />
                <span className="hidden md:inline">Export</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-fade-in origin-top-right ring-1 ring-black/5 flex flex-col">
                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">File Options</p>
                  </div>
                  
                  {/* Print Preview */}
                   <button 
                    onClick={() => handleAction('print')}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-3 transition-colors"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded bg-slate-100 text-slate-600">
                      <Icon name="printer" size={16} />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">Print Preview</span>
                      <span className="text-[10px] text-slate-400">View & Print</span>
                    </div>
                  </button>

                  <div className="h-px bg-slate-100 my-1 mx-4" />

                  {/* PDF Download */}
                  <button 
                    onClick={() => handleAction('pdf')}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-3 transition-colors"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-600">
                      <Icon name="file-text" size={16} />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">Download PDF</span>
                      <span className="text-[10px] text-slate-400">Direct file download</span>
                    </div>
                  </button>

                  {/* Word Download */}
                  <button 
                    onClick={() => handleAction('word')}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-3 transition-colors"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600">
                      <Icon name="file-text" size={16} />
                    </span>
                     <div className="flex flex-col">
                      <span className="font-medium">Download Word</span>
                      <span className="text-[10px] text-slate-400">Editable .docx</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Integrated Toolbar Area (Ribbon) */}
        <div className="w-full bg-white z-40 relative">
          <Toolbar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-0">
        <div className="flex-1 flex flex-col min-w-0">
          <CanvasArea />
        </div>

        {/* Sidebar Settings Overlay */}
        <PageSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>

      {/* Mobile FABs (Bottom Right) */}
      <div className="md:hidden absolute bottom-6 right-6 flex flex-col gap-3 z-30 no-print">
        <button 
          onClick={() => handleAddElement('image')}
          className="w-12 h-12 bg-white text-slate-600 rounded-full shadow-lg border border-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Icon name="image" size={20} />
        </button>
        <button 
          onClick={() => handleAddElement('text')}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-300 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Icon name="plus" size={24} />
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl z-[60] animate-slide-up flex items-center gap-3 whitespace-nowrap">
          <Icon name="check" size={16} className="text-green-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}
    </div>
  );
                `                         ` };