/** Primitive parameter types Quibix knows how to describe and coerce. */
export type ParamType = "string" | "number" | "boolean" | "object" | "array";

/** Metadata captured by @Param for a method's positional parameter. */
export interface ParamMeta {
  /** Positional index of the parameter in the method's signature. */
  index: number;
  /** Name exposed to the agent in the JSON Schema (doesn't have to match the TS parameter name). */
  name: string;
  type: ParamType;
  description: string;
}

/** "query" = read-only (GET). "action" = executes/mutates real logic (POST). */
export type ToolKind = "query" | "action";

export interface ToolOptions {
  type: ToolKind;
  /**
   * Only has an effect when type === "query". Fallback URL for agents
   * that can't execute the tool interactively (see README, "Fallback
   * declarativo de URL" section).
   */
  fallbackUrl?: string;
}

/** Metadata captured by @Explain for a method. */
export interface MethodMeta {
  description: string;
  options: ToolOptions;
}
