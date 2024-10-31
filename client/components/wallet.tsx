"use client";
import dynamic from 'next/dynamic';

const WalletButton = dynamic(
  () => import('./wallet-button').then((mod) => mod.WalletButton),
  { ssr: false }
);

export function Wallet() {
  return (
    <div className="rounded-radix-connect-radius">
      <WalletButton />
    </div>
  );
}
