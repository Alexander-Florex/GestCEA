// src/pages/Cobros.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiChevronDown, FiDollarSign,
    FiCreditCard, FiTrendingUp, FiX, FiArrowLeft,
    FiUser, FiMail, FiFileText, FiCalendar, FiCheck,
    FiMoreVertical, FiTrash2
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

/* ================== FUNCIÓN CRÍTICA: CALCULAR PRECIO SEGÚN MÉTODO ================== */
/**
 * Esta función es el CORAZÓN del sistema dinámico.
 * Calcula el precio correcto según:
 * 1. Método de pago actual (Efectivo/Transferencia/Tarjeta)
 * 2. Si está vencida o en fecha
 * 3. Prioridad: installmentsByMethod > curso > cuota estática
 */
const calcularPrecioPorMetodo = (inscription, course, installment, metodo, isOverdue) => {
    // Mapeo de método a key
    const methodKey = metodo === "Efectivo" ? "efectivo"
        : metodo === "Transferencia" ? "transferencia"
            : "tarjeta";

    let precio = 0;

    // PRIORIDAD 1: installmentsByMethod (sistema nuevo)
    if (inscription?.installmentsByMethod?.[methodKey]) {
        const cuotaPorMetodo = inscription.installmentsByMethod[methodKey].find(
            c => Number(c.number) === Number(installment.number)
        );

        if (cuotaPorMetodo) {
            precio = isOverdue
                ? (Number(cuotaPorMetodo.amountVencido) || Number(cuotaPorMetodo.amountEnFecha) || 0)
                : (Number(cuotaPorMetodo.amountEnFecha) || Number(cuotaPorMetodo.amount) || 0);

            console.log(`✅ Precio desde installmentsByMethod[${methodKey}]:`, precio);
            return precio;
        }
    }

    // PRIORIDAD 2: Curso (fallback para inscripciones viejas)
    if (course) {
        if (isOverdue) {
            switch (metodo) {
                case "Efectivo":
                    precio = Number(course.pagoVencidoEfectivo) || 0;
                    break;
                case "Transferencia":
                    precio = Number(course.pagoVencidoTransferencia) || 0;
                    break;
                case "Tarjeta":
                    precio = Number(course.pagoVencidoTarjeta) || 0;
                    break;
            }
        } else {
            switch (metodo) {
                case "Efectivo":
                    precio = Number(course.pagoFechaEfectivo) || 0;
                    break;
                case "Transferencia":
                    precio = Number(course.pagoFechaTransferencia) || 0;
                    break;
                case "Tarjeta":
                    precio = Number(course.pagoFechaTarjeta) || 0;
                    break;
            }
        }

        if (precio > 0) {
            console.log(`✅ Precio desde curso[${metodo}]:`, precio);
            return precio;
        }
    }

    // PRIORIDAD 3: Cuota estática (último recurso)
    precio = isOverdue
        ? (Number(installment.amountVencido) || Number(installment.amount) || 0)
        : (Number(installment.amountEnFecha) || Number(installment.amount) || 0);

    console.log(`⚠️ Precio desde cuota estática:`, precio);
    return precio;
};

