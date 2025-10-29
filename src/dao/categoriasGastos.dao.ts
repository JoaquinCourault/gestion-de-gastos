import fs from 'fs/promises';
import path from 'path';
import { CategoriaGasto } from '../models/categoriaGasto';

export class CategoriasGastosDAO {
  private static readonly filePath = path.join(process.cwd(), 'resources', 'categoriaGasto.json');

  static async getAll(): Promise<CategoriaGasto[]> {
    const raw = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(raw) as CategoriaGasto[];
  }

  static async getById(id: string): Promise<CategoriaGasto | null> {
    const all = await this.getAll();
    return all.find(c => c.id === id) || null;
  }
}
