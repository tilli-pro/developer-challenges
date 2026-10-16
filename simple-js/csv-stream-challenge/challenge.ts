import { sampleFilePath } from "./init";

/**
 * The CSV stream challenge.
 *
 * Read the CSV file at `filePath` and return one object per data row, keyed
 * by the column names in the first (header) row.
 *
 * The file may be larger than memory, so read it line by line with
 * `node:readline` (`createInterface` over `createReadStream`) rather than
 * loading it all with `readFile`.
 *
 * Fields are separated by commas. A field may be wrapped in double quotes,
 * in which case:
 *   - it may contain commas,
 *   - a doubled quote `""` inside it is a literal quote character,
 *   - it may span multiple lines (the newline is part of the value).
 *
 * Example (for the bundled sample.csv):
 *   parseCsv(sampleFilePath) -> [
 *     { id: "1", name: "Ada Lovelace", email: "ada@example.com", notes: "First programmer" },
 *     { id: "2", name: "Babbage, Charles", email: "charles@example.com", notes: "..." },
 *     { id: "3", name: "Grace Hopper", email: "...", notes: 'Coined the term "bug" in 1947' },
 *     ...
 *   ]
 *
 * @param filePath Path to the CSV file to parse.
 */
const parseCsv = async (
  filePath: string,
): Promise<Record<string, string>[]> => {
  return [];
};

export const main = async (filePath = sampleFilePath, limit = 5) => {
  console.log("File:", filePath);
  const rows = await parseCsv(filePath);
  console.log(
    `Parsed ${rows.length} rows. First ${limit}:\n`,
    rows.slice(0, limit),
  );
};
