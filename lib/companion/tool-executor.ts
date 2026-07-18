import {
  updateSmilingMonadState,
  type SmilingMonadState,
} from "@/lib/platform/smiling-monad-state";

export type DeskObjectStatus =
  | "active"
  | "complete"
  | "archived";

export type WorkspaceDocumentStatus =
  | "draft"
  | "complete"
  | "archived";

export type TemporaryTaskStatus =
  | "active"
  | "complete";

export type DeskObject = {
  id: string;
  kind: string;
  title: string;
  status: DeskObjectStatus;
  documentId?: string | null;
};

export type WorkspaceDocument = {
  id: string;
  title: string;
  content: string;
  status: WorkspaceDocumentStatus;
};

export type TemporaryTask = {
  id: string;
  title: string;
  status: TemporaryTaskStatus;
};

export type CompanionState = {
  deskObjects: DeskObject[];
  documents: WorkspaceDocument[];
  temporaryTasks: TemporaryTask[];
  activeDeskObjectId: string | null;
  activeDocumentId: string | null;
  workspaceOpen: boolean;
};

export type CompanionToolName =
  | "desk.add"
  | "desk.open"
  | "desk.close"
  | "desk.remove"
  | "workspace.open"
  | "workspace.close"
  | "workspace.clear"
  | "document.create"
  | "document.update"
  | "document.complete"
  | "document.archive"
  | "task.create"
  | "task.complete"
  | "task.remove"
  | "circle.member.add"
  | "circle.goal.add"
  | "circle.document.add"
  | "circle.meeting.add"
  | "circle.responsibility.add"
  | "community.post.add"
  | "connections.profile.add"
  | "connections.work.add"
  | "school.lesson.add"
  | "shop.item.add"
  | "none";

export type CompanionToolAction = {
  tool: CompanionToolName;
  targetId: string | null;
  title: string | null;
  kind: string | null;
  content: string | null;
  reason: string;
};

export type CompanionDecision = {
  message: string;
  reasoningSummary: string;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  requiresConfirmation: boolean;
  actions: CompanionToolAction[];
};

export type ToolExecutionResult = {
  state: CompanionState;
  completedActions: CompanionToolAction[];
  failedActions: Array<{
    action: CompanionToolAction;
    error: string;
  }>;
};

export const createEmptyCompanionState =
  (): CompanionState => ({
    deskObjects: [],
    documents: [],
    temporaryTasks: [],
    activeDeskObjectId: null,
    activeDocumentId: null,
    workspaceOpen: false,
  });

const createId = (
  prefix: string,
): string => {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    typeof globalThis.crypto.randomUUID ===
      "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const copyState = (
  state: CompanionState,
): CompanionState => ({
  deskObjects: state.deskObjects.map(
    (object) => ({
      ...object,
    }),
  ),
  documents: state.documents.map(
    (document) => ({
      ...document,
    }),
  ),
  temporaryTasks:
    state.temporaryTasks.map((task) => ({
      ...task,
    })),
  activeDeskObjectId:
    state.activeDeskObjectId,
  activeDocumentId:
    state.activeDocumentId,
  workspaceOpen: state.workspaceOpen,
});

const normaliseText = (
  value: string,
): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

const titlesLikelyMatch = (
  firstTitle: string,
  secondTitle: string,
): boolean => {
  const first =
    normaliseText(firstTitle);
  const second =
    normaliseText(secondTitle);

  if (!first || !second) {
    return false;
  }

  if (
    first === second ||
    first.includes(second) ||
    second.includes(first)
  ) {
    return true;
  }

  const ignoredWords = new Set([
    "a",
    "an",
    "and",
    "document",
    "draft",
    "file",
    "folder",
    "for",
    "mail",
    "note",
    "notes",
    "report",
    "the",
    "to",
  ]);

  const firstWords = new Set(
    first
      .split(" ")
      .filter(
        (word) =>
          word.length > 2 &&
          !ignoredWords.has(word),
      ),
  );

  const secondWords = second
    .split(" ")
    .filter(
      (word) =>
        word.length > 2 &&
        !ignoredWords.has(word),
    );

  return secondWords.some((word) =>
    firstWords.has(word),
  );
};

