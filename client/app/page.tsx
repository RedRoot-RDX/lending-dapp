"use client";

/* ------------------ Imports ----------------- */
import { Button } from "@/components/ui/button";
import { FlipWords } from "@/components/ui/flip-words";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import Link from "next/link";

/* ------------------- Page ------------------- */
export default function Home() {
  const words = ["This is Radish", "Built on Radix"];
  const description =
    "Multi-collateralized Lending DApp. Diversify your collateral and mint stablecoins for your financial needs.";

  return (
    <>
      <main className="p-4 flex flex-col justify-center flex-grow">
        <div className="h-full flex justify-center items-center px-4">
          <div className="text-center text-8xl font-normal text-primary">
            <FlipWords words={words} />
            {/* Description with limited width */}
            <p className="text-xl mt-4 max-w-xl mx-auto text-primary">{description}</p>
            {/* Button */}
            <Link href="/app">
              <Button className="px-10 py-8 text-lg bg-accent text-background">Launch App</Button>
            </Link>
          </div>
        </div>
      </main>

      <div className="absolute inset-0 pointer-events-none z-0">
        <ShootingStars />
        <StarsBackground />
      </div>
    </>
  );
}
