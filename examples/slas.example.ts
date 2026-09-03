import { Expose, Explain, Param } from "../src/index.js";

/**
 * "action" example: executes/mutates real logic, with no useful
 * fallbackUrl (there's no result without running the tool live).
 *
 * The real contribution formula lives at slas.luistriana.dev — this one
 * is a simplified version just to demonstrate Quibix's decorator
 * pattern, not meant as a normative reference.
 */
const SMMLV_2026 = 1_423_500; // adjust to the current Colombian minimum wage

@Expose()
class SlasController {
  @Explain("Calcula los aportes a seguridad social de un independiente en Colombia", {
    type: "action",
  })
  execute(
    @Param("ingresoMensual", "number", "Ingreso mensual en COP") ingresoMensual: number,
    @Param("aportaARL", "boolean", "Si aporta a ARL") aportaARL: boolean,
    @Param("nivelRiesgo", "number", "Nivel de riesgo ARL, de 1 a 5") nivelRiesgo: number,
    @Param("aportaCCF", "boolean", "Si aporta a Caja de Compensación Familiar") aportaCCF: boolean
  ) {
    const ibc = Math.max(ingresoMensual * 0.4, SMMLV_2026);

    const salud = ibc * 0.125;
    const pension = ibc * 0.16;
    const arlRatesPorNivel = [0, 0.00522, 0.01044, 0.02436, 0.0435, 0.0696]; // index 0 unused
    const arl = aportaARL ? ibc * (arlRatesPorNivel[nivelRiesgo] ?? 0) : 0;
    const ccf = aportaCCF ? ibc * 0.02 : 0;
    const fsp = ibc > SMMLV_2026 * 4 ? ibc * 0.01 : 0;

    const total = salud + pension + arl + ccf + fsp;

    return { ibc, salud, pension, arl, ccf, fsp, total };
  }
}

// Instantiating is what triggers registration against document.modelContext.
export const slasController = new SlasController();
