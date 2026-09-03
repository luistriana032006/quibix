import type { ParamType } from "./types.js";

/**
 * Defensive type coercion: most WebMCP runtimes hand back an object
 * already typed per the JSON Schema, but not every agent honors that to
 * the letter (e.g. sending "true"/"42" as a string). This function is
 * the fallback, not the primary path.
 */
export function coerceValue(value: unknown, type: ParamType): unknown {
  if (value === undefined || value === null) return value;

  switch (type) {
    case "number": {
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
      }
      return value;
    }
    default:
      // "string", "object" and "array" pass through as-is: there's no
      // safe defensive coercion from string -> object/array without
      // losing information or risking a silently wrong parse.
      return value;
  }
}
