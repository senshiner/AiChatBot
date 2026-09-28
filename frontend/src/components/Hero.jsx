import { NavLink } from "react-router-dom";

const Hero = () => {
  return (
    <>
      <section className="relative flex flex-col items-center text-slate-900 dark:text-white text-sm font-poppins overflow-hidden">
        <div className="relative z-10 flex flex-col items-center px-6 pt-32 pb-24 text-center">
          <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-gray-50 rounded-full px-4 py-2">
            <div className="size-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Chat with our AI now</span>
          </div>

          <h1 className="text-center text-4xl leading-[68px] md:text-5xl md:leading-[70px] mt-4 font-semibold max-w-2xl text-slate-900 dark:text-white">Go Faster Then EveryOne</h1>

          <p className="text-center text-base max-w-lg mt-2 text-slate-600 dark:text-slate-300">Create Everyting With ChatBot Sendar</p>

          <div className="mt-8">
            <NavLink to="/chat" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition  px-7 h-11 rounded-full">
              Get started
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.166 10h11.667m0 0L9.999 4.165m5.834 5.833-5.834 5.834" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </NavLink>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
