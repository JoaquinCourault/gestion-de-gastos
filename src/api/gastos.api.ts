'use server';

import { GastosDAO } from '../dao/gastos.dao';
import { CrearGastoDTO } from '../dto/crearGasto.dto';
import { ActualizarGastoDTO } from '../dto/actualizarGasto.dto';
import { Gasto } from '../models/gasto';

export async function getGastosAction(): Promise<Gasto[]> {
  return GastosDAO.getAll();
}

export async function crearGastoAction(dto: CrearGastoDTO): Promise<Gasto> {
  return GastosDAO.create(dto);
}

export async function actualizarGastoAction(dto: ActualizarGastoDTO): Promise<Gasto | null> {
  return GastosDAO.update(dto);
}

export async function eliminarGastoAction(id: string): Promise<boolean> {
  return GastosDAO.delete(id);
}