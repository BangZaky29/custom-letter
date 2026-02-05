import React, { useRef, useState, useEffect } from 'react';
import { useDocument } from '../store/documentStore';
import { mmToPx, pxToMm } from '../utils/unitConverter';
import { DocElement } from '../types';
import { Icon } from '../components/Icon';

export const CanvasArea: React.FC = () => {
  const { state, dispatch } = useDocument();
  const { pageConfig, elements, selectedIds, zoom, pageCount } = state;

  // --- LOCAL STATE ---
  
  // Dragging State (Group)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Mouse/Touch start pos (px)
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 }); // Current delta (px) - used for preview
  
  // Resizing State
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ w: 0, h: 0, x: 0, y: 0 });
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);

  // Marquee Selection State
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number, pageIndex: number } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ 
      x: number; 
      y: number; 
      type: 'canvas' | 'element';
      pageIndex?: number; 
      mmX?: number; 
      mmY?: number;
      elementId?: string;
  } | null>(null);

  // Constants
  const pageWidthPx = mmToPx(pageConfig.width);
  const pageHeightPx = mmToPx(pageConfig.height);
  
  const margins = {
    top: mmToPx(pageConfig.margins.top),
    bottom: mmToPx(pageConfig.margins.bottom),
    left: mmToPx(pageConfig.margins.left),
    right: mmToPx(pageConfig.margins.right),
  };

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- POINTER EVENT HANDLERS (Unified Mouse & Touch) ---
  
  const handleElementPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation(); 
    // Prevent default touch actions like scrolling ONLY if we are initiating a drag/resize
    // However, preventDefault on pointerdown might stop focus. 
    // For dragging, we usually want to capture the pointer.
    
    // We only prevent default if it's not text editing interaction?
    // Actually, for dragging, we want to prevent scrolling.
    if ((e.target as HTMLElement).getAttribute('contenteditable') === 'true') {
        return; // Let default behavior happen for text editing
    }

    e.preventDefault(); 
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setContextMenu(null);

    let newSelection = [...selectedIds];
    const isSelected = selectedIds.includes(id);

    if (e.shiftKey || e.ctrlKey) {
        if (isSelected) {
            newSelection = newSelection.filter(sid => sid !== id);
        } else {
            newSelection.push(id);
        }
        dispatch({ type: 'SET_SELECTION', payload: newSelection });
    } else {
        if (!isSelected) {
            newSelection = [id];
            dispatch({ type: 'SET_SELECTION', payload: newSelection });
        }
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragDelta({ x: 0, y: 0 }); 
  };

  const handlePagePointerDown = (e: React.PointerEvent, pageIndex: number) => {
    // If touched on a draggable element, ignore (handled by element)
    if ((e.target as HTMLElement).closest('.draggable-element')) return;
    
    if (!e.shiftKey && !e.ctrlKey) {
        dispatch({ type: 'SELECT_ELEMENT', payload: null });
    }
    
    setContextMenu(null);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setSelectionStart({ x, y, pageIndex });
    setSelectionBox({ x, y, w: 0, h: 0 });
    
    // Capture pointer for marquee
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const element = elements.find(el => el.id === id);
    if (!element) return;

    dispatch({ type: 'SELECT_ELEMENT', payload: id });
    setResizingElementId(id);
    setIsResizing(true);
    
    setResizeStart({
      w: element.width,
      h: element.height,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isResizing && resizingElementId) {
      e.preventDefault();
      const deltaX = (e.clientX - resizeStart.x) / zoom;
      const deltaY = (e.clientY - resizeStart.y) / zoom;
      const deltaXmm = pxToMm(deltaX);
      const deltaYmm = pxToMm(deltaY);

      const newWidth = Math.max(1, resizeStart.w + deltaXmm);
      const newHeight = Math.max(1, resizeStart.h + deltaYmm);

      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: {
          id: resizingElementId,
          changes: { width: newWidth, height: newHeight }
        }
      });
      return;
    }

    if (isDragging) {
        e.preventDefault();
        const dx = (e.clientX - dragStart.x) / zoom;
        const dy = (e.clientY - dragStart.y) / zoom;
        setDragDelta({ x: dx, y: dy });
        return;
    }

    if (selectionStart && selectionBox) {
        const pageEl = document.getElementById(`document-page-${selectionStart.pageIndex}`);
        if(!pageEl) return;
        
        const rect = pageEl.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / zoom;
        const currentY = (e.clientY - rect.top) / zoom;

        const x = Math.min(selectionStart.x, currentX);
        const y = Math.min(selectionStart.y, currentY);
        const w = Math.abs(currentX - selectionStart.x);
        const h = Math.abs(currentY - selectionStart.y);

        setSelectionBox({ x, y, w, h });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if(e.target instanceof Element) {
        try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch(err) {
            // Ignore if not captured
        }
    }

    if (isDragging) {
        if (dragDelta.x !== 0 || dragDelta.y !== 0) {
            const dxMm = pxToMm(dragDelta.x);
            const dyMm = pxToMm(dragDelta.y);
            
            dispatch({
                type: 'MOVE_ELEMENTS',
                payload: {
                    ids: selectedIds,
                    dxMm,
                    dyMm
                }
            });
        }
    }

    if (selectionStart && selectionBox) {
        const p1 = { x: selectionBox.x, y: selectionBox.y };
        const p2 = { x: selectionBox.x + selectionBox.w, y: selectionBox.y + selectionBox.h };
        
        const rectMm = {
            x1: pxToMm(p1.x),
            y1: pxToMm(p1.y),
            x2: pxToMm(p2.x),
            y2: pxToMm(p2.y)
        };

        const intersectingIds = elements
            .filter(el => el.page === selectionStart.pageIndex)
            .filter(el => {
                const elRight = el.x + el.width;
                const elBottom = el.y + (el.height || 10);
                
                return (
                    el.x < rectMm.x2 &&
                    elRight > rectMm.x1 &&
                    el.y < rectMm.y2 &&
                    elBottom > rectMm.y1
                );
            })
            .map(el => el.id);
        
        if (intersectingIds.length > 0) {
            dispatch({ type: 'SET_SELECTION', payload: intersectingIds });
        }
    }

    setIsDragging(false);
    setDragDelta({ x: 0, y: 0 });
    setIsResizing(false);
    setResizingElementId(null);
    setSelectionStart(null);
    setSelectionBox(null);
  };

  const handleBackgroundClick = () => {};

  const handleCanvasContextMenu = (e: React.MouseEvent, pageIndex: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
      pageIndex,
      mmX: pxToMm(x),
      mmY: pxToMm(y)
    });
  };

  const handleElementContextMenu = (e: React.MouseEvent, elementId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          type: 'element',
          elementId
      });
  };

  const handleAddFromContextMenu = (type: 'text' | 'image') => {
    if (!contextMenu || contextMenu.type !== 'canvas') return;
    const pageIdx = contextMenu.pageIndex ?? 0;
    const xPos = contextMenu.mmX ?? 20;
    const yPos = contextMenu.mmY ?? 20;

    if (type === 'text') {
      dispatch({
        type: 'ADD_ELEMENT',
        payload: {
          type: 'text',
          page: pageIdx,
          x: xPos,
          y: yPos,
          width: 80,
          height: 0,
          content: 'Type here...',
          style: { fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#000000' },
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
                  page: pageIdx,
                  x: xPos,
                  y: yPos,
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
    setContextMenu(null);
  };

  const handleDeleteElement = () => {
      if(contextMenu?.elementId) {
          dispatch({ type: 'REMOVE_ELEMENT', payload: contextMenu.elementId });
      }
      setContextMenu(null);
  }

  const handleTextChange = (id: string, newText: string) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id, changes: { content: newText } } });
  };

  return (
    <div 
      id="canvas-area-container"
      className="flex-1 bg-slate-100 overflow-auto flex flex-col items-center p-4 md:p-8 relative touch-none gap-8 no-scrollbar"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleBackgroundClick}
    >
      {/* Render Pages */}
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div
          key={pageIndex}
          id={`page-wrapper-${pageIndex}`}
          className="document-page-wrapper relative shrink-0 shadow-lg transition-all duration-200 ease-out bg-white ring-1 ring-slate-200 group"
          style={{
            width: pageWidthPx * zoom,
            height: pageHeightPx * zoom,
          }}
        >
          {/* DELETE PAGE ICON (TOP RIGHT) */}
          <button 
             onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_PAGE', payload: pageIndex }); }}
             className="absolute -top-3 -right-3 z-[60] bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all no-print hidden md:block"
             title={`Remove Page ${pageIndex + 1}`}
             disabled={pageCount <= 1}
          >
              <Icon name="trash" size={14} />
          </button>

          <div
            id={`document-page-${pageIndex}`}
            className="document-page bg-white relative origin-top-left select-none"
            style={{
              width: pageWidthPx,
              height: pageHeightPx,
              transform: `scale(${zoom})`,
              overflow: 'hidden',
              cursor: 'default' 
            }}
            onPointerDown={(e) => handlePagePointerDown(e, pageIndex)}
            onContextMenu={(e) => handleCanvasContextMenu(e, pageIndex)}
          >
            {/* Page Label */}
            <div className="absolute top-0 -left-8 text-[10px] text-slate-400 font-medium uppercase tracking-wider no-print -rotate-90 origin-top-right translate-y-8 w-20 text-right hidden md:block">
              Page {pageIndex + 1}
            </div>

            {/* Margins */}
            <div 
              className="absolute border border-dashed border-blue-200 pointer-events-none no-print opacity-50"
              style={{ top: margins.top, left: margins.left, right: margins.right, bottom: margins.bottom }}
            />

            {/* Elements */}
            {elements.filter(el => (el.page ?? 0) === pageIndex).map((el) => {
                const isSelected = selectedIds.includes(el.id);
                const offset = (isSelected && isDragging) ? dragDelta : { x: 0, y: 0 };

                return (
                  <DraggableElement
                    key={el.id}
                    element={el}
                    isSelected={isSelected}
                    dragOffset={offset}
                    onPointerDown={(e) => handleElementPointerDown(e, el.id)}
                    onSelect={() => dispatch({ type: 'SELECT_ELEMENT', payload: el.id })}
                    onResizePointerDown={(e) => handleResizePointerDown(e, el.id)}
                    onTextChange={(text) => handleTextChange(el.id, text)}
                    onContextMenu={(e) => handleElementContextMenu(e, el.id)}
                  />
                )
            })}
            
            {/* Marquee Box */}
            {selectionStart && selectionBox && selectionStart.pageIndex === pageIndex && (
                <div 
                    className="absolute bg-blue-500/20 border border-blue-500 z-50 pointer-events-none"
                    style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }}
                />
            )}
          </div>
        </div>
      ))}

      {/* PAGE CONTROLS (BOTTOM) */}
      <div className="flex items-center gap-4 mt-2 mb-20 md:mb-8 no-print">
         <button 
           onClick={() => dispatch({ type: 'ADD_PAGE' })}
           className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full shadow-sm hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
         >
            <Icon name="plus" size={16} />
            Add Page
         </button>
         
         <div className="h-4 w-px bg-slate-300"></div>

         <button 
           onClick={() => dispatch({ type: 'REMOVE_PAGE' })}
           disabled={pageCount <= 1}
           className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full shadow-sm hover:border-red-500 hover:text-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
         >
            <Icon name="trash" size={16} />
            Remove Page
         </button>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <div 
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-100 py-1 w-48 animate-fade-in"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            {contextMenu.type === 'canvas' ? (
                <>
                    <div className="px-3 py-2 border-b border-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Add Content
                    </div>
                    <button onClick={() => handleAddFromContextMenu('text')} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-slate-700 flex items-center gap-2">
                        <Icon name="file-text" size={16} /><span>Add Text</span>
                    </button>
                    <button onClick={() => handleAddFromContextMenu('image')} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-slate-700 flex items-center gap-2">
                        <Icon name="image" size={16} /><span>Add Image</span>
                    </button>
                </>
            ) : (
                <>
                    <div className="px-3 py-2 border-b border-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Element Actions</div>
                    <button onClick={handleDeleteElement} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2">
                        <Icon name="trash" size={16} /><span>Remove Item</span>
                    </button>
                </>
            )}
        </div>
      )}
    </div>
  );
};

