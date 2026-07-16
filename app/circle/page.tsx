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

type ActivePanel =
  | "overview"
  | "participants"
  | "projects"
  | "members";

const MEMBER_STORAGE_KEY =
  "smiling-monad-circle-members";
const PARTICIPANT_STORAGE_KEY =
  "smiling-monad-participants";
const PROJECT_STORAGE_KEY =
  "smiling-monad-circle-projects";

function createId() {
  return crypto.randomUUID();
}

export default function CirclePage() {
  const [members, setMembers] = useState<
    CircleMember[]
  >([]);
  const [participants, setParticipants] = useState<
    Participant[]
  >([]);
  const [projects, setProjects] = useState<
    Project[]
  >([]);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [participantName, setParticipantName] =
    useState("");
  const [projectTitle, setProjectTitle] =
    useState("");
  const [
    projectParticipant,
    setProjectParticipant,
  ] = useState("");

  const [activePanel, setActivePanel] =
    useState<ActivePanel | null>(null);

  useEffect(() => {
    const savedMembers = localStorage.getItem(
      MEMBER_STORAGE_KEY
    );
    const savedParticipants = localStorage.getItem(
      PARTICIPANT_STORAGE_KEY
    );
    const savedProjects = localStorage.getItem(
      PROJECT_STORAGE_KEY
    );

    if (savedMembers) {
      try {
        setMembers(
          JSON.parse(savedMembers) as CircleMember[]
        );
      } catch {
        setMembers([]);
      }
    }

    if (savedParticipants) {
      try {
        setParticipants(
          JSON.parse(
            savedParticipants
          ) as Participant[]
        );
      } catch {
        setParticipants([]);
      }
    }

    if (savedProjects) {
      try {
        setProjects(
          JSON.parse(savedProjects) as Project[]
        );
      } catch {
        setProjects([]);
      }
    }
  }, []);

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status !== "Complete"
      ).length,
    [projects]
  );

  function saveMembers(
    updatedMembers: CircleMember[]
  ) {
    setMembers(updatedMembers);
    localStorage.setItem(
      MEMBER_STORAGE_KEY,
      JSON.stringify(updatedMembers)
    );
  }

  function saveParticipants(
    updatedParticipants: Participant[]
  ) {
    setParticipants(updatedParticipants);
    localStorage.setItem(
      PARTICIPANT_STORAGE_KEY,
      JSON.stringify(updatedParticipants)
    );
  }

  function saveProjects(
    updatedProjects: Project[]
  ) {
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
    saveMembers(
      members.filter(
        (member) => member.id !== id
      )
    );
  }

  function removeParticipant(id: string) {
    const participant = participants.find(
      (item) => item.id === id
    );

    saveParticipants(
      participants.filter(
        (item) => item.id !== id
      )
    );

    if (participant) {
      saveProjects(
        projects.filter(
          (project) =>
            project.participant !==
            participant.name
        )
      );
    }
  }

  function advanceProject(projectId: string) {
    saveProjects(
      projects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

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

  function openPanel(panel: ActivePanel) {
    setActivePanel(panel);
  }

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#5b4936] text-[#3f3127]">
      <img
        src="/circles-of-support-centre.png"
        alt="The Circles of Support Centre with a circular table and an open place for the participant"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20" />

      <Link
        href="/office"
        aria-label="Return to the Smiling Monad Space"
        className="absolute left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/35 text-xl text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/70 sm:left-5 sm:top-5"
      >
        ←
      </Link>

      <button
        type="button"
        onClick={() => openPanel("overview")}
        aria-label="Open the Circles of Support overview"
        className="absolute left-1/2 top-[48%] z-10 h-[28%] w-[46%] -translate-x-1/2 rounded-full bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/65 sm:top-[44%] sm:h-[36%] sm:w-[38%]"
      />

      <nav className="absolute bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-[24px] border border-white/35 bg-[rgba(69,46,31,0.78)] p-2 shadow-[0_14px_35px_rgba(30,18,10,0.35)] backdrop-blur-md sm:bottom-5 sm:w-auto">
        <button
          type="button"
          onClick={() => openPanel("overview")}
          className="shrink-0 rounded-full bg-[#f4e8d7] px-4 py-2.5 text-sm font-medium text-[#4c3728] transition hover:bg-white"
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() =>
            openPanel("participants")
          }
          className="shrink-0 rounded-full bg-[rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.2)]"
        >
          Participants
        </button>

        <button
          type="button"
          onClick={() => openPanel("projects")}
          className="shrink-0 rounded-full bg-[rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.2)]"
        >
          Projects
        </button>

        <button
          type="button"
          onClick={() => openPanel("members")}
          className="shrink-0 rounded-full bg-[rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.2)]"
        >
          Members
        </button>
      </nav>

      {activePanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative max-h-[88svh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#d9c7ad] bg-[rgba(255,250,241,0.97)] p-5 shadow-[0_30px_70px_rgba(25,18,12,0.48)] sm:p-8">
            <button
              type="button"
              onClick={() =>
                setActivePanel(null)
              }
              aria-label="Close the Circles of Support panel"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl text-[#5c4838] transition hover:bg-[#e3d3bd]"
            >
              ×
            </button>

            {activePanel === "overview" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Circles of Support Centre
                </p>

                <h1 className="mt-3 pr-10 font-serif text-3xl leading-tight sm:text-4xl">
                  The participant remains at the
                  centre
                </h1>

                <p className="mt-4 leading-7 text-[#68584a]">
                  Plans, relationships, projects,
                  communication and shared work are
                  coordinated around the participant.
                  The system supports the person, rather
                  than asking the person to fit the
                  system.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      openPanel("participants")
                    }
                    className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 text-left transition hover:bg-[#ede0cd]"
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
                    onClick={() =>
                      openPanel("projects")
                    }
                    className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 text-left transition hover:bg-[#ede0cd]"
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
                    onClick={() =>
                      openPanel("members")
                    }
                    className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 text-left transition hover:bg-[#ede0cd]"
                  >
                    <p className="text-3xl font-semibold">
                      {members.length}
                    </p>
                    <p className="mt-2 text-sm text-[#6c594a]">
                      Circle members
                    </p>
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Plan coordination",
                    "Goals and projects",
                    "Shared communication",
                    "Documents and records",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[18px] border border-[#e2d5c3] bg-white px-4 py-4 font-serif text-lg"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activePanel === "participants" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Participant plans
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Participants
                </h1>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={participantName}
                    onChange={(event) =>
                      setParticipantName(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        addParticipant();
                      }
                    }}
                    placeholder="Participant name"
                    className="min-w-0 flex-1 rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <button
                    type="button"
                    onClick={addParticipant}
                    className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                  >
                    Add participant
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {participants.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No participants have been
                      added yet.
                    </div>
                  ) : (
                    participants.map(
                      (participant) => (
                        <article
                          key={participant.id}
                          className="rounded-[20px] border border-[#dfd2c1] bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-serif text-2xl">
                                {
                                  participant.name
                                }
                              </p>
                              <p className="mt-1 text-sm text-[#756151]">
                                Plan status:{" "}
                                {
                                  participant.planStatus
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeParticipant(
                                  participant.id
                                )
                              }
                              className="text-sm text-[#98765e]"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            {[
                              "Plan",
                              "Goals",
                              "Documents",
                              "Circle",
                            ].map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="rounded-xl bg-[#f4eadc] p-3 text-left"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </article>
                      )
                    )
                  )}
                </div>
              </>
            )}

            {activePanel === "projects" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Coordinated work
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Projects
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.8fr]">
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(event) =>
                      setProjectTitle(
                        event.target.value
                      )
                    }
                    placeholder="Project or goal"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <select
                    value={projectParticipant}
                    onChange={(event) =>
                      setProjectParticipant(
                        event.target.value
                      )
                    }
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  >
                    <option value="">
                      Whole circle
                    </option>

                    {participants.map(
                      (participant) => (
                        <option
                          key={participant.id}
                          value={participant.name}
                        >
                          {participant.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={addProject}
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add project
                </button>

                <div className="mt-6 space-y-3">
                  {projects.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No projects have been created
                      yet.
                    </div>
                  ) : (
                    projects.map((project) => (
                      <article
                        key={project.id}
                        className="flex items-center justify-between gap-4 rounded-[20px] border border-[#dfd2c1] bg-white p-5"
                      >
                        <div>
                          <p className="font-serif text-xl">
                            {project.title}
                          </p>
                          <p className="mt-1 text-sm text-[#756151]">
                            {
                              project.participant
                            }
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            advanceProject(
                              project.id
                            )
                          }
                          className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                        >
                          {project.status}
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </>
            )}

            {activePanel === "members" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  People and relationships
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Circle Members
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={memberName}
                    onChange={(event) =>
                      setMemberName(
                        event.target.value
                      )
                    }
                    placeholder="Member name"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    type="text"
                    value={memberRole}
                    onChange={(event) =>
                      setMemberRole(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        addMember();
                      }
                    }}
                    placeholder="Role or relationship"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addMember}
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add member
                </button>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {members.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No circle members have been
                      added yet.
                    </div>
                  ) : (
                    members.map((member) => (
                      <article
                        key={member.id}
                        className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#60432f] font-serif text-lg text-white">
                          {member.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <p className="mt-3 font-serif text-xl">
                          {member.name}
                        </p>

                        <p className="mt-1 text-sm text-[#756151]">
                          {member.role}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeMember(member.id)
                          }
                          className="mt-4 text-sm text-[#98765e]"
                        >
                          Remove
                        </button>
                      </article>
                    ))
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