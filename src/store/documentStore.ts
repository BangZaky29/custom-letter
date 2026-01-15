
import React, { createContext, useContext, useReducer, Dispatch, useMemo } from 'react';
import { DocumentState, DocElement, PageConfig, PaperSize, Orientation } from '../types';
import { PAPER_DIMENSIONS } from '../constants/paperSizes';
import { generateId } from '../utils/unitConverter';
import { getKopSuratElements } from '../templateSurat/surat-kuasa';

// Initial Configuration
const initialPageConfig: PageConfig = {
  size: 'A4',
  width: PAPER_DIMENSIONS.A4.width,
  height: PAPER_DIMENSIONS.A4.height,
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
};

const initialDocState: DocumentState = {
  title: "Untitled Document",
  pageConfig: initialPageConfig,
  pageCount: 1,
  elements: [],
  selectedIds: [],
  zoom: 1,
  headerActive: false,
};

// History Wrapper State
interface HistoryState {
  past: DocumentState[];
  present: DocumentState;
  future: DocumentState[];
  clipboard: DocElement[] | null; // Clipboard can now hold multiple
}

const initialHistoryState: HistoryState = {
  past: [],
  present: initialDocState,
  future: [],
  clipboard: null
};

// Actions
type Action =
  | { type: 'RENAME_DOCUMENT'; payload: string }
  | { type: 'SET_PAGE_SIZE'; payload: { size: PaperSize; width?: number; height?: number } }
  | { type: 'SET_ORIENTATION'; payload: Orientation }
  | { type: 'SET_MARGINS'; payload: Partial<PageConfig['margins']> }
  | { type: 'ADD_ELEMENT'; payload: Omit<DocElement, 'id'> }
  | { type: 'ADD_MULTIPLE_ELEMENTS'; payload: Omit<DocElement, 'id'>[] }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; changes: Partial<DocElement> } }
  | { type: 'UPDATE_MULTIPLE_ELEMENTS'; payload: { ids: string[]; changes: Partial<DocElement> } }
  | { type: 'MOVE_ELEMENTS'; payload: { ids: string[]; dxMm: number; dyMm: number } }
  | { type: 'REMOVE_ELEMENT'; payload: string }
  | { type: 'REMOVE_SELECTED' }
  | { type: 'SELECT_ELEMENT'; payload: string | null } // Single Select (clears others)
  | { type: 'TOGGLE_SELECTION'; payload: string } // Ctrl+Click
  | { type: 'SET_SELECTION'; payload: string[] } // Marquee / Batch
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'LOAD_DOCUMENT'; payload: DocumentState }
  | { type: 'ADD_PAGE' }
  | { type: 'REMOVE_PAGE'; payload?: number }
  | { type: 'TOGGLE_HEADER'; payload: boolean }
  // History Actions
  | { type: 'UNDO' }
  | { type: 'REDO' }
  // Clipboard Actions
  | { type: 'COPY' }
  | { type: 'PASTE' };

