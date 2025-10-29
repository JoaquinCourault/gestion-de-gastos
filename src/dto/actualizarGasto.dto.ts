import { CrearGastoDTO } from './crearGasto.dto';

export interface ActualizarGastoDTO extends Partial<CrearGastoDTO> {
  id: string;
}
