// src/components/ImportFeedModal.jsx
import React, { useState } from 'react';
import { importSharedFeed } from '../services/shareService';
import { useAuth } from "../contexts/AuthContext";

const ImportFeedModal = ({ isOpen, onClose, onImportFeed }) => {
  const [feedUrl, setFeedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleInputChange = (event) => {
    setFeedUrl(event.target.value);
    setError('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Extract shareId from URL
      const shareId = feedUrl.split('/share/')[1]?.trim();
      if (!shareId) {
        throw new Error('Invalid share URL');
      }

      await importSharedFeed(user.uid, shareId);
      onClose();
      window.location.reload(); // Refresh to show the new feed
    } catch (error) {
      console.error("Import error:", error);
      setError('Failed to import feed. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative bg-zinc-900 p-4 rounded-md shadow-lg w-80 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Import Feed</h3>
        <input
          type="text"
          placeholder="Paste feed URL"
          value={feedUrl}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-[#202020] text-white rounded-md mb-3 ring-1 ring-white/10 text-sm"
        />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-white text-sm rounded-md ring-1 ring-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md disabled:opacity-60"
          >
            {isLoading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportFeedModal;
