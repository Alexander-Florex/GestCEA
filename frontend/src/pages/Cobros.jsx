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
                            n.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
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

/* ==================== MODAL DE DEPÓSITO ==================== */
function DepositModal({ isOpen, onClose, installment, inscriptionId, onSuccess }) {
    const { depositarCuota, findCourse, findInscription } = useDB();
    const [formData, setFormData] = useState({
        monto: '',
        formaPago: 'Efectivo',
        observaciones: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // Obtener información del curso para calcular precios
    const inscription = findInscription(inscriptionId);
    const course = inscription ? findCourse(inscription.courseId) : null;

    // Calcular montos según forma de pago y estado
    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    const isOverdue = !installment.frozen && today > dueDate;

    // ✅ CORREGIDO: Usar los montos correctos de la cuota (amountEnFecha y amountVencido)
    const getMontoActual = (formaPago) => {
        // Si la cuota tiene amountEnFecha y amountVencido, usarlos directamente
        if (installment.amountEnFecha !== undefined && installment.amountVencido !== undefined) {
            return isOverdue ? Number(installment.amountVencido) || 0 : Number(installment.amountEnFecha) || 0;
        }

        // Fallback: usar los precios del curso si existen
        if (!course) return Number(installment.amount) || 0;

        if (isOverdue) {
            // Precio vencido
            switch (formaPago) {
                case 'Efectivo': return Number(course.pagoVencidoEfectivo) || Number(installment.amount) || 0;
                case 'Transferencia': return Number(course.pagoVencidoTransferencia) || Number(installment.amount) || 0;
                case 'Tarjeta': return Number(course.pagoVencidoTarjeta) || Number(installment.amount) || 0;
                default: return Number(installment.amount) || 0;
            }
        } else {
            // Precio en fecha
            switch (formaPago) {
                case 'Efectivo': return Number(course.pagoFechaEfectivo) || Number(installment.amount) || 0;
                case 'Transferencia': return Number(course.pagoFechaTransferencia) || Number(installment.amount) || 0;
                case 'Tarjeta': return Number(course.pagoFechaTarjeta) || Number(installment.amount) || 0;
                default: return Number(installment.amount) || 0;
            }
        }
    };

    const montoActual = getMontoActual(formData.formaPago);
    const montoPendiente = Math.max(montoActual - Number(installment.amountPaid || 0), 0);

    // Calcular recargo si existe diferencia entre precios
    const montoEnFecha = installment.amountEnFecha !== undefined ?
        Number(installment.amountEnFecha) || 0 :
        (course ? Number(course.pagoFechaEfectivo) || Number(installment.amount) || 0 : 0);

    const tieneRecargo = isOverdue && montoActual !== montoEnFecha;
    const montoRecargo = tieneRecargo ? (montoActual - montoEnFecha) : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const monto = Number(formData.monto);

            if (monto <= 0) {
                throw new Error('El monto debe ser mayor a cero');
            }

            if (monto > montoPendiente) {
                throw new Error(`El monto no puede superar lo pendiente: $${formatNumber(montoPendiente)}`);
            }

            const success = depositarCuota(
                inscriptionId,
                installment.number,
                monto,
                formData.formaPago,
                formData.observaciones
            );

            if (success) {
                onSuccess(`Depósito de $${formatNumber(monto)} registrado exitosamente`);
                onClose();
                setFormData({ monto: '', formaPago: 'Efectivo', observaciones: '' });
            } else {
                throw new Error('Error al procesar el depósito');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Resetear monto cuando cambia la forma de pago
            ...(name === 'formaPago' && { monto: '' })
        }));
    };

    // Actualizar monto pendiente cuando cambia la forma de pago
    const montoParaFormaPago = getMontoActual(formData.formaPago);
    const pendienteParaFormaPago = Math.max(montoParaFormaPago - Number(installment.amountPaid || 0), 0);

    if (!isOpen) return null;

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
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                >
                    {/* Header con gradiente rojo-azul */}
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Depositar Pago</h2>
                                <p className="text-red-100 text-sm mt-1">Cuota #{installment.number}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Información de estado */}
                        <div className={`p-3 rounded-lg border-2 ${
                            installment.frozen
                                ? 'bg-purple-50 border-purple-300 text-purple-800'
                                : isOverdue
                                    ? 'bg-red-50 border-red-300 text-red-800'
                                    : 'bg-green-50 border-green-300 text-green-800'
                        }`}>
                            <div className="font-semibold flex items-center gap-2">
                                {installment.frozen && '❄️ Cuota Congelada'}
                                {!installment.frozen && isOverdue && '⚠️ Cuota Vencida'}
                                {!installment.frozen && !isOverdue && '✓ En Fecha'}
                            </div>
                            {tieneRecargo && (
                                <div className="text-sm mt-1">
                                    Incluye recargo por mora: <span className="font-bold">${formatNumber(montoRecargo)}</span>
                                </div>
                            )}
                        </div>

                        {/* Forma de pago */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Forma de pago <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(forma => (
                                    <button
                                        key={forma}
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            formaPago: forma,
                                            monto: '' // Resetear monto al cambiar forma de pago
                                        }))}
                                        className={`p-3 rounded-lg border-2 font-semibold transition-colors ${
                                            formData.formaPago === forma
                                                ? 'border-blue-600 bg-blue-50 text-blue-900'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                                        }`}
                                    >
                                        {forma}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Información de precios */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Precio {formData.formaPago.toLowerCase()} {isOverdue ? 'vencido:' : 'en fecha:'}</span>
                                <span className="font-bold">${formatNumber(montoParaFormaPago)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Ya pagado:</span>
                                <span className="font-semibold text-green-600">${formatNumber(installment.amountPaid || 0)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="font-semibold text-gray-800">Pendiente:</span>
                                <span className="font-bold text-red-600">${formatNumber(pendienteParaFormaPago)}</span>
                            </div>
                        </div>

                        {/* Monto a depositar */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto a depositar <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="monto"
                                value={formData.monto}
                                onChange={handleChange}
                                step="0.01"
                                min="0.01"
                                max={pendienteParaFormaPago}
                                placeholder="0.00"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-black text-lg font-semibold"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Máximo: ${formatNumber(pendienteParaFormaPago)}
                            </p>
                        </div>

                        {/* Observaciones */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Observaciones (opcional)
                            </label>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Comentarios adicionales..."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-black resize-none"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                disabled={isProcessing}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Procesando...' : 'Confirmar Depósito'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== COMPONENTE INSTALLMENT CARD ACTUALIZADO ==================== */
function InstallmentCard({ installment, inscriptionId, isSelected, onToggleSelection, showNotification }) {
    const { freezarCuota, findCourse, findInscription } = useDB();
    const [showActions, setShowActions] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);

    // Obtener información del curso para calcular precios
    const inscription = findInscription(inscriptionId);
    const course = inscription ? findCourse(inscription.courseId) : null;

    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    const isOverdue = !installment.frozen && today > dueDate;

    // ✅ CORREGIDO: Usar amountEnFecha y amountVencido directamente de la cuota
    const montoEnFecha = installment.amountEnFecha !== undefined ?
        Number(installment.amountEnFecha) || 0 :
        (course ? Number(course.pagoFechaEfectivo) || Number(installment.amount) || 0 : 0);

    const montoVencido = installment.amountVencido !== undefined ?
        Number(installment.amountVencido) || 0 :
        (course ? Number(course.pagoVencidoEfectivo) || Number(installment.amount) || 0 : 0);

    const montoActual = isOverdue ? montoVencido : montoEnFecha;
    const pending = Math.max(montoActual - Number(installment.amountPaid || 0), 0);

    const tieneRecargo = isOverdue && montoVencido !== montoEnFecha;
    const montoRecargo = tieneRecargo ? (montoVencido - montoEnFecha) : 0;

    const handleDepositar = () => {
        setShowDepositModal(true);
        setShowActions(false);
    };

    const handleFreezar = () => {
        try {
            const nuevoEstado = !installment.frozen;
            const success = freezarCuota(inscriptionId, installment.number, nuevoEstado);

            if (success) {
                showNotification('success', `Cuota #${installment.number} ${nuevoEstado ? 'congelada' : 'descongelada'}`);
                setShowActions(false);
            } else {
                throw new Error('Error al cambiar el estado de la cuota');
            }
        } catch (error) {
            showNotification('error', error.message);
        }
    };

    const handleDepositSuccess = (message) => {
        showNotification('success', message);
        setShowDepositModal(false);
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : installment.frozen
                            ? 'border-purple-300 bg-purple-50 hover:border-purple-400'
                            : isOverdue
                                ? 'border-red-300 bg-red-50 hover:border-red-400'
                                : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelection}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                            <div className="font-bold text-gray-800 flex flex-col sm:flex-row sm:items-center gap-2">
                                Cuota #{installment.number}
                                {installment.frozen && (
                                    <span className="text-xs px-2 py-0.5 bg-purple-500 text-white rounded-full flex items-center gap-1 w-fit">
                                        ❄️ CONGELADA
                                    </span>
                                )}
                                {!installment.frozen && isOverdue && (
                                    <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full w-fit">
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

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-900">
                                ${formatNumber(pending)}
                            </div>
                            {tieneRecargo && (
                                <div className="text-xs text-red-600 font-semibold mt-1">
                                    ⚠️ Incluye recargo: ${formatNumber(montoRecargo)}
                                </div>
                            )}
                            {!isOverdue && !installment.frozen && (
                                <div className="text-xs text-green-600 font-semibold mt-1">
                                    ✓ Pago en fecha: ${formatNumber(montoEnFecha)}
                                </div>
                            )}
                            {installment.frozen && (
                                <div className="text-xs text-purple-600 font-semibold mt-1">
                                    ❄️ Sin recargo
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
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors font-semibold w-full sm:w-auto"
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
                            className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3"
                        >
                            <button
                                onClick={handleDepositar}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                            >
                                <FiTrendingUp className="w-4 h-4" />
                                <span>Depositar</span>
                            </button>
                            <button
                                onClick={handleFreezar}
                                className={`flex-1 ${installment.frozen ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'} text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2`}
                            >
                                <FiCreditCard className="w-4 h-4" />
                                <span>{installment.frozen ? 'Descongelar' : 'Freezar'}</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Modal de depósito */}
            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                installment={installment}
                inscriptionId={inscriptionId}
                onSuccess={handleDepositSuccess}
            />
        </>
    );
}

/* ==================== PAYMENT MODAL ACTUALIZADO ==================== */
function PaymentModal({ isOpen, onClose, selectedInstallments, total, showNotification, onSuccess }) {
    const { registrarPago, findInscription, findCourse, findStudent } = useDB();
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    // ✅ CORREGIDO: Calcular detalles de cada cuota usando amountEnFecha y amountVencido
    const cuotasDetalle = selectedInstallments.map(inst => {
        const inscription = findInscription(inst.inscriptionId);
        const course = inscription ? findCourse(inscription.courseId) : null;
        const student = inscription ? findStudent(inscription.studentId) : null;

        const today = new Date();
        const dueDate = new Date(inst.dueDate);
        const isOverdue = !inst.frozen && today > dueDate;

        // ✅ CORREGIDO: Usar amountEnFecha y amountVencido directamente
        let montoActual = 0;
        if (inst.amountEnFecha !== undefined && inst.amountVencido !== undefined) {
            montoActual = isOverdue ? Number(inst.amountVencido) || 0 : Number(inst.amountEnFecha) || 0;
        } else {
            // Fallback: usar precios del curso
            if (course) {
                if (isOverdue) {
                    switch (paymentMethod) {
                        case 'Efectivo': montoActual = Number(course.pagoVencidoEfectivo) || Number(inst.amount) || 0; break;
                        case 'Transferencia': montoActual = Number(course.pagoVencidoTransferencia) || Number(inst.amount) || 0; break;
                        case 'Tarjeta': montoActual = Number(course.pagoVencidoTarjeta) || Number(inst.amount) || 0; break;
                        default: montoActual = Number(inst.amount) || 0;
                    }
                } else {
                    switch (paymentMethod) {
                        case 'Efectivo': montoActual = Number(course.pagoFechaEfectivo) || Number(inst.amount) || 0; break;
                        case 'Transferencia': montoActual = Number(course.pagoFechaTransferencia) || Number(inst.amount) || 0; break;
                        case 'Tarjeta': montoActual = Number(course.pagoFechaTarjeta) || Number(inst.amount) || 0; break;
                        default: montoActual = Number(inst.amount) || 0;
                    }
                }
            } else {
                montoActual = Number(inst.amount) || 0;
            }
        }

        const montoEnFecha = inst.amountEnFecha !== undefined ?
            Number(inst.amountEnFecha) || 0 :
            (course ? Number(course.pagoFechaEfectivo) || Number(inst.amount) || 0 : 0);

        const pending = Math.max(montoActual - Number(inst.amountPaid || 0), 0);
        const tieneRecargo = isOverdue && montoActual !== montoEnFecha;
        const recargo = tieneRecargo ? (montoActual - montoEnFecha) : 0;

        return {
            ...inst,
            montoActual,
            pending,
            isOverdue,
            tieneRecargo,
            recargo,
            courseName: course?.nombre || 'Curso desconocido',
            studentName: student ? `${student.nombre} ${student.apellido}` : 'Alumno desconocido'
        };
    });

    const totalRecargos = cuotasDetalle.reduce((sum, c) => sum + c.recargo, 0);
    const totalActual = cuotasDetalle.reduce((sum, c) => sum + c.pending, 0);

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        try {
            // Procesar cada cuota seleccionada
            for (const cuota of cuotasDetalle) {
                const success = registrarPago(
                    cuota.inscriptionId,
                    cuota.number,
                    cuota.pending,
                    paymentMethod,
                    `Pago completo mediante proceso masivo`
                );

                if (!success) {
                    throw new Error(`Error procesando cuota #${cuota.number}`);
                }
            }

            showNotification('success', `Pago de $${formatNumber(totalActual)} procesado con ${paymentMethod}`);
            onSuccess();
        } catch (error) {
            showNotification('error', error.message);
        } finally {
            setIsProcessing(false);
        }
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
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 sticky top-0 z-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Procesar Pago</h2>
                                <p className="text-red-100 text-sm">
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
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                            <div>
                                                <span className="font-bold text-gray-900">Cuota #{cuota.number}</span>
                                                {cuota.isOverdue && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                                                        VENCIDA
                                                    </span>
                                                )}
                                                {cuota.frozen && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500 text-white rounded-full">
                                                        CONGELADA
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-bold text-blue-900">
                                                ${formatNumber(cuota.pending)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div>Curso: {cuota.courseName}</div>
                                            <div>Vencimiento: {formatDate(cuota.dueDate)}</div>
                                            <div>Precio {paymentMethod.toLowerCase()} {cuota.isOverdue ? 'vencido:' : 'en fecha:'} ${formatNumber(cuota.montoActual)}</div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
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
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <span className="text-2xl font-bold text-green-900">TOTAL A COBRAR:</span>
                                <span className="text-4xl font-bold text-green-700">
                                    ${formatNumber(totalActual)}
                                </span>
                            </div>
                            {totalRecargos > 0 && (
                                <div className="text-sm text-green-700 mt-2">
                                    Incluye ${formatNumber(totalRecargos)} en recargos
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                                disabled={isProcessing}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ==================== COMPONENTE PRINCIPAL ==================== */
export default function Cobros() {
    const { students, inscriptions, courses, findCourse, findInscription } = useDB();
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedInstallments, setSelectedInstallments] = useState([]);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

    // ✅ CORREGIDO: Calcular deudores usando amountEnFecha y amountVencido
    const debtors = useMemo(() => {
        return students.map(student => {
            const studentInscriptions = inscriptions.filter(ins => ins.studentId === student.id);

            let totalPending = 0;
            const pendingInstallments = [];

            studentInscriptions.forEach(inscription => {
                (inscription.installments || []).forEach(inst => {
                    const today = new Date();
                    const dueDate = new Date(inst.dueDate);
                    const isOverdue = !inst.frozen && today > dueDate;

                    // ✅ CORREGIDO: Usar amountEnFecha y amountVencido directamente
                    const montoEnFecha = inst.amountEnFecha !== undefined ?
                        Number(inst.amountEnFecha) || 0 :
                        (findCourse(inscription.courseId) ? Number(findCourse(inscription.courseId).pagoFechaEfectivo) || Number(inst.amount) || 0 : 0);

                    const montoVencido = inst.amountVencido !== undefined ?
                        Number(inst.amountVencido) || 0 :
                        (findCourse(inscription.courseId) ? Number(findCourse(inscription.courseId).pagoVencidoEfectivo) || Number(inst.amount) || 0 : 0);

                    const montoActual = isOverdue ? montoVencido : montoEnFecha;
                    const pending = Math.max(montoActual - Number(inst.amountPaid || 0), 0);

                    if (pending > 0) {
                        totalPending += pending;
                        pendingInstallments.push({
                            ...inst,
                            inscriptionId: inscription.id,
                            courseId: inscription.courseId,
                            courseName: courses.find(c => c.id === inscription.courseId)?.nombre || 'Curso desconocido'
                        });
                    }
                });
            });

            if (totalPending > 0) {
                return {
                    ...student,
                    totalPending,
                    pendingInstallments
                };
            }
            return null;
        }).filter(Boolean);
    }, [students, inscriptions, courses, findCourse]);

    // Filtrar deudores por búsqueda
    const filteredStudents = useMemo(() => {
        if (!search) return debtors;

        const searchLower = search.toLowerCase();
        return debtors.filter(student =>
            student.nombre.toLowerCase().includes(searchLower) ||
            student.apellido.toLowerCase().includes(searchLower) ||
            student.dni.includes(search) ||
            (student.email && student.email.toLowerCase().includes(searchLower))
        );
    }, [debtors, search]);

    // ✅ CORREGIDO: Obtener cursos del estudiante usando amountEnFecha y amountVencido
    const studentCourses = useMemo(() => {
        if (!selectedStudent) return [];

        return inscriptions
            .filter(ins => ins.studentId === selectedStudent.id)
            .map(ins => {
                const course = courses.find(c => c.id === ins.courseId);
                return {
                    id: ins.id,
                    courseId: ins.courseId,
                    courseName: course?.nombre || 'Curso desconocido',
                    inscriptionId: ins.id,
                    fechaInscripcion: ins.fechaInscripcion,
                    installments: (ins.installments || []).filter(inst => {
                        const today = new Date();
                        const dueDate = new Date(inst.dueDate);
                        const isOverdue = !inst.frozen && today > dueDate;

                        // ✅ CORREGIDO: Usar amountEnFecha y amountVencido directamente
                        const montoEnFecha = inst.amountEnFecha !== undefined ?
                            Number(inst.amountEnFecha) || 0 :
                            (findCourse(ins.courseId) ? Number(findCourse(ins.courseId).pagoFechaEfectivo) || Number(inst.amount) || 0 : 0);

                        const montoVencido = inst.amountVencido !== undefined ?
                            Number(inst.amountVencido) || 0 :
                            (findCourse(ins.courseId) ? Number(findCourse(ins.courseId).pagoVencidoEfectivo) || Number(inst.amount) || 0 : 0);

                        const montoActual = isOverdue ? montoVencido : montoEnFecha;
                        return Math.max(montoActual - Number(inst.amountPaid || 0), 0) > 0;
                    })
                };
            })
            .filter(course => course.installments.length > 0);
    }, [selectedStudent, inscriptions, courses, findCourse]);

    const toggleCourseExpansion = (courseId) => {
        setExpandedCourses(prev => ({
            ...prev,
            [courseId]: !prev[courseId]
        }));
    };

    const toggleInstallmentSelection = (inscriptionId, installmentNumber, installment) => {
        const key = `${inscriptionId}-${installmentNumber}`;
        setSelectedInstallments(prev => {
            if (prev.some(item => item.key === key)) {
                return prev.filter(item => item.key !== key);
            } else {
                return [...prev, {
                    key,
                    inscriptionId,
                    installmentNumber,
                    ...installment
                }];
            }
        });
    };

    const isInstallmentSelected = (inscriptionId, installmentNumber) => {
        return selectedInstallments.some(item => item.key === `${inscriptionId}-${installmentNumber}`);
    };

    // ✅ CORREGIDO: Calcular total del carrito usando amountEnFecha y amountVencido
    const totalCarrito = useMemo(() => {
        let total = 0;
        selectedInstallments.forEach(item => {
            const inscription = findInscription(item.inscriptionId);
            const course = inscription ? findCourse(inscription.courseId) : null;

            const today = new Date();
            const dueDate = new Date(item.dueDate);
            const isOverdue = !item.frozen && today > dueDate;

            // ✅ CORREGIDO: Usar amountEnFecha y amountVencido directamente
            const montoEnFecha = item.amountEnFecha !== undefined ?
                Number(item.amountEnFecha) || 0 :
                (course ? Number(course.pagoFechaEfectivo) || Number(item.amount) || 0 : 0);

            const montoVencido = item.amountVencido !== undefined ?
                Number(item.amountVencido) || 0 :
                (course ? Number(course.pagoVencidoEfectivo) || Number(item.amount) || 0 : 0);

            const montoActual = isOverdue ? montoVencido : montoEnFecha;
            total += Math.max(montoActual - Number(item.amountPaid || 0), 0);
        });
        return total;
    }, [selectedInstallments, findInscription, findCourse]);

    const handleProcessPayment = () => {
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setSelectedInstallments([]);
        setShowPaymentModal(false);
        showNotification('success', 'Pago procesado exitosamente');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50 p-4 sm:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header con gradiente rojo-azul */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-600 to-blue-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
                        <FiShoppingCart className="w-8 h-8 sm:w-10 sm:h-10" />
                        Gestión de Cobros
                    </h1>
                    <p className="text-red-100 text-sm sm:text-base">
                        Sistema de cobro de cuotas pendientes
                    </p>
                </motion.div>

                {/* Búsqueda */}
                {!selectedStudent && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
                    >
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o DNI..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-black"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Lista de deudores o detalle del estudiante */}
                <div className="space-y-4">
                    {!selectedStudent ? (
                        <div className="space-y-4">
                            {filteredStudents.map((student) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-red-500"
                                    onClick={() => setSelectedStudent(student)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                                                {student.nombre} {student.apellido}
                                            </h3>
                                            <div className="text-gray-600 mt-2 space-y-1">
                                                <div className="text-sm">DNI: {student.dni}</div>
                                                {student.email && <div className="text-sm">Email: {student.email}</div>}
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <div className="text-sm text-gray-600">Deuda Total</div>
                                            <div className="text-3xl sm:text-4xl font-bold text-red-700">
                                                ${formatNumber(student.totalPending)}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {student.pendingInstallments.length} cuotas pendientes
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredStudents.length === 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
                                    <FiShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
                                        No hay deudores
                                    </h3>
                                    <p className="text-gray-500 text-sm sm:text-base">
                                        {search ? 'No se encontraron alumnos con los filtros aplicados' : '¡Todos los alumnos están al día!'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
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

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                            {selectedStudent.nombre} {selectedStudent.apellido}
                                        </h2>
                                        <div className="text-gray-600 mt-2 space-y-1">
                                            <div className="text-sm">DNI: {selectedStudent.dni}</div>
                                            <div className="text-sm">Email: {selectedStudent.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <div className="text-sm text-gray-600">Deuda Total</div>
                                        <div className="text-3xl sm:text-4xl font-bold text-red-700">
                                            ${formatNumber(selectedStudent.totalPending)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {studentCourses.map(course => (
                                <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
                                    <div
                                        className="bg-gradient-to-r from-red-500 to-blue-500 text-white p-4 cursor-pointer hover:from-red-600 hover:to-blue-600 transition-colors flex justify-between items-center"
                                        onClick={() => toggleCourseExpansion(course.id)}
                                    >
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold">{course.courseName}</h3>
                                            <div className="text-sm text-red-100">
                                                {course.installments.length} cuotas pendientes
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
                                                    {course.installments.map(installment => (
                                                        <InstallmentCard
                                                            key={installment.number}
                                                            installment={installment}
                                                            inscriptionId={course.inscriptionId}
                                                            isSelected={isInstallmentSelected(course.id, installment.number)}
                                                            onToggleSelection={() => toggleInstallmentSelection(course.id, installment.number, installment)}
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
                </div>

                {/* Carrito flotante responsive */}
                {selectedInstallments.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="fixed bottom-4 right-4 left-4 sm:left-auto bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-2xl p-4 sm:p-6 sm:min-w-80 z-40"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-sm text-green-100">Total a cobrar</div>
                                <div className="text-2xl sm:text-3xl font-bold">${formatNumber(totalCarrito)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-green-100">Cuotas</div>
                                <div className="text-xl sm:text-2xl font-bold">{selectedInstallments.length}</div>
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

                {/* Payment Modal */}
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    selectedInstallments={selectedInstallments}
                    total={totalCarrito}
                    showNotification={showNotification}
                    onSuccess={handlePaymentSuccess}
                />
            </div>
        </div>
    );
}