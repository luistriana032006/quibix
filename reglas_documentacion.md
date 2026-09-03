Reglas del Método AR — para el agente
Pegar directo en el CLAUDE.md (o equivalente) de cualquier proyecto vibe-codeado. Le habla al modelo, no al humano. Si Claude Code soporta imports en tu versión, también podés dejarlo aparte e importarlo con @ruta/reglas-para-el-agente.md dentro del CLAUDE.md del proyecto.

Antes de empezar cualquier tarea
Si no existe un documento de contexto del proyecto (stack, estructura, convenciones, qué NO tocar), decilo y pedí que se cree antes de escribir código. Si ya existe, usalo como mapa — no releas todo el repo por tu cuenta para reconstruirlo.
Si el proyecto lleva varias sesiones, buscá primero un documento de estado o historial reciente antes de proponer un plan. No repreguntes lo que ya está documentado.
Identificá qué NO entra en el bloque de trabajo actual. Si no está explícito, preguntalo antes de arrancar. No "mejores" cosas fuera de ese alcance sin avisar primero.
Mientras ejecutás
Al terminar cada paso o archivo relevante, reportá: qué tocaste y por qué, qué errores encontraste, y si resolviste algo distinto a lo pedido — y cómo.
Si tomaste una decisión que no estaba en el plan, marcala explícitamente como decisión propia. No la mezcles como si fuera parte del pedido original.
No todas las decisiones propias pesan igual — clasificalas: cosmética, técnica-interna (implementación, no cambia lo que el usuario ve o decide) o de producto (cambia comportamiento, alcance o dirección). Si es de producto, PARÁ y proponela antes de codear — no la reportes como hecho consumado al final. Las cosméticas y técnicas sí podés reportarlas juntas al cerrar.
Ningún secreto (token, contraseña, clave API, .env) entra a este chat — ni pegado por el usuario ni generado por vos. Si detectás que uno lo tocó por accidente, decilo explícitamente y recomendá rotarlo, se haya usado o no.
Si vas a crear un archivo o carpeta nuevos, usá la convención de nombres del proyecto (ver abajo) en vez de improvisar un estilo distinto al que ya existe.
Señal de alerta — dos fallos seguidos en lo mismo
Si intentaste resolver algo, falló, y tu segundo intento también falla (aunque sea de otra forma distinta): PARÁ. No propongas una tercera hipótesis a ciegas.
Decilo explícitamente ("esto ya lleva dos intentos fallidos"). Instrumentá antes de seguir — logs, trazas, inspección real del estado, no otra suposición.
Si lo resolvés después de eso, cerralo con un mini reporte: qué se probó en cada ronda, cuál fue la causa raíz, y la lección para no repetir el patrón. No cierres solo con "listo, ya funciona".
Al cerrar una sesión o bloque de trabajo
Reportá cuánto te desviaste del plan original y por qué, aunque no te lo pidan explícitamente.
Si el proyecto tiene una bitácora o historial que crece (changelog, notas de funcionalidades, etc.), agregá tu entrada con un identificador propio (número o ancla) en vez de reescribir el documento entero.
Si vas a dejar el trabajo para retomar en otra sesión, generá o actualizá un resumen corto de "qué se hizo / qué falta / qué verificar". No asumas que la próxima sesión va a leer todo el chat anterior. Nombrá ese archivo con la fecha del día en que lo escribís (no la fecha que describe) para que el rol del documento sea reconocible sin abrirlo.
Si construiste algo completo y funcional pero terminó revertido (a pedido del usuario o porque no encajó), documentalo con el mismo nivel de detalle que una funcionalidad que sí quedó — qué se hizo, por qué se deshizo. Sin eso, una sesión futura puede volver a proponer lo mismo que ya se descartó.
Nombres de archivo
kebab-case siempre (minúsculas, guiones) — excepto los nombres que se reconocen por convención fija (README.md, CHANGELOG.md, CLAUDE.md).
Fechas en ISO completo AAAA-MM-DD, con ceros a la izquierda, año incluido. Si ls | sort no da el orden cronológico real, el nombre está mal — nunca 9jul o 10jul sin año.
La versión de un documento no se pega al nombre del archivo (funcionalidades2.md es ambiguo, parece un duplicado). Preferí anclas estables dentro del mismo archivo (§1, §2...); si de verdad hay que partirlo, usá guion explícito (funcionalidades-v2.md).
Un rol de documento = un nombre fijo en todo el proyecto, sin importar qué día se escribe (ej.: el snapshot para retomar sesión siempre se llama igual, con la fecha como único dato variable).
Antes de crear un archivo nuevo, mirá cómo se llaman los que ya existen en esa carpeta y seguí el mismo patrón — no arrancarlo de cero con tu propio criterio si el proyecto ya tiene uno.
Documentación del proyecto
Si generaste una funcionalidad nueva y el proyecto no tiene documentación mínima de sus procesos o decisiones, proponé documentarla (qué hace, por qué se decidió así, cómo probarla) en vez de dejar que solo quede en el código.
Nunca dejes un documento de contexto desactualizado después de un cambio que lo invalida. Actualizalo en el mismo turno o avisá explícitamente que quedó pendiente.
Si alguna de estas reglas choca con una instrucción directa y explícita del usuario en el momento, gana la instrucción del usuario — esto es un default, no una camisa de fuerza.