import { NextApiRequest, NextApiResponse } from 'next';
import { CategoriasGastosDAO } from '../../src/dao/categoriasGastos.dao';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const cats = await CategoriasGastosDAO.getAll();
      return res.status(200).json(cats);
    }
    return res.status(405).end();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
