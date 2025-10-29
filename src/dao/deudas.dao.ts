import fs from 'fs/promises';
import path from 'path';
import { Deuda } from '../models/deuda';
import { FiltrarDeudasDTO } from '../dto/filtrarDeudas.dto';

export class DeudasDAO {
  private static readonly filePath = path.join(process.cwd(), 'resources', 'deudas.json');

  static async getAll(): Promise<Deuda[]> {
    const content = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(content) as Deuda[];
  }

  static async filtrar({ desde, hasta, tarjeta }: FiltrarDeudasDTO): Promise<Deuda[]> {
    const deudas = await this.getAll();
    
    return deudas.filter(deuda => {
      if (tarjeta && deuda.Tarjeta !== tarjeta) return false;
      
      if (desde || hasta) {
        const [day, month, year] = deuda.Fecha.split('/');
        const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (desde && fecha < new Date(desde)) return false;
        if (hasta && fecha > new Date(hasta)) return false;
      }
      
      return true;
    });
  }
}