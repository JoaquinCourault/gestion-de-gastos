export interface Deuda {
  idDeuda: string;
  Descripcion: string;
  Monto: number;
  Fecha: string;
  Cuotas: number | null;
  Tarjeta: string;
  DebitoAutomatico: boolean;
  DebitoAutomaticoAnulado: boolean;
  TipoMoneda: string;
}
