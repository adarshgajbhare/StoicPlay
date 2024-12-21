function VideoCard({ video }) {
    const videoId = video.snippet.resourceId.videoId;
    const videoTitle = video.snippet.title;
    const videoThumbnail = video.snippet.thumbnails.medium.url;
    const publishedAt = new Date(video.snippet.publishedAt);
    const channelImageUrl = video.channelDetails
      ? video.channelDetails.thumbnails.default.url
      : 'default-image.jpg'; // Provide path to default image
  
    const timeSinceRelease = calculateTimeSinceRelease(publishedAt);
  
    return (
      <div className="border border-gray-600 rounded-lg flex flex-col">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={videoThumbnail}
            alt={videoTitle}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        </a>
        <div className="p-3 flex flex-col flex-grow">
          <div className="flex items-start mb-2">
            <img
              src={channelImageUrl}
              alt="Channel"
              className="w-10 h-10 rounded-full mr-2"
            />
            <p className="text-sm font-medium flex-grow">{videoTitle}</p>
          </div>
          <p className="text-xs text-gray-400 mt-auto">{timeSinceRelease}</p>
        </div>
      </div>
    );
  }
  
  function calculateTimeSinceRelease(publishedAt) {
    // ... (same function from feed.js)
  }
  
  export default VideoCard;


