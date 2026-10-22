import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Command, InvalidArgumentError, Option } from "commander";
import { type CheckRow, checkFeature, rowOk } from "./lib/check";
import { type PrepareResult, prepare, workDirFor } from "./lib/prepare";
import {
  type Filters,
  findFeature,
  findProject,
  loadFeature,
  loadProjects,
  matchesFilters,
} from "./lib/projects";
import { regen } from "./lib/regen";
import type { Feature, Project } from "./types";
import { pick } from "./utils";

const projectsDir = join(import.meta.dirname, "projects");

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

const parseMinutes = (value: string) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new InvalidArgumentError("Expected a positive number of minutes.");
  }
  return minutes;
};

/** Adds the shared `--difficulty`, `--focus`, `--domain` and `--max-minutes` options. */
const withFilters = (command: Command) =>
  command
    .addOption(
      new Option(
        "-d, --difficulty <level>",
        "Only features with this difficulty.",
      ).choices(DIFFICULTIES),
    )
    .option(
      "-f, --focus <areas>",
      "Comma-separated focus areas. A feature matches if it has at least one of them.",
      parseList,
    )
    .option("--domain <domain>", "Only projects in this domain.")
    .option(
      "-m, --max-minutes <minutes>",
      "Only features expected to take at most this many minutes.",
      parseMinutes,
    );

type PrepareFlags = { install: boolean; force: boolean };

/** Adds the shared `--no-install` and `--force` options of commands that prepare a work dir. */
const withPrepareOptions = (command: Command) =>
  command
    .option("--no-install", "Skip pnpm install.")
    .option("--force", "Replace the directory if it already exists.", false);

const printPrepared = (
  result: PrepareResult,
  project: Project,
  feature?: Feature,
) => {
  console.log(`Prepared ${result.dir}`);
  console.log(`  main`);
  if (result.featureBranch) {
    console.log(`  ${result.featureBranch} (checked out)`);
  }
  if (result.diffStat) {
    console.log(`\n${result.diffStat}`);
  }
  console.log(`\nWalkthrough: ${join(project.dir, "project.json")}`);
  if (feature) {
    const answerKey = join(feature.dir, "REVIEW.md");
    console.log(
      existsSync(answerKey)
        ? `Answer key: ${answerKey}`
        : `Answer key: ${answerKey} (not present here; REVIEW.md is distributed out of band)`,
    );
  }
};

const program = new Command()
  .name("cr")
  .description("Code-review challenge runner");

// --- list ------------------------------------------------------------------

withFilters(
  program
    .command("list")
    .alias("ls")
    .description(
      "List the review features and their tags, optionally filtered.",
    ),
).action(async (options: Filters) => {
  const { projects, warnings } = await loadProjects(projectsDir);
  const entries = projects.flatMap((project) =>
    project.features
      .filter((feature) => matchesFilters(project, feature, options))
      .map((feature) => ({ project, feature })),
  );
  const columns = [
    "project",
    "feature",
    "difficulty",
    "minutes",
    "focus",
  ] as const;
  type Row = Record<(typeof columns)[number], string>;
  const header: Row = {
    project: "PROJECT",
    feature: "FEATURE",
    difficulty: "DIFFICULTY",
    minutes: "MINUTES",
    focus: "FOCUS",
  };
  const rows: Row[] = entries.map(({ project, feature }) => ({
    project: project.slug,
    feature: feature.slug,
    difficulty: feature.meta.tags.difficulty,
    minutes: String(feature.meta.tags.minutes),
    focus: feature.meta.tags.focus.join(", "),
  }));
  const widths = Object.fromEntries(
    columns.map((key) => [
      key,
      Math.max(header[key].length, ...rows.map((row) => row[key].length)),
    ]),
  ) as Record<keyof Row, number>;
  const line = (row: Row) =>
    columns
      .map((key) => row[key].padEnd(widths[key]))
      .join("  ")
      .trimEnd();
  console.log(line(header));
  for (const row of rows) {
    console.log(line(row));
  }
  const projectCount = new Set(entries.map(({ project }) => project.slug)).size;
  console.log(`\n${entries.length} features across ${projectCount} projects`);
  for (const warning of warnings) {
    console.error(`warn: ${warning}`);
  }
});

// --- prepare ---------------------------------------------------------------

