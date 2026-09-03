# Bitácora — Quibix

Registro de bloques de trabajo del proyecto, siguiendo `../reglas_documentacion.md`
(Método AR). Cada entrada tiene un ancla estable (`§N`) y **nunca se reescribe**
una entrada vieja — solo se agregan nuevas al final, en orden.

Ver también: [resumen de la última sesión](./resumen-sesion-2026-09-01.md)
(el "qué se hizo / qué falta / qué verificar" para retomar sin releer el chat).

---

## §1 — 2026-09-01 — Documento de contexto + andamiaje inicial del proyecto

**Qué se tocó y por qué:**

1. `CLAUDE.md` — documento de contexto del proyecto (problema que resuelve, los
   tres decoradores, roles de ejecución de una tool, ejemplo SLAS, stack,
   estado, referencias). No existía ningún documento de contexto antes de
   esto — era el primer paso obligatorio antes de escribir código.
2. Andamiaje completo del paquete TypeScript: `package.json`, `tsconfig.json`,
   `LICENSE` (MIT), `.gitignore`, `README.md`.
3. Los tres decoradores en `src/`: `@Expose` (clase), `@Explain` (método),
   `@Param` (parámetro), con su soporte interno
   (`core/metadata-registry.ts`, `core/schema.ts`, `core/coerce.ts`) y las
   declaraciones ambiente de `document.modelContext`
   (`src/types/webmcp.ts`) — verificadas contra la spec oficial de WebMCP
   (https://webmachinelearning.github.io/webmcp/), no inventadas de memoria.
4. Dos ejemplos funcionales en `examples/`: `slas.example.ts`
   (`type: "action"`) y `germina.example.ts` (`type: "query"` con
   `fallbackUrl`).
5. Verificación real, no solo tipado: build limpio con `tsc`, typecheck de
   los ejemplos, y un smoke test en runtime (Node, con
   `document.modelContext` mockeado a mano) que confirmó: registro de
   tools al instanciar, generación correcta del `inputSchema`,
   `readOnlyHint` según `type`, `fallbackUrl` embebido en la descripción,
   y coerción defensiva de tipos (`"1000000"` → `1000000`, `"true"` →
   `true`).
6. Se referenció `reglas_documentacion.md` desde `CLAUDE.md` con la
   sintaxis de import (`@reglas_documentacion.md`) que el propio marco
   sugiere como patrón estándar, y se creó esta carpeta `apuntes/` para
   alojar la bitácora y los resúmenes de sesión.

**Por qué se hizo así:** primer bloque de trabajo del proyecto — no había
nada más que el brief del usuario. Se construyó el andamiaje completo (no
un esqueleto mínimo) porque el deadline del hackathon (3 sep 2026) deja
poco margen para retrabajo; y se verificó en runtime real —no solo
compilando— porque eso fue justamente lo que reveló los dos bugs de abajo,
que un `tsc` sin errores no delata.

**Errores encontrados y resueltos:**

- **Bug 1 — imports relativos sin extensión rompían bajo Node ESM real.**
  `tsconfig.json` usaba `module: "ES2020"` + `moduleResolution: "Bundler"`,
  que compila imports sin extensión (`from "./core/types"`). Bajo
  `"type": "module"` de Node eso es inválido:
  `ERR_MODULE_NOT_FOUND`. Se detectó corriendo el `dist/index.js`
  compilado directo con `node`, no solo con `tsc` (`tsc` no lo marca como
  error). **Causa raíz:** `moduleResolution: "Bundler"` asume que un
  bundler (webpack/esbuild/vite) resuelve la extensión por vos; un
  paquete pensado para correr también en Node plano necesita
  `NodeNext`. **Fix:** `module`/`moduleResolution` → `NodeNext`, y se
  agregó `.js` a todos los imports relativos del código fuente
  (convención NodeNext: se escribe `.js` aunque el archivo fuente sea
  `.ts`).

- **Bug 2 — el archivo de tipos ambiente no llegaba a `dist/`.**
  `src/types/webmcp.d.ts` documentaba `document.modelContext`, pero
  TypeScript no copia archivos `.d.ts` de entrada a `outDir` (limitación
  conocida del compilador). Resultado: quien instalara el paquete
  publicado no tendría esos tipos, aunque localmente todo compilara sin
  errores. Se detectó inspeccionando a mano el `dist/` generado — el
  build "pasaba" sin avisar del problema. **Fix:** se renombró a
  `webmcp.ts` (archivo TypeScript normal, no declaración pura) para que
  `tsc` sí lo compile y emita su `.d.ts` en `dist/`, referenciado con un
  `import` de efecto lateral normal desde `src/index.ts`.

  Nota: ninguno de los dos bugs cumple el patrón de "dos fallos seguidos
  en lo mismo" (§14-17 del marco) — fueron dos hallazgos distintos, cada
  uno resuelto en el primer intento dirigido a esa causa concreta. Se
  documentan igual porque son el tipo de detalle que un build exitoso no
  revela por sí solo.

**Decisiones propias (no estaban explícitas en el pedido):**

- *Técnica-interna:* decoradores **legacy** (`experimentalDecorators`) en
  vez de la sintaxis Stage 3 del TC39. Motivo: Stage 3 eliminó los
  decoradores de parámetro, y `@Param` depende de ellos — no había
  alternativa real. Documentado en el `README.md`.
- *Técnica-interna:* `fallbackUrl` se incrusta como texto legible en la
  `description` de la tool (además de como campo extra no estándar en el
  objeto). Motivo: es lo único garantizado de funcionar con cualquier
  runtime WebMCP, sin depender de que el runtime tolere campos fuera de
  spec.
- *Técnica-interna:* `type: "query"` → `annotations.readOnlyHint: true`
  (campo real de la spec WebMCP). No estaba pedido explícitamente, pero
  es información que la propia spec espera y que ya teníamos disponible
  sin costo adicional.
- *Cosmética:* los dos bugs de arriba (NodeNext + convertir el archivo de
  tipos ambiente a `.ts`) son correcciones de implementación — no cambian
  nada de lo que el usuario ve o decide — así que se aplicaron directo en
  vez de pararse a confirmar antes.

Ninguna decisión de producto (alcance, comportamiento visible, dirección)
se tomó sin consultar en este bloque.

**Qué NO se hizo en este bloque (fuera de alcance, sin confirmar aún):**

- Tests automatizados (`node:test` o similar) — el smoke test de esta
  sesión fue manual, corrido en un directorio temporal fuera del repo, y
  se descartó al cerrar.
- HTML/demo en vivo para el video del hackathon.
- `git init` — el repo todavía no está versionado.

---

## §2 — 2026-09-01 — Documentación del código a inglés

**Qué se tocó y por qué:** a pedido explícito del usuario, se tradujeron
al inglés todos los comentarios y JSDoc dentro de `src/` (los tres
decoradores, el core interno, las declaraciones ambiente de WebMCP) y los
comentarios de `examples/`. Se recompiló (`npm run build`) y se
retipeacharon los ejemplos contra `NodeNext` para confirmar que la
traducción no rompió nada.

**Decisión propia — técnica-interna:** además de los comentarios/JSDoc
(lo pedido explícitamente), también se tradujeron al inglés los mensajes
de `console.warn`/`console.error` y el texto de fallback que
`buildDescription()` (en `expose.ts`) genera automáticamente. Motivo: son
texto autogenerado por la propia librería (no contenido de negocio del
desarrollador que la usa) — dejarlos en español mientras el resto del
código queda en inglés habría sido inconsistente dentro del mismo
archivo. Se agrupa como técnica-interna porque no cambia el
comportamiento del código, solo el idioma de sus mensajes.

**Qué se dejó igual, a propósito:** las cadenas pasadas a `@Explain` y
`@Param` dentro de `examples/` (ej. "Calcula los aportes a seguridad
social...") NO se tradujeron. Son contenido del dominio de la demo
(pensado para un agente en español, coherente con SLAS/Germina siendo
servicios en español), no documentación del código — traducirlas sin que
se pidiera habría sido un cambio de contenido/producto, no de
documentación.

**Verificación:** `grep` de caracteres con tilde/ñ en `src/**/*.ts` no
devolvió resultados — confirma que no quedó texto en español fuera de
los comentarios ya traducidos. Build y typecheck de ejemplos, limpios.

---

## §3 — 2026-09-02 — Mapa de archivos y carpetas del proyecto

**Qué se tocó y por qué:** el usuario pidió, en una carpeta nueva dentro
de `apuntes/`, una explicación de qué hace cada archivo y qué contiene
cada carpeta del proyecto. Se creó `apuntes/estructura/` con
`estructura-del-proyecto.md`: un documento de referencia (sin fecha en
el nombre, a diferencia del resumen de sesión) que recorre la raíz,
`apuntes/`, `src/` (con sus tres subcarpetas), `examples/`, y menciona
`dist/`/`node_modules/` como generadas/no documentadas archivo por
archivo.

**Decisión propia — cosmética/convención de nombres:** como era la
primera vez que se creaba una subcarpeta dentro de `apuntes/`, fijé el
patrón: nombre de carpeta en kebab-case describiendo el contenido
(`estructura/`), archivo adentro con nombre de rol fijo y sin fecha
(`estructura-del-proyecto.md`) porque es un documento vivo de
referencia, no una entrada fechada — a diferencia de
`resumen-sesion-<fecha>.md`. Se marcó explícitamente en el propio
documento la obligación de actualizarlo en el mismo turno en que cambie
la estructura del proyecto (regla del marco sobre no dejar documentos
de contexto desactualizados).

**Qué se tocó además:** el índice de `apuntes/` en `CLAUDE.md` no
mencionaba `estructura/` — se actualizó en este mismo turno para no
dejarlo desactualizado.

---

## §4 — 2026-09-02 — `git init` + commit inicial, guía de publicación en npm

**Qué se hizo:**

1. El repo no tenía historial de git (`git log` vacío, sin remoto) —
   se corrió `git init`, se fijó la rama `main`, y se hizo el primer
   commit (`cf9b8bb`) con los 22 archivos existentes hasta ese momento
   (todo excepto `node_modules/` y `dist/`, ya cubiertos por
   `.gitignore`). La identidad de git (`Luis Triana` /
   `luistriana617@gmail.com`) ya estaba configurada globalmente — no
   hizo falta tocarla.
2. `apuntes/guia-publicacion.md`: guía de cómo publicar el paquete.
   Antes de escribirla, **verifiqué en vivo** dos cosas en vez de
   asumirlas: (a) el nombre `quibix` está libre en npm (el registro
   devuelve 404), y (b) qué archivos entra realmente en el tarball —
   corrí `npm pack --dry-run` de verdad y confirmé que coincide con lo
   que documenté (`dist/**`, `README.md`, `LICENSE`, `package.json`;
   nada de `src/`, `examples/`, `apuntes/` ni `reglas_documentacion.md`,
   ya excluidos por el campo `files` de `package.json`).
3. Se actualizó el índice de `apuntes/` en `CLAUDE.md` para incluir el
   link a la guía (mismo turno, para no dejarlo desactualizado).

**Decisión propia — de producto, consultada explícitamente en el
documento en vez de aplicada:** la guía recomienda **npm** como único
manejador de paquetes (con JSR y GitHub Packages mencionados y
descartados, con motivo) en vez de dejarlo abierto — el usuario pidió
justamente resolver esa duda, así que se tomó posición con
justificación en vez de listar opciones sin recomendar. No se considera
"decisión de producto aplicada sin avisar" porque no cambia nada del
código: es contenido de una guía, no una acción irreversible.

**Decisión propia — técnica-interna, NO aplicada, solo sugerida en la
guía:** agregar un script `prepublishOnly` a `package.json` para que
`npm publish` nunca corra sin buildear antes. Se dejó como paso
recomendado y opcional dentro de la guía, sin editar `package.json`,
porque tocar el manifiesto no estaba pedido explícitamente en este
bloque (regla del marco: no "mejorar" cosas fuera de alcance sin
avisar primero).

**Qué NO se hizo:** no se creó el repo remoto en GitHub ni se hizo
`git push` — el usuario pidió el commit local, no publicarlo. El paso
de GitHub queda documentado en la guía como prerrequisito, pendiente de
que el usuario decida hacerlo.

---

## §5 — 2026-09-02 — `package.json` con datos reales del repo + push a GitHub

**Contexto:** el usuario ya había creado el repo en GitHub
(`luistriana032006/quibix`, con `origin` ya conectado y 2 commits ya
pusheados por su cuenta) y la cuenta de npm, y preguntó qué podía
configurar yo desde acá. Antes de tocar nada, inspeccioné el estado
real (`git remote -v`, `git status -sb`, `npm whoami`, si existía
`~/.npmrc`) en vez de asumirlo — encontré 1 commit local sin pushear
(`13945c8`) y confirmé que no hay sesión de npm en este entorno
(`ENEEDAUTH`, sin `.npmrc`).

Presenté el menú de lo que podía hacer sin pedir nada sensible
(pushear el pendiente, completar `package.json`, agregar
`prepublishOnly`, CI opcional) y dejé elegir — el usuario pidió las
primeras tres, no CI.

**Qué se hizo:**

1. `package.json` → se agregaron `repository` y `bugs` apuntando a
   `github.com/luistriana032006/quibix` (URL real, ya no `<tu-usuario>`
   de plantilla), y `scripts.prepublishOnly` (`npm run clean && npm
   run build`) — ambos ya estaban documentados como "recomendado, no
   aplicado" en la guía desde `§4`.
2. Verificado: JSON válido, `npm run build` sigue limpio después del
   cambio.
3. `apuntes/guia-publicacion.md` actualizada en el mismo turno (regla
   de no dejar documentos desactualizados): las secciones 1 y 3 ahora
   dicen "✅ Ya hecho" en vez de los pasos pendientes, y el resumen de
   comandos al final ya no incluye `gh repo create`/`git push -u`
   (innecesarios, el repo ya existe).
4. Commit de estos cambios + push del commit pendiente y el nuevo,
   ambos a `origin/main`.

**Decisión propia:** ninguna fuera de lo que el usuario eligió
explícitamente en el menú — no se tocó CI ni ningún otro archivo.
