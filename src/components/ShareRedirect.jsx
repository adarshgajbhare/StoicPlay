import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { importSharedFeed } from '../services/shareService';

const ShareRedirect = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [isImportComplete, setIsImportComplete] = useState(false);

  useEffect(() => {
    const handleShare = async () => {
      try {
        if (!user) {
          localStorage.setItem('pendingShareId', shareId);
          navigate('/login');
          return;
        }

        await importSharedFeed(user.uid, shareId);
        setIsImportComplete(true); // Mark the import as complete
      } catch (error) {
        console.error("Error importing shared feed:", error);
        setError("Failed to import feed. The link may be invalid or expired.");
      }
    };

    handleShare();
  }, [shareId, user, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="bg-red-500 text-white p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (isImportComplete) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white text-lg">
          Feed successfully imported! You can now access it in your dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default ShareRedirect;
