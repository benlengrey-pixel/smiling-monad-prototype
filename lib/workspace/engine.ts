import type {
  WorkspaceCard,
  WorkspaceState,
} from "./types";

export function createWorkspace(): WorkspaceState {
  return {
    cards: [],
  };
}

export function openCard(
  workspace: WorkspaceState,
  card: WorkspaceCard
): WorkspaceState {
  return {
    ...workspace,
    cards: [...workspace.cards, card],
  };
}

export function closeCard(
  workspace: WorkspaceState,
  cardId: string
): WorkspaceState {
  return {
    ...workspace,
    cards: workspace.cards.filter(
      (card) => card.id !== cardId
    ),
  };
}

export function updateCard(
  workspace: WorkspaceState,
  updatedCard: WorkspaceCard
): WorkspaceState {
  return {
    ...workspace,
    cards: workspace.cards.map((card) =>
      card.id === updatedCard.id
        ? updatedCard
        : card
    ),
  };
}

export function clearWorkspace(): WorkspaceState {
  return createWorkspace();
}