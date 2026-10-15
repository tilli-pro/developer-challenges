/**
 * The chunk challenge.
 *
 * Split `items` into consecutive groups of `size` elements each. The final
 * group may be smaller if the items do not divide evenly.
 *
 * Examples:
 *   chunk([1, 2, 3, 4, 5], 2) -> [[1, 2], [3, 4], [5]]
 *   chunk([1, 2, 3], 5)       -> [[1, 2, 3]]
 *   chunk([], 2)              -> []
 *
 * @param items The list to split up.
 * @param size The maximum number of items per group (at least 1).
 */
const chunk = (items: number[], size: number): number[][] => {
  return [];
};

export const main = (items: number[], size = 2) => {
  console.log("Items:", items);
  console.log("Chunk size:", size);
  console.log("Chunks:\n", chunk(items, size));
};
