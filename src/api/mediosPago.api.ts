'use server';

import { MediosPagoDAO } from '../dao/mediosPago.dao';
import { MedioPago } from '../models/medioPago';

export async function getMediosPagoAction(): Promise<MedioPago[]> {
  return MediosPagoDAO.getAll();
}

export async function getMedioPagoByIdAction(id: string): Promise<MedioPago | null> {
  return MediosPagoDAO.getById(id);
}