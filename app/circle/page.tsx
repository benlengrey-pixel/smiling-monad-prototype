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
  openSecureCircleWorkspace,
  updateSecureParticipantProfile,
  type SecureCircleWorkspace,
} from "@/lib/circle/secure-circle-client";

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

import AuditPanel from "@/components/circle/panels/AuditPanel";
import DocumentsPanel from "@/components/circle/panels/DocumentsPanel";
import GoalsPanel from "@/components/circle/panels/GoalsPanel";

import {
  readSecureConsentSummary,
  type SecureConsentSummary,
} from "@/lib/circle/secure-consent-status-client";

import ParticipantPrivacyGate from "@/components/circle/ParticipantPrivacyGate";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  assignMandatoryCircleTraining,
  canMemberJoinCircle,
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

    async function openWorkspace() {
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

        const secureWorkspace =
          await openSecureCircleWorkspace();

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

        setGoalsLoading(false);
        setOperationsLoading(false);
        setAccessError(
          describeUnknownError(error),
        );
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void openWorkspace();

    return () => {
      active = false;
    };
  }, []);

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
          Opening your secure Circle of Support…
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

          <Link
            href="/office"
            className="mt-6 inline-flex rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
          >
            Return to the Smiling Monad Space
          </Link>
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
                      label: "Circle messages",
                      value: circleMessages.length,
                      panel:
                        "conversation" as ActivePanel,
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
                      label: "Budget remaining",
                      value: `$${Math.max(
                        0,
                        totalBudgetAllocated -
                          totalBudgetSpent,
                      ).toLocaleString()}`,
                      panel:
                        "budget" as ActivePanel,
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
                    {
                      label:
                        "Mandatory training pending",
                      value:
                        pendingTrainingRequirements,
                      panel:
                        "training" as ActivePanel,
                    },
                    {
                      label: "Privacy consent",
                      value:
                        consentSummary?.health ===
                        "current"
                          ? "Current"
                          : consentSummary?.health ===
                              "review_due"
                            ? "Review"
                            : consentSummary?.health ===
                                "expired"
                              ? "Expired"
                              : consentSummary?.health ===
                                  "withdrawn"
                                ? "Withdrawn"
                                : "Missing",
                      panel:
                        "person" as ActivePanel,
                    },
                    {
                      label: "Audit events",
                      value: displayAuditEvents.length,
                      panel:
                        "audit" as ActivePanel,
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

                <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-[#f7efe4] p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
                    Privacy consent
                  </p>

                  <p className="mt-2 font-serif text-2xl">
                    {consentSummary?.message ??
                      "Checking privacy consent…"}
                  </p>

                  {consentSummary?.consent ? (
                    <div className="mt-4 grid gap-2 text-sm leading-6 text-[#6a5b4e] sm:grid-cols-2">
                      <p>
                        Given by:{" "}
                        <span className="font-semibold">
                          {consentSummary.consent
                            .given_by_name ||
                            "Not recorded"}
                        </span>
                      </p>

                      <p>
                        Authority:{" "}
                        <span className="font-semibold">
                          {consentSummary.consent
                            .authority_basis.replaceAll(
                              "_",
                              " ",
                            )}
                        </span>
                      </p>

                      <p>
                        Review due:{" "}
                        <span className="font-semibold">
                          {consentSummary.consent
                            .review_due_at
                            ? new Date(
                                consentSummary.consent
                                  .review_due_at,
                              ).toLocaleDateString()
                            : "No date set"}
                        </span>
                      </p>

                      <p>
                        Valid until:{" "}
                        <span className="font-semibold">
                          {consentSummary.consent
                            .valid_until
                            ? new Date(
                                consentSummary.consent
                                  .valid_until,
                              ).toLocaleDateString()
                            : "No expiry set"}
                        </span>
                      </p>
                    </div>
                  ) : null}
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

                <div className="mt-6 rounded-[18px] border border-[#d8c7b1] bg-[#f7efe4] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
                        Privacy consent
                      </p>

                      <p className="mt-2 font-semibold text-[#4c3728]">
                        {consentSummary?.message ??
                          "Checking privacy consent…"}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#d0bea7] bg-white px-3 py-1 text-xs font-semibold text-[#6d5e50]">
                      {consentSummary?.health ===
                      "current"
                        ? "Current"
                        : consentSummary?.health ===
                            "review_due"
                          ? "Review due"
                          : consentSummary?.health ===
                              "expired"
                            ? "Expired"
                            : consentSummary?.health ===
                                "withdrawn"
                              ? "Withdrawn"
                              : "Not recorded"}
                    </span>
                  </div>

                  {consentSummary?.health &&
                  consentSummary.health !==
                    "current" ? (
                    <p className="mt-3 text-sm leading-6 text-[#6d5e50]">
                      Personal information should not be relied on until consent is current. Use the consent controls below to review or record consent.
                    </p>
                  ) : null}
                </div>

                <ParticipantPrivacyGate
                  participantId={
                    workspace.participant.id
                  }
                  circleId={workspace.circle.id}
                  participantName={
                    profile.preferredName ||
                    profile.personName ||
                    "this person"
                  }
                >
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
                        onBlur={() => {
                          void saveProfile();
                        }}
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
                        onBlur={() => {
                          void saveProfile();
                        }}
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
                      onBlur={() => {
                        void saveProfile();
                      }}
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
                      onBlur={() => {
                        void saveProfile();
                      }}
                      placeholder="How the person communicates, understands information, expresses consent, makes choices and shows when something is wrong."
                      className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b]"
                    />
                  </label>

                  <p className="mt-5 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
                    {!loaded
                      ? "Opening your secure Circle profile…"
                      : profileSaving
                        ? "Saving securely…"
                        : profileMessage ||
                          "Changes save securely when you leave a field."}
                  </p>
                </ParticipantPrivacyGate>
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

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <input
                    value={memberName}
                    onChange={(event) =>
                      setMemberName(event.target.value)
                    }
                    placeholder="Name"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(event) =>
                      setMemberEmail(event.target.value)
                    }
                    placeholder="Email"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <select
                    value={memberRole}
                    onChange={(event) =>
                      setMemberRole(
                        event.target.value as SecureMemberRole,
                      )
                    }
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  >
                    <option value="circle_member">Circle member</option>
                    <option value="family">Family</option>
                    <option value="support_worker">Support worker</option>
                    <option value="support_coordinator">Support coordinator</option>
                    <option value="professional">Professional</option>
                    <option value="nominee">Nominee</option>
                    <option value="circle_manager">Circle manager</option>
                  </select>

                  <input
                    value={memberRelationship}
                    onChange={(event) =>
                      setMemberRelationship(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void addMember();
                      }
                    }}
                    placeholder="Relationship"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void addMember();
                  }}
                  disabled={
                    operationWorkingId === "member-new" ||
                    !memberName.trim() ||
                    !memberEmail.trim()
                  }
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {operationWorkingId === "member-new"
                    ? "Saving invitation…"
                    : "Invite circle member"}
                </button>

                {operationMessage && (
                  <p className="mt-3 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
                    {operationMessage}
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {operationsLoading ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151] sm:col-span-2">
                      Loading secure Circle members…
                    </div>
                  ) : members.length === 0 ? (
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
                            {member.display_name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void removeMember(
                                member.id,
                              )
                            }
                            className="text-sm text-[#98765e]"
                          >
                            Remove
                          </button>
                        </div>

                        <p className="mt-3 font-serif text-xl">
                          {member.display_name}
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

            {activePanel ===
              "conversation" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Shared Circle conversation
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Circle messages
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
                  A shared text conversation for active
                  Circle members. Kimi’s personal controls
                  remain separate.
                </p>

                <div className="mt-6 max-h-[44svh] space-y-3 overflow-y-auto rounded-[22px] border border-[#d8c7b1] bg-[#f5ecdf] p-4 sm:p-5">
                  {circleMessagesLoading ? (
                    <p className="rounded-[16px] bg-white/80 px-4 py-3 text-[#756151]">
                      Loading Circle conversation…
                    </p>
                  ) : circleMessages.length === 0 ? (
                    <p className="rounded-[16px] border border-dashed border-[#cdbba4] bg-white/70 px-4 py-5 text-[#756151]">
                      No messages yet. Start the Circle
                      conversation below.
                    </p>
                  ) : (
                    circleMessages.map((message) => (
                      <article
                        key={message.id}
                        className="rounded-[18px] border border-[#dfd2c1] bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-[#4f3b2d]">
                            {message.sender_name}
                          </p>

                          <time className="text-xs text-[#8a786a]">
                            {new Date(
                              message.created_at,
                            ).toLocaleString()}
                          </time>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap leading-7 text-[#5f5044]">
                          {message.message_body}
                        </p>
                      </article>
                    ))
                  )}
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-medium">
                    Message the Circle
                  </span>

                  <textarea
                    value={circleMessageText}
                    onChange={(event) =>
                      setCircleMessageText(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        void sendCircleMessage();
                      }
                    }}
                    maxLength={4000}
                    placeholder="Write a message for active Circle members…"
                    className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b]"
                  />
                </label>

                <div className="mt-2 flex items-center justify-between gap-4 text-xs text-[#8a786a]">
                  <span>
                    Enter sends · Shift+Enter adds a line
                  </span>
                  <span>
                    {circleMessageText.length}/4000
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void sendCircleMessage();
                  }}
                  disabled={
                    circleMessageWorking ||
                    !circleMessageText.trim()
                  }
                  className="mt-4 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {circleMessageWorking
                    ? "Sending securely…"
                    : "Send to Circle"}
                </button>

                {circleMessageNotice && (
                  <p className="mt-3 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
                    {circleMessageNotice}
                  </p>
                )}
              </>
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
                  onClick={() => {
                    void addMeeting();
                  }}
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
                                {meeting.meeting_date ||
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
                                void removeMeeting(
                                  meeting.id,
                                )
                              }
                              className="text-sm text-[#98765e]"
                            >
                              Archive
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
                        void addResponsibility();
                      }
                    }}
                    placeholder="Responsible person"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void addResponsibility();
                  }}
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
                                responsibility.owner_name
                              }
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                advanceResponsibility(
                                  responsibility,
                                )
                              }
                              className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                            >
                              {
                                responsibility.responsibility_status
                              }
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void removeResponsibility(
                                  responsibility.id,
                                )
                              }
                              className="px-2 py-2 text-sm text-[#98765e]"
                            >
                              Archive
                            </button>
                          </div>
                        </article>
                      ),
                    )
                  )}
                </div>

              </>
            )}

            {activePanel === "budget" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Funding and shared oversight
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Budget and funding
                </h1>

                <p className="mt-3 max-w-3xl leading-7 text-[#6b5d50]">
                  Record broad funding allocations,
                  spending and responsibility so the
                  Circle can see what is available and
                  what may need review. This is a
                  coordination tool, not formal financial
                  advice or plan-manager accounting.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-[#decfba] bg-[#f4eadc] p-5">
                    <p className="text-sm text-[#6c594a]">
                      Allocated
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      ${totalBudgetAllocated.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-[#decfba] bg-[#f4eadc] p-5">
                    <p className="text-sm text-[#6c594a]">
                      Spent
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      ${totalBudgetSpent.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-[#decfba] bg-[#f4eadc] p-5">
                    <p className="text-sm text-[#6c594a]">
                      Remaining
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      ${Math.max(
                        0,
                        totalBudgetAllocated -
                          totalBudgetSpent,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <input
                    value={budgetTitle}
                    onChange={(event) =>
                      setBudgetTitle(
                        event.target.value,
                      )
                    }
                    placeholder="Budget or funding area"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <select
                    value={budgetCategory}
                    onChange={(event) =>
                      setBudgetCategory(
                        event.target
                          .value as SecureCircleBudgetItem["category"],
                      )
                    }
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  >
                    <option value="core">Core</option>
                    <option value="capacity_building">
                      Capacity Building
                    </option>
                    <option value="capital">
                      Capital
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetAllocated}
                    onChange={(event) =>
                      setBudgetAllocated(
                        event.target.value,
                      )
                    }
                    placeholder="Allocated amount"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetSpent}
                    onChange={(event) =>
                      setBudgetSpent(
                        event.target.value,
                      )
                    }
                    placeholder="Spent so far"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  />

                  <input
                    value={budgetOwner}
                    onChange={(event) =>
                      setBudgetOwner(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        addBudgetItem();
                      }
                    }}
                    placeholder="Responsible person"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b] md:col-span-2"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void addBudgetItem();
                  }}
                  className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Add budget item
                </button>

                <div className="mt-6 space-y-3">
                  {budgets.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No budget items have been
                      recorded yet.
                    </div>
                  ) : (
                    budgets.map((item) => {
                      const remaining =
                        item.allocated -
                        item.spent;

                      const percentage =
                        item.allocated > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (item.spent /
                                  item.allocated) *
                                  100,
                              ),
                            )
                          : 0;

                      return (
                        <article
                          key={item.id}
                          className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-serif text-xl">
                                {item.title}
                              </p>

                              <p className="mt-1 text-sm text-[#756151]">
                                {item.category} · Responsible:{" "}
                                {item.owner_name}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  advanceBudgetStatus(
                                    item,
                                  )
                                }
                                className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                              >
                                {item.budget_status === "review_needed"
                                  ? "Review needed"
                                  : item.budget_status === "closed"
                                    ? "Closed"
                                    : "Active"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void removeBudgetItem(
                                    item.id,
                                  )
                                }
                                className="px-2 py-2 text-sm text-[#98765e]"
                              >
                                Archive
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#eee2d2]">
                            <div
                              className="h-full rounded-full bg-[#71523b]"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-[#6b5d50] sm:grid-cols-3">
                            <p>
                              Allocated:{" "}
                              <strong>
                                ${item.allocated.toLocaleString()}
                              </strong>
                            </p>

                            <p>
                              Spent:{" "}
                              <strong>
                                ${item.spent.toLocaleString()}
                              </strong>
                            </p>

                            <p>
                              Remaining:{" "}
                              <strong>
                                ${remaining.toLocaleString()}
                              </strong>
                            </p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {activePanel === "training" && (
              <>
                <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
                  Participant-controlled trust
                </p>

                <h1 className="mt-3 font-serif text-3xl">
                  Circle training
                </h1>

                <p className="mt-3 max-w-3xl leading-7 text-[#6b5d50]">
                  The participant can ask workers to
                  complete the main Smiling Monad
                  training and can also require every
                  worker, provider or professional to
                  complete a personalised module before
                  joining this Circle.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Link
                    href={`/circle/my-training?circleId=primary-circle&participantId=participant&participantName=${encodeURIComponent(
                      personDisplayName,
                    )}`}
                    className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 transition hover:bg-[#ede0cd]"
                  >
                    <p className="font-serif text-xl">
                      My mandatory module
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#6c594a]">
                      Create or manage the training
                      that everyone must complete before
                      entering this Circle.
                    </p>
                  </Link>

                  <Link
                    href={`/circle/training-invitations?circleId=primary-circle&participantId=participant&participantName=${encodeURIComponent(
                      personDisplayName,
                    )}`}
                    className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 transition hover:bg-[#ede0cd]"
                  >
                    <p className="font-serif text-xl">
                      Invite a worker
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#6c594a]">
                      Ask a worker to complete the main
                      Smiling Monad training pathway.
                    </p>
                  </Link>

                  <Link
                    href="/circle/training-review?circleId=primary-circle"
                    className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 transition hover:bg-[#ede0cd]"
                  >
                    <p className="font-serif text-xl">
                      Review responses
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#6c594a]">
                      Approve understanding or request
                      changes before Circle access is
                      granted.
                    </p>
                  </Link>

                  <div className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5">
                    <p className="text-3xl font-semibold">
                      {completedTrainingRequirements}
                    </p>

                    <p className="mt-2 text-sm text-[#6c594a]">
                      Members who completed mandatory
                      Circle training
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-[#efe3d3] p-5 sm:p-6">
                  <p className="font-serif text-2xl">
                    Active mandatory module
                  </p>

                  {activeTrainingModule ? (
                    <>
                      <p className="mt-3 text-lg font-medium">
                        {activeTrainingModule.title}
                      </p>

                      <p className="mt-2 leading-7 text-[#6a5b4e]">
                        {activeTrainingModule.purpose}
                      </p>

                      <p className="mt-3 text-sm text-[#756151]">
                        Version{" "}
                        {activeTrainingModule.version} ·
                        Participant approval{" "}
                        {activeTrainingModule.participantApprovalRequired
                          ? "required"
                          : "not required"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 leading-7 text-[#6a5b4e]">
                      No mandatory participant-specific
                      module is active yet. Create one
                      before assigning training to
                      Circle members.
                    </p>
                  )}
                </div>

                <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-white p-5 sm:p-6">
                  <p className="font-serif text-2xl">
                    Assign mandatory training
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#756151]">
                    Choose an existing Circle member,
                    enter their email and identify their
                    role. They will remain training
                    pending until the module is complete
                    and approved.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <select
                      value={trainingMemberId}
                      onChange={(event) =>
                        setTrainingMemberId(
                          event.target.value,
                        )
                      }
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    >
                      <option value="">
                        Choose Circle member
                      </option>

                      {members.map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.display_name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="email"
                      value={trainingMemberEmail}
                      onChange={(event) =>
                        setTrainingMemberEmail(
                          event.target.value,
                        )
                      }
                      placeholder="Member email"
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    />

                    <select
                      value={trainingAudience}
                      onChange={(event) =>
                        setTrainingAudience(
                          event.target
                            .value as CircleTrainingAudience,
                        )
                      }
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    >
                      <option value="worker">
                        Support worker
                      </option>
                      <option value="provider">
                        Provider
                      </option>
                      <option value="support-coordinator">
                        Support coordinator
                      </option>
                      <option value="therapist">
                        Therapist
                      </option>
                      <option value="family-member">
                        Family member
                      </option>
                      <option value="other-circle-member">
                        Other Circle member
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={assignTrainingToMember}
                    className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
                  >
                    Assign mandatory module
                  </button>

                  {trainingMessage ? (
                    <p className="mt-4 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
                      {trainingMessage}
                    </p>
                  ) : null}
                </div>

                <div className="mt-7 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-serif text-2xl">
                      Member training status
                    </p>

                    <p className="text-sm text-[#756151]">
                      {pendingTrainingRequirements} pending
                    </p>
                  </div>

                  {trainingRequirements.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
                      No mandatory Circle training has
                      been assigned yet.
                    </div>
                  ) : (
                    trainingRequirements.map(
                      (requirement) => (
                        <article
                          key={requirement.id}
                          className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-serif text-xl">
                                {
                                  requirement.memberDisplayName
                                }
                              </p>

                              <p className="mt-1 text-sm capitalize text-[#756151]">
                                {requirement.audience.replaceAll(
                                  "-",
                                  " ",
                                )}
                              </p>

                              <p className="mt-2 text-sm text-[#8a786a]">
                                {canMemberJoinCircle(
                                  "primary-circle",
                                  requirement.memberId,
                                )
                                  ? "Circle access ready"
                                  : "Circle access blocked until training is complete"}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm capitalize text-[#533d2d]">
                                {requirement.status.replaceAll(
                                  "-",
                                  " ",
                                )}
                              </span>

                              <Link
                                href={`/circle/training/${requirement.id}?requirementId=${encodeURIComponent(
                                  requirement.id,
                                )}`}
                                className="rounded-full border border-[#d6c6b1] bg-white px-4 py-2 text-sm text-[#533d2d]"
                              >
                                Open module
                              </Link>
                            </div>
                          </div>
                        </article>
                      ),
                    )
                  )}
                </div>
              </>
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