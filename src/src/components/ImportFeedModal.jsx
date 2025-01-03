// src/components/ImportFeedModal.jsx
import React, { useState } from "react";
import { importSharedFeed } from "../services/shareService";
import { useAuth } from "../contexts/AuthContext";

const ImportFeedModal = ({ isOpen, onClose, onImportFeed }) => {
  const [feedUrl, setFeedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleInputChange = (event) => {
    setFeedUrl(event.target.value);
    setError("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Extract shareId from URL
      const shareId = feedUrl.split("/share/")[1]?.trim();
      if (!shareId) {
        throw new Error("Invalid share URL");
      }

      await importSharedFeed(user.uid, shareId);
      onClose();
      window.location.reload(); // Refresh to show the new feed
    } catch (error) {
      console.error("Import error:", error);
      setError("Failed to import feed. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-[#151515] p-8 rounded  shadow-xl w-96 ring-1 ring-white/20">
        <h3 className="text-xl font-medium text-white mb-4">Import Feed</h3>
        <input
          type="text"
          placeholder="Paste feed URL"
          value={feedUrl}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-[#101010] text-white rounded mb-4 ring-1 ring-white/20"
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="bg-black ring-[1px] ring-white/20 flex-1 hover:bg-red-500 text-white font-medium tracking-tight text-lg/4 py-3 px-4 rounded "
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-white   flex-1 text-black font-medium tracking-tight text-lg/4 py-3 px-4 rounded "
          >
            {isLoading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportFeedModal;
