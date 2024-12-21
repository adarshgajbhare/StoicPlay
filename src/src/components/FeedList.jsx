import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

function FeedList({ feeds, onDeleteFeed }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {feeds.map((feed) => (
        <motion.div
          key={feed}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden"
        >
          <img
            src={localStorage.getItem(`${feed}-image`) || '/placeholder.png'}
            alt={feed}
            className="w-full h-40 object-cover"
          />
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">{feed}</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDeleteFeed(feed)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 size={20} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default FeedList;

