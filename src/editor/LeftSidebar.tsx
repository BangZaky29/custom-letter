
import React, { useState } from 'react';
import { useDocument } from '../store/documentStore';
import { Icon } from '../components/Icon';
import { ElementType, DocElement, PageConfig } from '../types';
import { mmToPx } from '../utils/unitConverter';

interface LeftSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onApplyTemplate: (template: 'surat-kuasa') => void;
  onNavigateToPage: (pageIndex: number) => void;
}

// Sub-component for rendering the live thumbnail
const ThumbnailPage: React.FC<{ 
    pageIndex: number; 
    elements: DocElement[]; 
    pageConfig: PageConfig;
    active: boolean;
}> = ({ pageIndex, elements, pageConfig, active }) => {
    
    // Calculate scale to fit width. 
    // Sidebar inner width is approx 220px (w-64 = 256px minus padding).
    // A4 width in px (at 96 DPI) is approx 794px.
    // 210 / 794 ≈ 0.26. Let's use 0.22 to be safe with padding.
    const SCALE = 0.22;
    
    const pageElements = elements.filter(el => (el.page || 0) === pageIndex);
    const pageWidthPx = mmToPx(pageConfig.width);
    const pageHeightPx = mmToPx(pageConfig.height);

    return (
        <div 
            className={`w-full relative bg-white shadow-sm overflow-hidden border transition-all ${active ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
            style={{ 
                width: '100%', 
                aspectRatio: `${pageConfig.width}/${pageConfig.height}` 
            }}
        >
            <div 
                style={{
                    width: pageWidthPx,
                    height: pageHeightPx,
                    transform: `scale(${SCALE})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundColor: 'white',
                    pointerEvents: 'none', // Non-interactive preview
                    userSelect: 'none'
                }}
            >
               {/* Render Elements Scaled */}
               {pageElements.map(el => (
                   <div 
                     key={el.id}
                     style={{
                         position: 'absolute',
                         left: `${mmToPx(el.x)}px`,
                         top: `${mmToPx(el.y)}px`,
                         width: el.width ? `${mmToPx(el.width)}px` : 'auto',
                         height: el.type !== 'text' && el.height ? `${mmToPx(el.height)}px` : 'auto',
                         fontFamily: el.style?.fontFamily,
                         fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : undefined,
                         fontWeight: el.style?.fontWeight,
                         fontStyle: el.style?.fontStyle,
                         textDecoration: el.style?.textDecoration,
                         textAlign: el.style?.textAlign,
                         color: el.style?.color,
                         backgroundColor: el.style?.backgroundColor,
                         lineHeight: el.style?.lineHeight || 1.4,
                         border: el.style?.border,
                         borderRadius: el.style?.borderRadius ? `${el.style?.borderRadius}px` : undefined,
                         whiteSpace: 'pre-wrap',
                         overflow: 'hidden',
                         display: 'flex',
                         flexDirection: 'column',
                         justifyContent: 'center',
                     }}
                   >
                       {el.type === 'text' && (
                           <div>{el.content}</div>
                       )}
                       {el.type === 'image' && <img src={el.content} className="w-full h-full object-contain" alt="" />}
                       {el.type === 'rect' && <div className="w-full h-full" style={{border: el.style?.border || '1px solid black', backgroundColor: el.style?.backgroundColor || 'transparent'}}></div>}
                       {el.type === 'line' && <div className="w-full" style={{height: Math.max(2, el.height || 2), backgroundColor: el.style?.color || 'black'}}></div>}
                   </div>
               ))}
            </div>
            
            {/* Overlay for hover effect */}
            <div className="absolute inset-0 bg-transparent hover:bg-black/5 transition-colors cursor-pointer" />
        </div>
    )
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  onApplyTemplate,
  onNavigateToPage
}) => {
  const { state, dispatch } = useDocument();
  const [activeTab, setActiveTab] = useState<'pages' | 'tools'>('pages');

  // Handle adding elements directly to the currently viewed page (approximate) or Page 0
  const handleAddContent = (type: ElementType) => {
    if (type === 'text') {
        dispatch({
            type: 'ADD_ELEMENT',
            payload: {
                type: 'text',
                x: 30,
                y: 30,
                width: 80,
                height: 0,
                page: 0, 
                content: 'New Text',
                style: {
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 16,
                    fontWeight: 'normal',
                    fontStyle: 'normal',
                    textDecoration: 'none',
                    textAlign: 'left',
                    color: '#000000',
                },
            }
        });
    } else {
        // Image
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

  return (
    <div 
      className={`absolute left-0 top-0 bottom-0 z-50 bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'}`}
    >
        {/* Sidebar Header with Tabs */}
        <div className="flex flex-col bg-slate-50 border-b border-slate-200">
            <div className="p-4 flex justify-between items-center">
                <h2 className="font-semibold text-slate-700">Document</h2>
            </div>

            <div className="flex px-2 pb-2 gap-1">
                <button 
                    onClick={() => setActiveTab('pages')}
                    className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-colors ${activeTab === 'pages' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Pages
                </button>
                <button 
                    onClick={() => setActiveTab('tools')}
                    className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-colors ${activeTab === 'tools' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Quick Tools
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            
            {/* PAGES TAB */}
            {activeTab === 'pages' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-bold text-slate-400 uppercase">Document Pages</span>
                         <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{state.pageCount}</span>
                    </div>

                    <div className="space-y-4">
                        {Array.from({ length: state.pageCount }).map((_, index) => (
                            <div key={index} className="flex flex-col gap-1 group">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-medium text-slate-600">Page {index + 1}</span>
                                    {index === 0 && <Icon name="check" size={12} className="text-blue-500" />}
                                </div>
                                
                                <div onClick={() => onNavigateToPage(index)} className="cursor-pointer">
                                    <ThumbnailPage 
                                        pageIndex={index} 
                                        elements={state.elements} 
                                        pageConfig={state.pageConfig} 
                                        active={false}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                         <div className="grid grid-cols-2 gap-2">
                             <button 
                                onClick={() => dispatch({ type: 'ADD_PAGE' })}
                                className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm"
                             >
                                 <Icon name="plus" size={16} />
                                 Add
                             </button>
                             <button 
                                onClick={() => dispatch({ type: 'REMOVE_PAGE' })}
                                disabled={state.pageCount <= 1}
                                className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-red-600 hover:border-red-400 hover:bg-red-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 <Icon name="trash" size={16} />
                                 Remove
                             </button>
                         </div>
                    </div>
                </div>
            )}

            {/* TOOLS TAB */}
            {activeTab === 'tools' && (
                <div className="space-y-6">
                    
                    {/* Header Toggle Section */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <Icon name="template" size={16} />
                                <span>Kop Surat (Header)</span>
                             </div>
                             <div 
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${state.headerActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                                onClick={() => dispatch({ type: 'TOGGLE_HEADER', payload: !state.headerActive })}
                             >
                                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${state.headerActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                             </div>
                        </div>
                        <p className="text-xs text-slate-500">Apply standard header to all pages</p>
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    <div className="space-y-3">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Add</h3>
                         <button 
                            onClick={() => handleAddContent('text')}
                            className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                        >
                             <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                                 <Icon name="type" size={16} />
                             </div>
                             <div>
                                 <div className="text-sm font-medium text-slate-700">Add Text</div>
                                 <div className="text-[10px] text-slate-500">Insert new paragraph</div>
                             </div>
                         </button>

                         <button 
                            onClick={() => handleAddContent('image')}
                            className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                        >
                             <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded flex items-center justify-center">
                                 <Icon name="image" size={16} />
                             </div>
                             <div>
                                 <div className="text-sm font-medium text-slate-700">Add Image</div>
                                 <div className="text-[10px] text-slate-500">Upload from device</div>
                             </div>
                         </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
