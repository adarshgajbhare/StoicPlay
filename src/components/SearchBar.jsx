import React, { useState } from "react";
import { motion } from "framer-motion";
import { IconSearch } from "@tabler/icons-react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative p-2 bg-[#101010] shadow-[inset_0px_2px_2px_0px_hsla(0,0%,0%,0.4)] drop-shadow-[0px_2px_0px_hsla(0,0%,100%,0.15)] flex rounded-full">
        <IconSearch 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" 
          size={18}
        />
        <motion.input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="SpaceX, Apple, Tesla..."
          animate={{
            boxShadow: isFocused ? "0 0 0 2px rgba(255,255,255,0.1)" : "none"
          }}
          className="w-full pl-8 pr-4 py-2  text-white bg-transparent placeholder-white/40 
                     text-base rounded-full border-none outline-none
                     transition-all duration-200"
        />
        <button
        onClick={handleSubmit}
        className="text-sm/3 shadow-[inset_0px_1px_1px_0px_hsla(0,0%,0%,0.1)] drop-shadow-[0px_2px_0px_hsla(0,0%,100%,0.15)] px-6 text-white rounded-full bg-blue-500 hover:bg-blue-600 transition-colors">  
        Search
        </button>
      </div>
    </form>
  );
}

export default SearchBar;