import type { ParamMeta, ParamType } from "./types.js";

const JSON_SCHEMA_TYPE: Record<ParamType, string> = {
  string: "string",
  number: "number",
  boolean: "boolean",
  object: "object",
  array: "array",
};

/** Builds the `inputSchema` (JSON Schema) that `registerTool` expects, from @Param metadata. */
export function buildInputSchema(params: ParamMeta[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of params) {
    properties[param.name] = {
      type: JSON_SCHEMA_TYPE[param.type],
      description: param.description,
    };
    required.push(param.name);
  }

  return {
    type: "object",
    properties,
    required,
  };
}
