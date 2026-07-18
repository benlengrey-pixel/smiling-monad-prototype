export type TrainingProgramStatus =
  | "draft"
  | "review"
  | "active"
  | "retired";

export type TrainingModuleStatus =
  | "draft"
  | "review"
  | "active"
  | "retired";

export type TrainingMode =
  | "learning"
  | "practice"
  | "assessment"
  | "review";

export type LearningContentBlockType =
  | "text"
  | "heading"
  | "list"
  | "scenario"
  | "participant-perspective"
  | "reflection-prompt"
  | "source-reference"
  | "warning"
  | "example";

export type LearningContentBlock = {
  id: string;
  type: LearningContentBlockType;
  title?: string;
  content: string;
  items?: string[];
  sourceTitle?: string;
  sourceReference?: string;
};

export type LearningSection = {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  order: number;
  required: boolean;
  minimumEngagementSeconds: number;
  contentBlocks: LearningContentBlock[];
  completionPrompt: string;
};

export type AssessmentQuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "true-false"
  | "matching"
  | "short-answer"
  | "scenario"
  | "reflection"
  | "reviewer-question";

export type AssessmentQuestionOption = {
  id: string;
  label: string;
};

export type AssessmentQuestion = {
  id: string;
  moduleId: string;
  moduleVersion: string;
  type: AssessmentQuestionType;
  prompt: string;
  options?: AssessmentQuestionOption[];
  correctOptionIds?: string[];
  requiredElements?: string[];
  criticalFailureIndicators?: string[];
  explanation?: string;
  critical: boolean;
  available: boolean;
  randomisationGroup?: string;
  minimumResponseLength?: number;
  maximumResponseLength?: number;
  points: number;
};

export type ModulePassRules = {
  minimumKnowledgeScore: number;
  criticalQuestionsMustPass: boolean;
  reflectionRequired: boolean;
  scenarioAssessmentRequired: boolean;
  reviewerDecisionRequired: boolean;
  externalEvidenceRequired: boolean;
  maximumAttemptsBeforeReview: number;
  minimumReviewerQuestions: number;
};

export type RequiredExternalEvidence = {
  type: string;
  label: string;
  description: string;
  required: boolean;
};

export type TrainingModule = {
  id: string;
  code: string;
  title: string;
  version: string;
  status: TrainingModuleStatus;
  purpose: string;
  estimatedMinutes: number;
  learningOutcomes: string[];
  sections: LearningSection[];
  questionBank: AssessmentQuestion[];
  requiredEvidence: RequiredExternalEvidence[];
  passRules: ModulePassRules;
  sourceReferences: TrainingSourceReference[];
  createdAt: string;
  updatedAt: string;
};

export type TrainingProgram = {
  id: string;
  code: string;
  title: string;
  version: string;
  description: string;
  status: TrainingProgramStatus;
  moduleIds: string[];
  entryRequirements: string[];
  completionRequirements: string[];
  createdAt: string;
  updatedAt: string;
};

export type TrainingSourceReference = {
  id: string;
  title: string;
  authority: string;
  reference: string;
  accessedAt?: string;
};

export type SectionProgressStatus =
  | "not-started"
  | "in-progress"
  | "completed";

export type SectionProgress = {
  sectionId: string;
  status: SectionProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  engagementSeconds: number;
  completionResponse: string;
};

export type AssessmentAnswer = {
  questionId: string;
  questionVersion: string;
  response: string;
  selectedOptionIds: string[];
  startedAt: string;
  answeredAt: string;
  changedBeforeSubmission: boolean;
  aiAssistanceDeclared: boolean;
};

export type AssessmentAttemptStatus =
  | "active"
  | "submitted"
  | "human-review"
  | "passed"
  | "failed";

export type AIReviewDecision =
  | "no-concerns"
  | "human-review-required"
  | "critical-failure";

export type AIReviewResult = {
  decision: AIReviewDecision;
  summary: string;
  matchedRequiredElements: string[];
  missingRequiredElements: string[];
  detectedCriticalFailures: string[];
  integrityFlagIds: string[];
  reviewedAt: string;
  modelReference: string | null;
};

export type AssessmentAttempt = {
  id: string;
  workerApplicationId: string;
  moduleId: string;
  moduleVersion: string;
  attemptNumber: number;
  questionSetId: string;
  questionOrder: string[];
  startedAt: string;
  submittedAt: string | null;
  answers: AssessmentAnswer[];
  knowledgeScore: number | null;
  criticalQuestionsPassed: boolean;
  aiReview: AIReviewResult | null;
  status: AssessmentAttemptStatus;
};

