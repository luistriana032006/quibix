# Quibix

Framework-agnostic TypeScript decorator wrapper over the native **WebMCP** API (`document.modelContext`). Turns annotated classes and methods into tools an AI agent can invoke — no dependency on React, Vue, or any specific framework.

> Built for **The WebMCP Challenge** (Devpost) — deadline September 3, 2026.
> Idea and architecture by Luis Miguel Triana Rueda ([luistriana.dev](https://luistriana.dev)).

## The problem it solves

Today, an AI agent with no WebMCP support interacts with a page by guessing: it reads the DOM or a screenshot, infers what a given button does, with no guarantee it gets it right. On top of that:

- It can't tell colors, visual hierarchy, or purely aesthetic affordances apart.
- It can't execute JavaScript or fire real clicks if the agent has no interactive browser (e.g. terminal agents, API agents, or `web_fetch`).
- Even where native WebMCP support does exist, hand-writing `document.modelContext.registerTool()` for every function is repetitive and verbose.

**Quibix** solves the second part of that problem — the verbosity — with a Spring Boot/NestJS-style annotation pattern, and adds a piece we haven't found in any existing library in the ecosystem (`@mcp-b/react-webmcp`, Google Chrome Labs' `use-webmcp-tool`, `@webmcp-registry/kit`): a **declarative URL fallback** for when the querying agent can't execute the tool interactively (details below).

## Installation

```bash
npm install
npm run build
```

If you're consuming Quibix from another project, your own `tsconfig.json` needs:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Quibix uses **TypeScript's legacy decorators** (`experimentalDecorators`), not the TC39 Stage 3 syntax. That's deliberate: Stage 3 dropped parameter decorators, and `@Param` — a core piece of Quibix's API — depends on them.

## Quickstart

```ts
import { Expose, Explain, Param } from "quibix";

@Expose()
class SlasController {
  @Explain("Calculates an independent contractor's social-security contributions", {
    type: "action",
  })
  execute(
    @Param("monthlyIncome", "number", "Monthly income in COP") income: number,
    @Param("contributesToARL", "boolean", "Whether they contribute to ARL") arl: boolean
  ) {
    // your real logic here
    return { total: income * 0.2 };
  }
}

// Instantiating the class is what triggers registration against
// document.modelContext.registerTool().
new SlasController();
```

See [`examples/`](./examples) for the two full demo cases (query and action).

## The three decorators

Closed set for the hackathon: `@Expose`, `@Explain`, `@Param`.

### `@Expose()` — class level

Marks a class as a "tool provider". On instantiation (`new MyController()`), it walks every method annotated with `@Explain` and registers it against `document.modelContext.registerTool()`, building each one's `inputSchema` from its `@Param` decorators.

Registration happens **per instance**, not when the class is declared — so you control when each tool gets exposed.

### `@Explain(description, options?)` — method level

Declares a method as a tool the agent can invoke.

```ts
@Explain("Calculates social-security contributions", {
  type: "action", // "query" | "action"
})
```

- **`type: "query"`** — read-only commands (equivalent to GET). Supports `fallbackUrl` as a fallback for agents that can't execute the tool interactively.
- **`type: "action"`** — commands that execute/mutate real logic (equivalent to POST). They require live execution; `fallbackUrl` doesn't apply since there's no result without running them (if you declare it anyway, Quibix warns via the console and ignores it).

```ts
@Explain("Look up sexual-health info by country", {
  type: "query",
  fallbackUrl: "https://germina.health/{country}",
})
```

### `@Param(name, type, description)` — parameter level

Automatically generates that parameter's JSON Schema fragment and applies defensive type coercion (string → number/boolean) on invocation, so you never write the parsing by hand.

```ts
execute(
  @Param("monthlyIncome", "number", "Monthly income in COP") income: number,
  @Param("contributesToARL", "boolean", "Whether they contribute to ARL") arl: boolean
) { ... }
```

`name` is the name exposed to the agent in the schema — it doesn't have to match the TypeScript parameter's name. A parameter without `@Param` isn't exposed and isn't passed to the agent.

## How a tool actually runs (the roles, no ambiguity)

1. **The page writes and executes the business logic** (the annotated method's body) — the model never computes or invents the result.
2. **The model decides when to call the function and with what parameters**, based on the conversation with the user.
3. **The browser is the messenger**: it receives the agent's request, runs the real method in the page's context, and returns the result.
4. **The model drafts the final answer** in natural language from the real result it got back.

Analogy: the model is the waiter who takes the order to the kitchen — it doesn't cook. The kitchen (your `execute()`) is the only one that knows the real recipe (the formula, the regulation, the calculation).

## Full example — a real use case: SLAS

```ts
@Expose()
class SlasController {
  @Explain("Calculates an independent contractor's social-security contributions", {
    type: "action",
  })
  execute(
    @Param("monthlyIncome", "number", "Monthly income in COP") income: number,
    @Param("contributesToARL", "boolean", "Whether they contribute to ARL") arl: boolean,
    @Param("riskLevel", "number", "Risk level, 1-5") riskLevel: number,
    @Param("contributesToCCF", "boolean", "Whether they contribute to the family compensation fund") ccf: boolean
  ) {
    // real logic already live at slas.luistriana.dev
    return {
      health /* ... */,
      pension /* ... */,
      arl /* ... */,
      fsp /* ... */,
      total /* ... */,
    };
  }
}
```

This is illustrative — see [`examples/slas.example.ts`](./examples/slas.example.ts) for a runnable version (simplified for the demo, not a normative reference).

## Hackathon demo — the two command types

- **Query**: look up a country's info on Germina (read-only, with `fallbackUrl`).
- **Action**: calculate real contributions on SLAS (execution, an audited result).

Both run off the exact same annotation pattern. [`demo/`](./demo) is a working Vite page that registers both against a real `document.modelContext` — polyfilled by [`@mcp-b/global`](https://www.npmjs.com/package/@mcp-b/global) for browsers without native WebMCP support yet. Run it locally:

```bash
npm run demo
```

A recorded walkthrough (<3 min) is still pending.

## The declarative URL fallback

No existing convenience library over WebMCP today (`@mcp-b/react-webmcp`, Google Chrome Labs' `use-webmcp-tool`, `@webmcp-registry/kit`) covers the case of an agent that can query but can't run the tool live. Quibix handles it with `fallbackUrl` on `type: "query"` tools:

- It's embedded as readable text at the end of the `description` the agent receives via `getTools()` — this works with any WebMCP runtime, without depending on a non-standard field.
- It's also attached as a `fallbackUrl` property directly on the tool object, in case your own tooling or a more permissive runtime wants to read it structurally.

## Why framework-agnostic

Every convenience library that exists today is tied to React (hooks). Quibix uses TypeScript decorators, which are part of the language, not a framework — they work the same in Next.js, Angular, plain Node, or vanilla TS with classes.

## Tech stack

- TypeScript (legacy decorators, `experimentalDecorators` + `emitDecoratorMetadata`)
- Native `document.modelContext.registerTool()` API (WebMCP spec, W3C WebML Community Group)
- No required framework runtime dependencies

## Status

Active prototype for the hackathon. MIT / open source. See [`CLAUDE.md`](./CLAUDE.md) for the full project context.

## References

- Official spec: https://webmachinelearning.github.io/webmcp/
- W3C WebML CG repo: https://github.com/webmachinelearning/webmcp
- Hackathon: https://webmcp.devpost.com/

## License

MIT — see [LICENSE](./LICENSE).
