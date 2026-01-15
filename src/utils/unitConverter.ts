import { PIXELS_PER_MM } from '../constants/paperSizes';

export const mmToPx = (mm: number): number => {
  return mm * PIXELS_PER_MM;
};

export const pxToMm = (px: number): number => {
  return px / PIXELS_PER_MM;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};