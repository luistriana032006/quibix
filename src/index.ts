// Side effect: brings the ambient declarations for `document.modelContext`
// into the program (and into the .d.ts published in dist/) for whoever
// consumes Quibix from TypeScript. src/types/webmcp.ts exports nothing
// at runtime — it's deliberately a regular .ts file (not .d.ts) so tsc
// actually copies it into dist/, which it doesn't do for input .d.ts files.
import "./types/webmcp.js";

export { Expose } from "./decorators/expose.js";
export { Explain } from "./decorators/explain.js";
export { Param } from "./decorators/param.js";

export type { ParamType, ToolKind, ToolOptions } from "./core/types.js";
