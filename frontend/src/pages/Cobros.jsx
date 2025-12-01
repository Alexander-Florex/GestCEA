// src/pages/Cobros.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiChevronDown, FiDollarSign,
    FiCreditCard, FiTrendingUp, FiX, FiArrowLeft,
    FiUser, FiMail, FiFileText, FiCalendar, FiCheck,
    FiMoreVertical, FiTrash2, FiFilter, FiCheckCircle,
    FiAlertCircle, FiInfo, FiShoppingCart
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
const calcularPrecioPorMetodo = (inscription, course, installment, metodo, isOverdue) => {
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
            return precio;
        }
    }

    // PRIORIDAD 3: Cuota estática (último recurso)
    precio = isOverdue
        ? (Number(installment.amountVencido) || Number(installment.amount) || 0)
        : (Number(installment.amountEnFecha) || Number(installment.amount) || 0);

    return precio;
};

/* ================== STATS CARD ================== */
function StatsCard({ icon: Icon, title, value, color, description }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-2">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    {description && (
                        <p className="text-gray-500 text-xs mt-2">{description}</p>
                    )}
                </div>
                <div className={`p-4 rounded-xl ${color.includes('red') ? 'bg-red-50' : color.includes('blue') ? 'bg-blue-50' : 'bg-green-50'}`}>
                    <Icon className={`w-7 h-7 ${color}`} />
                </div>
            </div>
        </motion.div>
    );
}

/* ================== NOTIFICACIONES ================== */
function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-6 right-6 flex flex-col space-y-3 z-50 max-w-sm">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className={`px-5 py-4 rounded-xl shadow-2xl cursor-pointer border-l-4 backdrop-blur-sm ${n.type === 'success'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-green-500'
                            : n.type === 'error'
                                ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-900 border-red-500'
                                : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 border-blue-500'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${n.type === 'success' ? 'bg-green-100' : n.type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                {n.type === 'success' ? <FiCheckCircle className="w-5 h-5" /> :
                                    n.type === 'error' ? <FiAlertCircle className="w-5 h-5" /> :
                                        <FiInfo className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold">{n.message}</span>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ================== FILTROS MEJORADOS ================== */
