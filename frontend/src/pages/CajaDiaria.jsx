// src/pages/CajaDiaria.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiDollarSign, FiArrowUpRight, FiPlus, FiX, FiArrowDownLeft,
    FiArrowUpLeft, FiFilter, FiPrinter, FiCalendar, FiUser,
    FiLock, FiUnlock, FiCreditCard, FiTrendingUp
} from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Notificaciones ==================== */
function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                        className={`px-4 py-2 rounded shadow-md cursor-pointer ${
                            n.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        {n.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Modal Nueva Operación ==================== */
function ModalNuevaOperacion({ isOpen, onClose, onSubmit, nextId, usuarioActual }) {
    const [formData, setFormData] = useState({
        descripcion: '',
        tipoOperacion: 'entrada', // 'entrada' o 'salida'
        monto: '',
        metodoPago: 'Efectivo' // Agregar método de pago
    });

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
            estudiante: 'N/A', // Para operaciones manuales
            personal: usuarioActual, // Quien realizó la operación
            operacion: formData.descripcion,
            entrada: formData.tipoOperacion === 'entrada' ? Number(formData.monto) : 0,
            salida: formData.tipoOperacion === 'salida' ? Number(formData.monto) : 0,
            metodo: formData.metodoPago,
            fechaHora: new Date().toISOString()
        };

        onSubmit(nuevaOperacion);

        setFormData({
            descripcion: '',
            tipoOperacion: 'entrada',
            monto: '',
            metodoPago: 'Efectivo'
        });
    };

    const handleCancel = () => {
        setFormData({
            descripcion: '',
            tipoOperacion: 'entrada',
            monto: '',
            metodoPago: 'Efectivo'
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
                onClick={handleCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border-2 border-gray-200"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-4 lg:p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FiPlus className="w-6 h-6 lg:w-8 lg:h-8" />
                                <div>
                                    <h2 className="text-xl lg:text-2xl font-bold">Nueva Operación</h2>
                                    <p className="text-blue-100 text-sm lg:text-base">Registrar entrada o salida de efectivo</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            >
                                <FiX className="w-5 h-5 lg:w-6 lg:h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                        {/* Información automática BLOQUEADA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <FiLock className="w-4 h-4 text-gray-500" />
                                    ID (Automático)
                                </label>
                                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600 font-bold border-2 border-gray-300 cursor-not-allowed">
                                    #{nextId}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
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
                            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <FiArrowUpRight className="w-4 h-4" />
                                Tipo de Operación *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tipoOperacion: 'entrada' }))}
                                    className={`p-4 rounded-lg border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
                                        formData.tipoOperacion === 'entrada'
                                            ? 'bg-green-50 border-green-500 text-green-700'
                                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-green-400'
                                    }`}
                                >
                                    <FiArrowDownLeft className="w-5 h-5" />
                                    Entrada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tipoOperacion: 'salida' }))}
                                    className={`p-4 rounded-lg border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
                                        formData.tipoOperacion === 'salida'
                                            ? 'bg-red-50 border-red-500 text-red-700'
                                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-red-400'
                                    }`}
                                >
                                    <FiArrowUpLeft className="w-5 h-5" />
                                    Salida
                                </button>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <FiUnlock className="w-4 h-4 text-green-500" />
                                Descripción *
                            </label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                required
                                rows={3}
                                placeholder="Ej: Pago de servicios, venta de material, etc."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-black"
                            />
                        </div>

                        {/* Monto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <FiUnlock className="w-4 h-4 text-green-500" />
                                Monto *
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
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-black"
                            />
                        </div>

                        {/* Método de Pago */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <FiCreditCard className="w-4 h-4" />
                                Método de Pago *
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, metodoPago: method }))}
                                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                                            formData.metodoPago === method
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-400'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-lg hover:from-red-700 hover:to-blue-700 transition-colors font-bold"
                            >
                                Registrar Operación
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== Modal Estado de Caja ==================== */
function ModalEstadoCaja({ isOpen, onClose, cajaAbierta, onToggleCaja }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-gray-200"
                >
                    <div className="text-center space-y-6">
                        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                            cajaAbierta ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                            {cajaAbierta ? (
                                <FiUnlock className="w-10 h-10 text-green-600" />
                            ) : (
                                <FiLock className="w-10 h-10 text-red-600" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Estado de Caja
                            </h2>
                            <p className="text-gray-600">
                                La caja está actualmente <span className="font-bold">{cajaAbierta ? 'ABIERTA' : 'CERRADA'}</span>
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    onToggleCaja();
                                    onClose();
                                }}
                                className={`w-full px-6 py-3 rounded-lg font-bold transition-colors ${
                                    cajaAbierta
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {cajaAbierta ? 'Cerrar Caja' : 'Abrir Caja'}
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
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

/* ==================== COMPONENTE PRINCIPAL ==================== */
export default function CajaDiaria() {
    const { cajaMovimientos = [], addCajaMovimiento } = useDB();
    const [notifications, setNotifications] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalCajaOpen, setModalCajaOpen] = useState(false);
    const [cajaAbierta, setCajaAbierta] = useState(true);
    const [filtros, setFiltros] = useState({
        fechaDesde: new Date().toISOString().split('T')[0],
        fechaHasta: new Date().toISOString().split('T')[0],
        tipoMovimiento: 'Todos', // 'Todos', 'Entradas', 'Salidas'
        metodoPago: 'Todos',
        personal: 'Todos'
    });

    const usuarioActual = 'Sistema'; // Cambiar por el usuario logueado

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

                // Filtro por tipo de movimiento
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

    // Calcular totales
    const totales = useMemo(() => {
        const totalEntradas = operacionesFiltradas.reduce((sum, op) => sum + (Number(op.entrada) || 0), 0);
        const totalSalidas = operacionesFiltradas.reduce((sum, op) => sum + (Number(op.salida) || 0), 0);
        const balance = totalEntradas - totalSalidas;

        return { totalEntradas, totalSalidas, balance };
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
        setModalOpen(false);
    };

    const handleToggleCaja = () => {
        setCajaAbierta(!cajaAbierta);
        showNotification('success', `Caja ${!cajaAbierta ? 'abierta' : 'cerrada'} exitosamente`);
    };

    const handlePrintReport = () => {
        window.print();
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 p-4 lg:p-8">
            <Notifications notifications={notifications} remove={removeNotification} />

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6 lg:mb-8">
                <div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6 border-2 border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-red-600 to-blue-600 p-3 lg:p-4 rounded-2xl">
                                <FiDollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-4xl font-bold text-gray-800">Caja Diaria</h1>
                                <p className="text-gray-600 text-sm lg:text-base">Control de ingresos y egresos</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:gap-3">
                            <button
                                onClick={() => setModalCajaOpen(true)}
                                className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm lg:text-base ${
                                    cajaAbierta
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                            >
                                {cajaAbierta ? <FiUnlock className="w-4 h-4 lg:w-5 lg:h-5" /> : <FiLock className="w-4 h-4 lg:w-5 lg:h-5" />}
                                Caja {cajaAbierta ? 'Abierta' : 'Cerrada'}
                            </button>

                            <button
                                onClick={() => setModalOpen(true)}
                                disabled={!cajaAbierta}
                                className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-xl hover:from-red-700 hover:to-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm lg:text-base"
                            >
                                <FiPlus className="w-4 h-4 lg:w-5 lg:h-5" />
                                Nueva Operación
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen */}
            <div className="max-w-7xl mx-auto mb-6 lg:mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {/* Total Entradas */}
                    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs lg:text-sm font-medium">Total Entradas</p>
                                <p className="text-2xl lg:text-3xl font-bold text-green-700">
                                    ${totales.totalEntradas.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 lg:p-4 rounded-xl">
                                <FiArrowDownLeft className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Total Salidas */}
                    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs lg:text-sm font-medium">Total Salidas</p>
                                <p className="text-2xl lg:text-3xl font-bold text-red-700">
                                    ${totales.totalSalidas.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="bg-red-100 p-3 lg:p-4 rounded-xl">
                                <FiArrowUpLeft className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* Balance */}
                    <div className={`bg-white rounded-xl shadow-lg p-4 lg:p-6 border-l-4 ${totales.balance >= 0 ? 'border-blue-500' : 'border-orange-500'} hover:shadow-xl transition-shadow`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs lg:text-sm font-medium">Balance</p>
                                <p className={`text-2xl lg:text-3xl font-bold ${totales.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                    ${Math.abs(totales.balance).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className={`${totales.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} p-3 lg:p-4 rounded-xl`}>
                                <FiTrendingUp className={`w-6 h-6 lg:w-8 lg:h-8 ${totales.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="max-w-7xl mx-auto mb-6 lg:mb-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <FiFilter className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                        <h2 className="text-lg lg:text-xl font-bold text-gray-800">Filtros y Acciones</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Fecha Desde */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiCalendar className="w-4 h-4" />
                                Fecha Desde:
                            </label>
                            <input
                                type="date"
                                value={filtros.fechaDesde}
                                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-black"
                            />
                        </div>

                        {/* Fecha Hasta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiCalendar className="w-4 h-4" />
                                Fecha Hasta:
                            </label>
                            <input
                                type="date"
                                value={filtros.fechaHasta}
                                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-black"
                            />
                        </div>

                        {/* Tipo de Movimiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiArrowUpRight className="w-4 h-4" />
                                Tipo de Movimiento:
                            </label>
                            <select
                                value={filtros.tipoMovimiento}
                                onChange={(e) => setFiltros({ ...filtros, tipoMovimiento: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-black"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Entradas">Entradas</option>
                                <option value="Salidas">Salidas</option>
                            </select>
                        </div>

                        {/* Método de Pago */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiCreditCard className="w-4 h-4" />
                                Método de Pago:
                            </label>
                            <select
                                value={filtros.metodoPago}
                                onChange={(e) => setFiltros({ ...filtros, metodoPago: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-black"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                            </select>
                        </div>

                        {/* Personal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiUser className="w-4 h-4" />
                                Personal:
                            </label>
                            <select
                                value={filtros.personal}
                                onChange={(e) => setFiltros({ ...filtros, personal: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-black"
                            >
                                {listaPersonal.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Botón Imprimir */}
                        <div className="flex items-end">
                            <button
                                onClick={handlePrintReport}
                                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-lg hover:from-red-700 hover:to-blue-700 transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                <FiPrinter className="w-4 h-4" />
                                Imprimir Reporte PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de operaciones */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-blue-50 p-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800">
                            Movimientos Registrados ({operacionesFiltradas.length})
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-red-100 to-blue-100">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Fecha/Hora
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Estudiante
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Personal
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Operación
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Entrada
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Salida
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Método
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {operacionesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 lg:py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-3">
                                            <FiDollarSign className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300" />
                                            <p className="text-base lg:text-lg font-medium">No hay operaciones registradas</p>
                                            <p className="text-sm">Ajusta los filtros o registra una nueva operación</p>
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
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 lg:px-6 py-3 text-sm font-bold text-red-600">
                                            #{operacion.id || 'N/A'}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">
                                            {formatSafeDate(operacion.fechaHora)}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-900 font-medium">
                                            {operacion.estudiante || 'N/A'}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-900 font-medium">
                                            {operacion.personal || 'Sistema'}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-700">
                                            {operacion.operacion || 'N/A'}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-right">
                                            {(operacion.entrada || 0) > 0 ? (
                                                <span className="font-bold text-green-700">
                                                    ${Number(operacion.entrada || 0).toLocaleString('es-AR', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">$0</span>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-right">
                                            {(operacion.salida || 0) > 0 ? (
                                                <span className="font-bold text-red-700">
                                                    ${Number(operacion.salida || 0).toLocaleString('es-AR', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">$0</span>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-center">
                                            <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-bold ${
                                                operacion.metodo === 'Efectivo'
                                                    ? 'bg-green-100 text-green-800'
                                                    : operacion.metodo === 'Transferencia'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : operacion.metodo === 'Tarjeta'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {operacion.metodo || 'N/A'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
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