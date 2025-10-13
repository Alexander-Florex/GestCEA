// src/pages/CajaDiaria.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiCreditCard, FiArrowUpRight, FiPlus, FiX, FiArrowDownLeft, FiArrowUpLeft } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Componente Tabla de Movimientos ==================== */
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
                            'Activo', 'Pago', 'Monto', 'Personal', 'Fecha y Hora'
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
                            <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                                No hay registros para mostrar
                            </td>
                        </tr>
                    ) : (
                        data.map((registro) => (
                            <motion.tr
                                key={registro.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    #{registro.id}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                    {registro.estudianteNombre}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {registro.cursoNombre}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        registro.formaPago === 'Efectivo' ? 'bg-green-100 text-green-800' :
                                            registro.formaPago === 'Transferencia' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                    }`}>
                                        {registro.formaPago}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        registro.estado === 'Activo' ? 'bg-blue-100 text-blue-800' :
                                            registro.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                                                'bg-yellow-100 text-yellow-800'
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
                                <td className="px-4 py-3 text-sm font-bold text-green-700">
                                    ${Number(registro.monto || 0).toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
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

/* ==================== Componente Modal Nueva Operación ==================== */
function ModalNuevaOperacion({ isOpen, onClose, onSubmit, ultimoRecibo, usuarioActual }) {
    const [formData, setFormData] = useState({
        descripcion: '',
        monto: '',
        salida: '',
        tipo: 'salida' // 'entrada' o 'salida'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTipoChange = (tipo) => {
        setFormData(prev => ({
            ...prev,
            tipo,
            monto: tipo === 'salida' ? '' : prev.monto,
            salida: tipo === 'entrada' ? '' : prev.salida
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validaciones
        if (!formData.descripcion.trim()) {
            alert('Por favor ingrese una descripción');
            return;
        }

        if (formData.tipo === 'entrada' && (!formData.monto || Number(formData.monto) <= 0)) {
            alert('Por favor ingrese un monto válido para la entrada');
            return;
        }

        if (formData.tipo === 'salida' && (!formData.salida || Number(formData.salida) <= 0)) {
            alert('Por favor ingrese un monto válido para la salida');
            return;
        }

        // Preparar datos para enviar
        const nuevaOperacion = {
            nroRecibo: ultimoRecibo + 1,
            usuario: usuarioActual,
            descripcion: formData.descripcion,
            monto: formData.tipo === 'entrada' ? Number(formData.monto) : 0,
            salida: formData.tipo === 'salida' ? Number(formData.salida) : 0,
            tipo: formData.tipo,
            fecha: new Date().toISOString()
        };

        onSubmit(nuevaOperacion);

        // Limpiar formulario
        setFormData({
            descripcion: '',
            monto: '',
            salida: '',
            tipo: 'salida'
        });
    };

    const handleCancel = () => {
        setFormData({
            descripcion: '',
            monto: '',
            salida: '',
            tipo: 'salida'
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
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={handleCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FiPlus className="w-8 h-8" />
                                <div>
                                    <h2 className="text-2xl font-bold">Nueva Operación</h2>
                                    <p className="text-indigo-100">Control de Entrada/Salida</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Tipo de Operación */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => handleTipoChange('entrada')}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                    formData.tipo === 'entrada'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-green-300'
                                }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <FiArrowDownLeft className={`w-6 h-6 ${
                                        formData.tipo === 'entrada' ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                    <span className={`font-semibold ${
                                        formData.tipo === 'entrada' ? 'text-green-700' : 'text-gray-600'
                                    }`}>
                                        Entrada
                                    </span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTipoChange('salida')}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                    formData.tipo === 'salida'
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-200 hover:border-red-300'
                                }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <FiArrowUpLeft className={`w-6 h-6 ${
                                        formData.tipo === 'salida' ? 'text-red-600' : 'text-gray-400'
                                    }`} />
                                    <span className={`font-semibold ${
                                        formData.tipo === 'salida' ? 'text-red-700' : 'text-gray-600'
                                    }`}>
                                        Salida
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Información automática */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    N° Recibo (Automático)
                                </label>
                                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-bold">
                                    #{ultimoRecibo + 1}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuario
                                </label>
                                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">
                                    {usuarioActual}
                                </div>
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
                                rows="3"
                                required
                                placeholder="Ej: Compra de material de oficina"
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Monto (solo para entradas) */}
                        {formData.tipo === 'entrada' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monto de Entrada <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        name="monto"
                                        value={formData.monto}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-2 border-2 border-green-300 bg-green-50 rounded-lg focus:border-green-500 focus:outline-none transition-colors font-semibold text-green-700"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Salida (solo para salidas) */}
                        {formData.tipo === 'salida' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monto de Salida <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
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
                                        className="w-full pl-8 pr-4 py-2 border-2 border-red-300 bg-red-50 rounded-lg focus:border-red-500 focus:outline-none transition-colors font-semibold text-red-700"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                                    formData.tipo === 'entrada'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                Registrar {formData.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== Componente Control E/S ==================== */
function ControlES({ operaciones, onNuevaOperacion, usuarioActual }) {
    const [modalOpen, setModalOpen] = useState(false);

    // Calcular totales
    const totales = useMemo(() => {
        const totalEntradas = operaciones.reduce((sum, op) => sum + (op.monto || 0), 0);
        const totalSalidas = operaciones.reduce((sum, op) => sum + (op.salida || 0), 0);
        const balance = totalEntradas - totalSalidas;

        return {
            entradas: totalEntradas,
            salidas: totalSalidas,
            balance
        };
    }, [operaciones]);

    const ultimoRecibo = operaciones.length > 0
        ? Math.max(...operaciones.map(op => op.nroRecibo))
        : 0;

    return (
        <div className="space-y-6">
            {/* Header con botón */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Control de Entrada/Salida</h2>
                    <p className="text-gray-600 mt-1">Registro de movimientos de efectivo</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setModalOpen(true)}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                >
                    <FiPlus className="w-5 h-5" />
                    <span>Nueva Operación</span>
                </motion.button>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-700">Total Entradas</p>
                            <p className="text-3xl font-bold text-green-800 mt-1">
                                ${totales.entradas.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                            </p>
                        </div>
                        <div className="bg-green-200 rounded-full p-3">
                            <FiArrowDownLeft className="w-8 h-8 text-green-700" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200 shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-700">Total Salidas</p>
                            <p className="text-3xl font-bold text-red-800 mt-1">
                                ${totales.salidas.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                            </p>
                        </div>
                        <div className="bg-red-200 rounded-full p-3">
                            <FiArrowUpLeft className="w-8 h-8 text-red-700" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    className={`bg-gradient-to-br rounded-xl p-6 border-2 shadow-md ${
                        totales.balance >= 0
                            ? 'from-blue-50 to-blue-100 border-blue-200'
                            : 'from-orange-50 to-orange-100 border-orange-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${
                                totales.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                            }`}>
                                Balance
                            </p>
                            <p className={`text-3xl font-bold mt-1 ${
                                totales.balance >= 0 ? 'text-blue-800' : 'text-orange-800'
                            }`}>
                                ${totales.balance.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                            </p>
                        </div>
                        <div className={`rounded-full p-3 ${
                            totales.balance >= 0 ? 'bg-blue-200' : 'bg-orange-200'
                        }`}>
                            <FiDollarSign className={`w-8 h-8 ${
                                totales.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                            }`} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabla de operaciones */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                N° Recibo
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Descripción
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Entrada
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Salida
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Fecha
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {operaciones.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center space-y-3">
                                        <FiDollarSign className="w-16 h-16 text-gray-300" />
                                        <p className="text-lg font-medium">No hay operaciones registradas</p>
                                        <p className="text-sm">Haz clic en "Nueva Operación" para comenzar</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            operaciones.map((operacion) => (
                                <motion.tr
                                    key={operacion.nroRecibo}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                                        #{operacion.nroRecibo}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                        {operacion.usuario}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {operacion.descripcion}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        {operacion.monto > 0 ? (
                                            <span className="font-bold text-green-700">
                                                    +${operacion.monto.toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                                </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        {operacion.salida > 0 ? (
                                            <span className="font-bold text-red-700">
                                                    -${operacion.salida.toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                                </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(operacion.fecha).toLocaleString('es-AR', {
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
            </div>

            {/* Modal */}
            <ModalNuevaOperacion
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={onNuevaOperacion}
                ultimoRecibo={ultimoRecibo}
                usuarioActual={usuarioActual}
            />
        </div>
    );
}

/* ==================== Página Principal ==================== */
export default function CajaDiaria() {
    const { cajaMovimientos, findStudent, findCourse, getMovimientosByFecha } = useDB();
    const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
    const [selectedType, setSelectedType] = useState(null); // 'Efectivo', 'Transferencia', 'Tarjeta'
    const [vistaActual, setVistaActual] = useState('caja'); // 'caja' o 'control'

    // Estado para Control E/S
    const [operaciones, setOperaciones] = useState([]);

    // Usuario actual (esto debería venir del contexto de autenticación)
    const usuarioActual = "Administrador"; // Cambiar por el usuario logueado

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
                estudianteNombre: estudiante
                    ? `${estudiante.nombre} ${estudiante.apellido}`
                    : 'N/A',
                cursoNombre: curso?.nombre || 'N/A'
            };
        });
    }, [movimientosFiltrados, findStudent, findCourse]);

    // Separar por tipo de pago
    const movimientosPorTipo = useMemo(() => {
        return {
            efectivo: movimientosEnriquecidos.filter(m => m.formaPago === 'Efectivo'),
            transferencia: movimientosEnriquecidos.filter(m => m.formaPago === 'Transferencia'),
            tarjeta: movimientosEnriquecidos.filter(m => m.formaPago === 'Tarjeta')
        };
    }, [movimientosEnriquecidos]);

    // Calcular totales
    const totalEfectivo = movimientosPorTipo.efectivo.length;
    const totalTransferencias = movimientosPorTipo.transferencia.length;
    const totalTarjetas = movimientosPorTipo.tarjeta.length;
    const totalGeneral = totalEfectivo + totalTransferencias + totalTarjetas;

    // Configuración de tipos de movimiento
    const tiposMovimiento = [
        {
            id: 'Efectivo',
            nombre: 'Efectivo',
            datos: movimientosPorTipo.efectivo,
            icon: FiDollarSign,
            color: 'from-green-600 to-green-700',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800'
        },
        {
            id: 'Transferencia',
            nombre: 'Transferencias',
            datos: movimientosPorTipo.transferencia,
            icon: FiArrowUpRight,
            color: 'from-blue-600 to-blue-700',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800'
        },
        {
            id: 'Tarjeta',
            nombre: 'Tarjetas',
            datos: movimientosPorTipo.tarjeta,
            icon: FiCreditCard,
            color: 'from-purple-600 to-purple-700',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-800'
        }
    ];

    const selectedTipo = tiposMovimiento.find(t => t.id === selectedType);

    // Función para agregar nueva operación
    const handleNuevaOperacion = (nuevaOperacion) => {
        setOperaciones(prev => [...prev, nuevaOperacion]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                {/* Header con selector de vista */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Caja Diaria</h1>

                    {/* Selector de vista */}
                    <div className="flex justify-center gap-4 mb-4">
                        <button
                            onClick={() => {
                                setVistaActual('caja');
                                setSelectedType(null);
                            }}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                vistaActual === 'caja'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                            }`}
                        >
                            📊 Movimientos Diarios
                        </button>
                        <button
                            onClick={() => setVistaActual('control')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                vistaActual === 'control'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                            }`}
                        >
                            💰 Control E/S
                        </button>
                    </div>

                    <p className="text-gray-600">
                        {vistaActual === 'caja'
                            ? 'Movimientos organizados por forma de pago'
                            : 'Sistema de control de entradas y salidas'}
                    </p>
                </div>

                {/* Contenido según vista seleccionada */}
                <AnimatePresence mode="wait">
                    {vistaActual === 'caja' ? (
                        <motion.div
                            key="caja"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
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
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                                    >
                                        {tiposMovimiento.map((tipo) => {
                                            const Icon = tipo.icon;
                                            return (
                                                <motion.button
                                                    key={tipo.id}
                                                    whileHover={{ scale: 1.02, y: -4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedType(tipo.id)}
                                                    className={`${tipo.bgColor} ${tipo.borderColor} border-2 rounded-2xl p-8 text-left shadow-lg hover:shadow-2xl transition-all`}
                                                >
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className={`p-4 rounded-full ${tipo.bgColor} border-2 ${tipo.borderColor}`}>
                                                            <Icon className={`w-10 h-10 ${tipo.textColor}`} />
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-4xl font-black ${tipo.textColor}`}>
                                                                {tipo.datos.length}
                                                            </div>
                                                            <div className={`text-sm font-medium ${tipo.textColor}`}>
                                                                {tipo.datos.length === 1 ? 'registro' : 'registros'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <h3 className={`text-2xl font-bold ${tipo.textColor} mb-2`}>
                                                        {tipo.nombre}
                                                    </h3>
                                                    <p className={`text-sm ${tipo.textColor} opacity-80`}>
                                                        Ver detalles →
                                                    </p>
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
                        </motion.div>
                    ) : (
                        <motion.div
                            key="control"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ControlES
                                operaciones={operaciones}
                                onNuevaOperacion={handleNuevaOperacion}
                                usuarioActual={usuarioActual}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}