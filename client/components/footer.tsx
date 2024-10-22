/* ------------------ Imports ----------------- */
import { CodeBracketIcon } from "@heroicons/react/24/solid";

/* ----------------- Component ---------------- */
export function Footer() {
  return (
    <footer className="bg-[#070707] text-[#fcfff7] py-10">
      <div className="container mx-auto px-4 flex flex-col items-center space-y-4">
        <div className="flex space-x-6">
          <a
            href="https://github.com/Kirillr-Sibirski/radish"
            target="_blank"
            className="flex items-center space-x-2 hover:text-[#fb3640]"
          >
            <CodeBracketIcon className="w-6 h-6" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
