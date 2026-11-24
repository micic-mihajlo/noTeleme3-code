#!/usr/bin/env node
// @effect-diagnostics nodeBuiltinImport:off globalConsole:off - A one-shot codemod; synchronous Node APIs keep it small.
// Renames the upstream product name in shipped copy, then re-keys every GT catalog, because catalog
// keys hash the English text. Rerun it after each upstream merge; a second run changes nothing.
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";

const BRAND = "noTeleme3-code";
const REPOSITORY = "micic-mihajlo/noTeleme3-code";
const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
// Reverse-DNS for the fork's own app, so it never shares a bundle id with an installed official app.
const APP_ID = "io.github.micicmihajlo.noteleme3code";

// The fork's mark, a crossed-out signal, drawn in the same 128-unit box as the upstream mark it
// replaces, so every SVG that embeds the mark keeps its layout.
const MARK_PATH =
  "M57.5 82a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM38.623 70.167A28 28 0 0 1 46.955 59.786A4.5 4.5 0 0 1 52.434 66.926A19 19 0 0 0 46.78 73.97A4.5 4.5 0 0 1 38.623 70.167ZM22.31 62.56A46 46 0 0 1 34.896 46.378A4.5 4.5 0 0 1 40.59 53.347A37 37 0 0 0 30.467 66.363A4.5 4.5 0 0 1 22.31 62.56ZM60.191 36.158A46 46 0 0 1 105.69 62.56A4.5 4.5 0 0 1 97.533 66.363A37 37 0 0 0 60.936 45.127A4.5 4.5 0 0 1 60.191 36.158ZM29.01 28.657L93.01 100.657A4 4 0 0 0 98.99 95.343L34.99 23.343A4 4 0 0 0 29.01 28.657Z";
const MARK_VIEWBOX = "21.9 22 84.2 80";
const MARK_FILES = [
  "apps/desktop/resources/dmg/dmg-background-latest.svg",
  "apps/desktop/resources/dmg/dmg-background-nightly.svg",
  "apps/mobile/assets/widget/T3Mark.svg",
  "apps/mobile/src/components/T3Wordmark.tsx",
  "apps/web/src/components/T3Wordmark.tsx",
  "assets/dev/app-icon.icon/Assets/text.svg",
  "assets/nightly/app-icon.icon/Assets/text.svg",
  "assets/prod/app-icon.icon/Assets/text.svg",
  "assets/prod/logo.svg",
  "scripts/mobile-showcase-environment.ts",
];

