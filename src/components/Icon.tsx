
import React from 'react';
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Image,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  ChevronLeft,
  Menu,
  X,
  Check,
  AlertCircle,
  Palette,
  Minus,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Type,
  Eraser,
  Grid,
  Maximize,
  ChevronUp,
  ChevronDown,
  Printer,
  LayoutTemplate,
  Undo,
  Redo,
  Copy,
  Square,
  Calendar
} from 'lucide-react';

export type IconName = 
  | 'plus' | 'trash' | 'download' | 'file-text' | 'image' | 'settings' 
  | 'align-left' | 'align-center' | 'align-right' | 'align-justify'
  | 'bold' | 'italic' | 'underline' | 'chevron-left' | 'menu' | 'x' | 'check' | 'alert'
  | 'palette' | 'minus' | 'strikethrough' | 'highlighter' | 'list-ul' | 'list-ol' 
  | 'indent' | 'outdent' | 'type' | 'eraser' | 'border-all' | 'maximize' | 'arrow-up' | 'arrow-down'
  | 'printer' | 'template' | 'undo' | 'redo' | 'copy' | 'square' | 'calendar';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const iconMap: Record<IconName, React.ElementType> = {
  'plus': Plus,
  'trash': Trash2,
  'download': Download,
  'file-text': FileText,
  'image': Image,
  'settings': Settings,
  'align-left': AlignLeft,
  'align-center': AlignCenter,
  'align-right': AlignRight,
  'align-justify': AlignJustify,
  'bold': Bold,
  'italic': Italic,
  'underline': Underline,
  'chevron-left': ChevronLeft,
  'menu': Menu,
  'x': X,
  'check': Check,
  'alert': AlertCircle,
  'palette': Palette,
  'minus': Minus,
  'strikethrough': Strikethrough,
  'highlighter': Highlighter,
  'list-ul': List,
  'list-ol': ListOrdered,
  'indent': Indent,
  'outdent': Outdent,
  'type': Type,
  'eraser': Eraser,
  'border-all': Grid, 
  'maximize': Maximize,
  'arrow-up': ChevronUp,
  'arrow-down': ChevronDown,
  'printer': Printer,
  'template': LayoutTemplate,
  'undo': Undo,
  'redo': Redo,
  'copy': Copy,
  'square': Square,
  'calendar': Calendar
};

export const Icon: React.FC<IconProps> = ({ name, size = 20, className = '' }) => {
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <LucideIcon size={size} className={className} />;
};
