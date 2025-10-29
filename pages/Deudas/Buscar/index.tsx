import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, useToast, Select, Input, Stack, Text, VStack, TableContainer, Grid } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { Deuda } from '../../../src/models/deuda';

export default function BuscarDeudas() {
  const toast = useToast();
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ desde: '', hasta: '', tarjeta: '', buscar: '' });
  // tarjetas options loaded from mediosPago
  const [tarjetas, setTarjetas] = useState<string[]>([]);

  useEffect(() => {
    // load tarjetas (credit cards) for the select
    fetch('/api/mediosPago')
      .then(r => r.ok ? r.json() : [])
      .then((m: any[]) => {
        const cards = (m || []).filter(x => x.tipo === 'CreditCard').map(x => x.nombre);
        setTarjetas(cards);
      })
      .catch(() => setTarjetas([]));

    fetchDeudas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildQuery = (params: Record<string, any>) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return qs ? `?${qs}` : '';
  };

  async function fetchDeudas(params: { tarjeta?: string; buscar?: string; desde?: string; hasta?: string } = {}) {
    setLoading(true);
    try {
      const q = buildQuery(params);
      const res = await fetch(`/api/deudas${q}`);
      if (!res.ok) throw new Error('Error fetching deudas');
      const data = await res.json();
      setDeudas(data || []);
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar las deudas', status: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // apply dynamic search whenever filter changes
  useEffect(() => {
    fetchDeudas({ tarjeta: filter.tarjeta, buscar: filter.buscar, desde: filter.desde, hasta: filter.hasta });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.tarjeta, filter.buscar, filter.desde, filter.hasta]);

  const clearSearch = () => { setFilter({ desde: '', hasta: '', tarjeta: '', buscar: '' }); fetchDeudas(); };

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading mb={4}>Buscar deudas</Heading>

        <Stack spacing={4} mb={4}>
          <Grid templateColumns={["1fr", "2fr 1fr"]} gap={4}>
            <Input
              placeholder="Buscar por descripción..."
              value={filter.buscar}
              onChange={e => setFilter(f => ({ ...f, buscar: e.target.value }))}
            />

            <Select value={filter.tarjeta} onChange={e => setFilter(f => ({ ...f, tarjeta: e.target.value }))} placeholder="Todas las tarjetas" minW="200px">
              {tarjetas.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>

            <Input type="date" value={filter.desde} onChange={e => setFilter(f => ({ ...f, desde: e.target.value }))} placeholder="Desde" />
            <Input type="date" value={filter.hasta} onChange={e => setFilter(f => ({ ...f, hasta: e.target.value }))} placeholder="Hasta" />
          </Grid>

          <Text fontSize="sm" color="gray.500">Todos los campos son opcionales</Text>
          <Text fontSize="sm" color="gray.700">Resultados: {deudas.length}</Text>
        </Stack>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Descripción</Th>
                <Th isNumeric>Monto</Th>
                <Th>Fecha</Th>
                <Th>Cuotas</Th>
                <Th>Tarjeta</Th>
                <Th>Moneda</Th>
              </Tr>
            </Thead>
            <Tbody>
              {deudas.map(d => (
                <Tr key={d.idDeuda}>
                  <Td>{d.Descripcion}</Td>
                  <Td isNumeric>{d.Monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
                  <Td>{d.Fecha}</Td>
                  <Td>{d.Cuotas || '-'}</Td>
                  <Td>{d.Tarjeta}</Td>
                  <Td>{d.TipoMoneda}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}
