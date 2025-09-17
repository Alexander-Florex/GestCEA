// src/pages/CajaDiaria.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiCreditCard, FiArrowUpRight } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Componente Tabla ==================== */
function TablaMovimientos({ data, tipo, icon: Icon, color, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        >
            {/* Header del Card */}
            <div className={`bg-gradient-to-r ${color} text-white p-6`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Icon className="w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-bold">{tipo}</h2>
                            <p className="text-white/80">Movimientos del día</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-3xl font-bold">{data.length}</div>
                            <div className="text-sm text-white/80">registros</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            title="Cerrar"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        {[
                            'ID', 'Estudiante', 'Curso', 'Forma de Pago', 'Estado Curso',
                            'Activo', 'Pago', 'Personal', 'Fecha y Hora'
                        ].map(header => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                {header}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center space-y-2">
                                    <Icon className="w-12 h-12 text-gray-300" />
                                    <div>No hay movimientos registrados para esta fecha</div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((registro, index) => (
                            <motion.tr
                                key={registro.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                    #{registro.id}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                    {registro.estudianteNombre}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {registro.cursoNombre}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            registro.formaPago === 'Efectivo' ? 'bg-green-100 text-green-800' :
                                                registro.formaPago === 'Transferencia' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'
                                        }`}>
                                            {registro.formaPago}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            registro.estado === 'Cursando' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {registro.estado}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            registro.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {registro.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            registro.pago === 'Completada' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {registro.pago}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                    {registro.personal}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(registro.fechaHora).toLocaleString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                            </motion.tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

/* ==================== Página Principal ==================== */
export default function CajaDiaria() {
    const { cajaMovimientos, findStudent, findCourse, getMovimientosByFecha } = useDB();
    const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
    const [selectedType, setSelectedType] = useState(null); // 'Efectivo', 'Transferencia', 'Tarjeta'

    // Obtener movimientos filtrados por fecha
    const movimientosFiltrados = useMemo(() => {
        return getMovimientosByFecha(filtroFecha);
    }, [filtroFecha, cajaMovimientos, getMovimientosByFecha]);

    // Enriquecer movimientos con nombres de estudiantes y cursos
    const movimientosEnriquecidos = useMemo(() => {
        return movimientosFiltrados.map(mov => {
            const estudiante = findStudent(mov.studentId);
            const curso = findCourse(mov.courseId);

            return {
                ...mov,
                estudianteNombre: estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : 'Estudiante no encontrado',
                cursoNombre: curso ? curso.nombre : 'Curso no encontrado'
            };
        });
    }, [movimientosFiltrados, findStudent, findCourse]);

    // Separar por tipo de pago
    const movimientosEfectivo = movimientosEnriquecidos.filter(m => m.formaPago === 'Efectivo');
    const movimientosTransferencia = movimientosEnriquecidos.filter(m => m.formaPago === 'Transferencia');
    const movimientosTarjeta = movimientosEnriquecidos.filter(m => m.formaPago === 'Tarjeta');

    // Calcular totales
    const totalEfectivo = movimientosEfectivo.length;
    const totalTransferencias = movimientosTransferencia.length;
    const totalTarjetas = movimientosTarjeta.length;
    const totalGeneral = totalEfectivo + totalTransferencias + totalTarjetas;

    const tiposMovimiento = [
        {
            id: 'Efectivo',
            nombre: 'Efectivo',
            datos: movimientosEfectivo,
            total: totalEfectivo,
            icon: FiDollarSign,
            color: 'from-green-600 to-green-700',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800'
        },
        {
            id: 'Transferencia',
            nombre: 'Transferencias',
            datos: movimientosTransferencia,
            total: totalTransferencias,
            icon: FiArrowUpRight,
            color: 'from-blue-600 to-blue-700',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800'
        },
        {
            id: 'Tarjeta',
            nombre: 'Tarjetas',
            datos: movimientosTarjeta,
            total: totalTarjetas,
            icon: FiCreditCard,
            color: 'from-purple-600 to-purple-700',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-800'
        }
    ];

    const selectedTipo = tiposMovimiento.find(t => t.id === selectedType);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Caja Diaria</h1>
                    <p className="text-gray-600">Movimientos diarios organizados por forma de pago</p>
                </div>

                {/* Filtro de fecha y resumen */}
                <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                        {/* Filtro de fecha */}
                        <div className="flex items-center space-x-4">
                            <label htmlFor="fecha" className="text-sm font-medium text-gray-700">
                                Fecha:
                            </label>
                            <input
                                type="date"
                                id="fecha"
                                value={filtroFecha}
                                onChange={(e) => setFiltroFecha(e.target.value)}
                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Resumen de totales */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center bg-green-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-green-600">{totalEfectivo}</div>
                                <div className="text-xs text-green-700">Efectivo</div>
                            </div>
                            <div className="text-center bg-blue-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-blue-600">{totalTransferencias}</div>
                                <div className="text-xs text-blue-700">Transferencias</div>
                            </div>
                            <div className="text-center bg-purple-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-purple-600">{totalTarjetas}</div>
                                <div className="text-xs text-purple-700">Tarjetas</div>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-gray-600">{totalGeneral}</div>
                                <div className="text-xs text-gray-700">Total</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botones de tipos de movimiento o tabla seleccionada */}
                <AnimatePresence mode="wait">
                    {!selectedType ? (
                        <motion.div
                            key="buttons"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {tiposMovimiento.map((tipo, index) => {
                                const Icon = tipo.icon;
                                return (
                                    <motion.button
                                        key={tipo.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        onClick={() => setSelectedType(tipo.id)}
                                        className={`${tipo.bgColor} ${tipo.borderColor} border-2 rounded-xl p-8 hover:shadow-xl transition-all duration-300 group`}
                                    >
                                        <div className="text-center space-y-4">
                                            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${tipo.color} rounded-full text-white group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className={`text-2xl font-bold ${tipo.textColor}`}>
                                                    {tipo.nombre}
                                                </h3>
                                                <div className="text-4xl font-bold text-gray-800 mt-2">
                                                    {tipo.total}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {tipo.total === 1 ? 'registro' : 'registros'}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <TablaMovimientos
                                data={selectedTipo.datos}
                                tipo={selectedTipo.nombre}
                                icon={selectedTipo.icon}
                                color={selectedTipo.color}
                                onClose={() => setSelectedType(null)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Nota informativa */}
                <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Nota:</strong> Los datos mostrados corresponden a las inscripciones realizadas en la fecha seleccionada.
                                El campo "Personal" indica quién registró cada inscripción en el sistema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}