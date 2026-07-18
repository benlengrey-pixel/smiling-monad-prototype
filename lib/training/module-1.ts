import type {
  AssessmentQuestion,
  LearningSection,
  TrainingModule,
  TrainingSourceReference,
} from "./types";

const MODULE_ID = "module-1-rights-and-worker-role";
const MODULE_VERSION = "1.0.0";

const sources: TrainingSourceReference[] = [
  {
    id: "source-ndis-code-of-conduct",
    title: "NDIS Code of Conduct",
    authority:
      "NDIS Quality and Safeguards Commission",
    reference:
      "https://www.ndiscommission.gov.au/rules-and-standards/ndis-code-conduct",
  },
  {
    id: "source-worker-orientation",
    title:
      "Worker Orientation Module: Quality, Safety and You",
    authority:
      "NDIS Quality and Safeguards Commission",
    reference:
      "https://www.ndiscommission.gov.au/workforce/online-training-modules",
  },
  {
    id: "source-workforce-capability",
    title:
      "NDIS Workforce Capability Framework",
    authority:
      "NDIS Quality and Safeguards Commission",
    reference:
      "https://www.ndiscommission.gov.au/workforce/workforce-capability-framework",
  },
];

const sections: LearningSection[] = [
  {
    id: "module-1-section-1",
    moduleId: MODULE_ID,
    title: "The person comes first",
    summary:
      "Understand why support begins with the person’s rights, identity, communication, relationships and goals.",
    order: 1,
    required: true,
    minimumEngagementSeconds: 420,
    completionPrompt:
      "In your own words, explain the difference between person-centred support and task-centred support.",
    contentBlocks: [
      {
        id: "m1-s1-heading-1",
        type: "heading",
        content:
          "Support begins with the person, not the service.",
      },
      {
        id: "m1-s1-text-1",
        type: "text",
        content:
          "A support worker is entering another person’s life. The worker’s roster, routines, preferences and assumptions must not become more important than the person’s rights, choices, communication, culture, relationships and goals.",
      },
      {
        id: "m1-s1-list-1",
        type: "list",
        content:
          "Person-centred support considers the whole person.",
        items: [
          "What matters to the person",
          "How the person communicates",
          "Important relationships",
          "Culture, identity and beliefs",
          "Routines and preferences",
          "Strengths, interests and goals",
          "What helps the person feel safe",
          "What the person wants from support",
        ],
      },
      {
        id: "m1-s1-scenario-1",
        type: "scenario",
        title: "Scenario",
        content:
          "A worker has planned a shopping trip because it is written on the weekly roster. The participant clearly indicates that they want to stay home and listen to music. The worker feels the shift will look unproductive if the shopping trip does not happen.",
      },
      {
        id: "m1-s1-perspective-1",
        type: "participant-perspective",
        content:
          "A good worker does not treat my life as a list of jobs to complete. They notice what matters to me and help me make choices about my own day.",
      },
      {
        id: "m1-s1-warning-1",
        type: "warning",
        content:
          "Efficiency does not justify overriding a person’s preferences, communication or consent.",
      },
    ],
  },
  {
    id: "module-1-section-2",
    moduleId: MODULE_ID,
    title: "The NDIS and the Commission",
    summary:
      "Understand the role of the NDIS, the NDIS Commission and the Code of Conduct.",
    order: 2,
    required: true,
    minimumEngagementSeconds: 360,
    completionPrompt:
      "Describe one responsibility of the NDIS Commission and one responsibility of an individual support worker.",
    contentBlocks: [
      {
        id: "m1-s2-text-1",
        type: "text",
        content:
          "The NDIS funds reasonable and necessary supports for eligible people with disability. The NDIS Quality and Safeguards Commission regulates quality and safeguards and promotes the rights of people receiving NDIS supports.",
      },
      {
        id: "m1-s2-text-2",
        type: "text",
        content:
          "The NDIS Code of Conduct applies to workers and providers delivering NDIS supports, including workers engaged by registered and unregistered providers.",
      },
      {
        id: "m1-s2-list-1",
        type: "list",
        content:
          "Workers must understand that they remain personally responsible for their conduct.",
        items: [
          "Following a manager’s instruction does not excuse unsafe or unlawful conduct",
          "Workers must act when they identify quality or safety concerns",
          "Workers must only perform tasks they are competent and authorised to perform",
          "Workers must respect privacy, dignity and individual rights",
        ],
      },
      {
        id: "m1-s2-source-1",
        type: "source-reference",
        title: "Required external learning",
        content:
          "The official Worker Orientation Module: Quality, Safety and You must be completed and its certificate recorded as part of the worker application.",
        sourceTitle:
          "Worker Orientation Module: Quality, Safety and You",
        sourceReference:
          "https://www.ndiscommission.gov.au/workforce/online-training-modules",
      },
    ],
  },
  {
    id: "module-1-section-3",
    moduleId: MODULE_ID,
    title: "The NDIS Code of Conduct",
    summary:
      "Apply the Code of Conduct to everyday support work.",
    order: 3,
    required: true,
    minimumEngagementSeconds: 600,
    completionPrompt:
      "Choose two Code of Conduct responsibilities and explain what each looks like during an ordinary support shift.",
    contentBlocks: [
      {
        id: "m1-s3-text-1",
        type: "text",
        content:
          "The Code of Conduct is not only for serious incidents. It guides everyday decisions, communication, boundaries, documentation and the way workers respond when something is wrong.",
      },
      {
        id: "m1-s3-list-1",
        type: "list",
        content:
          "A worker must act consistently with the Code of Conduct.",
        items: [
          "Respect individual rights to freedom of expression, self-determination and decision-making",
          "Respect privacy",
          "Provide supports safely and competently, with care and skill",
          "Act with integrity, honesty and transparency",
          "Promptly raise and act on concerns affecting quality and safety",
          "Take reasonable steps to prevent and respond to violence, exploitation, neglect and abuse",
          "Take reasonable steps to prevent and respond to sexual misconduct",
        ],
      },
      {
        id: "m1-s3-example-1",
        type: "example",
        title: "Everyday example",
        content:
          "A worker notices that another worker repeatedly speaks about a participant in a humiliating way. Respecting rights and acting on concerns means the worker does not ignore it simply because no physical injury occurred.",
      },
      {
        id: "m1-s3-warning-1",
        type: "warning",
        content:
          "A worker must not conceal unsafe conduct to protect a colleague, manager or provider.",
      },
    ],
  },
  {
    id: "module-1-section-4",
    moduleId: MODULE_ID,
    title: "Choice, control and dignity of risk",
    summary:
      "Support informed decisions without coercion, manipulation or unnecessary restriction.",
    order: 4,
    required: true,
    minimumEngagementSeconds: 600,
    completionPrompt:
      "Explain how a worker can support a choice they personally disagree with while still responding to genuine safety concerns.",
    contentBlocks: [
      {
        id: "m1-s4-text-1",
        type: "text",
        content:
          "People with disability have the right to make choices about their own lives. A worker’s role is to provide accessible information, support communication and help the person understand relevant consequences without pressuring them toward the worker’s preferred decision.",
      },
      {
        id: "m1-s4-list-1",
        type: "list",
        content:
          "Supported decision-making may include:",
        items: [
          "Using the person’s preferred communication method",
          "Presenting information in smaller steps",
          "Allowing enough time",
          "Offering genuine options",
          "Checking understanding without testing or intimidating",
          "Respecting a refusal",
          "Recognising that consent can be withdrawn",
        ],
      },
      {
        id: "m1-s4-scenario-1",
        type: "scenario",
        title: "Scenario",
        content:
          "A participant says they do not want assistance with showering today. Their usual routine includes a morning shower. There is no immediate medical emergency.",
      },
      {
        id: "m1-s4-warning-1",
        type: "warning",
        content:
          "Routines, family preferences and staff convenience do not automatically override a person’s refusal.",
      },
      {
        id: "m1-s4-perspective-1",
        type: "participant-perspective",
        content:
          "Supporting me does not mean making every decision for me. It means helping me understand, communicate and remain in control of my own life.",
      },
    ],
  },
  {
    id: "module-1-section-5",
    moduleId: MODULE_ID,
    title: "The limits of the worker role",
    summary:
      "Recognise when to act, when to seek guidance and when to stop.",
    order: 5,
    required: true,
    minimumEngagementSeconds: 480,
    completionPrompt:
      "Describe a task you should stop or decline if you have not received the required training, delegation or participant-specific instruction.",
    contentBlocks: [
      {
        id: "m1-s5-text-1",
        type: "text",
        content:
          "Good intentions do not replace competence. Workers must understand the limits of their role, qualifications, training, delegated responsibilities and participant-specific knowledge.",
      },
      {
        id: "m1-s5-list-1",
        type: "list",
        content:
          "A worker should stop and seek guidance when:",
        items: [
          "The task is outside their competence",
          "Required training or delegation has not occurred",
          "The support plan is unclear or unavailable",
          "The person is communicating distress or refusal",
          "The situation has changed significantly",
          "The worker is too fatigued, unwell or distressed to work safely",
          "The requested action may be unlawful, restrictive or unsafe",
        ],
      },
      {
        id: "m1-s5-example-1",
        type: "example",
        title: "Scope example",
        content:
          "A worker who has not been trained and assessed for a participant’s complex medication procedure must not proceed merely because another worker says it is easy.",
      },
      {
        id: "m1-s5-warning-1",
        type: "warning",
        content:
          "Following instructions is not a defence when a worker knows, or should reasonably know, that an action is unsafe.",
      },
    ],
  },
  {
    id: "module-1-section-6",
    moduleId: MODULE_ID,
    title: "Speaking up and acting on concerns",
    summary:
      "Respond appropriately when safety, quality, abuse, neglect or dishonest conduct is suspected.",
    order: 6,
    required: true,
    minimumEngagementSeconds: 540,
    completionPrompt:
      "Explain what you would do if a senior worker asked you not to record a serious concern.",
    contentBlocks: [
      {
        id: "m1-s6-text-1",
        type: "text",
        content:
          "Workers must act when they identify concerns affecting the quality or safety of supports. Silence may allow harm to continue.",
      },
      {
        id: "m1-s6-list-1",
        type: "list",
        content:
          "A safe response may involve:",
        items: [
          "Protecting immediate safety",
          "Listening calmly to the person",
          "Recording facts accurately",
          "Following incident and escalation procedures",
          "Using another reporting pathway if a manager obstructs reporting",
          "Preserving evidence",
          "Avoiding retaliation, gossip or unnecessary disclosure",
        ],
      },
      {
        id: "m1-s6-scenario-1",
        type: "scenario",
        title: "Scenario",
        content:
          "A senior worker tells you not to write down a concerning incident because it could make the team look bad.",
      },
      {
        id: "m1-s6-warning-1",
        type: "warning",
        content:
          "Never falsify, conceal or deliberately omit information to protect a worker, manager or organisation.",
      },
    ],
  },
];

