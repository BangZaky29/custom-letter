
import { DocumentState, DocElement } from "../types";

export const downloadWORD = async (state: DocumentState, fileName: string = 'document.docx') => {
  const { width, height } = state.pageConfig;
  
  // NOTE: Margins are set to 0 to ensure absolute positioning (x,y) from canvas maps exactly to Word page.
  // The user's "margins" in the editor are visual guides, but the content positions (x,y) are relative to the page edge.
  
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
xmlns:w='urn:schemas-microsoft-com:office:word' 
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Document</title>
<style>
  @page {
    size: ${width}mm ${height}mm;
    margin: 0; 
  }
  div.Section1 {
    page: Section1;
    margin: 0;
    padding: 0;
  }
  /* Style for page breaks */
  .page-break {
    page-break-before: always;
    mso-special-character: line-break;
  }
</style>
</head>
<body>`;
  
  const footer = "</body></html>";
  
  let bodyContent = "";

  // Group elements by page
  const elementsByPage: Record<number, DocElement[]> = {};
  for (let i = 0; i < state.pageCount; i++) {
      elementsByPage[i] = [];
  }
  
  state.elements.forEach(el => {
      const pageIndex = el.page || 0;
      if (!elementsByPage[pageIndex]) elementsByPage[pageIndex] = [];
      elementsByPage[pageIndex].push(el);
  });

  // Iterate pages
  for (let i = 0; i < state.pageCount; i++) {
      if (i > 0) {
          // Add page break before subsequent pages
          bodyContent += `<br clear=all style='mso-special-character:line-break;page-break-before:always'>`;
      }

      bodyContent += `<div class="Section1" style="position: relative; width: ${width}mm; height: ${height}mm;">`;
      
      const pageElements = elementsByPage[i];
      
      pageElements.forEach(el => {
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
        } else if (el.type === 'rect') {
             bodyContent += `<div style="position:absolute; left:${el.x}mm; top:${el.y}mm; width:${el.width}mm; height:${el.height}mm; border:${el.style?.border || '1px solid black'}; background-color:${el.style?.backgroundColor || 'transparent'};"></div>`;
        } else if (el.type === 'line') {
             bodyContent += `<div style="position:absolute; left:${el.x}mm; top:${el.y}mm; width:${el.width}mm; height:${Math.max(2, el.height || 2)}px; background-color:${el.style?.color || '#000000'};"></div>`;
        }
      });

      bodyContent += `</div>`;
  }
  
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
