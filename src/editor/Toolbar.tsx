import React from 'react';
import { useDocument } from '../store/documentStore';
import { Icon } from '../components/Icon';
import { DEFAULT_FONTS } from '../constants/paperSizes';
import { ElementStyle } from '../types';

export const Toolbar: React.FC = () => {
  const { state, dispatch } = useDocument();
  const { selectedElementId, elements } = state;

  const selectedElement = elements.find(el => el.id === selectedElementId);

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
  };

  const getStyle = <K extends keyof ElementStyle>(key: K): ElementStyle[K] => {
    return selectedElement?.style?.[key] ?? defaultStyle[key];
  };

  const updateStyle = (key: keyof ElementStyle, value: any) => {
    if (!selectedElementId) return;
    const currentStyle = selectedElement?.style || defaultStyle;
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: {
        id: selectedElementId,
        changes: {
          style: {
            ...currentStyle,
            [key]: value,
          },
        },
      },
    });
  };

  const isDisabled = !selectedElement || selectedElement.type !== 'text';

  // Toggle helpers
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

  // --- COMPONENT BLOCKS ---

  const FontFace = () => (
    <select 
      className="text-xs border border-slate-300 rounded px-1.5 py-1 outline-none focus:border-blue-500 bg-white w-32"
      value={getStyle('fontFamily')}
      onChange={(e) => updateStyle('fontFamily', e.target.value)}
      disabled={isDisabled}
    >
      {DEFAULT_FONTS.map(font => (
        <option key={font.value} value={font.value}>{font.name}</option>
      ))}
    </select>
  );

  const FontSize = () => (
    <div className="flex items-center gap-1">
      <select 
        className="text-xs border border-slate-300 rounded px-1 py-1 outline-none focus:border-blue-500 bg-white w-12"
        value={getStyle('fontSize')}
        onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
        disabled={isDisabled}
      >
        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 32, 48, 72].map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      <div className="flex border border-slate-300 rounded bg-white overflow-hidden">
        <button 
          className="px-1.5 hover:bg-slate-50 border-r border-slate-200 text-slate-600 disabled:opacity-50"
          onClick={() => updateStyle('fontSize', (getStyle('fontSize') || 16) + 1)}
          disabled={isDisabled}
        >
          <span className="text-xs font-bold">A^</span>
        </button>
        <button 
          className="px-1.5 hover:bg-slate-50 text-slate-600 disabled:opacity-50"
          onClick={() => updateStyle('fontSize', Math.max(1, (getStyle('fontSize') || 16) - 1))}
          disabled={isDisabled}
        >
          <span className="text-xs">Aˇ</span>
        </button>
      </div>
    </div>
  );

  const FontStyles = () => (
    <div className="flex gap-0.5">
      <button 
        onClick={() => updateStyle('fontWeight', getStyle('fontWeight') === 'bold' ? 'normal' : 'bold')}
        disabled={isDisabled}
        className={`p-1 rounded hover:bg-slate-100 ${getStyle('fontWeight') === 'bold' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
      >
        <Icon name="bold" size={14} />
      </button>
      <button 
        onClick={() => updateStyle('fontStyle', getStyle('fontStyle') === 'italic' ? 'normal' : 'italic')}
        disabled={isDisabled}
        className={`p-1 rounded hover:bg-slate-100 ${getStyle('fontStyle') === 'italic' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
      >
        <Icon name="italic" size={14} />
      </button>
      <button 
        onClick={() => toggleDecoration('underline')}
        disabled={isDisabled}
        className={`p-1 rounded hover:bg-slate-100 ${hasDecoration('underline') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
      >
        <Icon name="underline" size={14} />
      </button>
       <button 
        onClick={() => toggleDecoration('line-through')}
        disabled={isDisabled}
        className={`p-1 rounded hover:bg-slate-100 ${hasDecoration('line-through') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
      >
        <Icon name="strikethrough" size={14} />
      </button>
    </div>
  );

  const Colors = () => (
    <div className="flex gap-1 items-center">
      {/* Highlight Color */}
      <div className="relative group flex items-center justify-center p-1 rounded hover:bg-slate-100 cursor-pointer">
        <Icon name="highlighter" size={14} className="text-yellow-600" />
        <div className="absolute bottom-1 w-4 h-1 bg-yellow-300 opacity-50"></div>
        <input 
          type="color"
          value={getStyle('backgroundColor') || '#ffffff'}
          onChange={(e) => updateStyle('backgroundColor', e.target.value)}
          disabled={isDisabled}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          title="Highlight Color"
        />
      </div>
      
      {/* Text Color */}
      <div className="relative group flex flex-col items-center justify-center p-1 rounded hover:bg-slate-100 cursor-pointer">
        <span className="font-serif font-bold text-sm leading-none">A</span>
        <div className="w-4 h-1 mt-0.5" style={{ backgroundColor: getStyle('color') }}></div>
        <input 
          type="color"
          value={getStyle('color')}
          onChange={(e) => updateStyle('color', e.target.value)}
          disabled={isDisabled}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          title="Font Color"
        />
      </div>
    </div>
  );

  const ClearFormatting = () => (
     <button 
        onClick={() => {
           // Reset styles
           dispatch({
             type: 'UPDATE_ELEMENT',
             payload: { id: selectedElementId!, changes: { style: defaultStyle } }
           })
        }}
        disabled={isDisabled}
        className="p-1 rounded hover:bg-slate-100 text-slate-600"
        title="Clear Formatting"
      >
        <Icon name="eraser" size={14} />
      </button>
  );

  const ListControls = () => (
    <div className="flex gap-0.5">
      <button 
        onClick={() => updateStyle('listStyleType', getStyle('listStyleType') === 'disc' ? 'none' : 'disc')}
        disabled={isDisabled}
        className={`p-1 rounded hover:bg-slate-100 ${getStyle('listStyleType') === 'disc' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
      >
        <Icon name="list-ul" size={14} />
      </button>
       <button 
        onClick={() => updateStyle('listStyleType', getStyle('listStyleType') === 'decimal' ? 'none' : 'decimal')}
        disabled={isDisabled}
        className={`p-1 rounded hover:bg-slate-100 ${getStyle('listStyleType') === 'decimal' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
      >
        <Icon name="list-ol" size={14} />
      </button>
    </div>
  );

  const IndentControls = () => (
    <div className="flex gap-0.5">
       <button 
        onClick={() => updateStyle('padding', Math.max(0, (getStyle('padding') || 0) - 10))}
        disabled={isDisabled}
        className="p-1 rounded hover:bg-slate-100 text-slate-600"
        title="Decrease Indent"
      >
        <Icon name="indent" size={14} />
      </button>
       <button 
        onClick={() => updateStyle('padding', (getStyle('padding') || 0) + 10)}
        disabled={isDisabled}
        className="p-1 rounded hover:bg-slate-100 text-slate-600"
        title="Increase Indent"
      >
        <Icon name="outdent" size={14} />
      </button>
    </div>
  );

  const Alignment = () => (
     <div className="flex gap-0.5">
      {(['left', 'center', 'right', 'justify'] as const).map((align) => (
        <button 
          key={align}
          onClick={() => updateStyle('textAlign', align)}
          disabled={isDisabled}
          className={`p-1 rounded hover:bg-slate-100 ${getStyle('textAlign') === align ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
        >
          <Icon name={`align-${align}`} size={14} />
        </button>
      ))}
    </div>
  );

  const BoxFormatting = () => (
    <div className="flex gap-0.5 items-center">
       <div className="flex flex-col items-center">
         <span className="text-[10px] text-slate-400 leading-none mb-0.5">Line</span>
         <div className="flex border border-slate-200 rounded">
            <button 
              className="p-0.5 hover:bg-slate-50" 
              onClick={() => updateStyle('lineHeight', Math.min(3, (getStyle('lineHeight') || 1.4) + 0.2))}
            ><Icon name="arrow-up" size={10}/></button>
            <button 
              className="p-0.5 hover:bg-slate-50 border-l border-slate-200"
              onClick={() => updateStyle('lineHeight', Math.max(0.8, (getStyle('lineHeight') || 1.4) - 0.2))}
            ><Icon name="arrow-down" size={10}/></button>
         </div>
       </div>

       <div className="w-px h-6 bg-slate-200 mx-1"></div>

       <button 
          onClick={() => updateStyle('border', getStyle('border') !== 'none' ? 'none' : '1px solid black')}
          disabled={isDisabled}
          className={`p-1 rounded hover:bg-slate-100 ${getStyle('border') !== 'none' && getStyle('border') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
          title="Borders"
        >
          <Icon name="border-all" size={14} />
        </button>
    </div>
  );

  return (
    <>
      {/* 
        -----------------------------------
        MOBILE TOOLBAR (Simpler, horizontal scroll)
        -----------------------------------
      */}
      <div className="md:hidden w-full h-14 bg-white flex items-center px-4 gap-3 overflow-x-auto no-scrollbar border-b border-slate-100">
        <select 
          className="text-xs border border-slate-300 rounded px-1 py-1 w-24"
          value={getStyle('fontFamily')}
          onChange={(e) => updateStyle('fontFamily', e.target.value)}
          disabled={isDisabled}
        >
          {DEFAULT_FONTS.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
        </select>
        <div className="w-px h-6 bg-slate-200 shrink-0" />
        <FontStyles />
        <div className="w-px h-6 bg-slate-200 shrink-0" />
        <Colors />
        <div className="w-px h-6 bg-slate-200 shrink-0" />
        <Alignment />
        <div className="w-px h-6 bg-slate-200 shrink-0" />
        <ListControls />
      </div>


      {/* 
        -----------------------------------
        DESKTOP RIBBON TOOLBAR
        -----------------------------------
      */}
      <div className="hidden md:flex w-full h-24 bg-[#f3f4f6] border-b border-slate-300 items-start px-2 py-1 select-none">
        
        {/* GROUP: FONT */}
        <div className="flex flex-col h-full px-2 border-r border-slate-300/50">
          <div className="flex-1 flex gap-3 pt-1">
             {/* Col 1: Font Face & Size */}
             <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                   <FontFace />
                   <FontSize />
                </div>
                <div className="flex gap-1 items-center">
                   <FontStyles />
                   {/* Sub/Superscript Mocks for visual completeness */}
                   <span className="text-slate-300 text-xs px-1 select-none">x₂ x²</span> 
                </div>
             </div>

             {/* Col 2: Colors & Clear */}
             <div className="flex flex-col justify-between py-0.5">
                <div className="flex justify-end">
                   <ClearFormatting />
                </div>
                <Colors />
             </div>
          </div>
          <div className="text-[10px] text-slate-500 text-center font-medium mt-1 -mb-0.5">Font</div>
        </div>

        {/* GROUP: PARAGRAPH */}
        <div className="flex flex-col h-full px-3 border-r border-slate-300/50">
           <div className="flex-1 flex gap-4 pt-1">
              {/* Col 1: Bullets & Indent */}
              <div className="flex flex-col gap-1.5">
                 <div className="flex gap-1">
                    <ListControls />
                    <IndentControls />
                 </div>
                 <div className="flex">
                    <Alignment />
                 </div>
              </div>

              {/* Col 2: Box & Spacing */}
              <div className="flex flex-col gap-1.5">
                 <BoxFormatting />
              </div>
           </div>
           <div className="text-[10px] text-slate-500 text-center font-medium mt-1 -mb-0.5">Paragraph</div>
        </div>

        {/* GROUP: STYLES (Mock) */}
        <div className="flex flex-col h-full px-3 border-r border-slate-300/50 opacity-60 grayscale cursor-not-allowed">
           <div className="flex-1 flex gap-1 items-center pt-1">
               <div className="w-12 h-10 bg-white border border-slate-200 flex items-center justify-center text-xs">Normal</div>
               <div className="w-12 h-10 bg-white border border-slate-200 flex items-center justify-center text-xs font-bold">No Space</div>
               <div className="w-12 h-10 bg-white border border-slate-200 flex items-center justify-center text-xs text-blue-600 font-bold">Header 1</div>
           </div>
           <div className="text-[10px] text-slate-500 text-center font-medium mt-1 -mb-0.5">Styles</div>
        </div>

      </div>
    </>
  );
};