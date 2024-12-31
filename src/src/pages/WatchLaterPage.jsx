import React, { useState } from "react";
import Navbar from "../components/Navbar";

const WatchLaterPage = () => {

 const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="min-h-dvh bg-[#101010] text-white">
         <Navbar onImportClick={() => setShowImportModal(true)} />
      <h1 className="text-4xl font-bold text-white">
        Watch later coming soon....
      </h1>
    </div>
  );
};

export default WatchLaterPage;