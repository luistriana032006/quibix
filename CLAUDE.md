# Quibix

Wrapper de decoradores TypeScript, agnóstico de framework, sobre la API nativa de **WebMCP** (`document.modelContext`). Convierte clases y métodos anotados en tools invocables por agentes de IA — sin depender de React, Vue, ni ningún framework específico.

> Proyecto para **The WebMCP Challenge** (Devpost) — deadline 3 de septiembre de 2026.
> Autor de la idea y la arquitectura: Luis Miguel Triana Rueda ([luistriana.dev](https://luistriana.dev)).

@reglas_documentacion.md

Notas de trabajo por sesión: [`apuntes/bitacora.md`](./apuntes/bitacora.md)
(historial con anclas `§N`, nunca se reescribe) y el resumen de la sesión
más reciente en `apuntes/resumen-sesion-<fecha>.md`. Mapa de archivos y
carpetas del proyecto: [`apuntes/estructura/estructura-del-proyecto.md`](./apuntes/estructura/estructura-del-proyecto.md).
Cómo publicar el paquete: [`apuntes/guia-publicacion.md`](./apuntes/guia-publicacion.md).

---

## 1. Problema que resuelve

Hoy, un agente de IA sin soporte WebMCP interactúa con una página adivinando: lee el DOM o una captura de pantalla, infiere qué botón hace qué, y no tiene garantía de acertar. Además:

- No distingue colores, jerarquía visual ni affordances puramente estéticas.
- No puede ejecutar JavaScript ni disparar clics reales si el agente no tiene navegador interactivo (ej. agentes de terminal, API, o `web_fetch`).
- Cuando sí existe soporte WebMCP nativo, escribir `document.modelContext.registerTool()` a mano para cada función es repetitivo y verboso.

**Quibix** resuelve la segunda parte del problema — la verbosidad — con un patrón de anotaciones estilo Spring Boot/NestJS, y agrega una pieza que no encontramos en ninguna librería existente del ecosistema (`@mcp-b/react-webmcp`, `use-webmcp-tool` de Google Chrome Labs, `@webmcp-registry/kit`): un **fallback declarativo de URL** para cuando el agente que consulta no puede ejecutar la tool interactivamente.

## 2. Por qué agnóstico de framework

Todas las librerías de conveniencia existentes hoy están atadas a React (hooks). Quibix usa **decoradores de TypeScript** (`experimentalDecorators` o sintaxis Stage 3), que son parte del lenguaje, no de un framework — funcionan igual en Next.js, Angular, Node puro, o vanilla TS con clases.

## 3. Los tres decoradores (set cerrado para el hackathon)

### `@Expose()` — nivel clase
Marca una clase completa como "proveedor de tools". El wrapper la recorre al montar y registra automáticamente todos los métodos anotados con `@Explain`.

### `@Explain(description, options?)` — nivel método
Declara un método como tool invocable por el agente.

```ts
@Explain("Calcula los aportes a seguridad social", {
  type: "action" // "query" | "action"
})
```

- **`type: "query"`** — comandos de solo lectura (equivalente a GET). Si el agente no puede ejecutar, puede usar `fallbackUrl` como respaldo.
- **`type: "action"`** — comandos que ejecutan/mutan lógica real (equivalente a POST). Requieren ejecución en vivo; sin `fallbackUrl` útil porque no hay resultado sin correrlos.

```ts
@Explain("Consulta info de salud sexual por país", {
  type: "query",
  fallbackUrl: "https://germina.health/{pais}"
})
```

### `@Param(name, type, description)` — nivel parámetro
Genera automáticamente el JSON Schema del parámetro y una coerción defensiva de tipo (string → number/boolean) como respaldo, sin que el desarrollador escriba el parseo a mano.

```ts
execute(
  @Param("ingresoMensual", "number", "Ingreso mensual en COP") ingreso: number,
  @Param("aportaARL", "boolean", "Si aporta a ARL") arl: boolean
) { ... }
```

## 4. Cómo se ejecuta una tool (los roles, sin ambigüedad)

1. **La lógica de negocio la escribe y ejecuta la página** (el cuerpo del método anotado) — el modelo nunca calcula ni inventa el resultado.
2. **El modelo decide cuándo llamar la función y con qué parámetros**, a partir de la conversación con el usuario.
3. **El navegador es el mensajero**: recibe la petición del agente, ejecuta el método real en el contexto de la página, devuelve el resultado.
4. **El modelo redacta la respuesta final** en lenguaje natural a partir del resultado real devuelto.

Analogía: el modelo es el mesero que toma el pedido y lo lleva a la cocina — no cocina. La cocina (tu `execute()`) es la única que sabe la receta real (la fórmula, la normativa, el cálculo).

## 5. Ejemplo completo — caso de uso real: SLAS

```ts
@Expose()
class SlasController {

  @Explain("Calcula los aportes a seguridad social de un independiente", {
    type: "action"
  })
  execute(
    @Param("ingresoMensual", "number", "Ingreso mensual en COP") ingreso: number,
    @Param("aportaARL", "boolean", "Si aporta a ARL") arl: boolean,
    @Param("nivelRiesgo", "number", "Nivel de riesgo 1-5") nivel: number,
    @Param("aportaCCF", "boolean", "Si aporta a Caja de Compensación") ccf: boolean
  ) {
    // lógica real ya existente en slas.luistriana.dev
    return { salud: ..., pension: ..., arl: ..., fsp: ..., total: ... };
  }
}
```

## 6. Demo del hackathon — los dos tipos de comando

- **Query**: consultar info de un país en Germina (lectura, con `fallbackUrl`).
- **Action**: calcular aportes reales en SLAS (ejecución, resultado auditado).

Ambos se muestran en el mismo video demo (<3 min) para evidenciar que el mismo patrón de anotaciones cubre los dos casos.

## 7. Stack técnico

- TypeScript (decoradores, `experimentalDecorators` o Stage 3)
- API nativa `document.modelContext.registerTool()` (spec WebMCP, W3C WebML Community Group)
- Sin runtime dependencies obligatorias de framework

## 8. Estado

Prototipo en desarrollo activo para el hackathon. Licencia MIT / open source (requisito del reto). Repo público con README, demo en vivo, video en YouTube.

## 9. Referencias

- Spec oficial: https://webmachinelearning.github.io/webmcp/
- Repo del W3C WebML CG: https://github.com/webmachinelearning/webmcp
- Hackathon: https://webmcp.devpost.com/

---

## Notas para Claude Code trabajando en este repo

- El directorio está vacío al día de hoy (2026-09-01) — todo el código está por escribir desde cero.
- El set de decoradores es **cerrado** para el hackathon: solo `@Expose`, `@Explain`, `@Param`. No agregar decoradores extra sin que el usuario lo pida explícitamente.
- No introducir dependencias de un framework específico (React, Vue, Angular) en el core del wrapper — eso rompe la propuesta de valor de "agnóstico de framework".
- La lógica de negocio de cada tool vive en el `execute()` del desarrollador; el wrapper solo se encarga de registro, schema y coerción de tipos — no debe interceptar ni reinterpretar el resultado.
- `fallbackUrl` solo tiene sentido para `type: "query"`; para `type: "action"` no se debe promover su uso.
- Deadline del hackathon: **3 de septiembre de 2026**. Priorizar que el demo (query + action) funcione end-to-end sobre features adicionales.
