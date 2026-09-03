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

---

## §6 — 2026-09-02 — Primera publicación real: `quibix@0.1.0` en npm

**Qué se hizo:** con el usuario ya logueado en npm, se confirmó
explícitamente antes de publicar (`npm pack --dry-run` para mostrar
qué se iba a subir), y se corrió `npm publish`. Después de resolver el
problema de 2FA (ver abajo), quedó publicado. Se verificó de punta a
punta, no solo con `npm view`: se instaló `quibix` en una carpeta
aparte (`npm install quibix`), se importó, y se confirmó que los tres
exports (`Explain`, `Expose`, `Param`) llegan bien. `CLAUDE.md` §8 se
actualizó en el mismo turno para reflejar el estado real (repo público
✅, publicado en npm ✅, demo y video todavía pendientes).

**Señal de alerta — dos fallos seguidos en lo mismo (regla del marco):**
esto pasó y corresponde documentarlo como tal.

- **Ronda 1:** `npm publish` corrido desde este entorno (Claude) →
  `403 Forbidden` — "npm tokens that bypass 2FA are being restricted...
  OTP required".
- **Ronda 2:** el mismo `npm publish`, corrido por el usuario en su
  propia terminal → el mismo 403. Dos intentos, mismo fallo.
  **Autocrítica:** acá la regla pide decirlo explícitamente ("esto ya
  lleva dos intentos fallidos") antes de proponer una tercera
  hipótesis — no lo dije con esas palabras en el momento. Sí hice lo
  que la regla pide en sustancia (instrumenté antes de suponer:
  inspeccioné los nombres de clave en `~/.npmrc`, sin exponer valores,
  y confirmé que solo había un `_authToken` de tipo granular) en
  vez de tirar una tercera hipótesis a ciegas, pero me salté el paso de
  nombrarlo en voz alta. Queda como lección para la próxima vez que se
  repita un error dos veces.
- **Causa raíz real:** el login por navegador (default en npm 10, que
  es la versión instalada) crea un *Granular Access Token*, cuyos
  permisos — incluido si puede saltarse el 2FA — se fijan al crear el
  token en la web de npm, no en el momento de publicar. Sin ese
  permiso, no hay prompt de OTP posible: el publish falla directo con
  403, sin pedir nada, para ese tipo de token.
- **Fix:** `npm logout` + `npm login --auth-type=legacy` (login
  clásico usuario/contraseña), que sí soporta el desafío de OTP en
  cada publish. El usuario lo corrió en su terminal; confirmado desde
  este entorno con `npm whoami` (comparte el mismo `$HOME`, mismo
  `~/.npmrc`).
- **Ronda 3, error distinto (no el mismo repetido):** con el login ya
  arreglado, reintenté `npm publish` desde este entorno y salió
  `EOTP` — un error nuevo, no el 403 de antes. Causa: este entorno no
  tiene una terminal interactiva real donde el usuario pueda tipear el
  OTP en el momento que se le pide; es una limitación estructural, no
  algo que un cuarto intento acá fuera a resolver. Se delegó el
  `npm publish` final a la terminal real del usuario, donde sí hay
  prompt interactivo — ahí funcionó a la primera.

**Lección para no repetir el patrón:** cuando el fallo es por falta de
una terminal interactiva real (2FA/OTP, o cualquier prompt que
necesite input humano en el momento), no vale la pena reintentar el
mismo comando desde este entorno una segunda vez — conviene
identificar eso como la causa antes de la ronda 2, no después, y
delegar directo a la terminal del usuario.

**Ningún secreto pasó por este chat:** ni contraseña ni OTP se pidieron
ni se pegaron acá — el login y el publish final se corrieron en la
terminal propia del usuario en los dos casos que lo requerían.

---

## §7 — 2026-09-02 — `README.md` a inglés (el jurado del hackathon lee en inglés)

**Qué se hizo:** traducción completa de `README.md` a inglés (la
documentación pública que se ve en npm y en GitHub), y de
`package.json` → `description` (también visible en la página de npm).
Verificado: JSON válido, `npm run build` sigue limpio.

**Decisión propia — técnica-interna:** los fragmentos de código de
ejemplo dentro del propio `README.md` (las cadenas de `@Explain`/
`@Param` en el Quickstart) también se tradujeron a inglés — a
diferencia de `examples/*.ts`, donde esas mismas cadenas se dejaron en
español a propósito (`§2`). La distinción: el README es la puerta de
entrada para el jurado, tener texto en español justo en el primer
bloque de código habría contradicho el propio pedido; `examples/*.ts`
sigue siendo contenido de demo en español sin que se haya pedido
cambiarlo — quedó preguntado explícitamente si también se traduce.

**Qué NO se tocó:** `CLAUDE.md`, `apuntes/`, `reglas_documentacion.md`
— siguen en español, son documentación interna del proyecto, no la
documentación pública que ve el jurado. `examples/*.ts` tampoco, ver
arriba.

**Pendiente de decisión del usuario:** publicar una versión nueva en
npm para que el README traducido quede visible en la página del
paquete (ver explicación en el chat — npm sirve el README que estaba
en el tarball de la versión publicada, no el del repo en vivo).

---

## §8 — 2026-09-02 — `quibix@0.1.1` — README en inglés ya visible en npm

**Qué se hizo:** el usuario corrió `npm version patch` y `npm publish`
en su propia terminal (0.1.0 → 0.1.1). Se verificó desde acá:
`npm view quibix version` (0.1.1), `npm view quibix readme` (confirma
que el registro ya sirve el README en inglés — no solo que se publicó,
sino que el contenido correcto llegó), y una instalación real de nuevo
en una carpeta aparte con los tres exports. Se sincronizó a GitHub el
commit + tag que generó `npm version patch` (`git push --follow-tags`,
no se habían pusheado solos). `CLAUDE.md` §8 tenía la versión vieja
(`0.1.0`) escrita a mano en el bullet de "publicado en npm" — quedó
desactualizada apenas se publicó la 0.1.1, se corrigió en este mismo
turno.

---

## §9 — 2026-09-03 — `@mcp-b/global` + primer demo local, verificado en navegador real

**Contexto:** el usuario pidió instalar `@mcp-b/global`, inicializarlo
en el entry point de la app antes de que se monte Quibix, y confirmar
`document.modelContext` en consola. El repo no tenía ningún entry point
de app (solo `src/` y `examples/*.ts`, sin HTML/bundler) — se paró
antes de inventar una arquitectura de demo sin preguntar (regla del
marco) y se le ofreció al usuario elegir entre Vite dev server o HTML
estático sin build; eligió Vite.

**Qué se hizo:**

1. `npm install @mcp-b/global` → `dependencies` (`^5.1.0`). Antes de
   instalarlo se verificó la API real contra dos fuentes con
   autoridad (docs.mcp-b.ai y el repo en GitHub), porque el registro
   de npm devuelve una descripción desactualizada/engañosa que
   menciona `navigator.modelContext` en versiones recientes — no era
   cierto, expone `document.modelContext`, coincide con la spec y con
   lo que Quibix ya tenía tipado.
2. `demo/index.html` + `demo/main.ts`: importa `@mcp-b/global` primero
   (efecto lateral), confirma por consola que `document.modelContext`
   existe, y recién después importa `examples/slas.example.ts` y
   `examples/germina.example.ts` (instanciarlos dispara el registro
   vía `@Expose`).
3. `npm run build` (de la librería) sigue limpio después de todo esto
   — no se tocó `src/`.
4. `package.json` → nuevo script `demo` (`vite demo`).

**Señal de alerta que casi se repite — instrumenté antes del segundo
intento, esta vez sí:** `npm install -D vite` trajo Vite 8, que por
default usa Rolldown (parser oxc) en vez de esbuild — y ese parser
rechaza los decoradores legacy con parámetros (`"Decorators are not
valid here"`), rompiendo el build. En vez de tantear una segunda
solución a ciegas, revisé la doc oficial de rolldown-vite buscando un
flag de compatibilidad; no lo encontré documentado, así que la
decisión fue **fijar `vite` a la major 6** (esbuild, soporte maduro de
`experimentalDecorators` desde hace años) en vez de pelear con un
motor bleeding-edge para un demo — funcionó al primer intento después
del diagnóstico. Esta sí es la aplicación correcta de la regla: se
nombró la causa raíz antes de actuar, no se adivinó una tercera vez.

**Verificación real, no solo "compiló":** se instaló `playwright`
temporalmente (`--no-save`, nunca tocó `package.json`/lockfile), se
levantó `vite demo` en background, y se manejó un Chromium headless de
verdad para leer la consola del navegador. Resultado exacto:
`document.modelContext` existe (`BrowserMcpServer`, la clase del
polyfill), y `getTools()` devuelve las dos tools con su `inputSchema`
e `readOnlyHint` correctos. **Hallazgo no trivial:** el campo
`fallbackUrl` que Quibix adjunta al objeto de la tool **no sobrevive**
el round-trip real de `getTools()` del polyfill (se descarta) —
confirma que la decisión de `§1`/`§7` de incrustarlo también en el
texto de `description` no era redundante, era la única vía que de
verdad llega al agente. Se limpió todo lo temporal después
(`playwright` desinstalado, servidor de dev matado, script de
verificación borrado — nada de esto quedó en el repo).

**Documentos actualizados en el mismo turno (regla de no dejar
contexto desactualizado):** `CLAUDE.md` §8 (demo pasa de ⬜ a 🟡, con
el detalle de qué falta) y la nota vieja de "el directorio está vacío"
en las notas para el agente (llevaba desde `§1` sin corregirse, ya no
era cierto); `apuntes/estructura/estructura-del-proyecto.md` con la
fila de `demo/` y las dependencias nuevas en `package.json`.

**Decisión propia — técnica-interna:** el script `demo` en
`package.json` no fue pedido explícitamente, se agregó por
consistencia con los demás scripts documentados (`build`, `dev`,
`clean`, `typecheck`, `prepublishOnly`) — sin él, `npm run demo` no
existiría y habría que acordarse de `npx vite demo` a mano.

---

## §10 — 2026-09-03 — README: secciones faltantes del brief original + fix de `dependencies`

**Qué se hizo:** el usuario pegó el brief original completo (en
español, las 9 secciones de siempre) y pidió agregarlo al README. Se
comparó contra el README actual (inglés) para no duplicar: la mayoría
ya estaba cubierta (los tres decoradores, cómo se ejecuta una tool,
por qué agnóstico, stack, referencias). Se agregaron, traducidas y
adaptadas, las tres piezas que faltaban:

1. **"The problem it solves"** — no existía como sección propia en el
   README; se agregó cerca del inicio.
2. **"Full example — a real use case: SLAS"** — el Quickstart solo
   tenía la versión simplificada de 2 parámetros; se agregó el ejemplo
   completo de 4 parámetros del brief original, marcado explícitamente
   como ilustrativo (usa `/* ... */` como placeholder, no valores
   reales) y con link a `examples/slas.example.ts` para la versión que
   sí corre. Se verificó con `esbuild` (parse-only, sin type-check)
   que el snippet no tiene errores de sintaxis antes de dejarlo en el
   README.
3. **"Hackathon demo — the two command types"** — el texto original
   hablaba de un video futuro; se actualizó para reflejar lo que ya es
   real (`demo/` con Vite, `npm run demo`) en vez de copiar la versión
   vieja tal cual, y se dejó una nota honesta de que el video grabado
   sigue pendiente (coincide con `CLAUDE.md` §8).

**Hallazgo al verificar, no al pedido — se corrigió sin pausar
(técnica-interna):** al revisar el `package.json` para el link del
demo, se encontró que `@mcp-b/global` (agregado en `§9`) había quedado
en `dependencies` en vez de `devDependencies`. Nunca se usa dentro de
`src/` — solo lo importa `demo/main.ts` — así que dejarlo en
`dependencies` significaba que cualquiera que hiciera
`npm install quibix` se traía ese polyfill sin necesitarlo,
contradiciendo lo que el propio README ya decía ("No required
framework runtime dependencies"). Se movió a `devDependencies`
(`npm uninstall` + `npm install -D`), se verificó que `npm run build`
y `npx vite build demo` siguen limpios después del cambio, y se limpió
el `demo/dist` que ese build de prueba generó (ya cubierto por
`.gitignore`, nunca llegó a git).

**Documentos actualizados en el mismo turno:**
`apuntes/estructura/estructura-del-proyecto.md` (la fila de
`package.json` decía "dependencia" para `@mcp-b/global`, ya no era
cierto).
