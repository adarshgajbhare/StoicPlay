import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      setError("Failed to sign in with Google");
      console.error(error);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#050505] flex flex-col md:flex-row justify-between ">
      <div className="md:w-3/5">
        <div className="overflow-hidden relative h-[360px] md:h-[calc(100vh)]">
          <div className="inset-0 absolute size-full bg-gradient-to-t md:bg-gradient-to-l from-black md:from-5% to-transparent md:to-75%"></div>
          <img
            src="https://admin.sportshackster.com/WallPaperMedia/PlayerWallPaperImage/naruto-5_63858407056101.8.jpg"
            alt="ZenFeeds"
            className="object-cover w-full h-full object-center "
          />
        </div>
      </div>
      <div className="p-8 md:w-1/3  grow md:p-16 lg:p-24 xl:p-32">
        <h1 className="text-5xl md:text-8xl font-medium tracking-tighter text-white text-center my-2">
          hi. this is zenfeeds
        </h1>
        <p className="text-white text-center mx-auto font-medium text-xl/6 max-w-sm tracking-tight mb-8">
          zenfeeds is the place where youre in the control of the algorithm, and
          not the other way around.
        </p>

        {error && (
          <div className="bg-red-500 text-white  rounded-lg mb-2">{error}</div>
        )}

        <div className="hero-buttons md:ml-4 mt-12 flex w-full    flex-col items-center gap-3 ">
          <a
            href="#"
            onClick={handleGoogleSignIn}
            className="rounded-md bg-white px-6 py-4 text-lg/4 font-medium text-gray-950  w-full text-center  drop-shadow-md"
          >
            Sign up with Google
          </a>
          <a
            href="/learn-more"
            className="rounded-md bg-black  w-full text-center px-6 py-4 text-lg/4 font-medium text-white  shadow-[inset_0_0_1px_1px_rgba(255,255,255,1)] "
          >
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
