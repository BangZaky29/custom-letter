
import { DocElement } from "../types";
import logo from '../assets/NS_white_01.png';

// Helper to generate text element object
const createText = (
  content: string, 
  x: number, 
  y: number, 
  width: number, 
  fontSize: number = 12, 
  fontWeight: 'normal' | 'bold' = 'normal',
  textAlign: 'left' | 'center' | 'right' | 'justify' = 'left',
  textDecoration: string = 'none',
  fontStyle: 'normal' | 'italic' = 'normal',
  category: 'content' | 'header' = 'content'
): Omit<DocElement, 'id'> => ({
  type: 'text',
  x,
  y,
  width,
  height: 0,
  page: 0,
  content,
  category,
  style: {
    fontFamily: 'Inter, sans-serif',
    fontSize,
    fontWeight,
    fontStyle,
    textDecoration,
    textAlign,
    color: '#000000',
    backgroundColor: 'transparent',
    lineHeight: 1.5,
  }
});

// Helper for Kop Surat
export const getKopSuratElements = (targetPage: number = 0): Omit<DocElement, 'id'>[] => {
  const common = { page: targetPage, category: 'header' as const };
  
  return [
    // Logo (Left Aligned)
    {
      type: 'image',
      x: 15,
      y: 8,
      width: 28,
      height: 28,
      content: logo,
      ...common
    },
    // Header Text (Centered relative to page, shifted slightly right to balance logo if needed, 
    // but typically strict center is preferred for the text block)
    createText('PEMERINTAH PROVINSI BANTEN', 20, 10, 170, 14, 'bold', 'center', 'none', 'normal', 'header'),
    createText('DINAS PENDIDIKAN', 20, 16, 170, 16, 'bold', 'center', 'none', 'normal', 'header'),
    createText('Gedung Dinas Pendidikan Kawasan Pusat Pendidikan Provinsi Banten', 20, 23, 170, 10, 'normal', 'center', 'none', 'normal', 'header'),
    createText('Jl Syekh Nawawi Al Bantani KP3B Palima - Serang', 20, 27, 170, 10, 'normal', 'center', 'none', 'normal', 'header'),
    createText('0254-267064', 20, 31, 170, 10, 'normal', 'center', 'none', 'normal', 'header'),
    
    // Double Line Separator (Thicker visual style)
    {
      type: 'text',
      x: 15,
      y: 36,
      width: 180,
      height: 2,
      content: '',
      style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 1,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: 'transparent',
          border: '3px double black' // Using double border CSS style
      },
      ...common
    }
  ].map(el => ({...el, page: targetPage})) as Omit<DocElement, 'id'>[];
};

// Surat Kuasa Body
export const getSuratKuasaElements = (includeKop: boolean): Omit<DocElement, 'id'>[] => {
  const startY = includeKop ? 50 : 35; // Shift down if Kop is present
  const elements: Omit<DocElement, 'id'>[] = [];

  // 1. Title
  elements.push(
    createText('SURAT KUASA', 20, startY, 170, 14, 'bold', 'center', 'underline')
  );

  // 2. Intro
  elements.push(
    createText('Yang bertanda tangan di bawah ini:', 20, startY + 15, 170)
  );

  // 3. Pemberi Kuasa Details
  const pemberiY = startY + 25;
  const labelX = 20;
  const dotX = 55;
  const valueX = 60;
  const gap = 8;
  const widthVal = 130;

  const fieldsPemberi = ['Nama', 'NIK', 'Pekerjaan', 'Alamat'];
  
  fieldsPemberi.forEach((field, i) => {
    const yPos = pemberiY + (i * gap);
    elements.push(createText(field, labelX, yPos, 35));
    elements.push(createText(':', dotX, yPos, 5));
    elements.push(createText('....................................................................................', valueX, yPos, widthVal));
  });

  // 4. Bridge text
  const bridgeY = pemberiY + (fieldsPemberi.length * gap) + 5;
  elements.push(
    createText('Selanjutnya disebut sebagai PEMBERI KUASA.', 20, bridgeY, 170, 12, 'bold')
  );
  elements.push(
    createText('Dengan ini memberikan kuasa kepada:', 20, bridgeY + 10, 170)
  );

  // 5. Penerima Kuasa Details
  const penerimaY = bridgeY + 20;
  const fieldsPenerima = ['Nama', 'NIK', 'Pekerjaan', 'Alamat'];

  fieldsPenerima.forEach((field, i) => {
    const yPos = penerimaY + (i * gap);
    elements.push(createText(field, labelX, yPos, 35));
    elements.push(createText(':', dotX, yPos, 5));
    elements.push(createText('....................................................................................', valueX, yPos, widthVal));
  });

  // 6. Bridge Penerima
  const bridgePenerimaY = penerimaY + (fieldsPenerima.length * gap) + 5;
  elements.push(
    createText('Selanjutnya disebut sebagai PENERIMA KUASA.', 20, bridgePenerimaY, 170, 12, 'bold')
  );

  // 7. Khusus
  elements.push(
    createText('------------------------------------------ KHUSUS ------------------------------------------', 20, bridgePenerimaY + 15, 170, 12, 'bold', 'center', 'none', 'italic')
  );

  // 8. Purpose
  elements.push(
    createText('Untuk melakukan tindakan berupa...................................................................................................................................................................................................................................................................................................................................', 20, bridgePenerimaY + 25, 170)
  );

  // 9. Closing
  elements.push(
    createText('Demikian Surat Kuasa ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.', 20, bridgePenerimaY + 50, 170, 12, 'normal', 'justify')
  );

  // 10. Signatures
  const signY = bridgePenerimaY + 70;
  
  // Date (Right aligned generally)
  elements.push(
    createText('Jakarta, 15 Januari 2026', 110, signY, 80, 12, 'normal', 'center')
  );

  // Labels
  elements.push(
    createText('Penerima Kuasa', 20, signY + 10, 80, 12, 'normal', 'center')
  );
  elements.push(
    createText('Pemberi Kuasa', 110, signY + 10, 80, 12, 'normal', 'center')
  );

  // Materai Box (Visual guide)
  elements.push({
    type: 'text',
    x: 135,
    y: signY + 30,
    width: 30,
    height: 15,
    page: 0,
    content: 'MATERAI',
    style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#ccc',
        border: '1px solid #ccc',
        lineHeight: 3
    }
  });

  // Name Placeholders
  elements.push(
    createText('( NAMA LENGKAP )', 20, signY + 55, 80, 12, 'bold', 'center', 'underline')
  );
  elements.push(
    createText('( NAMA LENGKAP )', 110, signY + 55, 80, 12, 'bold', 'center', 'underline')
  );
  
  return elements;
};
