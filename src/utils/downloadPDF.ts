
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';
import { pxToMm } from './unitConverter';

export const printPreview = () => {
  window.print();
};

export const downloadPDF = async (fileName: string = 'document.pdf') => {
  // Find all page elements
  const pages = document.querySelectorAll('.document-page');
  if (pages.length === 0) {
    console.error("No pages found");
    return;
  }

  // Initialize jsPDF
  let pdf: any = null;

  try {
    for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;
        
        // 1. Clone the element
        const clone = pageElement.cloneNode(true) as HTMLElement;
        
        // 2. Style clone for capture - Force exact dimensions based on offsetWidth/Height
        const width = pageElement.offsetWidth;
        const height = pageElement.offsetHeight;

        clone.style.width = `${width}px`;
        clone.style.height = `${height}px`;
        clone.style.transform = 'none'; // Reset scale
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.zIndex = '-9999';
        clone.style.margin = '0';
        clone.style.boxShadow = 'none';
        clone.style.backgroundColor = '#ffffff';
        
        // 3. REMOVE NO-PRINT ELEMENTS (The Blue Dotted Border & UI controls)
        const noPrintElements = clone.querySelectorAll('.no-print');
        noPrintElements.forEach(el => el.remove());

        // Remove selection boxes or drag handles if any were cloned
        const uiElements = clone.querySelectorAll('.z-30, .z-40, .z-50'); // Resize handles, delete buttons
        uiElements.forEach(el => el.remove());

        document.body.appendChild(clone);

        // 4. Capture with higher scale for better quality
        const canvas = await html2canvas(clone, {
            scale: 2, // 2x scale for sharpness
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: width,
            height: height
        });

        document.body.removeChild(clone);

        // 5. Add to PDF
        // Convert the captured canvas pixel dimensions back to mm for the PDF
        const imgWidthMm = pxToMm(width);
        const imgHeightMm = pxToMm(height);
        
        const orientation = imgWidthMm > imgHeightMm ? 'landscape' : 'portrait';

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i === 0) {
            // First page creates the PDF
            pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format: [imgWidthMm, imgHeightMm]
            });
        } else {
            // Subsequent pages add a new page
            pdf.addPage([imgWidthMm, imgHeightMm], orientation);
        }

        // Add image to cover the full PDF page
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
    }

    if (pdf) {
        pdf.save(fileName);
    }

  } catch (error) {
    console.error("PDF Generation failed:", error);
    alert("Failed to generate PDF.");
  }
};
