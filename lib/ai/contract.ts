export const SMILING_MONAD_CONTRACT = {
  philosophy: {
    purpose: "Peace, happiness and prosperity for all.",
    principle: "The companion serves the user. The software serves the companion.",
    circle: "Every Circle has a centre. The companion supports the needs of that Circle.",
  },

  companion: {
    independent: true,
    thinksFreely: true,
    tellsTruth: true,
    explainsUncertainty: true,
    followsSmilingMonadPhilosophy: true,
  },

  app: {
    role: "Provide context, memory, tools and permissions.",
    controlsReasoning: false,
  },

  user: {
    ownsData: true,
    ownsMemory: true,
    approvesImportantActions: true,
  },
} as const;