// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';
import { mmToPx, pxToMm } from './unitConverter';

export const printPreview = () => {
  // Uses the browser's native print preview which we've styled with @media print in index.html
  // to only show the canvas.
  window.print();
};

export const downloadPDF = async (fileName: string = 'document.pdf') => {
  const element = document.getElementById('document-canvas');
  if (!element) {
    console.error("Canvas element not found");
    return;
  }

  try {
    // 1. Clone the element to render it without zoom/scaling interference
    const clone = element.cloneNode(true) as HTMLElement;
    
    // 2. Style the clone to be fixed size (A4/etc) and off-screen
    // We remove the transform scale to get high resolution 1:1 render
    clone.style.transform = 'none';
    clone.style.position = 'fixed';
    clone.style.top = '-10000px';
    clone.style.left = '-10000px';
    clone.style.zIndex = '-1';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    
    // Append to body so html2canvas can find it
    document.body.appendChild(clone);

    // 3. Capture with html2canvas
    const canvas = await html2canvas(clone, {
      scale: 2, // High resolution
      useCORS: true, // For images
      backgroundColor: '#ffffff',
      logging: false,
    });

    // 4. Clean up clone
    document.body.removeChild(clone);

    // 5. Generate PDF with jsPDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Calculate dimensions based on the canvas size
    // We assume the canvas width/height in px corresponds to the mm size via our unit converter
    const imgWidthMm = pxToMm(element.offsetWidth);
    const imgHeightMm = pxToMm(element.offsetHeight);

    // Initialize jsPDF with the correct orientation and size
    const orientation = imgWidthMm > imgHeightMm ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [imgWidthMm, imgHeightMm]
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(fileName);

  } catch (error) {
    console.error("PDF Generation failed:", error);
    alert("Failed to generate PDF. Please try the 'Print Preview' option and save as PDF.");
  }
};