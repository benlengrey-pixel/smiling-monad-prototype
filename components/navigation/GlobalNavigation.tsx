"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  exact?: boolean;
};

const primaryItems: NavigationItem[] = [
  {
    href: "/office",
    label: "Smiling Monad Space",
    description: "Return to Kimi and your main space.",
    exact: true,
  },
  {
    href: "/circle",
    label: "My Circles",
    description: "See every Circle you own or support.",
  },
  {
    href: "/community",
    label: "Community Centre",
    description: "Community posts, people and shared activity.",
    exact: true,
  },
  {
    href: "/community/services",
    label: "Services Directory",
    description: "Find services, make enquiries and save them to a Circle.",
  },
];

const secondaryItems: NavigationItem[] = [
  {
    href: "/market",
    label: "Community Market",
    description: "Open the main community spaces.",
    exact: true,
  },
  {
    href: "/connections",
    label: "People & Connections",
    description: "Find people, workers and community connections.",
  },
  {
    href: "/school",
    label: "Training Centre",
    description: "Training, worker pathways and learning resources.",
  },
  {
    href: "/wellbeing",
    label: "Wellbeing Centre",
    description: "Relaxation, meditation, music and gentle activities.",
  },
];

function isCurrentPath(
  pathname: string,
  item: NavigationItem,
): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  );
}

function NavigationLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavigationItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const current =
    isCurrentPath(pathname, item);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={
        current ? "page" : undefined
      }
      className={`block rounded-[20px] border px-4 py-4 transition focus:outline-none focus:ring-4 focus:ring-[#7b5c43]/20 ${
        current
          ? "border-[#785b43] bg-[#60432f] text-white shadow-md"
          : "border-[#ddcfbd] bg-white text-[#49382c] hover:-translate-y-0.5 hover:border-[#bca58b] hover:bg-[#fffdf9] hover:shadow-sm"
      }`}
    >
      <span className="block text-base font-semibold">
        {item.label}
      </span>

      <span
        className={`mt-1 block text-sm leading-6 ${
          current
            ? "text-white/78"
            : "text-[#75675a]"
        }`}
      >
        {item.description}
      </span>
    </Link>
  );
}

export default function GlobalNavigation() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] =
    useState(false);

  const hidden = useMemo(
    () =>
      pathname === "/" ||
      pathname.startsWith(
        "/sign-in",
      ) ||
      pathname.startsWith(
        "/security/",
      ),
    [pathname],
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, [open]);

  if (hidden) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        aria-label="Open app navigation"
        aria-expanded={open}
        className="fixed left-3 top-1/2 z-[1100] -translate-y-1/2 rounded-r-full rounded-l-[14px] border border-white/45 bg-[rgba(55,39,28,0.9)] px-3 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(27,18,12,0.3)] backdrop-blur-md transition hover:bg-[#3f2d20] focus:outline-none focus:ring-4 focus:ring-white/55 sm:left-5 sm:px-4"
      >
        <span
          aria-hidden="true"
          className="mr-2 text-base"
        >
          ☰
        </span>
        Menu
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1400]">
          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            aria-label="Close app navigation"
            className="absolute inset-0 bg-black/52 backdrop-blur-[2px]"
          />

          <aside
            aria-label="App navigation"
            className="absolute inset-y-0 left-0 w-[min(92vw,390px)] overflow-y-auto border-r border-white/35 bg-[#f4eadc] px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-[22px_0_70px_rgba(28,18,11,0.36)] sm:px-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#8a725d]">
                  The Smiling Monad
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#3f3025]">
                  Where would you like to go?
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                aria-label="Close navigation"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d4c2ad] bg-white text-2xl text-[#594334] transition hover:bg-[#fffaf3] focus:outline-none focus:ring-4 focus:ring-[#7b5c43]/20"
              >
                ×
              </button>
            </div>

            <section className="mt-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a725d]">
                Main places
              </p>

              <div className="space-y-3">
                {primaryItems.map(
                  (item) => (
                    <NavigationLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onNavigate={() =>
                        setOpen(false)
                      }
                    />
                  ),
                )}
              </div>
            </section>

            <section className="mt-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a725d]">
                More spaces
              </p>

              <div className="space-y-3">
                {secondaryItems.map(
                  (item) => (
                    <NavigationLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onNavigate={() =>
                        setOpen(false)
                      }
                    />
                  ),
                )}
              </div>
            </section>

            <p className="mt-8 rounded-[18px] border border-[#d8c7b2] bg-[#eadcc9] px-4 py-4 text-sm leading-6 text-[#695849]">
              <strong>My Circles</strong>{" "}
              always returns to the full list of Circles you can access. You no longer need to remember a hidden route or find a small switch button.
            </p>
          </aside>
        </div>
      ) : null}
    </>
  );
}