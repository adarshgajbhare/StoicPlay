import { useState } from 'react';

function AddFeedModal({ isOpen, onClose, onAddFeed }) {
  const [feedName, setFeedName] = useState('');
  const [feedImage, setFeedImage] = useState(null);

  const handleFeedNameChange = (event) => {
    setFeedName(event.target.value);
  };

  const handleImageChange = (event) => {
    setFeedImage(event.target.files[0]);
  };

  const handleSubmit = async () => {
    let imageUrl = 'default-image.jpg'; // Default image path
    if (feedImage) {
      imageUrl = await convertImageToBase64(feedImage);
    }

    onAddFeed(feedName, imageUrl);
    setFeedName('');
    setFeedImage(null);
    onClose();
  };

  const convertImageToBase64 = (imageFile) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(imageFile);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-700 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Create New Feed</h2>
        <div className="mb-4">
          <label htmlFor="feedName" className="block mb-2">
            Feed Name:
          </label>
          <input
            type="text"
            id="feedName"
            className="w-full px-3 py-2 text-gray-200 bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter feed name"
            value={feedName}
            onChange={handleFeedNameChange}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="feedImage" className="block mb-2">
            Background Image (Optional):
          </label>
          <input
            type="file"
            id="feedImage"
            className="text-gray-200"
            onChange={handleImageChange}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSubmit}
          >
            Save Feed
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddFeedModal;