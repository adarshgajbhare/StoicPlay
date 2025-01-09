/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { compressImage } from "../utils/imageUtils";

function AddFeedModal({ isOpen, onClose, onAddFeed }) {
  const [feedName, setFeedName] = useState("");
  const [feedImage, setFeedImage] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("/default-thumb.webp");
  const [feedNameError, setFeedNameError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewImageUrl && previewImageUrl !== "/default-thumb.webp") {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (previewImageUrl && previewImageUrl !== "/default-thumb.webp") {
          URL.revokeObjectURL(previewImageUrl);
        }

        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, {
          type: "image/webp",
        });

        const newPreviewUrl = URL.createObjectURL(compressedBlob);
        setPreviewImageUrl(newPreviewUrl);
        setFeedImage(compressedFile);
      } catch (error) {
        console.error("Error processing image:", error);
        setPreviewImageUrl("/default-thumb.webp");
        setFeedImage(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!feedName.trim()) {
      setFeedNameError("The feed name cannot be empty");
      return;
    }

    await onAddFeed(feedName, feedImage);
    setFeedName("");
    setFeedImage(null);
    setPreviewImageUrl("/default-thumb.webp");
    onClose();
  };

  const handleFeedNameChange = (event) => {
    const value = event.target.value;
    const regex = /^[A-Za-z0-9_\-\s]*$/;

    if (regex.test(value)) {
      setFeedName(value);
      setFeedNameError("");
    } else {
      setFeedNameError("Feed name can only contain A-Z, 0-9, _, -, and  .");
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  if (!isOpen) return null;

  const imageUrl = feedImage
    ? URL.createObjectURL(feedImage)
    : "/default-thumb.webp";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-black ring-[1px] ring-white/10 p-6 rounded-md w-full max-w-md">
            <h2 className="text-2xl text-white font-medium tracking-tight mb-6">
              Create new feed
            </h2>
            <div className="mb-6">
              <label
                htmlFor="feedName"
                className="block text-white mb-3 tracking-tight text-lg/4"
              >
                What do you want to call it?
              </label>
              <input
                type="text"
                id="feedName"
                className="w-full p-3 text-white placeholder:text-white/35 ring-[1px] ring-white/20 bg-white/5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Space, Chess, Superheroes, etc."
                value={feedName}
                onChange={handleFeedNameChange}
              />
              {feedNameError && (
                <p className="text-red-500 text-sm mt-1">{feedNameError}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="feedImage"
                className="block mb-3 tracking-tight text-lg/4 text-white"
              >
                Set up a cover image
              </label>

              <div className="flex items-center space-x-4">
                <img
                  src={previewImageUrl}
                  alt="Feed thumbnail"
                  className="size-10 rounded-md ring-[1px] ring-white/20 object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid place-items-center text-pretty rounded-md text-lg/4 p-3 bg-[#303030] font-medium tracking-tight text-white/90 shadow-[inset_0px_2px_2px_0px_hsla(0,0%,0%,0.4)] drop-shadow-[0px_2px_0px_hsla(0,0%,100%,0.15)]"
                >
                  Select cover image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                className="bg-black ring-[1px] ring-white/20 flex-1 hover:bg-black/50 text-white font-medium tracking-tight text-lg/4 py-3 px-4 rounded-md"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-white hover:bg-white/50 flex-1 text-black font-medium tracking-tight text-lg/4 py-3 px-4 rounded-md"
                onClick={handleSubmit}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddFeedModal;
