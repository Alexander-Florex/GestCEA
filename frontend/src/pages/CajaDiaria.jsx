// src/pages/CajaDiaria.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiDollarSign, FiArrowUpRight, FiPlus, FiX, FiArrowDownLeft,
    FiArrowUpLeft, FiFilter, FiPrinter, FiCalendar, FiUser,
    FiLock, FiUnlock, FiCreditCard, FiTrendingUp, FiCheck,
    FiAlertCircle, FiDownload, FiEye, FiRefreshCw, FiBarChart2
} from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Componente Notificaciones Mejorado ==================== */
function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50 w-full max-w-sm sm:max-w-md">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.3 }}
                        className={`px-4 py-3 rounded-lg shadow-lg cursor-pointer flex items-center justify-between ${n.type === 'success'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        <div className="flex items-center space-x-3">
                            {n.type === 'success' ? (
                                <FiCheck className="w-5 h-5" />
                            ) : (
                                <FiAlertCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">{n.message}</span>
                        </div>
                        <FiX className="w-4 h-4 opacity-70 hover:opacity-100" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Modal Nueva Operación Mejorado ==================== */
function ModalNuevaOperacion({ isOpen, onClose, onSubmit, nextId, usuarioActual }) {
    const [formData, setFormData] = useState({
        descripcion: '',
        tipoOperacion: 'entrada',
        monto: '',
        metodoPago: 'Efectivo'
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                descripcion: '',
                tipoOperacion: 'entrada',
                monto: '',
                metodoPago: 'Efectivo'
            });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.descripcion.trim()) {
            alert('Por favor ingrese una descripción');
            return;
        }

        if (!formData.monto || Number(formData.monto) <= 0) {
            alert('Por favor ingrese un monto válido');
            return;
        }

        const nuevaOperacion = {
            id: nextId,
            estudiante: 'N/A',
            personal: usuarioActual,
            operacion: formData.descripcion,
            entrada: formData.tipoOperacion === 'entrada' ? Number(formData.monto) : 0,
            salida: formData.tipoOperacion === 'salida' ? Number(formData.monto) : 0,
            metodo: formData.metodoPago,
            fechaHora: new Date().toISOString()
        };

        onSubmit(nuevaOperacion);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 bg-black/50"
                onClick={handleCancel}
            >
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 sm:p-6 rounded-t-2xl z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white/10 rounded-full p-2 sm:p-3">
                                    <FiPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold">Nueva Operación</h2>
                                    <p className="text-gray-300 text-sm">Registrar entrada o salida de efectivo</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                                title="Cerrar"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido del formulario */}
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Información automática */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FiLock className="w-4 h-4 text-gray-500" />
                                    ID (Automático)
                                </label>
                                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600 font-bold border-2 border-gray-300 cursor-not-allowed">
                                    #{nextId}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FiLock className="w-4 h-4 text-gray-500" />
                                    Personal (Automático)
                                </label>
                                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600 font-medium border-2 border-gray-300 cursor-not-allowed">
                                    {usuarioActual}
                                </div>
                            </div>
                        </div>

                        {/* Tipo de operación */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Tipo de Operación <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tipoOperacion: 'entrada' }))}
                                    className={`p-3 sm:p-4 rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${formData.tipoOperacion === 'entrada'
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-700'
                                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-green-400'
                                    }`}
                                >
                                    <FiArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Entrada</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tipoOperacion: 'salida' }))}
                                    className={`p-3 sm:p-4 rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${formData.tipoOperacion === 'salida'
                                        ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-700'
                                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-red-400'
                                    }`}
                                >
                                    <FiArrowUpLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Salida</span>
                                </button>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                required
                                rows={3}
                                placeholder="Ej: Pago de servicios, venta de material, etc."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none text-black text-sm"
                            />
                        </div>

                        {/* Monto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto ($) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="monto"
                                value={formData.monto}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black text-sm"
                            />
                        </div>

                        {/* Método de Pago */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Método de Pago <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, metodoPago: method }))}
                                        className={`p-3 rounded-lg border-2 font-semibold transition-all duration-200 ${formData.metodoPago === method
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 text-blue-700'
                                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-400'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                                Registrar Operación
                            </button>
                        </div>
                    </div>
                </motion.form>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== Modal Estado de Caja Mejorado ==================== */
function ModalEstadoCaja({ isOpen, onClose, cajaAbierta, onToggleCaja }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 bg-black/50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-4 sm:p-6"
                >
                    <div className="text-center space-y-4 sm:space-y-6">
                        <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${cajaAbierta ? 'bg-gradient-to-r from-green-100 to-emerald-100' : 'bg-gradient-to-r from-red-100 to-rose-100'
                        }`}>
                            {cajaAbierta ? (
                                <FiUnlock className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                            ) : (
                                <FiLock className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                                Estado de Caja
                            </h2>
                            <p className="text-gray-600">
                                La caja está actualmente <span className={`font-bold ${cajaAbierta ? 'text-green-600' : 'text-red-600'}`}>
                                    {cajaAbierta ? 'ABIERTA' : 'CERRADA'}
                                </span>
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    onToggleCaja();
                                    onClose();
                                }}
                                className={`w-full px-4 sm:px-6 py-3 rounded-lg font-bold transition-all duration-300 ${cajaAbierta
                                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
                                }`}
                            >
                                {cajaAbierta ? 'Cerrar Caja' : 'Abrir Caja'}
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== Función auxiliar para manejar fechas ==================== */
const safeDateConversion = (dateString) => {
    try {
        if (!dateString) return new Date();
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
        console.warn('Error convirtiendo fecha:', dateString, error);
        return new Date();
    }
};

/* ==================== COMPONENTE PRINCIPAL MEJORADO ==================== */
export default function CajaDiaria() {
    const { cajaMovimientos = [], addCajaMovimiento } = useDB();
    const [notifications, setNotifications] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalCajaOpen, setModalCajaOpen] = useState(false);
    const [cajaAbierta, setCajaAbierta] = useState(true);
    const [filtros, setFiltros] = useState({
        fechaDesde: new Date().toISOString().split('T')[0],
        fechaHasta: new Date().toISOString().split('T')[0],
        tipoMovimiento: 'Todos',
        metodoPago: 'Todos',
        personal: 'Todos'
    });

    const usuarioActual = 'Administrador';

    // Calcular siguiente ID
    const nextId = useMemo(() => {
        if (cajaMovimientos.length === 0) return 1;
        const ids = cajaMovimientos.map(op => Number(op.id) || 0).filter(id => !isNaN(id));
        return ids.length > 0 ? Math.max(...ids) + 1 : 1;
    }, [cajaMovimientos]);

    // Filtrar operaciones con manejo seguro de fechas
    const operacionesFiltradas = useMemo(() => {
        return cajaMovimientos.filter(op => {
            try {
                const fechaOp = safeDateConversion(op.fechaHora).toISOString().split('T')[0];
                const cumpleFecha = fechaOp >= filtros.fechaDesde && fechaOp <= filtros.fechaHasta;

                let cumpleTipo = true;
                if (filtros.tipoMovimiento === 'Entradas') {
                    cumpleTipo = (op.entrada || 0) > 0;
                } else if (filtros.tipoMovimiento === 'Salidas') {
                    cumpleTipo = (op.salida || 0) > 0;
                }

                const cumpleMetodo = filtros.metodoPago === 'Todos' || op.metodo === filtros.metodoPago;
                const cumplePersonal = filtros.personal === 'Todos' || op.personal === filtros.personal;

                return cumpleFecha && cumpleTipo && cumpleMetodo && cumplePersonal;
            } catch (error) {
                console.warn('Error filtrando operación:', op, error);
                return false;
            }
        });
    }, [cajaMovimientos, filtros]);

    // Calcular totales con más detalles
    const totales = useMemo(() => {
        const totalEntradas = operacionesFiltradas.reduce((sum, op) => sum + (Number(op.entrada) || 0), 0);
        const totalSalidas = operacionesFiltradas.reduce((sum, op) => sum + (Number(op.salida) || 0), 0);
        const balance = totalEntradas - totalSalidas;

        // Calcular por método de pago
        const porMetodo = operacionesFiltradas.reduce((acc, op) => {
            const metodo = op.metodo || 'Otro';
            const entrada = Number(op.entrada) || 0;
            const salida = Number(op.salida) || 0;

            if (!acc[metodo]) {
                acc[metodo] = { entradas: 0, salidas: 0 };
            }
            acc[metodo].entradas += entrada;
            acc[metodo].salidas += salida;
            return acc;
        }, {});

        return { totalEntradas, totalSalidas, balance, porMetodo };
    }, [operacionesFiltradas]);

    // Obtener lista única de personal
    const listaPersonal = useMemo(() => {
        const personalSet = new Set(cajaMovimientos.map(op => op.personal).filter(Boolean));
        return ['Todos', ...Array.from(personalSet)];
    }, [cajaMovimientos]);

    // Notificaciones
    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Handlers
    const handleNuevaOperacion = (operacion) => {
        if (!cajaAbierta) {
            showNotification('error', 'La caja está cerrada. No se pueden registrar operaciones.');
            return;
        }

        addCajaMovimiento(operacion);
        showNotification('success', 'Operación registrada exitosamente');
    };

    const handleToggleCaja = () => {
        setCajaAbierta(!cajaAbierta);
        showNotification('success', `Caja ${!cajaAbierta ? 'abierta' : 'cerrada'} exitosamente`);
    };

    const handlePrintReport = () => {
        window.print();
    };

    const handleExportCSV = () => {
        showNotification('success', 'Exportando datos a CSV...');
    };

    const handleResetFilters = () => {
        setFiltros({
            fechaDesde: new Date().toISOString().split('T')[0],
            fechaHasta: new Date().toISOString().split('T')[0],
            tipoMovimiento: 'Todos',
            metodoPago: 'Todos',
            personal: 'Todos'
        });
        showNotification('info', 'Filtros restablecidos');
    };

    // Función segura para formatear fecha
    const formatSafeDate = (dateString) => {
        try {
            const date = safeDateConversion(dateString);
            return date.toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('Error formateando fecha:', dateString, error);
            return 'Fecha inválida';
        }
    };

    // Obtener color para método de pago
    const getMetodoColor = (metodo) => {
        const colors = {
            'Efectivo': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300',
            'Transferencia': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300',
            'Tarjeta': 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300'
        };
        return colors[metodo] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header Mejorado */}
                <div className="mb-6 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                                    <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                                        Caja Diaria
                                    </h1>
                                    <p className="text-gray-600 text-sm sm:text-base mt-1">
                                        Control de ingresos y egresos del sistema
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                <button
                                    onClick={() => setModalCajaOpen(true)}
                                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${cajaAbierta
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-300 hover:bg-green-100'
                                        : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-300 hover:bg-red-100'
                                    }`}
                                >
                                    {cajaAbierta ? (
                                        <FiUnlock className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <FiLock className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                    <span className="hidden sm:inline">Caja</span> {cajaAbierta ? 'Abierta' : 'Cerrada'}
                                </button>

                                <button
                                    onClick={() => setModalOpen(true)}
                                    disabled={!cajaAbierta}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Nueva</span> Operación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen Mejorado */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Total Entradas */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium mb-2">Total Entradas</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
                                        ${totales.totalEntradas.toLocaleString('es-AR')}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {operacionesFiltradas.filter(op => op.entrada > 0).length} operaciones
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-3 rounded-lg">
                                    <FiArrowDownLeft className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* Total Salidas */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium mb-2">Total Salidas</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-rose-700">
                                        ${totales.totalSalidas.toLocaleString('es-AR')}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {operacionesFiltradas.filter(op => op.salida > 0).length} operaciones
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-rose-100 to-red-100 p-3 rounded-lg">
                                    <FiArrowUpLeft className="w-6 h-6 sm:w-8 sm:h-8 text-rose-600" />
                                </div>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium mb-2">Balance Neto</p>
                                    <p className={`text-2xl sm:text-3xl font-bold ${totales.balance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                        ${Math.abs(totales.balance).toLocaleString('es-AR')}
                                    </p>
                                    <p className={`text-xs ${totales.balance >= 0 ? 'text-green-600' : 'text-rose-600'} mt-1 font-medium`}>
                                        {totales.balance >= 0 ? 'Superávit' : 'Déficit'}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${totales.balance >= 0 ? 'bg-gradient-to-r from-blue-100 to-indigo-100' : 'bg-gradient-to-r from-amber-100 to-orange-100'}`}>
                                    <FiTrendingUp className={`w-6 h-6 sm:w-8 sm:h-8 ${totales.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Operaciones Totales */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium mb-2">Operaciones</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                                        {operacionesFiltradas.length}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Período seleccionado
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-3 rounded-lg">
                                    <FiBarChart2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros Mejorados */}
                <div className="mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FiFilter className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Filtros y Acciones</h2>
                            </div>
                            <button
                                onClick={handleResetFilters}
                                className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Restablecer</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                            {/* Fecha Desde */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FiCalendar className="w-4 h-4" />
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={filtros.fechaDesde}
                                    onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black text-sm"
                                />
                            </div>

                            {/* Fecha Hasta */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FiCalendar className="w-4 h-4" />
                                    Hasta
                                </label>
                                <input
                                    type="date"
                                    value={filtros.fechaHasta}
                                    onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black text-sm"
                                />
                            </div>

                            {/* Tipo de Movimiento */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo
                                </label>
                                <select
                                    value={filtros.tipoMovimiento}
                                    onChange={(e) => setFiltros({ ...filtros, tipoMovimiento: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white text-black text-sm"
                                >
                                    <option value="Todos">Todos los tipos</option>
                                    <option value="Entradas">Solo entradas</option>
                                    <option value="Salidas">Solo salidas</option>
                                </select>
                            </div>

                            {/* Método de Pago */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Método
                                </label>
                                <select
                                    value={filtros.metodoPago}
                                    onChange={(e) => setFiltros({ ...filtros, metodoPago: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white text-black text-sm"
                                >
                                    <option value="Todos">Todos los métodos</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </select>
                            </div>

                            {/* Personal */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Personal
                                </label>
                                <select
                                    value={filtros.personal}
                                    onChange={(e) => setFiltros({ ...filtros, personal: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white text-black text-sm"
                                >
                                    {listaPersonal.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={handlePrintReport}
                                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <FiPrinter className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Imprimir Reporte</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Exportar CSV</span>
                            </button>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Ver Resumen</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla de operaciones Mejorada */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-gray-800">
                                Movimientos Registrados
                                <span className="ml-2 text-sm font-normal text-gray-600">
                                    ({operacionesFiltradas.length} operaciones)
                                </span>
                            </h3>
                            <div className="text-sm text-gray-600">
                                Balance: <span className={`font-bold ${totales.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ${totales.balance.toLocaleString('es-AR')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Fecha/Hora
                                </th>
                                <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Estudiante
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Personal
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Operación
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Entrada
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Salida
                                </th>
                                <th className="hidden xs:table-cell px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Método
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {operacionesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 sm:px-6 py-12 sm:py-16 text-center">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                                <FiDollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg sm:text-xl font-semibold text-gray-900">
                                                    No hay operaciones registradas
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Ajusta los filtros o registra una nueva operación
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                operacionesFiltradas.map((operacion, index) => (
                                    <motion.tr
                                        key={operacion.id || index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                                            #{operacion.id || 'N/A'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatSafeDate(operacion.fechaHora)}
                                        </td>
                                        <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {operacion.estudiante || 'N/A'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {operacion.personal || 'Sistema'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                                            {operacion.operacion || 'N/A'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                                            {(operacion.entrada || 0) > 0 ? (
                                                <span className="font-bold text-emerald-700">
                                                        ${Number(operacion.entrada).toLocaleString('es-AR')}
                                                    </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                                            {(operacion.salida || 0) > 0 ? (
                                                <span className="font-bold text-rose-700">
                                                        ${Number(operacion.salida).toLocaleString('es-AR')}
                                                    </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="hidden xs:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getMetodoColor(operacion.metodo)}`}>
                                                    {operacion.metodo || 'N/A'}
                                                </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Resumen al pie de la tabla */}
                    {operacionesFiltradas.length > 0 && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Total Entradas</p>
                                    <p className="text-lg font-bold text-emerald-700">
                                        ${totales.totalEntradas.toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Total Salidas</p>
                                    <p className="text-lg font-bold text-rose-700">
                                        ${totales.totalSalidas.toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Balance Final</p>
                                    <p className={`text-lg font-bold ${totales.balance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                        ${totales.balance.toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nueva Operación */}
            <ModalNuevaOperacion
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleNuevaOperacion}
                nextId={nextId}
                usuarioActual={usuarioActual}
            />

            {/* Modal Estado de Caja */}
            <ModalEstadoCaja
                isOpen={modalCajaOpen}
                onClose={() => setModalCajaOpen(false)}
                cajaAbierta={cajaAbierta}
                onToggleCaja={handleToggleCaja}
            />
        </div>
    );
}