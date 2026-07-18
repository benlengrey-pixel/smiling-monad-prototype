export type CommunityPostType =
  | "event"
  | "announcement"
  | "opportunity"
  | "request";

export type CommunityPostStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "archived";

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  type: CommunityPostType;
  status: CommunityPostStatus;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type ConnectionProfileType =
  | "participant"
  | "family"
  | "support-worker"
  | "provider"
  | "professional"
  | "community-member";

export type ConnectionProfileStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "archived";

export type ConnectionProfile = {
  id: string;
  name: string;
  profileType: ConnectionProfileType;
  summary: string;
  location: string;
  interests: string[];
  offers: string[];
  lookingFor: string[];
  status: ConnectionProfileStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkOpportunityStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "filled"
  | "archived";

export type WorkOpportunity = {
  id: string;
  title: string;
  description: string;
  location: string;
  contactName: string;
  status: WorkOpportunityStatus;
  createdAt: string;
  updatedAt: string;
};

export type SchoolContentStatus =
  | "draft"
  | "review"
  | "published"
  | "archived";

export type SchoolLesson = {
  id: string;
  area:
    | "support"
    | "communication"
    | "behaviour"
    | "circles"
    | "development";
  title: string;
  summary: string;
  content: string;
  status: SchoolContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type ShopItemStatus =
  | "draft"
  | "review"
  | "published"
  | "unavailable"
  | "archived";

export type ShopItem = {
  id: string;
  area:
    | "resources"
    | "templates"
    | "training"
    | "merchandise"
    | "digital";
  title: string;
  description: string;
  priceInCents: number | null;
  status: ShopItemStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkerApplicationStatus =
  | "draft"
  | "training"
  | "evidence-review"
  | "profile-review"
  | "approved"
  | "changes-requested"
  | "suspended"
  | "archived";

export type WorkerModuleStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "needs-review";

export type WorkerAssessmentStatus =
  | "not-attempted"
  | "passed"
  | "needs-review";

export type WorkerEvidenceType =
  | "identity"
  | "ndis-worker-screening"
  | "worker-orientation-module"
  | "first-aid"
  | "working-with-children"
  | "qualification"
  | "experience"
  | "insurance"
  | "other";

export type WorkerEvidenceStatus =
  | "not-provided"
  | "provided"
  | "verified"
  | "rejected"
  | "expired";

export type WorkerBadgeStatus =
  | "not-eligible"
  | "eligible"
  | "active"
  | "suspended"
  | "expired";

export type WorkerTrainingModuleProgress = {
  moduleId: string;
  title: string;
  status: WorkerModuleStatus;
  completedAt: string | null;
  knowledgeCheckScore: number | null;
  knowledgeCheckStatus: WorkerAssessmentStatus;
  reflectionResponse: string;
  reviewerNote: string;
};

export type WorkerEvidenceRecord = {
  id: string;
  type: WorkerEvidenceType;
  label: string;
  status: WorkerEvidenceStatus;
  documentReference: string;
  issuedBy: string;
  issuedAt: string | null;
  expiresAt: string | null;
  reviewerNote: string;
  verifiedAt: string | null;
};

export type WorkerPrivateDetails = {
  legalName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  emergencyContact: string;
  screeningNumber: string;
  privateNotes: string;
};

export type WorkerPublicProfileDraft = {
  displayName: string;
  photoReference: string;
  headline: string;
  summary: string;
  generalLocation: string;
  travelAreas: string[];
  experience: string[];
  supportInterests: string[];
  communicationApproach: string;
  availability: string;
  languages: string[];
  publicTrainingStatements: string[];
};

export type WorkerApplication = {
  id: string;
  userId: string | null;
  status: WorkerApplicationStatus;
  trainingProgress: WorkerTrainingModuleProgress[];
  evidence: WorkerEvidenceRecord[];
  privateDetails: WorkerPrivateDetails;
  publicProfile: WorkerPublicProfileDraft;
  reviewNotes: string[];
  badgeStatus: WorkerBadgeStatus;
  badgeLabel: "Smiling Monad Trained";
  connectionProfileId: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  lastReviewedAt: string | null;
  renewalDueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CircleProfile = {
  personName: string;
  preferredName: string;
  whatMatters: string;
  communication: string;
};

export type CircleMember = {
  id: string;
  name: string;
  role: string;
  relationship: string;
};

export type CircleGoal = {
  id: string;
  title: string;
  owner: string;
  status: "Planning" | "Active" | "Complete";
};

export type CircleDocument = {
  id: string;
  title: string;
  category:
    | "Plan"
    | "Agreement"
    | "Report"
    | "Meeting"
    | "Other";
  status: "Draft" | "Current" | "Review needed";
};

export type CircleMeeting = {
  id: string;
  title: string;
  date: string;
  purpose: string;
};

export type CircleResponsibility = {
  id: string;
  title: string;
  owner: string;
  status: "Open" | "In progress" | "Complete";
};

export type CircleCentreState = {
  profile: CircleProfile;
  members: CircleMember[];
  goals: CircleGoal[];
  documents: CircleDocument[];
  meetings: CircleMeeting[];
  responsibilities: CircleResponsibility[];
};

export type SmilingMonadState = {
  version: 1;
  communityPosts: CommunityPost[];
  connectionProfiles: ConnectionProfile[];
  workOpportunities: WorkOpportunity[];
  schoolLessons: SchoolLesson[];
  shopItems: ShopItem[];
  workerApplications: WorkerApplication[];
  circle: CircleCentreState;
};

const PLATFORM_STORAGE_KEY =
  "smiling-monad-platform-state-v1";

const LEGACY_CIRCLE_STORAGE_KEY =
  "smiling-monad-circle-centre-v2";

function createId(prefix: string): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function now(): string {
  return new Date().toISOString();
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function createDefaultCircleState(): CircleCentreState {
  return {
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
}

function createDefaultCommunityPosts(): CommunityPost[] {
  const timestamp = now();

  return [
    {
      id: "welcome-community",
      title: "Welcome to the Smiling Monad Community",
      body:
        "This is a shared place for events, announcements, opportunities and respectful community connection.",
      type: "announcement",
      status: "approved",
      author: "The Smiling Monad",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "community-gathering",
      title: "Community Gathering",
      body:
        "A relaxed gathering for participants, families, workers, providers and community members to meet and share ideas.",
      type: "event",
      status: "approved",
      author: "The Smiling Monad",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

export function createDefaultWorkerTrainingProgress(): WorkerTrainingModuleProgress[] {
  return [
    {
      moduleId: "smiling-monad-foundations",
      title: "The Smiling Monad Way",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "whole-person-support",
      title: "Understanding the Whole Person",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "communication-beyond-speech",
      title: "Communication Beyond Speech",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "behaviour-as-communication",
      title: "Behaviour as Communication",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "choice-consent-decisions",
      title: "Choice, Consent and Supported Decision-Making",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "professional-boundaries",
      title: "Professional Boundaries",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "documentation",
      title: "Reliable Shift Notes and Documentation",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "families-and-circles",
      title: "Working with Families and Circles of Support",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "safety-and-escalation",
      title: "Safety, Escalation and Reporting Concerns",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
    {
      moduleId: "reflective-practice",
      title: "Reflective Practice and Worker Wellbeing",
      status: "not-started",
      completedAt: null,
      knowledgeCheckScore: null,
      knowledgeCheckStatus: "not-attempted",
      reflectionResponse: "",
      reviewerNote: "",
    },
  ];
}

export function createEmptyWorkerApplication(
  input: {
    userId?: string | null;
    legalName?: string;
    email?: string;
  } = {},
): WorkerApplication {
  const timestamp = now();

  return {
    id: createId("worker-application"),
    userId: input.userId ?? null,
    status: "draft",
    trainingProgress:
      createDefaultWorkerTrainingProgress(),
    evidence: [],
    privateDetails: {
      legalName: input.legalName?.trim() || "",
      email: input.email?.trim() || "",
      phone: "",
      address: "",
      dateOfBirth: "",
      emergencyContact: "",
      screeningNumber: "",
      privateNotes: "",
    },
    publicProfile: {
      displayName: "",
      photoReference: "",
      headline: "",
      summary: "",
      generalLocation: "",
      travelAreas: [],
      experience: [],
      supportInterests: [],
      communicationApproach: "",
      availability: "",
      languages: [],
      publicTrainingStatements: [],
    },
    reviewNotes: [],
    badgeStatus: "not-eligible",
    badgeLabel: "Smiling Monad Trained",
    connectionProfileId: null,
    submittedAt: null,
    approvedAt: null,
    lastReviewedAt: null,
    renewalDueAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createDefaultSmilingMonadState(): SmilingMonadState {
  return {
    version: 1,
    communityPosts: createDefaultCommunityPosts(),
    connectionProfiles: [],
    workOpportunities: [],
    schoolLessons: [],
    shopItems: [],
    workerApplications: [],
    circle: createDefaultCircleState(),
  };
}

function readLegacyCircleState(): CircleCentreState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        LEGACY_CIRCLE_STORAGE_KEY,
      );

    if (!storedValue) {
      return null;
    }

    const parsedValue =
      JSON.parse(storedValue) as unknown;

    if (!isRecord(parsedValue)) {
      return null;
    }

    const profile = isRecord(parsedValue.profile)
      ? parsedValue.profile
      : {};

    return {
      profile: {
        personName:
          typeof profile.personName === "string"
            ? profile.personName
            : "",
        preferredName:
          typeof profile.preferredName === "string"
            ? profile.preferredName
            : "",
        whatMatters:
          typeof profile.whatMatters === "string"
            ? profile.whatMatters
            : "",
        communication:
          typeof profile.communication === "string"
            ? profile.communication
            : "",
      },
      members: Array.isArray(parsedValue.members)
        ? (parsedValue.members as CircleMember[])
        : [],
      goals: Array.isArray(parsedValue.goals)
        ? (parsedValue.goals as CircleGoal[])
        : [],
      documents: Array.isArray(parsedValue.documents)
        ? (parsedValue.documents as CircleDocument[])
        : [],
      meetings: Array.isArray(parsedValue.meetings)
        ? (parsedValue.meetings as CircleMeeting[])
        : [],
      responsibilities: Array.isArray(
        parsedValue.responsibilities,
      )
        ? (parsedValue.responsibilities as CircleResponsibility[])
        : [],
    };
  } catch {
    return null;
  }
}

function normaliseState(
  value: unknown,
): SmilingMonadState {
  const fallback =
    createDefaultSmilingMonadState();

  if (!isRecord(value)) {
    return fallback;
  }

  const circleValue = isRecord(value.circle)
    ? value.circle
    : {};

  const profileValue = isRecord(
    circleValue.profile,
  )
    ? circleValue.profile
    : {};

  return {
    version: 1,

    communityPosts: Array.isArray(
      value.communityPosts,
    )
      ? (value.communityPosts as CommunityPost[])
      : fallback.communityPosts,

    connectionProfiles: Array.isArray(
      value.connectionProfiles,
    )
      ? (value.connectionProfiles as ConnectionProfile[])
      : [],

    workOpportunities: Array.isArray(
      value.workOpportunities,
    )
      ? (value.workOpportunities as WorkOpportunity[])
      : [],

    schoolLessons: Array.isArray(
      value.schoolLessons,
    )
      ? (value.schoolLessons as SchoolLesson[])
      : [],

    shopItems: Array.isArray(value.shopItems)
      ? (value.shopItems as ShopItem[])
      : [],

    workerApplications: Array.isArray(
      value.workerApplications,
    )
      ? (value.workerApplications as WorkerApplication[])
      : [],

    circle: {
      profile: {
        personName:
          typeof profileValue.personName ===
          "string"
            ? profileValue.personName
            : "",
        preferredName:
          typeof profileValue.preferredName ===
          "string"
            ? profileValue.preferredName
            : "",
        whatMatters:
          typeof profileValue.whatMatters ===
          "string"
            ? profileValue.whatMatters
            : "",
        communication:
          typeof profileValue.communication ===
          "string"
            ? profileValue.communication
            : "",
      },

      members: Array.isArray(
        circleValue.members,
      )
        ? (circleValue.members as CircleMember[])
        : [],

      goals: Array.isArray(circleValue.goals)
        ? (circleValue.goals as CircleGoal[])
        : [],

      documents: Array.isArray(
        circleValue.documents,
      )
        ? (circleValue.documents as CircleDocument[])
        : [],

      meetings: Array.isArray(
        circleValue.meetings,
      )
        ? (circleValue.meetings as CircleMeeting[])
        : [],

      responsibilities: Array.isArray(
        circleValue.responsibilities,
      )
        ? (circleValue.responsibilities as CircleResponsibility[])
        : [],
    },
  };
}

export function readSmilingMonadState(): SmilingMonadState {
  if (typeof window === "undefined") {
    return createDefaultSmilingMonadState();
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        PLATFORM_STORAGE_KEY,
      );

    if (storedValue) {
      return normaliseState(
        JSON.parse(storedValue) as unknown,
      );
    }

    const initialState =
      createDefaultSmilingMonadState();

    const legacyCircle =
      readLegacyCircleState();

    if (legacyCircle) {
      initialState.circle = legacyCircle;
    }

    saveSmilingMonadState(initialState);

    return initialState;
  } catch {
    return createDefaultSmilingMonadState();
  }
}

export function saveSmilingMonadState(
  state: SmilingMonadState,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PLATFORM_STORAGE_KEY,
    JSON.stringify(state),
  );

  window.dispatchEvent(
    new CustomEvent(
      "smiling-monad-state-changed",
      {
        detail: state,
      },
    ),
  );
}

export function updateSmilingMonadState(
  updater: (
    current: SmilingMonadState,
  ) => SmilingMonadState,
): SmilingMonadState {
  const current =
    readSmilingMonadState();

  const next = updater(current);

  saveSmilingMonadState(next);

  return next;
}

export function subscribeToSmilingMonadState(
  listener: (
    state: SmilingMonadState,
  ) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleCustomEvent(
    event: Event,
  ) {
    const customEvent =
      event as CustomEvent<SmilingMonadState>;

    listener(
      customEvent.detail ??
        readSmilingMonadState(),
    );
  }

  function handleStorageEvent(
    event: StorageEvent,
  ) {
    if (
      event.key === PLATFORM_STORAGE_KEY
    ) {
      listener(
        readSmilingMonadState(),
      );
    }
  }

  window.addEventListener(
    "smiling-monad-state-changed",
    handleCustomEvent,
  );

  window.addEventListener(
    "storage",
    handleStorageEvent,
  );

  return () => {
    window.removeEventListener(
      "smiling-monad-state-changed",
      handleCustomEvent,
    );

    window.removeEventListener(
      "storage",
      handleStorageEvent,
    );
  };
}

export function addCommunityPost(
  input: {
    title: string;
    body: string;
    type: CommunityPostType;
    author?: string;
    status?: CommunityPostStatus;
  },
): CommunityPost {
  const timestamp = now();

  const post: CommunityPost = {
    id: createId("community-post"),
    title: input.title.trim(),
    body: input.body.trim(),
    type: input.type,
    author:
      input.author?.trim() ||
      "Community member",
    status:
      input.status ?? "submitted",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  updateSmilingMonadState(
    (current) => ({
      ...current,
      communityPosts: [
        ...current.communityPosts,
        post,
      ],
    }),
  );

  return post;
}

export function addConnectionProfile(
  input: Omit<
    ConnectionProfile,
    | "id"
    | "createdAt"
    | "updatedAt"
  >,
): ConnectionProfile {
  const timestamp = now();

  const profile: ConnectionProfile = {
    ...input,
    id: createId("connection-profile"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  updateSmilingMonadState(
    (current) => ({
      ...current,
      connectionProfiles: [
        ...current.connectionProfiles,
        profile,
      ],
    }),
  );

  return profile;
}

export function addWorkOpportunity(
  input: Omit<
    WorkOpportunity,
    | "id"
    | "createdAt"
    | "updatedAt"
  >,
): WorkOpportunity {
  const timestamp = now();

  const opportunity: WorkOpportunity = {
    ...input,
    id: createId("work-opportunity"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  updateSmilingMonadState(
    (current) => ({
      ...current,
      workOpportunities: [
        ...current.workOpportunities,
        opportunity,
      ],
    }),
  );

  return opportunity;
}

export function addSchoolLesson(
  input: Omit<
    SchoolLesson,
    | "id"
    | "createdAt"
    | "updatedAt"
  >,
): SchoolLesson {
  const timestamp = now();

  const lesson: SchoolLesson = {
    ...input,
    id: createId("school-lesson"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  updateSmilingMonadState(
    (current) => ({
      ...current,
      schoolLessons: [
        ...current.schoolLessons,
        lesson,
      ],
    }),
  );

  return lesson;
}

export function addShopItem(
  input: Omit<
    ShopItem,
    | "id"
    | "createdAt"
    | "updatedAt"
  >,
): ShopItem {
  const timestamp = now();

  const item: ShopItem = {
    ...input,
    id: createId("shop-item"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  updateSmilingMonadState(
    (current) => ({
      ...current,
      shopItems: [
        ...current.shopItems,
        item,
      ],
    }),
  );

  return item;
}

export function addWorkerApplication(
  input: {
    userId?: string | null;
    legalName?: string;
    email?: string;
  } = {},
): WorkerApplication {
  const application =
    createEmptyWorkerApplication(input);

  updateSmilingMonadState(
    (current) => ({
      ...current,
      workerApplications: [
        ...current.workerApplications,
        application,
      ],
    }),
  );

  return application;
}

export function updateWorkerApplication(
  applicationId: string,
  updater: (
    current: WorkerApplication,
  ) => WorkerApplication,
): WorkerApplication {
  let updatedApplication:
    | WorkerApplication
    | null = null;

  updateSmilingMonadState(
    (current) => ({
      ...current,
      workerApplications:
        current.workerApplications.map(
          (application) => {
            if (
              application.id !==
              applicationId
            ) {
              return application;
            }

            updatedApplication = {
              ...updater(application),
              id: application.id,
              badgeLabel:
                "Smiling Monad Trained",
              updatedAt: now(),
            };

            return updatedApplication;
          },
        ),
    }),
  );

  if (!updatedApplication) {
    throw new Error(
      `Worker application "${applicationId}" was not found.`,
    );
  }

  return updatedApplication;
}

export function isWorkerTrainingComplete(
  application: WorkerApplication,
): boolean {
  return (
    application.trainingProgress.length > 0 &&
    application.trainingProgress.every(
      (module) =>
        module.status === "completed" &&
        module.knowledgeCheckStatus ===
          "passed" &&
        Boolean(
          module.reflectionResponse.trim(),
        ),
    )
  );
}

export function isWorkerEvidenceReady(
  application: WorkerApplication,
): boolean {
  const requiredEvidence: WorkerEvidenceType[] =
    [
      "identity",
      "ndis-worker-screening",
      "worker-orientation-module",
    ];

  return requiredEvidence.every(
    (type) =>
      application.evidence.some(
        (record) =>
          record.type === type &&
          record.status === "verified",
      ),
  );
}

export function isWorkerProfileReady(
  application: WorkerApplication,
): boolean {
  const profile =
    application.publicProfile;

  return Boolean(
    profile.displayName.trim() &&
      profile.headline.trim() &&
      profile.summary.trim() &&
      profile.generalLocation.trim() &&
      profile.communicationApproach.trim(),
  );
}

export function isWorkerEligibleForApproval(
  application: WorkerApplication,
): boolean {
  return (
    isWorkerTrainingComplete(
      application,
    ) &&
    isWorkerEvidenceReady(application) &&
    isWorkerProfileReady(application)
  );
}

export function createApprovedWorkerConnectionProfile(
  applicationId: string,
): ConnectionProfile {
  const state =
    readSmilingMonadState();

  const application =
    state.workerApplications.find(
      (item) =>
        item.id === applicationId,
    );

  if (!application) {
    throw new Error(
      `Worker application "${applicationId}" was not found.`,
    );
  }

  if (
    application.status !== "approved" ||
    application.badgeStatus !== "active" ||
    !isWorkerEligibleForApproval(
      application,
    )
  ) {
    throw new Error(
      "The worker must be trained, verified and approved before a public profile can be created.",
    );
  }

  const profile = addConnectionProfile({
    name:
      application.publicProfile.displayName,
    profileType: "support-worker",
    summary:
      application.publicProfile.summary,
    location:
      application.publicProfile
        .generalLocation,
    interests:
      application.publicProfile
        .supportInterests,
    offers: [
      ...application.publicProfile
        .experience,
      ...application.publicProfile
        .publicTrainingStatements,
      "Smiling Monad Trained",
    ],
    lookingFor: [],
    status: "approved",
  });

  updateWorkerApplication(
    application.id,
    (current) => ({
      ...current,
      connectionProfileId: profile.id,
    }),
  );

  return profile;
}