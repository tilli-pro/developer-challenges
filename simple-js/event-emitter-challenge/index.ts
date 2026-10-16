import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (script: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const steps = script.split(",").map((s) => s.trim());
    await challengeModule.main(steps);
  }
};

export const description =
  "Implement a minimal event emitter with on, off, once and emit.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["classes", "closures", "callbacks"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[script]",
    description:
      'Comma-separated steps: "on:evt", "once:evt", "off:evt" (removes the latest listener) or "emit:evt[:arg]".',
    defaultValue: () =>
      pick([
        "on:save,on:save,emit:save:doc1,off:save,emit:save:doc2",
        "once:login,emit:login:ada,emit:login:ben",
        "on:a,emit:b,emit:a:1",
        "on:tick,once:tick,emit:tick:1,emit:tick:2,off:tick,emit:tick:3",
      ]),
  },
] as const;
