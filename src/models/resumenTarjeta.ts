import { Deuda } from './deuda';

export interface ResumenTarjeta {
  id: string;
  mes: number;
  anio: number;
  vencimiento: string; // ISO format
  cierre: string; // ISO format
  total: number;
  items: Deuda[];
  // total por tarjeta
  groupTotals?: { [tarjeta: string]: number };
}
