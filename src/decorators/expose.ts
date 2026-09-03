import { coerceValue } from "../core/coerce.js";
import { getMethodMetas, getParamMetas } from "../core/metadata-registry.js";
import { buildInputSchema } from "../core/schema.js";
import type { MethodMeta, ToolOptions } from "../core/types.js";

type Constructor = new (...args: any[]) => any;
type PropertyKey = string | symbol;

/**
 * @Expose() — class level.
 *
 * Marks a class as a "tool provider". On instantiation, it automatically
 * registers every method annotated with @Explain against
 * `document.modelContext.registerTool()`, using @Param metadata to build
 * each one's `inputSchema`.
 *
 * Registration happens per instance (not when the class is declared), so
 * the developer controls when each tool gets exposed simply by deciding
 * when to do `new MyController()`.
 */
export function Expose(): <T extends Constructor>(target: T) => T {
  return function <T extends Constructor>(Target: T): T {
    // Captured at the moment the class is decorated: by then all of its
    // members' @Explain/@Param decorators have already run (see
    // metadata-registry.ts for the decorator execution order).
    const prototype = Target.prototype;
    const methodMetas = getMethodMetas(prototype);

    class Exposed extends Target {
      constructor(...args: any[]) {
        super(...args);
        registerTools(this, prototype, methodMetas);
      }
    }

    Object.defineProperty(Exposed, "name", { value: Target.name });
    return Exposed;
  };
}

function registerTools(
  instance: any,
  prototype: object,
  methodMetas: Map<PropertyKey, MethodMeta>
): void {
  const modelContext = typeof document !== "undefined" ? document.modelContext : undefined;

  if (!modelContext) {
    console.warn(
      "[Quibix] document.modelContext is not available in this environment; " +
        "no tools were registered. Did you run this outside a WebMCP-capable browser?"
    );
    return;
  }

  for (const [propertyKey, meta] of methodMetas) {
    const paramMetas = getParamMetas(prototype, propertyKey);
    const methodName = String(propertyKey);

    const tool: ModelContextTool = {
      name: methodName,
      description: buildDescription(meta.description, meta.options),
      inputSchema: buildInputSchema(paramMetas),
      annotations: {
        readOnlyHint: meta.options.type === "query",
      },
      execute: async (input) => {
        const args = paramMetas.map((param) => coerceValue(input?.[param.name], param.type));
        return instance[propertyKey](...args);
      },
    };

    if (meta.options.type === "query" && meta.options.fallbackUrl) {
      // Non-standard Quibix extension — see src/types/webmcp.ts.
      tool.fallbackUrl = meta.options.fallbackUrl;
    }

    modelContext.registerTool(tool).catch((err: unknown) => {
      console.error(`[Quibix] Failed to register tool "${methodName}":`, err);
    });
  }
}

function buildDescription(description: string, options: ToolOptions): string {
  if (options.type === "query" && options.fallbackUrl) {
    return `${description}\n\nFallback if you can't run this tool live: ${options.fallbackUrl}`;
  }
  return description;
}
