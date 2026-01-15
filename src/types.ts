export type Orientation = 'portrait' | 'landscape';
export type PaperSize = 'A4' | 'A3' | 'A5' | 'A6' | 'Custom';
export type ElementType = 'text' | 'image';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface PageConfig {
  size: PaperSize;
  width: number; // in mm
  height: number; // in mm
  orientation: Orientation;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ElementStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: string; // 'none', 'underline', 'line-through', or combined
  textAlign: TextAlign;
  color: string;
  backgroundColor?: string; // Highlight
  lineHeight?: number;
  letterSpacing?: number;
  padding?: number; // Indent
  border?: string; // e.g. '1px solid black'
  borderRadius?: number;
  listStyleType?: string; // 'none', 'disc', 'decimal'
  opacity?: number;
}

export interface DocElement {
  id: string;
  type: ElementType;
  x: number; // in mm relative to page
  y: number; // in mm relative to page
  width: number; // in mm
  height: number; // in mm
  content: string; // Text content or Image Base64
  style?: ElementStyle;
}

export interface DocumentState {
  title: string;
  pageConfig: PageConfig;
  elements: DocElement[];
  selectedElementId: string | null;
  zoom: number;
}