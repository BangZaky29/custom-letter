import { PaperSize } from '../types';

export const PAPER_DIMENSIONS: Record<Exclude<PaperSize, 'Custom'>, { width: number; height: number }> = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
};

export const PIXELS_PER_MM = 3.78; // Approx 96 DPI

export const DEFAULT_FONTS = [
  { name: 'Inter (Sans)', value: 'Inter, sans-serif' },
  { name: 'Merriweather (Serif)', value: 'Merriweather, serif' },
  { name: 'Roboto Mono (Mono)', value: 'Roboto Mono, monospace' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
];