import { PaperSize } from '../types';

export const PAPER_DIMENSIONS: Record<Exclude<PaperSize, 'Custom'>, { width: number; height: number }> = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
};

export const PIXELS_PER_MM = 3.78; // Approx 96 DPI

// Simplified to 3 distinct types as requested
export const DEFAULT_FONTS = [
  { name: 'Sans Serif (Inter)', value: 'Inter, sans-serif' },
  { name: 'Serif (Merriweather)', value: 'Merriweather, serif' },
  { name: 'Monospace (Roboto)', value: 'Roboto Mono, monospace' },
];