// Links users follow to download, report, star, or read docs belong to the fork. Upstream URLs
// elsewhere are sample data in tests or real upstream services, so the swap is per file.
const OWN_REPOSITORY_FILES = [
  ".github/triage/PLAYBOOK.md",
  "apps/desktop/gnome-extension/metadata.json",
  "apps/desktop/resources/linux/com.t3tools.t3code.metainfo.xml",
  "apps/desktop/src/app/DesktopStartupRecovery.ts",
  "apps/server/package.json",
  "apps/server/src/triage/TriageService.ts",
  "apps/server/src/triage/triagePrompt.ts",
  "apps/web/src/components/GitHubStarPrompt.test.ts",
  "apps/web/src/components/GitHubStarPrompt.tsx",
  "apps/web/src/components/desktopUpdate.logic.test.ts",
  "apps/web/src/components/desktopUpdate.logic.ts",
  "apps/web/src/components/settings/MultipleAccountsNote.tsx",
  "apps/web/src/components/workflows/WorkflowRunsView.tsx",
  "apps/web/src/lib/bootError.ts",
  "packages/contracts/src/environmentHttp.ts",
];
const FILE_EDITS: ReadonlyArray<readonly [file: string, from: string | RegExp, to: string]> = [
  ...OWN_REPOSITORY_FILES.map((file) => [file, /pingdotgg\/t3code/g, REPOSITORY] as const),
  [
    "apps/desktop/resources/linux/com.t3tools.t3code.metainfo.xml",
    "https://t3.codes",
    REPOSITORY_URL,
  ],
  [
    "apps/desktop/resources/linux/com.t3tools.t3code.metainfo.xml",
    "<name>T3 Tools Inc.</name>",
    `<name>${BRAND} contributors</name>`,
  ],
  [
    "docs/user/faq.md",
    /^(?!> \[!NOTE\])/,
    "> [!NOTE]\n> This FAQ is upstream T3 Code's, answered by its maintainers in their own voice. Answers about pricing, T3 Connect, and T3 Chat describe their service. For what this fork changes, see [Telemetry in noTeleme3-code](./telemetry.md).\n\n",
  ],
  ...MARK_FILES.flatMap((file) => [
    [file, /d="M33\.4509 93V47\.56[^"]*"/g, `d="${MARK_PATH}"`] as const,
    [file, "15.5309 37 94.3941 56.96", MARK_VIEWBOX] as const,
    [file, "94.3941 / 56.96", "84.2 / 80"] as const,
  ]),
  [
    "scripts/export-android-icons.ts",
    "const TEXT = { x: 15.53, y: 37, width: 94.5, height: 57 };",
    "const TEXT = { x: 21.9, y: 22, width: 84.2, height: 80 };",
  ],
  [
    "apps/mobile/assets/widget/T3Mark.svg",
    'width="111" height="74" viewBox="7 29 111 74"',
    `width="84" height="80" viewBox="${MARK_VIEWBOX}"`,
  ],
  // Home screen widgets end their copy on the bare name ("Open T3", "${n} more in T3").
  ...[
    "apps/mobile/src/widgets/SubscriptionUsage.tsx",
    "apps/mobile/src/widgets/SubscriptionUsage.android.tsx",
  ].map((file) => [file, /\bT3\b(?=["`])/g, BRAND] as const),
  // The lockup is the mark followed by a word; upstream's word was "Code". The product name needs
  // no translation exemption, unlike the bare word it replaces.
  ["apps/web/src/components/sidebar/SidebarChrome.tsx", '{"Code"}', `{"${BRAND}"}`],
  ...[
    "apps/web/src/components/sidebar/SidebarChrome.tsx",
    "apps/web/src/components/ui/standalone-page.tsx",
  ].map(
    (file) =>
      [
        file,
        /\n[ \t]*\{\/\* oxlint-disable-next-line t3code\/no-untranslated-copy -- product wordmark \*\/\}/,
        "",
      ] as const,
  ),
  [
    "apps/web/src/components/ui/standalone-page.tsx",
    '<span className="text-lg font-medium tracking-tight">Code</span>',
    `<span className="text-lg font-medium tracking-tight">${BRAND}</span>`,
  ],
  [
    "apps/mobile/src/components/CompactBrandTitle.tsx",
    'const WORDMARK_SUFFIX = "Code";',
    `const WORDMARK_SUFFIX = "${BRAND}";`,
  ],
  ["apps/mobile/src/widgets/subscriptionUsageSnapshot.ts", /app: "T3"/g, `app: "${BRAND}"`],
  ["apps/web/src/components/sidebar/SidebarChrome.tsx", 'aria-label="T3"', `aria-label="${BRAND}"`],
  [
    "apps/mobile/src/components/T3Wordmark.tsx",
    'accessibilityLabel="T3"',
    `accessibilityLabel="${BRAND}"`,
  ],
  ["apps/web/src/branding.ts", "https://t3.codes/download", `${REPOSITORY_URL}/releases`],
  ["apps/web/src/lib/bootError.ts", "https://t3.codes/download", `${REPOSITORY_URL}/releases`],
  [
    "apps/web/src/legalLinks.ts",
    "https://t3.codes/privacy-policy",
    `${REPOSITORY_URL}/blob/main/docs/user/telemetry.md`,
  ],
  ["apps/server/src/project/ManagedProjectFolders.ts", "(https://t3.codes)", `(${REPOSITORY_URL})`],
  [
    "packages/contracts/src/t3ProjectFile.ts",
    "See https://t3.codes for",
    `See ${REPOSITORY_URL} for`,
  ],
  ["scripts/build-desktop-artifact.ts", /"com\.t3tools\.t3code"/g, `"${APP_ID}"`],
  ["scripts/build-desktop-artifact.test.ts", /"com\.t3tools\.t3code"/g, `"${APP_ID}"`],
  [
    "scripts/build-desktop-artifact.test.ts",
    /ABC1234567\.com\.t3tools\.t3code/g,
    `ABC1234567.${APP_ID}`,
  ],
  // Providers that show the MCP server's title prefix tool calls with the fork's name.
  [
    "packages/shared/src/t3McpToolPresentation.ts",
    '  "t3-code",\n  "t3_code",',
    '  "t3-code",\n  "noteleme3-code",\n  "t3_code",',
  ],
  // Troubleshooting anchors follow the renamed user-guide headings.
  ...[
    "packages/contracts/src/environmentHttp.ts",
    "packages/client-runtime/src/connection/diagnosis.ts",
  ].map(
    (file) => [file, /"(the-[a-z0-9-]*?)t3-code([a-z0-9-]*)"/g, '"$1noteleme3-code$2"'] as const,
  ),
  // Providers show the MCP server's name ("noTeleme3-code link_pull_request") before a tool.
  [
    "packages/shared/src/t3McpToolPresentation.ts",
    "/^(?:mcp[-_]{1,2})?t3[-_ ]?code(?:__|[-_.:/ ])(?<tool>.+)$/i",
    "/^(?:mcp[-_]{1,2})?(?:t3|noteleme3)[-_ ]?code(?:__|[-_.:/ ])(?<tool>.+)$/i",
  ],
  [
    "scripts/build-desktop-artifact.test.ts",
    "ABC1234567\\.com\\.t3tools\\.t3code",
    `ABC1234567\\.${APP_ID.replaceAll(".", "\\.")}`,
  ],
  [
    "apps/mobile/modules/t3-agent-notifications/android/src/main/res/drawable/agent_activity_mark.xml",
    /android:pathData="M33\.4509,93V47\.56[^"]*"/,
    `android:pathData="${MARK_PATH}"`,
  ],
  [
    "apps/mobile/modules/t3-agent-notifications/android/src/main/res/drawable/agent_activity_mark.xml",
    'android:translateX="-2.5" android:translateY="-6"',
    'android:translateX="-4" android:translateY="-2"',
  ],
  // App links list the fork's app ids; the team id and certificate are still upstream's.
  ...[
    "apps/web/public/.well-known/apple-app-site-association.json",
    "apps/web/public/.well-known/assetlinks.json",
  ].map((file) => [file, /com\.t3tools\.t3code/g, APP_ID] as const),
  ["apps/desktop/scripts/electron-launcher.mjs", /com\.t3tools\.t3code/g, APP_ID],
  ["apps/desktop/src/app/DesktopEnvironment.ts", /"com\.t3tools\.t3code/g, `"${APP_ID}`],
  ["apps/mobile/app.config.ts", /"com\.t3tools\.t3code/g, `"${APP_ID}`],
  ["apps/mobile/app.config.test.ts", /"com\.t3tools\.t3code/g, `"${APP_ID}`],
  ["apps/mobile/scripts/measure-renders.mts", /"com\.t3tools\.t3code/g, `"${APP_ID}`],
  ["scripts/mobile-showcase.ts", /"com\.t3tools\.t3code/g, `"${APP_ID}`],
];
// Build scripts outside SCOPES whose copy ships inside the desktop app.
const SHIPPED_SCRIPTS = [
  "scripts/build-desktop-artifact.ts",
  "scripts/build-desktop-artifact.test.ts",
];

const root = NodePath.resolve(import.meta.dirname, "..");
const SCOPES = ["apps", "packages", "docs/user", "docs/README.md", ".github/triage"];
// The FAQ is upstream's maintainers answering in their own voice; renaming it would put their words
// in the fork's mouth, so it stays as written under a note that says whose it is. The telemetry page
// is the fork's own and names upstream on purpose.
const SKIPPED = [
  /^apps\/marketing\//,
  /\/i18n\/translations\//,
  /^docs\/user\/faq\.md$/,
  /^docs\/user\/telemetry\.md$/,
  // Search and dictation tests feed free text through matchers; their data is not shipped copy.
  /^packages\/shared\/src\/(paletteSearch|speech)\.test\.ts$/,
];
const TEXT =
  /\.(ts|tsx|mts|cts|js|mjs|cjs|json|jsonl|ndjson|md|mdx|html|css|xml|plist|yml|yaml|txt|svg|swift|kt|nsh|podspec|webmanifest)$/;
// Upstream's legacy profile directory names, which the desktop app still migrates from.
// Test paths that need a space in the install directory keep theirs.
const KEPT = ["T3 Code (Alpha)", "/opt/T3 Code/"];

// Prose only: a bare "T3" followed by a possessive or a lowercase word, so protocol strings like
// "X-T3-Mode" and service names (T3 Connect, T3 Chat, T3 Tools) stay as they are.
const renameSource = (text: string) =>
  text
    .replace(/T3(?:[ -]|\+|%20)Code/g, BRAND)
    .replace(/\bT3(?=(?:'s|’s)\b| [a-z]| (?:MCP|Server|Account)\b)/g, BRAND);

// Translations put the name before other scripts and hyphens ("T3スレッド", "T3-Server").
const renameTranslation = (text: string) =>
  text.replace(/T3[ -]Code/g, BRAND).replace(/\bT3\b(?![ -]?(?:Connect|Tools|Chat))/g, BRAND);

const protect = (text: string, rename: (text: string) => string) => {
  const placeholders = KEPT.map((_, index) => `\u0000kept${index}\u0000`);
  let out = KEPT.reduce((acc, kept, index) => acc.replaceAll(kept, placeholders[index]!), text);
  out = rename(out);
  return placeholders.reduce(
    (acc, placeholder, index) => acc.replaceAll(placeholder, KEPT[index]!),
    out,
  );
};

const mapStrings = (value: unknown, rename: (text: string) => string): unknown => {
  if (typeof value === "string") return rename(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, rename));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapStrings(item, rename)]),
    );
  }
  return value;
};

// A longer name rewraps JSX text, which changes its whitespace children and so its key.
const normalizeLayout = (value: unknown): unknown => {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (Array.isArray(value)) {
    return value.map(normalizeLayout).filter((item) => item !== "");
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeLayout(item)]),
    );
  }
  return value;
};

type Catalog = Record<string, unknown>;
const readJson = (file: string): Catalog => JSON.parse(NodeFS.readFileSync(file, "utf8"));
const writeJson = (file: string, data: Catalog) =>
  NodeFS.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

const GENERATE: Record<string, readonly [string, ...string[]]> = {
  "apps/web": ["node_modules/.bin/gt", "generate"],
  "apps/mobile": ["node_modules/.bin/gt", "generate"],
  "apps/desktop": [process.execPath, "scripts/i18n-generate.mjs"],
};

const catalogDir = (app: string) => {
  const config = readJson(NodePath.join(root, app, "gt.config.json")) as {
    files: { gt: { output: string } };
  };
  return NodePath.join(root, app, NodePath.dirname(config.files.gt.output));
};

const sourceCatalogs = Object.fromEntries(
  Object.keys(GENERATE).map((app) => [app, readJson(NodePath.join(catalogDir(app), "en.json"))]),
);

const tracked = NodeChildProcess.execFileSync("git", ["ls-files", "-z", ...SCOPES], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter((file) => file && TEXT.test(file) && !SKIPPED.some((pattern) => pattern.test(file)))
  .concat(SHIPPED_SCRIPTS);

const touched = new Set<string>();
for (const file of tracked) {
  const path = NodePath.join(root, file);
  if (!NodeFS.existsSync(path)) continue;
  const before = NodeFS.readFileSync(path, "utf8");
  const after = protect(before, renameSource);
  if (after !== before) {
    NodeFS.writeFileSync(path, after);
    touched.add(file);
  }
}
const renamedFiles = touched.size;

for (const [file, from, to] of FILE_EDITS) {
  const path = NodePath.join(root, file);
  const before = NodeFS.readFileSync(path, "utf8");
  const after = typeof from === "string" ? before.replaceAll(from, to) : before.replace(from, to);
  if (after !== before) {
    NodeFS.writeFileSync(path, after);
    touched.add(file);
  }
}

// The fork's icons are the mark on one flat color per channel, replacing upstream's channel artwork.
const svg = (body: string) =>
  `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">\n  ${body}\n</svg>\n`;
const WHOLE_FILES: Record<string, string> = {
  "assets/dev/app-icon.icon/Assets/annotations.svg": svg("<defs></defs>"),
  "assets/dev/app-icon.icon/Assets/background.svg": svg(
    '<rect width="128" height="128" fill="#0F766E"/>',
  ),
  "assets/nightly/app-icon.icon/Assets/background.svg": svg(
    '<rect width="128" height="128" fill="#312E81"/>',
  ),
  "assets/nightly/app-icon.icon/Assets/cloud-lower-left.svg": svg("<defs></defs>"),
  "assets/nightly/app-icon.icon/Assets/cloud-upper-right.svg": svg("<defs></defs>"),
};
for (const [file, contents] of Object.entries(WHOLE_FILES)) {
  NodeFS.writeFileSync(NodePath.join(root, file), contents);
}

// A longer name rewraps JSX text, and catalog keys hash the formatted text, so format before re-keying.
const format = (files: ReadonlyArray<string>) => {
  const formattable = files.filter((file) => /\.(ts|tsx|mts|mjs|cjs|js|json|md|css)$/.test(file));
  if (formattable.length === 0) return;
  const fmt = NodeChildProcess.spawnSync(
    NodePath.join(root, "node_modules/.bin/vp"),
    ["fmt", "--no-error-on-unmatched-pattern", ...formattable],
    { cwd: root, encoding: "utf8" },
  );
  if (fmt.status !== 0) throw new Error(`vp fmt failed\n${fmt.stdout}${fmt.stderr}`);
};
format([...touched]);

const generateSource = (app: string): Catalog => {
  const appDir = NodePath.join(root, app);
  const config = readJson(NodePath.join(appDir, "gt.config.json"));
  const tmp = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "rebrand-"));
  try {
    const tmpConfig = NodePath.join(tmp, "gt.config.json");
    NodeFS.writeFileSync(
      tmpConfig,
      JSON.stringify({ ...config, locales: [], files: { gt: { output: `${tmp}/[locale].json` } } }),
    );
    const [command, ...args] = GENERATE[app]!;
    const gt = NodeChildProcess.spawnSync(command, [...args, "--config", tmpConfig], {
      cwd: appDir,
      encoding: "utf8",
    });
    if (gt.status !== 0) throw new Error(`${app}: gt generate failed\n${gt.stdout}${gt.stderr}`);
    return readJson(NodePath.join(tmp, "en.json"));
  } finally {
    NodeFS.rmSync(tmp, { recursive: true, force: true });
  }
};

const untranslated: string[] = [];
const rewrittenCatalogs: string[] = [];
let rekeyed = 0;
for (const app of Object.keys(GENERATE)) {
  const oldSource = sourceCatalogs[app]!;
  const newSource = generateSource(app);
  const unclaimed = new Map<string, string[]>();
  for (const [key, text] of Object.entries(newSource)) {
    if (Object.hasOwn(oldSource, key)) continue;
    const json = JSON.stringify(normalizeLayout(text));
    unclaimed.set(json, [...(unclaimed.get(json) ?? []), key]);
  }
  const renamedKeys = new Map<string, string>();
  for (const [key, text] of Object.entries(oldSource)) {
    if (Object.hasOwn(newSource, key)) continue;
    const json = JSON.stringify(
      normalizeLayout(mapStrings(text, (value) => protect(value, renameSource))),
    );
    const candidates = unclaimed.get(json);
    if (!candidates?.length) continue;
    renamedKeys.set(key, candidates.shift()!);
  }
  // Strings the fork rewrote or added by hand have no catalog entry to carry over: they ship in
  // English until someone translates them, as `gt generate` would leave them.
  const added = [...unclaimed.values()].flat();
  untranslated.push(...added.map((key) => `${app}: ${key} ${JSON.stringify(newSource[key])}`));
  rekeyed += renamedKeys.size;

  const dir = catalogDir(app);
  for (const name of NodeFS.readdirSync(dir).filter((entry) => entry.endsWith(".json"))) {
    const file = NodePath.join(dir, name);
    const catalog = readJson(file);
    const rename = name === "en.json" ? renameSource : renameTranslation;
    const next = Object.fromEntries([
      ...Object.entries(catalog)
        .filter(([key]) => Object.hasOwn(newSource, key) || renamedKeys.has(key))
        .map(([key, value]) => {
          const newKey = renamedKeys.get(key);
          if (newKey === undefined)
            return [
              key,
              mapStrings(value, (text) => protect(text, (t) => t.replaceAll("T3 Code", BRAND))),
            ];
          return [
            newKey,
            name === "en.json"
              ? newSource[newKey]
              : mapStrings(value, (text) => protect(text, rename)),
          ];
        }),
      ...added.map((key) => [key, newSource[key]] as const),
    ]);
    if (JSON.stringify(next) !== JSON.stringify(catalog)) {
      writeJson(file, next);
      rewrittenCatalogs.push(NodePath.relative(root, file));
    }
  }
}

format(rewrittenCatalogs);
console.log(`Renamed copy in ${renamedFiles} files and re-keyed ${rekeyed} catalog entries.`);
if (untranslated.length > 0) {
  console.log(`Added in English, to translate in every locale:\n${untranslated.join("\n")}`);
}
