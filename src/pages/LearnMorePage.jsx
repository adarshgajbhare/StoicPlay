/* eslint-disable no-unused-vars */
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { auth, provider } from "../lib/firebase";
import { Navigate, useNavigate } from "react-router-dom";
import { APP_NAME } from "../utils/constant";
import { IconChevronLeft } from "@tabler/icons-react";

const LearnMorePage = () => {
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      Navigate("/");
    } catch (error) {
      setError("Failed to sign in with Google");
      console.error(error);
    }
  };
  return (
    <>
      <div className="min-h-dvh text-white overflow-hidden bg-[#050505] p-6 md:p-10 ">
        <div className="fixed top-2 left-2 md:top-4 md:left-4 z-50 flex items-center gap-1 cursor-pointer">
          <a href="/login" className="flex items-center gap-1">
            <IconChevronLeft className="text-2xl ml-2 md:text-3xl lg:text-4xl text-white" />
            <span className="text-xl/4 font-medium tracking-tight">
              Back to Homepage
            </span>
          </a>
        </div>
        <div className="max-w-xl mt-6 ">
          <h1 className="text-2xl  md:text-4xl  font-medium max-w-3xl text-base text-balance tracking-tight text-left my-2 md:my-2">
            {APP_NAME}, Take Back the control from the Algorithm
          </h1>
          <p className="text-base/6 md:text-xl/7 text-left text-pretty   mb-4 ">
            Imagine a world where you're in charge of your video feed, not some
            faceless algorithm bent on keeping you glued to your screen. That's
            {APP_NAME}.
          </p>
          <div className="text-left space-y-4 lg:space-y-8">
            <div>
              <h2 className="text-xl/4 my-3 lg:text-2xl font-medium text-pretty">
                Why {APP_NAME}?
              </h2>
              <ul className="text-left text-nowrap list-none w-4/5 lg:w-3/5 space-y-2  mt-2">
                <li>
                  <span className="text-base/6 lg:text-xl/7">🎯</span>{" "}
                  <span className="font-medium text-pretty">
                    Escape the Rabbit Hole
                  </span>
                  <br />
                  <span className="ml-6 lg:ml-8">
                    No more endless autoplay.
                  </span>
                </li>
                <li>
                  <span className="text-base/6 lg:text-xl/7">🛠️</span>{" "}
                  <span className="font-medium text-pretty">
                    Control the Narrative
                  </span>
                  <br />
                  <span className="ml-6 lg:ml-8">
                    Watch your favorites on <em>your</em> terms.
                  </span>
                </li>
                <li>
                  <span className="text-base/6 lg:text-xl/7">🌿</span>{" "}
                  <span className="font-medium text-pretty">
                    Digital Minimalism
                  </span>
                  <br />
                  <span className="ml-6 lg:ml-8">
                    Curate a clean, focused feed.
                  </span>
                </li>
              </ul>
            </div>
            <p className="text-base/6 md:text-xl/7  max-w-2xl ">
              You don't need to quit YouTube to escape its traps. With {APP_NAME},
              reconnect with your favorite creators, rediscover purposeful
              browsing, and log off <em>on your schedule</em>.
            </p>
          </div>
          {error && (
            <div className="text-red-500 rounded-md mt-2 lg:mt-8">
              Oops! {error}
            </div>
          )}

          <div className="hero-buttons mt-6 flex w-full md:max-w-md   flex-col items-center gap-3 ">
            <a
              href="#"
              onClick={handleGoogleSignIn}
              className="
              
              rounded-md bg-white px-6 py-4 text-base/4 font-medium text-gray-950  w-full text-center  drop-shadow-md
              "
            >
              Sign up with Google
            </a>
            <a
              href="/learn-more"
              className="rounded-md bg-black  w-full text-center px-6 py-4 text-base/4 font-medium text-white  shadow-[inset_0_0_1px_1px_rgba(255,255,255,1)] "
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default LearnMorePage;
