"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  readSecureCircleAuditHistory,
  type SecureAuditEvent,
} from "@/lib/circle/secure-audit-client";

type CircleRecordsPanel =
  | "goals"
  | "documents"
  | "audit"
  | string
  | null;

type UseCircleRecordsOptions = {
  circleId: string;
  participantId: string;
  activePanel: CircleRecordsPanel;
  defaultGoalOwner: string;
  enabled?: boolean;
};

function describeError(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export default function useCircleRecords({
  circleId,
  participantId,
  activePanel,
  defaultGoalOwner,
  enabled = true,
}: UseCircleRecordsOptions) {
  const [goals, setGoals] = useState<
    SecureCircleGoal[]
  >([]);

  const [goalsLoading, setGoalsLoading] =
    useState(false);

  const [goalWorkingId, setGoalWorkingId] =
    useState("");

  const [goalMessage, setGoalMessage] =
    useState("");

  const [goalTitle, setGoalTitle] =
    useState("");

  const [goalOwner, setGoalOwner] =
    useState("");

  const [documents, setDocuments] =
    useState<SecureCircleDocument[]>([]);

  const [
    documentsLoading,
    setDocumentsLoading,
  ] = useState(false);

  const [
    documentWorkingId,
    setDocumentWorkingId,
  ] = useState("");

  const [
    documentMessage,
    setDocumentMessage,
  ] = useState("");

  const [auditEvents, setAuditEvents] =
    useState<SecureAuditEvent[]>([]);

  const [auditLoading, setAuditLoading] =
    useState(false);

  const [auditMessage, setAuditMessage] =
    useState("");

  useEffect(() => {
    setGoals([]);
    setDocuments([]);
    setAuditEvents([]);
    setGoalMessage("");
    setDocumentMessage("");
    setAuditMessage("");

    if (
      !enabled ||
      !circleId ||
      !participantId
    ) {
      setGoalsLoading(false);
      return;
    }

    let active = true;

    async function loadGoals() {
      setGoalsLoading(true);

      try {
        const secureGoals =
          await readSecureCircleGoals(
            circleId,
          );

        if (!active) {
          return;
        }

        setGoals(secureGoals);
      } catch (error) {
        if (!active) {
          return;
        }

        setGoalMessage(
          describeError(
            error,
            "The Circle goals could not be loaded.",
          ),
        );
      } finally {
        if (active) {
          setGoalsLoading(false);
        }
      }
    }

    void loadGoals();

    return () => {
      active = false;
    };
  }, [
    circleId,
    enabled,
    participantId,
  ]);

  useEffect(() => {
    if (
      activePanel !== "documents" ||
      !enabled ||
      !circleId
    ) {
      return;
    }

    let active = true;

    async function loadDocuments() {
      setDocumentsLoading(true);
      setDocumentMessage("");

      try {
        const secureDocuments =
          await readSecureCircleDocuments(
            circleId,
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
          describeError(
            error,
            "Two-step security is required.",
          ),
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
  }, [
    activePanel,
    circleId,
    enabled,
  ]);

  useEffect(() => {
    if (
      activePanel !== "audit" ||
      !enabled ||
      !circleId
    ) {
      return;
    }

    let active = true;

    async function loadAuditHistory() {
      setAuditLoading(true);
      setAuditMessage("");

      try {
        const events =
          await readSecureCircleAuditHistory(
            circleId,
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
          describeError(
            error,
            "The secure audit history could not be loaded.",
          ),
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
  }, [
    activePanel,
    circleId,
    enabled,
  ]);

  const addGoal = useCallback(
    async () => {
      const title = goalTitle.trim();

      if (
        !enabled ||
        !circleId ||
        !participantId ||
        !title ||
        goalWorkingId
      ) {
        return;
      }

      setGoalWorkingId("new");
      setGoalMessage("");

      try {
        const createdGoal =
          await createSecureCircleGoal({
            circleId,
            participantId,
            title,
            ownerName:
              goalOwner.trim() ||
              defaultGoalOwner.trim() ||
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
          describeError(
            error,
            "Two-step security is required.",
          ),
        );
      } finally {
        setGoalWorkingId("");
      }
    },
    [
      circleId,
      defaultGoalOwner,
      enabled,
      goalOwner,
      goalTitle,
      goalWorkingId,
      participantId,
    ],
  );

  const advanceGoal = useCallback(
    async (goal: SecureCircleGoal) => {
      if (goalWorkingId) {
        return;
      }

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
          describeError(
            error,
            "The goal status could not be updated.",
          ),
        );
      } finally {
        setGoalWorkingId("");
      }
    },
    [goalWorkingId],
  );

  const removeGoal = useCallback(
    async (goalId: string) => {
      if (goalWorkingId) {
        return;
      }

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
          describeError(
            error,
            "The goal could not be archived.",
          ),
        );
      } finally {
        setGoalWorkingId("");
      }
    },
    [goalWorkingId],
  );

  const refreshDocuments = useCallback(
    async () => {
      if (
        !enabled ||
        !circleId ||
        documentsLoading
      ) {
        return;
      }

      setDocumentsLoading(true);
      setDocumentMessage("");

      try {
        const secureDocuments =
          await readSecureCircleDocuments(
            circleId,
          );

        setDocuments(secureDocuments);
      } catch (error) {
        setDocumentMessage(
          describeError(
            error,
            "Two-step security is required.",
          ),
        );
      } finally {
        setDocumentsLoading(false);
      }
    },
    [
      circleId,
      documentsLoading,
      enabled,
    ],
  );

  const openDocument = useCallback(
    async (
      secureDocument:
        SecureCircleDocument,
    ) => {
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
          describeError(
            error,
            "Two-step security is required.",
          ),
        );
      } finally {
        setDocumentWorkingId("");
      }
    },
    [documentWorkingId],
  );

  const removeDocument = useCallback(
    async (documentId: string) => {
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
          describeError(
            error,
            "Two-step security is required.",
          ),
        );
      } finally {
        setDocumentWorkingId("");
      }
    },
    [documentWorkingId],
  );

  const activeGoals = useMemo(
    () =>
      goals.filter(
        (goal) =>
          goal.goal_status !==
            "achieved" &&
          goal.goal_status !==
            "archived",
      ).length,
    [goals],
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

  return {
    goals: {
      records: goals,
      loading: goalsLoading,
      workingId: goalWorkingId,
      message: goalMessage,
      activeCount: activeGoals,
      form: {
        title: goalTitle,
        owner: goalOwner,
      },
      setTitle: setGoalTitle,
      setOwner: setGoalOwner,
      add: addGoal,
      advance: advanceGoal,
      remove: removeGoal,
    },

    documents: {
      records: documents,
      loading: documentsLoading,
      workingId: documentWorkingId,
      message: documentMessage,
      needingReviewCount:
        documentsNeedingReview,
      refresh: refreshDocuments,
      open: openDocument,
      remove: removeDocument,
    },

    audit: {
      events: auditEvents,
      loading: auditLoading,
      message: auditMessage,
    },
  };
}