'use server';

import { ResumenTarjetaDAO } from '../dao/resumenTarjeta.dao';
import { GenerarResumenDTO } from '../dto/generarResumen.dto';
import { ResumenTarjeta } from '../models/resumenTarjeta';

export async function getResumenesAction(): Promise<ResumenTarjeta[]> {
  return ResumenTarjetaDAO.getAll();
}

export async function generarResumenAction(dto: GenerarResumenDTO): Promise<ResumenTarjeta> {
  return ResumenTarjetaDAO.generate(dto);
}

export async function eliminarResumenAction(id: string): Promise<boolean> {
  return ResumenTarjetaDAO.delete(id);
}