function FilterBar({ onFilterChange, filters }) {
    const filterOptions = [
        { id: 'todas', label: 'Todas', icon: FiFileText },
        { id: 'vencidas', label: 'Solo Vencidas', icon: FiAlertCircle },
        { id: 'freeze', label: 'Con Freeze', icon: FiTrendingUp },
        { id: 'hoy', label: 'Vence Hoy', icon: FiCalendar },
        { id: 'proximaSemana', label: 'Próxima Semana', icon: FiCalendar }
    ];

    const handleFilterChange = (filterId) => {
        if (filterId === filters) {
            onFilterChange('todas'); // Deseleccionar
        } else {
            onFilterChange(filterId);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-md">
            <div className="flex items-center gap-3 mb-5">
                <FiFilter className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-800 text-lg">Filtrar por estado</h3>
            </div>
            <div className="flex flex-wrap gap-3">
                {filterOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = filters === option.id;
                    return (
                        <button
                            key={option.id}
                            onClick={() => handleFilterChange(option.id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-blue-50 to-red-50 border-blue-500 text-blue-700 font-semibold shadow-md'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                            {option.label}
                        </button>
                    );
                })}
            </div>
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

    // ✅ Obtener datos frescos de la inscripción
    const inscription = inscriptions.find(ins => ins.id === inscriptionId);
    const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

    // ✅ Obtener la cuota fresca de la inscripción (no del prop)
    const cuotaActual = inscription?.installments?.find(i => i.number === installment.number);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const isOverdue = !cuotaActual?.frozen && today > dueDate;

    // ✅ CRÍTICO: Calcular precio usando datos frescos
    const precioActual = useMemo(() => {
        if (!cuotaActual) return 0;
        const precio = calcularPrecioPorMetodo(inscription, course, cuotaActual, formData.formaPago, isOverdue);
        return precio;
    }, [formData.formaPago, inscription, course, cuotaActual, isOverdue]);

    // ✅ Usar amountPaid fresco de la cuota actual
    const montoPendiente = Math.max(precioActual - Number(cuotaActual?.amountPaid || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.monto || Number(formData.monto) <= 0) {
            alert('Por favor ingrese un monto válido');
            return;
        }

        const montoAPagar = Number(formData.monto);

        if (montoAPagar > montoPendiente + 0.01) {
            if (!window.confirm(`El monto ($${formatNumber(montoAPagar)}) es mayor al pendiente ($${formatNumber(montoPendiente)}). ¿Continuar?`)) {
                return;
            }
        }

        setIsProcessing(true);

        try {
            await depositarCuota(
                inscriptionId,
                installment.number,
                montoAPagar,
                formData.formaPago,
                formData.observaciones
            );

            onSuccess(`Depósito de $${formatNumber(montoAPagar)} registrado exitosamente`);
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
                    <div className="bg-gradient-to-r from-red-600 via-red-500 to-blue-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <FiDollarSign className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Depositar Cuota #{installment.number}</h2>
                                    <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        Vencimiento: {formatDate(installment.dueDate)}
                                        {cuotaActual?.frozen && ' (Freeze)'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all hover:scale-110"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Estado de la Cuota */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 shadow-inner">
                            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-3 text-lg">
                                <FiFileText className="w-5 h-5" />
                                Estado de la Cuota
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm">
                                    <div className="text-gray-600 mb-2">Precio {formData.formaPago}:</div>
                                    <div className="font-bold text-blue-900 text-xl">${formatNumber(precioActual)}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border-2 border-green-100 shadow-sm">
                                    <div className="text-gray-600 mb-2">Ya Pagado:</div>
                                    <div className="font-bold text-green-700 text-xl">${formatNumber(cuotaActual?.amountPaid || 0)}</div>
                                </div>
                                <div className="col-span-2 bg-white p-5 rounded-xl border-2 border-red-200 shadow-lg">
                                    <div className="text-gray-600 mb-2">Monto Pendiente:</div>
                                    <div className="font-bold text-red-700 text-3xl">${formatNumber(montoPendiente)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Forma de Pago */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-3 text-lg">
                                <FiCreditCard className="w-5 h-5 text-blue-600" />
                                Forma de Pago
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(metodo => (
                                    <button
                                        key={metodo}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, formaPago: metodo }));
                                        }}
                                        className={`p-5 rounded-xl border-2 font-semibold transition-all duration-300 ${formData.formaPago === metodo
                                            ? 'bg-gradient-to-r from-blue-50 to-red-50 border-blue-500 text-blue-900 shadow-lg scale-105'
                                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-md'
                                        }`}
                                    >
                                        {metodo}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Monto a Depositar */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-3 text-lg">
                                <FiDollarSign className="w-5 h-5 text-blue-600" />
                                Monto a Depositar
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                                <input
                                    type="number"
                                    name="monto"
                                    value={formData.monto}
                                    onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-black font-medium text-lg shadow-sm"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, monto: montoPendiente.toFixed(2) }))}
                                className="mt-4 text-sm bg-gradient-to-r from-blue-100 to-red-100 text-blue-700 hover:from-blue-200 hover:to-red-200 px-4 py-2 rounded-lg font-semibold transition-all shadow-md"
                            >
                                Pagar total pendiente: ${formatNumber(montoPendiente)}
                            </button>
                        </div>

                        {/* Observaciones */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 text-lg">
                                Observaciones (opcional)
                            </label>
                            <textarea
                                value={formData.observaciones}
                                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                placeholder="Ej: Pago parcial, acuerdo de pago, etc."
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-black resize-none shadow-sm"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-md hover:shadow-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isProcessing || !formData.monto || Number(formData.monto) <= 0}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl hover:from-blue-700 hover:to-red-700 transition-all font-bold disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.02]"
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

    // ✅ CRÍTICO: Recalcula usando datos FRESCOS de inscriptions
    const cuotasConPrecio = useMemo(() => {
        console.log(`🔄 [PaymentModal] Recalculando precios para ${paymentMethod}`);

        return selectedInstallments.map(item => {
            // ✅ Obtener inscripción FRESCA de la DB
            const inscription = inscriptions.find(ins => ins.id === item.inscriptionId);
            const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

            // ✅ Obtener cuota FRESCA de la inscripción
            const cuotaFresca = inscription?.installments?.find(i => i.number === item.number);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(item.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = !cuotaFresca?.frozen && today > dueDate;

            // ✅ Calcular precio usando la cuota fresca
            const precio = calcularPrecioPorMetodo(inscription, course, cuotaFresca || item, paymentMethod, isOverdue);

            // ✅ Usar amountPaid FRESCO
            const amountPaidFresco = Number(cuotaFresca?.amountPaid || 0);
            const pending = Math.max(precio - amountPaidFresco, 0);

            console.log(`  Cuota #${item.number}: ${paymentMethod} = $${precio}, pagado=$${amountPaidFresco}, pendiente = $${pending}`);

            return {
                ...item,
                precio,
                pending,
                amountPaid: amountPaidFresco,
                isOverdue,
                courseName: course?.nombre || 'Curso desconocido',
                // ✅ Guardar referencia a si la cuota ya está pagada
                yaEstaPagada: cuotaFresca?.status === 'Pagada' || cuotaFresca?.status === 'Pagado' || pending <= 0
            };
        }).filter(c => !c.yaEstaPagada && c.pending > 0); // ✅ Filtrar cuotas ya pagadas
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

        if (cuotasConPrecio.length === 0) {
            showNotification('error', 'No hay cuotas pendientes para procesar');
            return;
        }

        setIsProcessing(true);

        try {
            let successCount = 0;
            let errorCount = 0;

            // ✅ Procesar una cuota a la vez para evitar inconsistencias
            for (const cuota of cuotasConPrecio) {
                try {
                    // ✅ Re-verificar el monto pendiente antes de cada pago
                    const inscripcionActual = inscriptions.find(ins => ins.id === cuota.inscriptionId);
                    const cuotaActual = inscripcionActual?.installments?.find(i => i.number === cuota.number);

                    if (cuotaActual?.status === 'Pagada' || cuotaActual?.status === 'Pagado') {
                        console.log(`⏭️ Cuota #${cuota.number} ya está pagada, saltando...`);
                        continue;
                    }

                    const course = courses.find(c => c.id === inscripcionActual?.courseId);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = new Date(cuota.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    const isOverdue = !cuotaActual?.frozen && today > dueDate;

                    const precioActual = calcularPrecioPorMetodo(inscripcionActual, course, cuotaActual, paymentMethod, isOverdue);
                    const pendienteActual = Math.max(precioActual - Number(cuotaActual?.amountPaid || 0), 0);

                    if (pendienteActual <= 0) {
                        console.log(`⏭️ Cuota #${cuota.number} ya no tiene pendiente, saltando...`);
                        continue;
                    }

                    console.log(`💳 Procesando cuota #${cuota.number}: $${pendienteActual}`);

                    await registrarPago(
                        cuota.inscriptionId,
                        cuota.number,
                        pendienteActual, // ✅ Usar el pendiente recalculado
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

            if (successCount === 0 && errorCount === 0) {
                showNotification('info', 'No había cuotas pendientes para procesar');
                onClose();
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
                    <div className="bg-gradient-to-r from-red-600 via-red-500 to-blue-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <FiCreditCard className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Procesar Pago Múltiple</h2>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {cuotasConPrecio.length} cuota{cuotasConPrecio.length !== 1 ? 's' : ''} pendiente{cuotasConPrecio.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all hover:scale-110"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {cuotasConPrecio.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiCheck className="w-12 h-12 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">¡Todas las cuotas ya están pagadas!</h3>
                                <p className="text-gray-500 text-lg">No hay cuotas pendientes para procesar.</p>
                            </div>
                        ) : (
                            <>
                                {/* Detalle de Cuotas */}
                                <div className="bg-gradient-to-br from-blue-50 to-red-50 p-6 rounded-2xl border-2 border-blue-200 shadow-inner">
                                    <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-3 text-xl">
                                        <FiFileText className="w-6 h-6" />
                                        Detalle de Cuotas
                                    </h3>
                                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                        {cuotasConPrecio.map((cuota, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-white p-5 rounded-xl border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="font-bold text-gray-800 bg-gradient-to-r from-blue-100 to-red-100 text-blue-800 px-3 py-1.5 rounded-xl text-sm">
                                                                Cuota #{cuota.number}
                                                            </div>
                                                            {cuota.isOverdue && (
                                                                <div className="bg-gradient-to-r from-red-100 to-rose-100 text-red-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                                                                    ⚠️ Vencida
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-800 font-semibold mb-2 text-lg">{cuota.courseName}</div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                                            <FiCalendar className="w-4 h-4" />
                                                            Vencimiento: {formatDate(cuota.dueDate)}
                                                        </div>
                                                        <div className="flex gap-4 mt-3">
                                                            <div className="text-sm text-blue-600 font-semibold">
                                                                Precio {paymentMethod}: ${formatNumber(cuota.precio)}
                                                            </div>
                                                            {cuota.amountPaid > 0 && (
                                                                <div className="text-sm text-green-600 font-semibold">
                                                                    Ya pagado: ${formatNumber(cuota.amountPaid)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-2xl text-green-700">
                                                            ${formatNumber(cuota.pending)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">pendiente</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Método de Pago */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-5 flex items-center gap-3 text-xl">
                                        <FiCreditCard className="w-6 h-6 text-blue-600" />
                                        Método de Pago
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => {
                                                    setPaymentMethod(method);
                                                }}
                                                className={`p-5 rounded-xl border-2 font-semibold transition-all duration-300 ${paymentMethod === method
                                                    ? 'bg-gradient-to-br from-blue-100 to-red-100 border-blue-500 text-blue-900 shadow-lg scale-105'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-md'
                                                }`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-gradient-to-r from-red-100 to-blue-100 p-7 rounded-2xl border-2 border-red-300 shadow-xl">
                                    <div className="flex justify-between items-center">
                                        <div className="text-gray-800 font-bold text-xl flex items-center gap-3">
                                            <FiDollarSign className="w-7 h-7" />
                                            TOTAL A COBRAR:
                                        </div>
                                        <div className="text-gray-800 font-bold text-4xl">
                                            ${formatNumber(totalAmount)}
                                        </div>
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-md hover:shadow-lg hover:border-red-400 hover:text-red-700"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isProcessing || cuotasConPrecio.length === 0}
                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl hover:from-blue-700 hover:to-red-700 transition-all font-bold disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.02]"
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
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ================== CARD DE CUOTA MEJORADA ================== */
function InstallmentCard({ installment, inscriptionId, isSelected, onToggleSelection, showNotification }) {
    const { freezarCuota, inscriptions, courses } = useDB();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const inscription = inscriptions.find(ins => ins.id === inscriptionId);
    const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const isOverdue = !installment.frozen && today > dueDate;
    const isToday = !installment.frozen && today.getTime() === dueDate.getTime();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    const isPaid = installment.status === 'Pagada' || installment.status === 'Pagado';

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
        if (e.target.closest('button') || e.target.closest('.actions-container')) {
            return;
        }
        if (!isPaid && pending > 0) {
            onToggleSelection();
        }
    };

    // Determinar color según urgencia
    let statusColor = 'text-gray-600';
    let statusBg = 'bg-gray-100';
    let statusText = '';

    if (isPaid) {
        statusColor = 'text-green-600';
        statusBg = 'bg-green-100';
        statusText = '✅ Pagada';
    } else if (installment.frozen) {
        statusColor = 'text-blue-600';
        statusBg = 'bg-blue-100';
        statusText = '❄️ Freeze';
    } else if (isOverdue) {
        statusColor = 'text-red-600';
        statusBg = 'bg-red-100';
        statusText = `⚠️ Vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`;
    } else if (isToday) {
        statusColor = 'text-orange-600';
        statusBg = 'bg-orange-100';
        statusText = '⏰ Vence hoy';
    } else if (daysUntilDue <= 3) {
        statusColor = 'text-orange-600';
        statusBg = 'bg-orange-100';
        statusText = `⏳ Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`;
    } else if (daysUntilDue <= 7) {
        statusColor = 'text-yellow-600';
        statusBg = 'bg-yellow-100';
        statusText = `📅 Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`;
    } else {
        statusColor = 'text-green-600';
        statusBg = 'bg-green-100';
        statusText = `✅ Vence en ${daysUntilDue} días`;
    }

    // Calcular porcentaje pagado
    const paidPercentage = defaultPrice > 0 ? Math.round((installment.amountPaid / defaultPrice) * 100) : 0;

    return (
        <>
            <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={handleCardClick}
                className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isPaid
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 opacity-70'
                    : isSelected
                        ? 'bg-gradient-to-r from-blue-50 to-red-50 border-blue-500 shadow-xl ring-4 ring-blue-200'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
            >
                <div className="flex items-start gap-5">
                    {/* Checkbox de selección */}
                    {!isPaid && pending > 0 && (
                        <div className="flex items-start pt-1">
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={`w-7 h-7 rounded-xl border-3 flex items-center justify-center transition-all ${isSelected
                                    ? 'bg-gradient-to-r from-blue-500 to-red-500 border-blue-500 shadow-md'
                                    : 'border-gray-300'
                                }`}
                            >
                                {isSelected && (
                                    <FiCheck className="w-4 h-4 text-white" />
                                )}
                            </motion.div>
                        </div>
                    )}

                    <div className="flex-1">
                        {/* Encabezado con estado */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h4 className="font-bold text-xl text-gray-900">
                                        Cuota #{installment.number}
                                    </h4>
                                    <span className={`px-3 py-1.5 ${statusBg} ${statusColor} rounded-full text-xs font-bold shadow-sm`}>
                                        {statusText}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium">Vencimiento:</span> {formatDate(installment.dueDate)}
                                    </div>
                                    <div className="w-px h-4 bg-gray-300"></div>
                                    <div className="flex items-center gap-2">
                                        <FiCreditCard className="w-4 h-4 text-green-600" />
                                        <span className="font-medium">Método:</span> {defaultMethod}
                                    </div>
                                </div>
                            </div>

                            {/* Monto pendiente */}
                            <div className="text-right">
                                <div className="text-sm text-gray-600 mb-2">Pendiente</div>
                                <div className={`font-bold text-3xl ${isPaid ? 'text-green-700' : 'text-red-700'}`}>
                                    ${formatNumber(pending)}
                                </div>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        {!isPaid && defaultPrice > 0 && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Progreso del pago</span>
                                    <span className="font-medium">
                                        {paidPercentage}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Detalles de pago */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gradient-to-r from-blue-50 to-gray-50 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 mb-1">Precio Total</div>
                                <div className="font-bold text-gray-800">${formatNumber(defaultPrice)}</div>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 mb-1">Pagado</div>
                                <div className="font-bold text-green-700">${formatNumber(installment.amountPaid || 0)}</div>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        {!isPaid && pending > 0 && (
                            <div className="flex gap-4 items-center">
                                <button
                                    onClick={() => setShowDepositModal(true)}
                                    className="flex-1 px-5 py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl hover:from-blue-700 hover:to-red-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.02]"
                                >
                                    <FiDollarSign className="w-5 h-5" />
                                    {paidPercentage === 0 ? 'Pagar Cuota' : 'Continuar Pago'}
                                </button>

                                <div className="relative actions-container">
                                    <button
                                        onClick={() => setShowActions(!showActions)}
                                        className="p-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all shadow-md flex items-center gap-2 hover:scale-105"
                                    >
                                        <FiMoreVertical className="w-5 h-5" />
                                    </button>

                                    <AnimatePresence>
                                        {showActions && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="absolute right-0 top-14 bg-white rounded-2xl shadow-xl border-2 border-gray-200 z-10 min-w-56 overflow-hidden"
                                            >
                                                <button
                                                    onClick={handleFreeze}
                                                    className={`w-full px-5 py-4 text-left flex items-center gap-3 transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 ${installment.frozen
                                                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold'
                                                        : 'text-gray-700'
                                                    }`}
                                                >
                                                    {installment.frozen ? '❄️ Quitar Freeze' : '❄️ Aplicar Freeze'}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

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
    const [activeFilter, setActiveFilter] = useState('todas');
    // NUEVO ESTADO para ordenamiento
    const [sortBy, setSortBy] = useState('deudaDesc'); // Por defecto: Mayor deuda

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // Función helper para mostrar el label del ordenamiento
    const getSortLabel = (sortValue) => {
        switch (sortValue) {
            case 'apellido': return 'Apellido (A-Z)';
            case 'nombre': return 'Nombre (A-Z)';
            case 'deudaDesc': return 'Mayor Deuda';
            case 'deudaAsc': return 'Menor Deuda';
            case 'cuotasDesc': return 'Más Cuotas';
            case 'cuotasAsc': return 'Menos Cuotas';
            default: return 'Mayor Deuda';
        }
    };

    // Calcular estadísticas
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        let totalDeuda = 0;
        let totalVencidas = 0;
        let totalHoy = 0;
        let totalProximaSemana = 0;
        let totalAlumnos = 0;
        let totalCuotas = 0;

        students.forEach(student => {
            const studentInscriptions = inscriptions.filter(ins => ins.studentId === student.id);
            let studentHasDebt = false;

            studentInscriptions.forEach(inscription => {
                const course = courses.find(c => c.id === inscription.courseId);
                (inscription.installments || []).forEach(inst => {
                    if (inst.status === 'Pagada' || inst.status === 'Pagado') return;

                    const dueDate = new Date(inst.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    const isOverdue = !inst.frozen && today > dueDate;
                    const isToday = !inst.frozen && today.getTime() === dueDate.getTime();
                    const isNextWeek = !inst.frozen && dueDate <= nextWeek && dueDate >= today;

                    const defaultMethod = inscription.paymentType || 'Transferencia';
                    const price = calcularPrecioPorMetodo(inscription, course, inst, defaultMethod, isOverdue);
                    const pending = Math.max(price - Number(inst.amountPaid || 0), 0);

                    if (pending > 0) {
                        totalDeuda += pending;
                        totalCuotas++;
                        if (isOverdue) totalVencidas++;
                        if (isToday) totalHoy++;
                        if (isNextWeek) totalProximaSemana++;
                        studentHasDebt = true;
                    }
                });
            });

            if (studentHasDebt) totalAlumnos++;
        });

        return {
            totalDeuda,
            totalVencidas,
            totalHoy,
            totalProximaSemana,
            totalAlumnos,
            totalCuotas
        };
    }, [students, inscriptions, courses]);

    const studentsWithDebt = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        nextWeek.setHours(23, 59, 59, 999);

        return students
            .map(student => {
                const studentInscriptions = inscriptions.filter(ins => ins.studentId === student.id);

                let pendingInstallments = [];

                studentInscriptions.forEach(inscription => {
                    const course = courses.find(c => c.id === inscription.courseId);

                    (inscription.installments || []).forEach(inst => {
                        // ✅ Excluir cuotas ya pagadas
                        if (inst.status === 'Pagada' || inst.status === 'Pagado') {
                            return;
                        }

                        const dueDate = new Date(inst.dueDate);
                        dueDate.setHours(0, 0, 0, 0);
                        const isOverdue = !inst.frozen && today > dueDate;
                        const isToday = !inst.frozen && today.getTime() === dueDate.getTime();
                        const isNextWeek = !inst.frozen && dueDate <= nextWeek && dueDate >= today;

                        // ✅ Aplicar filtros
                        if (activeFilter === 'vencidas' && !isOverdue) return;
                        if (activeFilter === 'freeze' && !inst.frozen) return;
                        if (activeFilter === 'hoy' && !isToday) return;
                        if (activeFilter === 'proximaSemana' && !isNextWeek) return;

                        // Usamos Transferencia por defecto para calcular deuda total
                        const defaultMethod = inscription.paymentType || 'Transferencia';
                        const price = calcularPrecioPorMetodo(inscription, course, inst, defaultMethod, isOverdue);
                        const pending = Math.max(price - Number(inst.amountPaid || 0), 0);

                        if (pending > 0) {
                            pendingInstallments.push({
                                ...inst,
                                courseName: course?.nombre || 'Sin curso',
                                inscriptionId: inscription.id,
                                pending,
                                isOverdue,
                                isToday,
                                isNextWeek,
                                dueDate: inst.dueDate,
                                frozen: inst.frozen
                            });
                        }
                    });
                });

                if (pendingInstallments.length === 0) return null;

                // Si hay filtro activo, ordenar por fecha de vencimiento
                if (activeFilter !== 'todas') {
                    pendingInstallments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                }

                return {
                    ...student,
                    pendingInstallments,
                    totalPending: pendingInstallments.reduce((sum, i) => sum + i.pending, 0),
                    // Para mostrar estadísticas rápidas
                    vencidasCount: pendingInstallments.filter(i => i.isOverdue).length,
                    hoyCount: pendingInstallments.filter(i => i.isToday).length,
                    proximaSemanaCount: pendingInstallments.filter(i => i.isNextWeek).length
                };
            })
            .filter(s => s !== null);
    }, [students, inscriptions, courses, activeFilter]);

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

    // NUEVA FUNCIÓN: Ordenar estudiantes según el criterio seleccionado
    const sortedStudents = useMemo(() => {
        let sorted = [...filteredStudents];

        switch (sortBy) {
            case 'apellido':
                sorted.sort((a, b) => a.apellido.localeCompare(b.apellido));
                break;
            case 'nombre':
                sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case 'deudaDesc':
                sorted.sort((a, b) => b.totalPending - a.totalPending);
                break;
            case 'deudaAsc':
                sorted.sort((a, b) => a.totalPending - b.totalPending);
                break;
            case 'cuotasDesc':
                sorted.sort((a, b) => b.pendingInstallments.length - a.pendingInstallments.length);
                break;
            case 'cuotasAsc':
                sorted.sort((a, b) => a.pendingInstallments.length - b.pendingInstallments.length);
                break;
            default:
                // Por defecto ordenar por mayor deuda
                sorted.sort((a, b) => b.totalPending - a.totalPending);
        }

        return sorted;
    }, [filteredStudents, sortBy]);

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

    // ✅ Recalcular el total del carrito con datos frescos
    const totalCarrito = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return selectedInstallments.reduce((sum, item) => {
            // Obtener datos frescos
            const inscription = inscriptions.find(ins => ins.id === item.inscriptionId);
            const cuotaFresca = inscription?.installments?.find(i => i.number === item.number);
            const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

            if (!cuotaFresca || cuotaFresca.status === 'Pagada' || cuotaFresca.status === 'Pagado') {
                return sum;
            }

            const dueDate = new Date(item.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = !cuotaFresca.frozen && today > dueDate;

            const defaultMethod = inscription?.paymentType || 'Transferencia';
            const price = calcularPrecioPorMetodo(inscription, course, cuotaFresca, defaultMethod, isOverdue);
            const pending = Math.max(price - Number(cuotaFresca.amountPaid || 0), 0);

            return sum + pending;
        }, 0);
    }, [selectedInstallments, inscriptions, courses]);

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
        // ✅ Re-seleccionar el estudiante para refrescar datos
        if (selectedStudent) {
            const updatedStudent = studentsWithDebt.find(s => s.id === selectedStudent.id);
            setSelectedStudent(updatedStudent || null);
        }
    };

    const clearAllSelections = () => {
        setSelectedInstallments([]);
        showNotification('success', 'Todas las selecciones han sido limpiadas');
    };

    const clearFilters = () => {
        setActiveFilter('todas');
        setSearch('');
        setSortBy('deudaDesc'); // También resetear el ordenamiento
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50 p-4 md:p-6">
            <Notifications notifications={notifications} remove={(id) =>
                setNotifications(prev => prev.filter(n => n.id !== id))
            } />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-600 via-red-500 to-blue-600 rounded-2xl shadow-2xl p-8 text-white border-2 border-white/20"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                                <FiDollarSign className="w-12 h-12" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold mb-2">Gestión de Cobros</h1>
                                <p className="text-blue-100 text-lg">
                                    Sistema de cobro de cuotas pendientes con precios dinámicos
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                            <div className="text-sm text-blue-100">Deuda total del sistema</div>
                            <div className="text-3xl font-bold">${formatNumber(stats.totalDeuda)}</div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        icon={FiUser}
                        title="Alumnos con deuda"
                        value={stats.totalAlumnos}
                        color="text-blue-700"
                        description={`${studentsWithDebt.length} encontrados`}
                    />
                    <StatsCard
                        icon={FiFileText}
                        title="Cuotas pendientes"
                        value={stats.totalCuotas}
                        color="text-red-700"
                        description={`$${formatNumber(stats.totalDeuda)} total`}
                    />
                    <StatsCard
                        icon={FiAlertCircle}
                        title="Cuotas vencidas"
                        value={stats.totalVencidas}
                        color="text-red-600"
                        description="Necesitan atención inmediata"
                    />
                    <StatsCard
                        icon={FiCalendar}
                        title="Por vencer"
                        value={stats.totalHoy + stats.totalProximaSemana}
                        color="text-orange-600"
                        description={`${stats.totalHoy} hoy, ${stats.totalProximaSemana} próx. semana`}
                    />
                </div>

                {/* Search and Filters */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                        <div className="relative mb-4">
                            <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                            <input
                                type="text"
                                placeholder="Buscar alumno por nombre, DNI o email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-black text-lg shadow-sm hover:shadow-md"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <FilterBar onFilterChange={setActiveFilter} filters={activeFilter} />
                            </div>

                            {/* NUEVO: Selector de Ordenamiento */}
                            <div className="w-full md:w-64">
                                <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-xl p-4 border-2 border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FiChevronDown className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-gray-800 text-lg">Ordenar por</h3>
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-black bg-white font-semibold shadow-sm"
                                    >
                                        <option value="apellido">Apellido (A-Z)</option>
                                        <option value="nombre">Nombre (A-Z)</option>
                                        <option value="deudaDesc">Mayor Deuda</option>
                                        <option value="deudaAsc">Menor Deuda</option>
                                        <option value="cuotasDesc">Más Cuotas</option>
                                        <option value="cuotasAsc">Menos Cuotas</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {(activeFilter !== 'todas' || search || sortBy !== 'deudaDesc') && (
                            <div className="mt-4 flex items-center gap-3">
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-red-600 hover:text-red-800 font-semibold flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <FiX className="w-4 h-4" />
                                    Limpiar todos los filtros
                                </button>
                                <div className="text-sm text-gray-500">
                                    {activeFilter !== 'todas' && `Filtro: ${activeFilter === 'vencidas' ? 'Solo Vencidas' :
                                        activeFilter === 'freeze' ? 'Con Freeze' :
                                            activeFilter === 'hoy' ? 'Vence Hoy' : 'Próxima Semana'}`}
                                    {search && activeFilter !== 'todas' && ' • '}
                                    {search && `Búsqueda: "${search}"`}
                                    {sortBy !== 'deudaDesc' && (search || activeFilter !== 'todas') && ' • '}
                                    {sortBy !== 'deudaDesc' && `Orden: ${getSortLabel(sortBy)}`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                    {!selectedStudent ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Alumnos con deuda ({sortedStudents.length})
                                </h2>
                                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    Ordenado por {getSortLabel(sortBy)}
                                </div>
                            </div>

                            {sortedStudents.map(student => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => setSelectedStudent(student)}
                                    className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-400"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex items-start gap-5">
                                            <div className="bg-gradient-to-r from-blue-100 to-red-100 p-4 rounded-2xl shadow-md">
                                                <FiUser className="w-8 h-8 text-blue-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                                    {student.apellido}, {student.nombre}
                                                </h3>
                                                <div className="text-gray-700 space-y-3">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <FiFileText className="w-4 h-4 text-blue-600" />
                                                        <span className="font-medium">DNI:</span> {student.dni}
                                                    </div>
                                                    {student.email && (
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <FiMail className="w-4 h-4 text-blue-600" />
                                                            <span className="font-medium">Email:</span> {student.email}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                                            <span className="text-red-600 font-bold">
                                                                {student.pendingInstallments.length} cuotas
                                                            </span>
                                                        </div>
                                                        {student.vencidasCount > 0 && (
                                                            <div className="bg-red-100 px-3 py-1.5 rounded-lg shadow-sm">
                                                                <span className="text-red-700 font-bold">
                                                                    {student.vencidasCount} vencidas
                                                                </span>
                                                            </div>
                                                        )}
                                                        {student.hoyCount > 0 && (
                                                            <div className="bg-orange-100 px-3 py-1.5 rounded-lg shadow-sm">
                                                                <span className="text-orange-700 font-bold">
                                                                    {student.hoyCount} hoy
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600 mb-2">Deuda Total</div>
                                            <div className="text-4xl font-bold text-red-700">
                                                ${formatNumber(student.totalPending)}
                                            </div>
                                            <button className="mt-4 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                                                Ver detalle
                                                <FiChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {sortedStudents.length === 0 && (
                                <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
                                    <div className="bg-gradient-to-r from-white to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <FiCheckCircle className="w-12 h-12 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                        {search || activeFilter !== 'todas' ? 'No hay resultados' : '¡Todos los alumnos están al día!'}
                                    </h3>
                                    <p className="text-gray-600 text-lg mb-6">
                                        {search ? 'No se encontraron alumnos con los filtros aplicados' : 'No hay deudas pendientes en el sistema'}
                                    </p>
                                    {(search || activeFilter !== 'todas') && (
                                        <button
                                            onClick={clearFilters}
                                            className="bg-gradient-to-r from-blue-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-red-700 transition-all shadow-md"
                                        >
                                            Limpiar búsqueda
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Student Header */}
                            <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                    <button
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            setSelectedInstallments([]);
                                            setExpandedCourses({});
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-3 text-lg hover:bg-blue-50 px-4 py-3 rounded-xl transition-all shadow-sm"
                                    >
                                        <FiArrowLeft className="w-5 h-5" />
                                        Volver a la lista
                                    </button>

                                    {selectedInstallments.length > 0 && (
                                        <button
                                            onClick={clearAllSelections}
                                            className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-3 text-lg hover:bg-red-50 px-4 py-3 rounded-xl transition-all shadow-sm"
                                        >
                                            <FiTrash2 className="w-5 h-5" />
                                            Limpiar selecciones ({selectedInstallments.length})
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="bg-gradient-to-r from-blue-100 to-red-100 p-4 rounded-2xl shadow-lg">
                                            <FiUser className="w-10 h-10 text-blue-700" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                                {selectedStudent.apellido}, {selectedStudent.nombre}
                                            </h2>
                                            <div className="text-gray-700 space-y-3">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <FiFileText className="w-4 h-4 text-blue-600" />
                                                    <span className="font-medium">DNI:</span> {selectedStudent.dni}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <FiMail className="w-4 h-4 text-blue-600" />
                                                    <span className="font-medium">Email:</span> {selectedStudent.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600 mb-2">Deuda Total</div>
                                        <div className="text-5xl font-bold text-red-700">
                                            ${formatNumber(selectedStudent.totalPending)}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-3 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                            {selectedStudent.pendingInstallments.length} cuotas pendientes
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Courses */}
                            {studentCourses.map(course => (
                                <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-all duration-300">
                                    <div
                                        className="bg-gradient-to-r from-red-500 via-red-400 to-blue-500 text-white p-6 cursor-pointer hover:from-red-600 hover:to-blue-600 transition-all duration-300 flex justify-between items-center"
                                        onClick={() => toggleCourseExpansion(course.id)}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                                <FiFileText className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{course.courseName}</h3>
                                                <div className="text-sm text-red-100 mt-2 flex items-center gap-3">
                                                    <span>{course.installments.length} cuotas pendientes</span>
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                                    <span>Total: ${formatNumber(course.installments.reduce((sum, i) => sum + i.pending, 0))}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedCourses[course.id] ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"
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
                                                <div className="p-6 space-y-4 bg-gradient-to-b from-blue-50 via-white to-red-50">
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

                {/* Cart Floating Button */}
                {selectedInstallments.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 via-blue-500 to-red-600 text-white rounded-2xl shadow-2xl p-6 min-w-96 z-40 border-2 border-white/20 backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <FiShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-blue-100">Total a cobrar</div>
                                    <div className="text-3xl font-bold">${formatNumber(totalCarrito)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-blue-100">Cuotas seleccionadas</div>
                                <div className="text-2xl font-bold">{selectedInstallments.length}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleProcessPayment}
                            className="w-full bg-gradient-to-r from-white to-blue-100 text-blue-700 font-bold py-4 rounded-xl hover:from-blue-50 hover:to-red-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl text-lg transform hover:scale-[1.02]"
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