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
