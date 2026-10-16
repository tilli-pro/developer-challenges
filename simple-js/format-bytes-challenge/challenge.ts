/**
 * The format bytes challenge.
 *
 * Turn a raw byte count into the kind of size label a file browser shows.
 * Use base 1024 and the units B, KB, MB, GB, TB and PB. Pick the largest
 * unit where the value is at least 1. Show `decimals` decimal places, except
 * for whole bytes, which show none. Zero is "0 B".
 *
 * Examples (decimals = 1):
 *   formatBytes(0)              -> "0 B"
 *   formatBytes(512)            -> "512 B"
 *   formatBytes(1024)           -> "1.0 KB"
 *   formatBytes(1536)           -> "1.5 KB"
 *   formatBytes(1048576)        -> "1.0 MB"
 *   formatBytes(2470000000)     -> "2.3 GB"
 *   formatBytes(1536, 2)        -> "1.50 KB"
 *
 * @param bytes The number of bytes. Non-negative.
 * @param decimals How many decimal places to show above bytes.
 */
const formatBytes = (bytes: number, decimals: number): string => {
  return "";
};

export const main = (bytes: number, decimals: number) => {
  console.log("Bytes:", bytes);
  console.log("Decimals:", decimals);
  console.log("Formatted:\n", formatBytes(bytes, decimals));
};
