"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
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
        aria-label="Enter Office"
        className="absolute inset-0 cursor-pointer"
      />
    </main>
  );
}