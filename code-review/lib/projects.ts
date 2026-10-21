import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type {
  Difficulty,
  Feature,
  FeatureMeta,
  Project,
  ProjectMeta,
} from "../types";

const readJson = async <T>(path: string) =>
  JSON.parse(await readFile(path, "utf8")) as T;

const subdirs = async (dir: string) =>
  (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

/** Reads `features/<slug>/feature.json`; `patchPath` is set even if changes.patch does not exist yet. */
export const loadFeature = async (
  projectDir: string,
  slug: string,
): Promise<Feature> => {
  const dir = join(projectDir, "features", slug);
  const metaPath = join(dir, "feature.json");
  if (!existsSync(metaPath)) {
    throw new Error(`Unknown feature: ${basename(projectDir)}/${slug}`);
  }
  return {
    slug,
    dir,
    patchPath: join(dir, "changes.patch"),
    meta: await readJson<FeatureMeta>(metaPath),
  };
};

const loadFeatures = async (
  projectSlug: string,
  projectDir: string,
  warnings: string[],
) => {
  const featuresDir = join(projectDir, "features");
  if (!existsSync(featuresDir)) {
    return [];
  }
  const features: Feature[] = [];
  for (const slug of await subdirs(featuresDir)) {
    const dir = join(featuresDir, slug);
    const patchPath = join(dir, "changes.patch");
    if (!existsSync(join(dir, "feature.json")) || !existsSync(patchPath)) {
      warnings.push(
        `Skipping feature ${projectSlug}/${slug}: needs feature.json and changes.patch`,
      );
      continue;
    }
    features.push(await loadFeature(projectDir, slug));
  }
  return features;
};

/** Reads every project under `projectsDir`; incomplete entries are skipped with a warning. */
export const loadProjects = async (projectsDir: string) => {
  const projects: Project[] = [];
  const warnings: string[] = [];
  for (const slug of await subdirs(projectsDir)) {
    const dir = join(projectsDir, slug);
    const baseDir = join(dir, "base");
    if (!existsSync(join(dir, "project.json")) || !existsSync(baseDir)) {
      warnings.push(`Skipping project ${slug}: needs project.json and base/`);
      continue;
    }
    projects.push({
      slug,
      dir,
      baseDir,
      meta: await readJson<ProjectMeta>(join(dir, "project.json")),
      features: await loadFeatures(slug, dir, warnings),
    });
  }
  return { projects, warnings };
};

export const findProject = (projects: Project[], slug: string) => {
  const project = projects.find((candidate) => candidate.slug === slug);
  if (!project) {
    throw new Error(`Unknown project: ${slug}`);
  }
  return project;
};

export const findFeature = (project: Project, slug: string) => {
  const feature = project.features.find((candidate) => candidate.slug === slug);
  if (!feature) {
    throw new Error(`Unknown feature: ${project.slug}/${slug}`);
  }
  return feature;
};

export type Filters = {
  difficulty?: Difficulty;
  focus?: string[];
  domain?: string;
  maxMinutes?: number;
};

/** A feature matches when it satisfies every filter that was given. */
export const matchesFilters = (
  project: Project,
  feature: Feature,
  { difficulty, focus, domain, maxMinutes }: Filters,
) => {
  const { tags } = feature.meta;
  if (difficulty && tags.difficulty !== difficulty) {
    return false;
  }
  if (focus && !focus.some((item) => tags.focus.includes(item))) {
    return false;
  }
  if (domain && project.meta.tags.domain !== domain) {
    return false;
  }
  if (maxMinutes !== undefined && tags.minutes > maxMinutes) {
    return false;
  }
  return true;
};
