import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { Command, InvalidArgumentError, Option } from "commander";
import type { ChallengeModule, Tags } from "./types";
import { pick } from "./utils";

const rootDir = import.meta.dirname;

type Challenge = { dir: string; module: ChallengeModule };

const loadChallenge = async (dir: string): Promise<Challenge | null> => {
  if (!dir.endsWith("-challenge")) {
    return null;
  }
  const fullDirPath = join(rootDir, dir);
  const stats = await stat(fullDirPath);
  if (!stats.isDirectory()) {
    return null;
  }
  const files = await readdir(fullDirPath);
  if (!files.includes("index.ts")) {
    return null;
  }
  const module: ChallengeModule | null = await import(fullDirPath).catch(
    () => null,
  );
  if (typeof module?.main !== "function") {
    console.warn(
      `Challenge "${dir}" does not export a main function. Skipping.`,
    );
    return null;
  }
  return { dir, module };
};

const challenges = (
  await Promise.all((await readdir(rootDir)).map(loadChallenge))
)
  .filter((challenge): challenge is Challenge => challenge !== null)
  .sort((a, b) => a.dir.localeCompare(b.dir));

const program = new Command();
program
  .name("developer-challenges")
  .description("CLI to invoke and run responses for developer challenges");

// --- run <challenge> -------------------------------------------------------
//
// Each challenge is a subcommand of `run`, so it owns its own positional
// arguments and flags. `run anagram` and `run anagram-challenge` are the same.

const run = program
  .command("run")
  .alias("r")
  .description("Run a challenge by name. The -challenge suffix is optional.");

const resolveDefault = <T>(value: T | (() => T) | undefined) =>
  typeof value === "function" ? (value as () => T)() : value;

for (const { dir, module } of challenges) {
  const { description, args, main } = module;
  const command = run
    .command(dir)
    .alias(dir.replace(/-challenge$/, ""))
    .description(description ?? "<CHALLENGE NEEDS DESCRIPTION>");
  for (const arg of args ?? []) {
    if (arg.type === "flag") {
      command.option(
        arg.flag,
        arg.description,
        resolveDefault(arg.defaultValue),
      );
    } else {
      command.argument(
        arg.arg,
        arg.description,
        resolveDefault(arg.defaultValue),
      );
    }
  }
  command.action((...actionArgs) => main(...actionArgs));
}

// --- random ----------------------------------------------------------------

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

type RandomOptions = {
  difficulty?: Tags["difficulty"];
  topics?: string[];
  maxMinutes?: number;
};

const parseTopics = (value: string) =>
  value
    .split(",")
    .map((topic) => topic.trim().toLowerCase())
    .filter((topic) => topic.length > 0);

const parseMinutes = (value: string) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new InvalidArgumentError("Expected a positive number of minutes.");
  }
  return minutes;
};

/**
 * A challenge matches when it satisfies every filter that was given. If any
 * filter is given, challenges without a `tags` export never match.
 */
const matchesFilters = (tags: Tags | undefined, options: RandomOptions) => {
  const { difficulty, topics, maxMinutes } = options;
  if (!difficulty && !topics && maxMinutes === undefined) {
    return true;
  }
  if (!tags) {
    return false;
  }
  if (difficulty && tags.difficulty !== difficulty) {
    return false;
  }
  if (topics && !topics.some((topic) => tags.topics.includes(topic))) {
    return false;
  }
  if (maxMinutes !== undefined && tags.minutes > maxMinutes) {
    return false;
  }
  return true;
};

program
  .command("random")
  .alias("rng")
  .description("Run a random challenge, optionally filtered by its tags.")
  .addOption(
    new Option(
      "-d, --difficulty <level>",
      "Only challenges with this difficulty.",
    ).choices(DIFFICULTIES),
  )
  .option(
    "-t, --topics <topics>",
    "Comma-separated topics. A challenge matches if it has at least one of them.",
    parseTopics,
  )
  .option(
    "-m, --max-minutes <minutes>",
    "Only challenges expected to take at most this many minutes.",
    parseMinutes,
  )
  .action(async (options: RandomOptions) => {
    const matching = challenges.filter(({ module }) =>
      matchesFilters(module.tags, options),
    );
    if (matching.length === 0) {
      console.warn(
        challenges.length === 0
          ? "No challenges available to run."
          : "No challenges match the given filters.",
      );
      return;
    }
    const { dir, module } = pick(matching);
    const subcommand = run.commands.find((cmd) => cmd.name() === dir);
    console.log(
      `Running random challenge: "${dir}" (1 of ${matching.length} matching)`,
    );
    if (module.tags) {
      console.log("TAGGED:");
      for (const tag in module.tags) {
        console.log(`  ${tag}: ${module.tags[tag as keyof Tags]}`);
      }
    }
    console.log("\n");
    // Parse the chosen subcommand with no user args so its generated
    // defaults are applied and its action runs just like a direct invocation.
    await subcommand?.parseAsync([], { from: "user" });
  });

program.parse();
