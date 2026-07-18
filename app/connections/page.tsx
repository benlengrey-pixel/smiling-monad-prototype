"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addConnectionProfile,
  addWorkOpportunity,
  readSmilingMonadState,
  subscribeToSmilingMonadState,
  type ConnectionProfile,
  type ConnectionProfileType,
  type WorkOpportunity,
  type WorkerApplication,
} from "@/lib/platform/smiling-monad-state";

type ConnectionArea =
  | "people"
  | "work"
  | "circles"
  | "profile";

type AreaDetails = {
  title: string;
  description: string;
  examples: string[];
};

const connectionAreas: Record<
  ConnectionArea,
  AreaDetails
> = {
  people: {
    title: "Find People",
    description:
      "Search for participants, families, support workers, providers and community members who may be a good fit.",
    examples: [
      "Find local support workers",
      "Find providers and professionals",
      "Search by interests and experience",
      "Look for people who share your values",
    ],
  },

  work: {
    title: "Available Work",
    description:
      "A simple community space where people can advertise support opportunities and availability.",
    examples: [
      "Advertise available support work",
      "Share support-worker availability",
      "Find short-term or ongoing opportunities",
      "Connect before exchanging private details",
    ],
  },

  circles: {
    title: "Circles of Support",
    description:
      "Build and manage a trusted group of people around a participant, family, project or shared goal.",
    examples: [
      "Invite trusted people",
      "Define roles and relationships",
      "See who is part of the circle",
      "Connect the circle to shared planning",
    ],
  },

  profile: {
    title: "Your Community Profile",
    description:
      "Create a respectful profile that helps others understand who you are, what you offer and what you are looking for.",
    examples: [
      "Participant and family profiles",
      "Trained support-worker pathway",
      "Provider and professional profiles",
      "Community-member profiles",
    ],
  },
};

const profileTypeLabels: Record<
  ConnectionProfileType,
  string