const questionBank: AssessmentQuestion[] = [
  {
    id: "m1-q-001",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "multiple-choice",
    prompt:
      "Which statement best describes person-centred support?",
    options: [
      {
        id: "a",
        label:
          "Completing every rostered task as efficiently as possible",
      },
      {
        id: "b",
        label:
          "Following the worker’s judgement whenever they believe it is safer",
      },
      {
        id: "c",
        label:
          "Supporting the person’s rights, communication, preferences and goals",
      },
      {
        id: "d",
        label:
          "Doing whatever a family member requests",
      },
    ],
    correctOptionIds: ["c"],
    critical: false,
    available: true,
    randomisationGroup: "person-centred",
    points: 1,
  },
  {
    id: "m1-q-002",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "true-false",
    prompt:
      "A worker may ignore a participant’s refusal when the activity is listed in the usual routine.",
    options: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    correctOptionIds: ["false"],
    critical: true,
    criticalFailureIndicators: [
      "The routine automatically overrides consent",
      "The worker may use force, punishment or pressure",
    ],
    available: true,
    randomisationGroup: "consent",
    points: 1,
  },
  {
    id: "m1-q-003",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "multiple-choice",
    prompt:
      "A worker is asked to perform a participant-specific health task they have not been trained or assessed to perform. What should they do?",
    options: [
      {
        id: "a",
        label:
          "Proceed carefully because refusing may inconvenience the provider",
      },
      {
        id: "b",
        label:
          "Ask another untrained worker to supervise",
      },
      {
        id: "c",
        label:
          "Stop, explain the limitation and seek appropriate guidance or trained assistance",
      },
      {
        id: "d",
        label:
          "Search online and perform the task using general instructions",
      },
    ],
    correctOptionIds: ["c"],
    critical: true,
    available: true,
    randomisationGroup: "scope",
    points: 1,
  },
  {
    id: "m1-q-004",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "multiple-select",
    prompt:
      "Which actions support informed decision-making? Select all that apply.",
    options: [
      {
        id: "a",
        label:
          "Use the person’s preferred communication method",
      },
      {
        id: "b",
        label:
          "Withhold an activity until the person agrees",
      },
      {
        id: "c",
        label:
          "Allow time for the person to consider options",
      },
      {
        id: "d",
        label:
          "Present genuine options and relevant information",
      },
      {
        id: "e",
        label:
          "Keep repeating the worker’s preferred option until the person accepts",
      },
    ],
    correctOptionIds: ["a", "c", "d"],
    critical: false,
    available: true,
    randomisationGroup: "supported-decisions",
    points: 3,
  },
  {
    id: "m1-q-005",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "short-answer",
    prompt:
      "Explain why a worker remains responsible for their conduct even when following a manager’s instruction.",
    requiredElements: [
      "Workers have personal obligations under the Code of Conduct",
      "Unsafe or unlawful conduct must not be followed",
      "Concerns must be raised or escalated",
    ],
    minimumResponseLength: 80,
    critical: false,
    available: true,
    randomisationGroup: "accountability",
    points: 3,
  },
  {
    id: "m1-q-006",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "scenario",
    prompt:
      "A participant says they do not want assistance with showering today. The routine says showering occurs every morning. There is no immediate medical emergency. Explain what you would do.",
    requiredElements: [
      "Respect the refusal",
      "Check understanding using accessible communication",
      "Explore preferred alternatives without pressure",
      "Avoid force, threats, punishment or coercion",
      "Record relevant information",
      "Escalate only where a genuine health or safety concern requires it",
    ],
    criticalFailureIndicators: [
      "Force the participant to shower",
      "Use threats or punishment",
      "State that the routine overrides refusal",
      "Ask others to pressure the participant",
    ],
    minimumResponseLength: 150,
    critical: true,
    available: true,
    randomisationGroup: "consent-scenario",
    points: 6,
  },
  {
    id: "m1-q-007",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "scenario",
    prompt:
      "Jordan communicates mainly through gestures, facial expression and a communication board. During an outing, Jordan pushes the board away and points toward the car. Another worker says to ignore it because Jordan often changes their mind. Explain your response.",
    requiredElements: [
      "Recognise the behaviour as possible communication",
      "Check Jordan’s immediate wellbeing",
      "Use Jordan’s known communication methods",
      "Avoid assuming one fixed meaning",
      "Respect a possible request to leave",
      "Record observations factually",
    ],
    criticalFailureIndicators: [
      "Ignore non-verbal communication",
      "Treat speech as the only valid communication",
      "Use coercion to continue the outing",
    ],
    minimumResponseLength: 180,
    critical: true,
    available: true,
    randomisationGroup: "communication-scenario",
    points: 6,
  },
  {
    id: "m1-q-008",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "scenario",
    prompt:
      "A senior worker asks you not to record a concerning incident because it may make the team look bad. Explain what you would do.",
    requiredElements: [
      "Protect immediate safety",
      "Record facts accurately",
      "Follow incident and escalation procedures",
      "Use another reporting pathway if reporting is obstructed",
      "Do not conceal or alter evidence",
    ],
    criticalFailureIndicators: [
      "Agree not to record the incident",
      "Delete or alter information",
      "Prioritise the team’s reputation over safety",
    ],
    minimumResponseLength: 150,
    critical: true,
    available: true,
    randomisationGroup: "speaking-up",
    points: 6,
  },
  {
    id: "m1-q-009",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "short-answer",
    prompt:
      "Rewrite this statement so it demonstrates supported decision-making: “I knew the participant would regret saying no, so I convinced them to agree.”",
    requiredElements: [
      "Neutral information",
      "Accessible communication",
      "Time to decide",
      "No pressure",
      "Respect for refusal",
    ],
    minimumResponseLength: 100,
    critical: false,
    available: true,
    randomisationGroup: "decision-support",
    points: 5,
  },
  {
    id: "m1-q-010",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "reflection",
    prompt:
      "Describe a situation where a worker’s desire to help could unintentionally reduce a person’s choice or control. Explain how you would respond differently.",
    requiredElements: [
      "Specific example",
      "Recognition of power imbalance",
      "Possible harm or loss of control",
      "Practical change in worker behaviour",
    ],
    minimumResponseLength: 150,
    critical: false,
    available: true,
    randomisationGroup: "reflection",
    points: 5,
  },
  {
    id: "m1-rq-001",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "reviewer-question",
    prompt:
      "Tell me about a lawful choice a participant might make that you personally disagree with. How would you support them?",
    requiredElements: [
      "Respect for autonomy",
      "Accessible information",
      "No coercion",
      "Appropriate response to genuine risk",
    ],
    critical: false,
    available: true,
    randomisationGroup: "reviewer",
    points: 0,
  },
  {
    id: "m1-rq-002",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "reviewer-question",
    prompt:
      "What would you do if a family instruction conflicted with a participant’s clearly expressed preference?",
    requiredElements: [
      "Keep the participant at the centre",
      "Clarify authority and consent",
      "Communicate respectfully",
      "Escalate unresolved risk or conflict appropriately",
    ],
    critical: false,
    available: true,
    randomisationGroup: "reviewer",
    points: 0,
  },
  {
    id: "m1-rq-003",
    moduleId: MODULE_ID,
    moduleVersion: MODULE_VERSION,
    type: "reviewer-question",
    prompt:
      "How might you recognise that consent has been withdrawn by a person who does not use speech?",
    requiredElements: [
      "Individual communication methods",
      "Behaviour, gesture, facial expression or withdrawal",
      "Pause and check",
      "Do not continue through uncertainty",
    ],
    critical: false,
    available: true,
    randomisationGroup: "reviewer",
    points: 0,
  },
];

