import { DocumentState } from "../types";

export const downloadEXCEL = (state: DocumentState) => {
  // Excel export is only enabled for table-like data.
  // Current Letter Generator doesn't strictly enforce tables, so this is a placeholder.
  alert("Excel export is currently only available for table-structured documents.");
};