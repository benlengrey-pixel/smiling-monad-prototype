"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CircleMember = {
  id: string;
  name: string;
  role: string;
};

type Participant = {
  id: string;
  name: string;
  planStatus: "Active" | "Review needed";
};

type Project = {
  id: string;
  title: string;
  participant: string;
  status: "Planning" | "Active" | "Complete";
};

const MEMBER_STORAGE_KEY = "smiling-monad-circle-members";
const PARTICIPANT_STORAGE_KEY = "smiling-monad-participants";
const PROJECT_STORAGE_KEY = "smiling-monad-circle-projects";

function createId() {
  return crypto.randomUUID();
}

export default function CirclePage() {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  const [participantName, setParticipantName] = useState("");

  const [projectTitle, setProjectTitle] = useState("");
  const [projectParticipant, setProjectParticipant] = useState("");

  const [activePanel, setActivePanel] = useState<
    "overview" | "participants" | "projects" | "members"
  >("overview");

  useEffect(() => {
    const savedMembers = localStorage.getItem(MEMBER_STORAGE_KEY);
    const savedParticipants = localStorage.getItem(
      PARTICIPANT_STORAGE_KEY
    );
    const savedProjects = localStorage.getItem(PROJECT_STORAGE_KEY);

    if (savedMembers) {
      try {
        setMembers(JSON.parse(savedMembers) as CircleMember[]);
      } catch {
        setMembers([]);
      }
    }

    if (savedParticipants) {
      try {
        setParticipants(
          JSON.parse(savedParticipants) as Participant[]
        );
      } catch {
        setParticipants([]);
      }
    }

    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects) as Project[]);
      } catch {
        setProjects([]);
      }
    }
  }, []);

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) => project.status !== "Complete"
      ).length,
    [projects]
  );

  function saveMembers(updatedMembers: CircleMember[]) {
    setMembers(updatedMembers);
    localStorage.setItem(
      MEMBER_STORAGE_KEY,
      JSON.stringify(updatedMembers)
    );
  }

  function saveParticipants(updatedParticipants: Participant[]) {
    setParticipants(updatedParticipants);
    localStorage.setItem(
      PARTICIPANT_STORAGE_KEY,
      JSON.stringify(updatedParticipants)
    );
  }

  function saveProjects(updatedProjects: Project[]) {
    setProjects(updatedProjects);
    localStorage.setItem(
      PROJECT_STORAGE_KEY,
      JSON.stringify(updatedProjects)
    );
  }

  function addMember() {
    const cleanName = memberName.trim();
    const cleanRole = memberRole.trim();

    if (!cleanName) return;

    saveMembers([
      ...members,
      {
        id: createId(),
        name: cleanName,
        role: cleanRole || "Circle member",
      },
    ]);

    setMemberName("");
    setMemberRole("");
  }

  function addParticipant() {
    const cleanName = participantName.trim();

    if (!cleanName) return;

    saveParticipants([
      ...participants,
      {
        id: createId(),
        name: cleanName,
        planStatus: "Active",
      },
    ]);

    setParticipantName("");
  }

  function addProject() {
    const cleanTitle = projectTitle.trim();

    if (!cleanTitle) return;

    saveProjects([
      ...projects,
      {
        id: createId(),
        title: cleanTitle,
        participant:
          projectParticipant || "Whole circle",
        status: "Planning",
      },
    ]);

    setProjectTitle("");
    setProjectParticipant("");
  }

  function removeMember(id: string) {
    saveMembers(members.filter((member) => member.id !== id));
  }

  function removeParticipant(id: string) {
    const participant = participants.find(
      (item) => item.id === id
    );

    saveParticipants(
      participants.filter((item) => item.id !== id)
    );

    if (participant) {
      saveProjects(
        projects.filter(
          (project) =>
            project.participant !== participant.name
        )
      );
    }
  }

  function advanceProject(projectId: string) {
    saveProjects(
      projects.map((project) => {
        if (project.id !== projectId) return project;

        if (project.status === "Planning") {
          return {
            ...project,
            status: "Active",
          };
        }

        if (project.status === "Active") {
          return {
            ...project,
            status: "Complete",
          };
        }

        return {
          ...project,
          status: "Planning",
        };
      })
    );
  }

  const panelButtonClass = (
    panel: "overview" | "participants" | "projects" | "members"
  ) =>
    [
      "rounded-full px-4 py-2 text-sm transition",
      activePanel === panel
        ? "bg-[#60432f] text-white shadow-sm"
        : "bg-[#eee2d1] text-[#513e30] hover:bg-[#e4d4bf]",
    ].join(" ");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eee5d6_0%,#f8f4ec_38%,#e8dccb_100%)] px-4 py-5 text-[#3f3127] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[28px] border border-[#d6c5ae] bg-[rgba(255,251,244,0.92)] p-5 shadow-[0_18px_45px_rgba(69,44,22,0.12)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Link
                href="/office"
                className="inline-flex items-center rounded-full bg-[#60432f] px-4 py-2 text-sm text-white transition hover:bg-[#4f3728]"
              >
                ← Back to the Space
              </Link>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.32em] text-[#89735e]">
                The Smiling Monad
              </p>

              <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">
                Circle of Support Centre
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-[#6e5b4c]">
                A calm central place where participants, their
                circles, plans, projects and shared work can be
                coordinated together.
              </p>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-[#554235] bg-[#f7efe3] shadow-inner">
              <div className="relative h-16 w-16 rounded-full border-[3px] border-[#554235]">
                <div className="absolute left-[13px] top-[20px] h-2.5 w-2.5 rounded-full bg-[#554235]" />
                <div className="absolute right-[13px] top-[20px] h-2.5 w-2.5 rounded-full bg-[#554235]" />
                <div className="absolute bottom-[11px] left-1/2 h-7 w-10 -translate-x-1/2 rounded-b-full border-b-[3px] border-l-[3px] border-r-[3px] border-[#554235]" />
              </div>
            </div>
          </div>

          <nav className="mt-7 flex flex-wrap gap-2 border-t border-[#e1d4c3] pt-5">
            <button
              type="button"
              onClick={() => setActivePanel("overview")}
              className={panelButtonClass("overview")}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("participants")}
              className={panelButtonClass("participants")}
            >
              Participants
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("projects")}
              className={panelButtonClass("projects")}
            >
              Projects
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("members")}
              className={panelButtonClass("members")}
            >
              Circle Members
            </button>
          </nav>
        </header>

        {activePanel === "overview" && (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[26px] border border-[#d7c7b1] bg-[#fffaf2] p-5 shadow-[0_14px_35px_rgba(65,42,22,0.09)] sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8e755e]">
                Circle overview
              </p>

              <h2 className="mt-3 font-serif text-3xl">
                Everything coordinated in one place
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setActivePanel("participants")}
                  className="rounded-[22px] border border-[#ded0bd] bg-[#f4eadc] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-3xl font-semibold">
                    {participants.length}
                  </p>
                  <p className="mt-2 text-sm text-[#6c594a]">
                    Participants
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanel("projects")}
                  className="rounded-[22px] border border-[#ded0bd] bg-[#f4eadc] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-3xl font-semibold">
                    {activeProjects}
                  </p>
                  <p className="mt-2 text-sm text-[#6c594a]">
                    Active projects
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanel("members")}
                  className="rounded-[22px] border border-[#ded0bd] bg-[#f4eadc] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-3xl font-semibold">
                    {members.length}
                  </p>
                  <p className="mt-2 text-sm text-[#6c594a]">
                    Circle members
                  </p>
                </button>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[#e1d4c3] bg-white p-5">
                  <h3 className="font-serif text-xl">
                    Plan coordination
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#736052]">
                    Keep plan information, budgets, service
                    agreements, reviews and important dates
                    together.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#e1d4c3] bg-white p-5">
                  <h3 className="font-serif text-xl">
                    Shared communication
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#736052]">
                    Help participants, families, workers and
                    professionals stay informed without repeating
                    everything.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#e1d4c3] bg-white p-5">
                  <h3 className="font-serif text-xl">
                    Goals and projects
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#736052]">
                    Turn a participant&apos;s goals into practical
                    projects with clear responsibilities and next
                    steps.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#e1d4c3] bg-white p-5">
                  <h3 className="font-serif text-xl">
                    Documents and records
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#736052]">
                    Keep reports, notes, plans and important
                    documents available to the right people.
                  </p>
                </div>
              </div>
            </div>

            <aside className="rounded-[26px] border border-[#5f402d] bg-[linear-gradient(160deg,#6d4a32_0%,#3f2a1e_100%)] p-5 text-[#fff8ee] shadow-[0_18px_40px_rgba(52,32,16,0.24)] sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d9c4aa]">
                The centre
              </p>

              <h2 className="mt-3 font-serif text-3xl">
                The participant remains at the centre
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#eadbca]">
                The Circle of Support Centre exists to support the
                participant&apos;s own life, choices, relationships
                and goals. It coordinates the system around the
                person rather than making the person fit the system.
              </p>

              <div className="mt-7 rounded-[20px] border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] p-5">
                <p className="font-serif text-xl">
                  Next important action
                </p>
                <p className="mt-2 text-sm leading-6 text-[#eadbca]">
                  Add the first participant, then add the people who
                  belong in their circle.
                </p>
              </div>
            </aside>
          </section>
        )}

        {activePanel === "participants" && (
          <section className="mt-5 rounded-[26px] border border-[#d7c7b1] bg-[#fffaf2] p-5 shadow-[0_14px_35px_rgba(65,42,22,0.09)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8e755e]">
              Participant plans
            </p>

            <h2 className="mt-3 font-serif text-3xl">
              Participants
            </h2>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={participantName}
                onChange={(event) =>
                  setParticipantName(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") addParticipant();
                }}
                placeholder="Participant name"
                className="min-w-0 flex-1 rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none transition focus:border-[#71523b]"
              />

              <button
                type="button"
                onClick={addParticipant}
                className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
              >
                Add participant
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {participants.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
                  No participants have been added yet.
                </div>
              ) : (
                participants.map((participant) => (
                  <article
                    key={participant.id}
                    className="rounded-[22px] border border-[#dfd2c1] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-2xl">
                          {participant.name}
                        </p>
                        <p className="mt-2 text-sm text-[#756151]">
                          Plan status: {participant.planStatus}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeParticipant(participant.id)
                        }
                        className="text-sm text-[#98765e] hover:text-[#5c3d2c]"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-[#f4eadc] p-3">
                        Plan
                      </div>
                      <div className="rounded-xl bg-[#f4eadc] p-3">
                        Goals
                      </div>
                      <div className="rounded-xl bg-[#f4eadc] p-3">
                        Documents
                      </div>
                      <div className="rounded-xl bg-[#f4eadc] p-3">
                        Circle
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activePanel === "projects" && (
          <section className="mt-5 rounded-[26px] border border-[#d7c7b1] bg-[#fffaf2] p-5 shadow-[0_14px_35px_rgba(65,42,22,0.09)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8e755e]">
              Coordinated work
            </p>

            <h2 className="mt-3 font-serif text-3xl">
              Projects
            </h2>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.7fr_auto]">
              <input
                type="text"
                value={projectTitle}
                onChange={(event) =>
                  setProjectTitle(event.target.value)
                }
                placeholder="Project or goal"
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none transition focus:border-[#71523b]"
              />

              <select
                value={projectParticipant}
                onChange={(event) =>
                  setProjectParticipant(event.target.value)
                }
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none transition focus:border-[#71523b]"
              >
                <option value="">Whole circle</option>

                {participants.map((participant) => (
                  <option
                    key={participant.id}
                    value={participant.name}
                  >
                    {participant.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={addProject}
                className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
              >
                Add project
              </button>
            </div>

            <div className="mt-7 space-y-4">
              {projects.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
                  No projects have been created yet.
                </div>
              ) : (
                projects.map((project) => (
                  <article
                    key={project.id}
                    className="flex flex-col gap-4 rounded-[22px] border border-[#dfd2c1] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-serif text-xl">
                        {project.title}
                      </p>
                      <p className="mt-1 text-sm text-[#756151]">
                        {project.participant}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        advanceProject(project.id)
                      }
                      className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d] transition hover:bg-[#e4d3bc]"
                    >
                      {project.status}
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activePanel === "members" && (
          <section className="mt-5 rounded-[26px] border border-[#d7c7b1] bg-[#fffaf2] p-5 shadow-[0_14px_35px_rgba(65,42,22,0.09)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8e755e]">
              People and relationships
            </p>

            <h2 className="mt-3 font-serif text-3xl">
              Circle Members
            </h2>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={memberName}
                onChange={(event) =>
                  setMemberName(event.target.value)
                }
                placeholder="Member name"
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none transition focus:border-[#71523b]"
              />

              <input
                type="text"
                value={memberRole}
                onChange={(event) =>
                  setMemberRole(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") addMember();
                }}
                placeholder="Role or relationship"
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none transition focus:border-[#71523b]"
              />

              <button
                type="button"
                onClick={addMember}
                className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
              >
                Add member
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
                  No circle members have been added yet.
                </div>
              ) : (
                members.map((member) => (
                  <article
                    key={member.id}
                    className="rounded-[22px] border border-[#dfd2c1] bg-white p-5 shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#60432f] font-serif text-xl text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    <p className="mt-4 font-serif text-xl">
                      {member.name}
                    </p>

                    <p className="mt-1 text-sm text-[#756151]">
                      {member.role}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="mt-5 text-sm text-[#98765e] hover:text-[#5c3d2c]"
                    >
                      Remove
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}