// src/pages/CajaDiaria.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiDollarSign, FiArrowUpRight, FiPlus, FiX, FiArrowDownLeft,
    FiArrowUpLeft, FiFilter, FiPrinter, FiCalendar, FiUser,
    FiLock, FiUnlock
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
        salida: ''
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

        if (!formData.salida || Number(formData.salida) <= 0) {
            alert('Por favor ingrese un monto válido para la salida');
            return;
        }

        const nuevaOperacion = {
            id: nextId,
            usuario: usuarioActual,
            operacion: formData.descripcion,
            entrada: 0,
            salida: Number(formData.salida),
            tipo: 'Manual',
            fechaHora: new Date().toISOString()
        };

        onSubmit(nuevaOperacion);

        setFormData({
            descripcion: '',
            salida: ''
        });
    };

    const handleCancel = () => {
        setFormData({
            descripcion: '',
            salida: ''
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
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
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
                                    <h2 className="text-xl lg:text-2xl font-bold">Nueva Operación (Egreso)</h2>
                                    <p className="text-blue-100 text-sm lg:text-base">Registrar salida de efectivo</p>
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
                                    Usuario (Automático)
                                </label>
                                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600 font-medium border-2 border-gray-300 cursor-not-allowed">
                                    {usuarioActual}
                                </div>
                            </div>
                        </div>

                        {/* Descripción de la operación */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción de la Operación <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows="3"
                                required
                                placeholder="Ej: Compra de materiales, Gastos administrativos, etc."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-black"
                            />
                        </div>

                        {/* Monto de Salida */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto de Salida (Egreso) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">
                                    $
                                </span>
                                <input
                                    type="number"
                                    name="salida"
                                    value={formData.salida}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-red-300 bg-red-50 rounded-lg focus:border-red-500 focus:outline-none transition-colors font-semibold text-red-700 text-lg"
                                />
                            </div>
                        </div>

                        {/* Información adicional */}
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Nota:</strong> El campo "Entrada" está bloqueado porque esta operación es únicamente para registrar egresos/gastos de la caja. Las entradas se registran automáticamente desde el sistema.
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-4 lg:px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 lg:px-6 py-3 rounded-lg font-semibold text-white transition-colors bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 shadow-lg"
                            >
                                Registrar Salida
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
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-gray-200"
                >
                    <div className={`bg-gradient-to-r ${cajaAbierta ? 'from-red-600 to-blue-600' : 'from-gray-600 to-gray-700'} text-white p-4 lg:p-6 rounded-t-2xl`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {cajaAbierta ? <FiUnlock className="w-6 h-6 lg:w-8 lg:h-8" /> : <FiLock className="w-6 h-6 lg:w-8 lg:h-8" />}
                                <div>
                                    <h2 className="text-xl lg:text-2xl font-bold">Estado de Caja</h2>
                                    <p className={cajaAbierta ? 'text-blue-100' : 'text-gray-100'}>
                                        {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            >
                                <FiX className="w-5 h-5 lg:w-6 lg:h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                        <div className={`${cajaAbierta ? 'bg-gradient-to-r from-red-50 to-blue-50 border-red-200' : 'bg-gray-50 border-gray-200'} border-2 rounded-lg p-4`}>
                            <p className={`text-center text-base lg:text-lg font-semibold ${cajaAbierta ? 'text-gray-800' : 'text-gray-800'}`}>
                                La caja está actualmente <span className="font-bold">{cajaAbierta ? 'ABIERTA' : 'CERRADA'}</span>
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                ¿Desea {cajaAbierta ? 'cerrar' : 'abrir'} la caja?
                            </p>
                            <button
                                onClick={() => {
                                    onToggleCaja();
                                    onClose();
                                }}
                                className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors shadow-lg ${
                                    cajaAbierta
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                }`}
                            >
                                {cajaAbierta ? 'Cerrar Caja' : 'Abrir Caja'}
                            </button>
                        </div>

                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                            <p className="text-xs text-red-700">
                                <strong>Nota:</strong> {cajaAbierta
                                ? 'Al cerrar la caja, se suspenderán los registros de nuevas operaciones hasta que se vuelva a abrir.'
                                : 'Al abrir la caja, se habilitará el registro de operaciones nuevamente.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== Página Principal ==================== */
export default function CajaDiaria() {
    const { cajaMovimientos = [] } = useDB();

    // Estados principales
    const [operaciones, setOperaciones] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalCajaOpen, setModalCajaOpen] = useState(false);
    const [cajaAbierta, setCajaAbierta] = useState(true);

    // Filtros
    const [filtroFechaDesde, setFiltroFechaDesde] = useState(new Date().toISOString().split('T')[0]);
    const [filtroFechaHasta, setFiltroFechaHasta] = useState(new Date().toISOString().split('T')[0]);
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [filtroUsuario, setFiltroUsuario] = useState('Todos');

    // Usuario actual
    const usuarioActual = "Administrador";

    // Notificaciones
    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };
    const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

    // Manejar nueva operación manual
    const handleNuevaOperacion = (nuevaOp) => {
        setOperaciones(prev => [...prev, nuevaOp]);
        setModalOpen(false);
        showNotification('success', 'Operación registrada exitosamente');
    };

    // Operaciones del sistema
    const operacionesAutomaticas = useMemo(() => {
        return cajaMovimientos.map((mov, index) => {
            if (mov.usuario && mov.operacion) {
                return {
                    id: mov.id || `auto-${index}`,
                    usuario: mov.usuario,
                    operacion: mov.operacion,
                    entrada: Number(mov.entrada || 0),
                    salida: Number(mov.salida || 0),
                    tipo: mov.tipo || 'Automática',
                    fechaHora: mov.fechaHora || new Date().toISOString()
                };
            }

            return {
                id: `auto-${index}`,
                usuario: mov.personal || 'Sistema',
                operacion: `${mov.pago} - ${mov.cursoNombre || 'Curso'} (${mov.estudianteNombre || 'Estudiante'})`,
                entrada: Number(mov.monto || 0),
                salida: 0,
                tipo: 'Automática',
                fechaHora: mov.fechaHora || new Date().toISOString()
            };
        });
    }, [cajaMovimientos]);

    // Combinar operaciones automáticas y manuales
    const todasLasOperaciones = useMemo(() => {
        return [...operacionesAutomaticas, ...operaciones].sort((a, b) =>
            new Date(b.fechaHora) - new Date(a.fechaHora)
        );
    }, [operacionesAutomaticas, operaciones]);

    // Operaciones filtradas
    const operacionesFiltradas = useMemo(() => {
        return todasLasOperaciones.filter(op => {
            const fechaOp = new Date(op.fechaHora).toISOString().split('T')[0];
            const cumpleFecha = fechaOp >= filtroFechaDesde && fechaOp <= filtroFechaHasta;
            const cumpleTipo = filtroTipo === 'Todos' || op.tipo === filtroTipo;
            const cumpleUsuario = filtroUsuario === 'Todos' || op.usuario === filtroUsuario;

            return cumpleFecha && cumpleTipo && cumpleUsuario;
        });
    }, [todasLasOperaciones, filtroFechaDesde, filtroFechaHasta, filtroTipo, filtroUsuario]);

    // Usuarios únicos para el filtro
    const usuariosUnicos = useMemo(() => {
        const usuarios = new Set(todasLasOperaciones.map(op => op.usuario));
        return ['Todos', ...Array.from(usuarios)];
    }, [todasLasOperaciones]);

    // Calcular totales
    const totales = useMemo(() => {
        const totalEntradas = operacionesFiltradas.reduce((sum, op) => sum + (op.entrada || 0), 0);
        const totalSalidas = operacionesFiltradas.reduce((sum, op) => sum + (op.salida || 0), 0);
        const balance = totalEntradas - totalSalidas;

        return { entradas: totalEntradas, salidas: totalSalidas, balance };
    }, [operacionesFiltradas]);

    // ID siguiente para nueva operación
    const nextId = operaciones.length > 0
        ? Math.max(...operaciones.map(op => Number(op.id) || 0)) + 1
        : 1;

    // Generar PDF
    const handleImprimir = () => {
        showNotification('success', 'Generando reporte PDF...');
        console.log('Generando PDF con operaciones:', operacionesFiltradas);
    };

    // Toggle estado de caja
    const handleToggleCaja = () => {
        setCajaAbierta(prev => !prev);
        showNotification('success', cajaAbierta ? 'Caja cerrada exitosamente' : 'Caja abierta exitosamente');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50 p-4 lg:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-4 lg:p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold">📊 Caja Diaria</h1>
                            <p className="text-blue-100 mt-1 text-sm lg:text-base">Sistema de rastreo y auditoría de movimientos</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setModalCajaOpen(true)}
                                className={`flex items-center justify-center gap-2 px-4 lg:px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
                                    cajaAbierta
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                                        : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                                }`}
                            >
                                {cajaAbierta ? <FiUnlock className="w-4 h-4 lg:w-5 lg:h-5" /> : <FiLock className="w-4 h-4 lg:w-5 lg:h-5" />}
                                <span className="text-sm lg:text-base">{cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}</span>
                            </button>
                            <button
                                onClick={() => setModalOpen(true)}
                                disabled={!cajaAbierta}
                                className={`flex items-center justify-center gap-2 px-4 lg:px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
                                    cajaAbierta
                                        ? 'bg-white text-red-600 hover:bg-red-50'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                <FiPlus className="w-4 h-4 lg:w-5 lg:h-5" />
                                <span className="text-sm lg:text-base">Nueva Operación</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Entradas */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 lg:p-6 border-2 border-blue-200 shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Entradas</p>
                                <p className="text-2xl lg:text-3xl font-bold text-blue-800 mt-1">
                                    ${totales.entradas.toLocaleString('es-AR', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}
                                </p>
                            </div>
                            <div className="bg-blue-200 rounded-full p-2 lg:p-3">
                                <FiArrowDownLeft className="w-6 h-6 lg:w-8 lg:h-8 text-blue-700" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Salidas */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 lg:p-6 border-2 border-red-200 shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-700">Total Salidas</p>
                                <p className="text-2xl lg:text-3xl font-bold text-red-800 mt-1">
                                    ${totales.salidas.toLocaleString('es-AR', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}
                                </p>
                            </div>
                            <div className="bg-red-200 rounded-full p-2 lg:p-3">
                                <FiArrowUpLeft className="w-6 h-6 lg:w-8 lg:h-8 text-red-700" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Balance */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className={`bg-gradient-to-br rounded-xl p-4 lg:p-6 border-2 shadow-md ${
                            totales.balance >= 0
                                ? 'from-green-50 to-green-100 border-green-200'
                                : 'from-orange-50 to-orange-100 border-orange-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${
                                    totales.balance >= 0 ? 'text-green-700' : 'text-orange-700'
                                }`}>
                                    Balance
                                </p>
                                <p className={`text-2xl lg:text-3xl font-bold mt-1 ${
                                    totales.balance >= 0 ? 'text-green-800' : 'text-orange-800'
                                }`}>
                                    ${totales.balance.toLocaleString('es-AR', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}
                                </p>
                            </div>
                            <div className={`rounded-full p-2 lg:p-3 ${
                                totales.balance >= 0 ? 'bg-green-200' : 'bg-orange-200'
                            }`}>
                                <FiDollarSign className={`w-6 h-6 lg:w-8 lg:h-8 ${
                                    totales.balance >= 0 ? 'text-green-700' : 'text-orange-700'
                                }`} />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filtros y acciones */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiFilter className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-bold text-gray-800">Filtros y Acciones</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Filtro Fecha Desde */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiCalendar className="w-4 h-4 text-red-600" />
                                Fecha Desde:
                            </label>
                            <input
                                type="date"
                                value={filtroFechaDesde}
                                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-red-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Filtro Fecha Hasta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiCalendar className="w-4 h-4 text-blue-600" />
                                Fecha Hasta:
                            </label>
                            <input
                                type="date"
                                value={filtroFechaHasta}
                                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Filtro Tipo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Operación:
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-red-500 focus:outline-none transition-colors"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Automática">Automática</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>

                        {/* Filtro Usuario */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FiUser className="w-4 h-4 text-blue-600" />
                                Usuario:
                            </label>
                            <select
                                value={filtroUsuario}
                                onChange={(e) => setFiltroUsuario(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-colors"
                            >
                                {usuariosUnicos.map(usuario => (
                                    <option key={usuario} value={usuario}>{usuario}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Botón Imprimir */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleImprimir}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-blue-600 text-white px-4 lg:px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:from-red-700 hover:to-blue-700 w-full sm:w-auto"
                        >
                            <FiPrinter className="w-4 h-4 lg:w-5 lg:h-5" />
                            <span className="text-sm lg:text-base">Imprimir Reporte PDF</span>
                        </button>
                    </div>
                </div>

                {/* Tabla de movimientos */}
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
                                    Usuario
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
                                    Tipo
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {operacionesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 lg:py-12 text-center text-gray-500">
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
                                        key={operacion.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 lg:px-6 py-3 text-sm font-bold text-red-600">
                                            #{operacion.id}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">
                                            {new Date(operacion.fechaHora).toLocaleString('es-AR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-900 font-medium">
                                            {operacion.usuario}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-700">
                                            {operacion.operacion}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-right">
                                            {operacion.entrada > 0 ? (
                                                <span className="font-bold text-green-700">
                                                    ${operacion.entrada.toLocaleString('es-AR', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">$0</span>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-sm text-right">
                                            {operacion.salida > 0 ? (
                                                <span className="font-bold text-red-700">
                                                    ${operacion.salida.toLocaleString('es-AR', {
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
                                                operacion.tipo === 'Automática'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {operacion.tipo}
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