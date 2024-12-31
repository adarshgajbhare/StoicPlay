import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginPage from './src/pages/LoginPage';
import HomePage from './src/pages/HomePage';
import FeedPage from './src/pages/FeedPage';
import PlaylistPage from './src/pages/PlaylistPage';

import LearnMorePage from './src/pages/LearnMorePage';
import ShareRedirect from './src/components/ShareRedirect';
import PlaylistDetailPage from './src/components/PlaylistDetailPage';
import LikedVideosPage from './src/pages/LikedVideosPage';
import WatchLaterPage from './src/pages/WatchLaterPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          
          {/* Protected Routes */}
          <Route
            path="/feeds"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/feed/:feedName"
            element={
              <PrivateRoute>
                <FeedPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <PrivateRoute>
                <PlaylistPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/playlist/:playlistId"
            element={
              <PrivateRoute>
                <PlaylistDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/liked"
            element={
              <PrivateRoute>
                <LikedVideosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/watch-later"
            element={
              <PrivateRoute>
                <WatchLaterPage />
              </PrivateRoute>
            }
          />
          <Route path="/share/:shareId" element={<ShareRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return user ? <Navigate to="/feeds" /> : <Navigate to="/login" />;
}

export default App;