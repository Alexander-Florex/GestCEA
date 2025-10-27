// src/pages/Cobros.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiChevronDown, FiChevronUp, FiShoppingCart, FiDollarSign,
    FiCreditCard, FiTrendingUp, FiEye, FiMail, FiTrash2, FiFileText,
    FiCalendar, FiFilter, FiDownload, FiX
} from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = d => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
};

const formatDateTime = d => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

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
                        className={`px-4 py-2 rounded shadow-md cursor-pointer ${
                            n.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
/* ==================== COMPONENTES ORIGINALES DE COBROS (SIN MODIFICAR) ==================== */

// Componente InstallmentCard (ORIGINAL)
function InstallmentCard({ installment, isSelected, onToggleSelection, showNotification }) {
    const [showActions, setShowActions] = useState(false);

    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    const isOverdue = today > dueDate;

    const montoActual = isOverdue
        ? (Number(installment.amountVencido) || Number(installment.amount) || 0)
        : (Number(installment.amountEnFecha) || Number(installment.amount) || 0);

    const pending = montoActual - Number(installment.amountPaid || 0);

    const tieneRecargo = isOverdue && installment.amountVencido && installment.amountEnFecha &&
        installment.amountVencido !== installment.amountEnFecha;
    const montoRecargo = tieneRecargo ? (installment.amountVencido - installment.amountEnFecha) : 0;

    const handlePagar = () => {
        showNotification('success', `Pago completo de cuota #${installment.number} - $${formatNumber(pending)}`);
        setShowActions(false);
    };

    const handleDepositar = () => {
        showNotification('success', `Depósito registrado para cuota #${installment.number}`);
        setShowActions(false);
    };

    const handleFreezar = () => {
        showNotification('success', `Cuota #${installment.number} congelada`);
        setShowActions(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isOverdue
                        ? 'border-red-300 bg-red-50 hover:border-red-400'
                        : 'border-gray-300 bg-white hover:border-blue-300'
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelection}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                            Cuota #{installment.number}
                            {isOverdue && (
                                <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                                    VENCIDA
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-600">
                            Vencimiento: {formatDate(installment.dueDate)}
                        </div>
                        {installment.amountPaid > 0 && (
                            <div className="text-xs text-green-600">
                                Pagado: ${formatNumber(installment.amountPaid)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-900">
                            ${formatNumber(pending)}
                        </div>
                        {tieneRecargo && (
                            <div className="text-xs text-red-600 font-semibold mt-1">
                                ⚠️ Incluye recargo: ${formatNumber(montoRecargo)}
                            </div>
                        )}
                        {!isOverdue && installment.amountEnFecha && (
                            <div className="text-xs text-green-600 font-semibold mt-1">
                                ✓ Pago en fecha
                            </div>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            installment.status === 'Parcial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {installment.status}
                        </span>
                    </div>

                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors font-semibold"
                    >
                        Acciones
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showActions && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 flex space-x-3"
                    >
                        <button
                            onClick={handlePagar}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <FiDollarSign className="w-4 h-4" />
                            <span>Pagar</span>
                        </button>
                        <button
                            onClick={handleDepositar}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <FiTrendingUp className="w-4 h-4" />
                            <span>Depositar</span>
                        </button>
                        <button
                            onClick={handleFreezar}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <FiCreditCard className="w-4 h-4" />
                            <span>Freezar</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Componente PaymentModal (ORIGINAL)
function PaymentModal({ isOpen, onClose, selectedInstallments, total, showNotification, onSuccess }) {
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');

    if (!isOpen) return null;

    const cuotasDetalle = selectedInstallments.map(inst => {
        const today = new Date();
        const dueDate = new Date(inst.dueDate);
        const isOverdue = today > dueDate;

        const montoActual = isOverdue
            ? (Number(inst.amountVencido) || Number(inst.amount) || 0)
            : (Number(inst.amountEnFecha) || Number(inst.amount) || 0);

        const pending = montoActual - Number(inst.amountPaid || 0);
        const tieneRecargo = isOverdue && inst.amountVencido && inst.amountEnFecha &&
            inst.amountVencido !== inst.amountEnFecha;
        const recargo = tieneRecargo ? (inst.amountVencido - inst.amountEnFecha) : 0;

        return {
            ...inst,
            montoActual,
            pending,
            isOverdue,
            tieneRecargo,
            recargo
        };
    });

    const totalRecargos = cuotasDetalle.reduce((sum, c) => sum + c.recargo, 0);

    const handleConfirmPayment = () => {
        console.log('💳 [COBRO] Procesando pago:', {
            metodo: paymentMethod,
            total: total,
            cuotas: cuotasDetalle.length,
            recargos: totalRecargos
        });

        showNotification('success', `Pago de $${formatNumber(total)} procesado con ${paymentMethod}`);
        onSuccess();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-2xl max-w-2xl w-full relative text-black shadow-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Procesar Pago</h2>
                                <p className="text-blue-100 text-sm">
                                    {selectedInstallments.length} cuota{selectedInstallments.length !== 1 ? 's' : ''} seleccionada{selectedInstallments.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                            <h4 className="font-bold text-blue-900 mb-3">Detalle de Cuotas</h4>
                            <div className="space-y-3">
                                {cuotasDetalle.map((cuota, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-blue-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-bold text-gray-900">Cuota #{cuota.number}</span>
                                                {cuota.isOverdue && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                                                        VENCIDA
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-bold text-blue-900">
                                                ${formatNumber(cuota.pending)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div>Vencimiento: {formatDate(cuota.dueDate)}</div>
                                            {cuota.amountEnFecha && (
                                                <div>Precio en fecha: ${formatNumber(cuota.amountEnFecha)}</div>
                                            )}
                                            {cuota.amountVencido && cuota.amountVencido !== cuota.amountEnFecha && (
                                                <div>Precio vencido: ${formatNumber(cuota.amountVencido)}</div>
                                            )}
                                            {cuota.tieneRecargo && (
                                                <div className="text-red-600 font-semibold">
                                                    ⚠️ Recargo por mora: ${formatNumber(cuota.recargo)}
                                                </div>
                                            )}
                                            {!cuota.isOverdue && (
                                                <div className="text-green-600 font-semibold">
                                                    ✓ Pago en fecha
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {totalRecargos > 0 && (
                            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-yellow-900">Total Recargos:</span>
                                    <span className="font-bold text-yellow-900 text-lg">
                                        ${formatNumber(totalRecargos)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700">
                                Método de Pago
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-3 rounded-lg border-2 font-semibold transition-colors ${
                                            paymentMethod === method
                                                ? 'border-blue-600 bg-blue-50 text-blue-900'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300">
                            <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold text-green-900">TOTAL A COBRAR:</span>
                                <span className="text-4xl font-bold text-green-700">
                                    ${formatNumber(total)}
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-colors font-bold shadow-lg"
                            >
                                Confirmar Pago
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== NUEVO: MÓDULO DE REGISTROS ==================== */

// Modal de Detalles de Registro
function ModalDetallesRegistro({ isOpen, onClose, registro }) {
    if (!isOpen || !registro) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-2xl max-w-3xl w-full relative text-black shadow-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Detalles del Registro</h2>
                                <p className="text-green-100">ID: #{registro.id}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6 space-y-6">
                        {/* Información del Alumno */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                            <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                <FiEye className="w-5 h-5" />
                                Información del Alumno
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-blue-700">Nombre Completo:</div>
                                    <div className="font-bold text-gray-800">{registro.studentName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-blue-700">ID Alumno:</div>
                                    <div className="font-bold text-gray-800">#{registro.studentId}</div>
                                </div>
                            </div>
                        </div>

                        {/* Información del Pago */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                            <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                <FiDollarSign className="w-5 h-5" />
                                Información del Pago
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-green-700">Monto Total:</div>
                                    <div className="text-2xl font-bold text-green-800">
                                        ${formatNumber(registro.amount)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-green-700">Método de Pago:</div>
                                    <div className="font-bold text-gray-800">{registro.paymentMethod}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-green-700">Fecha y Hora:</div>
                                    <div className="font-bold text-gray-800">{formatDateTime(registro.dateTime)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-green-700">Registrado por:</div>
                                    <div className="font-bold text-gray-800">{registro.registeredBy || 'Sistema'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Cursos Pagados */}
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                            <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                                <FiFileText className="w-5 h-5" />
                                Cursos Incluidos en el Pago
                            </h3>
                            <div className="space-y-2">
                                {registro.courses.map((course, index) => (
                                    <div key={index} className="bg-white p-3 rounded-lg border border-purple-300">
                                        <div className="font-semibold text-gray-800">{course}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comprobante */}
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                            <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                <FiDownload className="w-5 h-5" />
                                Comprobante de Pago
                            </h3>
                            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-amber-300">
                                <div>
                                    <div className="font-bold text-gray-800">{registro.receipt}</div>
                                    <div className="text-sm text-gray-600">Comprobante PDF generado automáticamente</div>
                                </div>
                                <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2">
                                    <FiDownload className="w-4 h-4" />
                                    Descargar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 flex gap-3">
                        <button
                            onClick={() => alert('Reenviando comprobante...')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            <FiMail className="w-5 h-5" />
                            Reenviar Comprobante
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                        >
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Vista de Registros
function VistaRegistros({ registros, showNotification }) {
    const [search, setSearch] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [montoMin, setMontoMin] = useState('');
    const [montoMax, setMontoMax] = useState('');
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
    const [modalDetallesOpen, setModalDetallesOpen] = useState(false);

    // Filtrar registros
    const registrosFiltrados = useMemo(() => {
        return registros.filter(reg => {
            // Filtro de búsqueda
            if (search) {
                const q = search.toLowerCase();
                const matchName = reg.studentName.toLowerCase().includes(q);
                const matchCourse = reg.courses.some(c => c.toLowerCase().includes(q));
                if (!matchName && !matchCourse) return false;
            }

            // Filtro de fechas
            if (fechaDesde) {
                const regDate = new Date(reg.dateTime).toISOString().split('T')[0];
                if (regDate < fechaDesde) return false;
            }
            if (fechaHasta) {
                const regDate = new Date(reg.dateTime).toISOString().split('T')[0];
                if (regDate > fechaHasta) return false;
            }

            // Filtro de montos
            if (montoMin && reg.amount < Number(montoMin)) return false;
            if (montoMax && reg.amount > Number(montoMax)) return false;

            return true;
        });
    }, [registros, search, fechaDesde, fechaHasta, montoMin, montoMax]);

    const handleVerDetalles = (registro) => {
        setRegistroSeleccionado(registro);
        setModalDetallesOpen(true);
    };

    const handleEnviarEmail = (registro) => {
        showNotification('success', `Comprobante enviado a ${registro.studentName}`);
    };

    const handleEliminar = (registro) => {
        if (window.confirm(`¿Está seguro de eliminar el registro #${registro.id}?`)) {
            showNotification('success', `Registro #${registro.id} eliminado correctamente`);
        }
    };

    const totalRegistros = registrosFiltrados.length;
    const totalMonto = registrosFiltrados.reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <FiFilter className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-800">Filtros de Búsqueda</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Búsqueda */}
                    <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🔍 Buscar por alumno o curso:
                        </label>
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nombre del alumno o curso..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Fecha Desde */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FiCalendar className="w-4 h-4" />
                            Fecha Desde:
                        </label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
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
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Limpiar filtros */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearch('');
                                setFechaDesde('');
                                setFechaHasta('');
                                setMontoMin('');
                                setMontoMax('');
                            }}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl transition-colors font-semibold"
                        >
                            Limpiar Filtros
                        </button>
                    </div>

                    {/* Monto Mínimo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FiDollarSign className="w-4 h-4" />
                            Monto Mínimo:
                        </label>
                        <input
                            type="number"
                            value={montoMin}
                            onChange={(e) => setMontoMin(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Monto Máximo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FiDollarSign className="w-4 h-4" />
                            Monto Máximo:
                        </label>
                        <input
                            type="number"
                            value={montoMax}
                            onChange={(e) => setMontoMax(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md"
                >
                    <div className="text-sm text-blue-700 mb-1">Total Registros</div>
                    <div className="text-3xl font-bold text-blue-800">{totalRegistros}</div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md"
                >
                    <div className="text-sm text-green-700 mb-1">Total Cobrado</div>
                    <div className="text-3xl font-bold text-green-800">${formatNumber(totalMonto)}</div>
                </motion.div>
            </div>

            {/* Tabla de Registros */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">
                        📋 Registros de Cobros ({registrosFiltrados.length})
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Apellido y Nombre</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Curso/Cursos</th>
                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Monto Cobrado</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Fecha y Hora</th>
                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Archivo</th>
                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {registrosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center space-y-3">
                                        <FiFileText className="w-16 h-16 text-gray-300" />
                                        <p className="text-lg font-medium">No hay registros</p>
                                        <p className="text-sm">
                                            {search || fechaDesde || fechaHasta || montoMin || montoMax
                                                ? 'Intenta ajustar los filtros de búsqueda'
                                                : 'Los cobros realizados aparecerán aquí'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            registrosFiltrados.map((registro, index) => (
                                <motion.tr
                                    key={registro.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`hover:bg-green-50 transition-colors ${
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                >
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                                        #{registro.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-semibold text-gray-900">{registro.studentName}</div>
                                        <div className="text-xs text-gray-500">ID: {registro.studentId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {registro.courses.join(', ')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                            <span className="font-bold text-green-700 text-lg">
                                                ${formatNumber(registro.amount)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDateTime(registro.dateTime)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="inline-flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-lg transition-colors text-sm font-semibold">
                                            <FiFileText className="w-4 h-4" />
                                            PDF
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleVerDetalles(registro)}
                                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Ver detalles"
                                            >
                                                <FiEye className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleEnviarEmail(registro)}
                                                className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Enviar comprobante"
                                            >
                                                <FiMail className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleEliminar(registro)}
                                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar registro"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles */}
            <ModalDetallesRegistro
                isOpen={modalDetallesOpen}
                onClose={() => setModalDetallesOpen(false)}
                registro={registroSeleccionado}
            />
        </div>
    );
}

/* ==================== PÁGINA PRINCIPAL ==================== */

export default function Cobros() {
    const { students, inscriptions, findCourse } = useDB();

    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [selectedInstallments, setSelectedInstallments] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(n => n.filter(x => x.id !== id));
    };

    const studentsWithPending = useMemo(() => {
        const today = new Date();

        return students.map(student => {
            const studentInscriptions = inscriptions.filter(ins => ins.studentId === student.id);

            let totalPending = 0;
            let pendingCount = 0;

            studentInscriptions.forEach(ins => {
                (ins.installments || []).forEach(inst => {
                    const dueDate = new Date(inst.dueDate);
                    const isOverdue = today > dueDate;

                    const montoActual = isOverdue
                        ? (Number(inst.amountVencido) || Number(inst.amount) || 0)
                        : (Number(inst.amountEnFecha) || Number(inst.amount) || 0);

                    const pending = montoActual - Number(inst.amountPaid || 0);

                    if (pending > 0) {
                        totalPending += pending;
                        pendingCount++;
                    }
                });
            });

            return {
                ...student,
                totalPending,
                pendingCount
            };
        }).filter(s => s.totalPending > 0);
    }, [students, inscriptions]);

    const filteredStudents = useMemo(() => {
        if (!search) return studentsWithPending;

        const q = search.toLowerCase();
        return studentsWithPending.filter(s =>
            s.nombre.toLowerCase().includes(q) ||
            s.apellido.toLowerCase().includes(q) ||
            s.dni.includes(search) ||
            s.email.toLowerCase().includes(q)
        );
    }, [studentsWithPending, search]);

    const studentCourses = useMemo(() => {
        if (!selectedStudent) return [];

        return inscriptions
            .filter(ins => ins.studentId === selectedStudent.id)
            .map(ins => {
                const course = findCourse(ins.courseId);
                return {
                    ...ins,
                    courseName: course?.nombre || ins.courseName,
                    installments: ins.installments || []
                };
            });
    }, [selectedStudent, inscriptions, findCourse]);

    const toggleCourseExpansion = (inscriptionId) => {
        setExpandedCourses(prev => ({
            ...prev,
            [inscriptionId]: !prev[inscriptionId]
        }));
    };

    const toggleInstallmentSelection = (inscriptionId, installmentNumber) => {
        const key = `${inscriptionId}-${installmentNumber}`;
        setSelectedInstallments(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            }
            return [...prev, key];
        });
    };

    const isInstallmentSelected = (inscriptionId, installmentNumber) => {
        return selectedInstallments.includes(`${inscriptionId}-${installmentNumber}`);
    };

    const totalCarrito = useMemo(() => {
        const today = new Date();
        let total = 0;

        selectedInstallments.forEach(key => {
            const [inscId, instNum] = key.split('-');
            const inscription = studentCourses.find(c => c.id === Number(inscId));
            if (!inscription) return;

            const installment = inscription.installments.find(i => i.number === Number(instNum));
            if (!installment) return;

            const dueDate = new Date(installment.dueDate);
            const isOverdue = today > dueDate;

            const monto = isOverdue
                ? (Number(installment.amountVencido) || Number(installment.amount) || 0)
                : (Number(installment.amountEnFecha) || Number(installment.amount) || 0);

            const pending = monto - Number(installment.amountPaid || 0);
            total += pending;
        });

        return total;
    }, [selectedInstallments, studentCourses]);

    const handleProcessPayment = () => {
        const installmentsData = [];

        selectedInstallments.forEach(key => {
            const [inscId, instNum] = key.split('-');
            const inscription = studentCourses.find(c => c.id === Number(inscId));
            if (!inscription) return;

            const installment = inscription.installments.find(i => i.number === Number(instNum));
            if (installment) {
                installmentsData.push(installment);
            }
        });

        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedInstallments([]);
        showNotification('success', 'Pago procesado exitosamente');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 text-black">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white mb-6">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <FiShoppingCart className="w-10 h-10" />
                    Gestión de Cobros
                </h1>
                <p className="text-blue-100">Sistema de cobro de cuotas pendientes</p>
            </div>

            {!selectedStudent ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar alumno por nombre, DNI o email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map(student => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
                                onClick={() => setSelectedStudent(student)}
                            >
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    {student.nombre} {student.apellido}
                                </h3>
                                <div className="text-sm text-gray-600 mb-4">
                                    <div>DNI: {student.dni}</div>
                                    <div>Email: {student.email}</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="text-2xl font-bold text-red-700">
                                        ${formatNumber(student.totalPending)}
                                    </div>
                                    <div className="text-sm text-red-600">
                                        {student.pendingCount} cuota{student.pendingCount !== 1 ? 's' : ''} pendiente{student.pendingCount !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredStudents.length === 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <FiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">
                                No hay deudores
                            </h3>
                            <p className="text-gray-500">
                                {search ? 'No se encontraron alumnos con los filtros aplicados' : '¡Todos los alumnos están al día!'}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <button
                            onClick={() => {
                                setSelectedStudent(null);
                                setSelectedInstallments([]);
                                setExpandedCourses({});
                            }}
                            className="mb-4 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
                        >
                            ← Volver a la lista
                        </button>

                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">
                                    {selectedStudent.nombre} {selectedStudent.apellido}
                                </h2>
                                <div className="text-gray-600 mt-2">
                                    <div>DNI: {selectedStudent.dni}</div>
                                    <div>Email: {selectedStudent.email}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-600">Deuda Total</div>
                                <div className="text-4xl font-bold text-red-700">
                                    ${formatNumber(selectedStudent.totalPending)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {studentCourses.map(course => (
                        <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-colors flex justify-between items-center"
                                onClick={() => toggleCourseExpansion(course.id)}
                            >
                                <div>
                                    <h3 className="text-xl font-bold">{course.courseName}</h3>
                                    <div className="text-sm text-purple-100">
                                        {course.installments.filter(i => {
                                            const today = new Date();
                                            const dueDate = new Date(i.dueDate);
                                            const isOverdue = today > dueDate;
                                            const monto = isOverdue
                                                ? (Number(i.amountVencido) || Number(i.amount) || 0)
                                                : (Number(i.amountEnFecha) || Number(i.amount) || 0);
                                            return monto - Number(i.amountPaid || 0) > 0;
                                        }).length} cuotas pendientes
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ rotate: expandedCourses[course.id] ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <FiChevronDown className="w-6 h-6" />
                                </motion.div>
                            </div>

                            <AnimatePresence>
                                {expandedCourses[course.id] && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 space-y-3">
                                            {course.installments
                                                .filter(i => {
                                                    const today = new Date();
                                                    const dueDate = new Date(i.dueDate);
                                                    const isOverdue = today > dueDate;
                                                    const monto = isOverdue
                                                        ? (Number(i.amountVencido) || Number(i.amount) || 0)
                                                        : (Number(i.amountEnFecha) || Number(i.amount) || 0);
                                                    return monto - Number(i.amountPaid || 0) > 0;
                                                })
                                                .map(installment => (
                                                    <InstallmentCard
                                                        key={installment.number}
                                                        installment={installment}
                                                        isSelected={isInstallmentSelected(course.id, installment.number)}
                                                        onToggleSelection={() => toggleInstallmentSelection(course.id, installment.number)}
                                                        showNotification={showNotification}
                                                    />
                                                ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

            {selectedInstallments.length > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-2xl p-6 min-w-80"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-sm text-green-100">Total a cobrar</div>
                            <div className="text-3xl font-bold">${formatNumber(totalCarrito)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-green-100">Cuotas</div>
                            <div className="text-2xl font-bold">{selectedInstallments.length}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleProcessPayment}
                        className="w-full bg-white text-green-700 font-bold py-3 rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <FiShoppingCart className="w-5 h-5" />
                        Procesar Pago
                    </button>
                </motion.div>
            )}

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                selectedInstallments={selectedInstallments.map(key => {
                    const [inscId, instNum] = key.split('-');
                    const inscription = studentCourses.find(c => c.id === Number(inscId));
                    return inscription?.installments.find(i => i.number === Number(instNum));
                }).filter(Boolean)}
                total={totalCarrito}
                showNotification={showNotification}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}