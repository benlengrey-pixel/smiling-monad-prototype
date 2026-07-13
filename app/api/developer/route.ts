import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

type DeveloperAction =
  | "read-file"
  | "write-file"
  | "create-file"
  | "delete-file"
  | "install-package"
  | "remove-package"
  | "run-build";

type DeveloperRequest = {
  action: DeveloperAction;
  target?: string;
  content?: string;
  approval?: string;
  secret?: string;
};

const projectRoot = process.cwd();

function checkSecret(secret?: string) {
  const expected = process.env.DEVELOPER_AGENT_SECRET;

  if (!expected || secret !== expected) {
    throw new Error("Developer access denied.");
  }
}

function checkApproval(
  action: DeveloperAction,
  target: string,
  approval?: string
) {
  const required = `APPROVE:${action}:${target}`;

  if (approval !== required) {
    throw new Error(`Approval required: ${required}`);
  }
}

function safeProjectPath(target: string) {
  const fullPath = path.resolve(projectRoot, target);

  if (!fullPath.startsWith(projectRoot)) {
    throw new Error("Invalid project path.");
  }

  const blocked = [
    ".env",
    ".env.local",
    ".git",
    "node_modules",
    "app/api/developer/route.ts",
  ];

  const normalised = target.replaceAll("\\", "/");

  if (
    blocked.some(
      (item) =>
        normalised === item ||
        normalised.startsWith(`${item}/`)
    )
  ) {
    throw new Error("This location is protected.");
  }

  return fullPath;
}

function validPackageName(name: string) {
  const pattern =
    /^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i;

  if (!pattern.test(name)) {
    throw new Error("Invalid package name.");
  }

  return name;
}

function runCommand(
  command: string,
  args: string[]
): Promise<{
  output: string;
  errors: string;
  exitCode: number | null;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      shell: false,
      env: process.env,
    });

    let output = "";
    let errors = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errors += data.toString();
    });

    child.on("error", reject);

    child.on("close", (exitCode) => {
      resolve({ output, errors, exitCode });
    });
  });
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Developer actions are disabled in production."
      );
    }

    const body =
      (await request.json()) as DeveloperRequest;

    checkSecret(body.secret);

    const action = body.action;
    const target = body.target || "";

    if (action === "read-file") {
      const filePath = safeProjectPath(target);
      const content = await readFile(filePath, "utf8");

      return Response.json({
        success: true,
        action,
        target,
        content,
      });
    }

    checkApproval(action, target || action, body.approval);

    if (action === "write-file") {
      const filePath = safeProjectPath(target);

      if (typeof body.content !== "string") {
        throw new Error("File content is required.");
      }

      await copyFile(filePath, `${filePath}.backup`);
      await writeFile(filePath, body.content, "utf8");

      return Response.json({
        success: true,
        action,
        target,
        backupCreated: true,
      });
    }

    if (action === "create-file") {
      const filePath = safeProjectPath(target);

      if (typeof body.content !== "string") {
        throw new Error("File content is required.");
      }

      await mkdir(path.dirname(filePath), {
        recursive: true,
      });

      await writeFile(filePath, body.content, {
        encoding: "utf8",
        flag: "wx",
      });

      return Response.json({
        success: true,
        action,
        target,
      });
    }

    if (action === "delete-file") {
      const filePath = safeProjectPath(target);

      await copyFile(filePath, `${filePath}.backup`);
      await rm(filePath);

      return Response.json({
        success: true,
        action,
        target,
        backupCreated: true,
      });
    }

    if (action === "install-package") {
      const packageName = validPackageName(target);
      const result = await runCommand("npm", [
        "install",
        packageName,
      ]);

      return Response.json({
        success: result.exitCode === 0,
        action,
        target,
        ...result,
      });
    }

    if (action === "remove-package") {
      const packageName = validPackageName(target);
      const result = await runCommand("npm", [
        "uninstall",
        packageName,
      ]);

      return Response.json({
        success: result.exitCode === 0,
        action,
        target,
        ...result,
      });
    }

    if (action === "run-build") {
      const result = await runCommand("npm", [
        "run",
        "build",
      ]);

      return Response.json({
        success: result.exitCode === 0,
        action,
        ...result,
      });
    }

    throw new Error("Unsupported developer action.");
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Developer action failed.",
      },
      { status: 400 }
    );
  }
}