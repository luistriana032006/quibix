import { setMethodMeta } from "../core/metadata-registry.js";
import type { ToolOptions } from "../core/types.js";

/**
 * @Explain(description, options) — method level.
 *
 * Declares a method as a tool the agent can invoke. `@Expose()` on the
 * containing class is what actually registers it against
 * `document.modelContext` — this decorator only captures the metadata.
 *
 * - type: "query"  → read-only (GET). Supports `fallbackUrl`.
 * - type: "action" → executes/mutates real logic (POST). `fallbackUrl`
 *   doesn't apply: there's no useful result without running the tool live.
 */
export function Explain(description: string, options: ToolOptions): MethodDecorator {
  return (target, propertyKey) => {
    if (options.type === "action" && options.fallbackUrl) {
      console.warn(
        `[Quibix] "${String(propertyKey)}" is type: "action" but declares fallbackUrl. ` +
          "fallbackUrl only has an effect on type: \"query\" tools; it will be ignored."
      );
    }

    setMethodMeta(target, propertyKey, { description, options });
  };
}
