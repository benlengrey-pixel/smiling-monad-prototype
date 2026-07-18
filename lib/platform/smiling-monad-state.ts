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

export function createDefaultSmilingMonadState(): SmilingMonadState {
  return {
    version: 1,
    communityPosts: createDefaultCommunityPosts(),
    connectionProfiles: [],
    workOpportunities: [],
    schoolLessons: [],
    shopItems: [],
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