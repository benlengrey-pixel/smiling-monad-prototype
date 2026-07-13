"use client";

import { useRouter } from "next/navigation";

export default function OfficeBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="absolute left-3 top-3 z-30 rounded-full bg-black/45 px-4 py-2 text-sm text-white backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-white/80 sm:left-5 sm:top-5 sm:px-5 sm:py-3"
    >
      Back
    </button>
  );
}