/* ================== NOTIFICACIONES ================== */
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
                        className={`px-6 py-4 rounded-xl shadow-lg cursor-pointer border-l-4 ${
                            n.type === 'success'
                                ? 'bg-green-50 text-green-800 border-green-500'
                                : 'bg-red-50 text-red-800 border-red-500'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{n.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ================== MODAL DE DEPÓSITO INDIVIDUAL ================== */
function DepositModal({ isOpen, onClose, installment, inscriptionId, onSuccess }) {
    const { depositarCuota, inscriptions, courses } = useDB();
    const [formData, setFormData] = useState({
        monto: '',
        formaPago: 'Efectivo',
        observaciones: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const inscription = inscriptions.find(ins => ins.id === inscriptionId);
    const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    const isOverdue = !installment.frozen && today > dueDate;

    // ✅ CRÍTICO: Este cálculo se ejecuta CADA VEZ que cambia formData.formaPago
    const precioActual = useMemo(() => {
        const precio = calcularPrecioPorMetodo(inscription, course, installment, formData.formaPago, isOverdue);
        console.log(`🔄 [DepositModal] Recalculando precio para ${formData.formaPago}:`, precio);
        return precio;
    }, [formData.formaPago, inscription, course, installment, isOverdue]);

    const montoPendiente = Math.max(precioActual - Number(installment.amountPaid || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.monto || Number(formData.monto) <= 0) {
            alert('Por favor ingrese un monto válido');
            return;
        }

        if (Number(formData.monto) > montoPendiente) {
            if (!window.confirm(`El monto ($${formatNumber(formData.monto)}) es mayor al pendiente ($${formatNumber(montoPendiente)}). ¿Continuar?`)) {
                return;
            }
        }

        setIsProcessing(true);

        try {
            await depositarCuota(
                inscriptionId,
                installment.number,
                Number(formData.monto),
                formData.formaPago,
                formData.observaciones
            );

            onSuccess(`Depósito de $${formatNumber(formData.monto)} registrado exitosamente`);
            onClose();
        } catch (error) {
            alert(error.message || 'Error al procesar el depósito');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border-2 border-blue-100"
                >
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <FiDollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Depositar Cuota #{installment.number}</h2>
                                    <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        Vencimiento: {formatDate(installment.dueDate)}
                                        {installment.frozen && ' (Freeze)'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Estado de la Cuota */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
                            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                                <FiFileText className="w-5 h-5" />
                                Estado de la Cuota
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                    <div className="text-gray-600">Precio {formData.formaPago}:</div>
                                    <div className="font-bold text-blue-900 text-lg">${formatNumber(precioActual)}</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                    <div className="text-gray-600">Ya Pagado:</div>
                                    <div className="font-bold text-green-700 text-lg">${formatNumber(installment.amountPaid || 0)}</div>
                                </div>
                                <div className="col-span-2 bg-white p-4 rounded-lg border-2 border-red-200">
                                    <div className="text-gray-600">Monto Pendiente:</div>
                                    <div className="font-bold text-red-700 text-2xl">${formatNumber(montoPendiente)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Forma de Pago */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FiCreditCard className="w-4 h-4" />
                                Forma de Pago
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(metodo => (
                                    <button
                                        key={metodo}
                                        type="button"
                                        onClick={() => {
                                            console.log('🔄 Cambiando método a:', metodo);
                                            setFormData(prev => ({ ...prev, formaPago: metodo }));
                                        }}
                                        className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                                            formData.formaPago === metodo
                                                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md'
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                                        }`}
                                    >
                                        {metodo}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Monto a Depositar */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FiDollarSign className="w-4 h-4" />
                                Monto a Depositar
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    name="monto"
                                    value={formData.monto}
                                    onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-black font-medium"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, monto: montoPendiente.toString() }))}
                                className="mt-3 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-lg font-semibold transition-colors"
                            >
                                Pagar monto pendiente completo
                            </button>
                        </div>

                        {/* Observaciones */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FiFileText className="w-4 h-4" />
                                Observaciones (Opcional)
                            </label>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                rows={3}
                                placeholder="Notas adicionales sobre este pago..."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-black"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold hover:border-red-400 hover:text-red-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl hover:from-blue-700 hover:to-red-700 transition-colors font-bold disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-5 h-5" />
                                        Confirmar Depósito
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ================== MODAL DE PAGO MÚLTIPLE ================== */
function PaymentModal({ isOpen, onClose, selectedInstallments, showNotification, onSuccess }) {
    const { registrarPago, inscriptions, courses } = useDB();
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [isProcessing, setIsProcessing] = useState(false);

    // ✅ CRÍTICO: Recalcula TODO cuando cambia paymentMethod
    const cuotasConPrecio = useMemo(() => {
        console.log(`🔄 [PaymentModal] Recalculando precios para ${paymentMethod}`);

        return selectedInstallments.map(item => {
            const inscription = inscriptions.find(ins => ins.id === item.inscriptionId);
            const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

            const today = new Date();
            const dueDate = new Date(item.dueDate);
            const isOverdue = !item.frozen && today > dueDate;

            const precio = calcularPrecioPorMetodo(inscription, course, item, paymentMethod, isOverdue);
            const pending = Math.max(precio - Number(item.amountPaid || 0), 0);

            console.log(`  Cuota #${item.number}: ${paymentMethod} = $${precio}, pendiente = $${pending}`);

            return {
                ...item,
                precio,
                pending,
                isOverdue,
                courseName: course?.nombre || 'Curso desconocido'
            };
        });
    }, [selectedInstallments, paymentMethod, inscriptions, courses]);

    const totalAmount = useMemo(() => {
        const total = cuotasConPrecio.reduce((sum, c) => sum + c.pending, 0);
        console.log(`💰 Total para ${paymentMethod}: $${total}`);
        return total;
    }, [cuotasConPrecio, paymentMethod]);

    const handleConfirm = async () => {
        if (!paymentMethod) {
            showNotification('error', 'Debe seleccionar un método de pago');
            return;
        }

        setIsProcessing(true);

        try {
            let successCount = 0;
            let errorCount = 0;

            for (const cuota of cuotasConPrecio) {
                try {
                    await registrarPago(
                        cuota.inscriptionId,
                        cuota.number,
                        cuota.pending,
                        paymentMethod,
                        `Pago completo de cuota #${cuota.number}`
                    );
                    successCount++;
                } catch (error) {
                    console.error('Error procesando pago:', error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                showNotification('success', `${successCount} cuota(s) cobrada(s) exitosamente`);
                onSuccess();
                onClose();
            }

            if (errorCount > 0) {
                showNotification('error', `${errorCount} cuota(s) tuvieron errores`);
            }
        } catch (error) {
            showNotification('error', 'Error al procesar los pagos');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 50 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border-2 border-red-100"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <FiCreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Procesar Pago Múltiple</h2>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {selectedInstallments.length} cuota{selectedInstallments.length > 1 ? 's' : ''} seleccionada{selectedInstallments.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Detalle de Cuotas */}
                        <div className="bg-gradient-to-br from-blue-50 to-red-50 p-5 rounded-xl border-2 border-blue-200">
                            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                                <FiFileText className="w-5 h-5" />
                                Detalle de Cuotas
                            </h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {cuotasConPrecio.map((cuota, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="font-bold text-gray-800 bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm">
                                                        Cuota #{cuota.number}
                                                    </div>
                                                    {cuota.isOverdue && (
                                                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded-lg text-xs font-bold">
                                                            ⚠️ Vencida
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-gray-700 font-medium mb-1">{cuota.courseName}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3" />
                                                    Vencimiento: {formatDate(cuota.dueDate)}
                                                </div>
                                                <div className="text-sm text-blue-600 font-semibold mt-2">
                                                    Precio {paymentMethod}: ${formatNumber(cuota.precio)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-xl text-green-700">
                                                    ${formatNumber(cuota.pending)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Método de Pago */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 text-lg">
                                <FiCreditCard className="w-5 h-5" />
                                Método de Pago
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => {
                                            console.log('🔄 Cambiando método a:', method);
                                            setPaymentMethod(method);
                                        }}
                                        className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                                            paymentMethod === method
                                                ? 'bg-gradient-to-br from-blue-100 to-red-100 border-blue-500 text-blue-900 shadow-md'
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:shadow-sm'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-gradient-to-r from-red-100 to-blue-100 p-6 rounded-xl border-2 border-red-300 shadow-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-gray-800 font-bold text-lg flex items-center gap-2">
                                    <FiDollarSign className="w-6 h-6" />
                                    TOTAL A COBRAR:
                                </div>
                                <div className="text-gray-800 font-bold text-3xl">
                                    ${formatNumber(totalAmount)}
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold hover:border-red-400 hover:text-red-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl hover:from-blue-700 hover:to-red-700 transition-colors font-bold disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-5 h-5" />
                                        Confirmar Pago
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ================== CARD DE CUOTA ================== */
function InstallmentCard({ installment, inscriptionId, isSelected, onToggleSelection, showNotification }) {
    const { freezarCuota, inscriptions, courses } = useDB();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const inscription = inscriptions.find(ins => ins.id === inscriptionId);
    const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    const isOverdue = !installment.frozen && today > dueDate;
    const isPaid = installment.status === 'Pagada';

    // Mostramos precio en Transferencia por defecto (o el método de la inscripción)
    const defaultMethod = inscription?.paymentType || 'Transferencia';
    const defaultPrice = calcularPrecioPorMetodo(inscription, course, installment, defaultMethod, isOverdue);
    const pending = Math.max(defaultPrice - Number(installment.amountPaid || 0), 0);

    const handleFreeze = async () => {
        try {
            const newStatus = !installment.frozen;
            await freezarCuota(inscriptionId, installment.number, newStatus);
            showNotification('success', `Cuota ${newStatus ? 'freeze aplicado' : 'freeze removido'} exitosamente`);
            setShowActions(false);
        } catch (error) {
            showNotification('error', error.message || 'Error al cambiar estado de freeze');
        }
    };

    const handleCardClick = (e) => {
        // Evitar la selección cuando se hace clic en botones específicos
        if (e.target.closest('button') || e.target.closest('.actions-container')) {
            return;
        }
        if (!isPaid) {
            onToggleSelection();
        }
    };

    return (
        <>
            <div
                className={`bg-white rounded-xl shadow-lg p-5 border-2 transition-all hover:shadow-md cursor-pointer ${
                    isSelected ? 'border-blue-500 bg-blue-50 shadow-md' :
                        isOverdue ? 'border-red-300 bg-red-50' :
                            installment.frozen ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={handleCardClick}
            >
                <div className="flex items-start gap-4">
                    {!isPaid && (
                        <div className="flex items-center mt-1">
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                                isSelected
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-gray-300'
                            }`}>
                                {isSelected && (
                                    <FiCheck className="w-3 h-3 text-white" />
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-gray-800">
                                        Cuota #{installment.number}
                                    </h4>
                                    <div className="flex gap-1">
                                        {isOverdue && (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                                Vencida
                                            </span>
                                        )}
                                        {installment.frozen && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                                Freeze
                                            </span>
                                        )}
                                        {isPaid && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                                Pagada
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <FiCalendar className="w-4 h-4" />
                                    Vencimiento: {formatDate(installment.dueDate)}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm text-gray-600">Pendiente</div>
                                <div className="font-bold text-2xl text-red-700">
                                    ${formatNumber(pending)}
                                </div>
                            </div>
                        </div>

                        {installment.amountPaid > 0 && (
                            <div className="text-sm text-gray-600 mb-3 bg-gray-100 p-2 rounded-lg">
                                <span className="font-medium">Pagado: ${formatNumber(installment.amountPaid)}</span>
                                <span className="mx-2">•</span>
                                <span className="font-medium">Total: ${formatNumber(defaultPrice)}</span>
                            </div>
                        )}

                        {!isPaid && (
                            <div className="flex gap-3 items-center">
                                <button
                                    onClick={() => setShowDepositModal(true)}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl hover:from-blue-700 hover:to-red-700 transition-colors font-semibold shadow-md flex items-center justify-center gap-2"
                                >
                                    <FiDollarSign className="w-4 h-4" />
                                    Pago Parcial
                                </button>

                                <div className="relative actions-container">
                                    <button
                                        onClick={() => setShowActions(!showActions)}
                                        className="p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <FiMoreVertical className="w-4 h-4" />
                                    </button>

                                    <AnimatePresence>
                                        {showActions && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-200 z-10 min-w-48"
                                            >
                                                <button
                                                    onClick={handleFreeze}
                                                    className={`w-full px-4 py-3 text-left flex items-center gap-2 transition-colors ${
                                                        installment.frozen
                                                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    } first:rounded-t-xl last:rounded-b-xl`}
                                                >
                                                    {installment.frozen ? 'Quitar Freeze' : 'Aplicar Freeze'}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                installment={installment}
                inscriptionId={inscriptionId}
                onSuccess={(msg) => {
                    showNotification('success', msg);
                    setShowDepositModal(false);
                }}
            />
        </>
    );
}

/* ================== PÁGINA PRINCIPAL ================== */
export default function Cobros() {
    const { students = [], courses = [], inscriptions = [] } = useDB();
    const [search, setSearch] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedInstallments, setSelectedInstallments] = useState([]);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const studentsWithDebt = useMemo(() => {
        const today = new Date();

        return students
            .map(student => {
                const studentInscriptions = inscriptions.filter(ins => ins.studentId === student.id);

                let pendingInstallments = [];

                studentInscriptions.forEach(inscription => {
                    const course = courses.find(c => c.id === inscription.courseId);

                    (inscription.installments || []).forEach(inst => {
                        if (inst.status !== 'Pagada') {
                            const dueDate = new Date(inst.dueDate);
                            const isOverdue = !inst.frozen && today > dueDate;

                            // Usamos Transferencia por defecto para calcular deuda total
                            const price = calcularPrecioPorMetodo(inscription, course, inst, 'Transferencia', isOverdue);
                            const pending = Math.max(price - Number(inst.amountPaid || 0), 0);

                            if (pending > 0) {
                                pendingInstallments.push({
                                    ...inst,
                                    courseName: course?.nombre || 'Sin curso',
                                    inscriptionId: inscription.id,
                                    pending,
                                    isOverdue
                                });
                            }
                        }
                    });
                });

                if (pendingInstallments.length === 0) return null;

                return {
                    ...student,
                    pendingInstallments,
                    totalPending: pendingInstallments.reduce((sum, i) => sum + i.pending, 0)
                };
            })
            .filter(s => s !== null)
            .sort((a, b) => b.totalPending - a.totalPending);
    }, [students, inscriptions, courses]);

    const filteredStudents = useMemo(() => {
        if (!search) return studentsWithDebt;
        const q = search.toLowerCase();
        return studentsWithDebt.filter(s =>
            s.nombre.toLowerCase().includes(q) ||
            s.apellido.toLowerCase().includes(q) ||
            s.dni?.toString().includes(q) ||
            s.email?.toLowerCase().includes(q)
        );
    }, [studentsWithDebt, search]);

    const studentCourses = useMemo(() => {
        if (!selectedStudent) return [];

        const courseGroups = {};

        selectedStudent.pendingInstallments.forEach(inst => {
            if (!courseGroups[inst.courseName]) {
                courseGroups[inst.courseName] = {
                    id: inst.inscriptionId,
                    courseName: inst.courseName,
                    inscriptionId: inst.inscriptionId,
                    installments: []
                };
            }
            courseGroups[inst.courseName].installments.push(inst);
        });

        return Object.values(courseGroups);
    }, [selectedStudent]);

    const totalCarrito = useMemo(() => {
        return selectedInstallments.reduce((sum, item) => sum + item.pending, 0);
    }, [selectedInstallments]);

    const toggleInstallmentSelection = (courseId, installmentNumber, installment) => {
        const key = `${courseId}-${installmentNumber}`;
        const exists = selectedInstallments.find(i => `${i.courseId}-${i.number}` === key);

        if (exists) {
            setSelectedInstallments(prev =>
                prev.filter(i => `${i.courseId}-${i.number}` !== key)
            );
        } else {
            setSelectedInstallments(prev => [
                ...prev,
                {
                    ...installment,
                    courseId
                }
            ]);
        }
    };

    const isInstallmentSelected = (courseId, installmentNumber) => {
        return selectedInstallments.some(i =>
            i.courseId === courseId && i.number === installmentNumber
        );
    };

    const toggleCourseExpansion = (courseId) => {
        setExpandedCourses(prev => ({
            ...prev,
            [courseId]: !prev[courseId]
        }));
    };

    const handleProcessPayment = () => {
        if (selectedInstallments.length === 0) {
            showNotification('error', 'No hay cuotas seleccionadas');
            return;
        }
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setSelectedInstallments([]);
        setExpandedCourses({});
    };

    const clearAllSelections = () => {
        setSelectedInstallments([]);
        showNotification('success', 'Todas las selecciones han sido limpiadas');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50 p-6">
            <Notifications notifications={notifications} remove={(id) =>
                setNotifications(prev => prev.filter(n => n.id !== id))
            } />

            <div className="max-w-7xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white border-2 border-white/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-4 rounded-2xl">
                            <FiDollarSign className="w-12 h-12" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Gestión de Cobros</h1>
                            <p className="text-blue-100 text-lg">
                                Sistema de cobro de cuotas pendientes con precios dinámicos
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                    <div className="relative mb-6">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar alumno por nombre, DNI o email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-black text-lg shadow-sm"
                        />
                    </div>

                    {!selectedStudent ? (
                        <div className="space-y-4">
                            {filteredStudents.map(student => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => setSelectedStudent(student)}
                                    className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-300 hover:scale-[1.02]"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                                                <FiUser className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                                    {student.nombre} {student.apellido}
                                                </h3>
                                                <div className="text-gray-600 space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <FiFileText className="w-4 h-4" />
                                                        DNI: {student.dni}
                                                    </div>
                                                    {student.email && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <FiMail className="w-4 h-4" />
                                                            Email: {student.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600 mb-1">Deuda Total</div>
                                            <div className="text-4xl font-bold text-red-700">
                                                ${formatNumber(student.totalPending)}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-2 bg-white/80 px-3 py-1 rounded-full">
                                                {student.pendingInstallments.length} cuotas pendientes
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredStudents.length === 0 && (
                                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
                                    <div className="bg-gradient-to-r from-red-100 to-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FiDollarSign className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-2">
                                        No hay deudores
                                    </h3>
                                    <p className="text-gray-500 text-lg">
                                        {search ? 'No se encontraron alumnos con los filtros aplicados' : '¡Todos los alumnos están al día!'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                                <div className="flex justify-between items-center mb-6">
                                    <button
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            setSelectedInstallments([]);
                                            setExpandedCourses({});
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 text-lg hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                                    >
                                        <FiArrowLeft className="w-5 h-5" />
                                        Volver a la lista
                                    </button>

                                    {selectedInstallments.length > 0 && (
                                        <button
                                            onClick={clearAllSelections}
                                            className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-2 text-lg hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                                        >
                                            <FiTrash2 className="w-5 h-5" />
                                            Limpiar selecciones ({selectedInstallments.length})
                                        </button>
                                    )}
                                </div>

                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-r from-red-100 to-blue-100 p-4 rounded-2xl">
                                            <FiUser className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-800">
                                                {selectedStudent.nombre} {selectedStudent.apellido}
                                            </h2>
                                            <div className="text-gray-600 mt-3 space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FiFileText className="w-4 h-4" />
                                                    DNI: {selectedStudent.dni}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FiMail className="w-4 h-4" />
                                                    Email: {selectedStudent.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600 mb-2">Deuda Total</div>
                                        <div className="text-4xl font-bold text-red-700">
                                            ${formatNumber(selectedStudent.totalPending)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {studentCourses.map(course => (
                                <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-all">
                                    <div
                                        className="bg-gradient-to-r from-red-500 to-blue-500 text-white p-6 cursor-pointer hover:from-red-600 hover:to-blue-600 transition-colors flex justify-between items-center"
                                        onClick={() => toggleCourseExpansion(course.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/20 p-3 rounded-xl">
                                                <FiFileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{course.courseName}</h3>
                                                <div className="text-sm text-red-100 mt-1">
                                                    {course.installments.length} cuotas pendientes
                                                </div>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedCourses[course.id] ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-white/20 p-2 rounded-lg"
                                        >
                                            <FiChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedCourses[course.id] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 space-y-4 bg-gradient-to-b from-blue-50 to-red-50">
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

                {selectedInstallments.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-2xl shadow-2xl p-6 min-w-96 z-40 border-2 border-white/20"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-sm text-blue-100">Total a cobrar</div>
                                <div className="text-3xl font-bold">${formatNumber(totalCarrito)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-blue-100">Cuotas seleccionadas</div>
                                <div className="text-2xl font-bold">{selectedInstallments.length}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleProcessPayment}
                            className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-3 shadow-lg hover:shadow-xl text-lg"
                        >
                            <FiCreditCard className="w-5 h-5" />
                            Procesar Pago Múltiple
                        </button>
                    </motion.div>
                )}

                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    selectedInstallments={selectedInstallments}
                    showNotification={showNotification}
                    onSuccess={handlePaymentSuccess}
                />
            </div>
        </div>
    );
}