export const moduleOneRightsAndWorkerRole: TrainingModule =
  {
    id: MODULE_ID,
    code: "SM-FND-001",
    title:
      "Rights, Responsibilities and the NDIS Worker Role",
    version: MODULE_VERSION,
    status: "draft",
    purpose:
      "Establish the rights-based, ethical and person-centred foundation required for safe NDIS support work.",
    estimatedMinutes: 180,
    learningOutcomes: [
      "Explain the purpose of the NDIS and the role of the NDIS Quality and Safeguards Commission",
      "Identify and apply the NDIS Code of Conduct",
      "Explain choice, control, consent, supported decision-making and dignity of risk",
      "Recognise the difference between supporting a decision and making a decision for someone",
      "Identify the limits of the worker role, competence and authority",
      "Recognise when and how to raise quality and safety concerns",
      "Respond appropriately to suspected abuse, neglect, exploitation, unsafe conduct or concealment",
      "Explain why the person remains at the centre of all support",
    ],
    sections,
    questionBank,
    requiredEvidence: [
      {
        type: "worker-orientation-module",
        label:
          "NDIS Worker Orientation Module certificate",
        description:
          "Evidence of completion of the official Worker Orientation Module: Quality, Safety and You.",
        required: true,
      },
    ],
    passRules: {
      minimumKnowledgeScore: 80,
      criticalQuestionsMustPass: true,
      reflectionRequired: true,
      scenarioAssessmentRequired: true,
      reviewerDecisionRequired: true,
      externalEvidenceRequired: true,
      maximumAttemptsBeforeReview: 2,
      minimumReviewerQuestions: 2,
    },
    sourceReferences: sources,
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
  };

export const moduleOneAssessmentSelection = {
  totalQuestions: 8,
  minimumCriticalQuestions: 4,
  requiredQuestionTypes: [
    "multiple-choice",
    "short-answer",
    "scenario",
    "reflection",
  ],
  randomiseQuestionOrder: true,
  randomiseOptions: true,
} as const;

export function getModuleOneQuestion(
  questionId: string,
): AssessmentQuestion | null {
  return (
    moduleOneRightsAndWorkerRole.questionBank.find(
      (question) =>
        question.id === questionId,
    ) ?? null
  );
}

export function getModuleOneSection(
  sectionId: string,
): LearningSection | null {
  return (
    moduleOneRightsAndWorkerRole.sections.find(
      (section) =>
        section.id === sectionId,
    ) ?? null
  );
}