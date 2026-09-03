# Estructura del proyecto — Quibix

Mapa de qué contiene cada carpeta y qué hace cada archivo. Es un
documento de referencia (no una entrada de sesión con fecha): su rol es
fijo y **debe actualizarse en el mismo turno** en que se agregue, mueva
o borre un archivo — si no, avisar explícitamente que quedó pendiente
(regla del Método AR, ver `../../reglas_documentacion.md`).

Para el historial de decisiones y el porqué de cada cosa, ver
[`../bitacora.md`](../bitacora.md). Este documento solo responde "¿qué
es esto y dónde vive?", no "¿por qué se hizo así?".

---

## Raíz del proyecto

| Archivo | Qué hace |
|---|---|
| `CLAUDE.md` | Documento de contexto del proyecto: el problema que resuelve Quibix, los tres decoradores, los roles de ejecución de una tool, el stack técnico y notas operativas para el agente. Es lo primero que se lee antes de tocar código. |
| `reglas_documentacion.md` | El "Método AR": reglas de cómo debe documentar y comportarse el agente en este repo (qué reportar, cómo clasificar decisiones propias, convención de nombres de archivo). Importado desde `CLAUDE.md` con `@reglas_documentacion.md`. |
| `README.md` | Documentación pública del paquete (la que ve alguien en npm o GitHub): instalación, quickstart, API de los tres decoradores, el fallback declarativo de URL, referencias a la spec. |
| `LICENSE` | Licencia MIT (requisito del hackathon). |
| `package.json` | Manifiesto npm: nombre del paquete, scripts (`build`, `dev`, `clean`, `typecheck`), y la única dependencia real, `typescript` (dev). |
| `package-lock.json` | Lockfile de npm — versiones exactas resueltas. |
| `tsconfig.json` | Configuración del compilador: decoradores legacy (`experimentalDecorators`), módulos `NodeNext` (para que el paquete compilado corra bajo Node ESM real, no solo bajo bundlers), `outDir: dist`. |
| `.gitignore` | Ignora `node_modules/`, `dist/`, logs, `.env`. |

## `apuntes/`

Carpeta de notas de trabajo del proyecto — separada de la documentación
pública (`README.md`) y de la de contexto (`CLAUDE.md`). Todo lo que acá
adentro es para quien retoma el proyecto en otra sesión, no para quien
instala el paquete.

| Archivo/carpeta | Qué contiene |
|---|---|
| `bitacora.md` | Historial de bloques de trabajo, con anclas estables `§1`, `§2`... **Nunca se reescribe** una entrada vieja — solo se agregan nuevas al final. Acá queda el detalle de qué se tocó, por qué, qué errores se encontraron y las decisiones propias clasificadas. |
| `resumen-sesion-<fecha>.md` | Snapshot corto de "qué se hizo / qué falta / qué verificar" para retomar sin releer el chat completo. El rol del documento es fijo (siempre se llama así); la fecha en el nombre es del día en que se escribió, no la que describe. Hoy solo existe `resumen-sesion-2026-09-01.md`. |
| `estructura/` | Esta carpeta. Contiene el mapa de archivos y carpetas del proyecto (este mismo documento). |

## `src/`

El código fuente del paquete — todo lo que se compila a `dist/` y se
publica. Es la librería en sí.

| Archivo | Qué hace |
|---|---|
| `index.ts` | Punto de entrada público: re-exporta `Expose`, `Explain`, `Param` y los tipos (`ParamType`, `ToolKind`, `ToolOptions`). También importa `./types/webmcp.js` por efecto lateral, para que las declaraciones ambiente de `document.modelContext` viajen con el paquete compilado. |

### `src/decorators/`

Los tres decoradores públicos de Quibix — la superficie de la API que
usa un desarrollador.

| Archivo | Qué hace |
|---|---|
| `expose.ts` | `@Expose()` — decorador de clase. Envuelve la clase para que, al instanciarse, registre automáticamente contra `document.modelContext.registerTool()` todos los métodos anotados con `@Explain`, construyendo el `inputSchema` a partir de los `@Param` de cada uno. Acá vive también la lógica de `fallbackUrl` (se incrusta en la `description` y como campo extra del objeto tool) y el `readOnlyHint` automático según `type`. |
| `explain.ts` | `@Explain(description, options)` — decorador de método. Solo captura metadata (descripción + `type` + `fallbackUrl` opcional) en el registro interno; no registra nada por sí mismo. Avisa por `console.warn` si se declara `fallbackUrl` en una tool `type: "action"` (no tiene efecto ahí). |
| `param.ts` | `@Param(name, type, description)` — decorador de parámetro. Captura metadata de un argumento posicional del método (índice, nombre expuesto al agente, tipo, descripción) para que `@Expose` arme el JSON Schema y aplique la coerción de tipo al invocar. |

### `src/core/`

Soporte interno, no exportado directamente al consumidor del paquete —
la lógica que hace funcionar a los tres decoradores.

| Archivo | Qué hace |
|---|---|
| `metadata-registry.ts` | El registro interno (dos `WeakMap`, indexadas por `prototype`) donde `@Explain` y `@Param` guardan lo que capturan, y de donde `@Expose` lo lee al momento de decorar la clase. Documenta también el orden de ejecución de decoradores legacy de TS del que depende todo el diseño. |
| `schema.ts` | `buildInputSchema()` — convierte la lista de `ParamMeta` (capturada por `@Param`) en el objeto JSON Schema que espera `registerTool()`. |
| `coerce.ts` | `coerceValue()` — coerción defensiva de tipo (string → number/boolean) para cuando un agente manda los argumentos como string aunque el schema pida otro tipo. Es el respaldo, no el camino principal. |
| `types.ts` | Los tipos compartidos: `ParamType`, `ParamMeta`, `ToolKind`, `ToolOptions`, `MethodMeta`. Sin lógica, solo definiciones. |

### `src/types/`

| Archivo | Qué hace |
|---|---|
| `webmcp.ts` | Declaraciones ambiente (`declare global`) de la API nativa de WebMCP (`document.modelContext`, `ModelContextTool`, etc.), verificadas contra la spec oficial porque todavía no forman parte de `lib.dom.d.ts`. Es un `.ts` normal (no `.d.ts`) a propósito, para que `tsc` sí lo copie a `dist/` — ver `bitacora.md` §1, Bug 2, para el porqué. |

## `examples/`

Ejemplos ejecutables/tipables (no forman parte del build de `dist/`) que
demuestran el patrón completo de decoradores con los dos casos de uso
del demo del hackathon.

| Archivo | Qué hace |
|---|---|
| `slas.example.ts` | Ejemplo `type: "action"` — calcula aportes a seguridad social de un independiente en Colombia. Fórmula simplificada solo para la demo (la real vive en slas.luistriana.dev); sin `fallbackUrl` porque una `action` no tiene resultado útil sin ejecutarse. |
| `germina.example.ts` | Ejemplo `type: "query"` — consulta información de salud sexual por país, con `fallbackUrl` como respaldo para agentes que no pueden ejecutar la tool interactivamente. |

## Carpetas generadas (no versionadas, no documentadas archivo por archivo)

| Carpeta | Qué es |
|---|---|
| `dist/` | Salida compilada de `npm run build` (mismo árbol que `src/`, en `.js` + `.d.ts`). Se regenera desde `src/`; no se edita a mano. Ignorada por git. |
| `node_modules/` | Dependencias de npm (solo `typescript` como dev dependency). Ignorada por git. |
