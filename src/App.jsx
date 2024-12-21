import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './src/pages/HomePage';
import FeedPage from './src/pages/FeedPage';



function App() {
  return (
    <div className="bg-gray-800 text-gray-200 min-h-screen">
      <div className="container mx-auto py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed/:feedName" element={<FeedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;