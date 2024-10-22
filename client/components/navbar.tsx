import { Wallet } from "@/components/wallet";
import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-background shadow-md">
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> */}
      <div className="container">
        <div className="flex flex-row items-center justify-between h-16">
          <div className="flex">
            <Link href="/" className="text-xl text-primary font-semibold">
              <Image
                src="/logo.png" // Path to your logo in the public folder
                alt="Logo"
                width={50} // Adjust the width of your logo
                height={50} // Adjust the height of your logo
                className="cursor-pointer"
              />
            </Link>
          </div>

          <div className="hidden md:flex space-x-4">
            <Link href="/app" className="text-primary hover:text-[#fb3640]">
              App
            </Link>
          </div>

          <Wallet />
        </div>
      </div>
    </nav>
  );
}
