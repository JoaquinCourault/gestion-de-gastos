import fs from 'fs/promises';
import path from 'path';
import { ResumenTarjeta } from '../models/resumenTarjeta';
import { GenerarResumenDTO } from '../dto/generarResumen.dto';
import { DeudasDAO } from './deudas.dao';
import { v4 as uuidv4 } from 'uuid';

export class ResumenTarjetaDAO {
  private static readonly filePath = path.join(process.cwd(), 'resources', 'resumenTarjetaDeCredito.json');

  static async getAll(): Promise<ResumenTarjeta[]> {
    const content = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(content) as ResumenTarjeta[];
  }

  static async generate(dto: GenerarResumenDTO): Promise<ResumenTarjeta> {
    const resumen = await this.compute(dto);
    // Guardar el resumen (sobrescribir si ya existe uno con mismo mes/anio/vencimiento)
    const resumenes = await this.getAll();
    const idx = resumenes.findIndex(r => r.mes === resumen.mes && r.anio === resumen.anio && r.vencimiento === resumen.vencimiento);
    if (idx >= 0) {
      // preserve id
      resumen.id = resumenes[idx].id || resumen.id;
      resumenes[idx] = resumen;
    } else {
      resumenes.push(resumen);
    }
    await fs.writeFile(this.filePath, JSON.stringify(resumenes, null, 2));
    return resumen;
  }

  /**
   * Compute the resumen for a dto without persisting it. Useful for previewing which tarjetas
   * have movements for the selected vencimiento.
   */
  static async compute(dto: GenerarResumenDTO): Promise<ResumenTarjeta> {
    const deudas = await DeudasDAO.getAll();
    // Determine cierre and vencimiento. Accept either dto.cierre (preferred) or dto.vencimiento.
    let cierreDate: Date;
    let vencimiento: Date;
    if (dto.cierre) {
      cierreDate = new Date(dto.cierre);
      vencimiento = new Date(cierreDate);
      vencimiento.setDate(cierreDate.getDate() + 11);
    } else if (dto.vencimiento) {
      vencimiento = new Date(dto.vencimiento);
      cierreDate = new Date(vencimiento);
      cierreDate.setDate(vencimiento.getDate() - 11);
    } else {
      // fallback: use today
      cierreDate = new Date();
      vencimiento = new Date(cierreDate);
      vencimiento.setDate(cierreDate.getDate() + 11);
    }

    // Fecha de vencimiento anterior: mismo día mes anterior, corregido para meses con distinto número de días
    const lastDayOfPrevMonth = new Date(vencimiento.getFullYear(), vencimiento.getMonth(), 0).getDate();
    const dayForPrev = Math.min(vencimiento.getDate(), lastDayOfPrevMonth);
    const vencimientoAnterior = new Date(vencimiento.getFullYear(), vencimiento.getMonth() - 1, dayForPrev);

    // Helper: parse deuda Fecha (DD/MM/YYYY)
    function parseFecha(fechaStr: string) {
      const [day, month, year] = fechaStr.split('/').map(s => parseInt(s, 10));
      return new Date(year, month - 1, day);
    }

    // For each deuda, compute how many installments fall into (vencimientoAnterior, vencimiento]
    const items: any[] = [];
    const groupTotals: { [tarjeta: string]: number } = {};
    let grandTotal = 0;

    for (const deuda of deudas) {
      if (dto.tarjeta && deuda.Tarjeta !== dto.tarjeta) continue;

      const compraFecha = parseFecha(deuda.Fecha);
      const cuotas = deuda.Cuotas && deuda.Cuotas > 0 ? deuda.Cuotas : 1;
      const installmentAmount = Number(deuda.Monto || 0) / cuotas;

      // Generate installment dates: installment i occurs at compraFecha + i months (i from 0..cuotas-1)
      let includedInstallments = 0;
      const includedInstallmentDates: string[] = [];

      for (let i = 0; i < cuotas; i++) {
        const instDate = new Date(compraFecha);
        instDate.setMonth(compraFecha.getMonth() + i);

        if (instDate > vencimientoAnterior && instDate <= vencimiento) {
          includedInstallments++;
          includedInstallmentDates.push(instDate.toISOString());
        }
      }

      if (includedInstallments > 0) {
        const amountIncluded = +(includedInstallments * installmentAmount).toFixed(2);
        grandTotal += amountIncluded;

        // accumulate per tarjeta
        const tarjeta = deuda.Tarjeta || 'UNKNOWN';
        groupTotals[tarjeta] = +( (groupTotals[tarjeta] || 0) + amountIncluded ).toFixed(2);

        items.push({
          idDeuda: deuda.idDeuda,
          Descripcion: deuda.Descripcion,
          Monto: deuda.Monto,
          Cuotas: deuda.Cuotas,
          Tarjeta: deuda.Tarjeta,
          TipoMoneda: deuda.TipoMoneda,
          includedInstallments,
          amountIncluded,
          includedInstallmentDates
        });
      }
    }

    const resumen: ResumenTarjeta = {
      id: uuidv4(),
      mes: dto.mes,
      anio: dto.anio,
      cierre: cierreDate.toISOString(),
      vencimiento: vencimiento.toISOString(),
      total: +grandTotal.toFixed(2),
      items,
      groupTotals
    };

    return resumen;
  }

  static async delete(id: string): Promise<boolean> {
    const resumenes = await this.getAll();
    const filtered = resumenes.filter(r => r.id !== id);
    
    if (filtered.length === resumenes.length) return false;
    
    await fs.writeFile(this.filePath, JSON.stringify(filtered, null, 2));
    return true;
  }
}