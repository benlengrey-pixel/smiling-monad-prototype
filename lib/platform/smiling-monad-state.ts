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

export type TrainingLessonArea =
  | "support"
  | "communication"
  | "behaviour"
  | "circles"
  | "development";

export type TrainingContentBlockType =
  | "introduction"
  | "lesson"
  | "example"
  | "scenario"
  | "reflection"
  | "summary";

export type TrainingContentBlock = {
  id: string;
  type: TrainingContentBlockType;
  title: string;
  body: string;
  order: number;
};

export type TrainingScenario = {
  id: string;
  title: string;
  situation: string;
  question: string;
  guidance: string;
};

export type TrainingKnowledgeCheckOption = {
  id: string;
  label: string;
};

export type TrainingKnowledgeCheckQuestion = {
  id: string;
  question: string;
  options: TrainingKnowledgeCheckOption[];
  correctOptionId: string;
  explanation: string;
};

export type SchoolLesson = {
  id: string;
  area: TrainingLessonArea;
  title: string;
  summary: string;

  /**
   * Legacy plain-text lesson content.
   * Kept so existing lessons and the current Training Centre continue working.
   */
  content: string;

  learningOutcomes?: string[];
  contentBlocks?: TrainingContentBlock[];
  scenarios?: TrainingScenario[];
  reflectionPrompt?: string;
  knowledgeCheck?: TrainingKnowledgeCheckQuestion[];
  passMark?: number;
  estimatedMinutes?: number;
  completionStatement?: string;
  participantSpecific?: boolean;
  participantReference?: string | null;

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

export type CircleBudgetCategory =
  | "Core"
  | "Capacity Building"
  | "Capital"
  | "Other";

export type CircleBudgetStatus =
  | "Active"
  | "Review needed"
  | "Closed";

export type CircleBudgetItem = {
  id: string;
  title: string;
  category: CircleBudgetCategory;
  allocated: number;
  spent: number;
  owner: string;
  status: CircleBudgetStatus;
};

export type CircleCentreState = {
  profile: CircleProfile;
  members: CircleMember[];
  goals: CircleGoal[];
  documents: CircleDocument[];
  meetings: CircleMeeting[];
  responsibilities: CircleResponsibility[];
  budgets: CircleBudgetItem[];
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

function normaliseSchoolLesson(
  value: unknown,
): SchoolLesson | null {
  if (!isRecord(value)) {
    return null;
  }

  const area = value.area;

  if (
    area !== "support" &&
    area !== "communication" &&
    area !== "behaviour" &&
    area !== "circles" &&
    area !== "development"
  ) {
    return null;
  }

  const timestamp = now();

  return {
    id:
      typeof value.id === "string"
        ? value.id
        : createId("school-lesson"),
    area,
    title:
      typeof value.title === "string"
        ? value.title
        : "",
    summary:
      typeof value.summary === "string"
        ? value.summary
        : "",
    content:
      typeof value.content === "string"
        ? value.content
        : "",
    learningOutcomes: Array.isArray(
      value.learningOutcomes,
    )
      ? value.learningOutcomes.filter(
          (item): item is string =>
            typeof item === "string",
        )
      : [],
    contentBlocks: Array.isArray(
      value.contentBlocks,
    )
      ? (value.contentBlocks as TrainingContentBlock[])
      : [],
    scenarios: Array.isArray(value.scenarios)
      ? (value.scenarios as TrainingScenario[])
      : [],
    reflectionPrompt:
      typeof value.reflectionPrompt === "string"
        ? value.reflectionPrompt
        : "",
    knowledgeCheck: Array.isArray(
      value.knowledgeCheck,
    )
      ? (value.knowledgeCheck as TrainingKnowledgeCheckQuestion[])
      : [],
    passMark:
      typeof value.passMark === "number"
        ? value.passMark
        : 80,
    estimatedMinutes:
      typeof value.estimatedMinutes === "number"
        ? value.estimatedMinutes
        : 15,
    completionStatement:
      typeof value.completionStatement === "string"
        ? value.completionStatement
        : "",
    participantSpecific:
      typeof value.participantSpecific === "boolean"
        ? value.participantSpecific
        : false,
    participantReference:
      typeof value.participantReference === "string"
        ? value.participantReference
        : null,
    status:
      value.status === "draft" ||
      value.status === "review" ||
      value.status === "published" ||
      value.status === "archived"
        ? value.status
        : "draft",
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : timestamp,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : timestamp,
  };
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
    budgets: [],
  };
}

function createDefaultSchoolLessons(): SchoolLesson[] {
  const timestamp = now();

  return [
    {
      id: "smiling-monad-way",
      area: "support",
      title: "The Smiling Monad Way",
      summary:
        "An introduction to the Smiling Monad approach: seeing the whole person, beginning with relationship, and supporting people with calm, respect and curiosity.",
      content:
        "The Smiling Monad Way begins with a simple idea: every person is more than a diagnosis, behaviour, task or support need. Good support starts by recognising the whole person and understanding what matters to them.\n\nSupport should not begin with control. It should begin with relationship, listening and curiosity. Workers are encouraged to slow down, notice what the person may be communicating and consider what helps them feel safe, understood and included.\n\nThe aim is not to make people fit into systems. The aim is to make systems more human, flexible and responsive to the person. This means supporting choice, respecting communication in all its forms and working with families and circles of support rather than around them.\n\nThe Smiling Monad Way also asks workers to reflect on themselves. Calm support requires self-awareness. Before responding to another person, pause and notice your own assumptions, emotions and urgency. A thoughtful response is usually more helpful than a fast reaction.",
      learningOutcomes: [
        "Explain the central purpose of the Smiling Monad approach.",
        "Recognise the difference between person-led support and task-led support.",
        "Identify why relationship, communication and curiosity matter.",
        "Describe how worker self-awareness affects the quality of support.",
      ],
      contentBlocks: [
        {
          id: "smiling-monad-way-introduction",
          type: "introduction",
          title: "Start with the whole person",
          body:
            "A person is never only their diagnosis, behaviour, roster, funding or support plan. The starting point is the human being.",
          order: 1,
        },
        {
          id: "smiling-monad-way-relationship",
          type: "lesson",
          title: "Relationship before control",
          body:
            "Good support begins by building safety, trust and understanding. Control may create short-term compliance, but relationship creates lasting cooperation.",
          order: 2,
        },
        {
          id: "smiling-monad-way-curiosity",
          type: "lesson",
          title: "Stay curious",
          body:
            "When something is difficult, ask what the person may be communicating and what need, fear, confusion or unmet expectation may be underneath the situation.",
          order: 3,
        },
        {
          id: "smiling-monad-way-reflection",
          type: "reflection",
          title: "Notice yourself",
          body:
            "Workers bring their own stress, assumptions and habits into every interaction. Pausing before responding helps create safer and more respectful support.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "smiling-monad-way-scenario",
          title: "A change in routine",
          situation:
            "A participant becomes distressed when the planned activity changes unexpectedly. A worker says the person needs to calm down and follow the new plan.",
          question:
            "How could the worker respond using the Smiling Monad Way?",
          guidance:
            "A better response would begin by acknowledging the change, recognising the person's communication, explaining what happened clearly and offering meaningful choices about what happens next.",
        },
      ],
      reflectionPrompt:
        "Think of a time when someone was described mainly by their behaviour or support needs. What changed when you considered the whole person instead?",
      knowledgeCheck: [
        {
          id: "smiling-monad-way-question-1",
          question:
            "What is the best starting point for support under the Smiling Monad Way?",
          options: [
            {
              id: "1",
              label:
                "Complete the scheduled task as quickly as possible.",
            },
            {
              id: "2",
              label:
                "Understand the whole person and what matters to them.",
            },
            {
              id: "3",
              label:
                "Make sure the person follows the same system as everyone else.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "The Smiling Monad Way begins with the whole person, their communication, relationships, preferences and what matters to them.",
        },
        {
          id: "smiling-monad-way-question-2",
          question:
            "Why is worker self-awareness important?",
          options: [
            {
              id: "1",
              label:
                "Because the worker's stress and assumptions can affect how they respond.",
            },
            {
              id: "2",
              label:
                "Because workers should avoid asking for help.",
            },
            {
              id: "3",
              label:
                "Because reflection replaces the need for communication.",
            },
          ],
          correctOptionId: "1",
          explanation:
            "A worker's own emotions, urgency and assumptions can shape an interaction. Pausing and reflecting supports calmer decisions.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can explain the Smiling Monad approach and apply whole-person, relationship-led thinking to everyday support situations.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "whole-person-support",
      area: "support",
      title: "Understanding the Whole Person",
      summary:
        "Learn how to see beyond diagnosis, behaviour and support tasks so that support reflects the person's identity, relationships, communication, strengths and daily life.",
      content:
        "Whole-person support means understanding that a person is made up of many connected parts. Their health, emotions, communication, relationships, culture, routines, interests, history, environment and sense of identity all influence how they experience support.\n\nA diagnosis can provide useful information, but it never tells the whole story. Two people with the same diagnosis may communicate differently, enjoy different things, respond differently to change and need very different kinds of support.\n\nWorkers should learn what matters to the person, what helps them feel safe, what causes confusion or stress, how they express choice and what a good day looks like for them. This knowledge should come from the person wherever possible, together with trusted family members, supporters and professionals when appropriate.\n\nWhole-person support also notices strengths. A person may be creative, funny, determined, observant, caring, adventurous or deeply connected to particular places, people or routines. Good support builds from these strengths rather than focusing only on difficulties.",
      learningOutcomes: [
        "Describe what whole-person support means.",
        "Explain why diagnosis alone is not enough to guide support.",
        "Identify the areas of a person's life that may affect their wellbeing and communication.",
        "Recognise and build from the person's strengths, preferences and relationships.",
      ],
      contentBlocks: [
        {
          id: "whole-person-support-identity",
          type: "introduction",
          title: "A person is more than a diagnosis",
          body:
            "Diagnostic information may help workers understand some needs, but it must never replace learning who the person is as an individual.",
          order: 1,
        },
        {
          id: "whole-person-support-connected-life",
          type: "lesson",
          title: "Everything is connected",
          body:
            "Health, sleep, relationships, environment, communication, routines and emotions can all affect how a person feels and responds. Support should consider these connections.",
          order: 2,
        },
        {
          id: "whole-person-support-what-matters",
          type: "lesson",
          title: "Learn what matters",
          body:
            "Workers should understand what the person enjoys, values, avoids, hopes for and needs in order to feel safe and included.",
          order: 3,
        },
        {
          id: "whole-person-support-strengths",
          type: "lesson",
          title: "Build from strengths",
          body:
            "Good support identifies abilities, interests, relationships and personal qualities, then uses them to create confidence, participation and meaningful choice.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "whole-person-support-scenario",
          title: "The unfinished activity",
          situation:
            "A participant refuses to leave a park at the scheduled time. The shift plan says the next activity must begin immediately, and the worker describes the person as non-compliant.",
          question:
            "What whole-person information should the worker consider before responding?",
          guidance:
            "The worker should consider whether the person understood the transition, whether the activity was important to them, whether they need warning or visual support, whether they are tired or overwhelmed, and what choices could help them finish safely.",
        },
      ],
      reflectionPrompt:
        "Choose one person you have supported. What strengths, relationships, interests or routines were easy to overlook when attention was focused mainly on their needs?",
      knowledgeCheck: [
        {
          id: "whole-person-support-question-1",
          question:
            "Which statement best describes whole-person support?",
          options: [
            {
              id: "1",
              label:
                "Support is based mainly on the person's diagnosis.",
            },
            {
              id: "2",
              label:
                "Support considers identity, communication, relationships, strengths, health and environment together.",
            },
            {
              id: "3",
              label:
                "Support focuses only on completing the rostered tasks.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "Whole-person support considers the connected parts of a person's life rather than reducing them to one diagnosis, behaviour or task.",
        },
        {
          id: "whole-person-support-question-2",
          question:
            "Why should workers learn about a person's strengths?",
          options: [
            {
              id: "1",
              label:
                "Strengths can support confidence, choice and meaningful participation.",
            },
            {
              id: "2",
              label:
                "Strengths remove the need to understand support needs.",
            },
            {
              id: "3",
              label:
                "Strengths are only relevant during formal assessments.",
            },
          ],
          correctOptionId: "1",
          explanation:
            "Strengths provide a practical foundation for engagement, learning, confidence and better support.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can describe whole-person support and identify the connected information needed to understand and support an individual well.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "communication-beyond-speech",
      area: "communication",
      title: "Communication Beyond Speech",
      summary:
        "Learn to recognise communication in behaviour, movement, facial expression, routine, objects, visuals, sounds and other non-spoken forms.",
      content:
        "Communication is much broader than spoken language. People communicate through facial expression, movement, behaviour, body tension, eye gaze, sounds, gestures, routines, objects, visuals, written words, technology and changes in their usual patterns.\n\nA person who does not use speech is still communicating. The worker's role is to notice, interpret carefully and check meaning rather than making quick assumptions. The same action may mean different things in different situations, so context matters.\n\nReliable communication support should be consistent. If a person uses visual schedules, objects of reference, gestures, communication devices or familiar phrases, these supports should be available and understood by the whole team. Removing or changing them without careful planning can create confusion and distress.\n\nWorkers should also allow enough processing time. Repeating instructions too quickly, adding too many words or demanding an immediate response can make communication harder. Clear language, calm pacing and genuine attention often improve understanding.",
      learningOutcomes: [
        "Identify common forms of communication beyond speech.",
        "Explain why behaviour may carry communicative meaning.",
        "Describe how context and consistency affect interpretation.",
        "Use simple strategies that make communication clearer and safer.",
      ],
      contentBlocks: [
        {
          id: "communication-beyond-speech-many-forms",
          type: "introduction",
          title: "Communication has many forms",
          body:
            "Speech is only one way people communicate. Movement, expression, sound, objects, visuals, routines and behaviour may all carry meaning.",
          order: 1,
        },
        {
          id: "communication-beyond-speech-context",
          type: "lesson",
          title: "Context changes meaning",
          body:
            "The same behaviour can mean different things depending on the person, place, timing, health, environment and what happened beforehand.",
          order: 2,
        },
        {
          id: "communication-beyond-speech-consistency",
          type: "lesson",
          title: "Keep communication supports consistent",
          body:
            "Visuals, devices, gestures and familiar routines work best when the whole team understands and uses them consistently.",
          order: 3,
        },
        {
          id: "communication-beyond-speech-processing",
          type: "lesson",
          title: "Allow processing time",
          body:
            "Use clear language, pause, reduce unnecessary words and give the person enough time to understand and respond.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "communication-beyond-speech-scenario",
          title: "The repeated movement",
          situation:
            "A participant repeatedly walks to the front door and taps the handle. A worker redirects them back to the lounge each time without asking what the action may mean.",
          question:
            "How should the worker approach this communication?",
          guidance:
            "The worker should consider the context, check whether the person wants to leave, is expecting someone, needs an activity, is anxious about a transition or is using the door as a familiar communication cue. The worker should respond with clear choices or familiar communication supports.",
        },
      ],
      reflectionPrompt:
        "Think of a person whose communication was easy to misunderstand. What signs, patterns or context helped you understand them better?",
      knowledgeCheck: [
        {
          id: "communication-beyond-speech-question-1",
          question:
            "Which statement is most accurate?",
          options: [
            {
              id: "1",
              label:
                "A person is communicating only when they use words.",
            },
            {
              id: "2",
              label:
                "Behaviour, movement, expression, visuals and sounds may all communicate meaning.",
            },
            {
              id: "3",
              label:
                "Non-spoken communication should be ignored unless a professional is present.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "Communication can occur through many spoken and non-spoken forms, and workers should pay attention to the person's individual patterns.",
        },
        {
          id: "communication-beyond-speech-question-2",
          question:
            "What is a helpful response when a person needs more time to process information?",
          options: [
            {
              id: "1",
              label:
                "Repeat the instruction immediately and more loudly.",
            },
            {
              id: "2",
              label:
                "Use more words so every detail is included.",
            },
            {
              id: "3",
              label:
                "Use clear language, pause and allow time for a response.",
            },
          ],
          correctOptionId: "3",
          explanation:
            "Clear language and adequate processing time reduce pressure and support understanding.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can recognise communication beyond speech and use consistent, respectful strategies to support understanding.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "behaviour-as-communication",
      area: "behaviour",
      title: "Behaviour as Communication",
      summary:
        "Learn to look beneath behaviour, identify possible unmet needs and respond with calm, curiosity and practical support rather than punishment or control.",
      content:
        "Behaviour is often a form of communication, especially when a person cannot easily explain what they need, what hurts, what has changed or what feels unsafe.\n\nA behaviour may communicate pain, fear, confusion, sensory overload, frustration, boredom, loss of control, difficulty with transition, unmet expectations or a need for connection. The behaviour itself is important, but the meaning underneath it is what guides better support.\n\nWorkers should avoid labels such as difficult, manipulative or attention-seeking. These labels can stop curiosity and lead to responses that increase distress. A better approach is to ask what happened before, what the person may be experiencing, what changed in the environment and what support could reduce the pressure.\n\nGood support is proactive. It uses clear communication, predictable routines, meaningful choice, sensory support, trusted relationships and early recognition of stress. The aim is not to eliminate behaviour at any cost. The aim is to understand the message, reduce harm and help the person feel safer and more in control.",
      learningOutcomes: [
        "Explain how behaviour may communicate an unmet need or internal experience.",
        "Identify common factors that may contribute to distress or escalation.",
        "Recognise why judgemental labels can lead to poor support.",
        "Describe proactive strategies that reduce pressure and support safety.",
      ],
      contentBlocks: [
        {
          id: "behaviour-as-communication-message",
          type: "introduction",
          title: "Look for the message",
          body:
            "Behaviour may be the clearest way a person can show that something is wrong, confusing, painful, overwhelming or important.",
          order: 1,
        },
        {
          id: "behaviour-as-communication-context",
          type: "lesson",
          title: "Notice what happened before",
          body:
            "Consider changes in routine, communication, health, environment, expectations, relationships and sensory conditions before the behaviour occurred.",
          order: 2,
        },
        {
          id: "behaviour-as-communication-labels",
          type: "lesson",
          title: "Replace labels with curiosity",
          body:
            "Words such as difficult or manipulative can hide the person's actual need. Describe what happened clearly and remain curious about meaning.",
          order: 3,
        },
        {
          id: "behaviour-as-communication-proactive",
          type: "lesson",
          title: "Support before escalation",
          body:
            "Predictability, clear communication, meaningful choice, familiar people and early responses to stress can prevent situations from becoming unsafe.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "behaviour-as-communication-scenario",
          title: "The cancelled outing",
          situation:
            "A planned outing is cancelled without warning. The participant begins yelling, hitting the wall and pushing items from a table. A worker says the behaviour must stop before anything can be discussed.",
          question:
            "How could the worker respond using a behaviour-as-communication approach?",
          guidance:
            "The worker should recognise that the sudden change may have caused confusion, disappointment or loss of control. They should reduce demands, use familiar communication supports, acknowledge the change, offer safe alternatives and give the person time to regulate.",
        },
      ],
      reflectionPrompt:
        "Think of a behaviour you once viewed mainly as a problem. What possible need, fear, confusion or communication may have been underneath it?",
      knowledgeCheck: [
        {
          id: "behaviour-as-communication-question-1",
          question:
            "What is the most helpful first question when behaviour becomes difficult?",
          options: [
            {
              id: "1",
              label:
                "How can I make the person comply immediately?",
            },
            {
              id: "2",
              label:
                "What may the person be communicating or experiencing?",
            },
            {
              id: "3",
              label:
                "Who should be blamed for the behaviour?",
            },
          ],
          correctOptionId: "2",
          explanation:
            "A behaviour-as-communication approach begins by considering the person's experience, context and possible unmet need.",
        },
        {
          id: "behaviour-as-communication-question-2",
          question:
            "Which response is proactive?",
          options: [
            {
              id: "1",
              label:
                "Wait until the person is highly distressed before changing anything.",
            },
            {
              id: "2",
              label:
                "Use clear communication, predictable routines and early support when stress appears.",
            },
            {
              id: "3",
              label:
                "Remove all choices so the situation is easier to control.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "Proactive support reduces pressure early through communication, predictability, choice and recognition of stress.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can look beneath behaviour, identify likely contributing factors and choose calm, proactive responses that support safety and understanding.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "choice-consent-decisions",
      area: "support",
      title: "Choice, Consent and Supported Decision-Making",
      summary:
        "Learn how to support real choice, recognise consent in different forms and help people make decisions without taking control away from them.",
      content:
        "Choice and consent are central to respectful support. A person should be involved in decisions about their own life, including daily routines, activities, relationships, personal care, health, communication and goals.\n\nSupported decision-making means helping a person understand options, express preferences and make choices in ways that work for them. This may involve simple language, visual information, extra time, trusted supporters, familiar objects, demonstrations or breaking a decision into smaller parts.\n\nConsent must be genuine, informed and ongoing. Agreement once does not mean agreement forever. A person may change their mind, withdraw, hesitate or communicate discomfort through words, movement, expression or behaviour. Workers must pay attention to these signs.\n\nSupport workers should not replace a person's decision merely because another option seems faster, easier or more practical. Where there are safety concerns, the worker should explain them clearly, reduce avoidable risk and look for the least restrictive way to respect the person's choice.",
      learningOutcomes: [
        "Explain the difference between making a decision for someone and supporting them to decide.",
        "Recognise that consent can be communicated in spoken and non-spoken ways.",
        "Describe practical strategies for making choices easier to understand.",
        "Identify when consent may be uncertain, withdrawn or no longer present.",
      ],
      contentBlocks: [
        {
          id: "choice-consent-decisions-right-to-choose",
          type: "introduction",
          title: "The right to be involved",
          body:
            "People should be involved in decisions about their own lives, even when they need communication, cognitive or practical support.",
          order: 1,
        },
        {
          id: "choice-consent-decisions-support",
          type: "lesson",
          title: "Support the decision",
          body:
            "Use accessible information, familiar communication and enough time so the person can understand options and express a preference.",
          order: 2,
        },
        {
          id: "choice-consent-decisions-ongoing",
          type: "lesson",
          title: "Consent is ongoing",
          body:
            "Consent should be checked throughout an activity or interaction. A person can pause, refuse or change their mind.",
          order: 3,
        },
        {
          id: "choice-consent-decisions-risk",
          type: "lesson",
          title: "Balance choice and safety",
          body:
            "Explain risks clearly and reduce them where possible without automatically removing the person's control or using unnecessary restrictions.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "choice-consent-decisions-scenario",
          title: "The planned appointment",
          situation:
            "A participant is scheduled to attend an appointment. When it is time to leave, they move away from the door, avoid eye contact and push the appointment folder aside. The worker says the appointment is already booked and they have no choice.",
          question:
            "How should the worker respond?",
          guidance:
            "The worker should recognise the person's behaviour as possible refusal or uncertainty, check understanding, explain the appointment using accessible communication, offer time and choices, and explore whether the appointment can be delayed, changed or supported differently.",
        },
      ],
      reflectionPrompt:
        "Think of a time when convenience or routine influenced a decision made for someone. How could the person have been more meaningfully involved?",
      knowledgeCheck: [
        {
          id: "choice-consent-decisions-question-1",
          question:
            "What is supported decision-making?",
          options: [
            {
              id: "1",
              label:
                "Choosing the safest option for the person without involving them.",
            },
            {
              id: "2",
              label:
                "Helping the person understand options and express their own choice.",
            },
            {
              id: "3",
              label:
                "Asking a family member to make every decision.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "Supported decision-making helps the person understand, consider and communicate their own decision.",
        },
        {
          id: "choice-consent-decisions-question-2",
          question:
            "Which statement about consent is correct?",
          options: [
            {
              id: "1",
              label:
                "Consent is permanent once it has been given.",
            },
            {
              id: "2",
              label:
                "Consent only counts when it is spoken.",
            },
            {
              id: "3",
              label:
                "Consent is ongoing and may be withdrawn in spoken or non-spoken ways.",
            },
          ],
          correctOptionId: "3",
          explanation:
            "Consent must remain present throughout an interaction and can be communicated or withdrawn in many ways.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can support accessible decision-making, recognise consent and withdrawal, and respond in ways that preserve choice while addressing safety.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "professional-boundaries",
      area: "support",
      title: "Professional Boundaries",
      summary:
        "Learn how clear, respectful boundaries protect participants, workers and relationships while still allowing support to feel warm, human and genuine.",
      content:
        "Professional boundaries are the limits that keep support safe, respectful and focused on the person. Boundaries do not mean being cold or distant. They help workers build trustworthy relationships without confusing roles or creating dependence.\n\nWorkers should be clear about what is and is not part of their role. This includes time, communication, money, gifts, transport, social media, personal information, physical contact and contact outside rostered support.\n\nBoundary problems often begin gradually. A worker may start answering messages at all hours, lending money, sharing very personal information or taking on responsibilities that belong to family, professionals or the participant themselves. Even when intentions are kind, unclear boundaries can create pressure, favouritism, conflict or risk.\n\nGood boundaries are explained calmly and consistently. Workers should seek guidance when unsure, record concerns, avoid secrecy and use supervision rather than trying to manage complex situations alone.",
      learningOutcomes: [
        "Explain why professional boundaries matter in support relationships.",
        "Recognise common situations where boundaries may become unclear.",
        "Describe how to respond warmly without taking on an inappropriate role.",
        "Identify when to seek supervision, document concerns or ask for guidance.",
      ],
      contentBlocks: [
        {
          id: "professional-boundaries-purpose",
          type: "introduction",
          title: "Boundaries protect relationships",
          body:
            "Clear boundaries help support remain safe, fair, reliable and focused on the participant.",
          order: 1,
        },
        {
          id: "professional-boundaries-common-areas",
          type: "lesson",
          title: "Know the common pressure points",
          body:
            "Money, gifts, private contact, social media, personal disclosure, physical contact and support outside rostered hours can all create boundary concerns.",
          order: 2,
        },
        {
          id: "professional-boundaries-warmth",
          type: "lesson",
          title: "Warm does not mean unlimited",
          body:
            "A worker can be caring, genuine and flexible while still keeping their role clear and sustainable.",
          order: 3,
        },
        {
          id: "professional-boundaries-guidance",
          type: "lesson",
          title: "Do not manage uncertainty alone",
          body:
            "Seek supervision, document concerns and ask for guidance when a situation feels unclear, secretive or emotionally pressured.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "professional-boundaries-scenario",
          title: "Late-night messages",
          situation:
            "A participant begins messaging a worker late at night for emotional support. The worker responds every time because they do not want the participant to feel rejected.",
          question:
            "How can the worker respond with care while keeping a professional boundary?",
          guidance:
            "The worker should acknowledge the person's need, explain when they are available, direct urgent concerns to the agreed support or emergency pathway, discuss the pattern with the team and document the issue. The response should be kind and consistent rather than secretive or unlimited.",
        },
      ],
      reflectionPrompt:
        "Think of a situation where being helpful could have led to taking on too much responsibility. What boundary would protect both the person and the worker?",
      knowledgeCheck: [
        {
          id: "professional-boundaries-question-1",
          question:
            "Which statement best describes a professional boundary?",
          options: [
            {
              id: "1",
              label:
                "A rule that prevents workers from being caring.",
            },
            {
              id: "2",
              label:
                "A clear limit that keeps support safe, fair and focused on the person.",
            },
            {
              id: "3",
              label:
                "A private agreement between one worker and one participant.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "Professional boundaries support safe and trustworthy relationships without removing warmth or humanity.",
        },
        {
          id: "professional-boundaries-question-2",
          question:
            "What should a worker do when a boundary situation feels unclear?",
          options: [
            {
              id: "1",
              label:
                "Keep it secret and decide alone.",
            },
            {
              id: "2",
              label:
                "Ignore it unless something serious happens.",
            },
            {
              id: "3",
              label:
                "Seek guidance, document the concern and use supervision.",
            },
          ],
          correctOptionId: "3",
          explanation:
            "Unclear situations should be discussed openly through supervision and appropriate documentation.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can recognise common boundary risks and respond in a way that protects the participant, the worker and the support relationship.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "documentation",
      area: "support",
      title: "Reliable Shift Notes and Documentation",
      summary:
        "Learn how to write clear, factual and useful shift notes that protect the participant, support continuity and help the whole team understand what happened.",
      content:
        "Good documentation is part of good support. Shift notes should help the next worker, family member, coordinator or professional understand what happened, what the person communicated, what support was provided and whether follow-up is needed.\n\nReliable notes are factual, specific and respectful. They describe observable events rather than making assumptions about motives. For example, write what the person said or did, what happened before, how the worker responded and what changed afterwards.\n\nAvoid vague phrases such as good day, bad behaviour or non-compliant. These labels do not explain what actually happened. Clear notes should include relevant times, activities, communication, health concerns, incidents, changes in routine, medication-related observations and any actions taken.\n\nDocumentation should protect privacy. Only include information relevant to support, use respectful language and follow the organisation's secure record-keeping process. Serious incidents, injuries, restrictive practices, safeguarding concerns or significant changes should be escalated through the correct reporting pathway rather than left only in routine shift notes.",
      learningOutcomes: [
        "Explain why accurate shift notes matter for continuity and safety.",
        "Distinguish factual observation from opinion or judgement.",
        "Identify the essential information to include in a useful shift note.",
        "Recognise when an issue requires escalation beyond routine documentation.",
      ],
      contentBlocks: [
        {
          id: "documentation-purpose",
          type: "introduction",
          title: "Write for the next person",
          body:
            "A useful shift note helps the next person understand what happened, what mattered and what may need follow-up.",
          order: 1,
        },
        {
          id: "documentation-factual",
          type: "lesson",
          title: "Describe, do not label",
          body:
            "Record what you observed, what was communicated, what support was provided and what happened afterwards. Avoid judgemental or vague language.",
          order: 2,
        },
        {
          id: "documentation-essential",
          type: "lesson",
          title: "Include the essential details",
          body:
            "Relevant times, activities, communication, health observations, changes, incidents and actions taken should be recorded clearly.",
          order: 3,
        },
        {
          id: "documentation-escalation",
          type: "lesson",
          title: "Know when notes are not enough",
          body:
            "Serious incidents, injuries, restrictive practices, abuse concerns and major changes must be reported through the correct escalation process.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "documentation-scenario",
          title: "The vague shift note",
          situation:
            "A worker writes: 'John had a bad afternoon and was aggressive. Eventually he settled.' No other details are recorded.",
          question:
            "What important information is missing?",
          guidance:
            "The note should describe what happened before the distress, the person's observable actions or communication, relevant times, any environmental or health factors, how the worker responded, whether anyone was injured, what helped and what follow-up is required.",
        },
      ],
      reflectionPrompt:
        "Think of a shift note you have written or read that was too vague to be useful. What specific facts would have made it clearer?",
      knowledgeCheck: [
        {
          id: "documentation-question-1",
          question:
            "Which sentence is the most factual?",
          options: [
            {
              id: "1",
              label:
                "The participant was manipulative and attention-seeking.",
            },
            {
              id: "2",
              label:
                "At 2:15 pm, the participant pushed the activity book away, said 'no' and moved to the quiet room.",
            },
            {
              id: "3",
              label:
                "The participant had a terrible attitude all afternoon.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "The second statement describes observable actions, words and time without adding judgement.",
        },
        {
          id: "documentation-question-2",
          question:
            "When should an issue be escalated beyond routine shift notes?",
          options: [
            {
              id: "1",
              label:
                "When there is a serious incident, injury, safeguarding concern or restrictive practice.",
            },
            {
              id: "2",
              label:
                "Only when another worker asks about it.",
            },
            {
              id: "3",
              label:
                "Never, because shift notes are always enough.",
            },
          ],
          correctOptionId: "1",
          explanation:
            "Serious or reportable matters require the correct escalation pathway in addition to documentation.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can write factual, respectful and useful shift notes and recognise when an issue requires formal escalation.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "families-and-circles",
      area: "circles",
      title: "Working with Families and Circles of Support",
      summary:
        "Learn how to communicate clearly, respect different roles and contribute constructively within families, teams and Circles of Support.",
      content:
        "Good support rarely happens in isolation. Participants may rely on family members, friends, workers, providers, therapists, coordinators and community members who each hold different knowledge and responsibilities.\n\nA Circle of Support works best when the person remains at the centre. Team members should understand their role, communicate respectfully and share information that is relevant, accurate and authorised.\n\nFamilies often hold long-term knowledge about the person's history, communication, health, routines and relationships. Workers should value this knowledge while also respecting the participant's current preferences, privacy and right to make decisions.\n\nDifferences of opinion are normal. The aim is not to avoid disagreement, but to keep discussion focused on the person's wellbeing, goals and rights. Workers should avoid gossip, side conversations and taking sides. Concerns should be raised through the right process, with clear examples and a willingness to listen.\n\nReliable teamwork also means following agreed communication systems, attending useful meetings, completing actions and reporting changes that others need to know.",
      learningOutcomes: [
        "Explain why the participant must remain at the centre of team decisions.",
        "Recognise the different knowledge and responsibilities within a Circle of Support.",
        "Describe respectful ways to communicate with families and team members.",
        "Identify how to respond when disagreements or concerns arise.",
      ],
      contentBlocks: [
        {
          id: "families-and-circles-centre",
          type: "introduction",
          title: "Keep the person at the centre",
          body:
            "Teamwork should support the person's rights, communication, goals and preferences rather than becoming focused on organisational convenience or conflict between adults.",
          order: 1,
        },
        {
          id: "families-and-circles-knowledge",
          type: "lesson",
          title: "Value different knowledge",
          body:
            "Families, workers and professionals may each understand different parts of the person's life. Good teamwork brings this knowledge together respectfully.",
          order: 2,
        },
        {
          id: "families-and-circles-communication",
          type: "lesson",
          title: "Communicate clearly and appropriately",
          body:
            "Share relevant information through agreed channels, protect privacy, avoid gossip and make sure important changes reach the people who need to know.",
          order: 3,
        },
        {
          id: "families-and-circles-disagreement",
          type: "lesson",
          title: "Handle disagreement constructively",
          body:
            "Use specific examples, listen to different views and return the discussion to the person's wellbeing, rights and goals.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "families-and-circles-scenario",
          title: "Conflicting instructions",
          situation:
            "A family member asks a worker to follow one routine, while a provider manager gives different instructions. The participant appears confused and distressed by the inconsistency.",
          question:
            "What should the worker do?",
          guidance:
            "The worker should avoid choosing sides or improvising privately. They should follow immediate safety requirements, document the inconsistency, raise it through the agreed team process and support the Circle to establish one clear, participant-centred approach.",
        },
      ],
      reflectionPrompt:
        "Think of a time when poor team communication affected a participant. What information, role clarity or agreed process would have improved the situation?",
      knowledgeCheck: [
        {
          id: "families-and-circles-question-1",
          question:
            "What should guide decisions within a Circle of Support?",
          options: [
            {
              id: "1",
              label:
                "The preferences of the most senior professional.",
            },
            {
              id: "2",
              label:
                "The participant's rights, communication, goals and wellbeing.",
            },
            {
              id: "3",
              label:
                "Whichever option is easiest for the organisation.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "The participant should remain at the centre of decisions, with the team contributing relevant knowledge and support.",
        },
        {
          id: "families-and-circles-question-2",
          question:
            "What is the best response to conflicting team instructions?",
          options: [
            {
              id: "1",
              label:
                "Choose one person to agree with and ignore the others.",
            },
            {
              id: "2",
              label:
                "Keep the disagreement private and create your own approach.",
            },
            {
              id: "3",
              label:
                "Document the issue and raise it through the agreed team process so one clear approach can be established.",
            },
          ],
          correctOptionId: "3",
          explanation:
            "Conflicting instructions should be resolved transparently through the Circle or agreed management process.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can work respectfully with families and Circles of Support, communicate clearly and respond constructively to role confusion or disagreement.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "safety-and-escalation",
      area: "support",
      title: "Safety, Escalation and Reporting Concerns",
      summary:
        "Learn how to recognise risk, respond calmly, protect the person and report concerns through the correct pathway without delay.",
      content:
        "Safety is a shared responsibility. Workers need to notice changes, respond to immediate risk and know when a concern must be escalated.\n\nConcerns may include injury, illness, neglect, abuse, exploitation, unsafe environments, medication issues, restrictive practices, missing information, unexplained changes in behaviour or a breakdown in agreed support.\n\nThe first priority is immediate safety. Stay calm, reduce further harm, follow emergency procedures when required and seek medical or specialist help when necessary.\n\nAfter the immediate situation is stabilised, the worker should record clear facts and report the concern through the correct organisational and legal pathway. Serious matters must not be left only in shift notes or informal messages.\n\nWorkers should never investigate serious allegations themselves, promise secrecy or delay reporting because they are unsure. When uncertain, seek guidance promptly. Reporting a concern is not an accusation. It is a step to make sure the situation is assessed properly and the person is protected.",
      learningOutcomes: [
        "Recognise common safety, safeguarding and escalation concerns.",
        "Describe the immediate steps to reduce harm and protect the person.",
        "Explain the difference between routine documentation and formal reporting.",
        "Identify when to seek urgent help, supervision or external escalation.",
      ],
      contentBlocks: [
        {
          id: "safety-and-escalation-recognise",
          type: "introduction",
          title: "Recognise the concern",
          body:
            "Injuries, sudden changes, abuse concerns, restrictive practices, medication issues and unsafe environments may all require escalation.",
          order: 1,
        },
        {
          id: "safety-and-escalation-immediate",
          type: "lesson",
          title: "Protect immediate safety",
          body:
            "Stay calm, reduce further harm, follow emergency procedures and seek medical or specialist help when needed.",
          order: 2,
        },
        {
          id: "safety-and-escalation-report",
          type: "lesson",
          title: "Report through the correct pathway",
          body:
            "Record facts clearly and use the required incident, safeguarding or organisational reporting process. Serious concerns should not remain only in routine notes.",
          order: 3,
        },
        {
          id: "safety-and-escalation-uncertainty",
          type: "lesson",
          title: "Escalate uncertainty",
          body:
            "Do not investigate serious allegations yourself or promise secrecy. Seek guidance promptly when you are unsure.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "safety-and-escalation-scenario",
          title: "The unexplained injury",
          situation:
            "A worker notices a large bruise on a participant's upper arm. The participant appears anxious and cannot explain what happened. Another worker says it is probably nothing and suggests waiting until the next team meeting.",
          question:
            "What should the worker do?",
          guidance:
            "The worker should check immediate safety and health needs, document the injury factually, follow the incident and safeguarding reporting process, notify the appropriate supervisor and avoid making assumptions or conducting their own investigation.",
        },
      ],
      reflectionPrompt:
        "Think of a situation where a concern could easily have been minimised or delayed. What would help you recognise and escalate it sooner?",
      knowledgeCheck: [
        {
          id: "safety-and-escalation-question-1",
          question:
            "What is the first priority when a serious concern arises?",
          options: [
            {
              id: "1",
              label:
                "Finish the shift notes before taking any action.",
            },
            {
              id: "2",
              label:
                "Protect immediate safety and reduce further harm.",
            },
            {
              id: "3",
              label:
                "Ask other workers whether they agree something happened.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "Immediate safety comes first. Documentation and reporting follow once urgent risks are addressed.",
        },
        {
          id: "safety-and-escalation-question-2",
          question:
            "What should a worker do when unsure whether a concern is serious enough to report?",
          options: [
            {
              id: "1",
              label:
                "Wait until there is more evidence.",
            },
            {
              id: "2",
              label:
                "Investigate the matter privately.",
            },
            {
              id: "3",
              label:
                "Seek guidance promptly and follow the reporting pathway.",
            },
          ],
          correctOptionId: "3",
          explanation:
            "Uncertainty should be escalated, not ignored. Workers should seek guidance and use the correct process.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can recognise safety concerns, protect immediate wellbeing and report issues through the correct escalation pathway.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "reflective-practice",
      area: "development",
      title: "Reflective Practice and Worker Wellbeing",
      summary:
        "Learn how reflection, supervision and sustainable self-care help workers provide calm, reliable support without ignoring their own limits.",
      content:
        "Reflective practice means thinking carefully about what happened, how you responded, what influenced the situation and what you could do differently next time. It is not about blaming yourself. It is a way to learn and improve.\n\nWorkers bring their own emotions, assumptions, stress and life experience into every interaction. When these go unnoticed, they can affect tone, patience, judgement and decision-making. Reflection helps workers respond more thoughtfully rather than reacting automatically.\n\nWellbeing also matters. Tired, overwhelmed or unsupported workers are more likely to miss important communication, become impatient or make poor decisions. Sustainable support requires realistic boundaries, rest, supervision, debriefing and early action when stress is building.\n\nWorkers should know the difference between healthy reflection and carrying responsibility that does not belong to them. Serious concerns, repeated distress or emotionally difficult events should be discussed through supervision and appropriate support rather than managed alone.\n\nThe aim is not perfection. The aim is honest learning, accountability and support that remains calm, safe and human over time.",
      learningOutcomes: [
        "Explain the purpose of reflective practice.",
        "Recognise how worker emotions and assumptions can affect support.",
        "Identify early signs of stress, fatigue or burnout.",
        "Describe when to use supervision, debriefing, rest or additional support.",
      ],
      contentBlocks: [
        {
          id: "reflective-practice-purpose",
          type: "introduction",
          title: "Reflection supports learning",
          body:
            "Reflection helps workers understand what happened, what influenced their response and what could be improved next time.",
          order: 1,
        },
        {
          id: "reflective-practice-self-awareness",
          type: "lesson",
          title: "Notice what you bring",
          body:
            "Stress, assumptions, urgency and personal experience can shape how a worker interprets and responds to another person.",
          order: 2,
        },
        {
          id: "reflective-practice-wellbeing",
          type: "lesson",
          title: "Wellbeing affects support",
          body:
            "Fatigue and overwhelm can reduce patience, attention and judgement. Rest, boundaries and support are part of safe practice.",
          order: 3,
        },
        {
          id: "reflective-practice-supervision",
          type: "lesson",
          title: "Use supervision and debriefing",
          body:
            "Workers should not carry complex or distressing situations alone. Supervision creates a safe place to review concerns, decisions and emotional impact.",
          order: 4,
        },
      ],
      scenarios: [
        {
          id: "reflective-practice-scenario",
          title: "The difficult week",
          situation:
            "A worker has completed several emotionally difficult shifts and notices they are becoming impatient, avoiding communication with the team and dreading the next shift.",
          question:
            "What would reflective and sustainable practice look like?",
          guidance:
            "The worker should recognise the warning signs, seek supervision or debriefing, review workload and boundaries, rest where possible and discuss any support or changes needed before stress affects the participant.",
        },
      ],
      reflectionPrompt:
        "What signs tell you that stress is beginning to affect your work, and what actions help you return to calm, thoughtful practice?",
      knowledgeCheck: [
        {
          id: "reflective-practice-question-1",
          question:
            "What is the main purpose of reflective practice?",
          options: [
            {
              id: "1",
              label:
                "To prove that the worker handled everything perfectly.",
            },
            {
              id: "2",
              label:
                "To understand what happened, learn and improve future support.",
            },
            {
              id: "3",
              label:
                "To avoid discussing difficult situations with anyone else.",
            },
          ],
          correctOptionId: "2",
          explanation:
            "Reflective practice supports honest learning, accountability and better future decisions.",
        },
        {
          id: "reflective-practice-question-2",
          question:
            "What should a worker do when stress is beginning to affect their judgement or patience?",
          options: [
            {
              id: "1",
              label:
                "Ignore it and keep working until the feeling passes.",
            },
            {
              id: "2",
              label:
                "Hide it so others do not think they are struggling.",
            },
            {
              id: "3",
              label:
                "Use supervision, review boundaries and seek support early.",
            },
          ],
          correctOptionId: "3",
          explanation:
            "Early support, supervision and realistic boundaries help prevent stress from affecting the participant or the worker.",
        },
      ],
      passMark: 80,
      estimatedMinutes: 20,
      completionStatement:
        "The learner can use reflection, supervision and sustainable wellbeing practices to provide safer, calmer and more reliable support.",
      participantSpecific: false,
      participantReference: null,
      status: "published",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
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
    schoolLessons: createDefaultSchoolLessons(),
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
      budgets: Array.isArray(parsedValue.budgets)
        ? (parsedValue.budgets as CircleBudgetItem[])
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
      ? (() => {
          const savedLessons =
            value.schoolLessons
              .map(normaliseSchoolLesson)
              .filter(
                (lesson): lesson is SchoolLesson =>
                  lesson !== null,
              );

          const defaultLessons =
            createDefaultSchoolLessons();

          const missingDefaults =
            defaultLessons.filter(
              (defaultLesson) =>
                !savedLessons.some(
                  (savedLesson) =>
                    savedLesson.id ===
                    defaultLesson.id,
                ),
            );

          return [
            ...savedLessons,
            ...missingDefaults,
          ];
        })()
      : createDefaultSchoolLessons(),

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

      budgets: Array.isArray(
        circleValue.budgets,
      )
        ? (circleValue.budgets as CircleBudgetItem[])
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
  input: Pick<
    SchoolLesson,
    | "area"
    | "title"
    | "summary"
    | "content"
    | "status"
  > &
    Partial<
      Omit<
        SchoolLesson,
        | "id"
        | "area"
        | "title"
        | "summary"
        | "content"
        | "status"
        | "createdAt"
        | "updatedAt"
      >
    >,
): SchoolLesson {
  const timestamp = now();

  const lesson: SchoolLesson = {
    id: createId("school-lesson"),
    area: input.area,
    title: input.title.trim(),
    summary: input.summary.trim(),
    content: input.content.trim(),
    learningOutcomes:
      input.learningOutcomes ?? [],
    contentBlocks:
      input.contentBlocks ?? [],
    scenarios: input.scenarios ?? [],
    reflectionPrompt:
      input.reflectionPrompt ?? "",
    knowledgeCheck:
      input.knowledgeCheck ?? [],
    passMark: input.passMark ?? 80,
    estimatedMinutes:
      input.estimatedMinutes ?? 15,
    completionStatement:
      input.completionStatement ?? "",
    participantSpecific:
      input.participantSpecific ?? false,
    participantReference:
      input.participantReference ?? null,
    status: input.status,
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