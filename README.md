# Quibix

Wrapper de decoradores TypeScript, agnóstico de framework, sobre la API nativa de **WebMCP** (`document.modelContext`). Convierte clases y métodos anotados en tools invocables por agentes de IA — sin depender de React, Vue, ni ningún framework específico.

> Proyecto para **The WebMCP Challenge** (Devpost) — deadline 3 de septiembre de 2026.
> Autor de la idea y la arquitectura: Luis Miguel Triana Rueda ([luistriana.dev](https://luistriana.dev)).

## Instalación

```bash
npm install
npm run build
```

Requiere que tu propio `tsconfig.json` (si consumes Quibix desde otro proyecto) tenga:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Quibix usa **decoradores legacy de TypeScript** (`experimentalDecorators`), no la sintaxis Stage 3 del TC39. Es una decisión deliberada: la propuesta Stage 3 eliminó los decoradores de parámetro, y `@Param` — pieza central de la API de Quibix — depende de ellos.

## Quickstart

```ts
import { Expose, Explain, Param } from "quibix";

@Expose()
class SlasController {
  @Explain("Calcula los aportes a seguridad social de un independiente", {
    type: "action",
  })
  execute(
    @Param("ingresoMensual", "number", "Ingreso mensual en COP") ingreso: number,
    @Param("aportaARL", "boolean", "Si aporta a ARL") arl: boolean
  ) {
    // tu lógica real
    return { total: ingreso * 0.2 };
  }
}

// Instanciar la clase es lo que dispara el registro contra
// document.modelContext.registerTool().
new SlasController();
```

Ver [`examples/`](./examples) para los dos casos completos del demo (query y action).

## Los tres decoradores

Set cerrado para el hackathon: `@Expose`, `@Explain`, `@Param`.

### `@Expose()` — nivel clase

Marca una clase como "proveedor de tools". Al instanciarse (`new MiController()`), recorre los métodos anotados con `@Explain` y los registra contra `document.modelContext.registerTool()`, construyendo el `inputSchema` a partir de los `@Param` de cada uno.

El registro ocurre **por instancia**, no al declarar la clase — así decides tú cuándo se expone cada tool.

### `@Explain(description, options?)` — nivel método

Declara un método como tool invocable por el agente.

```ts
@Explain("Calcula los aportes a seguridad social", {
  type: "action", // "query" | "action"
})
```

- **`type: "query"`** — comandos de solo lectura (equivalente a GET). Admite `fallbackUrl` como respaldo para agentes que no pueden ejecutar la tool interactivamente.
- **`type: "action"`** — comandos que ejecutan/mutan lógica real (equivalente a POST). Requieren ejecución en vivo; `fallbackUrl` no aplica porque no hay resultado sin correrlos (si lo declaras, Quibix avisa por consola y lo ignora).

```ts
@Explain("Consulta info de salud sexual por país", {
  type: "query",
  fallbackUrl: "https://germina.health/{pais}",
})
```

### `@Param(name, type, description)` — nivel parámetro

Genera automáticamente el fragmento de JSON Schema de ese parámetro y aplica una coerción defensiva de tipo (string → number/boolean) al invocar, sin que escribas el parseo a mano.

```ts
execute(
  @Param("ingresoMensual", "number", "Ingreso mensual en COP") ingreso: number,
  @Param("aportaARL", "boolean", "Si aporta a ARL") arl: boolean
) { ... }
```

`name` es el nombre expuesto al agente en el schema — no tiene que coincidir con el nombre del parámetro en TypeScript. Un parámetro sin `@Param` no se expone ni se pasa al agente.

## Cómo se ejecuta una tool (los roles, sin ambigüedad)

1. **La lógica de negocio la escribe y ejecuta la página** (el cuerpo del método anotado) — el modelo nunca calcula ni inventa el resultado.
2. **El modelo decide cuándo llamar la función y con qué parámetros**, a partir de la conversación con el usuario.
3. **El navegador es el mensajero**: recibe la petición del agente, ejecuta el método real en el contexto de la página, devuelve el resultado.
4. **El modelo redacta la respuesta final** en lenguaje natural a partir del resultado real devuelto.

Analogía: el modelo es el mesero que toma el pedido y lo lleva a la cocina — no cocina. La cocina (tu `execute()`) es la única que sabe la receta real (la fórmula, la normativa, el cálculo).

## El fallback declarativo de URL

Ninguna librería de conveniencia existente hoy sobre WebMCP (`@mcp-b/react-webmcp`, `use-webmcp-tool` de Google Chrome Labs, `@webmcp-registry/kit`) resuelve el caso del agente que consulta pero no puede ejecutar la tool en vivo. Quibix lo cubre con `fallbackUrl` en tools `type: "query"`:

- Se incrusta como texto legible al final de la `description` que recibe el agente vía `getTools()` — funciona con cualquier runtime WebMCP, sin depender de un campo no estándar.
- Además se adjunta como propiedad `fallbackUrl` directamente en el objeto de la tool, por si tu propio tooling o un runtime más permisivo la quiere leer estructuradamente.

## Por qué agnóstico de framework

Todas las librerías de conveniencia existentes hoy están atadas a React (hooks). Quibix usa decoradores de TypeScript, que son parte del lenguaje, no de un framework — funcionan igual en Next.js, Angular, Node puro, o vanilla TS con clases.

## Stack técnico

- TypeScript (decoradores legacy, `experimentalDecorators` + `emitDecoratorMetadata`)
- API nativa `document.modelContext.registerTool()` (spec WebMCP, W3C WebML Community Group)
- Sin runtime dependencies obligatorias de framework

## Estado

Prototipo en desarrollo activo para el hackathon. Licencia MIT / open source. Ver [`CLAUDE.md`](./CLAUDE.md) para el contexto completo del proyecto.

## Referencias

- Spec oficial: https://webmachinelearning.github.io/webmcp/
- Repo del W3C WebML CG: https://github.com/webmachinelearning/webmcp
- Hackathon: https://webmcp.devpost.com/

## Licencia

MIT — ver [LICENSE](./LICENSE).