export type IntegrityFlagType =
  | "answer-too-fast"
  | "copied-language-suspected"
  | "contradictory-responses"
  | "critical-safety-error"
  | "vague-reflection"
  | "unusual-answer-pattern"
  | "identity-check-required"
  | "human-review-required";

export type IntegrityFlagSeverity =
  | "low"
  | "medium"
  | "critical";

export type IntegrityFlagStatus =
  | "open"
  | "reviewed"
  | "resolved"
  | "confirmed";

export type IntegrityFlag = {
  id: string;
  workerApplicationId: string;
  moduleAttemptId: string;
  type: IntegrityFlagType;
  reason: string;
  evidenceReferences: string[];
  severity: IntegrityFlagSeverity;
  status: IntegrityFlagStatus;
  createdAt: string;
  resolvedAt: string | null;
  reviewerNote: string;
  reviewerId: string | null;
};

export type ReviewerDecisionType =
  | "satisfactory"
  | "further-learning-required"
  | "reassessment-required";

export type ReviewerDecision = {
  reviewerId: string;
  decision: ReviewerDecisionType;
  notes: string;
  decidedAt: string;
  moduleVersion: string;
  reviewerQuestionResponses: ReviewerQuestionResponse[];
};

export type ReviewerQuestionResponse = {
  questionId: string;
  question: string;
  learnerResponse: string;
  satisfactory: boolean;
  reviewerNote: string;
};

export type WorkerModuleAttemptStatus =
  | "not-started"
  | "learning"
  | "assessment"
  | "human-review"
  | "satisfactory"
  | "not-yet-satisfactory";

export type WorkerModuleAttempt = {
  id: string;
  workerApplicationId: string;
  moduleId: string;
  moduleVersion: string;
  status: WorkerModuleAttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  sectionProgress: SectionProgress[];
  assessmentAttempts: AssessmentAttempt[];
  integrityFlags: IntegrityFlag[];
  reviewerDecision: ReviewerDecision | null;
  learnerDeclarationAcceptedAt: string | null;
  externalEvidenceRecordIds: string[];
};

export type TrainingContext = {
  mode: TrainingMode;
  workerApplicationId: string;
  moduleId: string;
  moduleVersion: string;
  sectionId: string | null;
  activeQuestionId: string | null;
  allowedActions: TrainingToolName[];
};

export type TrainingToolName =
  | "training.application.start"
  | "training.section.open"
  | "training.section.complete"
  | "training.assessment.start"
  | "training.answer.record"
  | "training.assessment.submit"
  | "training.reflection.record"
  | "training.declaration.accept"
  | "training.integrity.flag"
  | "training.review.request";

export type TrainingToolAction = {
  tool: TrainingToolName;
  workerApplicationId: string;
  moduleId: string;
  targetId: string | null;
  content: string | null;
  reason: string;
};

export type TrainingAssessmentSelectionRules = {
  totalQuestions: number;
  minimumCriticalQuestions: number;
  requiredQuestionTypes: AssessmentQuestionType[];
  randomiseQuestionOrder: boolean;
  randomiseOptions: boolean;
};

export type TrainingAuditEventType =
  | "program-created"
  | "module-opened"
  | "section-opened"
  | "section-completed"
  | "assessment-started"
  | "answer-recorded"
  | "assessment-submitted"
  | "integrity-flag-created"
  | "review-requested"
  | "reviewer-decision-recorded"
  | "module-completed";

export type TrainingAuditEvent = {
  id: string;
  workerApplicationId: string;
  moduleId: string;
  attemptId: string | null;
  type: TrainingAuditEventType;
  actorType:
    | "learner"
    | "kimi"
    | "reviewer"
    | "system";
  actorId: string | null;
  detail: string;
  createdAt: string;
};

export type ModuleAssessmentSummary = {
  moduleId: string;
  moduleVersion: string;
  sectionCompletionPercentage: number;
  latestKnowledgeScore: number | null;
  criticalQuestionsPassed: boolean;
  unresolvedIntegrityFlags: number;
  reviewerDecision: ReviewerDecisionType | null;
  status: WorkerModuleAttemptStatus;
};

export type TrainingRecord = {
  workerApplicationId: string;
  programId: string;
  programVersion: string;
  enrolledAt: string;
  completedAt: string | null;
  moduleAttempts: WorkerModuleAttempt[];
  auditEvents: TrainingAuditEvent[];
};

export const TRAINING_REVIEWER_ONLY_ACTIONS = [
  "training.module.pass",
  "training.worker.approve",
  "training.badge.activate",
  "training.evidence.verify",
] as const;

export type TrainingReviewerOnlyAction =
  (typeof TRAINING_REVIEWER_ONLY_ACTIONS)[number];