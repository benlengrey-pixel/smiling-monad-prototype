export type DeskObjectStatus = "active" | "complete" | "archived";

export type WorkspaceDocumentStatus =
  | "draft"
  | "complete"
  | "archived";

export type TemporaryTaskStatus = "active" | "complete";

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

export const createEmptyCompanionState = (): CompanionState => ({
  deskObjects: [],
  documents: [],
  temporaryTasks: [],
  activeDeskObjectId: null,
  activeDocumentId: null,
  workspaceOpen: false,
});

const createId = (prefix: string): string => {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const copyState = (state: CompanionState): CompanionState => ({
  deskObjects: state.deskObjects.map((object) => ({
    ...object,
  })),
  documents: state.documents.map((document) => ({
    ...document,
  })),
  temporaryTasks: state.temporaryTasks.map((task) => ({
    ...task,
  })),
  activeDeskObjectId: state.activeDeskObjectId,
  activeDocumentId: state.activeDocumentId,
  workspaceOpen: state.workspaceOpen,
});

const requireTargetId = (
  action: CompanionToolAction,
): string => {
  const targetId = action.targetId?.trim();

  if (!targetId) {
    throw new Error(`${action.tool} requires a targetId.`);
  }

  return targetId;
};

const requireTitle = (
  action: CompanionToolAction,
): string => {
  const title = action.title?.trim();

  if (!title) {
    throw new Error(`${action.tool} requires a title.`);
  }

  return title;
};

const findDeskObject = (
  state: CompanionState,
  targetId: string,
): DeskObject => {
  const object = state.deskObjects.find(
    (item) => item.id === targetId,
  );

  if (!object) {
    throw new Error(`Desk object "${targetId}" was not found.`);
  }

  return object;
};

const findDocument = (
  state: CompanionState,
  targetId: string,
): WorkspaceDocument => {
  const document = state.documents.find(
    (item) => item.id === targetId,
  );

  if (!document) {
    throw new Error(`Document "${targetId}" was not found.`);
  }

  return document;
};

const findTask = (
  state: CompanionState,
  targetId: string,
): TemporaryTask => {
  const task = state.temporaryTasks.find(
    (item) => item.id === targetId,
  );

  if (!task) {
    throw new Error(`Task "${targetId}" was not found.`);
  }

  return task;
};

const executeAction = (
  state: CompanionState,
  action: CompanionToolAction,
): CompanionState => {
  const nextState = copyState(state);

  switch (action.tool) {
    case "desk.add": {
      const title = requireTitle(action);
      const objectId =
        action.targetId?.trim() || createId("desk");

      const existingObject = nextState.deskObjects.find(
        (object) => object.id === objectId,
      );

      if (existingObject) {
        existingObject.title = title;
        existingObject.kind =
          action.kind?.trim() || existingObject.kind;
        existingObject.status = "active";
      } else {
        nextState.deskObjects.push({
          id: objectId,
          title,
          kind: action.kind?.trim() || "folder",
          status: "active",
          documentId: null,
        });
      }

      return nextState;
    }

    case "desk.open": {
      const targetId = requireTargetId(action);
      const object = findDeskObject(nextState, targetId);

      object.status = "active";
      nextState.activeDeskObjectId = targetId;

      if (object.documentId) {
        nextState.activeDocumentId = object.documentId;
      }

      return nextState;
    }

    case "desk.close": {
      const targetId = requireTargetId(action);

      findDeskObject(nextState, targetId);

      if (nextState.activeDeskObjectId === targetId) {
        nextState.activeDeskObjectId = null;
      }

      return nextState;
    }

    case "desk.remove": {
      const targetId = requireTargetId(action);

      findDeskObject(nextState, targetId);

      nextState.deskObjects =
        nextState.deskObjects.filter(
          (object) => object.id !== targetId,
        );

      if (nextState.activeDeskObjectId === targetId) {
        nextState.activeDeskObjectId = null;
      }

      return nextState;
    }

    case "workspace.open": {
      nextState.workspaceOpen = true;
      return nextState;
    }

    case "workspace.close": {
      nextState.workspaceOpen = false;
      nextState.activeDeskObjectId = null;
      nextState.activeDocumentId = null;
      return nextState;
    }

    case "workspace.clear": {
      nextState.workspaceOpen = false;
      nextState.activeDeskObjectId = null;
      nextState.activeDocumentId = null;
      nextState.temporaryTasks = [];
      return nextState;
    }

    case "document.create": {
      const title = requireTitle(action);
      const documentId =
        action.targetId?.trim() || createId("document");

      const existingDocument = nextState.documents.find(
        (document) => document.id === documentId,
      );

      if (existingDocument) {
        existingDocument.title = title;
        existingDocument.content =
          action.content ?? existingDocument.content;
        existingDocument.status = "draft";
      } else {
        nextState.documents.push({
          id: documentId,
          title,
          content: action.content ?? "",
          status: "draft",
        });
      }

      nextState.activeDocumentId = documentId;
      nextState.workspaceOpen = true;

      return nextState;
    }

    case "document.update": {
      const targetId = requireTargetId(action);
      const document = findDocument(
        nextState,
        targetId,
      );

      if (action.title?.trim()) {
        document.title = action.title.trim();
      }

      if (action.content !== null) {
        document.content = action.content;
      }

      document.status = "draft";
      nextState.activeDocumentId = targetId;
      nextState.workspaceOpen = true;

      return nextState;
    }

    case "document.complete": {
      const targetId = requireTargetId(action);
      const document = findDocument(
        nextState,
        targetId,
      );

      document.status = "complete";
      nextState.activeDocumentId = targetId;

      return nextState;
    }

    case "document.archive": {
      const targetId = requireTargetId(action);
      const document = findDocument(
        nextState,
        targetId,
      );

      document.status = "archived";

      if (nextState.activeDocumentId === targetId) {
        nextState.activeDocumentId = null;
      }

      return nextState;
    }

    case "task.create": {
      const title = requireTitle(action);
      const taskId =
        action.targetId?.trim() || createId("task");

      const existingTask = nextState.temporaryTasks.find(
        (task) => task.id === taskId,
      );

      if (existingTask) {
        existingTask.title = title;
        existingTask.status = "active";
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
      const targetId = requireTargetId(action);
      const task = findTask(nextState, targetId);

      task.status = "complete";
      return nextState;
    }

    case "task.remove": {
      const targetId = requireTargetId(action);

      findTask(nextState, targetId);

      nextState.temporaryTasks =
        nextState.temporaryTasks.filter(
          (task) => task.id !== targetId,
        );

      return nextState;
    }

    case "none":
      return nextState;

    default: {
      const unsupportedTool: never = action.tool;

      throw new Error(
        `Unsupported Companion tool: ${unsupportedTool}`,
      );
    }
  }
};

export const executeCompanionActions = (
  currentState: CompanionState,
  actions: CompanionToolAction[],
): ToolExecutionResult => {
  let nextState = copyState(currentState);

  const completedActions: CompanionToolAction[] = [];
  const failedActions: Array<{
    action: CompanionToolAction;
    error: string;
  }> = [];

  for (const action of actions) {
    try {
      nextState = executeAction(nextState, action);
      completedActions.push(action);
    } catch (error) {
      failedActions.push({
        action,
        error:
          error instanceof Error
            ? error.message
            : "The action could not be completed.",
      });
    }
  }

  return {
    state: nextState,
    completedActions,
    failedActions,
  };
};