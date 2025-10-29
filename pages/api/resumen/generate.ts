import type { NextApiRequest, NextApiResponse } from 'next';
import { ResumenTarjetaDAO } from '../../../src/dao/resumenTarjeta.dao';
import { GenerarResumenDTO } from '../../../src/dto/generarResumen.dto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const dto: GenerarResumenDTO = req.body;
    // basic validation: require mes, anio and at least cierre or vencimiento
    if (!dto || (!dto.vencimiento && !dto.cierre) || !dto.mes || !dto.anio) {
      return res.status(400).json({ message: 'Invalid payload - require mes, anio and cierre or vencimiento' });
    }

    const resumen = await ResumenTarjetaDAO.generate(dto);
    return res.status(200).json(resumen);
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Error generating resumen' });
  }
}
