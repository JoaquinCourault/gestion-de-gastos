import fs from 'fs/promises';
import path from 'path';
import { Gasto } from '../models/gasto';
import { CrearGastoDTO } from '../dto/crearGasto.dto';
import { ActualizarGastoDTO } from '../dto/actualizarGasto.dto';
import { v4 as uuidv4 } from 'uuid';

export class GastosDAO {
  private static readonly filePath = path.join(process.cwd(), 'resources', 'gastos.json');

  static async getAll(): Promise<Gasto[]> {
    const content = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(content) as Gasto[];
  }

  static async create(dto: CrearGastoDTO): Promise<Gasto> {
    const gastos = await this.getAll();
    const nuevoGasto: Gasto = {
      ...dto,
      id: uuidv4()
    };
    
    gastos.push(nuevoGasto);
    await fs.writeFile(this.filePath, JSON.stringify(gastos, null, 2));
    
    return nuevoGasto;
  }

  static async update(dto: ActualizarGastoDTO): Promise<Gasto | null> {
    const gastos = await this.getAll();
    const index = gastos.findIndex(g => g.id === dto.id);
    
    if (index === -1) return null;
    
    const gastoActualizado = {
      ...gastos[index],
      ...dto
    };
    
    gastos[index] = gastoActualizado;
    await fs.writeFile(this.filePath, JSON.stringify(gastos, null, 2));
    
    return gastoActualizado;
  }

  static async delete(id: string): Promise<boolean> {
    const gastos = await this.getAll();
    const filtered = gastos.filter(g => g.id !== id);
    
    if (filtered.length === gastos.length) return false;
    
    await fs.writeFile(this.filePath, JSON.stringify(filtered, null, 2));
    return true;
  }
}