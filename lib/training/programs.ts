import { moduleOneRightsAndWorkerRole } from "./module-1";
import type {
  TrainingModule,
  TrainingProgram,
} from "./types";

export const smilingMonadSupportWorkerFoundationProgram: TrainingProgram =
  {
    id: "smiling-monad-support-worker-foundation",
    code: "SM-SWF-001",
    title:
      "Smiling Monad Support Worker Foundation Program",
    version: "1.0.0",
    description:
      "A rights-based, person-centred training program for support workers seeking a reviewed Smiling Monad worker profile.",
    status: "draft",
    moduleIds: [
      moduleOneRightsAndWorkerRole.id,
    ],
    entryRequirements: [
      "A current Smiling Monad worker application",
      "Identity details supplied for private review",
      "Agreement to the learner integrity declaration",
      "Ability to complete the learning with reasonable adjustments where required",
    ],
    completionRequirements: [
      "Complete every required learning section",
      "Complete all required assessments",
      "Meet the minimum knowledge score for each module",
      "Pass every critical safety question",
      "Submit all required reflections and scenarios",
      "Provide required external evidence",
      "Resolve any integrity flags",
      "Receive a satisfactory human reviewer decision",
      "Complete participant-specific induction before working independently",
    ],
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
  };

export const trainingModules: TrainingModule[] = [
  moduleOneRightsAndWorkerRole,
];

export const trainingPrograms: TrainingProgram[] = [
  smilingMonadSupportWorkerFoundationProgram,
];

export function getTrainingProgram(
  programId: string,
): TrainingProgram | null {
  return (
    trainingPrograms.find(
      (program) => program.id === programId,
    ) ?? null
  );
}

export function getTrainingModule(
  moduleId: string,
): TrainingModule | null {
  return (
    trainingModules.find(
      (module) => module.id === moduleId,
    ) ?? null
  );
}

export function getProgramModules(
  programId: string,
): TrainingModule[] {
  const program = getTrainingProgram(programId);

  if (!program) {
    return [];
  }

  return program.moduleIds
    .map((moduleId) =>
      getTrainingModule(moduleId),
    )
    .filter(
      (
        module,
      ): module is TrainingModule =>
        Boolean(module),
    );
}

export function isTrainingProgramActive(
  programId: string,
): boolean {
  return (
    getTrainingProgram(programId)?.status ===
    "active"
  );
}

export function isTrainingModuleActive(
  moduleId: string,
): boolean {
  return (
    getTrainingModule(moduleId)?.status ===
    "active"
  );
}