> = {
  participant: "Participant",
  family: "Family member",
  "support-worker": "Support worker",
  provider: "Provider",
  professional: "Professional",
  "community-member": "Community member",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ConnectionsPage() {
  const [activeArea, setActiveArea] =
    useState<ConnectionArea | null>(null);

  const [profiles, setProfiles] =
    useState<ConnectionProfile[]>([]);

  const [opportunities, setOpportunities] =
    useState<WorkOpportunity[]>([]);

  const [workerApplications, setWorkerApplications] =
    useState<WorkerApplication[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [profileName, setProfileName] =
    useState("");

  const [profileType, setProfileType] =
    useState<ConnectionProfileType>(
      "community-member",
    );

  const [profileSummary, setProfileSummary] =
    useState("");

  const [profileLocation, setProfileLocation] =
    useState("");

  const [profileInterests, setProfileInterests] =
    useState("");

  const [profileOffers, setProfileOffers] =
    useState("");

  const [profileLookingFor, setProfileLookingFor] =
    useState("");

  const [workTitle, setWorkTitle] =
    useState("");

  const [workDescription, setWorkDescription] =
    useState("");

  const [workLocation, setWorkLocation] =
    useState("");

  const [workContactName, setWorkContactName] =
    useState("");

  useEffect(() => {
    const state =
      readSmilingMonadState();

    setProfiles(state.connectionProfiles);
    setOpportunities(
      state.workOpportunities,
    );
    setWorkerApplications(
      state.workerApplications,
    );
    setLoaded(true);

    return subscribeToSmilingMonadState(
      (nextState) => {
        setProfiles(
          nextState.connectionProfiles,
        );
        setOpportunities(
          nextState.workOpportunities,
        );
        setWorkerApplications(
          nextState.workerApplications,
        );
      },
    );
  }, []);

  const approvedWorkerApplications = useMemo(
    () =>
      workerApplications.filter(
        (application) =>
          application.status === "approved" &&
          application.badgeStatus === "active" &&
          Boolean(
            application.connectionProfileId,
          ),
      ),
    [workerApplications],
  );

  const approvedWorkerByProfileId = useMemo(
    () =>
      new Map(
        approvedWorkerApplications.map(
          (application) => [
            application.connectionProfileId as string,
            application,
          ],
        ),
      ),
    [approvedWorkerApplications],
  );

  const approvedProfiles = useMemo(
    () =>
      profiles.filter((profile) => {
        if (
          profile.status !== "approved"
        ) {
          return false;
        }

        if (
          profile.profileType !==
          "support-worker"
        ) {
          return true;
        }

        return approvedWorkerByProfileId.has(
          profile.id,
        );
      }),
    [profiles, approvedWorkerByProfileId],
  );

  const submittedProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.status === "submitted",
      ),
    [profiles],
  );

  const draftProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.status === "draft",
      ),
    [profiles],
  );

  const approvedOpportunities = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          opportunity.status === "approved",
      ),
    [opportunities],
  );

  const submittedOpportunities = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          opportunity.status === "submitted",
      ),
    [opportunities],
  );

  const draftOpportunities = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          opportunity.status === "draft",
      ),
    [opportunities],
  );

  const selectedArea = activeArea
    ? connectionAreas[activeArea]
    : null;

  function submitProfile() {
    const name = profileName.trim();
    const summary = profileSummary.trim();

    if (
      !name ||
      !summary ||
      profileType === "support-worker"
    ) {
      return;
    }

    addConnectionProfile({
      name,
      profileType,
      summary,
      location: profileLocation.trim(),
      interests: splitList(
        profileInterests,
      ),
      offers: splitList(profileOffers),
      lookingFor: splitList(
        profileLookingFor,
      ),
      status: "submitted",
    });

    setProfileName("");
    setProfileType("community-member");
    setProfileSummary("");
    setProfileLocation("");
    setProfileInterests("");
    setProfileOffers("");
    setProfileLookingFor("");
    setActiveArea(null);
  }

  function submitOpportunity() {
    const title = workTitle.trim();
    const description =
      workDescription.trim();

    if (!title || !description) {
      return;
    }

    addWorkOpportunity({
      title,
      description,
      location: workLocation.trim(),
      contactName:
        workContactName.trim() ||
        "Community member",
      status: "submitted",
    });

    setWorkTitle("");
    setWorkDescription("");
    setWorkLocation("");
    setWorkContactName("");
    setActiveArea(null);
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#edf3e9_0%,#f8f2e8_55%,#eadac5_100%)] px-4 pb-12 pt-5 text-[#40352c] sm:px-8 sm:pt-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          href="/market"
          aria-label="Return to the Smiling Monad Market"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#7c6a58]/25 bg-white/70 text-xl shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          ←
        </Link>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#7d715f] sm:text-xs">
            The Smiling Monad Market
          </p>

          <h1 className="mt-1 font-serif text-2xl sm:text-4xl">
            Connections Centre
          </h1>
        </div>

        <Link
          href="/office"
          className="rounded-full border border-[#7c6a58]/25 bg-white/70 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          Space
        </Link>
      </header>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-[32px] border border-white/70 bg-white/55 p-5 shadow-[0_24px_70px_rgba(78,60,40,0.12)] backdrop-blur-xl sm:mt-12 sm:p-9">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-2xl leading-tight sm:text-4xl">
            Find the right people. Build trusted
            relationships. Grow stronger circles.
          </p>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#695d51]">
            The Connections Centre helps people meet
            safely and thoughtfully. It does not decide
            who belongs in your life or support team.
            It gives you a calm place to explore,
            communicate and make informed choices.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {(
            Object.entries(
              connectionAreas,
            ) as Array<
              [ConnectionArea, AreaDetails]
            >
          ).map(([key, area]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setActiveArea(key)
              }
              className="group min-h-44 rounded-[24px] border border-[#d9cbb9] bg-[rgba(255,251,244,0.82)] p-6 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#7d654f]/20"
            >
              <p className="font-serif text-2xl">
                {area.title}
              </p>

              <p className="mt-3 leading-7 text-[#706255]">
                {area.description}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#765943]">
                Open area →
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
            <p className="font-serif text-xl">
              Public profiles
            </p>

            <p className="mt-3 leading-7 text-[#6c5e51]">
              {loaded
                ? `${approvedProfiles.length} approved, ${submittedProfiles.length} awaiting review and ${draftProfiles.length} draft profile${draftProfiles.length === 1 ? "" : "s"}.`
                : "Loading profile information…"}
            </p>
          </section>

          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
            <p className="font-serif text-xl">
              Work opportunities
            </p>

            <p className="mt-3 leading-7 text-[#6c5e51]">
              {loaded
                ? `${approvedOpportunities.length} approved, ${submittedOpportunities.length} awaiting review and ${draftOpportunities.length} draft opportunit${draftOpportunities.length === 1 ? "y" : "ies"}.`
                : "Loading work opportunities…"}
            </p>
          </section>
        </div>

        <div className="mt-8 rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
          <p className="font-serif text-xl">
            Safe community connections
          </p>

          <p className="mt-3 leading-7 text-[#6c5e51]">
            Public profiles and posts are reviewed before
            becoming visible. Support workers appear only
            after completing the Smiling Monad training
            pathway, evidence review and human approval.
            Private contact details should only be shared
            after both people choose to connect.
          </p>
        </div>
      </section>

      {selectedArea && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#d9c9b4] bg-[#fffaf2] p-6 shadow-[0_30px_80px_rgba(35,24,15,0.4)] sm:p-8">
            <button
              type="button"
              onClick={() =>
                setActiveArea(null)
              }
              aria-label="Close area"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl transition hover:bg-[#e4d4bf]"
            >
              ×
            </button>

            <h2 className="pr-12 font-serif text-3xl">
              {selectedArea.title}
            </h2>

            <p className="mt-4 leading-7 text-[#6d5e51]">
              {selectedArea.description}
            </p>

            {activeArea === "profile" && (
              <div className="mt-6 space-y-4">
                <input
                  value={profileName}
                  onChange={(event) =>
                    setProfileName(
                      event.target.value,
                    )
                  }
                  placeholder="Name or profile title"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <select
                  value={profileType}
                  onChange={(event) =>
                    setProfileType(
                      event.target
                        .value as ConnectionProfileType,
                    )
                  }
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                >
                  {(
                    Object.entries(
                      profileTypeLabels,
                    ) as Array<
                      [
                        ConnectionProfileType,
                        string,
                      ]
                    >
                  )
                    .filter(
                      ([value]) =>
                        value !==
                        "support-worker",
                    )
                    .map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                </select>

                <textarea
                  value={profileSummary}
                  onChange={(event) =>
                    setProfileSummary(
                      event.target.value,
                    )
                  }
                  placeholder="A respectful public summary"
                  className="min-h-32 w-full resize-none rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 leading-7 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <input
                  value={profileLocation}
                  onChange={(event) =>
                    setProfileLocation(
                      event.target.value,
                    )
                  }
                  placeholder="General location only"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <input
                  value={profileInterests}
                  onChange={(event) =>
                    setProfileInterests(
                      event.target.value,
                    )
                  }
                  placeholder="Interests, separated by commas"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <input
                  value={profileOffers}
                  onChange={(event) =>
                    setProfileOffers(
                      event.target.value,
                    )
                  }
                  placeholder="What you offer, separated by commas"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <input
                  value={profileLookingFor}
                  onChange={(event) =>
                    setProfileLookingFor(
                      event.target.value,
                    )
                  }
                  placeholder="What you are looking for, separated by commas"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <div className="rounded-[16px] border border-[#cdbda8] bg-[#efe4d4] px-4 py-4 text-sm leading-6 text-[#6c5e51]">
                  Support-worker profiles cannot be
                  created through this general form.
                  Workers must complete the Smiling
                  Monad training pathway and pass
                  human review first.
                  <Link
                    href="/school"
                    className="ml-1 font-semibold text-[#60432f] underline"
                  >
                    Open the worker pathway
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={submitProfile}
                  disabled={
                    !profileName.trim() ||
                    !profileSummary.trim()
                  }
                  className="w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit profile for review
                </button>
              </div>
            )}

            {activeArea === "work" && (
              <div className="mt-6 space-y-4">
                <input
                  value={workTitle}
                  onChange={(event) =>
                    setWorkTitle(
                      event.target.value,
                    )
                  }
                  placeholder="Opportunity title"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <textarea
                  value={workDescription}
                  onChange={(event) =>
                    setWorkDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe the opportunity without including private contact details"
                  className="min-h-36 w-full resize-none rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 leading-7 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <input
                  value={workLocation}
                  onChange={(event) =>
                    setWorkLocation(
                      event.target.value,
                    )
                  }
                  placeholder="General location"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <input
                  value={workContactName}
                  onChange={(event) =>
                    setWorkContactName(
                      event.target.value,
                    )
                  }
                  placeholder="Public contact name"
                  className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#7a6049]/20"
                />

                <button
                  type="button"
                  onClick={submitOpportunity}
                  disabled={
                    !workTitle.trim() ||
                    !workDescription.trim()
                  }
                  className="w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit opportunity for review
                </button>
              </div>
            )}

            {activeArea === "people" && (
              <div className="mt-6 space-y-3">
                {approvedProfiles.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-[#ccbba6] bg-[#f6eee2] px-4 py-4 text-[#75685b]">
                    No approved profiles are visible yet.
                  </div>
                ) : (
                  approvedProfiles.map(
                    (profile) => (
                      <article
                        key={profile.id}
                        className="rounded-[18px] border border-[#e0d3c3] bg-[#f6eee2] p-4"
                      >
                        <p className="font-serif text-xl">
                          {profile.name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#7a6a5b]">
                          <span>
                            {
                              profileTypeLabels[
                                profile.profileType
                              ]
                            }
                            {profile.location
                              ? ` · ${profile.location}`
                              : ""}
                          </span>

                          {profile.profileType ===
                            "support-worker" &&
                            approvedWorkerByProfileId.has(
                              profile.id,
                            ) && (
                              <span className="rounded-full bg-[#60432f] px-3 py-1 text-xs font-semibold text-white">
                                Smiling Monad Trained
                              </span>
                            )}
                        </div>

                        <p className="mt-3 leading-7 text-[#67594d]">
                          {profile.summary}
                        </p>

                        {profile.profileType ===
                          "support-worker" &&
                          approvedWorkerByProfileId.get(
                            profile.id,
                          ) && (
                            <p className="mt-3 text-sm text-[#7a6a5b]">
                              Last reviewed:{" "}
                              {new Intl.DateTimeFormat(
                                "en-AU",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              ).format(
                                new Date(
                                  approvedWorkerByProfileId.get(
                                    profile.id,
                                  )?.lastReviewedAt ??
                                    approvedWorkerByProfileId.get(
                                      profile.id,
                                    )?.approvedAt ??
                                    new Date().toISOString(),
                                ),
                              )}
                            </p>
                          )}
                      </article>
                    ),
                  )
                )}
              </div>
            )}

            {activeArea === "circles" && (
              <div className="mt-6 space-y-3">
                {selectedArea.examples.map(
                  (example) => (
                    <div
                      key={example}
                      className="rounded-[16px] border border-[#e0d3c3] bg-[#f6eee2] px-4 py-3"
                    >
                      {example}
                    </div>
                  ),
                )}

                <Link
                  href="/circle"
                  className="mt-4 block w-full rounded-full bg-[#60432f] px-5 py-3 text-center font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Open the Circle Centre
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setActiveArea(null)
              }
              className="mt-7 w-full rounded-full border border-[#cdbda8] bg-[#f3eadc] px-5 py-3 font-medium text-[#5c4737] transition hover:bg-white"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}