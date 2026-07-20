"use client";

import {
  useEffect,
} from "react";

export default function SignOutPage() {
  useEffect(() => {
    try {
      for (
        let index =
          window.localStorage.length - 1;
        index >= 0;
        index -= 1
      ) {
        const key =
          window.localStorage.key(
            index,
          );

        if (
          key &&
          (
            key.startsWith("sb-") ||
            key.toLowerCase().includes(
              "supabase",
            )
          )
        ) {
          window.localStorage.removeItem(
            key,
          );
        }
      }

      for (
        let index =
          window.sessionStorage.length - 1;
        index >= 0;
        index -= 1
      ) {
        const key =
          window.sessionStorage.key(
            index,
          );

        if (
          key &&
          (
            key.startsWith("sb-") ||
            key.toLowerCase().includes(
              "supabase",
            )
          )
        ) {
          window.sessionStorage.removeItem(
            key,
          );
        }
      }

      document.cookie
        .split(";")
        .forEach((cookie) => {
          const name =
            cookie
              .split("=")[0]
              ?.trim();

          if (
            name &&
            (
              name.startsWith("sb-") ||
              name
                .toLowerCase()
                .includes("supabase")
            )
          ) {
            document.cookie =
              `${name}=; Max-Age=0; path=/`;
          }
        });
    } finally {
      window.location.replace(
        "/sign-in",
      );
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
      <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
          Smiling Monad
        </p>

        <p className="mt-3 text-lg font-semibold">
          Signing out…
        </p>
      </div>
    </main>
  );
}
