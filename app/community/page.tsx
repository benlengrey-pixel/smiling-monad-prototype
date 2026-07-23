"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addCommunityPost,
  readSmilingMonadState,
  subscribeToSmilingMonadState,
  type CommunityPost,
  type CommunityPostType,
} from "@/lib/platform/smiling-monad-state";

const socialLinks = [
  {
    name: "Facebook",
    href: "#",
  },
  {
    name: "Instagram",
    href: "#",
  },
  {
    name: "YouTube",
    href: "#",
  },
  {
    name: "LinkedIn",
    href: "#",
  },
];

function getTypeLabel(
  type: CommunityPostType,
): string {
  switch (type) {
    case "event":
      return "Event";

    case "announcement":
      return "Announcement";

    case "opportunity":
      return "Opportunity";

    case "request":
      return "Request";
  }
}

export default function CommunityPage() {
  const connectionsSectionRef =
    useRef<HTMLElement>(null);

  const noticeboardSectionRef =
    useRef<HTMLElement>(null);

  const [posts, setPosts] =
    useState<CommunityPost[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [composerOpen, setComposerOpen] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [body, setBody] =
    useState("");

  const [type, setType] =
    useState<CommunityPostType>(
      "announcement",
    );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const panel =
      new URLSearchParams(
        window.location.search,
      ).get("panel");

    window.setTimeout(() => {
      if (panel === "connections") {
        connectionsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      if (panel === "noticeboard") {
        noticeboardSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  }, []);

  useEffect(() => {
    const state =
      readSmilingMonadState();

    setPosts(state.communityPosts);
    setLoaded(true);

    return subscribeToSmilingMonadState(
      (nextState) => {
        setPosts(
          nextState.communityPosts,
        );
      },
    );
  }, []);

  const approvedPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "approved",
      ),
    [posts],
  );

  const submittedPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "submitted",
      ),
    [posts],
  );

  const draftPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "draft",
      ),
    [posts],
  );

  function submitPost() {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle || !cleanBody) {
      return;
    }

    addCommunityPost({
      title: cleanTitle,
      body: cleanBody,
      type,
      author: "Community member",
      status: "submitted",
    });

    setTitle("");
    setBody("");
    setType("announcement");
    setComposerOpen(false);
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#eaf2e5_0%,#f8f2e8_52%,#ead8c0_100%)] px-4 pb-14 pt-5 text-[#40352c] sm:px-8 sm:pt-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          href="/market"
          aria-label="Return to the Smiling Monad Market"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#7c6a58]/25 bg-white/75 text-xl shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          ←
        </Link>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#7d715f] sm:text-xs">
            The Smiling Monad Market
          </p>

          <h1 className="mt-1 font-serif text-2xl sm:text-4xl">
            Smiling Monad Community Centre
          </h1>
        </div>

        <Link
          href="/office"
          className="rounded-full border border-[#7c6a58]/25 bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          Space
        </Link>
      </header>

      <section
        ref={connectionsSectionRef}
        className="mx-auto mt-6 grid w-full max-w-6xl scroll-mt-6 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Link
          href="/connections"
          className="rounded-[24px] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        >
          <p className="font-serif text-2xl">
            People & Circles
          </p>

          <p className="mt-3 leading-7 text-[#6c5f52]">
            Find workers, providers and community
            members, and build trusted circles of
            support.
          </p>

          <p className="mt-4 text-sm font-semibold text-[#765943]">
            Open connections →
          </p>
        </Link>

        <Link
          href="/community/services"
          className="rounded-[24px] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        >
          <p className="font-serif text-2xl">
            Services Directory
          </p>

          <p className="mt-3 leading-7 text-[#6c5f52]">
            Search moderated support, professional
            and community services by location,
            accessibility and service type.
          </p>

          <p className="mt-4 text-sm font-semibold text-[#765943]">
            Find services →
          </p>
        </Link>

        <Link
          href="/school"
          className="rounded-[24px] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        >
          <p className="font-serif text-2xl">
            Worker Training
          </p>

          <p className="mt-3 leading-7 text-[#6c5f52]">
            Complete required training or open the
            full Smiling Monad Training Centre.
          </p>

          <p className="mt-4 text-sm font-semibold text-[#765943]">
            Open training →
          </p>
        </Link>

        <section className="rounded-[24px] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl">
          <p className="font-serif text-2xl">
            Community Trading
          </p>

          <p className="mt-3 leading-7 text-[#6c5f52]">
            A separate space for community offers,
            exchanges and local opportunities.
          </p>

          <p className="mt-4 text-sm text-[#806b55]">
            Trading tools will remain moderated and
            community-focused.
          </p>
        </section>
      </section>

      <section
        ref={noticeboardSectionRef}
        className="mx-auto mt-8 grid w-full max-w-6xl scroll-mt-6 gap-6 lg:grid-cols-[1fr_20rem]"
      >
        <div className="rounded-[30px] border border-white/70 bg-white/60 p-5 shadow-[0_22px_65px_rgba(74,55,36,0.12)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-serif text-3xl">
                What’s happening
              </p>

              <p className="mt-3 max-w-2xl leading-7 text-[#6c5f52]">
                Approved events, announcements,
                opportunities and requests from the
                Smiling Monad community appear here.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setComposerOpen(true)
              }
              className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728]"
            >
              Submit a post
            </button>
          </div>

          <div className="mt-8 space-y-4">
            {!loaded ? (
              <div className="rounded-[22px] border border-[#ded1c0] bg-[#fffaf3] p-5 text-[#746457]">
                Loading the noticeboard…
              </div>
            ) : approvedPosts.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                No approved community posts are
                visible yet.
              </div>
            ) : (
              approvedPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-[22px] border border-[#ded1c0] bg-[#fffaf3] p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e8dccb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#745c48]">
                      {getTypeLabel(
                        post.type,
                      )}
                    </span>

                    <span className="text-sm text-[#857568]">
                      {post.author}
                    </span>
                  </div>

                  <h2 className="mt-4 font-serif text-2xl">
                    {post.title}
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap leading-7 text-[#685b4f]">
                    {post.body}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur-xl">
            <p className="font-serif text-2xl">
              Social community
            </p>

            <p className="mt-3 leading-7 text-[#6b5e52]">
              Follow the official Smiling Monad
              community pages.
            </p>

            <div className="mt-5 space-y-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block rounded-[16px] border border-[#ddcfbe] bg-[#fffaf3] px-4 py-3 transition hover:bg-white"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-[#d6c5af] bg-[#efe3d2] p-5">
            <p className="font-serif text-xl">
              Posts are reviewed first
            </p>

            <p className="mt-3 leading-7 text-[#6a5b4e]">
              Every community submission must be
              checked before it becomes publicly
              visible. This helps protect privacy,
              safety and respectful participation.
            </p>
          </section>

          <Link
            href="/community/services"
            className="block rounded-[26px] border border-[#d6c5af] bg-[#efe3d2] p-5 transition hover:bg-[#e8d9c5]"
          >
            <p className="font-serif text-xl">
              Find a service
            </p>

            <p className="mt-3 leading-7 text-[#6a5b4e]">
              Browse approved listings or create a
              service profile for moderation.
            </p>

            <p className="mt-4 text-sm font-semibold text-[#765943]">
              Open Services Directory →
            </p>
          </Link>

          {submittedPosts.length > 0 && (
            <section className="rounded-[26px] border border-[#d5c4ad] bg-white/65 p-5">
              <p className="font-serif text-xl">
                Awaiting review
              </p>

              <p className="mt-2 text-sm leading-6 text-[#6f6255]">
                {submittedPosts.length}{" "}
                community post
                {submittedPosts.length === 1
                  ? ""
                  : "s"}{" "}
                submitted for moderation.
              </p>
            </section>
          )}

          {draftPosts.length > 0 && (
            <section className="rounded-[26px] border border-[#d5c4ad] bg-white/65 p-5">
              <p className="font-serif text-xl">
                Drafts prepared
              </p>

              <p className="mt-2 text-sm leading-6 text-[#6f6255]">
                {draftPosts.length}{" "}
                community draft
                {draftPosts.length === 1
                  ? ""
                  : "s"}{" "}
                saved but not submitted.
              </p>
            </section>
          )}
        </aside>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-[28px] border border-[#d6c6b2] bg-[#f4eadc]/80 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#806b55]">
              Smiling Monad Shop
            </p>

            <h2 className="mt-2 font-serif text-3xl">
              A few useful things
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-[#68594d]">
              Simple merchandise and direct access
              to training packs.
            </p>
          </div>

          <Link
            href="/shop"
            className="w-fit rounded-full border border-[#60432f]/25 bg-white/80 px-5 py-3 font-medium text-[#60432f] transition hover:bg-white"
          >
            View all items
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Jackets",
              description:
                "Simple Smiling Monad outerwear.",
            },
            {
              title: "T-shirts",
              description:
                "Comfortable everyday clothing.",
            },
            {
              title: "Coffee mugs",
              description:
                "A practical reminder to pause.",
            },
            {
              title: "Training packs",
              description:
                "Open the Training Centre for learning packages.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[20px] border border-[#ddcfbd] bg-white/85 p-5"
            >
              <p className="font-serif text-xl">
                {item.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-[#6c5e51]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative w-full max-w-xl rounded-[28px] border border-[#d8c7b1] bg-[#fffaf2] p-6 shadow-[0_30px_80px_rgba(35,24,15,0.42)] sm:p-8">
            <button
              type="button"
              onClick={() =>
                setComposerOpen(false)
              }
              aria-label="Close post form"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl transition hover:bg-[#e4d4bf]"
            >
              ×
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#846e58]">
              Community submission
            </p>

            <h2 className="mt-3 pr-12 font-serif text-3xl">
              Submit a post
            </h2>

            <p className="mt-3 leading-7 text-[#6c5e51]">
              Your post will be sent for review and
              will not appear publicly until it has
              been approved.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium">
                  Post type
                </span>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target
                        .value as CommunityPostType,
                    )
                  }
                  className="mt-2 w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                >
                  <option value="announcement">
                    Announcement
                  </option>

                  <option value="event">
                    Event
                  </option>

                  <option value="opportunity">
                    Opportunity
                  </option>

                  <option value="request">
                    Request for help
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Title
                </span>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="Give your post a clear title"
                  className="mt-2 w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Details
                </span>

                <textarea
                  value={body}
                  onChange={(event) =>
                    setBody(
                      event.target.value,
                    )
                  }
                  placeholder="Share the important details"
                  className="mt-2 min-h-40 w-full resize-none rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 leading-7 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={submitPost}
              disabled={
                !title.trim() ||
                !body.trim()
              }
              className="mt-6 w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit for review
            </button>
          </section>
        </div>
      )}
    </main>
  );
}