const DraggableElement: React.FC<{
  element: DocElement;
  isSelected: boolean;
  dragOffset: { x: number; y: number };
  onPointerDown: (e: React.PointerEvent) => void;
  onSelect: () => void;
  onResizePointerDown: (e: React.PointerEvent) => void;
  onTextChange: (text: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ element, isSelected, dragOffset, onPointerDown, onSelect, onResizePointerDown, onTextChange, onContextMenu }) => {
  const { dispatch } = useDocument();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && element.type === 'text' && element.content === 'Type here...' && elementRef.current) {
        const editable = elementRef.current.querySelector('[contenteditable]');
        if (editable) {
            (editable as HTMLElement).focus();
            const range = document.createRange();
            range.selectNodeContents(editable);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }
  }, [isSelected, element.type, element.content]);

  const visualLeft = mmToPx(element.x) + dragOffset.x;
  const visualTop = mmToPx(element.y) + dragOffset.y;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${visualLeft}px`,
    top: `${visualTop}px`,
    width: element.width ? `${mmToPx(element.width)}px` : 'auto',
    height: element.type !== 'text' && element.height ? `${mmToPx(element.height)}px` : 'auto',
    maxWidth: '100%',
    cursor: isSelected ? 'move' : 'pointer',
    touchAction: 'none', // Prevents browser scroll interaction
    
    fontFamily: element.style?.fontFamily,
    fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : undefined,
    fontWeight: element.style?.fontWeight,
    fontStyle: element.style?.fontStyle,
    textDecoration: element.style?.textDecoration,
    textAlign: element.style?.textAlign,
    color: element.style?.color,
    lineHeight: element.style?.lineHeight || 1.4,
    
    backgroundColor: element.style?.backgroundColor,
    padding: element.style?.padding ? `${element.style.padding}px` : undefined,
    border: element.style?.border || (isSelected ? '1px dashed #3b82f6' : '1px solid transparent'),
    borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
    listStyleType: element.style?.listStyleType,
    opacity: element.style?.opacity,
    
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: isSelected ? 20 : 10,
  };

  return (
    <div
      ref={elementRef}
      className={`draggable-element group ${isSelected ? 'z-20' : 'z-10'}`}
      style={style}
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()} 
      onContextMenu={onContextMenu}
    >
      {element.type === 'text' && (
        <div contentEditable suppressContentEditableWarning className="outline-none w-full h-full" style={{ cursor: 'text', minWidth: '20px' }}
            onBlur={(e) => onTextChange(e.currentTarget.innerText)}
            onPointerDown={(e) => { 
                // Allow interactions for text editing, but also ensure selection works
                // Text selection usually needs default behavior, so we might check if we are editing
                if (!isSelected) {
                   onSelect(); 
                } else {
                   e.stopPropagation(); // Stop propagation to avoid dragging parent if clicking inside text
                }
            }}
        >
          {element.content}
        </div>
      )}
      {element.type === 'image' && (
        <img src={element.content} alt="Upload" className="w-full h-full object-contain pointer-events-none select-none" />
      )}
      {element.type === 'rect' && (
        <div style={{ width: '100%', height: '100%', backgroundColor: element.style?.backgroundColor || 'transparent', border: element.style?.border || '2px solid black' }} />
      )}
      {element.type === 'line' && (
        <div style={{ width: '100%', height: `${Math.max(2, element.height || 2)}px`, backgroundColor: element.style?.color || '#000000' }} />
      )}

      {isSelected && (
        <>
            {/* Resize Handle - Bigger touch target for mobile */}
            <div 
                className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize z-30 shadow-sm flex items-center justify-center touch-none" 
                onPointerDown={onResizePointerDown}
            >
                <div className="w-2 h-2 bg-white rounded-full"/>
            </div>
            
            {/* Delete Button - Bigger touch target */}
            <button 
                className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-2 shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity z-40" 
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_ELEMENT', payload: element.id }); }}
            >
                <Icon name="x" size={12} />
            </button>
        </>
      )}
    </div>
  );
};