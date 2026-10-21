import { join, resolve } from "node:path";
import { Command, InvalidArgumentError, Option } from "commander";
import { prepare, workDirFor } from "./lib/prepare";
import {
  type Filters,
  findFeature,
  findProject,
  loadProjects,
  matchesFilters,
} from "./lib/projects";

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

program
  .command("prepare")
  .description(
    "Create a git repo with the project on main and the feature on feature/<slug>.",
  )
  .argument("<project>", "Project slug.")
  .argument("[feature]", "Feature slug. Omit to prepare the base only.")
  .option("-o, --out <dir>", "Directory to create. Defaults to .work/<name>.")
  .option("--no-install", "Skip pnpm install.")
  .option("--force", "Replace the directory if it already exists.", false)
  .action(
    async (
      projectSlug: string,
      featureSlug: string | undefined,
      options: { out?: string; install: boolean; force: boolean },
    ) => {
      const { projects } = await loadProjects(projectsDir);
      const project = findProject(projects, projectSlug);
      const feature = featureSlug
        ? findFeature(project, featureSlug)
        : undefined;
      const outDir = options.out
        ? resolve(options.out)
        : workDirFor(import.meta.dirname, project, feature);
      const result = await prepare({
        project,
        ...(feature && { feature }),
        outDir,
        install: options.install,
        force: options.force,
      });
      console.log(`Prepared ${result.dir}`);
      console.log(`  main`);
      if (result.featureBranch) {
        console.log(`  ${result.featureBranch} (checked out)`);
      }
      if (result.diffStat) {
        console.log(`\n${result.diffStat}`);
      }
      if (feature) {
        console.log(`\nAnswer key: ${join(feature.dir, "REVIEW.md")}`);
      }
    },
  );

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
