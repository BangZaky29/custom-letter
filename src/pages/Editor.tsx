
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDocument } from '../store/documentStore';
import { CanvasArea } from '../editor/CanvasArea';
import { EditorSidebar } from '../editor/EditorSidebar';
import { LeftSidebar } from '../editor/LeftSidebar';
import { TemplatePageSelector } from '../components/TemplatePageSelector';
import { Icon } from '../components/Icon';
import { downloadPDF, printPreview } from '../utils/downloadPDF';
import { downloadWORD } from '../utils/downloadWORD';
import { getSuratKuasaElements } from '../templateSurat/surat-kuasa';
import { generateId } from '../utils/unitConverter';
import { ElementType } from '../types';

export const Editor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, dispatch, canUndo, canRedo } = useDocument();
  
  // Sidebar States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false); 
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true); 
  
  // Template Modal State
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<'surat-kuasa' | null>(null);

  const [activeRightTab, setActiveRightTab] = useState<'tools' | 'templates' | 'layout'>('tools');
  const [notification, setNotification] = useState<string | null>(null);

  // Menu States
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false); 

  // --- AUTO-OPEN TOOLS ON SELECTION ---
  useEffect(() => {
    if (state.selectedIds.length > 0) {
        setIsRightSidebarOpen(true);
        setActiveRightTab('tools');
    }
  }, [state.selectedIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- KEYBOARD SHORTCUTS ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    if (e.key === 'Delete' && !isEditing) {
      if (state.selectedIds.length > 0) {
        dispatch({ type: 'REMOVE_SELECTED' });
      }
    }

    if ((e.ctrlKey || e.metaKey) && !isEditing) {
        switch(e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                if (e.shiftKey) {
                   if (canRedo) dispatch({ type: 'REDO' });
                } else {
                   if (canUndo) dispatch({ type: 'UNDO' });
                }
                break;
            case 'y': 
                e.preventDefault();
                if (canRedo) dispatch({ type: 'REDO' });
                break;
            case 'c':
                e.preventDefault();
                dispatch({ type: 'COPY' });
                setNotification('Copied');
                setTimeout(() => setNotification(null), 1000);
                break;
            case 'v':
                e.preventDefault();
                dispatch({ type: 'PASTE' });
                break;
        }
    }
  }, [state.selectedIds, canUndo, canRedo, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
          width: 80, 
          height: 0, 
          page: 0, 
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
                page: 0, 
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

  // --- TEMPLATE HANDLING ---
  const initiateTemplateApply = (template: 'surat-kuasa') => {
    if (state.pageCount === 1) {
        applyTemplate(template, 0);
    } else {
        setPendingTemplate(template);
        setTemplateModalOpen(true);
    }
  };

  const applyTemplate = (templateType: 'surat-kuasa', pageIndex: number) => {
    let elementsToAdd: any[] = [];
    
    if (templateType === 'surat-kuasa') {
        const rawElements = getSuratKuasaElements(false);
        elementsToAdd = rawElements.map(el => ({
            ...el,
            page: pageIndex,
            id: generateId()
        }));
        
        if (pageIndex === 0) {
           dispatch({ type: 'RENAME_DOCUMENT', payload: 'Surat Kuasa' });
        }
    }

    if (elementsToAdd.length > 0) {
        dispatch({ type: 'ADD_MULTIPLE_ELEMENTS', payload: elementsToAdd });
        setNotification(`Template added to Page ${pageIndex + 1}`);
    }
    
    setTemplateModalOpen(false);
    setPendingTemplate(null);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- PAGE NAVIGATION ---
  const scrollToPage = (pageIndex: number) => {
    const el = document.getElementById(`document-page-${pageIndex}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExport = async (action: 'pdf' | 'word' | 'print') => {
    setActiveMenu(null);
    setShowExportMenu(false);
    
    if (action === 'print') {
        printPreview();
        return;
    }

    setNotification(action === 'pdf' ? 'Generating PDF...' : 'Generating Word Doc...');
    const safeTitle = state.title.trim() || 'document';
    const filenameBase = safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    setTimeout(async () => {
      try {
        if (action === 'pdf') {
          await downloadPDF(`${filenameBase}.pdf`);
        } else if (action === 'word') {
          // IMPORTANT: Word export must use .doc extension for HTML content to open correctly in Word
          await downloadWORD(state, `${filenameBase}.doc`);
        }
        setNotification('File saved successfully');
      } catch (e) {
        setNotification('Error saving file');
      }
      setTimeout(() => setNotification(null), 3000);
    }, 100);
  };

  // Helper for Menus
  const MenuButton = ({ label, id }: { label: string, id: string }) => (
    <div className="relative">
      <button 
        className={`px-3 py-1 text-sm rounded hover:bg-slate-100 transition-colors ${activeMenu === id ? 'bg-slate-100 text-blue-600 font-medium' : 'text-slate-600'}`}
        onClick={() => setActiveMenu(activeMenu === id ? null : id)}
      >
        {label}
      </button>
      {activeMenu === id && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-[100] animate-fade-in">
           {id === 'file' && (
             <>
               <button onClick={onBack} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="chevron-left" size={14} /> Back to Dashboard
               </button>
               <div className="h-px bg-slate-100 my-1"/>
               <button onClick={() => handleExport('print')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="printer" size={14} /> Print
               </button>
               <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="file-text" size={14} /> Export PDF
               </button>
               <button onClick={() => handleExport('word')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="file-text" size={14} /> Export Word
               </button>
             </>
           )}
           {id === 'edit' && (
             <>
               <button onClick={() => { dispatch({type: 'UNDO'}); setActiveMenu(null); }} disabled={!canUndo} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 disabled:opacity-50">
                  <Icon name="undo" size={14} /> Undo
               </button>
               <button onClick={() => { dispatch({type: 'REDO'}); setActiveMenu(null); }} disabled={!canRedo} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 disabled:opacity-50">
                  <Icon name="redo" size={14} /> Redo
               </button>
               <div className="h-px bg-slate-100 my-1"/>
               <button onClick={() => { dispatch({type: 'COPY'}); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="copy" size={14} /> Copy
               </button>
               <button onClick={() => { dispatch({type: 'PASTE'}); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="file-text" size={14} /> Paste
               </button>
             </>
           )}
           {id === 'view' && (
             <>
               <button onClick={() => { dispatch({type: 'SET_ZOOM', payload: 1}); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="maximize" size={14} /> 100% Zoom
               </button>
               <button onClick={() => { dispatch({type: 'SET_ZOOM', payload: state.zoom + 0.1}); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="plus" size={14} /> Zoom In
               </button>
               <button onClick={() => { dispatch({type: 'SET_ZOOM', payload: Math.max(0.1, state.zoom - 0.1)}); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2">
                  <Icon name="minus" size={14} /> Zoom Out
               </button>
             </>
           )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="relative z-50 flex flex-col bg-white shadow-sm border-b border-slate-200 no-print">
        <header className="h-16 flex justify-between items-center px-4 md:px-6 relative">
          
          <div className="flex items-center gap-4 w-1/3 ml-12 lg:ml-0">
            {/* Header content shifted due to removed button */}
            
            <div className="flex flex-col">
              <input 
                type="text" 
                value={state.title}
                onChange={handleTitleChange}
                className="font-semibold text-slate-700 text-sm leading-tight bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-1.5 -ml-1.5 py-0.5 outline-none transition-all w-48 mb-0.5"
                placeholder="Untitled Document"
              />
              {/* MENU BAR */}
              <div className="flex gap-1 -ml-2" ref={menuRef}>
                  <MenuButton label="File" id="file" />
                  <MenuButton label="Edit" id="edit" />
                  <MenuButton label="View" id="view" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-1/3">
             <div className="h-5 w-px bg-slate-200 mx-1 hidden md:block"></div>
             
             {/* Desktop Quick Adds */}
             <div className="hidden lg:flex items-center gap-2 mr-2">
                 <button onClick={() => handleAddElement('text')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Add Text">
                    <Icon name="file-text" size={18}/>
                 </button>
                 <button onClick={() => handleAddElement('image')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Add Image">
                    <Icon name="image" size={18}/>
                 </button>
             </div>

             {/* Export Button with Dropdown */}
             <div className="relative z-50">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-200 transition-all text-sm font-medium"
                >
                  <Icon name="download" size={18} />
                  <span className="hidden lg:inline">Export File</span>
                </button>

                {/* DROPDOWN MENU */}
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-fade-in origin-top-right ring-1 ring-black/5 flex flex-col">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">File Options</p>
                    </div>
                    
                    {/* Print Preview */}
                    <button 
                      onClick={() => handleExport('print')}
                      className="relative w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-3 transition-colors rounded-lg"
                    >
                      {/* Badge "Beta" */}
                      <span className="absolute top-2 right-2 bg-purple-100 text-purple-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        Beta
                      </span>

                      <span className="flex items-center justify-center w-8 h-8 rounded bg-slate-100 text-slate-600">
                        <Icon name="printer" size={16} />
                      </span>

                      <div className="flex flex-col">
                        <span className="font-medium">Print Preview</span>
                        <span className="text-[10px] text-slate-400">Preview & Print Document</span>
                      </div>
                    </button>

                    <div className="h-px bg-slate-100 my-1 mx-4" />


                    {/* PDF Download */}
                      <button 
                        onClick={() => handleExport('pdf')}
                        className="relative w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-3 transition-colors rounded-lg"
                      >
                        {/* Badge "Disarankan" */}
                        <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          Disarankan
                        </span>

                        <span className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-600">
                          <Icon name="file-text" size={16} />
                        </span>

                        <div className="flex flex-col">
                          <span className="font-medium">Download PDF</span>
                          <span className="text-[10px] text-slate-400">Standard Portable Document</span>
                        </div>
                      </button>


                    {/* Word Download */}
                    <button 
                      onClick={() => handleExport('word')}
                      className="relative w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-3 transition-colors rounded-lg"
                    >
                      {/* Badge "Beta" */}
                      <span className="absolute top-2 right-2 bg-purple-100 text-purple-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        Beta
                      </span>

                      <span className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600">
                        <Icon name="file-text" size={16} />
                      </span>

                      <div className="flex flex-col">
                        <span className="font-medium">Download Word</span>
                        <span className="text-[10px] text-slate-400">Editable Microsoft Word (.docx)</span>
                      </div>
                    </button>
                  </div>
                )}
             </div>
          </div>
        </header>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative z-0">
        
        {/* LEFT SIDEBAR (OVERLAY) */}
        <div className="no-print z-50">
            <LeftSidebar 
                isOpen={isLeftSidebarOpen} 
                toggleSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                onApplyTemplate={initiateTemplateApply}
                onNavigateToPage={scrollToPage}
            />
        </div>

        {/* CANVAS */}
        <div className="flex-1 flex flex-col min-w-0">
          <CanvasArea />
        </div>

        {/* RIGHT SIDEBAR (SETTINGS/TOOLS) */}
        <div className="no-print z-40">
            <EditorSidebar 
            isOpen={isRightSidebarOpen} 
            onClose={() => setIsRightSidebarOpen(false)} 
            activeTab={activeRightTab}
            onTabChange={setActiveRightTab}
            onApplyTemplate={(type) => initiateTemplateApply(type)}
            />
        </div>
      </div>

      {/* Template Selection Modal */}
      <TemplatePageSelector 
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        pageCount={state.pageCount}
        templateName={pendingTemplate === 'surat-kuasa' ? 'Surat Kuasa' : 'Template'}
        onSelectPage={(idx) => pendingTemplate && applyTemplate(pendingTemplate, idx)}
      />

      {/* Floating Left Sidebar Toggle */}
      <div className={`fixed top-20 left-6 z-[70] flex flex-col gap-3 no-print transition-all duration-300 ${isLeftSidebarOpen ? 'translate-x-64' : 'translate-x-0'}`}>
         <button 
           onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
           className={`w-10 h-10 rounded-full shadow-md border border-slate-100 flex items-center justify-center active:scale-95 transition-all ${isLeftSidebarOpen ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
           title="Toggle Pages"
         >
           <Icon name={isLeftSidebarOpen ? 'chevron-left' : 'menu'} size={20} />
         </button>
      </div>

      {/* Floating Right Menu Button */}
      <div className="fixed top-20 right-6 z-[70] flex flex-col gap-3 no-print">
         <button 
           onClick={() => {
               if (isRightSidebarOpen) {
                   setIsRightSidebarOpen(false);
               } else {
                   setIsRightSidebarOpen(true);
                   if(activeRightTab !== 'tools' && activeRightTab !== 'layout') {
                       setActiveRightTab('tools');
                   }
               }
           }}
           className={`w-10 h-10 rounded-full shadow-md border border-slate-100 flex items-center justify-center active:scale-95 transition-all ${isRightSidebarOpen ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
           title="Toggle Tools"
         >
           <Icon name="settings" size={20} />
         </button>
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

      {/* Notifications */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl z-[60] animate-slide-up flex items-center gap-3 whitespace-nowrap">
          <Icon name="check" size={16} className="text-green-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}
    </div>
  );
};
