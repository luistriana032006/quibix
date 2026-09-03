import { addParamMeta } from "../core/metadata-registry.js";
import type { ParamType } from "../core/types.js";

/**
 * @Param(name, type, description) — parameter level.
 *
 * Automatically generates this parameter's JSON Schema fragment and
 * enables defensive type coercion at call time, so the developer never
 * writes the parsing by hand.
 *
 * `name` is the name exposed to the agent (the JSON Schema key); it
 * doesn't have to match the TypeScript parameter's name.
 *
 * Requires one parameter decorator per method argument you want to
 * expose — a parameter without @Param doesn't show up in the schema and
 * isn't passed to the agent.
 */
export function Param(name: string, type: ParamType, description: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) {
      // A constructor parameter, not a method's — out of scope for Quibix.
      return;
    }
    addParamMeta(target, propertyKey, { index: parameterIndex, name, type, description });
  };
}