// Internal reducer for DocumentState (logic only)
const docReducerLogic = (state: DocumentState, action: Action): DocumentState => {
  switch (action.type) {
    case 'RENAME_DOCUMENT':
      return { ...state, title: action.payload };
    case 'SET_PAGE_SIZE': {
      let width = state.pageConfig.width;
      let height = state.pageConfig.height;

      if (action.payload.size !== 'Custom' && PAPER_DIMENSIONS[action.payload.size as keyof typeof PAPER_DIMENSIONS]) {
        const dims = PAPER_DIMENSIONS[action.payload.size as keyof typeof PAPER_DIMENSIONS];
        if (state.pageConfig.orientation === 'landscape') {
          width = dims.height;
          height = dims.width;
        } else {
          width = dims.width;
          height = dims.height;
        }
      } else if (action.payload.width && action.payload.height) {
        width = action.payload.width;
        height = action.payload.height;
      }

      return {
        ...state,
        pageConfig: { ...state.pageConfig, size: action.payload.size, width, height },
      };
    }
    case 'SET_ORIENTATION': {
      const isLandscape = action.payload === 'landscape';
      const currentIsLandscape = state.pageConfig.width > state.pageConfig.height;
      let width = state.pageConfig.width;
      let height = state.pageConfig.height;
      if (isLandscape !== currentIsLandscape) {
         const temp = width; width = height; height = temp;
      }
      return {
        ...state,
        pageConfig: { ...state.pageConfig, orientation: action.payload, width, height },
      };
    }
    case 'SET_MARGINS':
      return {
        ...state,
        pageConfig: { ...state.pageConfig, margins: { ...state.pageConfig.margins, ...action.payload } },
      };
    case 'ADD_ELEMENT': {
      const newId = generateId();
      return {
        ...state,
        elements: [...state.elements, { ...action.payload, id: newId }],
        selectedIds: [newId], // Auto-select new
      };
    }
    case 'ADD_MULTIPLE_ELEMENTS':
      return {
        ...state,
        elements: [
          ...state.elements, 
          ...action.payload.map(el => ({ ...el, id: generateId() }))
        ],
        selectedIds: [],
      };
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.payload.id ? { ...el, ...action.payload.changes } : el
        ),
      };
    case 'UPDATE_MULTIPLE_ELEMENTS':
      return {
        ...state,
        elements: state.elements.map((el) =>
          action.payload.ids.includes(el.id) ? { ...el, ...action.payload.changes } : el
        ),
      };
    case 'MOVE_ELEMENTS':
      return {
        ...state,
        elements: state.elements.map(el => {
           if (action.payload.ids.includes(el.id)) {
               return {
                   ...el,
                   x: el.x + action.payload.dxMm,
                   y: el.y + action.payload.dyMm
               }
           }
           return el;
        })
      };
    case 'REMOVE_ELEMENT':
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.payload),
        selectedIds: state.selectedIds.filter(id => id !== action.payload),
      };
    case 'REMOVE_SELECTED':
      return {
        ...state,
        elements: state.elements.filter(el => !state.selectedIds.includes(el.id)),
        selectedIds: []
      };
    case 'SELECT_ELEMENT':
      return { ...state, selectedIds: action.payload ? [action.payload] : [] };
    case 'TOGGLE_SELECTION': {
        const id = action.payload;
        const exists = state.selectedIds.includes(id);
        const newSelection = exists 
            ? state.selectedIds.filter(sid => sid !== id)
            : [...state.selectedIds, id];
        return { ...state, selectedIds: newSelection };
    }
    case 'SET_SELECTION':
        return { ...state, selectedIds: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };
    case 'ADD_PAGE': {
      const newPageIndex = state.pageCount;
      let newElements = [...state.elements];
      
      if (state.headerActive) {
          const headerElements = getKopSuratElements(newPageIndex).map(el => ({...el, id: generateId()}));
          newElements = [...newElements, ...headerElements];
      }

      return { 
          ...state, 
          pageCount: state.pageCount + 1,
          elements: newElements
      };
    }
    case 'REMOVE_PAGE': {
        if (state.pageCount <= 1) return state;

        const pageToRemove = action.payload !== undefined ? action.payload : state.pageCount - 1;
        
        // 1. Remove elements on this page
        let updatedElements = state.elements.filter(el => el.page !== pageToRemove);

        // 2. Shift elements on higher pages down
        updatedElements = updatedElements.map(el => {
            if (el.page > pageToRemove) {
                return { ...el, page: el.page - 1 };
            }
            return el;
        });

        return {
            ...state,
            pageCount: state.pageCount - 1,
            elements: updatedElements,
            selectedIds: [] // Clear selection to avoid ghost ids
        };
    }
    case 'TOGGLE_HEADER': {
        const isActive = action.payload;
        let updatedElements = [...state.elements];

        if (isActive) {
            updatedElements = updatedElements.filter(el => el.category !== 'header');
            for (let i = 0; i < state.pageCount; i++) {
                const headerEls = getKopSuratElements(i).map(el => ({...el, id: generateId()}));
                updatedElements = [...updatedElements, ...headerEls];
            }
        } else {
            updatedElements = updatedElements.filter(el => el.category !== 'header');
        }

        return {
            ...state,
            headerActive: isActive,
            elements: updatedElements
        };
    }
    case 'LOAD_DOCUMENT':
      return action.payload;
    default:
      return state;
  }
};

// Main Reducer with History Support
const historyReducer = (state: HistoryState, action: Action): HistoryState => {
  const { past, present, future, clipboard } = state;

  // Actions that should NOT create a history entry
  if (
      action.type === 'SELECT_ELEMENT' || 
      action.type === 'TOGGLE_SELECTION' ||
      action.type === 'SET_SELECTION' ||
      action.type === 'SET_ZOOM' || 
      action.type === 'COPY'
    ) {
    if (action.type === 'COPY') {
       // Copy all selected elements
       const selected = present.elements.filter(el => present.selectedIds.includes(el.id));
       return { ...state, clipboard: selected.length > 0 ? selected : null };
    }
    
    return {
      ...state,
      present: docReducerLogic(present, action)
    };
  }

  // Undo
  if (action.type === 'UNDO') {
    if (past.length === 0) return state;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    return {
      past: newPast,
      present: previous,
      future: [present, ...future],
      clipboard
    };
  }

  // Redo
  if (action.type === 'REDO') {
    if (future.length === 0) return state;
    const next = future[0];
    const newFuture = future.slice(1);
    return {
      past: [...past, present],
      present: next,
      future: newFuture,
      clipboard
    };
  }

  // Paste
  if (action.type === 'PASTE') {
    if (!clipboard || clipboard.length === 0) return state;
    
    // Paste multiple elements, offset slightly
    const newElements = clipboard.map(el => ({
        ...el,
        id: generateId(),
        x: el.x + 5,
        y: el.y + 5
    }));
    
    const newPresent = {
        ...present,
        elements: [...present.elements, ...newElements],
        selectedIds: newElements.map(el => el.id) // Select the pasted items
    };

    return {
        past: [...past, present],
        present: newPresent,
        future: [],
        clipboard
    };
  }

  // Normal Action (updates state and pushes to history)
  const newPresent = docReducerLogic(present, action);
  
  if (newPresent === present) return state;

  return {
    past: [...past, present],
    present: newPresent,
    future: [], 
    clipboard
  };
};

// Context
const DocumentContext = createContext<{
  state: DocumentState;
  dispatch: Dispatch<Action>;
  canUndo: boolean;
  canRedo: boolean;
}>({ 
  state: initialDocState, 
  dispatch: () => null,
  canUndo: false,
  canRedo: false
});

// Provider
export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [historyState, dispatch] = useReducer(historyReducer, initialHistoryState);

  const value = useMemo(() => ({
    state: historyState.present,
    dispatch,
    canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0
  }), [historyState]);

  return React.createElement(
    DocumentContext.Provider,
    { value },
    children
  );
};

// Hook
export const useDocument = () => useContext(DocumentContext);
