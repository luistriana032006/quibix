# Guía de publicación — Quibix

Cómo publicar Quibix como paquete instalable. Cubre la decisión de
**dónde** publicarlo y los pasos concretos para hacerlo.

## ¿En qué manejador de paquetes?

**npm.** Es la respuesta corta y no hay mucho que dudar acá:

- Es el registro por defecto de Node y de todos los bundlers
  (webpack, esbuild, vite, Next.js) — quien quiera usar Quibix en su
  proyecto va a esperar `npm install quibix` sin pensarlo dos veces.
- `package.json` ya está armado para esto: `main`/`module`/`types`
  apuntan a `dist/`, `exports` está declarado, `files` restringe lo
  que se publica.
- Es gratis para paquetes públicos, y **MIT ya es lo que pide el
  hackathon** — no hay fricción de licencia.

Existen alternativas (las menciono para que la duda quede resuelta,
no para que elijas entre ellas):

| Opción | Cuándo tendría sentido | Por qué no acá |
|---|---|---|
| **JSR** (jsr.io) | Librerías TS-first pensadas para Deno/Bun | Alcance mucho menor que npm hoy; los jueces del hackathon van a esperar npm |
| **GitHub Packages** | Paquetes privados internos de una org | Quibix es público — no gana nada, y complica el `npm install` de quien lo pruebe |

Conclusión: publicá en **npm**, y ya. El resto de esta guía asume eso.

**Nota — npm/yarn/pnpm no son "dónde" publicar, son "con qué".** Los
tres son herramientas (CLI) que instalan dependencias y pueden correr
`publish`; por defecto los tres publican al mismo lugar: el registro
de npm (`registry.npmjs.org`). No existe un "registro de pnpm"
separado — por eso no aparece en la tabla de arriba, no compite con
npm en esa pregunta como sí lo hacen JSR o GitHub Packages. Si en algún
momento preferís pnpm para desarrollar localmente (más rápido, menos
disco), es válido, pero no cambia nada de esta guía: `pnpm publish`
termina en el mismo lugar que `npm publish`.

**Verifiqué el nombre antes de escribir esto:** `quibix` está
disponible en npm (el registro devuelve 404 al día de hoy). No hace
falta buscar un nombre alternativo ni scopearlo (`@luistriana/quibix`)
a menos que prefieras eso por otra razón.

## 0. Prerrequisito: cuenta de npm

Si todavía no tenés cuenta: creála en https://www.npmjs.com/signup
(es gratis). La necesitás para el paso de login de abajo.

## 1. Repo público en GitHub (lo pide el hackathon, y ayuda al paquete)

El repo local ya tiene su primer commit (`git log` te lo muestra), pero
todavía no tiene remoto. Para conectarlo:

```bash
# Creá el repo vacío en GitHub primero (desde la web, o con gh):
gh repo create quibix --public --source=. --remote=origin

# Si ya lo creaste a mano en github.com:
git remote add origin https://github.com/<tu-usuario>/quibix.git

git push -u origin main
```

Una vez que el repo tiene URL, vale la pena agregar a `package.json`
(no lo hice yo para no tocar `package.json` sin que lo pidieras):

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/<tu-usuario>/quibix.git"
  },
  "bugs": {
    "url": "https://github.com/<tu-usuario>/quibix/issues"
  }
}
```

## 2. Login en npm

Esto es interactivo (abre el navegador para autenticar) — corrélo vos
en tu propia terminal, no yo:

```bash
npm login
```

Confirmá que quedaste logueado como quien esperás:

```bash
npm whoami
```

## 3. Build limpio antes de publicar

`npm publish` no corre el build por vos a menos que se lo digas
explícitamente. Hoy no hay un script `prepublishOnly`, así que el paso
manual es:

```bash
npm run clean
npm run build
```

**Recomendado (opcional, no lo apliqué):** agregar a `package.json` →
`scripts`:

```json
"prepublishOnly": "npm run clean && npm run build"
```

Así `npm publish` nunca puede salir con un `dist/` viejo o a medio
generar, sin que tengas que acordarte del paso manual cada vez.

## 4. Qué se va a publicar (verificalo antes de mandar)

`package.json` ya tiene `"files": ["dist", "README.md", "LICENSE"]`,
así que **solo eso** va al paquete — el `.gitignore` que excluye
`dist/` de git no afecta esto (`files` manda por encima). Para verlo
exactamente antes de publicar, sin publicar todavía:

```bash
npm pack --dry-run
```

Repasá la lista que imprime: debería ser `dist/**`, `README.md`,
`LICENSE`, `package.json` — nada de `src/`, `examples/`,
`reglas_documentacion.md` ni `apuntes/` (no están en `files`, así que
`npm pack` ya los excluye solo).

## 5. Publicar

```bash
npm publish
```

Si tu cuenta tiene 2FA activado (recomendado), te va a pedir un
código OTP en el momento.

Como `quibix` es un nombre sin scope (no `@algo/quibix`), **no** hace
falta `--access public` — eso solo aplica a paquetes scopeados, que
por defecto se publican privados.

## 6. Verificar que quedó bien

```bash
npm view quibix
```

Y probalo instalado de verdad, en una carpeta aparte (no la del
repo):

```bash
mkdir /tmp/quibix-smoke && cd /tmp/quibix-smoke
npm init -y
npm install quibix
node -e "import('quibix').then(m => console.log(Object.keys(m)))"
```

Deberías ver `[ 'Explain', 'Expose', 'Param' ]`.

## 7. Publicar una versión nueva (después de la primera vez)

`npm publish` a secas **no** te deja publicar dos veces la misma
versión (`0.1.0`). El flujo normal es:

```bash
npm version patch   # 0.1.0 -> 0.1.1 (fix)
npm version minor    # 0.1.0 -> 0.2.0 (feature nueva, sin romper API)
npm version major   # 0.1.0 -> 1.0.0 (rompe compatibilidad)

npm publish
```

`npm version` ya te crea el commit + tag de git por vos (usa el
mismo `package.json`), así que después solo falta:

```bash
git push && git push --tags
```

## Resumen de comandos, en orden, primera vez

```bash
gh repo create quibix --public --source=. --remote=origin
git push -u origin main

npm login
npm run clean && npm run build
npm pack --dry-run   # revisar qué se va a publicar
npm publish
npm view quibix      # confirmar
```
