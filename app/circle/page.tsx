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

import {
  updateSecureParticipantProfile,
  type SecureCircleWorkspace,
} from "@/lib/circle/secure-circle-client";

import {
  createMySecureCircle,
  listMySecureCircles,
  openSelectedSecureCircle,
  type SecureCircleDirectoryEntry,
} from "@/lib/circle/secure-circle-directory-client";

import {
  advanceSecureCircleGoal,
  archiveSecureCircleGoal,
  createSecureCircleGoal,
  readSecureCircleGoals,
  type SecureCircleGoal,
} from "@/lib/circle/secure-goals-client";

import {
  archiveSecureCircleDocument,
  createSecureDocumentDownloadUrl,
  readSecureCircleDocuments,
  type SecureCircleDocument,
} from "@/lib/circle/secure-documents-client";

import {
  readSecureCircleMessages,
  sendSecureCircleMessage,
  subscribeToSecureCircleMessages,
  type SecureCircleMessage,
} from "@/lib/circle/secure-circle-messages-client";

import {
  createSecureBudgetItem,
  createSecureMeeting,
  createSecureResponsibility,
  inviteSecureCircleMember,
  readSecureCircleOperations,
  updateSecureBudgetItem,
  updateSecureCircleMember,
  updateSecureMeeting,
  updateSecureResponsibility,
  type SecureCircleBudgetItem,
  type SecureCircleMeeting,
  type SecureCircleMemberRecord,
  type SecureCircleResponsibility,
  type SecureMemberRole,
} from "@/lib/circle/secure-circle-operations-client";

import {
  readSecureCircleAuditHistory,
  type SecureAuditEvent,
} from "@/lib/circle/secure-audit-client";

import {
  addAuditActorNames,
} from "@/lib/circle/secure-audit-actors";

import CircleDirectory from "@/components/circle/CircleDirectory";
import AuditPanel from "@/components/circle/panels/AuditPanel";
import BudgetPanel from "@/components/circle/panels/BudgetPanel";
import ConversationPanel from "@/components/circle/panels/ConversationPanel";
import DocumentsPanel from "@/components/circle/panels/DocumentsPanel";
import GoalsPanel from "@/components/circle/panels/GoalsPanel";
import MeetingsPanel from "@/components/circle/panels/MeetingsPanel";
import MembersPanel from "@/components/circle/panels/MembersPanel";
import OverviewPanel from "@/components/circle/panels/OverviewPanel";
import PersonProfilePanel from "@/components/circle/panels/PersonProfilePanel";
import ResponsibilitiesPanel from "@/components/circle/panels/ResponsibilitiesPanel";
import TrainingPanel from "@/components/circle/panels/TrainingPanel";

import {
  readSecureConsentSummary,
  type SecureConsentSummary,
} from "@/lib/circle/secure-consent-status-client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  assignMandatoryCircleTraining,
  getActiveCircleModule,
  readCircleTrainingRequirements,
  subscribeToCircleTraining,
  type CircleTrainingAudience,
  type CircleTrainingRequirement,
  type ParticipantSpecificTrainingModule,
} from "@/lib/training/circle-modules";

type CircleState =
  SmilingMonadState["circle"];

type CircleProfile =
  CircleState["profile"];

type ActivePanel =
  | "overview"
  | "person"
  | "members"
  | "goals"
  | "documents"
  | "conversation"
  | "meetings"
  | "responsibilities"
  | "budget"
  | "training"
  | "audit";

const ACTIVE_CIRCLE_PANEL_KEY =
  "smiling-monad-active-circle-panel";

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
  budgets: [],
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

function describeUnknownError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      candidate.message,
      candidate.details,
      candidate.hint,
      candidate.code
        ? `Code: ${String(candidate.code)}`
        : null,
    ].filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    );

    if (parts.length > 0) {
      return parts.join(" ");
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error;
  }

  return "Your Circle of Support could not be opened.";
}

