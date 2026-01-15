
import { DocumentState, DocElement } from "../types";

export const downloadWORD = async (state: DocumentState, fileName: string = 'document.doc') => {
  const { width, height } = state.pageConfig;
  
  // Microsoft Word HTML Header with specific Namespaces
  const header = `
  <html xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
  xmlns="http://www.w3.org/TR/REC-html40">
  <head>
  <meta http-equiv=Content-Type content="text/html; charset=utf-8">
  <title>Document</title>
  <!--[if gte mso 9]>
  <xml>
  <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
  <!--
   @page {
    size: ${width}mm ${height}mm;
    margin: 0mm;
    mso-page-orientation: ${state.pageConfig.orientation};
   }
   @page Section1 {
    size: ${width}mm ${height}mm;
    margin: 0mm;
    mso-header-margin:0mm;
    mso-footer-margin:0mm;
    mso-paper-source:0;
   }
   div.Section1 {
    page:Section1;
    width: ${width}mm; 
    height: ${height}mm; 
   }
   /* Reset styles for consistency */
   p, h1, h2, h3, h4, h5, h6, div { margin: 0; padding: 0; }
  -->
  </style>
  </head>
  <body lang=EN-US style='tab-interval:36.0pt'>
  <div class=Section1 style='layout-grid:15.6pt'>
  `;
  
  const footer = "</div></body></html>";
  
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
      // If it's not the first page, add a page break
      if (i > 0) {
          bodyContent += `<br clear=all style='mso-special-character:line-break;page-break-before:always'>`;
      }

      // Container for the page - strictly sized
      bodyContent += `<div style="position: relative; width: ${width}mm; height: ${height}mm; overflow: hidden;">`;
      
      const pageElements = elementsByPage[i];
      
      pageElements.forEach(el => {
        // Map common styles
        const textAlign = el.style?.textAlign || 'left';
        let cssText = `position: absolute; left: ${el.x}mm; top: ${el.y}mm; width: ${el.width ? el.width + 'mm' : 'auto'}; z-index: ${el.type === 'text' ? 5 : 1};`;
        
        if (el.type === 'text') {
            // Text Styles
            const fontFamily = el.style?.fontFamily?.split(',')[0] || 'Arial';
            const fontSize = el.style?.fontSize ? `${el.style.fontSize}pt` : '12pt'; // Word prefers pt
            const fontWeight = el.style?.fontWeight || 'normal';
            const fontStyle = el.style?.fontStyle || 'normal';
            const textDecoration = el.style?.textDecoration || 'none';
            const color = el.style?.color || '#000000';
            const lineHeight = el.style?.lineHeight || 1.4;

            cssText += `font-family: '${fontFamily}', sans-serif; font-size: ${fontSize}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; text-align: ${textAlign}; color: ${color}; line-height: ${lineHeight};`;
            
            // For text alignment to work in absolute divs in Word, sometimes a paragraph wrapper helps
            bodyContent += `<div style="${cssText}"><p style="margin:0; text-align:${textAlign};">${el.content.replace(/\n/g, '<br/>')}</p></div>`;

        } else if (el.type === 'image') {
            cssText += `height: ${el.height}mm;`;
            bodyContent += `<img src="${el.content}" style="${cssText}" width="${el.width}" height="${el.height}" />`;

        } else if (el.type === 'rect') {
             const bgColor = el.style?.backgroundColor || 'transparent';
             const border = el.style?.border || '1px solid black';
             cssText += `height: ${el.height}mm; background-color: ${bgColor}; border: ${border};`;
             bodyContent += `<div style="${cssText}"></div>`;

        } else if (el.type === 'line') {
             const color = el.style?.color || '#000000';
             const h = Math.max(1, el.height || 1); // Minimum height for visibility
             // lines in HTML for Word are best done as border-top or thin divs
             cssText += `height: ${h}px; background-color: ${color};`;
             bodyContent += `<div style="${cssText}"></div>`;
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
  link.download = fileName.endsWith('.doc') ? fileName : `${fileName}.doc`; // Force .doc
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
