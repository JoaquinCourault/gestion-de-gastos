import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, useToast, HStack, Select, Input, Grid, Stack, Text, VStack, TableContainer } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Deuda } from '../../../src/models/deuda';


function lastThursdayOfMonth(year: number, monthZeroBased: number) {
  const d = new Date(year, monthZeroBased + 1, 0);
  while (d.getDay() !== 4) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
  } catch (e) {
    return n.toFixed(2);
  }
}

function formatDateShort(d: string) {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return format(dt, 'dd/MM/yyyy');
  } catch (e) {
    return d;
  }
}

export default function Resumen() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    desde: '',
    hasta: '',
    tarjeta: '',
    buscar: ''
  });
  const toast = useToast();
  // Search input (typed value) - applied when user clicks Buscar
  const [searchInput, setSearchInput] = useState('');

  // Resumen state
  const [generatingResumen, setGeneratingResumen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResumen, setPreviewResumen] = useState<any | null>(null);
  const [resumen, setResumen] = useState<any | null>(null);
  const [form, setForm] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    cierre: '' as string
  });

  // keep the visible search input in sync with the applied filter
  useEffect(() => {
    setSearchInput(filter.buscar || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.buscar]);

  useEffect(() => {
    const d = lastThursdayOfMonth(form.anio, form.mes - 1);
    const isoDate = d.toISOString().slice(0, 10);
    setForm(f => ({ ...f, cierre: isoDate }));
  }, [form.mes, form.anio]);

  const generateResumen = async () => {
    try {
      setGeneratingResumen(true);

      const payload = {
        mes: form.mes,
        anio: form.anio,
        cierre: form.cierre
      };

      const res = await fetch('/api/resumen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al generar resumen');

      const data = await res.json();
      setResumen(data);
      toast({
        title: 'Resumen generado',
        description: `Se generó el resumen para ${form.mes}/${form.anio}`,
        status: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el resumen',
        status: 'error'
      });
    } finally {
      setGeneratingResumen(false);
    }
  };

  const exportToExcel = async () => {
    if (!resumen) return;
    try {
      const XLSX = await import('xlsx');

      const wb = XLSX.utils.book_new();

      const sheetRows: any[] = [];

      // Header info
      sheetRows.push([`Resumen: ${resumen.mes}/${resumen.anio}`]);
      sheetRows.push([]);

      // Total
      sheetRows.push(['Total', Number(resumen.total || 0)]);
      sheetRows.push([]);

      // Totals by tarjeta
      sheetRows.push(['Totales por Tarjeta']);
      sheetRows.push(['Tarjeta', 'Monto']);
      if (resumen.groupTotals) {
        Object.entries(resumen.groupTotals).forEach(([tarjeta, monto]) => {
          sheetRows.push([tarjeta, Number(monto)]);
        });
      }
      sheetRows.push([]);

      // Items
      sheetRows.push(['Items incluidos']);
      sheetRows.push(['Descripción', 'Tarjeta', 'Monto incluido', 'Cuotas incluidas', 'Fechas']);
      (resumen.items || []).forEach((it: any) => {
        const descripcion = it.Descripcion || it.descripcion || '';
        const tarjeta = it.Tarjeta || it.tarjeta || '';
        const monto = Number(it.amountIncluded || it.montoIncluido || 0);
        const cuotas = Number(it.includedInstallments || (it.cuotasIncluidas ?? 0));
        const fechas = (it.includedInstallmentDates || it.fechas || []).map((d: string) => {
          try {
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return d;
            return format(dt, 'dd/MM/yyyy');
          } catch {
            return d;
          }
        }).join(', ');

        sheetRows.push([descripcion, tarjeta, monto, cuotas, fechas]);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetRows);

      // Set column widths for readability
      ws['!cols'] = [
        { wch: 50 }, // descripcion
        { wch: 20 }, // tarjeta
        { wch: 15 }, // monto
        { wch: 15 }, // cuotas
        { wch: 40 }  // fechas
      ];

      // Try to set number format for monto column (C) and cuota column (D)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        // column C -> index 2
        const cellAddress = { c: 2, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = ws[cellRef];
        if (cell && (typeof cell.v === 'number')) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
        // column D -> cuotas
        const cellAddressD = { c: 3, r: R };
        const cellRefD = XLSX.utils.encode_cell(cellAddressD);
        const cellD = ws[cellRefD];
        if (cellD && (typeof cellD.v === 'number')) {
          cellD.t = 'n';
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Resumen');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const paddedMonth = String(resumen.mes).padStart(2, '0');
      a.download = `resumen_${resumen.anio}_${paddedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo exportar a Excel', status: 'error' });
    }
  };

  const resumenRef = useRef<HTMLDivElement | null>(null);

  const exportToPdf = async () => {
    if (!resumenRef.current || !resumen) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const element = resumenRef.current;

      // Clone the element and expand it so html2canvas captures all content (including scrolled items)
      const clone = element.cloneNode(true) as HTMLElement;
      // Ensure clone has no height limit and visible overflow
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      // Set width to match original to preserve layout
      clone.style.width = `${element.offsetWidth}px`;
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate the image height in PDF units (mm)
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

      let heightLeft = imgHeight - pdfHeight;
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // remove the clone from the DOM
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);

      const paddedMonth = String(resumen.mes).padStart(2, '0');
      pdf.save(`resumen_${resumen.anio}_${paddedMonth}.pdf`);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo exportar a PDF', status: 'error' });
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} bg="white" rounded="lg" shadow="base">
        <Heading size="md" mb={4}>Generar Resumen</Heading>
        <Stack spacing={4}>
          <Select
            value={form.mes}
            onChange={e => setForm(f => ({ ...f, mes: parseInt(e.target.value) }))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {format(new Date(form.anio, i), 'MMMM')}
              </option>
            ))}
          </Select>

          <Input
            type="number"
            value={form.anio}
            onChange={e => setForm(f => ({ ...f, anio: parseInt(e.target.value) }))}
            placeholder="Año"
          />

          <Box>
            <Text fontSize="sm" mb={1}>Fecha de cierre (último jueves por defecto)</Text>
            <Input
              type="date"
              value={form.cierre}
              onChange={e => setForm(f => ({ ...f, cierre: e.target.value }))}
            />
          </Box>

          <Stack direction={["column", "row"]} spacing={3}>
            <Button colorScheme="gray" onClick={async () => {
              try {
                setPreviewing(true);
                setPreviewResumen(null);
                const payload = { mes: form.mes, anio: form.anio, cierre: form.cierre };
                const res = await fetch('/api/resumen/preview', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify(payload) 
                });
                if (!res.ok) throw new Error('preview error');
                const data = await res.json();
                setPreviewResumen(data);
              } catch (e) {
                toast({ title: 'Error', description: 'No se pudo obtener preview', status: 'error' });
              } finally {
                setPreviewing(false);
              }
            }} isLoading={previewing}>
              Preview
            </Button>

            <Button colorScheme="blue" onClick={generateResumen} isLoading={generatingResumen}>
              Generar Resumen
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Preview box */}
      {previewResumen && (
        <Box p={4} bg="gray.50" rounded="md">
          <Text fontWeight="semibold">Preview (no guarda):</Text>
          <Text>Totales por tarjeta:</Text>
          {previewResumen.groupTotals && Object.entries(previewResumen.groupTotals).map(([t, m]: [string, any]) => (
            <Text key={t} ml={2}>{t}: {formatCurrency(Number(m))}</Text>
          ))}
        </Box>
      )}

      {/* Resumen Results */}
      {resumen && (
        <Box ref={resumenRef} p={6} bg="white" rounded="lg" shadow="base" maxH={"350px"} overflowY="auto">
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Resumen generado ({resumen.mes}/{resumen.anio})</Heading>
            <HStack>
              <Button colorScheme="green" size="sm" onClick={exportToExcel}>Crear Planilla de Excel</Button>
              <Button colorScheme="red" size="sm" onClick={exportToPdf}>Crear PDF</Button>
            </HStack>
          </HStack>

          <Stack spacing={4} mb={4}>
            <Text><strong>Total:</strong> {formatCurrency(resumen.total || 0)}</Text>
            <Box>
              <Text fontWeight="semibold" mb={2}>Totales por Tarjeta</Text>
              {resumen.groupTotals && Object.keys(resumen.groupTotals).length === 0 && (
                <Text>Sin movimientos por tarjeta.</Text>
              )}
              {resumen.groupTotals && Object.entries(resumen.groupTotals).map(([tarjeta, monto]) => (
                <Text key={tarjeta}>{tarjeta}: {formatCurrency(Number(monto))}</Text>
              ))}
            </Box>
          </Stack>

          <Box>
            <Text fontWeight="semibold" mb={2}>Items incluidos</Text>
            {(!resumen.items || resumen.items.length === 0) && <Text>No hay items incluidos en este resumen.</Text>}
            {resumen.items && resumen.items.length > 0 && (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Descripción</Th>
                      <Th>Tarjeta</Th>
                      <Th isNumeric>Monto incluido</Th>
                      <Th isNumeric>Cuotas incluidas</Th>
                      <Th>Fechas</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {resumen.items.map((it: any) => (
                      <Tr key={it.idDeuda || `${it.descripcion}-${Math.random()}`}>
                        <Td>{it.Descripcion || it.descripcion}</Td>
                        <Td>{it.Tarjeta || it.tarjeta}</Td>
                        <Td isNumeric>{formatCurrency(it.amountIncluded || it.montoIncluido || 0)}</Td>
                        <Td isNumeric>{it.includedInstallments || (it.cuotasIncluidas ?? 0)}</Td>
                        <Td>{(it.includedInstallmentDates || it.fechas || []).map((d: string) => formatDateShort(d)).join(', ')}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      )}
    </VStack>
  );
}