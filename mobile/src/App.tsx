import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MobileLayout } from './components/layout/MobileLayout';
import { MobileFeedPage } from './pages/MobileFeedPage';
import { MobileExplorePage } from './pages/MobileExplorePage';
import { MobileUploadPage } from './pages/MobileUploadPage';
import { MobileInboxPage } from './pages/MobileInboxPage';
import { MobileProfilePage } from './pages/MobileProfilePage';
import { MobileVideoDetailPage } from './pages/MobileVideoDetailPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path="/" element={<MobileFeedPage />} />
            <Route path="/explore" element={<MobileExplorePage />} />
            <Route path="/upload" element={<MobileUploadPage />} />
            <Route path="/inbox" element={<MobileInboxPage />} />
            <Route path="/profile" element={<MobileProfilePage />} />
            <Route path="/profile/:id" element={<MobileProfilePage />} />
            <Route path="/video/:id" element={<MobileVideoDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
