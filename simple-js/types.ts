// biome-ignore lint/suspicious/noExplicitAny: Using a generic type T with a default of any to allow flexibility in argument types.
export type Arg<T = any> =
  | {
      type: "flag";
      flag: string;
      description?: string;
      defaultValue?: T;
    }
  | {
      type: "arg";
      arg: string;
      description?: string;
      defaultValue?: T;
    };

/** Metadata used to filter or weight challenges when picking one. */
export type Tags = {
  /** How hard the challenge is for a candidate who has not seen it before. */
  difficulty: "easy" | "medium" | "hard";
  /** Topics the challenge exercises, e.g. "strings", "recursion". */
  topics: string[];
  /** Rough time a candidate should need, in minutes. */
  minutes: number;
};

/** The shape every `<name>-challenge/index.ts` module is expected to export. */
export type ChallengeModule = {
  // biome-ignore lint/suspicious/noExplicitAny: Positional args and options are typed per challenge.
  main: (...args: any[]) => void | Promise<void>;
  description?: string;
  args?: Arg[];
  tags?: Tags;
};
