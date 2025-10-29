export interface Deuda {
  idDeuda: string;
  Descripcion: string;
  Monto: number;
  Fecha: string; // DD/MM/YYYY
  Cuotas: number | null;
  Tarjeta: string;
  DebitoAutomatico: boolean;
  DebitoAutomaticoAnulado: boolean;
  TipoMoneda: string;
}

export interface Gasto {
  id?: string;
  descripcion: string;
  monto: number;
  fecha: string; // ISO
  medio: string;
}

export interface MedioPago {
  id: string;
  nombre: string;
  tipo: 'tarjeta' | 'otro';
}

export interface ResumenTarjeta {
  id: string;
  mes: number;
  anio: number;
  vencimiento: string; // ISO
  cierre: string; // ISO
  total: number;
  items: Deuda[];
}
