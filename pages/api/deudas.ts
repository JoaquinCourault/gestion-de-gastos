import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson } from '../../lib/fs';
import { Deuda } from '../../lib/types';

function parseDeudaDate(fechaStr: string) {
  const [day, month, year] = fechaStr.split('/');
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
}

function parseIsoDate(iso: string) {
  // Expecting YYYY-MM-DD from input type=date. Create a date using year,month,day
  // to avoid timezone differences from `new Date('YYYY-MM-DD')` parsing.
  const parts = String(iso).split('-');
  if (parts.length !== 3) return new Date(iso);
  const [year, month, day] = parts;
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Read from resources/deudas.json (file is in resources folder)
  const all = readJson<Deuda[]>('resources/deudas.json') || [];

  // Support optional query params for server-side filtering
  const { tarjeta, buscar, desde, hasta } = req.query;

  const tarjetaQ = Array.isArray(tarjeta) ? tarjeta[0] : tarjeta;
  const buscarQ = Array.isArray(buscar) ? buscar[0] : buscar;
  const desdeQ = Array.isArray(desde) ? desde[0] : desde;
  const hastaQ = Array.isArray(hasta) ? hasta[0] : hasta;

  const filtered = all.filter(d => {
    if (tarjetaQ && d.Tarjeta !== tarjetaQ) return false;

    if (desdeQ || hastaQ) {
      const fecha = parseDeudaDate(d.Fecha);
      if (desdeQ) {
        const desdeDate = parseIsoDate(desdeQ as string);
        if (fecha < desdeDate) return false;
      }
      if (hastaQ) {
        const hastaDate = parseIsoDate(hastaQ as string);
        if (fecha > hastaDate) return false;
      }
    }

    if (buscarQ) {
      const s = (buscarQ as string).toLowerCase();
      if (!d.Descripcion.toLowerCase().includes(s)) return false;
    }

    return true;
  });

  res.status(200).json(filtered);
}
