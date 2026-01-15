
import React, { useState } from 'react';
import { DocumentProvider } from './store/documentStore';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'editor'>('dashboard');

  return (
    <DocumentProvider>
      {currentPage === 'dashboard' ? (
        <Dashboard onNewDocument={() => setCurrentPage('editor')} />
      ) : (
        <Editor onBack={() => setCurrentPage('dashboard')} />
      )}
    </DocumentProvider>
  );
};

export default App;
