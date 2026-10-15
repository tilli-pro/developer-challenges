export type Person = { name: string; age: number };

/**
 * The sort by challenge.
 *
 * Sort a list of people by age, youngest first. When two people have the same
 * age, order them alphabetically by name. Return a new sorted array without
 * modifying the input.
 *
 * Example:
 *   sortPeople([
 *     { name: "Cara", age: 30 },
 *     { name: "Ben", age: 25 },
 *     { name: "Abe", age: 30 },
 *   ]) -> [
 *     { name: "Ben", age: 25 },
 *     { name: "Abe", age: 30 },
 *     { name: "Cara", age: 30 },
 *   ]
 *
 * @param people The list of people to sort.
 */
const sortPeople = (people: Person[]): Person[] => {
  return [];
};

export const main = (people: Person[]) => {
  console.log("People:", people);
  console.log("Sorted by age, then name:\n", sortPeople(people));
};
