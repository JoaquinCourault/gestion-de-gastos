import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Select, Button, HStack } from '@chakra-ui/react';
import type { Deuda } from '../src/models/deuda';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const COLORS = ['#4FD1C5', '#63B3ED', '#F6AD55', '#F56565', '#A78BFA', '#68D391', '#E6FFFA', '#F9CB40', '#7F8C8D', '#E59866'];

export default function Home() {
  const toast = useToast();
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-based
  const currentYear = today.getFullYear();

  // Filters (null means 'Todos')
  const [monthFilter, setMonthFilter] = useState<number | null>(currentMonth);
  const [yearFilter, setYearFilter] = useState<number | null>(currentYear);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/deudas')
      .then(r => r.ok ? r.json() : Promise.reject('fetch error'))
      .then((data: Deuda[]) => {
        if (mounted) setDeudas(data || []);
      })
      .catch(() => toast({ title: 'Error', description: 'No se pudieron cargar las deudas', status: 'error' }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apply filters (month/year) — default to current month/year unless user clears them
  const parseFecha = (fecha: string) => {
    const parts = (fecha || '').split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return { day, month, year };
  };

  const filteredDeudas = deudas.filter(d => {
    const p = parseFecha(d.Fecha);
    if (!p) return false;
    if (monthFilter !== null && p.month !== monthFilter) return false;
    if (yearFilter !== null && p.year !== yearFilter) return false;
    return true;
  });

  // compute total monto and count on filtered data
  const totalAmount = filteredDeudas.reduce((s, d) => s + (Number(d.Monto) || 0), 0);
  const totalCount = filteredDeudas.length;

  // group by tarjeta for pie chart
  const byTarjetaMap: Record<string, number> = {};
  filteredDeudas.forEach(d => {
    const k = d.Tarjeta || 'Sin tarjeta';
    byTarjetaMap[k] = (byTarjetaMap[k] || 0) + (Number(d.Monto) || 0);
  });
  const pieData = Object.entries(byTarjetaMap).map(([name, value]) => ({ name, value }));

  // helper to generate an HSL color when palette is exceeded
  const generateHsl = (i: number) => `hsl(${(i * 47) % 360}, 65%, 55%)`;

  // sort pie data descending so colors map consistently to largest slices
  const pieDataSorted = [...pieData].sort((a, b) => (b.value || 0) - (a.value || 0));

  // group by month for bar chart (use Fecha DD/MM/YYYY)
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const byMonthMap: Record<number, number> = {};
  // For bar chart: if both month and year filters are set, show daily totals for that month;
  // otherwise show monthly totals (possibly aggregated across years or filtered year).
  if (monthFilter !== null && yearFilter !== null) {
    // daily totals
    const daysInMonth = new Date(yearFilter, monthFilter + 1, 0).getDate();
    const byDay: Record<number, number> = {};
    filteredDeudas.forEach(d => {
      const p = parseFecha(d.Fecha);
      if (!p) return;
      const key = p.day;
      byDay[key] = (byDay[key] || 0) + (Number(d.Monto) || 0);
    });
    const barData = Array.from({ length: daysInMonth }, (_, i) => ({
      month: String(i + 1),
      monto: Math.round((byDay[i + 1] || 0) * 100) / 100,
    }));
    // override later by reassigning via local variable in rendering scope
    // We'll set a shadow variable to use in JSX below
    // eslint-disable-next-line no-unused-vars
    var computedBarData = barData;
  } else {
    deudas.forEach(d => {
      const parts = (d.Fecha || '').split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[1], 10) - 1;
        byMonthMap[month] = (byMonthMap[month] || 0) + (Number(d.Monto) || 0);
      }
    });
    const barData = Array.from({ length: 12 }, (_, i) => ({
      month: months[i],
      monto: Math.round((byMonthMap[i] || 0) * 100) / 100,
    }));
    // eslint-disable-next-line no-unused-vars
    var computedBarData = barData;
  }
  

  return (
    <VStack spacing={8} align="stretch">
      <Heading>Dashboard</Heading>

      <SimpleGrid columns={[1, 2]} spacing={6}>
        <Box p={6} bg="white" rounded="lg" shadow="base">
          <Heading size="md" mb={4}>Balance general</Heading>
          <SimpleGrid columns={3} spacing={4}>
            <Stat>
              <StatLabel>Total Gastos</StatLabel>
              <StatNumber>{totalAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</StatNumber>
              <StatHelpText>{totalCount} items</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Tarjetas</StatLabel>
              <StatNumber>{Object.keys(byTarjetaMap).length}</StatNumber>
              <StatHelpText>Medios</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Periodo</StatLabel>
              <StatHelpText>{monthFilter === null ? 'Todos los meses' : months[monthFilter]} {yearFilter === null ? '' : yearFilter}</StatHelpText>
            </Stat>
          </SimpleGrid>

          <HStack spacing={3} mt={4}>
            <Select value={monthFilter === null ? '' : String(monthFilter)} onChange={e => setMonthFilter(e.target.value === '' ? null : parseInt(e.target.value, 10))} width="160px">
              <option value="">Todos los meses</option>
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </Select>

            <Select value={yearFilter === null ? '' : String(yearFilter)} onChange={e => setYearFilter(e.target.value === '' ? null : parseInt(e.target.value, 10))} width="120px">
              <option value="">Todos los años</option>
              {Array.from(new Set(deudas.map(d => {
                const p = (d.Fecha || '').split('/');
                return p.length === 3 ? parseInt(p[2], 10) : currentYear;
              })).values()).sort((a:any,b:any)=>b-a).map((y:any) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>

            <Button size="sm" onClick={() => { setMonthFilter(currentMonth); setYearFilter(currentYear); }}>Usar mes actual</Button>
            <Button size="sm" variant="outline" onClick={() => { setMonthFilter(null); setYearFilter(null); }}>Mostrar todo</Button>
          </HStack>
        </Box>

        <Box p={6} bg="white" rounded="lg" shadow="base">
          <Heading size="md" mb={4}>Gastos por tarjeta (torta)</Heading>
          <Box width="100%" height={250} position="relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  label={false}
                  labelLine={false}
                />
                {pieDataSorted.map((entry, index) => {
                  // compute a color per tarjeta (deterministic)
                  const color = COLORS[index] || generateHsl(index);
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
                <ReTooltip formatter={(value: any) => typeof value === 'number' ? value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : value} />
              </PieChart>
            </ResponsiveContainer>

            {/* custom legend for better layout: name + amount + percent */}
            <Box mt={3}>
              {pieDataSorted.length === 0 && <Text fontSize="sm" color="gray.500">Sin movimientos</Text>}
              {pieDataSorted.map((p, i) => {
                const color = COLORS[i] || generateHsl(i);
                const pct = totalAmount > 0 ? Math.round((p.value / totalAmount) * 1000) / 10 : 0; // one decimal
                return (
                  <HStack key={p.name} spacing={3} mb={1} align="center">
                    <Box width="12px" height="12px" bg={color} borderRadius="2px" />
                    <Text fontSize="sm" fontWeight={600}>{p.name}</Text>
                    <Text fontSize="sm" color="gray.600">{Number(p.value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Text>
                    <Text fontSize="xs" color="gray.500">{pct}%</Text>
                  </HStack>
                );
              })}
            </Box>

            {/* center total */}
            <Box position="absolute" left="0" right="0" top="0" bottom="0" pointerEvents="none" display="flex" alignItems="center" justifyContent="center">
              <Box textAlign="center">
                <Text fontSize="lg" fontWeight={700}>{totalAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Text>
                <Text fontSize="sm" color="gray.500">Total</Text>
              </Box>
            </Box>
          </Box>
        </Box>

      </SimpleGrid>

      <Box p={6} bg="white" rounded="lg" shadow="base">
        <Heading size="md" mb={4}>Gastos por mes (barras)</Heading>
        <Box width="100%" height={300}>
          <ResponsiveContainer>
            <BarChart data={computedBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ReTooltip formatter={(value: any) => typeof value === 'number' ? value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : value} />
              <Legend />
              <Bar dataKey="monto" fill="#3182CE" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </VStack>
  );
}