withPrepareOptions(
  program
    .command("prepare")
    .description(
      "Create a git repo with the project on main and the feature on feature/<slug>.",
    )
    .argument("<project>", "Project slug.")
    .argument("[feature]", "Feature slug. Omit to prepare the base only.")
    .option(
      "-o, --out <dir>",
      "Directory to create. Defaults to .work/<name>.",
    ),
).action(
  async (
    projectSlug: string,
    featureSlug: string | undefined,
    options: PrepareFlags & { out?: string },
  ) => {
    const { projects } = await loadProjects(projectsDir);
    const project = findProject(projects, projectSlug);
    const feature = featureSlug ? findFeature(project, featureSlug) : undefined;
    const outDir = options.out
      ? resolve(options.out)
      : workDirFor(import.meta.dirname, project, feature);
    const result = await prepare({
      project,
      ...(feature && { feature }),
      outDir,
      install: options.install,
      force: options.force,
      cliRoot: import.meta.dirname,
    });
    printPrepared(result, project, feature);
  },
);

// --- regen -----------------------------------------------------------------

program
  .command("regen")
  .description(
    "Rewrite a feature's changes.patch from main..HEAD of its work dir.",
  )
  .argument("<project>", "Project slug.")
  .argument("<feature>", "Feature slug.")
  .option(
    "--from <dir>",
    "Work dir to diff. Defaults to .work/<project>-<feature>.",
  )
  .action(
    async (
      projectSlug: string,
      featureSlug: string,
      options: { from?: string },
    ) => {
      const { projects } = await loadProjects(projectsDir);
      const project = findProject(projects, projectSlug);
      const feature = await loadFeature(project.dir, featureSlug);
      const fromDir = options.from
        ? resolve(options.from)
        : workDirFor(import.meta.dirname, project, feature);
      const result = await regen({ feature, fromDir });
      console.log(
        `Wrote ${result.patchPath} (${result.filesChanged} file(s) changed)`,
      );
    },
  );

// --- check -----------------------------------------------------------------

const mark = (ok: boolean) => (ok ? "✓" : "✗");

const printCheckRows = (rows: CheckRow[]) => {
  const names = rows.map((row) => `${row.project}/${row.feature}`);
  const width = Math.max("FEATURE".length, ...names.map((name) => name.length));
  console.log(
    `${"FEATURE".padEnd(width)}  APPLIES  BASE-TC  BASE-TEST  FEAT-TC  FEAT-TEST`,
  );
  rows.forEach((row, index) => {
    console.log(
      [
        (names[index] ?? "").padEnd(width),
        mark(row.applies).padEnd(7),
        mark(row.baseTypecheck).padEnd(8),
        mark(row.baseTest).padEnd(9),
        mark(row.featureTypecheck).padEnd(7),
        mark(row.featureTest),
      ].join("  "),
    );
    if (row.error) {
      console.log(`    ${row.error}`);
    }
    if (row.details) {
      console.log(
        row.details
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n"),
      );
    }
  });
};

program
  .command("check")
  .description(
    "Apply each patch and run typecheck and test on main and the feature branch.",
  )
  .argument("[project]", "Project slug. Omit to check every project.")
  .argument("[feature]", "Feature slug. Omit to check every feature.")
  .action(
    async (
      projectSlug: string | undefined,
      featureSlug: string | undefined,
    ) => {
      const { projects } = await loadProjects(projectsDir);
      const selected = projectSlug
        ? [findProject(projects, projectSlug)]
        : projects;
      const entries = selected.flatMap((project) => {
        const features = featureSlug
          ? [findFeature(project, featureSlug)]
          : project.features;
        return features.map((feature) => ({ project, feature }));
      });
      const tmpRoot = await mkdtemp(join(tmpdir(), "cr-check-"));
      try {
        const rows: CheckRow[] = [];
        for (const { project, feature } of entries) {
          rows.push(await checkFeature(project, feature, tmpRoot));
        }
        printCheckRows(rows);
        if (!rows.every(rowOk)) {
          process.exitCode = 1;
        }
      } finally {
        await rm(tmpRoot, { recursive: true, force: true });
      }
    },
  );

// --- random ----------------------------------------------------------------

withPrepareOptions(
  withFilters(
    program
      .command("random")
      .description("Prepare a random review feature, optionally filtered."),
  ),
).action(async (options: Filters & PrepareFlags) => {
  const { projects } = await loadProjects(projectsDir);
  const entries = projects.flatMap((project) =>
    project.features
      .filter((feature) => matchesFilters(project, feature, options))
      .map((feature) => ({ project, feature })),
  );
  if (entries.length === 0) {
    throw new Error("No features match those filters.");
  }
  const { project, feature } = pick(entries);
  console.log(`Running: ${project.slug}/${feature.slug}`);
  const result = await prepare({
    project,
    feature,
    outDir: workDirFor(import.meta.dirname, project, feature),
    install: options.install,
    force: options.force,
    cliRoot: import.meta.dirname,
  });
  printPrepared(result, project, feature);
});

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
