import React from 'react';
import { EditorSidebar } from './EditorSidebar';

// This component is deprecated and replaced by EditorSidebar.
// We proxy props to EditorSidebar to maintain compatibility if mistakenly used.
export const PageSettings: React.FC<any> = (props) => {
  return <EditorSidebar {...props} activeTab="settings" onTabChange={() => {}} onApplyTemplate={() => {}} />;
};