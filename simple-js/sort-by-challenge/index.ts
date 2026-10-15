import type { Arg } from "../types";
import { pick, sample } from "../utils";
import type { Person } from "./challenge";

export const main = async (people: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedPeople: Person[] = people.split(",").map((entry) => {
      const [name, age] = entry.trim().split(":");
      return { name: name ?? "", age: Number(age) };
    });
    await challengeModule.main(parsedPeople);
  }
};

export const description =
  "Sort a list of people by age, then alphabetically by name.\n";
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[people]",
    description:
      'Comma-separated list of name:age pairs, e.g. "Cara:30,Ben:25,Abe:30".',
    defaultValue: () =>
      sample(["Abe", "Ben", "Cara", "Dee", "Eli", "Fay", "Gus"], 5)
        .map((name) => `${name}:${pick([19, 25, 30])}`)
        .join(","),
  },
] as const;
