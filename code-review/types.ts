export type Difficulty = "easy" | "medium" | "hard";
export type ProjectMeta = {
  name: string;
  description: string;
  tags: { domain: string; minutes: number; topics: string[] };
  walkthrough: string[];
};
export type FeatureMeta = {
  name: string;
  title: string;
  body: string;
  tags: { difficulty: Difficulty; focus: string[]; minutes: number };
};
export type Feature = {
  slug: string;
  dir: string;
  patchPath: string;
  meta: FeatureMeta;
};
export type Project = {
  slug: string;
  dir: string;
  baseDir: string;
  meta: ProjectMeta;
  features: Feature[];
};