const requireTargetId = (
  action: CompanionToolAction,
): string => {
  const targetId =
    action.targetId?.trim();

  if (!targetId) {
    throw new Error(
      `${action.tool} requires a targetId.`,
    );
  }

  return targetId;
};

const requireTitle = (
  action: CompanionToolAction,
): string => {
  const title = action.title?.trim();

  if (!title) {
    throw new Error(
      `${action.tool} requires a title.`,
    );
  }

  return title;
};

const findDeskObject = (
  state: CompanionState,
  targetId: string,
): DeskObject => {
  const object =
    state.deskObjects.find(
      (item) => item.id === targetId,
    );

  if (!object) {
    throw new Error(
      `Desk object "${targetId}" was not found.`,
    );
  }

  return object;
};

const findDocument = (
  state: CompanionState,
  targetId: string,
): WorkspaceDocument => {
  const document =
    state.documents.find(
      (item) => item.id === targetId,
    );

  if (!document) {
    throw new Error(
      `Document "${targetId}" was not found.`,
    );
  }

  return document;
};

const findTask = (
  state: CompanionState,
  targetId: string,
): TemporaryTask => {
  const task =
    state.temporaryTasks.find(
      (item) => item.id === targetId,
    );

  if (!task) {
    throw new Error(
      `Task "${targetId}" was not found.`,
    );
  }

  return task;
};

const linkDeskObjectToDocument = (
  state: CompanionState,
  objectId: string,
  documentId: string,
) => {
  const object =
    state.deskObjects.find(
      (item) => item.id === objectId,
    );

  const document =
    state.documents.find(
      (item) => item.id === documentId,
    );

  if (!object || !document) {
    return;
  }

  object.documentId = documentId;
};

const findBestDeskObjectForDocument = (
  state: CompanionState,
  document: WorkspaceDocument,
): DeskObject | null => {
  if (state.activeDeskObjectId) {
    const activeObject =
      state.deskObjects.find(
        (object) =>
          object.id ===
            state.activeDeskObjectId &&
          object.status !== "archived",
      );

    if (
      activeObject &&
      (!activeObject.documentId ||
        activeObject.documentId ===
          document.id)
    ) {
      return activeObject;
    }
  }

  const matchingUnlinkedObject = [
    ...state.deskObjects,
  ]
    .reverse()
    .find(
      (object) =>
        object.status !== "archived" &&
        !object.documentId &&
        titlesLikelyMatch(
          object.title,
          document.title,
        ),
    );

  if (matchingUnlinkedObject) {
    return matchingUnlinkedObject;
  }

  return (
    [...state.deskObjects]
      .reverse()
      .find(
        (object) =>
          object.status !==
            "archived" &&
          !object.documentId,
      ) ?? null
  );
};

const findBestDocumentForDeskObject = (
  state: CompanionState,
  object: DeskObject,
): WorkspaceDocument | null => {
  if (state.activeDocumentId) {
    const activeDocument =
      state.documents.find(
        (document) =>
          document.id ===
            state.activeDocumentId &&
          document.status !==
            "archived",
      );

    if (activeDocument) {
      return activeDocument;
    }
  }

  const matchingDocument = [
    ...state.documents,
  ]
    .reverse()
    .find(
      (document) =>
        document.status !==
          "archived" &&
        titlesLikelyMatch(
          object.title,
          document.title,
        ),
    );

  return matchingDocument ?? null;
};

const requireContentObject = (
  action: CompanionToolAction,
): Record<string, unknown> => {
  if (!action.content?.trim()) {
    throw new Error(
      `${action.tool} requires structured JSON content.`,
    );
  }

  try {
    const parsed = JSON.parse(
      action.content,
    ) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        "The content must be a JSON object.",
      );
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      error instanceof Error &&
        error.message ===
          "The content must be a JSON object."
        ? error.message
        : `${action.tool} content must be valid JSON.`,
    );
  }
};

const readString = (
  value: unknown,
  fallback = "",
): string =>
  typeof value === "string"
    ? value.trim()
    : fallback;

const readStringArray = (
  value: unknown,
): string[] =>
  Array.isArray(value)
    ? value
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) => item.trim())
        .filter(Boolean)
    : typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

const readNumberOrNull = (
  value: unknown,
): number | null => {
  if (value === null || value === "") {
    return null;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }

  return null;
};