export default function CirclePage() {
  const [loaded, setLoaded] =
    useState(false);

  const [
    selectedCircleId,
    setSelectedCircleId,
  ] = useState("");

  const [
    directoryEntries,
    setDirectoryEntries,
  ] = useState<
    SecureCircleDirectoryEntry[]
  >([]);

  const [
    directoryLoading,
    setDirectoryLoading,
  ] = useState(true);

  const [
    directoryCreating,
    setDirectoryCreating,
  ] = useState(false);

  const [
    openingCircleId,
    setOpeningCircleId,
  ] = useState("");

  const [
    directoryMessage,
    setDirectoryMessage,
  ] = useState("");

  const [workspace, setWorkspace] =
    useState<SecureCircleWorkspace | null>(
      null,
    );

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [accessError, setAccessError] =
    useState("");

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profile, setProfileState] =
    useState<CircleProfile>(
      emptyCircle.profile,
    );

  const [circle, setCircle] =
    useState<CircleState>(
      emptyCircle,
    );

  const [members, setMembers] =
    useState<SecureCircleMemberRecord[]>([]);

  const [goals, setGoals] =
    useState<SecureCircleGoal[]>([]);

  const [meetings, setMeetings] =
    useState<SecureCircleMeeting[]>([]);

  const [responsibilities, setResponsibilities] =
    useState<SecureCircleResponsibility[]>([]);

  const [budgets, setBudgets] =
    useState<SecureCircleBudgetItem[]>([]);

  const [operationsLoading, setOperationsLoading] =
    useState(true);

  const [operationWorkingId, setOperationWorkingId] =
    useState("");

  const [operationMessage, setOperationMessage] =
    useState("");

  const [goalsLoading, setGoalsLoading] =
    useState(true);

  const [goalWorkingId, setGoalWorkingId] =
    useState("");

  const [goalMessage, setGoalMessage] =
    useState("");

  const [documents, setDocuments] =
    useState<SecureCircleDocument[]>([]);

  const [documentsLoading, setDocumentsLoading] =
    useState(false);

  const [documentWorkingId, setDocumentWorkingId] =
    useState("");

  const [documentMessage, setDocumentMessage] =
    useState("");

  const [circleMessages, setCircleMessages] =
    useState<SecureCircleMessage[]>([]);

  const [circleMessagesLoading, setCircleMessagesLoading] =
    useState(false);

  const [circleMessageWorking, setCircleMessageWorking] =
    useState(false);

  const [circleMessageText, setCircleMessageText] =
    useState("");

  const [circleMessageNotice, setCircleMessageNotice] =
    useState("");

  const [auditEvents, setAuditEvents] =
    useState<SecureAuditEvent[]>([]);

  const [auditLoading, setAuditLoading] =
    useState(false);

  const [auditMessage, setAuditMessage] =
    useState("");

  const [consentSummary, setConsentSummary] =
    useState<SecureConsentSummary | null>(
      null,
    );

  function commitCircle(
    updater: (
      current: CircleState,
    ) => CircleState,
  ) {
    const nextState =
      updateSmilingMonadState(
        (currentState) => {
          const nextCircle = updater({
            ...currentState.circle,
            profile: emptyCircle.profile,
          });

          return {
            ...currentState,
            circle: {
              ...nextCircle,
              profile: emptyCircle.profile,
            },
          };
        },
      );

    setCircle({
      ...nextState.circle,
      profile: emptyCircle.profile,
    });
  }

  function setProfile(
    update: StateUpdate<CircleProfile>,
  ) {
    setProfileState((current) =>
      resolveStateUpdate(
        current,
        update,
      ),
    );

    setProfileMessage(
      "Changes not yet saved.",
    );
  }

  async function saveProfile() {
    if (!workspace || profileSaving) {
      return;
    }

    setProfileSaving(true);
    setProfileMessage("");

    try {
      const updatedParticipant =
        await updateSecureParticipantProfile(
          workspace.participant.id,
          {
            fullName: profile.personName,
            preferredName:
              profile.preferredName,
            whatMatters:
              profile.whatMatters,
            communicationSupport:
              profile.communication,
            decisionSupport: "",
          },
        );

      setWorkspace((current) =>
        current
          ? {
              ...current,
              participant:
                updatedParticipant,
            }
          : current,
      );

      setProfileState({
        personName:
          updatedParticipant.full_name,
        preferredName:
          updatedParticipant.preferred_name,
        whatMatters:
          updatedParticipant.what_matters,
        communication:
          [
            updatedParticipant.communication_support,
            updatedParticipant.decision_support,
          ]
            .filter(Boolean)
            .join("\n\n"),
      });

      setProfileMessage(
        "Saved securely to your Circle.",
      );
    } catch (error) {
      setProfileMessage(
        error instanceof Error
          ? error.message
          : "The profile could not be saved.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  const [activePanel, setActivePanel] =
    useState<ActivePanel | null>(
      null,
    );

  const [
    panelNavigationReady,
    setPanelNavigationReady,
  ] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const validPanels: ActivePanel[] = [
      "overview",
      "person",
      "members",
      "goals",
      "documents",
      "conversation",
      "meetings",
      "responsibilities",
      "budget",
      "training",
      "audit",
    ];

    const panelFromUrl =
      new URLSearchParams(
        window.location.search,
      ).get("panel");

    const panelFromSession =
      window.sessionStorage.getItem(
        ACTIVE_CIRCLE_PANEL_KEY,
      );

    const restoredPanel =
      panelFromUrl &&
      validPanels.includes(
        panelFromUrl as ActivePanel,
      )
        ? (panelFromUrl as ActivePanel)
        : panelFromSession &&
            validPanels.includes(
              panelFromSession as ActivePanel,
            )
          ? (panelFromSession as ActivePanel)
          : null;

    setActivePanel(restoredPanel);
    setPanelNavigationReady(true);
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !panelNavigationReady
    ) {
      return;
    }

    const url = new URL(
      window.location.href,
    );

    if (activePanel) {
      window.sessionStorage.setItem(
        ACTIVE_CIRCLE_PANEL_KEY,
        activePanel,
      );

      url.searchParams.set(
        "panel",
        activePanel,
      );
    } else {
      window.sessionStorage.removeItem(
        ACTIVE_CIRCLE_PANEL_KEY,
      );

      url.searchParams.delete("panel");
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [
    activePanel,
    panelNavigationReady,
  ]);

  const [
    activeTrainingModule,
    setActiveTrainingModule,
  ] =
    useState<ParticipantSpecificTrainingModule | null>(
      null,
    );

  const [
    trainingRequirements,
    setTrainingRequirements,
  ] = useState<CircleTrainingRequirement[]>(
    [],
  );

  const [
    trainingMemberId,
    setTrainingMemberId,
  ] = useState("");

  const [
    trainingMemberEmail,
    setTrainingMemberEmail,
  ] = useState("");

  const [
    trainingAudience,
    setTrainingAudience,
  ] =
    useState<CircleTrainingAudience>(
      "worker",
    );

  const [
    trainingMessage,
    setTrainingMessage,
  ] = useState("");

  const [memberName, setMemberName] =
    useState("");

  const [memberRole, setMemberRole] =
    useState<SecureMemberRole>("circle_member");

  const [memberEmail, setMemberEmail] =
    useState("");

  const [
    memberRelationship,
    setMemberRelationship,
  ] = useState("");

  const [goalTitle, setGoalTitle] =
    useState("");

  const [goalOwner, setGoalOwner] =
    useState("");

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

  const [budgetTitle, setBudgetTitle] =
    useState("");

  const [
    budgetCategory,
    setBudgetCategory,
  ] = useState<
    SecureCircleBudgetItem["category"]
  >("core");

  const [
    budgetAllocated,
    setBudgetAllocated,
  ] = useState("");

  const [budgetSpent, setBudgetSpent] =
    useState("");

  const [budgetOwner, setBudgetOwner] =
    useState("");

  useEffect(() => {
    const state =
      readSmilingMonadState();

    setCircle({
      ...state.circle,
      profile: emptyCircle.profile,
    });

    return subscribeToSmilingMonadState(
      (nextState) => {
        setCircle({
          ...nextState.circle,
          profile: emptyCircle.profile,
        });
      },
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function openCircleCentre() {
      const requestedCircleId =
        typeof window === "undefined"
          ? ""
          : new URLSearchParams(
              window.location.search,
            )
              .get("circleId")
              ?.trim() ?? "";

      if (active) {
        setSelectedCircleId(
          requestedCircleId,
        );
      }

      try {
        const supabase =
          getSupabaseBrowserClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (active) {
          setCurrentUserId(
            user?.id ?? "",
          );
        }

        if (!requestedCircleId) {
          const entries =
            await listMySecureCircles();

          if (!active) {
            return;
          }

          setDirectoryEntries(entries);
          setDirectoryMessage("");
          return;
        }

        const secureWorkspace =
          await openSelectedSecureCircle(
            requestedCircleId,
          );

        if (!active) {
          return;
        }

        const [secureGoals, secureOperations] =
          await Promise.all([
            readSecureCircleGoals(
              secureWorkspace.circle.id,
            ),
            readSecureCircleOperations(
              secureWorkspace.circle.id,
            ),
          ]);

        if (!active) {
          return;
        }

        const secureConsentSummary =
          await readSecureConsentSummary(
            secureWorkspace.participant.id,
            secureWorkspace.circle.id,
          );

        if (!active) {
          return;
        }

        setWorkspace(secureWorkspace);
        setConsentSummary(
          secureConsentSummary,
        );
        setGoals(secureGoals);
        setMembers(secureOperations.members);
        setMeetings(secureOperations.meetings);
        setResponsibilities(
          secureOperations.responsibilities,
        );
        setBudgets(secureOperations.budgets);
        setGoalsLoading(false);
        setOperationsLoading(false);
        setProfileState({
          personName:
            secureWorkspace.participant
              .full_name,
          preferredName:
            secureWorkspace.participant
              .preferred_name,
          whatMatters:
            secureWorkspace.participant
              .what_matters,
          communication:
            [
              secureWorkspace.participant
                .communication_support,
              secureWorkspace.participant
                .decision_support,
            ]
              .filter(Boolean)
              .join("\n\n"),
        });
        setAccessError("");
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          describeUnknownError(error);

        if (requestedCircleId) {
          setAccessError(message);
        } else {
          setDirectoryMessage(message);
        }

        setGoalsLoading(false);
        setOperationsLoading(false);
      } finally {
        if (active) {
          setDirectoryLoading(false);
          setLoaded(true);
        }
      }
    }

    void openCircleCentre();

    return () => {
      active = false;
    };
  }, []);

  async function createOwnCircle() {
    if (directoryCreating) {
      return;
    }

    setDirectoryCreating(true);
    setDirectoryMessage("");

    try {
      const result =
        await createMySecureCircle();

      window.location.assign(
        `/circle?circleId=${encodeURIComponent(
          result.circle.id,
        )}`,
      );
    } catch (error) {
      setDirectoryMessage(
        describeUnknownError(error),
      );
      setDirectoryCreating(false);
    }
  }

  function openCircle(circleId: string) {
    const cleanCircleId =
      circleId.trim();

    if (!cleanCircleId) {
      return;
    }

    setOpeningCircleId(cleanCircleId);

    window.location.assign(
      `/circle?circleId=${encodeURIComponent(
        cleanCircleId,
      )}`,
    );
  }

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      if (
        activePanel !== "documents" ||
        !workspace
      ) {
        return;
      }

      setDocumentsLoading(true);
      setDocumentMessage("");

      try {
        const secureDocuments =
          await readSecureCircleDocuments(
            workspace.circle.id,
          );

        if (!active) {
          return;
        }

        setDocuments(secureDocuments);
      } catch (error) {
        if (!active) {
          return;
        }

        setDocumentMessage(
          error instanceof Error
            ? error.message
            : "Two-step security is required.",
        );
      } finally {
        if (active) {
          setDocumentsLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      active = false;
    };
  }, [activePanel, workspace]);

  useEffect(() => {
    let active = true;

    async function loadCircleMessages() {
      if (
        activePanel !== "conversation" ||
        !workspace
      ) {
        return;
      }

      setCircleMessagesLoading(true);
      setCircleMessageNotice("");

      try {
        const messages =
          await readSecureCircleMessages(
            workspace.circle.id,
          );

        if (!active) {
          return;
        }

        setCircleMessages(messages);
      } catch (error) {
        if (!active) {
          return;
        }

        setCircleMessageNotice(
          error instanceof Error
            ? error.message
            : "The Circle conversation could not be loaded.",
        );
      } finally {
        if (active) {
          setCircleMessagesLoading(false);
        }
      }
    }

    void loadCircleMessages();

    return () => {
      active = false;
    };
  }, [activePanel, workspace]);

  useEffect(() => {
    if (
      activePanel !== "conversation" ||
      !workspace
    ) {
      return;
    }

    return subscribeToSecureCircleMessages(
      workspace.circle.id,
      (message) => {
        setCircleMessages((current) => {
          if (
            current.some(
              (item) =>
                item.id === message.id,
            )
          ) {
            return current;
          }

          return [
            ...current,
            message,
          ];
        });
      },
    );
  }, [activePanel, workspace]);

  useEffect(() => {
    let active = true;

    async function loadAuditHistory() {
      if (
        activePanel !== "audit" ||
        !workspace
      ) {
        return;
      }

      setAuditLoading(true);
      setAuditMessage("");

      try {
        const events =
          await readSecureCircleAuditHistory(
            workspace.circle.id,
          );

        if (!active) {
          return;
        }

        setAuditEvents(events);
      } catch (error) {
        if (!active) {
          return;
        }

        setAuditMessage(
          error instanceof Error
            ? error.message
            : "The secure audit history could not be loaded.",
        );
      } finally {
        if (active) {
          setAuditLoading(false);
        }
      }
    }

    void loadAuditHistory();

    return () => {
      active = false;
    };
  }, [activePanel, workspace]);

  useEffect(() => {
    const refreshTraining = () => {
      setActiveTrainingModule(
        getActiveCircleModule(
          "primary-circle",
        ),
      );

      setTrainingRequirements(
        readCircleTrainingRequirements().filter(
          (requirement) =>
            requirement.circleId ===
            "primary-circle",
        ),
      );
    };

    refreshTraining();

    return subscribeToCircleTraining(
      refreshTraining,
    );
  }, []);

  const activeGoals = useMemo(
    () =>
      goals.filter(
        (goal) =>
          goal.goal_status !== "achieved" &&
          goal.goal_status !== "archived",
      ).length,
    [goals],
  );

  const openResponsibilities =
    useMemo(
      () =>
        responsibilities.filter(
          (responsibility) =>
            responsibility.responsibility_status !==
            "complete",
        ).length,
      [responsibilities],
    );

  const documentsNeedingReview =
    useMemo(
      () =>
        documents.filter(
          (document) =>
            document.document_status ===
            "review_needed",
        ).length,
      [documents],
    );

  const totalBudgetAllocated = useMemo(
    () =>
      budgets.reduce(
        (total, item) =>
          total + item.allocated,
        0,
      ),
    [budgets],
  );

  const totalBudgetSpent = useMemo(
    () =>
      budgets.reduce(
        (total, item) =>
          total + item.spent,
        0,
      ),
    [budgets],
  );

  const displayAuditEvents = useMemo(
    () =>
      addAuditActorNames(
        auditEvents,
        members,
        currentUserId,
      ),
    [
      auditEvents,
      members,
      currentUserId,
    ],
  );

  async function addMember() {
    if (!workspace || operationWorkingId) {
      return;
    }

    setOperationWorkingId("member-new");
    setOperationMessage("");

    try {
      const createdMember =
        await inviteSecureCircleMember({
          circleId: workspace.circle.id,
          email: memberEmail,
          displayName: memberName,
          role: memberRole,
          relationship: memberRelationship,
        });

      setMembers((current) => [
        ...current,
        createdMember,
      ]);

      setMemberName("");
      setMemberEmail("");
      setMemberRole("circle_member");
      setMemberRelationship("");
      setOperationMessage(
        "Circle invitation saved securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The Circle invitation could not be saved.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function addGoal() {
    const title = goalTitle.trim();

    if (!workspace || !title) {
      return;
    }

    setGoalWorkingId("new");
    setGoalMessage("");

    try {
      const createdGoal =
        await createSecureCircleGoal({
          circleId: workspace.circle.id,
          participantId:
            workspace.participant.id,
          title,
          ownerName:
            goalOwner.trim() ||
            profile.preferredName ||
            profile.personName ||
            "Whole circle",
        });

      setGoals((current) => [
        ...current,
        createdGoal,
      ]);

      setGoalTitle("");
      setGoalOwner("");
      setGoalMessage(
        "Goal saved securely.",
      );
    } catch (error) {
      setGoalMessage(
        error instanceof Error
          ? error.message
          : "Two-step security is required.",
      );
    } finally {
      setGoalWorkingId("");
    }
  }

  async function openDocument(
    secureDocument: SecureCircleDocument,
  ) {
    if (documentWorkingId) {
      return;
    }

    setDocumentWorkingId(
      secureDocument.id,
    );
    setDocumentMessage("");

    try {
      const signedUrl =
        await createSecureDocumentDownloadUrl(
          secureDocument,
        );

      window.location.assign(
        signedUrl,
      );
    } catch (error) {
      setDocumentMessage(
        error instanceof Error
          ? error.message
          : "Two-step security is required.",
      );
    } finally {
      setDocumentWorkingId("");
    }
  }

  async function refreshDocuments() {
    if (!workspace || documentsLoading) {
      return;
    }

    setDocumentsLoading(true);
    setDocumentMessage("");

    try {
      const secureDocuments =
        await readSecureCircleDocuments(
          workspace.circle.id,
        );

      setDocuments(secureDocuments);
    } catch (error) {
      setDocumentMessage(
        error instanceof Error
          ? error.message
          : "Two-step security is required.",
      );
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function sendCircleMessage() {
    const cleanMessage =
      circleMessageText.trim();

    if (
      !workspace ||
      !cleanMessage ||
      circleMessageWorking
    ) {
      return;
    }

    const senderName =
      members.find(
        (member) =>
          member.user_id === currentUserId,
      )?.display_name.trim() ||
      "Circle member";

    setCircleMessageWorking(true);
    setCircleMessageNotice("");

    try {
      const createdMessage =
        await sendSecureCircleMessage({
          circleId: workspace.circle.id,
          senderName,
          messageBody: cleanMessage,
        });

      setCircleMessages((current) => [
        ...current,
        createdMessage,
      ]);
      setCircleMessageText("");
    } catch (error) {
      setCircleMessageNotice(
        error instanceof Error
          ? error.message
          : "The Circle message could not be sent.",
      );
    } finally {
      setCircleMessageWorking(false);
    }
  }

  async function addMeeting() {
    if (!workspace || operationWorkingId) {
      return;
    }

    setOperationWorkingId("meeting-new");
    setOperationMessage("");

    try {
      const createdMeeting =
        await createSecureMeeting({
          circleId: workspace.circle.id,
          participantId: workspace.participant.id,
          title: meetingTitle,
          meetingDate,
          purpose:
            meetingPurpose.trim() ||
            "Circle coordination",
        });

      setMeetings((current) => [
        ...current,
        createdMeeting,
      ]);

      setMeetingTitle("");
      setMeetingDate("");
      setMeetingPurpose("");
      setOperationMessage(
        "Meeting saved securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The meeting could not be saved.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function addResponsibility() {
    if (!workspace || operationWorkingId) {
      return;
    }

    setOperationWorkingId("responsibility-new");
    setOperationMessage("");

    try {
      const createdResponsibility =
        await createSecureResponsibility({
          circleId: workspace.circle.id,
          participantId: workspace.participant.id,
          title: responsibilityTitle,
          ownerName:
            responsibilityOwner.trim() ||
            "Whole circle",
        });

      setResponsibilities((current) => [
        ...current,
        createdResponsibility,
      ]);

      setResponsibilityTitle("");
      setResponsibilityOwner("");
      setOperationMessage(
        "Responsibility saved securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The responsibility could not be saved.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function addBudgetItem() {
    if (!workspace || operationWorkingId) {
      return;
    }

    const allocated =
      Number.parseFloat(budgetAllocated);
    const spent =
      Number.parseFloat(budgetSpent);

    if (
      !budgetTitle.trim() ||
      !Number.isFinite(allocated) ||
      allocated < 0
    ) {
      setOperationMessage(
        "Enter a budget title and a valid allocated amount.",
      );
      return;
    }

    setOperationWorkingId("budget-new");
    setOperationMessage("");

    try {
      const createdBudget =
        await createSecureBudgetItem({
          circleId: workspace.circle.id,
          participantId: workspace.participant.id,
          title: budgetTitle,
          category: budgetCategory,
          allocated,
          spent:
            Number.isFinite(spent) && spent >= 0
              ? spent
              : 0,
          ownerName:
            budgetOwner.trim() ||
            "Whole circle",
        });

      setBudgets((current) => [
        ...current,
        createdBudget,
      ]);

      setBudgetTitle("");
      setBudgetCategory("core");
      setBudgetAllocated("");
      setBudgetSpent("");
      setBudgetOwner("");
      setOperationMessage(
        "Budget item saved securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The budget item could not be saved.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function removeMember(
    memberId: string,
  ) {
    setOperationWorkingId(memberId);
    setOperationMessage("");

    try {
      await updateSecureCircleMember(
        memberId,
        {
          membership_status: "removed",
        },
      );

      setMembers((current) =>
        current.filter(
          (member) => member.id !== memberId,
        ),
      );

      setOperationMessage(
        "Circle access removed securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "Circle access could not be removed.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function removeGoal(
    goalId: string,
  ) {
    setGoalWorkingId(goalId);
    setGoalMessage("");

    try {
      await archiveSecureCircleGoal(
        goalId,
      );

      setGoals((current) =>
        current.filter(
          (goal) => goal.id !== goalId,
        ),
      );

      setGoalMessage(
        "Goal archived securely.",
      );
    } catch (error) {
      setGoalMessage(
        error instanceof Error
          ? error.message
          : "The goal could not be archived.",
      );
    } finally {
      setGoalWorkingId("");
    }
  }

  async function removeDocument(
    documentId: string,
  ) {
    if (documentWorkingId) {
      return;
    }

    setDocumentWorkingId(documentId);
    setDocumentMessage("");

    try {
      await archiveSecureCircleDocument(
        documentId,
      );

      setDocuments((current) =>
        current.filter(
          (document) =>
            document.id !== documentId,
        ),
      );

      setDocumentMessage(
        "Document archived securely.",
      );
    } catch (error) {
      setDocumentMessage(
        error instanceof Error
          ? error.message
          : "Two-step security is required.",
      );
    } finally {
      setDocumentWorkingId("");
    }
  }

  async function removeMeeting(
    meetingId: string,
  ) {
    setOperationWorkingId(meetingId);
    setOperationMessage("");

    try {
      await updateSecureMeeting(
        meetingId,
        { meeting_status: "archived" },
      );
      setMeetings((current) =>
        current.filter(
          (meeting) => meeting.id !== meetingId,
        ),
      );
      setOperationMessage(
        "Meeting archived securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The meeting could not be archived.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function removeResponsibility(
    responsibilityId: string,
  ) {
    setOperationWorkingId(responsibilityId);
    setOperationMessage("");

    try {
      await updateSecureResponsibility(
        responsibilityId,
        { responsibility_status: "archived" },
      );
      setResponsibilities((current) =>
        current.filter(
          (item) => item.id !== responsibilityId,
        ),
      );
      setOperationMessage(
        "Responsibility archived securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The responsibility could not be archived.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function removeBudgetItem(
    budgetId: string,
  ) {
    setOperationWorkingId(budgetId);
    setOperationMessage("");

    try {
      await updateSecureBudgetItem(
        budgetId,
        { budget_status: "archived" },
      );
      setBudgets((current) =>
        current.filter(
          (item) => item.id !== budgetId,
        ),
      );
      setOperationMessage(
        "Budget item archived securely.",
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The budget item could not be archived.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function advanceGoal(
    goal: SecureCircleGoal,
  ) {
    setGoalWorkingId(goal.id);
    setGoalMessage("");

    try {
      const updatedGoal =
        await advanceSecureCircleGoal(
          goal,
        );

      setGoals((current) =>
        current.map((item) =>
          item.id === updatedGoal.id
            ? updatedGoal
            : item,
        ),
      );

      setGoalMessage(
        "Goal status updated securely.",
      );
    } catch (error) {
      setGoalMessage(
        error instanceof Error
          ? error.message
          : "The goal status could not be updated.",
      );
    } finally {
      setGoalWorkingId("");
    }
  }

  async function advanceResponsibility(
    responsibility: SecureCircleResponsibility,
  ) {
    const statuses =
      ["open", "in_progress", "complete"] as const;
    const currentIndex =
      statuses.indexOf(
        responsibility.responsibility_status as
          (typeof statuses)[number],
      );
    const nextStatus =
      currentIndex < 0 ||
      currentIndex === statuses.length - 1
        ? "open"
        : statuses[currentIndex + 1];

    setOperationWorkingId(responsibility.id);

    try {
      const updated =
        await updateSecureResponsibility(
          responsibility.id,
          { responsibility_status: nextStatus },
        );
      setResponsibilities((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The responsibility could not be updated.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  async function advanceBudgetStatus(
    item: SecureCircleBudgetItem,
  ) {
    const statuses =
      ["active", "review_needed", "closed"] as const;
    const currentIndex =
      statuses.indexOf(
        item.budget_status as
          (typeof statuses)[number],
      );
    const nextStatus =
      currentIndex < 0 ||
      currentIndex === statuses.length - 1
        ? "active"
        : statuses[currentIndex + 1];

    setOperationWorkingId(item.id);

    try {
      const updated =
        await updateSecureBudgetItem(
          item.id,
          { budget_status: nextStatus },
        );
      setBudgets((current) =>
        current.map((currentItem) =>
          currentItem.id === updated.id
            ? updated
            : currentItem,
        ),
      );
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? error.message
          : "The budget item could not be updated.",
      );
    } finally {
      setOperationWorkingId("");
    }
  }

  const completedTrainingRequirements =
    useMemo(
      () =>
        trainingRequirements.filter(
          (requirement) =>
            requirement.status ===
            "completed",
        ).length,
      [trainingRequirements],
    );

  const pendingTrainingRequirements =
    useMemo(
      () =>
        trainingRequirements.filter(
          (requirement) =>
            requirement.status !==
              "completed" &&
            requirement.status !==
              "removed" &&
            requirement.status !==
              "expired",
        ).length,
      [trainingRequirements],
    );

  function assignTrainingToMember() {
    if (!activeTrainingModule) {
      setTrainingMessage(
        "Create and activate your mandatory Circle module first.",
      );
      return;
    }

    const member = members.find(
      (item) =>
        item.id === trainingMemberId,
    );

    if (!member) {
      setTrainingMessage(
        "Choose a Circle member.",
      );
      return;
    }

    if (!trainingMemberEmail.trim()) {
      setTrainingMessage(
        "Enter the Circle member’s email address.",
      );
      return;
    }

    try {
      assignMandatoryCircleTraining({
        moduleId:
          activeTrainingModule.id,
        memberId: member.id,
        memberDisplayName:
          member.display_name,
        memberEmail:
          trainingMemberEmail,
        audience: trainingAudience,
      });

      setTrainingMemberEmail("");
      setTrainingMessage(
        `${activeTrainingModule.title} is now required for ${member.display_name}.`,
      );
    } catch (error) {
      setTrainingMessage(
        error instanceof Error
          ? error.message
          : "Unable to assign the mandatory Circle module.",
      );
    }
  }

  if (!loaded) {
    return (
      <main className="flex h-[100svh] w-full items-center justify-center bg-[#5b4936] px-6 text-[#fff8ed]">
        <div className="rounded-full border border-white/35 bg-black/30 px-6 py-3 font-serif text-lg shadow-lg backdrop-blur-md">
          Opening your Circle of Support Centre…
        </div>
      </main>
    );
  }

  if (!selectedCircleId) {
    return (
      <main className="relative min-h-[100svh] w-full overflow-y-auto bg-[#5b4936] px-3 py-20 text-[#3f3127] sm:px-6 sm:py-24">
        <img
          src="/circles-of-support-centre.png"
          alt=""
          className="fixed inset-0 h-full w-full object-cover object-center"
        />

        <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px]" />

        <Link
          href="/office"
          aria-label="Return to the Smiling Monad Space"
          className="fixed left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/35 text-xl text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/70 sm:left-5 sm:top-5"
        >
          ←
        </Link>

        <div className="relative z-10">
          <CircleDirectory
            entries={directoryEntries}
            loading={directoryLoading}
            creating={directoryCreating}
            openingCircleId={
              openingCircleId
            }
            message={directoryMessage}
            onCreateOwnCircle={() => {
              void createOwnCircle();
            }}
            onOpenCircle={openCircle}
          />
        </div>
      </main>
    );
  }

  if (accessError || !workspace) {
    return (
      <main className="flex h-[100svh] w-full items-center justify-center bg-[#5b4936] px-6 text-[#3f3127]">
        <section className="w-full max-w-lg rounded-[28px] border border-[#d9c7ad] bg-[rgba(255,250,241,0.98)] p-7 text-center shadow-[0_30px_70px_rgba(25,18,12,0.48)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8b745d]">
            Circle of Support
          </p>

          <h1 className="mt-3 font-serif text-3xl">
            This Circle could not be opened
          </h1>

          <p className="mt-4 leading-7 text-[#68584a]">
            {accessError ||
              "No authorised Circle workspace was found for this account."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/circle"
              className="inline-flex rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
            >
              Return to My Circles
            </Link>

            <Link
              href="/office"
              className="inline-flex rounded-full border border-[#bfa98d] bg-[#efe3d2] px-6 py-3 font-medium text-[#533d2d] transition hover:bg-[#e6d6c0]"
            >
              Return to the Smiling Monad Space
            </Link>
          </div>
        </section>
      </main>
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

      <Link
        href="/circle"
        className="absolute right-3 top-3 z-30 rounded-full border border-white/40 bg-black/35 px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/70 sm:right-5 sm:top-5"
      >
        Switch Circle
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
          ["conversation", "Conversation"],
          ["meetings", "Meetings"],
          [
            "responsibilities",
            "Responsibilities",
          ],
          ["budget", "Budget"],
          ["training", "Training"],
          ["audit", "Audit"],
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
              <OverviewPanel
                personDisplayName={
                  personDisplayName
                }
                memberCount={members.length}
                activeGoals={activeGoals}
                documentsNeedingReview={
                  documentsNeedingReview
                }
                messageCount={
                  circleMessages.length
                }
                meetingCount={meetings.length}
                openResponsibilities={
                  openResponsibilities
                }
                totalBudgetAllocated={
                  totalBudgetAllocated
                }
                totalBudgetSpent={
                  totalBudgetSpent
                }
                profileReady={
                  Boolean(profile.personName)
                }
                pendingTrainingRequirements={
                  pendingTrainingRequirements
                }
                consentSummary={
                  consentSummary
                }
                auditEventCount={
                  displayAuditEvents.length
                }
                onOpenPanel={(panel) => {
                  setActivePanel(panel);
                }}
              />
            )}

            {activePanel === "person" && (
              <PersonProfilePanel
                participantId={
                  workspace.participant.id
                }
                circleId={workspace.circle.id}
                profile={profile}
                consentSummary={
                  consentSummary
                }
                loaded={loaded}
                saving={profileSaving}
                message={profileMessage}
                onProfileChange={(
                  field,
                  value,
                ) => {
                  setProfile((current) => ({
                    ...current,
                    [field]: value,
                  }));
                }}
                onSaveProfile={() => {
                  void saveProfile();
                }}
              />
            )}

            {activePanel === "members" && (
              <MembersPanel
                members={members}
                loading={operationsLoading}
                workingId={operationWorkingId}
                message={operationMessage}
                name={memberName}
                email={memberEmail}
                role={memberRole}
                relationship={
                  memberRelationship
                }
                onNameChange={setMemberName}
                onEmailChange={setMemberEmail}
                onRoleChange={setMemberRole}
                onRelationshipChange={
                  setMemberRelationship
                }
                onAddMember={() => {
                  void addMember();
                }}
                onRemoveMember={(memberId) => {
                  void removeMember(memberId);
                }}
              />
            )}

            {activePanel ===
              "conversation" && (
              <ConversationPanel
                messages={circleMessages}
                loading={circleMessagesLoading}
                working={circleMessageWorking}
                messageText={circleMessageText}
                notice={circleMessageNotice}
                onMessageTextChange={
                  setCircleMessageText
                }
                onSendMessage={() => {
                  void sendCircleMessage();
                }}
              />
            )}

            {activePanel === "goals" && (
              <GoalsPanel
                goals={goals}
                loading={goalsLoading}
                workingId={goalWorkingId}
                message={goalMessage}
                title={goalTitle}
                owner={goalOwner}
                onTitleChange={setGoalTitle}
                onOwnerChange={setGoalOwner}
                onAddGoal={() => {
                  void addGoal();
                }}
                onAdvanceGoal={(goal) => {
                  void advanceGoal(goal);
                }}
                onArchiveGoal={(goalId) => {
                  void removeGoal(goalId);
                }}
              />
            )}

            {activePanel ===
              "documents" && (
              <DocumentsPanel
                documents={documents}
                loading={documentsLoading}
                workingId={documentWorkingId}
                message={documentMessage}
                onRefresh={() => {
                  void refreshDocuments();
                }}
                onOpenDocument={(document) => {
                  void openDocument(document);
                }}
                onArchiveDocument={(documentId) => {
                  void removeDocument(documentId);
                }}
              />
            )}

            {activePanel ===
              "meetings" && (
              <MeetingsPanel
                meetings={meetings}
                title={meetingTitle}
                date={meetingDate}
                purpose={meetingPurpose}
                onTitleChange={setMeetingTitle}
                onDateChange={setMeetingDate}
                onPurposeChange={
                  setMeetingPurpose
                }
                onAddMeeting={() => {
                  void addMeeting();
                }}
                onArchiveMeeting={(meetingId) => {
                  void removeMeeting(meetingId);
                }}
              />
            )}

            {activePanel ===
              "responsibilities" && (
              <ResponsibilitiesPanel
                responsibilities={
                  responsibilities
                }
                title={responsibilityTitle}
                owner={responsibilityOwner}
                onTitleChange={
                  setResponsibilityTitle
                }
                onOwnerChange={
                  setResponsibilityOwner
                }
                onAddResponsibility={() => {
                  void addResponsibility();
                }}
                onAdvanceResponsibility={(
                  responsibility,
                ) => {
                  void advanceResponsibility(
                    responsibility,
                  );
                }}
                onArchiveResponsibility={(
                  responsibilityId,
                ) => {
                  void removeResponsibility(
                    responsibilityId,
                  );
                }}
              />
            )}

            {activePanel === "budget" && (
              <BudgetPanel
                budgets={budgets}
                totalAllocated={
                  totalBudgetAllocated
                }
                totalSpent={totalBudgetSpent}
                title={budgetTitle}
                category={budgetCategory}
                allocated={budgetAllocated}
                spent={budgetSpent}
                owner={budgetOwner}
                onTitleChange={setBudgetTitle}
                onCategoryChange={
                  setBudgetCategory
                }
                onAllocatedChange={
                  setBudgetAllocated
                }
                onSpentChange={setBudgetSpent}
                onOwnerChange={setBudgetOwner}
                onAddBudgetItem={() => {
                  void addBudgetItem();
                }}
                onAdvanceBudgetStatus={(
                  item,
                ) => {
                  void advanceBudgetStatus(
                    item,
                  );
                }}
                onArchiveBudgetItem={(
                  itemId,
                ) => {
                  void removeBudgetItem(
                    itemId,
                  );
                }}
              />
            )}

            {activePanel === "training" && (
              <TrainingPanel
                personDisplayName={
                  personDisplayName
                }
                members={members}
                activeModule={
                  activeTrainingModule
                }
                requirements={
                  trainingRequirements
                }
                completedCount={
                  completedTrainingRequirements
                }
                pendingCount={
                  pendingTrainingRequirements
                }
                memberId={trainingMemberId}
                memberEmail={
                  trainingMemberEmail
                }
                audience={trainingAudience}
                message={trainingMessage}
                onMemberIdChange={
                  setTrainingMemberId
                }
                onMemberEmailChange={
                  setTrainingMemberEmail
                }
                onAudienceChange={
                  setTrainingAudience
                }
                onAssignTraining={
                  assignTrainingToMember
                }
              />
            )}

            {activePanel === "audit" && (
              <AuditPanel
                events={displayAuditEvents}
                loading={auditLoading}
                message={auditMessage}
              />
            )}

          </section>
        </div>
      )}
    </main>
  );
}