const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const IGNORED_FOLDERS = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "coverage",
  "dist",
  "build",
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".md",
]);

const files = [];

function scanDirectory(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (IGNORED_FOLDERS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
      continue;
    }

    const extension = path.extname(entry.name);

    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const relativePath = path
      .relative(ROOT, fullPath)
      .replaceAll("\\", "/");

    const imports = Array.from(
      content.matchAll(
        /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g
      )
    ).map((match) => match[1]);

    const exports = Array.from(
      content.matchAll(
        /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface)\s+([A-Za-z0-9_]+)/g
      )
    ).map((match) => match[1]);

    const speechReferences = [
      "speechSynthesis",
      "SpeechSynthesisUtterance",
      "speakCompanionResponse",
      "stopCompanionSpeech",
      "/api/speech",
      "audio/speech",
      "HTMLAudioElement",
      "new Audio",
    ].filter((term) => content.includes(term));

    const officeReferences = [
      "OfficeEnvironment",
      "/office",
      "OfficePage",
    ].filter((term) => content.includes(term));

    const workspaceReferences = [
      "WorkspaceShell",
      "WorkspacePage",
      "/workspace",
      "TemporaryWorkspaceSession",
    ].filter((term) => content.includes(term));

    const aiReferences = [
      "/api/gateway",
      "sendGatewayRequest",
      "OPENAI_API_KEY",
      "SMILING_MONAD_UNIFORM",
    ].filter((term) => content.includes(term));

    files.push({
      file: relativePath,
      extension,
      imports,
      exports,
      speechReferences,
      officeReferences,
      workspaceReferences,
      aiReferences,
      isApiRoute:
        relativePath.startsWith("app/api/") &&
        relativePath.endsWith("/route.ts"),
      isPage:
        relativePath.startsWith("app/") &&
        relativePath.endsWith("/page.tsx"),
      isLayout:
        relativePath.startsWith("app/") &&
        relativePath.endsWith("/layout.tsx"),
    });
  }
}

scanDirectory(ROOT);

const report = {
  generatedAt: new Date().toISOString(),
  projectRoot: ROOT,
  totalFiles: files.length,

  pages: files
    .filter((file) => file.isPage)
    .map((file) => file.file),

  layouts: files
    .filter((file) => file.isLayout)
    .map((file) => file.file),

  apiRoutes: files
    .filter((file) => file.isApiRoute)
    .map((file) => file.file),

  speechFiles: files.filter(
    (file) => file.speechReferences.length > 0
  ),

  officeFiles: files.filter(
    (file) => file.officeReferences.length > 0
  ),

  workspaceFiles: files.filter(
    (file) => file.workspaceReferences.length > 0
  ),

  aiFiles: files.filter(
    (file) => file.aiReferences.length > 0
  ),

  files,
};

const outputPath = path.join(
  ROOT,
  "project-report.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("Project inspection complete.");
console.log(`Files inspected: ${files.length}`);
console.log(`Report created: ${outputPath}`);