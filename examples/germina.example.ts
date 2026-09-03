import { Expose, Explain, Param } from "../src/index.js";

/**
 * "query" example: read-only lookup, with a fallbackUrl for agents that
 * can't execute the tool interactively.
 */
@Expose()
class GerminaController {
  @Explain("Consulta información de salud sexual y reproductiva por país", {
    type: "query",
    fallbackUrl: "https://germina.health/{pais}",
  })
  consultarPais(@Param("pais", "string", "Nombre o código ISO del país a consultar") pais: string) {
    // Real logic: fetch/lookup against Germina's database.
    // Simplified here for the hackathon demo.
    return {
      pais,
      url: `https://germina.health/${encodeURIComponent(pais)}`,
      resumen: `Información de salud sexual y reproductiva disponible para ${pais}.`,
    };
  }
}

// Instantiating is what triggers registration against document.modelContext.
export const germinaController = new GerminaController();
