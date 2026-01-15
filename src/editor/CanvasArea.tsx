import React, { useRef, useState } from 'react';
import { useDocument } from '../store/documentStore';
import { mmToPx, pxToMm } from '../utils/unitConverter';
import { DocElement } from '../types';
import { Icon } from '../components/Icon';

export const CanvasArea: React.FC = () => {
  const { state, dispatch } = useDocument();
  const { pageConfig, elements, selectedElementId, zoom } = state;
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Resizing State
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ w: 0, h: 0, x: 0, y: 0 });

  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  // Dimensions
  const pageWidthPx = mmToPx(pageConfig.width);
  const pageHeightPx = mmToPx(pageConfig.height);
  const margins = {
    top: mmToPx(pageConfig.margins.top),
    bottom: mmToPx(pageConfig.margins.bottom),
    left: mmToPx(pageConfig.margins.left),
    right: mmToPx(pageConfig.margins.right),
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (!element) return;

    dispatch({ type: 'SELECT_ELEMENT', payload: id });
    setActiveElementId(id);
    setIsDragging(true);

    // Initial mouse position
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (!element) return;

    dispatch({ type: 'SELECT_ELEMENT', payload: id });
    setActiveElementId(id);
    setIsResizing(true);
    
    setResizeStart({
      w: element.width,
      h: element.height,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeElementId) return;

    // Resizing Logic
    if (isResizing) {
      const deltaX = (e.clientX - resizeStart.x) / zoom;
      const deltaY = (e.clientY - resizeStart.y) / zoom;
      const deltaXmm = pxToMm(deltaX);
      const deltaYmm = pxToMm(deltaY);

      // Enforce minimum size
      const newWidth = Math.max(10, resizeStart.w + deltaXmm);
      const newHeight = Math.max(5, resizeStart.h + deltaYmm);

      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: {
          id: activeElementId,
          changes: { width: newWidth, height: newHeight }
        }
      });
      return;
    }

    // Dragging Logic
    if (isDragging) {
      const deltaX = (e.clientX - dragOffset.x) / zoom;
      const deltaY = (e.clientY - dragOffset.y) / zoom;
      const deltaXmm = pxToMm(deltaX);
      const deltaYmm = pxToMm(deltaY);

      const element = elements.find(el => el.id === activeElementId);
      if (element) {
        dispatch({
          type: 'UPDATE_ELEMENT',
          payload: {
            id: activeElementId,
            changes: {
              x: element.x + deltaXmm,
              y: element.y + deltaYmm,
            },
          },
        });
      }
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveElementId(null);
  };

  const handleBackgroundClick = () => {
    dispatch({ type: 'SELECT_ELEMENT', payload: null });
  };

  const handleTextChange = (id: string, newText: string) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id, changes: { content: newText } } });
  };

  return (
    <div 
      className="flex-1 bg-slate-100 overflow-auto flex justify-center p-4 md:p-12 relative touch-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
    >
      <div
        id="document-canvas"
        className="bg-white shadow-lg relative transition-transform origin-top duration-200"
        style={{
          width: `${pageWidthPx}px`,
          height: `${pageHeightPx}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Margins */}
        <div 
          className="absolute border border-dashed border-blue-200 pointer-events-none no-print opacity-50"
          style={{
            top: margins.top,
            left: margins.left,
            right: margins.right,
            bottom: margins.bottom,
          }}
        />

        {/* Elements */}
        {elements.map((el) => (
          <DraggableElement
            key={el.id}
            element={el}
            isSelected={selectedElementId === el.id}
            onMouseDown={(e) => handleMouseDown(e, el.id)}
            onResizeMouseDown={(e) => handleResizeMouseDown(e, el.id)}
            onTextChange={(text) => handleTextChange(el.id, text)}
          />
        ))}
      </div>
    </div>
  );
};

const DraggableElement: React.FC<{
  element: DocElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  onTextChange: (text: string) => void;
}> = ({ element, isSelected, onMouseDown, onResizeMouseDown, onTextChange }) => {
  const { dispatch } = useDocument();

  // Construct CSS from element.style properties
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${mmToPx(element.x)}px`,
    top: `${mmToPx(element.y)}px`,
    width: element.width ? `${mmToPx(element.width)}px` : 'auto',
    height: element.type === 'image' && element.height ? `${mmToPx(element.height)}px` : 'auto',
    maxWidth: '100%',
    cursor: isSelected ? 'move' : 'pointer',
    
    // Font & Text
    fontFamily: element.style?.fontFamily,
    fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : undefined,
    fontWeight: element.style?.fontWeight,
    fontStyle: element.style?.fontStyle,
    textDecoration: element.style?.textDecoration,
    textAlign: element.style?.textAlign,
    color: element.style?.color,
    lineHeight: element.style?.lineHeight || 1.4,
    letterSpacing: element.style?.letterSpacing ? `${element.style.letterSpacing}px` : undefined,
    
    // Block Styles
    backgroundColor: element.style?.backgroundColor,
    paddingLeft: element.style?.padding ? `${element.style.padding}px` : '4px', // Indent
    paddingRight: '4px',
    paddingTop: '4px',
    paddingBottom: '4px',
    border: element.style?.border || (isSelected ? '1px dashed #3b82f6' : '1px solid transparent'),
    borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
    
    // Lists
    display: element.style?.listStyleType && element.style.listStyleType !== 'none' ? 'list-item' : 'block',
    listStyleType: element.style?.listStyleType || 'none',
    listStylePosition: 'inside',
    
    boxSizing: 'border-box',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_ELEMENT', payload: element.id });
  };

  return (
    <div style={style} onMouseDown={onMouseDown} className="group relative select-none">
      {/* Delete Button */}
      {isSelected && (
        <div 
          className="absolute -top-3 -right-3 bg-white shadow-md border border-slate-100 rounded-full p-1 cursor-pointer hover:bg-red-50 z-20 no-print" 
          onClick={handleDelete}
        >
          <Icon name="trash" size={14} className="text-red-500" />
        </div>
      )}

      {/* Resize Handle (Bottom Right) */}
      {isSelected && (
        <div 
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize z-20 no-print border-2 border-white shadow-sm"
          onMouseDown={onResizeMouseDown}
        />
      )}

      {/* Content */}
      {element.type === 'text' ? (
        <div
          contentEditable
          suppressContentEditableWarning
          className="outline-none min-w-[20px] min-h-[1em] whitespace-pre-wrap h-full"
          onBlur={(e) => onTextChange(e.currentTarget.innerText)}
          onMouseDown={(e) => e.stopPropagation()} 
          dangerouslySetInnerHTML={{ __html: element.content }}
          style={{ cursor: 'text' }}
        />
      ) : (
        <img 
          src={element.content} 
          alt="Element" 
          className="w-full h-full object-fill pointer-events-none block" 
        />
      )}
    </div>
  );
};