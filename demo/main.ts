// Must be imported first — before anything that touches document.modelContext,
// including Quibix itself. @mcp-b/global is a side-effect import: importing it
// polyfills document.modelContext in browsers that don't have native WebMCP support.
import "@mcp-b/global";

console.log("document.modelContext exists:", typeof document.modelContext !== "undefined");
console.log("document.modelContext:", document.modelContext);

// Importing these instantiates SlasController and GerminaController at module
// scope, which (via @Expose) registers their tools against document.modelContext.
// Must happen AFTER the @mcp-b/global import above.
import "../examples/slas.example";
import "../examples/germina.example";

document.modelContext
  .getTools()
  .then((tools) => console.log("Registered tools:", tools))
  .catch((err) => console.error("getTools() failed:", err));
