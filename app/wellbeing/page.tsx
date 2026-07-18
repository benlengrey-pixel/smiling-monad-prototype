"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WellbeingActivity =
  | "relax"
  | "meditate"
  | "yoga"
  | "cards"
  | "music";

type ActivityDetails = {
  title: string;
  subtitle: string;
  prompt: string;
  items: string[];
};

type YogaRoutine = {
  id: string;
  title: string;
  duration: string;
  description: string;
  steps: string[];
};

type MemoryCard = {
  id: string;
  symbol: string;
  matched: boolean;
};

type MusicOption = {
  id: string;
  title: string;
  description: string;
  href: string;
};

const musicOptions: MusicOption[] = [
  {
    id: "ocean",
    title: "Ocean sounds",
    description:
      "Gentle waves and coastal ambience.",
    href:
      "https://www.youtube.com/results?search_query=calming+ocean+sounds",
  },
  {
    id: "rain",
    title: "Rain sounds",
    description:
      "Soft rain for rest and quiet focus.",
    href:
      "https://www.youtube.com/results?search_query=calming+rain+sounds",
  },
  {
    id: "forest",
    title: "Forest sounds",
    description:
      "Birdsong, leaves and natural ambience.",
    href:
      "https://www.youtube.com/results?search_query=calming+forest+sounds",
  },
  {
    id: "meditation",
    title: "Meditation music",
    description:
      "Slow instrumental music for reflection.",
    href:
      "https://www.youtube.com/results?search_query=gentle+meditation+music",
  },
];

const yogaRoutines: YogaRoutine[] = [
  {
    id: "seated-stretch",
    title: "Seated Stretch",
    duration: "5 minutes",
    description:
      "A gentle chair-based sequence for shoulders, neck, spine and breathing.",
    steps: [
      "Sit comfortably with both feet supported.",
      "Take three slow breaths and let your shoulders soften.",
      "Roll your shoulders backwards five times.",
      "Gently turn your head left and right without forcing.",
      "Reach both arms forward, then relax them by your side.",
      "Finish with one slow breath in and out.",
    ],
  },
  {
    id: "standing-balance",
    title: "Standing Balance",
    duration: "5 minutes",
    description:
      "A simple supported balance routine using a wall or chair.",
    steps: [
      "Stand beside a wall or sturdy chair.",
      "Place both feet comfortably apart.",
      "Shift your weight slowly from left to right.",
      "Lift one heel, then the other.",
      "Hold the chair and raise one foot slightly if comfortable.",
      "Return both feet to the floor and breathe slowly.",
    ],
  },
  {
    id: "gentle-mobility",
    title: "Gentle Mobility",
    duration: "8 minutes",
    description:
      "Easy movements for wrists, ankles, shoulders, hips and spine.",
    steps: [
      "Circle each wrist slowly five times.",
      "Point and flex each foot.",
      "Roll your shoulders gently.",
      "Turn your upper body slightly left and right.",
      "Lift one knee at a time while seated or standing.",
      "Finish by shaking out your hands and relaxing.",
    ],
  },
  {
    id: "floor-sequence",
    title: "Short Floor Sequence",
    duration: "10 minutes",
    description:
      "A calm beginner sequence for people who are comfortable getting onto the floor.",
    steps: [
      "Sit or kneel comfortably on a mat.",
      "Place your hands forward and lengthen your back gently.",
      "Move onto hands and knees if comfortable.",
      "Slowly round and soften your spine.",
      "Return to sitting and stretch your legs comfortably.",
      "Lie down or sit quietly for three slow breaths.",
    ],
  },
];

const activities: Record<
  WellbeingActivity,
  ActivityDetails
> = {
  relax: {
    title: "Relaxation",
    subtitle:
      "Short tools for settling your body and slowing things down.",
    prompt:
      "Choose one simple reset. There is nothing to complete.",
    items: [
      "One-minute breathing reset",
      "Five things grounding exercise",
      "Calming visual timer",
      "Nature sounds",
    ],
  },

  meditate: {
    title: "Guided Meditation",
    subtitle:
      "Quiet sessions for rest, reflection and remembering who you are.",
    prompt:
      "Choose a length that feels comfortable today.",
    items: [
      "2-minute pause",
      "5-minute grounding meditation",
      "10-minute body scan",
      "20-minute Remember Who You Are",
    ],
  },

  yoga: {
    title: "Yoga Basics",
    subtitle:
      "Gentle movement with seated, standing and floor-based options.",
    prompt:
      "Move only within a comfortable range. Rest whenever needed.",
    items: [
      "Seated stretch",
      "Standing balance",
      "Gentle mobility",
      "Short floor sequence",
    ],
  },

  cards: {
    title: "Cards & Gentle Play",
    subtitle:
      "Simple games for focus, enjoyment and quiet connection.",
    prompt:
      "Play alone, with Kimi or with someone in your Circle.",
    items: [
      "Solitaire",
      "Memory match",
      "Higher or lower",
      "Simple two-player cards",
    ],
  },

  music: {
    title: "Music",
    subtitle:
      "Open a favourite platform or choose a calming sound.",
    prompt:
      "Use your own account and saved playlists where available.",
    items: [
      "Spotify",
      "YouTube Music",
      "Apple Music",
      "Nature and meditation sounds",
    ],
  },
};

