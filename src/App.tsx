
import React, { useState } from 'react';
import { DocumentProvider } from './store/documentStore';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';

import SubscriptionGuard from './components/SubscriptionGuard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'editor'>('dashboard');

  return (
    <SubscriptionGuard featureSlug="custom-letter">
      <DocumentProvider>
        {currentPage === 'dashboard' ? (
          <Dashboard onNewDocument={() => setCurrentPage('editor')} />
        ) : (
          <Editor onBack={() => setCurrentPage('dashboard')} />
        )}
      </DocumentProvider>
    </SubscriptionGuard>
  );
};

export default App;
