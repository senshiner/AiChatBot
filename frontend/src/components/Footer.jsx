import { FaFacebookF, FaGithub, FaInstagram, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-b border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-6">
          <div className="tracking-tight text-xl font-bold flex items-center justify-center  gap-2 cursor-pointer">
            <svg width="36" height="30" viewBox="0 0 86 82" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M40.645 0S35.39 16.94 27.453 24.957C18.847 33.648 0 38.505 0 38.505h25.645c8.284 0 15-6.716 15-15zm0 82S35.39 65.06 27.453 57.043C18.847 48.352 0 43.495 0 43.495h25.645c8.284 0 15 6.716 15 15zm4.277-82s5.254 16.94 13.191 24.957c8.606 8.691 27.453 13.548 27.453 13.548H59.922c-8.284 0-15-6.716-15-15zm0 82s5.254-16.94 13.191-24.957c8.606-8.691 27.453-13.548 27.453-13.548H59.922c-8.284 0-15 6.716-15 15z"
                fill="currentColor"
              />
            </svg>
            CHATBOT SENDAR
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-4 mt-5 mb-5">
            <a className=" hover:-translate-y-0.5 duration-300 transition-all">
              <FaFacebookF className="text-slate-900 dark:text-white w-8 h-8 cursor-pointer" />
            </a>
            <a className=" hover:-translate-y-0.5 duration-300 transition-all">
              <FaGithub className="text-slate-900 dark:text-white w-8 h-8 cursor-pointer" />
            </a>
            <a className=" hover:-translate-y-0.5 duration-300 transition-all">
              <FaWhatsapp className="text-slate-900 dark:text-white w-8 h-8 cursor-pointer" />
            </a>
            <a className=" hover:-translate-y-0.5 duration-300 transition-all">
              <FaInstagram className="text-slate-900 dark:text-white w-8 h-8 cursor-pointer" />
            </a>
          </div>
        </div>

        <p className="text-center max-w-xl text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-400">Empowering creators worldwide with the most advanced AI content creation tools. Transform your ideas into reality.</p>
      </div>
      <div className="">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm font-normal text-slate-600 dark:text-slate-400">
          <a href="">SENDAR</a> ©2026. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