function createMemoryCards(): MemoryCard[] {
  const symbols = ["☀", "☾", "♥", "★"];

  return symbols
    .flatMap((symbol, index) => [
      {
        id: `${index}-a`,
        symbol,
        matched: false,
      },
      {
        id: `${index}-b`,
        symbol,
        matched: false,
      },
    ])
    .sort(() => Math.random() - 0.5);
}

export default function WellbeingPage() {
  const [activeActivity, setActiveActivity] =
    useState<WellbeingActivity | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const activity =
      new URLSearchParams(
        window.location.search,
      ).get("activity");

    const validActivities: WellbeingActivity[] = [
      "relax",
      "meditate",
      "yoga",
      "cards",
      "music",
    ];

    if (
      activity &&
      validActivities.includes(
        activity as WellbeingActivity,
      )
    ) {
      setActiveActivity(
        activity as WellbeingActivity,
      );
    }
  }, []);

  const [breathingActive, setBreathingActive] =
    useState(false);

  const [activeRelaxationTool, setActiveRelaxationTool] =
    useState<
      "breathing" | "grounding" | "timer" | null
    >(null);

  const [groundingStep, setGroundingStep] =
    useState(0);

  const [relaxTimerSeconds, setRelaxTimerSeconds] =
    useState(60);

  const [relaxTimerRunning, setRelaxTimerRunning] =
    useState(false);

  const [meditationMinutes, setMeditationMinutes] =
    useState(5);

  const [meditationSecondsLeft, setMeditationSecondsLeft] =
    useState(5 * 60);

  const [meditationRunning, setMeditationRunning] =
    useState(false);

  const [activeYogaRoutine, setActiveYogaRoutine] =
    useState<YogaRoutine | null>(null);

  const [activeYogaStep, setActiveYogaStep] =
    useState(0);

  const [activeCardGame, setActiveCardGame] =
    useState<"higher-lower" | "memory" | null>(
      null,
    );

  const [currentCard, setCurrentCard] =
    useState(7);

  const [cardMessage, setCardMessage] =
    useState(
      "Will the next card be higher or lower?",
    );

  const [memoryCards, setMemoryCards] =
    useState<MemoryCard[]>(
      createMemoryCards(),
    );

  const [memorySelection, setMemorySelection] =
    useState<string[]>([]);

  const [musicFavourites, setMusicFavourites] =
    useState<string[]>([]);

  const selectedActivity = useMemo(
    () =>
      activeActivity
        ? activities[activeActivity]
        : null,
    [activeActivity],
  );

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          "smiling-monad-music-favourites",
        );

      if (stored) {
        const parsed =
          JSON.parse(stored) as unknown;

        if (Array.isArray(parsed)) {
          setMusicFavourites(
            parsed.filter(
              (item): item is string =>
                typeof item === "string",
            ),
          );
        }
      }
    } catch {
      setMusicFavourites([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "smiling-monad-music-favourites",
        JSON.stringify(musicFavourites),
      );
    } catch {
      // Device storage is optional.
    }
  }, [musicFavourites]);

  useEffect(() => {
    if (
      !meditationRunning ||
      meditationSecondsLeft <= 0
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setMeditationSecondsLeft(
        (current) => Math.max(0, current - 1),
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    meditationRunning,
    meditationSecondsLeft,
  ]);

  useEffect(() => {
    if (
      meditationRunning &&
      meditationSecondsLeft === 0
    ) {
      setMeditationRunning(false);
    }
  }, [
    meditationRunning,
    meditationSecondsLeft,
  ]);

  useEffect(() => {
    if (
      !relaxTimerRunning ||
      relaxTimerSeconds <= 0
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setRelaxTimerSeconds(
        (current) => Math.max(0, current - 1),
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    relaxTimerRunning,
    relaxTimerSeconds,
  ]);

  useEffect(() => {
    if (
      relaxTimerRunning &&
      relaxTimerSeconds === 0
    ) {
      setRelaxTimerRunning(false);
    }
  }, [
    relaxTimerRunning,
    relaxTimerSeconds,
  ]);

  const meditationTimeLabel = `${Math.floor(
    meditationSecondsLeft / 60,
  )
    .toString()
    .padStart(2, "0")}:${(
    meditationSecondsLeft % 60
  )
    .toString()
    .padStart(2, "0")}`;

  function chooseMeditation(minutes: number) {
    setMeditationMinutes(minutes);
    setMeditationSecondsLeft(minutes * 60);
    setMeditationRunning(false);
  }

  function resetMeditation() {
    setMeditationSecondsLeft(
      meditationMinutes * 60,
    );
    setMeditationRunning(false);
  }

  function playHigherLower(
    choice: "higher" | "lower",
  ) {
    const nextCard =
      Math.floor(Math.random() * 13) + 1;

    const correct =
      choice === "higher"
        ? nextCard > currentCard
        : nextCard < currentCard;

    if (nextCard === currentCard) {
      setCardMessage(
        `The next card was ${nextCard}. It was the same — try again.`,
      );
    } else if (correct) {
      setCardMessage(
        `The next card was ${nextCard}. You were right.`,
      );
    } else {
      setCardMessage(
        `The next card was ${nextCard}. Not this time.`,
      );
    }

    setCurrentCard(nextCard);
  }

  function resetHigherLower() {
    setCurrentCard(
      Math.floor(Math.random() * 13) + 1,
    );
    setCardMessage(
      "Will the next card be higher or lower?",
    );
  }

  function chooseMemoryCard(cardId: string) {
    const chosenCard =
      memoryCards.find(
        (card) => card.id === cardId,
      );

    if (
      !chosenCard ||
      chosenCard.matched ||
      memorySelection.includes(cardId) ||
      memorySelection.length >= 2
    ) {
      return;
    }

    const nextSelection = [
      ...memorySelection,
      cardId,
    ];

    setMemorySelection(nextSelection);

    if (nextSelection.length !== 2) {
      return;
    }

    const [firstId, secondId] =
      nextSelection;

    const firstCard =
      memoryCards.find(
        (card) => card.id === firstId,
      );

    const secondCard =
      memoryCards.find(
        (card) => card.id === secondId,
      );

    if (
      firstCard &&
      secondCard &&
      firstCard.symbol === secondCard.symbol
    ) {
      window.setTimeout(() => {
        setMemoryCards((current) =>
          current.map((card) =>
            card.id === firstId ||
            card.id === secondId
              ? {
                  ...card,
                  matched: true,
                }
              : card,
          ),
        );
        setMemorySelection([]);
      }, 500);
    } else {
      window.setTimeout(() => {
        setMemorySelection([]);
      }, 900);
    }
  }

  function resetMemoryGame() {
    setMemoryCards(createMemoryCards());
    setMemorySelection([]);
  }

  const groundingPrompts = [
    "Name five things you can see.",
    "Name four things you can feel.",
    "Name three things you can hear.",
    "Name two things you can smell.",
    "Name one thing you appreciate right now.",
  ];

  const relaxTimerLabel = `${Math.floor(
    relaxTimerSeconds / 60,
  )
    .toString()
    .padStart(2, "0")}:${(
    relaxTimerSeconds % 60
  )
    .toString()
    .padStart(2, "0")}`;

  function resetRelaxTimer() {
    setRelaxTimerSeconds(60);
    setRelaxTimerRunning(false);
  }

  function toggleMusicFavourite(
    optionId: string,
  ) {
    setMusicFavourites((current) =>
      current.includes(optionId)
        ? current.filter(
            (item) => item !== optionId,
          )
        : [...current, optionId],
    );
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#526644] px-4 pb-14 pt-5 text-[#3f3a34] sm:px-8 sm:pt-8">
      <picture className="pointer-events-none absolute inset-0">
        <source
          media="(min-width: 768px)"
          srcSet="/workspace.png"
        />

        <img
          src="/smiling-monad-yoga.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
      </picture>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(19,35,26,0.18)_0%,rgba(255,255,255,0.08)_45%,rgba(29,24,20,0.22)_100%)]" />

      <div className="relative z-10">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          href="/market"
          aria-label="Return to the Smiling Monad Market"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#6f7f73]/25 bg-white/75 text-xl shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          ←
        </Link>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#6e7d72] sm:text-xs">
            The Smiling Monad
          </p>

          <h1 className="mt-1 font-serif text-2xl sm:text-4xl">
            Wellbeing Centre
          </h1>
        </div>

        <Link
          href="/office"
          className="rounded-full border border-[#6f7f73]/25 bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          Space
        </Link>
      </header>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-[32px] border border-white/70 bg-white/48 p-5 shadow-[0_24px_70px_rgba(30,40,34,0.18)] backdrop-blur-xl sm:mt-12 sm:p-9">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-3xl leading-tight sm:text-5xl">
            Move, breathe, listen, play, or simply rest.
          </p>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#667068]">
            This is a quiet space for regulation, recovery,
            gentle movement and enjoyment. Nothing here is
            compulsory and nothing needs to be rushed.
          </p>
        </div>

        <section className="mt-10 rounded-[28px] border border-[#c7d4cb] bg-[#eef5f0]/80 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7c70]">
                Quick reset
              </p>

              <h2 className="mt-3 font-serif text-3xl">
                Breathe with the circle
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-[#667068]">
                Breathe in as the circle grows. Breathe out
                as it becomes smaller.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setBreathingActive(
                  (current) => !current,
                )
              }
              className="rounded-full bg-[#5d7466] px-6 py-3 font-medium text-white transition hover:bg-[#4f6458]"
            >
              {breathingActive
                ? "Pause breathing"
                : "Start breathing"}
            </button>
          </div>

          <div className="mt-8 flex min-h-56 items-center justify-center rounded-[24px] border border-white/80 bg-white/55">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full border border-[#86a191]/45 bg-[#dcebe2] text-center text-sm font-medium text-[#52685a] shadow-[0_12px_40px_rgba(78,106,88,0.16)] ${
                breathingActive
                  ? "animate-[pulse_6s_ease-in-out_infinite]"
                  : ""
              }`}
            >
              {breathingActive
                ? "Breathe"
                : "Ready"}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            Object.entries(
              activities,
            ) as Array<
              [
                WellbeingActivity,
                ActivityDetails,
              ]
            >
          ).map(([key, activity]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setActiveActivity(key)
              }
              className="group min-h-48 rounded-[24px] border border-[#cad6ce] bg-white/75 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
            >
              <p className="font-serif text-2xl">
                {activity.title}
              </p>

              <p className="mt-3 leading-6 text-[#68726b]">
                {activity.subtitle}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#5d7466]">
                Open →
              </p>
            </button>
          ))}
        </div>

        <section className="mt-10 rounded-[26px] border border-[#d4ccbe] bg-[#f3ecdf]/75 p-6 text-center">
          <p className="font-serif text-2xl">
            You are allowed to stop.
          </p>

          <p className="mx-auto mt-3 max-w-2xl leading-7 text-[#70685f]">
            The Wellbeing Centre is not another task list.
            Leave whenever you feel ready.
          </p>
        </section>
      </section>

      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#c9d5cd] bg-[#fbfdfb] p-6 shadow-[0_30px_80px_rgba(31,45,36,0.34)] sm:p-8">
            <button
              type="button"
              onClick={() => {
                setActiveActivity(null);
                setMeditationRunning(false);
                setActiveYogaRoutine(null);
                setActiveYogaStep(0);
                setActiveCardGame(null);
                setMemorySelection([]);
                setActiveRelaxationTool(null);
                setRelaxTimerRunning(false);
                setGroundingStep(0);
              }}
              aria-label="Close wellbeing activity"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#e5eee8] text-xl"
            >
              ×
            </button>

            <p className="pr-12 text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7c70]">
              Wellbeing activity
            </p>

            <h2 className="mt-3 pr-12 font-serif text-3xl">
              {selectedActivity.title}
            </h2>

            <p className="mt-4 leading-7 text-[#667068]">
              {selectedActivity.prompt}
            </p>

            {activeActivity === "relax" ? (
              <div className="mt-6">
                {!activeRelaxationTool ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveRelaxationTool(
                          "breathing",
                        )
                      }
                      className="rounded-[20px] border border-[#d4ded7] bg-[#eef5f0] p-5 text-left transition hover:bg-white"
                    >
                      <span className="block font-serif text-2xl text-[#4f6256]">
                        One-minute breathing
                      </span>

                      <span className="mt-2 block leading-6 text-[#667068]">
                        A short guided pause with a simple breathing rhythm.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveRelaxationTool(
                          "grounding",
                        );
                        setGroundingStep(0);
                      }}
                      className="rounded-[20px] border border-[#d4ded7] bg-[#eef5f0] p-5 text-left transition hover:bg-white"
                    >
                      <span className="block font-serif text-2xl text-[#4f6256]">
                        Five-things grounding
                      </span>

                      <span className="mt-2 block leading-6 text-[#667068]">
                        A gentle sensory exercise to reconnect with the present moment.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveRelaxationTool(
                          "timer",
                        );
                        resetRelaxTimer();
                      }}
                      className="rounded-[20px] border border-[#d4ded7] bg-[#eef5f0] p-5 text-left transition hover:bg-white"
                    >
                      <span className="block font-serif text-2xl text-[#4f6256]">
                        Calming timer
                      </span>

                      <span className="mt-2 block leading-6 text-[#667068]">
                        Sit quietly for one minute with no task to complete.
                      </span>
                    </button>

                    <a
                      href="https://www.youtube.com/results?search_query=calming+nature+sounds"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[20px] border border-[#d4ded7] bg-[#eef5f0] p-5 text-left transition hover:bg-white"
                    >
                      <span className="block font-serif text-2xl text-[#4f6256]">
                        Nature sounds
                      </span>

                      <span className="mt-2 block leading-6 text-[#667068]">
                        Open calming rain, ocean, forest or waterfall sounds.
                      </span>
                    </a>
                  </div>
                ) : activeRelaxationTool ===
                  "breathing" ? (
                  <section className="rounded-[24px] border border-[#d4ded7] bg-[#eef5f0] p-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRelaxationTool(
                          null,
                        );
                        setBreathingActive(false);
                      }}
                      className="float-right rounded-full border border-[#5d7466]/25 bg-white px-4 py-2 text-sm font-medium text-[#5d7466]"
                    >
                      Choose another
                    </button>

                    <div className="clear-both pt-4">
                      <p className="font-serif text-2xl text-[#4f6256]">
                        One-minute breathing
                      </p>

                      <div className="mt-6 flex min-h-56 items-center justify-center rounded-[20px] bg-white/75">
                        <div
                          className={`flex h-28 w-28 items-center justify-center rounded-full border border-[#86a191]/45 bg-[#dcebe2] text-sm font-medium text-[#52685a] ${
                            breathingActive
                              ? "animate-[pulse_6s_ease-in-out_infinite]"
                              : ""
                          }`}
                        >
                          {breathingActive
                            ? "Breathe"
                            : "Ready"}
                        </div>
                      </div>

                      <p className="mt-4 leading-7 text-[#667068]">
                        Breathe in gently as the circle grows.
                        Breathe out slowly as it becomes smaller.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setBreathingActive(
                            (current) => !current,
                          )
                        }
                        className="mt-5 rounded-full bg-[#5d7466] px-6 py-3 font-medium text-white"
                      >
                        {breathingActive
                          ? "Pause"
                          : "Start"}
                      </button>
                    </div>
                  </section>
                ) : activeRelaxationTool ===
                  "grounding" ? (
                  <section className="rounded-[24px] border border-[#d4ded7] bg-[#eef5f0] p-6 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveRelaxationTool(
                          null,
                        )
                      }
                      className="float-right rounded-full border border-[#5d7466]/25 bg-white px-4 py-2 text-sm font-medium text-[#5d7466]"
                    >
                      Choose another
                    </button>

                    <div className="clear-both pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7c70]">
                        Step {groundingStep + 1} of 5
                      </p>

                      <p className="mx-auto mt-6 max-w-lg font-serif text-3xl leading-10 text-[#4f6256]">
                        {groundingPrompts[
                          groundingStep
                        ]}
                      </p>

                      <div className="mt-7 flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setGroundingStep(
                              (current) =>
                                Math.max(
                                  0,
                                  current - 1,
                                ),
                            )
                          }
                          disabled={
                            groundingStep === 0
                          }
                          className="flex-1 rounded-full border border-[#5d7466]/25 bg-white px-5 py-3 font-medium text-[#5d7466] disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setGroundingStep(
                              (current) =>
                                Math.min(
                                  4,
                                  current + 1,
                                ),
                            )
                          }
                          disabled={
                            groundingStep === 4
                          }
                          className="flex-1 rounded-full bg-[#5d7466] px-5 py-3 font-medium text-white disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>

                      {groundingStep === 4 && (
                        <p className="mt-5 rounded-[14px] bg-white/75 px-4 py-3 font-medium text-[#4f6256]">
                          Take one slow breath. You are here.
                        </p>
                      )}
                    </div>
                  </section>
                ) : (
                  <section className="rounded-[24px] border border-[#d4ded7] bg-[#eef5f0] p-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRelaxationTool(
                          null,
                        );
                        setRelaxTimerRunning(
                          false,
                        );
                      }}
                      className="float-right rounded-full border border-[#5d7466]/25 bg-white px-4 py-2 text-sm font-medium text-[#5d7466]"
                    >
                      Choose another
                    </button>

                    <div className="clear-both pt-4">
                      <p className="font-serif text-2xl text-[#4f6256]">
                        Calming timer
                      </p>

                      <p className="mt-5 font-serif text-6xl text-[#4f6256]">
                        {relaxTimerLabel}
                      </p>

                      <p className="mx-auto mt-4 max-w-md leading-7 text-[#667068]">
                        Let the minute pass without trying to achieve anything.
                      </p>

                      {relaxTimerSeconds === 0 && (
                        <p className="mt-4 rounded-[14px] bg-white/75 px-4 py-3 font-medium text-[#4f6256]">
                          The minute is complete. Stay as long as you need.
                        </p>
                      )}

                      <div className="mt-6 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setRelaxTimerRunning(
                              (current) =>
                                !current,
                            )
                          }
                          disabled={
                            relaxTimerSeconds === 0
                          }
                          className="rounded-full bg-[#5d7466] px-6 py-3 font-medium text-white disabled:opacity-50"
                        >
                          {relaxTimerRunning
                            ? "Pause"
                            : "Start"}
                        </button>

                        <button
                          type="button"
                          onClick={resetRelaxTimer}
                          className="rounded-full border border-[#5d7466]/25 bg-white px-6 py-3 font-medium text-[#5d7466]"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            ) : activeActivity === "meditate" ? (
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[2, 5, 10, 20].map(
                    (minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() =>
                          chooseMeditation(
                            minutes,
                          )
                        }
                        className={`rounded-[16px] border px-4 py-3 text-sm font-medium transition ${
                          meditationMinutes ===
                          minutes
                            ? "border-[#5d7466] bg-[#dfeae3] text-[#4f6256]"
                            : "border-[#d4ded7] bg-[#eef5f0] text-[#4f6256] hover:bg-white"
                        }`}
                      >
                        {minutes} minutes
                      </button>
                    ),
                  )}
                </div>

                <div className="mt-6 rounded-[24px] border border-[#d4ded7] bg-[#eef5f0] p-6 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6b7c70]">
                    Guided pause
                  </p>

                  <p className="mt-4 font-serif text-6xl text-[#4f6256]">
                    {meditationTimeLabel}
                  </p>

                  <p className="mx-auto mt-4 max-w-md leading-7 text-[#667068]">
                    Sit comfortably. Let your shoulders
                    soften. Notice your breathing without
                    trying to change it.
                  </p>

                  {meditationSecondsLeft ===
                    0 && (
                    <p className="mt-4 rounded-[14px] bg-white/75 px-4 py-3 font-medium text-[#4f6256]">
                      Session complete. Take your time
                      before moving.
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setMeditationRunning(
                          (current) =>
                            !current,
                        )
                      }
                      disabled={
                        meditationSecondsLeft ===
                        0
                      }
                      className="rounded-full bg-[#5d7466] px-6 py-3 font-medium text-white disabled:opacity-50"
                    >
                      {meditationRunning
                        ? "Pause"
                        : "Start"}
                    </button>

                    <button
                      type="button"
                      onClick={resetMeditation}
                      className="rounded-full border border-[#5d7466]/25 bg-white px-6 py-3 font-medium text-[#5d7466]"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            ) : activeActivity === "yoga" ? (
              <div className="mt-6">
                {!activeYogaRoutine ? (
                  <div className="space-y-3">
                    {yogaRoutines.map((routine) => (
                      <button
                        key={routine.id}
                        type="button"
                        onClick={() => {
                          setActiveYogaRoutine(routine);
                          setActiveYogaStep(0);
                        }}
                        className="block w-full rounded-[18px] border border-[#d4ded7] bg-[#eef5f0] px-5 py-4 text-left transition hover:bg-white"
                      >
                        <span className="block font-serif text-xl text-[#4f6256]">
                          {routine.title}
                        </span>

                        <span className="mt-1 block text-sm text-[#6b766f]">
                          {routine.duration}
                        </span>

                        <span className="mt-2 block leading-6 text-[#667068]">
                          {routine.description}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <section className="rounded-[24px] border border-[#d4ded7] bg-[#eef5f0] p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-serif text-2xl text-[#4f6256]">
                          {activeYogaRoutine.title}
                        </p>

                        <p className="mt-1 text-sm text-[#6b766f]">
                          {activeYogaRoutine.duration}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveYogaRoutine(null);
                          setActiveYogaStep(0);
                        }}
                        className="rounded-full border border-[#5d7466]/25 bg-white px-4 py-2 text-sm font-medium text-[#5d7466]"
                      >
                        Choose another
                      </button>
                    </div>

                    <p className="mt-4 leading-7 text-[#667068]">
                      Move only within a comfortable range.
                      Stop if anything feels painful, dizzy or unsafe.
                    </p>

                    <div className="mt-6 rounded-[20px] bg-white/75 p-5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7c70]">
                        Step {activeYogaStep + 1} of{" "}
                        {activeYogaRoutine.steps.length}
                      </p>

                      <p className="mt-4 font-serif text-2xl leading-9 text-[#4f6256]">
                        {activeYogaRoutine.steps[activeYogaStep]}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveYogaStep((current) =>
                            Math.max(0, current - 1),
                          )
                        }
                        disabled={activeYogaStep === 0}
                        className="flex-1 rounded-full border border-[#5d7466]/25 bg-white px-5 py-3 font-medium text-[#5d7466] disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveYogaStep((current) =>
                            Math.min(
                              activeYogaRoutine.steps.length - 1,
                              current + 1,
                            ),
                          )
                        }
                        disabled={
                          activeYogaStep ===
                          activeYogaRoutine.steps.length - 1
                        }
                        className="flex-1 rounded-full bg-[#5d7466] px-5 py-3 font-medium text-white disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>

                    {activeYogaStep ===
                      activeYogaRoutine.steps.length - 1 && (
                      <p className="mt-4 rounded-[14px] bg-white/75 px-4 py-3 text-center font-medium text-[#4f6256]">
                        Routine complete. Rest for a moment before moving on.
                      </p>
                    )}
                  </section>
                )}
              </div>
            ) : activeActivity === "cards" ? (
              <div className="mt-6">
                {!activeCardGame ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCardGame(
                          "higher-lower",
                        );
                        resetHigherLower();
                      }}
                      className="rounded-[20px] border border-[#d4ded7] bg-[#eef5f0] p-5 text-left transition hover:bg-white"
                    >
                      <span className="block font-serif text-2xl text-[#4f6256]">
                        Higher or Lower
                      </span>

                      <span className="mt-2 block leading-6 text-[#667068]">
                        Guess whether the next card will be higher or lower.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveCardGame(
                          "memory",
                        );
                        resetMemoryGame();
                      }}
                      className="rounded-[20px] border border-[#d4ded7] bg-[#eef5f0] p-5 text-left transition hover:bg-white"
                    >
                      <span className="block font-serif text-2xl text-[#4f6256]">
                        Memory Match
                      </span>

                      <span className="mt-2 block leading-6 text-[#667068]">
                        Turn over two cards and find the matching pairs.
                      </span>
                    </button>
                  </div>
                ) : activeCardGame ===
                  "higher-lower" ? (
                  <section className="rounded-[24px] border border-[#d4ded7] bg-[#eef5f0] p-6 text-center">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-serif text-2xl text-[#4f6256]">
                        Higher or Lower
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveCardGame(null)
                        }
                        className="rounded-full border border-[#5d7466]/25 bg-white px-4 py-2 text-sm font-medium text-[#5d7466]"
                      >
                        Choose another
                      </button>
                    </div>

                    <div className="mx-auto mt-6 flex h-40 w-28 items-center justify-center rounded-[18px] border border-[#b9c8be] bg-white text-5xl font-serif text-[#4f6256] shadow-sm">
                      {currentCard}
                    </div>

                    <p className="mt-5 leading-7 text-[#667068]">
                      {cardMessage}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          playHigherLower(
                            "higher",
                          )
                        }
                        className="rounded-full bg-[#5d7466] px-5 py-3 font-medium text-white"
                      >
                        Higher
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          playHigherLower(
                            "lower",
                          )
                        }
                        className="rounded-full bg-[#5d7466] px-5 py-3 font-medium text-white"
                      >
                        Lower
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={resetHigherLower}
                      className="mt-4 rounded-full border border-[#5d7466]/25 bg-white px-5 py-2 text-sm font-medium text-[#5d7466]"
                    >
                      Reset
                    </button>
                  </section>
                ) : (
                  <section className="rounded-[24px] border border-[#d4ded7] bg-[#eef5f0] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-serif text-2xl text-[#4f6256]">
                        Memory Match
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveCardGame(null)
                        }
                        className="rounded-full border border-[#5d7466]/25 bg-white px-4 py-2 text-sm font-medium text-[#5d7466]"
                      >
                        Choose another
                      </button>
                    </div>

                    <div className="mt-6 grid grid-cols-4 gap-3">
                      {memoryCards.map((card) => {
                        const visible =
                          card.matched ||
                          memorySelection.includes(
                            card.id,
                          );

                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() =>
                              chooseMemoryCard(
                                card.id,
                              )
                            }
                            disabled={card.matched}
                            className={`aspect-[3/4] rounded-[16px] border text-3xl transition ${
                              visible
                                ? "border-[#b8c8bd] bg-white text-[#4f6256]"
                                : "border-[#5d7466]/30 bg-[#6b8173] text-transparent"
                            }`}
                          >
                            {card.symbol}
                          </button>
                        );
                      })}
                    </div>

                    {memoryCards.every(
                      (card) => card.matched,
                    ) && (
                      <p className="mt-5 rounded-[14px] bg-white/75 px-4 py-3 text-center font-medium text-[#4f6256]">
                        All pairs found.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={resetMemoryGame}
                      className="mt-5 w-full rounded-full border border-[#5d7466]/25 bg-white px-5 py-3 font-medium text-[#5d7466]"
                    >
                      New game
                    </button>
                  </section>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {selectedActivity.items.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      className="block w-full rounded-[18px] border border-[#d4ded7] bg-[#eef5f0] px-5 py-4 text-left font-medium text-[#4f6256] transition hover:bg-white"
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            )}

            {activeActivity === "music" && (
              <div className="mt-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <a
                    href="https://open.spotify.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#5d7466]/25 bg-white px-4 py-3 text-center text-sm font-medium text-[#5d7466]"
                  >
                    Open Spotify
                  </a>

                  <a
                    href="https://music.youtube.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#5d7466]/25 bg-white px-4 py-3 text-center text-sm font-medium text-[#5d7466]"
                  >
                    Open YouTube Music
                  </a>

                  <a
                    href="https://music.apple.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#5d7466]/25 bg-white px-4 py-3 text-center text-sm font-medium text-[#5d7466]"
                  >
                    Open Apple Music
                  </a>
                </div>

                <section className="mt-6 rounded-[22px] border border-[#d4ded7] bg-[#eef5f0] p-5">
                  <p className="font-serif text-2xl text-[#4f6256]">
                    Calming sounds
                  </p>

                  <p className="mt-2 leading-6 text-[#667068]">
                    Save favourites on this device for quick access later.
                  </p>

                  <div className="mt-4 space-y-3">
                    {musicOptions.map((option) => {
                      const favourite =
                        musicFavourites.includes(
                          option.id,
                        );

                      return (
                        <div
                          key={option.id}
                          className="flex flex-col gap-3 rounded-[18px] border border-[#d4ded7] bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-[#4f6256]">
                              {option.title}
                            </p>

                            <p className="mt-1 text-sm leading-6 text-[#667068]">
                              {option.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                toggleMusicFavourite(
                                  option.id,
                                )
                              }
                              className="rounded-full border border-[#5d7466]/25 bg-white px-4 py-2 text-sm font-medium text-[#5d7466]"
                            >
                              {favourite
                                ? "Saved"
                                : "Save"}
                            </button>

                            <a
                              href={option.href}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-[#5d7466] px-4 py-2 text-sm font-medium text-white"
                            >
                              Open
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {musicFavourites.length > 0 && (
                  <p className="mt-4 rounded-[14px] bg-[#e5eee8] px-4 py-3 text-sm text-[#4f6256]">
                    {musicFavourites.length} favourite
                    {musicFavourites.length === 1
                      ? ""
                      : "s"}{" "}
                    saved on this device.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveActivity(null);
                setMeditationRunning(false);
                setActiveYogaRoutine(null);
                setActiveYogaStep(0);
                setActiveCardGame(null);
                setMemorySelection([]);
                setActiveRelaxationTool(null);
                setRelaxTimerRunning(false);
                setGroundingStep(0);
              }}
              className="mt-7 w-full rounded-full bg-[#5d7466] px-5 py-3 font-medium text-white"
            >
              Return to the room
            </button>
          </section>
        </div>
      )}
      </div>
    </main>
  );
}