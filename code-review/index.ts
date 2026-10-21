import { join } from "node:path";
import { Command, InvalidArgumentError, Option } from "commander";
import { type Filters, loadProjects, matchesFilters } from "./lib/projects";

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

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
