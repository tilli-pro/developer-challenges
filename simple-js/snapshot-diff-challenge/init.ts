/**
 * Diff helpers from the `diff` package.
 *
 * `createTwoFilesPatch(oldName, newName, oldText, newText)` returns a
 * unified diff as a string, the same format `git diff` prints. `diffLines`
 * returns the raw change objects if you want to build your own output.
 */
export { createTwoFilesPatch, diffLines } from "diff";
