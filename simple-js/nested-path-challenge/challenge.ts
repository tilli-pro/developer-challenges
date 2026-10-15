/**
 * The nested path challenge.
 *
 * Read a value out of a nested object using a dot-separated path, such as
 * "user.address.city". Return `undefined` if any part of the path is missing.
 *
 * Examples (with obj = { user: { name: "Ada", address: { city: "London" } } }):
 *   getPath(obj, "user.name")         -> "Ada"
 *   getPath(obj, "user.address.city") -> "London"
 *   getPath(obj, "user.phone.number") -> undefined
 *
 * @param obj The object to read from.
 * @param path The dot-separated path to the value.
 */
const getPath = (obj: Record<string, unknown>, path: string): unknown => {
  return undefined;
};

export const main = (obj: Record<string, unknown>, path: string) => {
  console.log("Object:", JSON.stringify(obj, null, 2));
  console.log("Path:", path);
  console.log("Value at path:\n", getPath(obj, path));
};
