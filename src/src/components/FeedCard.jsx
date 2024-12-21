import { Link } from 'react-router-dom';

function FeedCard({ feedName, onDelete }) {
  const imageUrl = localStorage.getItem(`${feedName}-image`) || 'default-image.jpg';

  return (
    <div
      className="bg-cover bg-center h-48 rounded-lg relative"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <Link to={`/feed/${feedName}`}>
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          <h3 className="text-white text-xl font-bold mb-2">{feedName}</h3>
          <div className="flex space-x-2">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold px-3 py-1 rounded"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(feedName);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default FeedCard;