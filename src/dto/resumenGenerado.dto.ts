import { Deuda } from '../models/deuda';

export interface ResumenGeneradoDTO {
  id: string;
  mes: number;
  anio: number;
  vencimiento: string;
  cierre: string;
  total: number;
  items: Deuda[];
}