const requireValue = (
  value: string,
  fieldName: string,
  toolName: CompanionToolName,
): string => {
  if (!value) {
    throw new Error(
      `${toolName} requires ${fieldName}.`,
    );
  }

  return value;
};

const syncLegacyCircleState = (
  state: SmilingMonadState,
) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      "smiling-monad-circle-centre-v2",
      JSON.stringify(state.circle),
    );
  } catch {
    // The shared platform state remains authoritative.
  }
};

const executePlatformAction = (
  action: CompanionToolAction,
): boolean => {
  switch (action.tool) {
    case "circle.member.add": {
      const content =
        requireContentObject(action);

      const name = requireValue(
        readString(content.name) ||
          action.title?.trim() ||
          "",
        "a member name",
        action.tool,
      );

      const nextState =
        updateSmilingMonadState(
          (current) => ({
            ...current,
            circle: {
              ...current.circle,
              members: [
                ...current.circle.members,
                {
                  id:
                    action.targetId?.trim() ||
                    createId("circle-member"),
                  name,
                  role:
                    readString(
                      content.role,
                    ) || "Circle member",
                  relationship:
                    readString(
                      content.relationship,
                    ) ||
                    "Support relationship",
                },
              ],
            },
          }),
        );

      syncLegacyCircleState(nextState);
      return true;
    }

    case "circle.goal.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "a goal title",
        action.tool,
      );

      const nextState =
        updateSmilingMonadState(
          (current) => ({
            ...current,
            circle: {
              ...current.circle,
              goals: [
                ...current.circle.goals,
                {
                  id:
                    action.targetId?.trim() ||
                    createId("circle-goal"),
                  title,
                  owner:
                    readString(
                      content.owner,
                    ) || "Whole circle",
                  status:
                    readString(
                      content.status,
                    ) === "Active"
                      ? "Active"
                      : "Planning",
                },
              ],
            },
          }),
        );

      syncLegacyCircleState(nextState);
      return true;
    }

    case "circle.document.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "a document title",
        action.tool,
      );

      const categoryValue =
        readString(content.category);

      const category =
        categoryValue === "Agreement" ||
        categoryValue === "Report" ||
        categoryValue === "Meeting" ||
        categoryValue === "Other"
          ? categoryValue
          : "Plan";

      const nextState =
        updateSmilingMonadState(
          (current) => ({
            ...current,
            circle: {
              ...current.circle,
              documents: [
                ...current.circle.documents,
                {
                  id:
                    action.targetId?.trim() ||
                    createId(
                      "circle-document",
                    ),
                  title,
                  category,
                  status: "Draft",
                },
              ],
            },
          }),
        );

      syncLegacyCircleState(nextState);
      return true;
    }

    case "circle.meeting.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "a meeting title",
        action.tool,
      );

      const nextState =
        updateSmilingMonadState(
          (current) => ({
            ...current,
            circle: {
              ...current.circle,
              meetings: [
                ...current.circle.meetings,
                {
                  id:
                    action.targetId?.trim() ||
                    createId(
                      "circle-meeting",
                    ),
                  title,
                  date: readString(
                    content.date,
                  ),
                  purpose:
                    readString(
                      content.purpose,
                    ) ||
                    "Circle coordination",
                },
              ],
            },
          }),
        );

      syncLegacyCircleState(nextState);
      return true;
    }

    case "circle.responsibility.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "a responsibility title",
        action.tool,
      );

      const nextState =
        updateSmilingMonadState(
          (current) => ({
            ...current,
            circle: {
              ...current.circle,
              responsibilities: [
                ...current.circle
                  .responsibilities,
                {
                  id:
                    action.targetId?.trim() ||
                    createId(
                      "circle-responsibility",
                    ),
                  title,
                  owner:
                    readString(
                      content.owner,
                    ) || "Whole circle",
                  status: "Open",
                },
              ],
            },
          }),
        );

      syncLegacyCircleState(nextState);
      return true;
    }

    case "community.post.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "a post title",
        action.tool,
      );

      const body = requireValue(
        readString(content.body),
        "post details",
        action.tool,
      );

      const typeValue =
        readString(content.type);

      const type =
        typeValue === "event" ||
        typeValue === "opportunity" ||
        typeValue === "request"
          ? typeValue
          : "announcement";

      const requestedStatus =
        readString(content.status);

      const status =
        requestedStatus === "submitted"
          ? "submitted"
          : "draft";

      updateSmilingMonadState(
        (current) => {
          const timestamp =
            new Date().toISOString();

          return {
            ...current,
            communityPosts: [
              ...current.communityPosts,
              {
                id:
                  action.targetId?.trim() ||
                  createId(
                    "community-post",
                  ),
                title,
                body,
                type,
                status,
                author:
                  readString(
                    content.author,
                  ) || "Community member",
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
          };
        },
      );

      return true;
    }

    case "connections.profile.add": {
      const content =
        requireContentObject(action);

      const name = requireValue(
        readString(content.name) ||
          action.title?.trim() ||
          "",
        "a profile name",
        action.tool,
      );

      const summary = requireValue(
        readString(content.summary),
        "a profile summary",
        action.tool,
      );

      const profileTypeValue =
        readString(
          content.profileType,
        );

      const profileType =
        profileTypeValue ===
          "participant" ||
        profileTypeValue === "family" ||
        profileTypeValue ===
          "support-worker" ||
        profileTypeValue === "provider" ||
        profileTypeValue ===
          "professional"
          ? profileTypeValue
          : "community-member";

      const requestedStatus =
        readString(content.status);

      const status =
        requestedStatus === "submitted"
          ? "submitted"
          : "draft";

      updateSmilingMonadState(
        (current) => {
          const timestamp =
            new Date().toISOString();

          return {
            ...current,
            connectionProfiles: [
              ...current.connectionProfiles,
              {
                id:
                  action.targetId?.trim() ||
                  createId(
                    "connection-profile",
                  ),
                name,
                profileType,
                summary,
                location: readString(
                  content.location,
                ),
                interests:
                  readStringArray(
                    content.interests,
                  ),
                offers:
                  readStringArray(
                    content.offers,
                  ),
                lookingFor:
                  readStringArray(
                    content.lookingFor,
                  ),
                status,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
          };
        },
      );

      return true;
    }

    case "connections.work.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "an opportunity title",
        action.tool,
      );

      const description =
        requireValue(
          readString(
            content.description,
          ),
          "an opportunity description",
          action.tool,
        );

      const requestedStatus =
        readString(content.status);

      const status =
        requestedStatus === "submitted"
          ? "submitted"
          : "draft";

      updateSmilingMonadState(
        (current) => {
          const timestamp =
            new Date().toISOString();

          return {
            ...current,
            workOpportunities: [
              ...current.workOpportunities,
              {
                id:
                  action.targetId?.trim() ||
                  createId(
                    "work-opportunity",
                  ),
                title,
                description,
                location: readString(
                  content.location,
                ),
                contactName:
                  readString(
                    content.contactName,
                  ) || "Community member",
                status,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
          };
        },
      );

      return true;
    }

    case "school.lesson.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "a lesson title",
        action.tool,
      );

      const summary = requireValue(
        readString(content.summary),
        "a lesson summary",
        action.tool,
      );

      const areaValue =
        readString(content.area);

      const area =
        areaValue === "communication" ||
        areaValue === "behaviour" ||
        areaValue === "circles" ||
        areaValue === "development"
          ? areaValue
          : "support";

      const requestedStatus =
        readString(content.status);

      const status =
        requestedStatus === "review"
          ? "review"
          : "draft";

      updateSmilingMonadState(
        (current) => {
          const timestamp =
            new Date().toISOString();

          return {
            ...current,
            schoolLessons: [
              ...current.schoolLessons,
              {
                id:
                  action.targetId?.trim() ||
                  createId(
                    "school-lesson",
                  ),
                area,
                title,
                summary,
                content: readString(
                  content.content,
                ),
                status,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
          };
        },
      );

      return true;
    }

    case "shop.item.add": {
      const content =
        requireContentObject(action);

      const title = requireValue(
        action.title?.trim() ||
          readString(content.title),
        "an item title",
        action.tool,
      );

      const description =
        requireValue(
          readString(
            content.description,
          ),
          "an item description",
          action.tool,
        );

      const areaValue =
        readString(content.area);

      const area =
        areaValue === "templates" ||
        areaValue === "training" ||
        areaValue === "merchandise" ||
        areaValue === "digital"
          ? areaValue
          : "resources";

      const requestedStatus =
        readString(content.status);

      const status =
        requestedStatus === "review"
          ? "review"
          : "draft";

      updateSmilingMonadState(
        (current) => {
          const timestamp =
            new Date().toISOString();

          return {
            ...current,
            shopItems: [
              ...current.shopItems,
              {
                id:
                  action.targetId?.trim() ||
                  createId("shop-item"),
                area,
                title,
                description,
                priceInCents:
                  readNumberOrNull(
                    content.priceInCents,
                  ),
                status,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
          };
        },
      );

      return true;
    }

    default:
      return false;
  }
};

const executeAction = (
  state: CompanionState,
  action: CompanionToolAction,
): CompanionState => {
  const nextState = copyState(state);

  if (executePlatformAction(action)) {
    return nextState;
  }

  switch (action.tool) {
    case "desk.add": {
      const title =
        requireTitle(action);

      const objectId =
        action.targetId?.trim() ||
        createId("desk");

      let object =
        nextState.deskObjects.find(
          (item) =>
            item.id === objectId,
        );

      if (object) {
        object.title = title;
        object.kind =
          action.kind?.trim() ||
          object.kind;
        object.status = "active";
      } else {
        object = {
          id: objectId,
          title,
          kind:
            action.kind?.trim() ||
            "folder",
          status: "active",
          documentId: null,
        };

        nextState.deskObjects.push(
          object,
        );
      }

      const matchingDocument =
        findBestDocumentForDeskObject(
          nextState,
          object,
        );

      if (matchingDocument) {
        object.documentId =
          matchingDocument.id;

        nextState.activeDocumentId =
          matchingDocument.id;
      }

      nextState.activeDeskObjectId =
        objectId;

      return nextState;
    }

    case "desk.open": {
      const targetId =
        requireTargetId(action);

      const object =
        findDeskObject(
          nextState,
          targetId,
        );

      object.status = "active";

      nextState.activeDeskObjectId =
        targetId;

      if (object.documentId) {
        const linkedDocument =
          nextState.documents.find(
            (document) =>
              document.id ===
                object.documentId &&
              document.status !==
                "archived",
          );

        if (linkedDocument) {
          nextState.activeDocumentId =
            linkedDocument.id;
        }
      }

      return nextState;
    }

    case "desk.close": {
      const targetId =
        requireTargetId(action);

      findDeskObject(
        nextState,
        targetId,
      );

      if (
        nextState.activeDeskObjectId ===
        targetId
      ) {
        nextState.activeDeskObjectId =
          null;
      }

      return nextState;
    }

    case "desk.remove": {
      const targetId =
        requireTargetId(action);

      findDeskObject(
        nextState,
        targetId,
      );

      nextState.deskObjects =
        nextState.deskObjects.filter(
          (object) =>
            object.id !== targetId,
        );

      if (
        nextState.activeDeskObjectId ===
        targetId
      ) {
        nextState.activeDeskObjectId =
          null;
      }

      return nextState;
    }

    case "workspace.open": {
      nextState.workspaceOpen = true;
      return nextState;
    }

    case "workspace.close": {
      nextState.workspaceOpen = false;
      nextState.activeDeskObjectId =
        null;
      nextState.activeDocumentId =
        null;

      return nextState;
    }

    case "workspace.clear": {
      nextState.workspaceOpen = false;
      nextState.activeDeskObjectId =
        null;
      nextState.activeDocumentId =
        null;
      nextState.temporaryTasks = [];

      return nextState;
    }

    case "document.create": {
      const title =
        requireTitle(action);

      const documentId =
        action.targetId?.trim() ||
        createId("document");

      let document =
        nextState.documents.find(
          (item) =>
            item.id === documentId,
        );

      if (document) {
        document.title = title;
        document.content =
          action.content ??
          document.content;
        document.status = "draft";
      } else {
        document = {
          id: documentId,
          title,
          content:
            action.content ?? "",
          status: "draft",
        };

        nextState.documents.push(
          document,
        );
      }

      nextState.activeDocumentId =
        documentId;

      nextState.workspaceOpen = true;

      const matchingObject =
        findBestDeskObjectForDocument(
          nextState,
          document,
        );

      if (matchingObject) {
        linkDeskObjectToDocument(
          nextState,
          matchingObject.id,
          documentId,
        );

        nextState.activeDeskObjectId =
          matchingObject.id;
      }

      return nextState;
    }

    case "document.update": {
      const targetId =
        requireTargetId(action);

      const document =
        findDocument(
          nextState,
          targetId,
        );

      if (action.title?.trim()) {
        document.title =
          action.title.trim();
      }

      if (action.content !== null) {
        document.content =
          action.content;
      }

      document.status = "draft";

      nextState.activeDocumentId =
        targetId;

      nextState.workspaceOpen = true;

      const linkedObject =
        nextState.deskObjects.find(
          (object) =>
            object.documentId ===
            targetId,
        );

      if (linkedObject) {
        linkedObject.title =
          document.title;

        nextState.activeDeskObjectId =
          linkedObject.id;
      } else {
        const matchingObject =
          findBestDeskObjectForDocument(
            nextState,
            document,
          );

        if (matchingObject) {
          linkDeskObjectToDocument(
            nextState,
            matchingObject.id,
            targetId,
          );

          nextState.activeDeskObjectId =
            matchingObject.id;
        }
      }

      return nextState;
    }

    case "document.complete": {
      const targetId =
        requireTargetId(action);

      const document =
        findDocument(
          nextState,
          targetId,
        );

      document.status = "complete";

      nextState.activeDocumentId =
        targetId;

      const linkedObject =
        nextState.deskObjects.find(
          (object) =>
            object.documentId ===
            targetId,
        );

      if (linkedObject) {
        linkedObject.status =
          "complete";

        nextState.activeDeskObjectId =
          linkedObject.id;
      }

      return nextState;
    }

    case "document.archive": {
      const targetId =
        requireTargetId(action);

      const document =
        findDocument(
          nextState,
          targetId,
        );

      document.status = "archived";

      const linkedObjects =
        nextState.deskObjects.filter(
          (object) =>
            object.documentId ===
            targetId,
        );

      for (
        const linkedObject of
        linkedObjects
      ) {
        linkedObject.status =
          "archived";

        if (
          nextState.activeDeskObjectId ===
          linkedObject.id
        ) {
          nextState.activeDeskObjectId =
            null;
        }
      }

      if (
        nextState.activeDocumentId ===
        targetId
      ) {
        nextState.activeDocumentId =
          null;
      }

      return nextState;
    }

    case "task.create": {
      const title =
        requireTitle(action);

      const taskId =
        action.targetId?.trim() ||
        createId("task");

      const existingTask =
        nextState.temporaryTasks.find(
          (task) =>
            task.id === taskId,
        );

      if (existingTask) {
        existingTask.title = title;
        existingTask.status =
          "active";
      } else {
        nextState.temporaryTasks.push({
          id: taskId,
          title,
          status: "active",
        });
      }

      return nextState;
    }

    case "task.complete": {
      const targetId =
        requireTargetId(action);

      const task =
        findTask(
          nextState,
          targetId,
        );

      task.status = "complete";

      return nextState;
    }

    case "task.remove": {
      const targetId =
        requireTargetId(action);

      findTask(
        nextState,
        targetId,
      );

      nextState.temporaryTasks =
        nextState.temporaryTasks.filter(
          (task) =>
            task.id !== targetId,
        );

      return nextState;
    }

    case "none":
      return nextState;

    default: {
      throw new Error(
        `Unsupported Companion tool: ${action.tool}`,
      );
    }
  }
};

export const executeCompanionActions = (
  currentState: CompanionState,
  actions: CompanionToolAction[],
): ToolExecutionResult => {
  let nextState =
    copyState(currentState);

  const completedActions:
    CompanionToolAction[] = [];

  const failedActions: Array<{
    action: CompanionToolAction;
    error: string;
  }> = [];

  for (const action of actions) {
    try {
      nextState = executeAction(
        nextState,
        action,
      );

      completedActions.push(action);
    } catch (error) {
      failedActions.push({
        action,
        error:
          error instanceof Error
            ? error.message
            : "The action could not be completed.",
      });

      break;
    }
  }

  return {
    state: nextState,
    completedActions,
    failedActions,
  };
};