/**
 * The template render challenge.
 *
 * Replace every `{{path}}` placeholder in `template` with the value found at
 * that dot-separated path in `data`. Whitespace inside the braces is allowed,
 * so `{{ user.name }}` and `{{user.name}}` are the same placeholder.
 *
 * A placeholder whose value is missing, `null` or `undefined` renders as
 * `fallback`. Every other value is converted to a string, so `0` and `false`
 * render as "0" and "false", not as the fallback.
 *
 * Examples (with data = { user: { name: "Ada" }, order: { items: 3, discount: 0 } }):
 *   render("Hello {{user.name}}!", data, "")      -> "Hello Ada!"
 *   render("{{ order.items }} items", data, "")   -> "3 items"
 *   render("Discount: {{order.discount}}", data, "?") -> "Discount: 0"
 *   render("Hi {{user.nick}}", data, "friend")    -> "Hi friend"
 *
 * @param template The text containing placeholders.
 * @param data The object to read values from.
 * @param fallback What to render when a value is missing.
 */
const render = (
  template: string,
  data: Record<string, unknown>,
  fallback: string,
): string => {
  return "";
};

export const main = (
  template: string,
  data: Record<string, unknown>,
  fallback: string,
) => {
  console.log("Template:", template);
  console.log("Data:", JSON.stringify(data));
  console.log("Fallback:", JSON.stringify(fallback));
  console.log("Rendered:\n", render(template, data, fallback));
};
