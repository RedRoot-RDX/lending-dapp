"use client";
/* ------------------ Imports ----------------- */

/* ----------------- Component ---------------- */
export function Wallet() {
  return (
    <div className="rounded-radix-connect-radius">
      <div className="" dangerouslySetInnerHTML={{ __html: `<radix-connect-button />` }} />
    </div>
  );
}
