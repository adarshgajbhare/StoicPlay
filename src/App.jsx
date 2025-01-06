import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import FeedPage from './pages/FeedPage'
import PlaylistPage from './pages/PlaylistPage'
import LearnMorePage from './pages/LearnMorePage'
import ShareRedirect from './components/ShareRedirect'
import PlaylistDetailPage from './components/PlaylistDetailPage'
import LikedVideosPage from './pages/LikedVideosPage'
import WatchLaterPage from './pages/WatchLaterPage'
import ImportFeedModal from './components/ImportFeedModal'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}

function App() {
  const [showImportModal, setShowImportModal] = useState(false)

  const handleImportFeed = async (feedUrl) => {
    console.log("Importing feed from URL:", feedUrl)
    alert(`Importing feed from ${feedUrl}. This feature is not fully implemented yet.`)
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/share/:shareId" element={<ShareRedirect />} />
          
          {/* Protected Routes with Layout */}
          <Route
            path="/feeds"
            element={
              <PrivateRoute>
                <Layout onImportClick={() => setShowImportModal(true)}>
                  <HomePage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/feed/:feedName"
            element={
              <PrivateRoute>
                <Layout onImportClick={() => setShowImportModal(true)}>
                  <FeedPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <PrivateRoute>
                <Layout onImportClick={() => setShowImportModal(true)}>
                  <PlaylistPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/playlist/:playlistId"
            element={
              <PrivateRoute>
                <Layout onImportClick={() => setShowImportModal(true)}>
                  <PlaylistDetailPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/liked"
            element={
              <PrivateRoute>
                <Layout onImportClick={() => setShowImportModal(true)}>
                  <LikedVideosPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/watch-later"
            element={
              <PrivateRoute>
                <Layout onImportClick={() => setShowImportModal(true)}>
                  <WatchLaterPage />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>

        {showImportModal && (
          <ImportFeedModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImportFeed={handleImportFeed}
          />
        )}
      </Router>
    </AuthProvider>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return user ? <Navigate to="/feeds" /> : <Navigate to="/login" />
}

export default App
