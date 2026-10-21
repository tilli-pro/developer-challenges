import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import {
  findFeature,
  findProject,
  loadProjects,
  matchesFilters,
} from "../lib/projects";
import type { Feature, Project } from "../types";

const fixturesDir = join(import.meta.dirname, "fixtures", "projects");

const feature: Feature = {
  slug: "f",
  dir: "/f",
  patchPath: "/f/changes.patch",
  meta: {
    name: "f",
    title: "F",
    body: "",
    tags: { difficulty: "medium", focus: ["security", "tests"], minutes: 20 },
  },
};
const project: Project = {
  slug: "p",
  dir: "/p",
  baseDir: "/p/base",
  meta: {
    name: "p",
    description: "",
    tags: { domain: "web", minutes: 90, topics: [] },
    walkthrough: [],
  },
  features: [feature],
};

test("loadProjects skips a project without project.json and a feature without a patch", async () => {
  const { projects, warnings } = await loadProjects(fixturesDir);
  assert.deepEqual(
    projects.map((p) => p.slug),
    ["demo"],
  );
  assert.equal(projects[0]?.features.length, 0);
  assert.ok(warnings.some((w) => w.includes("broken")));
  assert.ok(warnings.some((w) => w.includes("hello")));
});

test("findProject and findFeature throw on unknown slugs", () => {
  assert.equal(findProject([project], "p"), project);
  assert.equal(findFeature(project, "f"), feature);
  assert.throws(() => findProject([project], "x"), /Unknown project: x/);
  assert.throws(() => findFeature(project, "x"), /Unknown feature: p\/x/);
});

test("matchesFilters uses any-of for focus and feature minutes for maxMinutes", () => {
  assert.equal(matchesFilters(project, feature, {}), true);
  assert.equal(
    matchesFilters(project, feature, { focus: ["tests", "x"] }),
    true,
  );
  assert.equal(matchesFilters(project, feature, { focus: ["x"] }), false);
  assert.equal(matchesFilters(project, feature, { maxMinutes: 20 }), true);
  assert.equal(matchesFilters(project, feature, { maxMinutes: 19 }), false);
  assert.equal(matchesFilters(project, feature, { difficulty: "hard" }), false);
  assert.equal(matchesFilters(project, feature, { domain: "web" }), true);
  assert.equal(matchesFilters(project, feature, { domain: "cli" }), false);
});
