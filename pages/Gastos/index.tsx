"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Gasto } from '../../src/models/gasto';
import { CategoriaGasto } from '../../src/models/categoriaGasto';
import {
	Box,
	Heading,
	Flex,
	Stack,
	HStack,
	NumberInput,
	NumberInputField,
	Input,
	Select,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	TableContainer,
	Button,
	Spinner,
	Text,
	useToast,
} from '@chakra-ui/react';

const COLORS = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC949', '#AF7AA1', '#FF9DA7', '#9C755F', '#BAB0AC'];

export default function Gastos() {
	const [gastos, setGastos] = useState<Gasto[]>([]);
	const [cats, setCats] = useState<CategoriaGasto[]>([]);
	const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
	const [year, setYear] = useState<number>(new Date().getFullYear());
	const [loading, setLoading] = useState(false);
	const toast = useToast();

	async function loadData() {
		setLoading(true);
		try {
			const [gRes, cRes] = await Promise.all([
				fetch('/api/gastos').then(r => r.json()),
				fetch('/api/categoriasGastos').then(r => r.json()),
			]);
			setGastos(gRes || []);
			setCats(cRes || []);
		} catch (err) {
			console.error(err);
			toast({ title: 'Error cargando datos', status: 'error', duration: 4000, isClosable: true });
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, []);

	const gastosMes = useMemo(() => {
		return gastos.filter(g => {
			if (!g.fecha) return false;
			const d = new Date(g.fecha + 'T00:00:00');
			return d.getFullYear() === year && d.getMonth() + 1 === month && d <= new Date();
		});
	}, [gastos, month, year]);

	const totalMontosMes = useMemo(() => gastosMes.reduce((s, g) => s + Number(g.monto || 0), 0), [gastosMes]);

	const pieData = useMemo(() => {
		const map = new Map<string, { name: string; value: number }>();
		for (const g of gastosMes) {
			const cat = cats.find(c => c.id === g.categoriaId);
			const name = cat ? cat.nombre : g.categoriaId || 'Sin categoría';
			const prev = map.get(name) || { name, value: 0 };
			prev.value += Number(g.monto || 0);
			map.set(name, prev);
		}
		return Array.from(map.values()).sort((a, b) => b.value - a.value);
	}, [gastosMes, cats]);

	async function handleSave(updated: Gasto) {
		try {
			setLoading(true);
			await fetch('/api/gastos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
			await loadData();
			toast({ title: 'Gasto actualizado', status: 'success', duration: 2500 });
		} catch (err) {
			console.error(err);
			toast({ title: 'Error al guardar', status: 'error', duration: 3500 });
		} finally {
			setLoading(false);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('¿Borrar gasto?')) return;
		try {
			setLoading(true);
			await fetch(`/api/gastos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
			await loadData();
			toast({ title: 'Gasto borrado', status: 'info', duration: 2000 });
		} catch (err) {
			console.error(err);
			toast({ title: 'Error al borrar', status: 'error', duration: 3500 });
		} finally {
			setLoading(false);
		}
	}

	return (
		<Box p={6}>
			<Stack spacing={4}>
				<Heading size="lg">Gastos — Resumen Mensual</Heading>

				<HStack spacing={4} align="center">
					<HStack>
						<Text>Mes</Text>
						<NumberInput value={month} min={1} max={12} onChange={(_, v) => setMonth(v)} width="80px">
							<NumberInputField />
						</NumberInput>
					</HStack>

					<HStack>
						<Text>Año</Text>
						<NumberInput value={year} min={2000} max={2100} onChange={(_, v) => setYear(v)} width="120px">
							<NumberInputField />
						</NumberInput>
					</HStack>

					<Box ml="auto">
						<Text>
							<strong>Resultados:</strong> {gastosMes.length} gastos — <strong>Total:</strong> {totalMontosMes.toLocaleString()}
						</Text>
					</Box>
				</HStack>

				<Flex gap={6} align="flex-start" wrap="wrap">
					<Box flex="1" minW="320px" height="340px" bg="white" p={4} shadow="sm" borderRadius="md">
						<Text fontSize="md" fontWeight="semibold" mb={2}>
							Distribución por categoría (monto)
						</Text>
						<ResponsiveContainer width="100%" height={280}>
							<PieChart>
								<Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
									{pieData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip formatter={(value: number) => value.toLocaleString()} />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</Box>

					<Box flex="1" minW="420px" bg="white" p={4} shadow="sm" borderRadius="md">
						<Text fontSize="md" fontWeight="semibold" mb={2}>
							Lista de Gastos del Mes
						</Text>
						{loading ? (
							<Flex justify="center" py={8}><Spinner /></Flex>
						) : (
							<TableContainer>
								<Table size="sm">
									<Thead>
										<Tr>
											<Th>ID</Th>
											<Th>Descripción</Th>
											<Th isNumeric>Monto</Th>
											<Th>Fecha</Th>
											<Th>Categoría</Th>
											<Th>Acciones</Th>
										</Tr>
									</Thead>
									<Tbody>
										{gastosMes.map(g => (
											<EditableRow key={g.id} gasto={g} cats={cats} onSave={handleSave} onDelete={() => handleDelete(g.id)} />
										))}
									</Tbody>
								</Table>
							</TableContainer>
						)}
					</Box>
				</Flex>
			</Stack>
		</Box>
	);
}

function EditableRow({ gasto, cats, onSave, onDelete }: { gasto: Gasto; cats: CategoriaGasto[]; onSave: (g: Gasto) => Promise<void>; onDelete: () => void }) {
	const [editing, setEditing] = useState(false);
	const [local, setLocal] = useState<Gasto>(gasto);

	useEffect(() => setLocal(gasto), [gasto]);

	return (
		<Tr>
			<Td>{gasto.id}</Td>
			<Td>
				{editing ? (
					<Input value={local.descripcion} onChange={e => setLocal({ ...local, descripcion: e.target.value })} size="sm" />
				) : (
					gasto.descripcion
				)}
			</Td>
			<Td isNumeric>
				{editing ? (
					<NumberInput value={Number(local.monto)} onChange={(_, v) => setLocal({ ...local, monto: v })} size="sm" width="120px">
						<NumberInputField />
					</NumberInput>
				) : (
					Number(gasto.monto).toLocaleString()
				)}
			</Td>
			<Td>
				{editing ? (
					<Input type="date" value={local.fecha} onChange={e => setLocal({ ...local, fecha: e.target.value })} size="sm" />
				) : (
					gasto.fecha
				)}
			</Td>
			<Td>
				{editing ? (
					<Select size="sm" value={local.categoriaId} onChange={e => setLocal({ ...local, categoriaId: e.target.value })}>
						{cats.map(c => (
							<option key={c.id} value={c.id}>{c.nombre}</option>
						))}
					</Select>
				) : (
					(cats.find(c => c.id === gasto.categoriaId) || { nombre: gasto.categoriaId }).nombre
				)}
			</Td>
			<Td>
				{editing ? (
					<HStack>
						<Button size="sm" colorScheme="blue" onClick={async () => { await onSave(local); setEditing(false); }}>Guardar</Button>
						<Button size="sm" onClick={() => { setEditing(false); setLocal(gasto); }}>Cancelar</Button>
					</HStack>
				) : (
					<HStack>
						<Button size="sm" onClick={() => setEditing(true)}>Editar</Button>
						<Button size="sm" colorScheme="red" onClick={onDelete}>Borrar</Button>
					</HStack>
				)}
			</Td>
		</Tr>
	);
}
