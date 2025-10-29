export interface GenerarResumenDTO {
  mes: number;
  anio: number;
  // Accept either 'cierre' (fecha de cierre que le pasas) or 'vencimiento' (precalculado).
  // If 'cierre' is provided, the code will compute vencimiento = cierre + 11 days.
  cierre?: string; // ISO date string (YYYY-MM-DD or full ISO)
  vencimiento?: string; // ISO date string (YYYY-MM-DD or full ISO)
  tarjeta?: string;
}
