import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { Command } from "commander";
import { pick } from "./utils";

const rootDir = import.meta.dirname;
const rootFiles = await readdir(import.meta.dirname);

const findChallenges = async (dir: string) => {
  const isChallengeDirectory = dir.endsWith("-challenge");
  const fullDirPath = join(rootDir, dir);
  const stats = await stat(fullDirPath);

  if (!stats.isDirectory()) {
    return { dir, isDirectory: false, isChallengeDirectory: false };
  } else if (!isChallengeDirectory) {
    return { dir, isDirectory: true, isChallengeDirectory: false };
  }

  const files = await readdir(dir);
  if (files.includes("index.ts")) {
    const filePath = fullDirPath;
    return {
      dir,
      isDirectory: true,
      isChallengeDirectory: true,
      challengeModule: await import(filePath).catch(() => null),
    };
  } else {
    return {
      dir,
      isDirectory: true,
      isChallengeDirectory: true,
      challengeModule: null,
    };
  }
};

const dirs = await Promise.all(rootFiles.map(findChallenges));

const program = new Command();
program
  .name("developer-challenges")
  .description("CLI to invoke and run responses for developer challenges");

const challenges = dirs.filter(
  ({ isChallengeDirectory, challengeModule }) =>
    isChallengeDirectory && typeof challengeModule?.main === "function",
);

challenges.forEach(({ dir, isChallengeDirectory, challengeModule }) => {
  if (isChallengeDirectory && challengeModule) {
    const { description, main, args } = challengeModule;
    if (!main) {
      console.warn(
        `Challenge "${dir}" does not export a main function. Skipping.`,
      );
      return;
    }
    const newChallenge = program.command(dir);
    newChallenge.description(description ?? "<CHALLENGE NEEDS DESCRIPTION>");
    if (args && Array.isArray(args)) {
      args.forEach((arg) => {
        if (arg.type === "flag") {
          newChallenge.option(
            arg.flag,
            arg.description,
            typeof arg.defaultValue === "function"
              ? arg.defaultValue()
              : arg.defaultValue,
          );
        } else if (arg.type === "arg") {
          newChallenge.argument(
            arg.arg,
            arg.description,
            typeof arg.defaultValue === "function"
              ? arg.defaultValue()
              : arg.defaultValue,
          );
        }
      });
    }
    newChallenge.action((...args) => main(...args));
  }
});

program
  .command("random")
  .alias("r")
  .description("Run a random challenge")
  .action(async () => {
    if (challenges.length === 0) {
      console.warn("No challenges available to run.");
      return;
    }
    const { dir } = pick(challenges);
    const subcommand = program.commands.find((cmd) => cmd.name() === dir);
    console.log(`Running random challenge: "${dir}"`);
    // Parse the chosen subcommand with no user args so its generated
    // defaults are applied and its action runs just like a direct invocation.
    await subcommand?.parseAsync([], { from: "user" });
  });

program.parse();
