import fs from 'fs/promises';
import path from 'path';
import { MedioPago } from '../models/medioPago';

export class MediosPagoDAO {
  private static readonly filePath = path.join(process.cwd(), 'resources', 'mediosPago.json');

  static async getAll(): Promise<MedioPago[]> {
    const content = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(content) as MedioPago[];
  }

  static async getById(id: string): Promise<MedioPago | null> {
    const medios = await this.getAll();
    return medios.find(m => m.id === id) || null;
  }
}