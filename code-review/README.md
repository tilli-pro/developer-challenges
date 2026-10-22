# Code-review challenges

A second class of interview challenge alongside `simple-js`. Instead of writing
code, the candidate reviews it. Each challenge is a small, realistic Node.js
service plus a pool of feature pull requests against it.

An interview spends about 45 minutes walking through the base service and about
45 minutes reviewing one feature PR. The interviewer runs one command, gets a git
repository with a `main` branch and a feature branch, and has a private answer
key covering what the PR gets wrong, what it gets right, and what to ask next.

## Setup

```sh
pnpm install
pnpm cr list
```

## Authoring workflow

1. Build the base in `projects/<slug>/base/` until `pnpm typecheck`,
   `pnpm test` and `pnpm lint` (run from `base/`) pass and the file count is
   20 or fewer.
2. Run `pnpm cr prepare <slug>` with no feature to get a base-only repository
   under `.work/<slug>`.
3. In that repository, create a feature branch, implement the feature with its
   planted issues, and commit.
4. Run `pnpm cr regen <slug> <feature> --from .work/<slug>` to write
   `changes.patch` into `projects/<slug>/features/<feature>/`.
5. Write `feature.json` and `REVIEW.md` in the same directory.
6. Run `pnpm cr check <slug>`. It must pass for every feature of the project
   before it is considered done. `pnpm cr check` with no argument runs every
   feature and takes several minutes.

Base changes after features exist require re-running `pnpm cr check`. Fix any
patch that no longer applies by preparing, rebasing the feature branch, and
running `pnpm cr regen` again.

`REVIEW.md` is gitignored on purpose: it is the answer key. It exists only on
the authoring machine, so share it with interviewers out of band, never
through this repository.

## Interview script

To be written in phase 3.

## Rubric

To be written in phase 3.
