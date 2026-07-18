"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  readSmilingMonadState,
  subscribeToSmilingMonadState,
  updateSmilingMonadState,
  type SmilingMonadState,
} from "@/lib/platform/smiling-monad-state";

type CircleState =
  SmilingMonadState["circle"];

type CircleProfile =
  CircleState["profile"];

type CircleMember =
  CircleState["members"][number];

type CircleGoal =
  CircleState["goals"][number];

type CircleDocument =
  CircleState["documents"][number];

type CircleMeeting =
  CircleState["meetings"][number];

type CircleResponsibility =
  CircleState["responsibilities"][number];

type ActivePanel =
  | "overview"
  | "person"
  | "members"
  | "goals"
  | "documents"
  | "meetings"
  | "responsibilities";

type StateUpdate<T> =
  | T
  | ((current: T) => T);

const emptyCircle: CircleState = {
  profile: {
    personName: "",
    preferredName: "",
    whatMatters: "",
    communication: "",
  },
  members: [],
  goals: [],
  documents: [],
  meetings: [],
  responsibilities: [],
};

function createId(): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    typeof globalThis.crypto.randomUUID ===
      "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function resolveStateUpdate<T>(
  current: T,
  update: StateUpdate<T>,
): T {
  return typeof update === "function"
    ? (
        update as (
          value: T,
        ) => T
      )(current)
    : update;
}

function getNextStatus<
  T extends string,
>(
  current: T,
  statuses: readonly T[],
): T {
  const currentIndex =
    statuses.indexOf(current);

  if (
    currentIndex < 0 ||
    currentIndex === statuses.length - 1
  ) {
    return statuses[0];
  }

  return statuses[currentIndex + 1];
}

