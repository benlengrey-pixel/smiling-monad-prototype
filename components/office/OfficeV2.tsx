"use client";

import { useRouter } from "next/navigation";

export default function OfficeV2() {
  const router = useRouter();

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <img
        src="/frontdoor.png"
        alt="The Smiling Monad"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      <button
        onClick={() => router.push("/office")}
        className="
          absolute
          bottom-12
          left-1/2
          -translate-x-1/2
          rounded-full
          bg-white/15
          px-10
          py-4
          text-xl
          font-semibold
          text-white
          backdrop-blur-md
          transition
          hover:bg-white/25
        "
      >
        Enter Office
      </button>
    </main>
  );
}