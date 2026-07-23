"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

type UseCircleOperationsOptions = {
  circleId: string;
  participantId: string;
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

export default function useCircleOperations({
  circleId,
  participantId,
  enabled = true,
}: UseCircleOperationsOptions) {
  const [members, setMembers] = useState<
    SecureCircleMemberRecord[]
  >([]);

  const [meetings, setMeetings] = useState<
    SecureCircleMeeting[]
  >([]);

  const [
    responsibilities,
    setResponsibilities,
  ] = useState<
    SecureCircleResponsibility[]
  >([]);

  const [budgets, setBudgets] = useState<
    SecureCircleBudgetItem[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [loadMessage, setLoadMessage] =
    useState("");

  const [
    memberWorkingId,
    setMemberWorkingId,
  ] = useState("");

  const [memberMessage, setMemberMessage] =
    useState("");

  const [memberName, setMemberName] =
    useState("");

  const [memberEmail, setMemberEmail] =
    useState("");

  const [memberRole, setMemberRole] =
    useState<SecureMemberRole>(
      "circle_member",
    );

  const [
    memberRelationship,
    setMemberRelationship,
  ] = useState("");

  const [
    meetingWorkingId,
    setMeetingWorkingId,
  ] = useState("");

  const [meetingMessage, setMeetingMessage] =
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
    responsibilityWorkingId,
    setResponsibilityWorkingId,
  ] = useState("");

  const [
    responsibilityMessage,
    setResponsibilityMessage,
  ] = useState("");

  const [
    responsibilityTitle,
    setResponsibilityTitle,
  ] = useState("");

  const [
    responsibilityOwner,
    setResponsibilityOwner,
  ] = useState("");

  const [
    budgetWorkingId,
    setBudgetWorkingId,
  ] = useState("");

  const [budgetMessage, setBudgetMessage] =
    useState("");

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

  const applyOperations = useCallback(
    (
      operations: Awaited<
        ReturnType<
          typeof readSecureCircleOperations
        >
      >,
    ) => {
      setMembers(operations.members);
      setMeetings(operations.meetings);
      setResponsibilities(
        operations.responsibilities,
      );
      setBudgets(operations.budgets);
    },
    [],
  );

  const refresh = useCallback(
    async () => {
      if (
        !enabled ||
        !circleId ||
        loading
      ) {
        return;
      }

      setLoading(true);
      setLoadMessage("");

      try {
        const operations =
          await readSecureCircleOperations(
            circleId,
          );

        applyOperations(operations);
      } catch (error) {
        setLoadMessage(
          describeError(
            error,
            "The Circle operations could not be loaded.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      applyOperations,
      circleId,
      enabled,
      loading,
    ],
  );

  useEffect(() => {
    if (!enabled || !circleId) {
      return;
    }

    let active = true;

    async function loadOperations() {
      setLoading(true);
      setLoadMessage("");

      try {
        const operations =
          await readSecureCircleOperations(
            circleId,
          );

        if (!active) {
          return;
        }

        applyOperations(operations);
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadMessage(
          describeError(
            error,
            "The Circle operations could not be loaded.",
          ),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOperations();

    return () => {
      active = false;
    };
  }, [
    applyOperations,
    circleId,
    enabled,
  ]);

  const addMember = useCallback(
    async () => {
      if (
        !circleId ||
        memberWorkingId
      ) {
        return;
      }

      setMemberWorkingId("new");
      setMemberMessage("");

      try {
        const createdMember =
          await inviteSecureCircleMember({
            circleId,
            email: memberEmail,
            displayName: memberName,
            role: memberRole,
            relationship:
              memberRelationship,
          });

        setMembers((current) => [
          ...current,
          createdMember,
        ]);

        setMemberName("");
        setMemberEmail("");
        setMemberRole("circle_member");
        setMemberRelationship("");
        setMemberMessage(
          "Circle invitation saved securely.",
        );
      } catch (error) {
        setMemberMessage(
          describeError(
            error,
            "The Circle invitation could not be saved.",
          ),
        );
      } finally {
        setMemberWorkingId("");
      }
    },
    [
      circleId,
      memberEmail,
      memberName,
      memberRelationship,
      memberRole,
      memberWorkingId,
    ],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (memberWorkingId) {
        return;
      }

      setMemberWorkingId(memberId);
      setMemberMessage("");

      try {
        await updateSecureCircleMember(
          memberId,
          {
            membership_status:
              "removed",
          },
        );

        setMembers((current) =>
          current.filter(
            (member) =>
              member.id !== memberId,
          ),
        );

        setMemberMessage(
          "Circle access removed securely.",
        );
      } catch (error) {
        setMemberMessage(
          describeError(
            error,
            "Circle access could not be removed.",
          ),
        );
      } finally {
        setMemberWorkingId("");
      }
    },
    [memberWorkingId],
  );

  const addMeeting = useCallback(
    async () => {
      if (
        !circleId ||
        !participantId ||
        meetingWorkingId
      ) {
        return;
      }

      setMeetingWorkingId("new");
      setMeetingMessage("");

      try {
        const createdMeeting =
          await createSecureMeeting({
            circleId,
            participantId,
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
        setMeetingMessage(
          "Meeting saved securely.",
        );
      } catch (error) {
        setMeetingMessage(
          describeError(
            error,
            "The meeting could not be saved.",
          ),
        );
      } finally {
        setMeetingWorkingId("");
      }
    },
    [
      circleId,
      meetingDate,
      meetingPurpose,
      meetingTitle,
      meetingWorkingId,
      participantId,
    ],
  );

  const removeMeeting = useCallback(
    async (meetingId: string) => {
      if (meetingWorkingId) {
        return;
      }

      setMeetingWorkingId(meetingId);
      setMeetingMessage("");

      try {
        await updateSecureMeeting(
          meetingId,
          {
            meeting_status: "archived",
          },
        );

        setMeetings((current) =>
          current.filter(
            (meeting) =>
              meeting.id !== meetingId,
          ),
        );

        setMeetingMessage(
          "Meeting archived securely.",
        );
      } catch (error) {
        setMeetingMessage(
          describeError(
            error,
            "The meeting could not be archived.",
          ),
        );
      } finally {
        setMeetingWorkingId("");
      }
    },
    [meetingWorkingId],
  );

  const addResponsibility = useCallback(
    async () => {
      if (
        !circleId ||
        !participantId ||
        responsibilityWorkingId
      ) {
        return;
      }

      setResponsibilityWorkingId("new");
      setResponsibilityMessage("");

      try {
        const createdResponsibility =
          await createSecureResponsibility({
            circleId,
            participantId,
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
        setResponsibilityMessage(
          "Responsibility saved securely.",
        );
      } catch (error) {
        setResponsibilityMessage(
          describeError(
            error,
            "The responsibility could not be saved.",
          ),
        );
      } finally {
        setResponsibilityWorkingId("");
      }
    },
    [
      circleId,
      participantId,
      responsibilityOwner,
      responsibilityTitle,
      responsibilityWorkingId,
    ],
  );

  const advanceResponsibility =
    useCallback(
      async (
        responsibility:
          SecureCircleResponsibility,
      ) => {
        if (responsibilityWorkingId) {
          return;
        }

        const statuses = [
          "open",
          "in_progress",
          "complete",
        ] as const;

        const currentIndex =
          statuses.indexOf(
            responsibility.responsibility_status as
              (typeof statuses)[number],
          );

        const nextStatus =
          currentIndex < 0 ||
          currentIndex ===
            statuses.length - 1
            ? "open"
            : statuses[
                currentIndex + 1
              ];

        setResponsibilityWorkingId(
          responsibility.id,
        );
        setResponsibilityMessage("");

        try {
          const updated =
            await updateSecureResponsibility(
              responsibility.id,
              {
                responsibility_status:
                  nextStatus,
              },
            );

          setResponsibilities((current) =>
            current.map((item) =>
              item.id === updated.id
                ? updated
                : item,
            ),
          );

          setResponsibilityMessage(
            "Responsibility updated securely.",
          );
        } catch (error) {
          setResponsibilityMessage(
            describeError(
              error,
              "The responsibility could not be updated.",
            ),
          );
        } finally {
          setResponsibilityWorkingId("");
        }
      },
      [responsibilityWorkingId],
    );

  const removeResponsibility =
    useCallback(
      async (
        responsibilityId: string,
      ) => {
        if (responsibilityWorkingId) {
          return;
        }

        setResponsibilityWorkingId(
          responsibilityId,
        );
        setResponsibilityMessage("");

        try {
          await updateSecureResponsibility(
            responsibilityId,
            {
              responsibility_status:
                "archived",
            },
          );

          setResponsibilities((current) =>
            current.filter(
              (item) =>
                item.id !==
                responsibilityId,
            ),
          );

          setResponsibilityMessage(
            "Responsibility archived securely.",
          );
        } catch (error) {
          setResponsibilityMessage(
            describeError(
              error,
              "The responsibility could not be archived.",
            ),
          );
        } finally {
          setResponsibilityWorkingId("");
        }
      },
      [responsibilityWorkingId],
    );

  const addBudgetItem = useCallback(
    async () => {
      if (
        !circleId ||
        !participantId ||
        budgetWorkingId
      ) {
        return;
      }

      const allocated =
        Number.parseFloat(
          budgetAllocated,
        );

      const spent =
        Number.parseFloat(budgetSpent);

      if (
        !budgetTitle.trim() ||
        !Number.isFinite(allocated) ||
        allocated < 0
      ) {
        setBudgetMessage(
          "Enter a budget title and a valid allocated amount.",
        );
        return;
      }

      setBudgetWorkingId("new");
      setBudgetMessage("");

      try {
        const createdBudget =
          await createSecureBudgetItem({
            circleId,
            participantId,
            title: budgetTitle,
            category: budgetCategory,
            allocated,
            spent:
              Number.isFinite(spent) &&
              spent >= 0
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
        setBudgetMessage(
          "Budget item saved securely.",
        );
      } catch (error) {
        setBudgetMessage(
          describeError(
            error,
            "The budget item could not be saved.",
          ),
        );
      } finally {
        setBudgetWorkingId("");
      }
    },
    [
      budgetAllocated,
      budgetCategory,
      budgetOwner,
      budgetSpent,
      budgetTitle,
      budgetWorkingId,
      circleId,
      participantId,
    ],
  );

  const advanceBudgetStatus =
    useCallback(
      async (
        item: SecureCircleBudgetItem,
      ) => {
        if (budgetWorkingId) {
          return;
        }

        const statuses = [
          "active",
          "review_needed",
          "closed",
        ] as const;

        const currentIndex =
          statuses.indexOf(
            item.budget_status as
              (typeof statuses)[number],
          );

        const nextStatus =
          currentIndex < 0 ||
          currentIndex ===
            statuses.length - 1
            ? "active"
            : statuses[
                currentIndex + 1
              ];

        setBudgetWorkingId(item.id);
        setBudgetMessage("");

        try {
          const updated =
            await updateSecureBudgetItem(
              item.id,
              {
                budget_status:
                  nextStatus,
              },
            );

          setBudgets((current) =>
            current.map((currentItem) =>
              currentItem.id ===
              updated.id
                ? updated
                : currentItem,
            ),
          );

          setBudgetMessage(
            "Budget status updated securely.",
          );
        } catch (error) {
          setBudgetMessage(
            describeError(
              error,
              "The budget item could not be updated.",
            ),
          );
        } finally {
          setBudgetWorkingId("");
        }
      },
      [budgetWorkingId],
    );

  const removeBudgetItem =
    useCallback(
      async (budgetId: string) => {
        if (budgetWorkingId) {
          return;
        }

        setBudgetWorkingId(budgetId);
        setBudgetMessage("");

        try {
          await updateSecureBudgetItem(
            budgetId,
            {
              budget_status:
                "archived",
            },
          );

          setBudgets((current) =>
            current.filter(
              (item) =>
                item.id !== budgetId,
            ),
          );

          setBudgetMessage(
            "Budget item archived securely.",
          );
        } catch (error) {
          setBudgetMessage(
            describeError(
              error,
              "The budget item could not be archived.",
            ),
          );
        } finally {
          setBudgetWorkingId("");
        }
      },
      [budgetWorkingId],
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

  const totalBudgetAllocated =
    useMemo(
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

  return {
    loading,
    loadMessage,
    refresh,

    members: {
      records: members,
      workingId: memberWorkingId,
      message: memberMessage,
      form: {
        name: memberName,
        email: memberEmail,
        role: memberRole,
        relationship:
          memberRelationship,
      },
      setName: setMemberName,
      setEmail: setMemberEmail,
      setRole: setMemberRole,
      setRelationship:
        setMemberRelationship,
      add: addMember,
      remove: removeMember,
    },

    meetings: {
      records: meetings,
      workingId: meetingWorkingId,
      message: meetingMessage,
      form: {
        title: meetingTitle,
        date: meetingDate,
        purpose: meetingPurpose,
      },
      setTitle: setMeetingTitle,
      setDate: setMeetingDate,
      setPurpose: setMeetingPurpose,
      add: addMeeting,
      remove: removeMeeting,
    },

    responsibilities: {
      records: responsibilities,
      workingId:
        responsibilityWorkingId,
      message:
        responsibilityMessage,
      openCount:
        openResponsibilities,
      form: {
        title: responsibilityTitle,
        owner: responsibilityOwner,
      },
      setTitle:
        setResponsibilityTitle,
      setOwner:
        setResponsibilityOwner,
      add: addResponsibility,
      advance:
        advanceResponsibility,
      remove:
        removeResponsibility,
    },

    budgets: {
      records: budgets,
      workingId: budgetWorkingId,
      message: budgetMessage,
      totalAllocated:
        totalBudgetAllocated,
      totalSpent: totalBudgetSpent,
      form: {
        title: budgetTitle,
        category: budgetCategory,
        allocated: budgetAllocated,
        spent: budgetSpent,
        owner: budgetOwner,
      },
      setTitle: setBudgetTitle,
      setCategory:
        setBudgetCategory,
      setAllocated:
        setBudgetAllocated,
      setSpent: setBudgetSpent,
      setOwner: setBudgetOwner,
      add: addBudgetItem,
      advanceStatus:
        advanceBudgetStatus,
      remove: removeBudgetItem,
    },
  };
}