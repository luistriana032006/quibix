/**
 * Ambient declarations for the native WebMCP API.
 *
 * `document.modelContext` isn't part of `lib.dom.d.ts` yet (it's an
 * experimental API, spec by the W3C WebML Community Group), so Quibix
 * declares it here by hand, following the shape described at
 * https://webmachinelearning.github.io/webmcp/
 *
 * Important spec detail: `execute` receives the already-parsed input as
 * a direct object (NOT wrapped in `{ params: ... }`), and "unregistering"
 * a tool is done by passing an `AbortSignal` in the registration
 * options — there is no `.remove()` method.
 */

export {};

declare global {
  interface ModelContextToolExecuteOptions {
    signal: AbortSignal;
  }

  interface ModelContextToolAnnotations {
    /** true if the tool is read-only (doesn't mutate state). */
    readOnlyHint?: boolean;
    /** true if the result may contain untrusted content. */
    untrustedContentHint?: boolean;
    [key: string]: unknown;
  }

  interface ModelContextTool {
    /** Unique identifier: 1-128 chars, alphanumeric + `_` `-` `.` */
    name: string;
    description: string;
    title?: string;
    inputSchema?: Record<string, unknown>;
    annotations?: ModelContextToolAnnotations;
    execute: (
      input: Record<string, unknown>,
      options: ModelContextToolExecuteOptions
    ) => unknown | Promise<unknown>;
    /**
     * NON-standard Quibix extension (not part of the WebMCP spec):
     * fallback URL for "query"-type tools, meant for agents that can't
     * execute the tool interactively. Strict WebMCP engines that
     * validate the object's shape can safely ignore it — that's why
     * Quibix also embeds it into `description`.
     */
    fallbackUrl?: string;
  }

  interface ModelContextRegisterToolOptions {
    /** Origins where the tool is exposed. Defaults to the tool's own origin. */
    exposedTo?: string[];
    /** Unregisters the tool when aborted. It's the only "unregister" mechanism. */
    signal?: AbortSignal;
  }

  interface RegisteredTool {
    name: string;
    description: string;
    title?: string;
    inputSchema?: Record<string, unknown>;
    annotations?: ModelContextToolAnnotations;
  }

  interface ModelContext {
    registerTool(
      tool: ModelContextTool,
      options?: ModelContextRegisterToolOptions
    ): Promise<undefined>;
    getTools(options?: { signal?: AbortSignal }): Promise<RegisteredTool[]>;
    executeTool(
      tool: string | RegisteredTool,
      input?: Record<string, unknown>,
      options?: { signal?: AbortSignal }
    ): Promise<string>;
    ontoolchange: ((this: ModelContext, ev: Event) => unknown) | null;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
