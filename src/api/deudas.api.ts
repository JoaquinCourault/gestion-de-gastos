'use server';

import { DeudasDAO } from '../dao/deudas.dao';
import { FiltrarDeudasDTO } from '../dto/filtrarDeudas.dto';
import { Deuda } from '../models/deuda';

export async function getDeudasAction(): Promise<Deuda[]> {
  return DeudasDAO.getAll();
}

export async function filtrarDeudasAction(filtros: FiltrarDeudasDTO): Promise<Deuda[]> {
  return DeudasDAO.filtrar(filtros);
}