
import React from 'react';
import { useDocument } from '../store/documentStore';
import { PaperSize, ElementStyle, ElementType } from '../types';
import { Icon } from '../components/Icon';
import { downloadPDF, printPreview } from '../utils/downloadPDF';
import { downloadWORD } from '../utils/downloadWORD';
import { DEFAULT_FONTS } from '../constants/paperSizes';

type SidebarTab = 'tools' | 'templates' | 'layout';

interface EditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onApplyTemplate: (type: 'surat-kuasa', useKop: boolean) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange,
  onApplyTemplate
}) => {
  const { state, dispatch } = useDocument();
  const { pageConfig, selectedIds, elements } = state;
  
  // Use first selected ID for properties
  const selectedElementId = selectedIds.length > 0 ? selectedIds[0] : null;
  const selectedElement = elements.find(el => el.id === selectedElementId);
  const isTextSelected = selectedElement?.type === 'text';
  const isShapeSelected = selectedElement?.type === 'rect' || selectedElement?.type === 'line';

  const defaultStyle: ElementStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: '#000000',
    backgroundColor: 'transparent',
    listStyleType: 'none',
    padding: 4,
    border: 'none',
    lineHeight: 1.4
  };

  const getStyle = <K extends keyof ElementStyle>(key: K): ElementStyle[K] => {
    return selectedElement?.style?.[key] ?? defaultStyle[key];
  };

  const updateStyle = (key: keyof ElementStyle, value: any) => {
    if (!selectedElementId) return;
    dispatch({
      type: 'UPDATE_MULTIPLE_ELEMENTS',
      payload: {
        ids: selectedIds,
        changes: {
          style: {
            ...selectedElement?.style,
            [key]: value,
          } as ElementStyle,
        },
      },
    });
  };

  const toggleDecoration = (type: 'underline' | 'line-through') => {
    const current = getStyle('textDecoration') as string || 'none';
    let parts = current === 'none' ? [] : current.split(' ');
    if (parts.includes(type)) {
      parts = parts.filter(p => p !== type);
    } else {
      parts.push(type);
    }
    updateStyle('textDecoration', parts.length === 0 ? 'none' : parts.join(' '));
  };

  const hasDecoration = (type: 'underline' | 'line-through') => {
    const current = getStyle('textDecoration') as string;
    return current?.includes(type);
  };
  
  // Insert Handler
  const handleAdd = (type: ElementType) => {
    if (type === 'image') {
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
                            page: 0,
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
    } else if (type === 'rect') {
        dispatch({
            type: 'ADD_ELEMENT',
            payload: {
                type: 'rect',
                page: 0,
                x: 50,
                y: 50,
                width: 40,
                height: 40,
                content: '',
                style: { ...defaultStyle, border: '2px solid #000000', backgroundColor: 'transparent' }
            }
        });
    } else if (type === 'line') {
        dispatch({
            type: 'ADD_ELEMENT',
            payload: {
                type: 'line',
                page: 0,
                x: 50,
                y: 50,
                width: 100,
                height: 2, // Thickness
                content: '',
                style: { ...defaultStyle, color: '#000000' }
            }
        });
    } else {
        // Text
        dispatch({
            type: 'ADD_ELEMENT',
            payload: {
                type: 'text',
                page: 0,
                x: 20,
                y: 20,
                width: 80,
                height: 0,
                content: 'Insert text...',
                style: { ...defaultStyle, fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#000000', textAlign: 'left' }
            }
        });
    }
  };

  if (!isOpen) return null;

  const handleExport = async (action: 'pdf' | 'word' | 'print') => {
      const safeTitle = state.title.trim() || 'document';
      const filenameBase = safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      if (action === 'print') {
          printPreview();
      } else if (action === 'pdf') {
          await downloadPDF(`${filenameBase}.pdf`);
      } else if (action === 'word') {
          await downloadWORD(state, `${filenameBase}.docx`);
      }
      onClose();
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-slide-up md:animate-none">
      
      {/* Sidebar Header */}
      <div className="flex flex-col bg-slate-50 border-b border-slate-200">
          <div className="p-4 flex justify-between items-center">
            <h2 className="font-semibold text-slate-700">Editor Menu</h2>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600"><Icon name="x" size={20} /></button>
          </div>
          
          <div className="flex px-2 pb-2 gap-1">
             <button onClick={() => onTabChange('tools')} className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-colors ${activeTab === 'tools' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>Tools</button>
             <button onClick={() => onTabChange('templates')} className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-colors ${activeTab === 'templates' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>Templates</button>
             <button onClick={() => onTabChange('layout')} className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-colors ${activeTab === 'layout' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>Layout</button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {activeTab === 'tools' && (
            <div className="space-y-6">
                
                {/* 1. MENU INSERT - ALWAYS VISIBLE */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Icon name="plus" size={14} /> Insert Menu
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => handleAdd('text')} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-blue-300 transition-all text-slate-600">
                            <Icon name="type" size={20} className="text-blue-500" />
                            <span className="text-[10px] font-medium">Text</span>
                        </button>
                        <button onClick={() => handleAdd('image')} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-blue-300 transition-all text-slate-600">
                            <Icon name="image" size={20} className="text-purple-500" />
                            <span className="text-[10px] font-medium">Image</span>
                        </button>
                        <button onClick={() => handleAdd('rect')} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-blue-300 transition-all text-slate-600">
                            <Icon name="square" size={20} className="text-green-500" />
                            <span className="text-[10px] font-medium">Box</span>
                        </button>
                        <button onClick={() => handleAdd('line')} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-blue-300 transition-all text-slate-600">
                            <Icon name="minus" size={20} className="text-orange-500" />
                            <span className="text-[10px] font-medium">Line</span>
                        </button>
                        <button onClick={() => handleAdd('text')} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-blue-300 transition-all text-slate-600">
                             <Icon name="calendar" size={20} className="text-red-500" />
                             <span className="text-[10px] font-medium">Date</span>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* 2. MENU TEKS FORMAT */}
                {isTextSelected && (
                     <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Icon name="type" size={14} /> Text Format
                            </span>
                            <button 
                                onClick={() => dispatch({type: 'SELECT_ELEMENT', payload: null})}
                                className="text-xs text-blue-600 font-medium hover:underline"
                            >
                                Done
                            </button>
                        </div>

                        {/* Font Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500">Font</label>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 bg-white"
                                    value={getStyle('fontFamily')}
                                    onChange={(e) => updateStyle('fontFamily', e.target.value)}
                                >
                                    {DEFAULT_FONTS.map(font => (
                                        <option key={font.value} value={font.value}>{font.name}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-1 w-24 justify-between">
                                        <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" onClick={() => updateStyle('fontSize', Math.max(1, (getStyle('fontSize') || 16) - 1))}><Icon name="minus" size={14}/></button>
                                        <span className="text-sm font-medium w-6 text-center">{getStyle('fontSize')}</span>
                                        <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" onClick={() => updateStyle('fontSize', (getStyle('fontSize') || 16) + 1)}><Icon name="plus" size={14}/></button>
                                </div>
                            </div>
                        </div>

                        {/* Style Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500">Style</label>
                            <div className="grid grid-cols-6 gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                                <button onClick={() => updateStyle('fontWeight', getStyle('fontWeight') === 'bold' ? 'normal' : 'bold')} className={`p-2 rounded flex justify-center ${getStyle('fontWeight') === 'bold' ? 'bg-blue-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><Icon name="bold" size={16}/></button>
                                <button onClick={() => updateStyle('fontStyle', getStyle('fontStyle') === 'italic' ? 'normal' : 'italic')} className={`p-2 rounded flex justify-center ${getStyle('fontStyle') === 'italic' ? 'bg-blue-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><Icon name="italic" size={16}/></button>
                                <button onClick={() => toggleDecoration('underline')} className={`p-2 rounded flex justify-center ${hasDecoration('underline') ? 'bg-blue-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><Icon name="underline" size={16}/></button>
                                <button onClick={() => toggleDecoration('line-through')} className={`p-2 rounded flex justify-center ${hasDecoration('line-through') ? 'bg-blue-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><Icon name="strikethrough" size={16}/></button>
                                <div className="relative group flex items-center justify-center p-2 rounded cursor-pointer hover:bg-slate-200">
                                    <Icon name="highlighter" size={16} className="text-yellow-600" />
                                    <input type="color" value={getStyle('backgroundColor') || '#ffffff'} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                                </div>
                                <div className="relative group flex items-center justify-center p-2 rounded cursor-pointer hover:bg-slate-200">
                                    <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: getStyle('color') }}></div>
                                    <input type="color" value={getStyle('color')} onChange={(e) => updateStyle('color', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        {/* Alignment & Lists Section */}
                        <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500">Alignment & Lists</label>
                                <div className="grid grid-cols-6 gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                                {(['left', 'center', 'right', 'justify'] as const).map(align => (
                                    <button key={align} onClick={() => updateStyle('textAlign', align)} className={`p-2 rounded flex justify-center ${getStyle('textAlign') === align ? 'bg-blue-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><Icon name={`align-${align}`} size={16}/></button>
                                ))}
                                <div className="w-px h-6 bg-slate-200 my-auto mx-1"></div>
                                <button onClick={() => updateStyle('listStyleType', getStyle('listStyleType') === 'disc' ? 'none' : 'disc')} className={`p-2 rounded flex justify-center ${getStyle('listStyleType') === 'disc' ? 'bg-blue-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><Icon name="list-ul" size={16}/></button>
                            </div>
                        </div>

                        {/* Spacing Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500">Spacing</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden items-center">
                                    <span className="pl-2 text-[10px] text-slate-400 w-8">Indent</span>
                                    <button onClick={() => updateStyle('padding', Math.max(0, (getStyle('padding') || 0) - 10))} className="flex-1 p-2 hover:bg-slate-50 border-r border-slate-100 flex justify-center"><Icon name="indent" size={16}/></button>
                                    <button onClick={() => updateStyle('padding', (getStyle('padding') || 0) + 10)} className="flex-1 p-2 hover:bg-slate-50 flex justify-center"><Icon name="outdent" size={16}/></button>
                                </div>
                                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden items-center">
                                    <span className="pl-2 text-[10px] text-slate-400 w-8">Line</span>
                                    <button onClick={() => updateStyle('lineHeight', Math.max(0.8, (getStyle('lineHeight') || 1.4) - 0.2))} className="flex-1 p-2 hover:bg-slate-50 flex justify-center"><Icon name="arrow-down" size={14}/></button>
                                    <button onClick={() => updateStyle('lineHeight', Math.min(3, (getStyle('lineHeight') || 1.4) + 0.2))} className="flex-1 p-2 hover:bg-slate-50 flex justify-center"><Icon name="arrow-up" size={14}/></button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-100">
                                <button 
                                onClick={() => dispatch({
                                        type: 'UPDATE_MULTIPLE_ELEMENTS',
                                        payload: { ids: selectedIds, changes: { style: defaultStyle } }
                                })}
                                className="w-full py-2 flex items-center justify-center gap-2 text-red-500 text-sm hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Icon name="eraser" size={16} />
                                    Clear Formatting
                                </button>
                        </div>
                     </div>
                )}
                
                {isShapeSelected && (
                     <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                 <Icon name="settings" size={14} /> Shape Format
                             </span>
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs font-medium text-slate-500">Appearance</label>
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                     <span className="text-[10px] text-slate-400">Fill Color</span>
                                     <div className="relative h-8 w-full border border-slate-200 rounded-lg overflow-hidden cursor-pointer bg-white flex items-center justify-center">
                                         <div className="w-full h-full" style={{backgroundColor: getStyle('backgroundColor') || 'transparent'}}></div>
                                         <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={getStyle('backgroundColor') || '#ffffff'} onChange={(e) => updateStyle('backgroundColor', e.target.value)} />
                                     </div>
                                 </div>
                                 <div className="space-y-1">
                                     <span className="text-[10px] text-slate-400">Border / Line Color</span>
                                     <div className="relative h-8 w-full border border-slate-200 rounded-lg overflow-hidden cursor-pointer bg-white flex items-center justify-center">
                                         <div className="w-full h-full" style={{backgroundColor: selectedElement?.type === 'line' ? getStyle('color') : 'transparent', border: selectedElement?.type === 'rect' ? getStyle('border') : 'none'}}></div>
                                          <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={getStyle('color') || '#000000'} onChange={(e) => {
                                              if (selectedElement?.type === 'line') updateStyle('color', e.target.value);
                                              if (selectedElement?.type === 'rect') updateStyle('border', `2px solid ${e.target.value}`);
                                          }} />
                                     </div>
                                 </div>
                             </div>
                        </div>
                     </div>
                )}

                {!isTextSelected && !isShapeSelected && selectedElementId && (
                     <div className="text-center py-6 text-slate-400 text-sm italic">
                        Image selected. Resize on canvas.
                     </div>
                )}
            </div>
        )}

        {/* Templates Tab Content */}
        {activeTab === 'templates' && (
             <div className="space-y-6">
                 <div className="space-y-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Templates</h3>
                     <button onClick={() => onApplyTemplate('surat-kuasa', false)} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group bg-white">
                         <div className="flex items-start gap-3">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                 <Icon name="file-text" size={20} />
                             </div>
                             <div>
                                 <div className="font-semibold text-slate-800">Surat Kuasa</div>
                                 <p className="text-xs text-slate-500 mt-1">Standard power of attorney document.</p>
                             </div>
                         </div>
                     </button>
                     <button
                        disabled
                        className="w-full text-left p-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed transition-all group"
                        >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-200 text-slate-400 rounded-lg transition-colors">
                            <Icon name="file-text" size={20} />
                            </div>
                            <div>
                            <div className="font-semibold text-slate-400">Generator Surat (Coming Soon)</div>
                            <p className="text-xs text-slate-400 mt-1">
                                Fitur ini akan segera hadir.
                            </p>
                            </div>
                        </div>
                        </button>

                 </div>
             </div>
        )}

        {/* Layout Tab Content (Renamed from Settings) */}
        {activeTab === 'layout' && (
            <div className="space-y-6">
                <div className="space-y-4">
                    {/* Paper Size */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paper Size</label>
                        <select 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={pageConfig.size}
                            onChange={(e) => dispatch({ type: 'SET_PAGE_SIZE', payload: { size: e.target.value as PaperSize } })}
                        >
                            <option value="A4">A4 (210 x 297 mm)</option>
                            <option value="A3">A3 (297 x 420 mm)</option>
                            <option value="A5">A5 (148 x 210 mm)</option>
                            <option value="A6">A6 (105 x 148 mm)</option>
                            <option value="Custom">Custom Size</option>
                        </select>
                    </div>

                    {/* Orientation */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orientation</label>
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                             <button 
                                onClick={() => dispatch({ type: 'SET_ORIENTATION', payload: 'portrait' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${pageConfig.orientation === 'portrait' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                             >
                                 <Icon name="file-text" size={16} /> Portrait
                             </button>
                             <button 
                                onClick={() => dispatch({ type: 'SET_ORIENTATION', payload: 'landscape' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${pageConfig.orientation === 'landscape' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                             >
                                 <Icon name="maximize" size={16} className="rotate-90" /> Landscape
                             </button>
                        </div>
                    </div>

                    {/* Margins */}
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margins (mm)</label>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-medium">Top</span>
                                 <input 
                                     type="number" 
                                     value={pageConfig.margins.top} 
                                     onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { top: Number(e.target.value) } })}
                                     className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                 />
                             </div>
                             <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-medium">Bottom</span>
                                 <input 
                                     type="number" 
                                     value={pageConfig.margins.bottom} 
                                     onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { bottom: Number(e.target.value) } })}
                                     className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                 />
                             </div>
                             <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-medium">Left</span>
                                 <input 
                                     type="number" 
                                     value={pageConfig.margins.left} 
                                     onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { left: Number(e.target.value) } })}
                                     className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                 />
                             </div>
                             <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-medium">Right</span>
                                 <input 
                                     type="number" 
                                     value={pageConfig.margins.right} 
                                     onChange={(e) => dispatch({ type: 'SET_MARGINS', payload: { right: Number(e.target.value) } })}
                                     className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                 />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
