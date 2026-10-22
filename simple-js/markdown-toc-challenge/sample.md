# Developer Challenges CLI

A small command line tool for running interview exercises locally. Each
challenge lives in its own folder with a stub for the candidate to fill in.

<!-- toc -->

- [Stale entry that should be replaced](#stale)

<!-- /toc -->

## Install

Clone the repository and install dependencies with pnpm:

```sh
pnpm install
```

## Usage

Challenges are run through the `sj` script. Headings inside this code block
must be ignored by the parser:

```md
# Not a real heading
## Also not a heading
```

### Listing challenges

The `list` command prints every challenge with its tags.

### Examples

```sh
pnpm sj list
pnpm sj list --difficulty easy
```

#### Filtering by topic

This H4 is below the default depth and must not appear in the TOC.

## Using `pnpm sj` (CLI)

The CLI accepts a challenge name with or without the `-challenge` suffix.

### Random challenge

Pick one at random, optionally filtered by tags.

### Examples

```sh
pnpm sj random
pnpm sj random --max-minutes 15
```

## Writing a Challenge

Every challenge is a folder ending in `-challenge` with three files.

### Files & Layout

- `index.ts` parses the command line arguments.
- `challenge.ts` holds the stub the candidate completes.
- `SOLUTION.md` is kept out of the public repository.

### Tags

Tags are used to filter and to pick a random challenge.

## Contributing

Open a pull request with a new folder. Keep it fizzbuzz-sized.

## License

MIT
