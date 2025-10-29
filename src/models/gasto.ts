export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  categoriaId: string;
  medioDePagoId: string;
  deudaId: string|null;
}
