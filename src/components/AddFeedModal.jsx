import { useState, useRef, useEffect } from "react";
import { compressImage } from "../utils/imageUtils";
import { IconX } from "@tabler/icons-react";

function AddFeedModal({ isOpen, onClose, onAddFeed, existingFeeds }) {
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

  const checkDuplicateFeedName = (name) => {
    return existingFeeds.some(
      feed => feed.name.toLowerCase() === name.trim().toLowerCase()
    );
  };

  const handleSubmit = async () => {
    if (!feedName.trim()) {
      setFeedNameError("The feed name cannot be empty");
      return;
    }

    if (checkDuplicateFeedName(feedName)) {
      setFeedNameError("This feed name already exists. Please choose a different name.");
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

    if (!regex.test(value)) {
      setFeedNameError("Feed name can only contain A-Z, 0-9, _, -, and spaces.");
      return;
    }

    setFeedName(value);
    
    if (checkDuplicateFeedName(value)) {
      setFeedNameError("This feed name already exists. Please choose a different name.");
    } else {
      setFeedNameError("");
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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#151515] ring-[1px] ring-white/10 p-6 rounded-md w-full max-w-md">
            <div className="flex justify-between items-center  mb-6">
              <h2 className="text-2xl text-white font-medium tracking-tight">
                Create new feed
              </h2>
              <button
                className="text-white/50 hover:text-white/75"
                onClick={onClose}
              >
                <IconX/>
              </button>
            </div>
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
                className={`w-full p-3 text-white placeholder:text-white/35 ring-[1px] ${
                  feedNameError ? 'ring-red-500' : 'ring-white/20'
                } bg-[#2B2B2B] rounded-md focus:outline-none focus:ring-2 ${
                  feedNameError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
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

            <div className="flex items-center  w-full">
            
              <button
                className={`${
                  feedNameError 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#3B82F6] hover:bg-white/50 cursor-pointer'
                }  text-white font-medium tracking-tight text-lg/4 py-3 px-4 rounded-md ml-auto w-fit`}
                onClick={handleSubmit}
                disabled={!!feedNameError}
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