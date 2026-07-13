import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <img
        src="/frontdoor.png"
        alt="The Smiling Monad front door"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <Link
        href="/office"
        aria-label="Enter Office"
        className="absolute inset-0 z-10"
      />
    </main>
  );
}