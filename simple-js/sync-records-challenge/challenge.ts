export type Record = { id: string; name: string };

export type Diff = {
  created: Record[];
  updated: Record[];
  deleted: Record[];
};

/**
 * The sync records challenge.
 *
 * You have the list of records as they were (say, rows already in your
 * database) and the list as they are now (say, the latest export from a
 * third-party API). Work out what changed so you can apply the minimum set
 * of writes. Records are matched by `id`. A record is:
 *   - created when its id is only in the new list,
 *   - deleted when its id is only in the old list,
 *   - updated when its id is in both but the name differs.
 * Records that are in both lists and unchanged are not reported. Order of
 * the input lists does not matter. Return the new version of each updated
 * record.
 *
 * Example:
 *   diffRecords(
 *     [{ id: "1", name: "Ada" }, { id: "2", name: "Ben" }, { id: "3", name: "Cara" }],
 *     [{ id: "1", name: "Ada" }, { id: "2", name: "Benjamin" }, { id: "4", name: "Dee" }],
 *   ) -> {
 *     created: [{ id: "4", name: "Dee" }],
 *     updated: [{ id: "2", name: "Benjamin" }],
 *     deleted: [{ id: "3", name: "Cara" }],
 *   }
 *
 * @param oldRecords The records as they were.
 * @param newRecords The records as they are now.
 */
const diffRecords = (oldRecords: Record[], newRecords: Record[]): Diff => {
  return { created: [], updated: [], deleted: [] };
};

export const main = (oldRecords: Record[], newRecords: Record[]) => {
  console.log("Old:", oldRecords);
  console.log("New:", newRecords);
  console.log("Diff:\n", diffRecords(oldRecords, newRecords));
};