export default function CirclePage() {
  const [loaded, setLoaded] =
    useState(false);

  const [circle, setCircle] =
    useState<CircleState>(
      emptyCircle,
    );

  const profile = circle.profile;
  const members = circle.members;
  const goals = circle.goals;
  const documents = circle.documents;
  const meetings = circle.meetings;
  const responsibilities =
    circle.responsibilities;

  function commitCircle(
    updater: (
      current: CircleState,
    ) => CircleState,
  ) {
    const nextState =
      updateSmilingMonadState(
        (currentState) => ({
          ...currentState,
          circle: updater(
            currentState.circle,
          ),
        }),
      );

    setCircle(nextState.circle);
  }

  function setProfile(
    update: StateUpdate<CircleProfile>,
  ) {
    commitCircle((current) => ({
      ...current,
      profile: resolveStateUpdate(
        current.profile,
        update,
      ),
    }));
  }

  function setMembers(
    update: StateUpdate<
      CircleMember[]
    >,
  ) {
    commitCircle((current) => ({
      ...current,
      members: resolveStateUpdate(
        current.members,
        update,
      ),
    }));
  }

  function setGoals(
    update: StateUpdate<CircleGoal[]>,
  ) {
    commitCircle((current) => ({
      ...current,
      goals: resolveStateUpdate(
        current.goals,
        update,
      ),
    }));
  }

  function setDocuments(
    update: StateUpdate<
      CircleDocument[]
    >,
  ) {
    commitCircle((current) => ({
      ...current,
      documents: resolveStateUpdate(
        current.documents,
        update,
      ),
    }));
  }

  function setMeetings(
    update: StateUpdate<
      CircleMeeting[]
    >,
  ) {
    commitCircle((current) => ({
      ...current,
      meetings: resolveStateUpdate(
        current.meetings,
        update,
      ),
    }));
  }

  function setResponsibilities(
    update: StateUpdate<
      CircleResponsibility[]
    >,
  ) {
    commitCircle((current) => ({
      ...current,
      responsibilities:
        resolveStateUpdate(
          current.responsibilities,
          update,
        ),
    }));
  }

  const [activePanel, setActivePanel] =
    useState<ActivePanel | null>(
      null,
    );

  const [memberName, setMemberName] =
    useState("");

  const [memberRole, setMemberRole] =
    useState("");

  const [
    memberRelationship,
    setMemberRelationship,
  ] = useState("");

  const [goalTitle, setGoalTitle] =
    useState("");

  const [goalOwner, setGoalOwner] =
    useState("");

  const [
    documentTitle,
    setDocumentTitle,
  ] = useState("");

  const [
    documentCategory,
    setDocumentCategory,
  ] =
    useState<CircleDocument["category"]>(
      "Plan",
    );

  const [meetingTitle, setMeetingTitle] =
    useState("");

  const [meetingDate, setMeetingDate] =
    useState("");

  const [
    meetingPurpose,
    setMeetingPurpose,
  ] = useState("");

  const [
    responsibilityTitle,
    setResponsibilityTitle,
  ] = useState("");

  const [
    responsibilityOwner,
    setResponsibilityOwner,
  ] = useState("");

  useEffect(() => {
    const state =
      readSmilingMonadState();

    setCircle(state.circle);
    setLoaded(true);

    return subscribeToSmilingMonadState(
      (nextState) => {
        setCircle(nextState.circle);
      },
    );
  }, []);

  const activeGoals = useMemo(
    () =>
      goals.filter(
        (goal) =>
          goal.status !== "Complete",
      ).length,
    [goals],
  );

  const openResponsibilities =
    useMemo(
      () =>
        responsibilities.filter(
          (responsibility) =>
            responsibility.status !==
            "Complete",
        ).length,
      [responsibilities],
    );

  const documentsNeedingReview =
    useMemo(
      () =>
        documents.filter(
          (document) =>
            document.status ===
            "Review needed",
        ).length,
      [documents],
    );

  function addMember() {
    const name = memberName.trim();

    if (!name) {
      return;
    }

    setMembers((current) => [
      ...current,
      {
        id: createId(),
        name,
        role:
          memberRole.trim() ||
          "Circle member",
        relationship:
          memberRelationship.trim() ||
          "Support relationship",
      },
    ]);

    setMemberName("");
    setMemberRole("");
    setMemberRelationship("");
  }

  function addGoal() {
    const title = goalTitle.trim();

    if (!title) {
      return;
    }

    setGoals((current) => [
      ...current,
      {
        id: createId(),
        title,
        owner:
          goalOwner.trim() ||
          profile.preferredName ||
          profile.personName ||
          "Whole circle",
        status: "Planning",
      },
    ]);

    setGoalTitle("");
    setGoalOwner("");
  }

  function addDocument() {
    const title =
      documentTitle.trim();

    if (!title) {
      return;
    }

    setDocuments((current) => [
      ...current,
      {
        id: createId(),
        title,
        category:
          documentCategory,
        status: "Draft",
      },
    ]);

    setDocumentTitle("");
    setDocumentCategory("Plan");
  }

  function addMeeting() {
    const title =
      meetingTitle.trim();

    if (!title) {
      return;
    }

    setMeetings((current) => [
      ...current,
      {
        id: createId(),
        title,
        date: meetingDate,
        purpose:
          meetingPurpose.trim() ||
          "Circle coordination",
      },
    ]);

    setMeetingTitle("");
    setMeetingDate("");
    setMeetingPurpose("");
  }

  function addResponsibility() {
    const title =
      responsibilityTitle.trim();

    if (!title) {
      return;
    }

    setResponsibilities(
      (current) => [
        ...current,
        {
          id: createId(),
          title,
          owner:
            responsibilityOwner.trim() ||
            "Whole circle",
          status: "Open",
        },
      ],
    );

    setResponsibilityTitle("");
    setResponsibilityOwner("");
  }

  function removeMember(
    memberId: string,
  ) {
    setMembers((current) =>
      current.filter(
        (member) =>
          member.id !== memberId,
      ),
    );
  }

  function removeGoal(goalId: string) {
    setGoals((current) =>
      current.filter(
        (goal) => goal.id !== goalId,
      ),
    );
  }

  function removeDocument(
    documentId: string,
  ) {
    setDocuments((current) =>
      current.filter(
        (document) =>
          document.id !== documentId,
      ),
    );
  }

  function removeMeeting(
    meetingId: string,
  ) {
    setMeetings((current) =>
      current.filter(
        (meeting) =>
          meeting.id !== meetingId,
      ),
    );
  }

  function removeResponsibility(
    responsibilityId: string,
  ) {
    setResponsibilities((current) =>
      current.filter(
        (responsibility) =>
          responsibility.id !==
          responsibilityId,
      ),
    );
  }

  function advanceGoal(
    goalId: string,
  ) {
    const statuses = [
      "Planning",
      "Active",
      "Complete",
    ] as const;

    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: getNextStatus(
                goal.status,
                statuses,
              ),
            }
          : goal,
      ),
    );
  }

  function advanceDocument(
    documentId: string,
  ) {
    const statuses = [
      "Draft",
      "Current",
      "Review needed",
    ] as const;

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: getNextStatus(
                document.status,
                statuses,
              ),
            }
          : document,
      ),
    );
  }

  function advanceResponsibility(
    responsibilityId: string,
  ) {
    const statuses = [
      "Open",
      "In progress",
      "Complete",
    ] as const;

    setResponsibilities((current) =>
      current.map(
        (responsibility) =>
          responsibility.id ===
          responsibilityId
            ? {
                ...responsibility,
                status:
                  getNextStatus(
                    responsibility.status,
                    statuses,
                  ),
              }
            : responsibility,
      ),
    );
  }

  const personDisplayName =
    profile.preferredName.trim() ||
    profile.personName.trim() ||
    "The person";

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#5b4936] text-[#3f3127]">
      <img
        src="/circles-of-support-centre.png"
        alt="The Circle of Support Centre with a circular table and an open place for the person"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/25" />

      <Link
        href="/office"
        aria-label="Return to the Smiling Monad Space"
        className="absolute left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/35 text-xl text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/70 sm:left-5 sm:top-5"
      >
        ←
      </Link>

      <button
        type="button"
        onClick={() =>
          setActivePanel("overview")
        }
        aria-label="Open the Circle of Support Centre"
        className="absolute left-1/2 top-[45%] z-10 h-[34%] w-[56%] -translate-x-1/2 rounded-full bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/65 sm:top-[42%] sm:h-[40%] sm:w-[42%]"
      />

      <nav className="absolute bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] max-w-4xl -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-[24px] border border-white/35 bg-[rgba(69,46,31,0.8)] p-2 shadow-[0_14px_35px_rgba(30,18,10,0.35)] backdrop-blur-md sm:bottom-5 sm:w-auto">
        {[
          ["overview", "Overview"],
          ["person", "Person"],
          ["members", "People"],
          ["goals", "Goals"],
          ["documents", "Documents"],
          ["meetings", "Meetings"],
          [
            "responsibilities",
            "Responsibilities",
          ],
        ].map(([panel, label]) => (
          <button
            key={panel}
            type="button"
            onClick={() =>
              setActivePanel(
                panel as ActivePanel,
              )
            }
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition ${
              activePanel === panel
                ? "bg-[#f4e8d7] text-[#4c3728]"
                : "bg-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(255,255,255,0.2)]"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {activePanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative max-h-[90svh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[#d9c7ad] bg-[rgba(255,250,241,0.98)] p-5 shadow-[0_30px_70px_rgba(25,18,12,0.48)] sm:p-8">
            <button
              type="button"
              onClick={() =>
                setActivePanel(null)
              }
              aria-label="Close the Circle Centre panel"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl text-[#5c4838] transition hover:bg-[#e3d3bd]"
            >
              ×
            </button>

            {activePanel ===
              "overview" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Circle of Support Centre
                </p>

                <h1 className="mt-3 pr-12 font-serif text-3xl leading-tight sm:text-4xl">
                  {personDisplayName}{" "}
                  remains at the centre
                </h1>

                <p className="mt-4 max-w-3xl leading-7 text-[#68584a]">
                  The Circle Centre helps
                  people coordinate goals,
                  relationships, meetings,
                  documents, budgets and
                  responsibilities around the
                  life of the person. Kimi can
                  help the circle understand,
                  organise and prepare—but the
                  person remains in control.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      label: "Circle members",
                      value: members.length,
                      panel:
                        "members" as ActivePanel,
                    },
                    {
                      label: "Active goals",
                      value: activeGoals,
                      panel:
                        "goals" as ActivePanel,
                    },
                    {
                      label:
                        "Documents for review",
                      value:
                        documentsNeedingReview,
                      panel:
                        "documents" as ActivePanel,
                    },
                    {
                      label:
                        "Upcoming meetings",
                      value: meetings.length,
                      panel:
                        "meetings" as ActivePanel,
                    },
                    {
                      label:
                        "Open responsibilities",
                      value:
                        openResponsibilities,
                      panel:
                        "responsibilities" as ActivePanel,
                    },
                    {
                      label: "Person profile",
                      value:
                        profile.personName
                          ? "Ready"
                          : "Start",
                      panel:
                        "person" as ActivePanel,
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        setActivePanel(
                          item.panel,
                        )
                      }
                      className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 text-left transition hover:bg-[#ede0cd]"
                    >
                      <p className="text-3xl font-semibold">
                        {item.value}
                      </p>

                      <p className="mt-2 text-sm text-[#6c594a]">
                        {item.label}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-[#efe3d3] p-5 sm:p-6">
                  <p className="font-serif text-2xl">
                    Kimi’s role
                  </p>

                  <p className="mt-3 leading-7 text-[#6a5b4e]">
                    Kimi can prepare meeting
                    agendas, identify missing
                    information, summarise updates,
                    draft plans and agreements,
                    track responsibilities and help
                    everyone communicate clearly.
                    Kimi does not replace the
                    person, family, workers or
                    professionals.
                  </p>
                </div>
              </>
            )}

            {activePanel === "person" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  The person at the centre
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Person profile
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
                  Begin with who the person is,
                  what matters to them and how they
                  communicate—not with services or
                  paperwork.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">
                      Full name
                    </span>

                    <input
                      value={
                        profile.personName
                      }
                      onChange={(event) =>
                        setProfile(
                          (current) => ({
                            ...current,
                            personName:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">
                      Preferred name
                    </span>

                    <input
                      value={
                        profile.preferredName
                      }
                      onChange={(event) =>
                        setProfile(
                          (current) => ({
                            ...current,
                            preferredName:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    />
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-medium">
                    What matters to this person?
                  </span>

                  <textarea
                    value={
                      profile.whatMatters
                    }
                    onChange={(event) =>
                      setProfile(
                        (current) => ({
                          ...current,
                          whatMatters:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Important relationships, routines, interests, hopes, preferences and things that help life feel right."
                    className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b]"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-medium">
                    Communication and decision
                    support
                  </span>

                  <textarea
                    value={
                      profile.communication
                    }
                    onChange={(event) =>
                      setProfile(
                        (current) => ({
                          ...current,
                          communication:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="How the person communicates, understands information, expresses consent, makes choices and shows when something is wrong."
                    className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b]"
                  />
                </label>

                <p className="mt-5 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
                  {loaded
                    ? "Changes are saved automatically to the shared Smiling Monad platform state and update live across the app."
                    : "Loading the shared Circle state…"}
                </p>
              </>
            )}

            {activePanel === "members" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  People and relationships
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Circle members
                </h1>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <input
                    value={memberName}
                    onChange={(event) =>
                      setMemberName(
                        event.target.value,
                      )
                    }
                    placeholder="Name"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    value={memberRole}
                    onChange={(event) =>
                      setMemberRole(
                        event.target.value,
                      )
                    }
                    placeholder="Role"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    value={
                      memberRelationship
                    }
                    onChange={(event) =>
                      setMemberRelationship(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        addMember();
                      }
                    }}
                    placeholder="Relationship"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addMember}
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add circle member
                </button>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {members.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151] sm:col-span-2">
                      No circle members have been
                      added yet.
                    </div>
                  ) : (
                    members.map((member) => (
                      <article
                        key={member.id}
                        className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#60432f] font-serif text-lg text-white">
                            {member.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeMember(
                                member.id,
                              )
                            }
                            className="text-sm text-[#98765e]"
                          >
                            Remove
                          </button>
                        </div>

                        <p className="mt-3 font-serif text-xl">
                          {member.name}
                        </p>

                        <p className="mt-1 text-sm text-[#756151]">
                          {member.role}
                        </p>

                        <p className="mt-2 text-sm text-[#8a786a]">
                          {
                            member.relationship
                          }
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </>
            )}

            {activePanel === "goals" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  What the circle is working
                  toward
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Goals and projects
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.7fr]">
                  <input
                    value={goalTitle}
                    onChange={(event) =>
                      setGoalTitle(
                        event.target.value,
                      )
                    }
                    placeholder="Goal or project"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    value={goalOwner}
                    onChange={(event) =>
                      setGoalOwner(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        addGoal();
                      }
                    }}
                    placeholder="Lead person"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addGoal}
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add goal
                </button>

                <div className="mt-6 space-y-3">
                  {goals.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No goals have been added
                      yet.
                    </div>
                  ) : (
                    goals.map((goal) => (
                      <article
                        key={goal.id}
                        className="flex flex-col gap-4 rounded-[20px] border border-[#dfd2c1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-serif text-xl">
                            {goal.title}
                          </p>

                          <p className="mt-1 text-sm text-[#756151]">
                            Lead: {goal.owner}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              advanceGoal(
                                goal.id,
                              )
                            }
                            className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                          >
                            {goal.status}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeGoal(
                                goal.id,
                              )
                            }
                            className="px-2 py-2 text-sm text-[#98765e]"
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </>
            )}

            {activePanel ===
              "documents" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Shared information
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Documents and records
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.6fr]">
                  <input
                    value={documentTitle}
                    onChange={(event) =>
                      setDocumentTitle(
                        event.target.value,
                      )
                    }
                    placeholder="Document title"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <select
                    value={
                      documentCategory
                    }
                    onChange={(event) =>
                      setDocumentCategory(
                        event.target
                          .value as CircleDocument["category"],
                      )
                    }
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  >
                    <option value="Plan">
                      Plan
                    </option>
                    <option value="Agreement">
                      Agreement
                    </option>
                    <option value="Report">
                      Report
                    </option>
                    <option value="Meeting">
                      Meeting
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={addDocument}
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add document
                </button>

                <div className="mt-6 space-y-3">
                  {documents.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No shared documents have
                      been added yet.
                    </div>
                  ) : (
                    documents.map(
                      (document) => (
                        <article
                          key={document.id}
                          className="flex flex-col gap-4 rounded-[20px] border border-[#dfd2c1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-serif text-xl">
                              {
                                document.title
                              }
                            </p>

                            <p className="mt-1 text-sm text-[#756151]">
                              {
                                document.category
                              }
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                advanceDocument(
                                  document.id,
                                )
                              }
                              className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                            >
                              {
                                document.status
                              }
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeDocument(
                                  document.id,
                                )
                              }
                              className="px-2 py-2 text-sm text-[#98765e]"
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ),
                    )
                  )}
                </div>
              </>
            )}

            {activePanel ===
              "meetings" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Shared communication
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Meetings
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.55fr]">
                  <input
                    value={meetingTitle}
                    onChange={(event) =>
                      setMeetingTitle(
                        event.target.value,
                      )
                    }
                    placeholder="Meeting title"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(event) =>
                      setMeetingDate(
                        event.target.value,
                      )
                    }
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />
                </div>

                <input
                  value={meetingPurpose}
                  onChange={(event) =>
                    setMeetingPurpose(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      addMeeting();
                    }
                  }}
                  placeholder="Purpose"
                  className="mt-3 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                />

                <button
                  type="button"
                  onClick={addMeeting}
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add meeting
                </button>

                <div className="mt-6 space-y-3">
                  {meetings.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No meetings have been
                      added yet.
                    </div>
                  ) : (
                    meetings.map(
                      (meeting) => (
                        <article
                          key={meeting.id}
                          className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-serif text-xl">
                                {
                                  meeting.title
                                }
                              </p>

                              <p className="mt-1 text-sm text-[#756151]">
                                {meeting.date ||
                                  "Date not set"}
                              </p>

                              <p className="mt-3 leading-7 text-[#6b5d50]">
                                {
                                  meeting.purpose
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeMeeting(
                                  meeting.id,
                                )
                              }
                              className="text-sm text-[#98765e]"
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ),
                    )
                  )}
                </div>
              </>
            )}

            {activePanel ===
              "responsibilities" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Clear roles and follow-through
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Responsibilities
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
                  This area can later include
                  budgets, service agreements,
                  consent, permissions, funding
                  responsibilities and who is
                  completing each agreed action.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.65fr]">
                  <input
                    value={
                      responsibilityTitle
                    }
                    onChange={(event) =>
                      setResponsibilityTitle(
                        event.target.value,
                      )
                    }
                    placeholder="Responsibility or action"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    value={
                      responsibilityOwner
                    }
                    onChange={(event) =>
                      setResponsibilityOwner(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        addResponsibility();
                      }
                    }}
                    placeholder="Responsible person"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    addResponsibility
                  }
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add responsibility
                </button>

                <div className="mt-6 space-y-3">
                  {responsibilities.length ===
                  0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No responsibilities have
                      been recorded yet.
                    </div>
                  ) : (
                    responsibilities.map(
                      (responsibility) => (
                        <article
                          key={
                            responsibility.id
                          }
                          className="flex flex-col gap-4 rounded-[20px] border border-[#dfd2c1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-serif text-xl">
                              {
                                responsibility.title
                              }
                            </p>

                            <p className="mt-1 text-sm text-[#756151]">
                              Responsible:{" "}
                              {
                                responsibility.owner
                              }
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                advanceResponsibility(
                                  responsibility.id,
                                )
                              }
                              className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                            >
                              {
                                responsibility.status
                              }
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeResponsibility(
                                  responsibility.id,
                                )
                              }
                              className="px-2 py-2 text-sm text-[#98765e]"
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ),
                    )
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}