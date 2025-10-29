import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson } from '../../lib/fs';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const medios = readJson<any[]>('resources/mediosPago.json') || [];
    res.status(200).json(medios);
  } catch (e) {
    res.status(500).json({ message: 'Error reading mediosPago' });
  }
}
