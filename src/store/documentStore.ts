import React, { createContext, useContext, useReducer, Dispatch } from 'react';
import { DocumentState, DocElement, PageConfig, PaperSize, Orientation } from '../types';
import { PAPER_DIMENSIONS } from '../constants/paperSizes';
import { generateId } from '../utils/unitConverter';

// Initial State
const initialPageConfig: PageConfig = {
  size: 'A4',
  width: PAPER_DIMENSIONS.A4.width,
  height: PAPER_DIMENSIONS.A4.height,
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
};

const initialState: DocumentState = {
  title: "Untitled Document",
  pageConfig: initialPageConfig,
  elements: [],
  selectedElementId: null,
  zoom: 1,
};

// Actions
type Action =
  | { type: 'RENAME_DOCUMENT'; payload: string }
  | { type: 'SET_PAGE_SIZE'; payload: { size: PaperSize; width?: number; height?: number } }
  | { type: 'SET_ORIENTATION'; payload: Orientation }
  | { type: 'SET_MARGINS'; payload: Partial<PageConfig['margins']> }
  | { type: 'ADD_ELEMENT'; payload: Omit<DocElement, 'id'> }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; changes: Partial<DocElement> } }
  | { type: 'REMOVE_ELEMENT'; payload: string }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'LOAD_DOCUMENT'; payload: DocumentState };

// Reducer
const documentReducer = (state: DocumentState, action: Action): DocumentState => {
  switch (action.type) {
    case 'RENAME_DOCUMENT':
      return {
        ...state,
        title: action.payload,
      };
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
        pageConfig: {
          ...state.pageConfig,
          size: action.payload.size,
          width,
          height,
        },
      };
    }
    case 'SET_ORIENTATION': {
      // Swap width and height if orientation changes
      const isLandscape = action.payload === 'landscape';
      const currentIsLandscape = state.pageConfig.width > state.pageConfig.height;
      
      let width = state.pageConfig.width;
      let height = state.pageConfig.height;

      if (isLandscape !== currentIsLandscape) {
         const temp = width;
         width = height;
         height = temp;
      }

      return {
        ...state,
        pageConfig: {
          ...state.pageConfig,
          orientation: action.payload,
          width,
          height,
        },
      };
    }
    case 'SET_MARGINS':
      return {
        ...state,
        pageConfig: {
          ...state.pageConfig,
          margins: { ...state.pageConfig.margins, ...action.payload },
        },
      };
    case 'ADD_ELEMENT':
      return {
        ...state,
        elements: [...state.elements, { ...action.payload, id: generateId() }],
        selectedElementId: null, // Optional: select new element
      };
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.payload.id ? { ...el, ...action.payload.changes } : el
        ),
      };
    case 'REMOVE_ELEMENT':
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.payload),
        selectedElementId: null,
      };
    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: action.payload,
      };
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: action.payload,
      };
    case 'LOAD_DOCUMENT':
      return action.payload;
    default:
      return state;
  }
};

// Context
const DocumentContext = createContext<{
  state: DocumentState;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

// Provider
export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(documentReducer, initialState);

  return React.createElement(
    DocumentContext.Provider,
    { value: { state, dispatch } },
    children
  );
};

// Hook
export const useDocument = () => useContext(DocumentContext);