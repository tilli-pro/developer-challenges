import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (
  template: string,
  args: { data: string; fallback: string },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(template, JSON.parse(args.data), args.fallback);
  }
};

export const description =
  "Fill a template like 'Hello {{user.name}}' from a data object, with a fallback for missing values.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["strings", "regex", "objects"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[template]",
    description: "The template text with {{dot.path}} placeholders.",
    defaultValue: () =>
      pick([
        "Hello {{user.name}}, your order #{{order.id}} of {{order.items}} items totals {{order.total}} USD.",
        "Hi {{ user.name }}! We'll ship to {{user.address.city}}. Questions? Reply to {{support.email}}.",
        "{{user.name}} ({{user.email}}) has {{order.items}} items. Discount: {{order.discount}}.",
        "Dear {{user.title}} {{user.name}}, your plan is {{user.plan}}. Active: {{user.active}}.",
      ]),
  },
  {
    type: "flag",
    flag: "--data, -d [JSON]",
    description: "The data object to read values from, in JSON format.",
    defaultValue:
      '{"user":{"name":"Ada","email":"ada@example.com","active":false,"address":{"city":"London"}},"order":{"id":1042,"items":3,"total":59.5,"discount":0}}',
  },
  {
    type: "flag",
    flag: "--fallback, -f [TEXT]",
    description: "Text to render for a placeholder whose value is missing.",
    defaultValue: "",
  },
] as const;
