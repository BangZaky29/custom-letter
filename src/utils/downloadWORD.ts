import { DocumentState } from "../types";

export const downloadWORD = async (state: DocumentState, fileName: string = 'document.docx') => {
  // Use CSS @page to define paper size and margins for Word
  const { width, height, margins } = state.pageConfig;
  
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
xmlns:w='urn:schemas-microsoft-com:office:word' 
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Document</title>
<style>
  @page {
    size: ${width}mm ${height}mm;
    margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
  }
  div.Section1 {
    page: Section1;
  }
</style>
</head>
<body>
<div class="Section1" style="position: relative; width: ${width}mm; height: ${height}mm;">`;
  
  const footer = "</div></body></html>";
  
  let bodyContent = "";
  
  state.elements.forEach(el => {
    // Position elements relative to the page container
    // Word HTML support for absolute positioning is decent but not perfect.
    // We map the canvas coordinates directly.
    
    // Convert styles to inline CSS string
    const styleObj = {
        position: 'absolute',
        left: `${el.x}mm`,
        top: `${el.y}mm`,
        width: el.width ? `${el.width}mm` : 'auto',
        fontFamily: el.style?.fontFamily || 'inherit',
        fontSize: el.style?.fontSize ? `${el.style.fontSize}pt` : '12pt',
        fontWeight: el.style?.fontWeight || 'normal',
        fontStyle: el.style?.fontStyle || 'normal',
        textDecoration: el.style?.textDecoration || 'none',
        textAlign: el.style?.textAlign || 'left',
        color: el.style?.color || '#000000',
        lineHeight: el.style?.lineHeight || 1.4,
        zIndex: 1
    };
    
    const styleString = Object.entries(styleObj)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
        .join(';');

    if (el.type === 'text') {
      bodyContent += `<div style="${styleString}">${el.content}</div>`;
    } else if (el.type === 'image') {
      bodyContent += `<img src="${el.content}" style="${styleString}" />`;
    }
  });
  
  const sourceHTML = header + bodyContent + footer;
  
  const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};