// src/pages/Cobros.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiChevronDown, FiDollarSign,
    FiCreditCard, FiTrendingUp, FiX, FiArrowLeft,
    FiUser, FiMail, FiFileText, FiCalendar, FiCheck,
    FiMoreVertical, FiTrash2, FiFilter, FiCheckCircle,
    FiAlertCircle, FiInfo, FiShoppingCart,
    FiPercent, FiLock, FiRefreshCw, FiEye, FiEyeOff,
    FiClock, FiBarChart2, FiTag, FiList, FiZap, FiArrowUpRight
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

/* ================== STATS CARD MEJORADA - DISEÑO PROFESIONAL ================== */
function StatsCard({ icon: Icon, title, value, color, description, trend }) {
    const colorClasses = {
        blue: { bg: 'from-blue-50/80 to-blue-100/50', text: 'text-blue-700', border: 'border-blue-200' },
        red: { bg: 'from-red-50/80 to-rose-100/50', text: 'text-red-700', border: 'border-red-200' },
        green: { bg: 'from-emerald-50/80 to-green-100/50', text: 'text-emerald-700', border: 'border-emerald-200' },
        purple: { bg: 'from-violet-50/80 to-purple-100/50', text: 'text-violet-700', border: 'border-violet-200' },
        orange: { bg: 'from-amber-50/80 to-orange-100/50', text: 'text-amber-700', border: 'border-amber-200' }
    };

    const colorKey = color.includes('red') ? 'red' :
        color.includes('blue') ? 'blue' :
            color.includes('green') ? 'green' :
                color.includes('purple') ? 'purple' : 'orange';

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative bg-gradient-to-br ${colorClasses[colorKey].bg} rounded-2xl p-5 border ${colorClasses[colorKey].border} shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm overflow-hidden group`}
        >
            {/* Efecto de fondo sutil */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${colorClasses[colorKey].text} opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon className="w-full h-full" />
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl bg-white/70 shadow-sm border ${colorClasses[colorKey].border}`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 tracking-wide">{title}</span>
                    </div>
                    <p className={`text-2xl md:text-3xl font-bold ${color} mb-2 tracking-tight`}>{value}</p>
                    {description && (
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-600">{description}</p>
                            {trend !== undefined && (
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${
                                    trend > 0 ? 'bg-emerald-100 text-emerald-800' : trend < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {trend > 0 ? '+' : ''}{trend}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

/* ================== NOTIFICACIONES MEJORADAS - DISEÑO PROFESIONAL ================== */
function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-6 right-6 flex flex-col space-y-3 z-50 max-w-xs w-full sm:max-w-sm">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className={`px-5 py-4 rounded-xl shadow-xl cursor-pointer border-l-4 backdrop-blur-md border-opacity-90 ${
                            n.type === 'success'
                                ? 'bg-gradient-to-r from-emerald-50/95 to-green-50/95 text-emerald-900 border-emerald-500'
                                : n.type === 'error'
                                    ? 'bg-gradient-to-r from-rose-50/95 to-red-50/95 text-rose-900 border-rose-500'
                                    : 'bg-gradient-to-r from-blue-50/95 to-cyan-50/95 text-blue-900 border-blue-500'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                                n.type === 'success' ? 'bg-emerald-100' :
                                    n.type === 'error' ? 'bg-rose-100' :
                                        'bg-blue-100'
                            }`}>
                                {n.type === 'success' ? <FiCheckCircle className="w-5 h-5" /> :
                                    n.type === 'error' ? <FiAlertCircle className="w-5 h-5" /> :
                                        <FiInfo className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-semibold">{n.message}</span>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white/50 rounded">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ================== FILTROS MEJORADOS Y COMPACTOS - DISEÑO PROFESIONAL ================== */
function FilterBar({ onFilterChange, filters }) {
    const filterOptions = [
        { id: 'todas', label: 'Todas', icon: FiList, color: 'bg-gray-100 text-gray-700 border-gray-300', activeColor: 'bg-gray-800 text-white' },
        { id: 'vencidas', label: 'Vencidas', icon: FiAlertCircle, color: 'bg-rose-100 text-rose-700 border-rose-300', activeColor: 'bg-rose-600 text-white' },
        { id: 'freeze', label: 'Freeze', icon: FiClock, color: 'bg-blue-100 text-blue-700 border-blue-300', activeColor: 'bg-blue-600 text-white' },
        { id: 'hoy', label: 'Hoy', icon: FiCalendar, color: 'bg-amber-100 text-amber-700 border-amber-300', activeColor: 'bg-amber-600 text-white' },
        { id: 'proximaSemana', label: 'Próx. semana', icon: FiCalendar, color: 'bg-violet-100 text-violet-700 border-violet-300', activeColor: 'bg-violet-600 text-white' }
    ];

    const handleFilterChange = (filterId) => {
        if (filterId === filters) {
            onFilterChange('todas');
        } else {
            onFilterChange(filterId);
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                    <FiFilter className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm text-gray-800">Filtrar por estado</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = filters === option.id;
                    return (
                        <motion.button
                            key={option.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleFilterChange(option.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? `${option.activeColor} border-transparent shadow-md`
                                    : `${option.color} hover:shadow-sm hover:-translate-y-0.5`
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {option.label}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

/* ================== MODAL DE DEPÓSITO INDIVIDUAL - DISEÑO PROFESIONAL ================== */
function DepositModal({ isOpen, onClose, installment, inscriptionId, onSuccess }) {
    const { depositarCuota, inscriptions, courses, refreshData } = useDB();
    const [formData, setFormData] = useState({
        monto: '',
        formaPago: 'Efectivo',
        observaciones: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const inscription = inscriptions.find(ins => ins.id === inscriptionId);
    const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;
    const cuotaActual = inscription?.installments?.find(i => i.number === installment.number);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const isOverdue = !cuotaActual?.frozen && today > dueDate;

    const precioActual = useMemo(() => {
        if (!cuotaActual) return 0;
        return calcularPrecioPorMetodo(inscription, course, cuotaActual, formData.formaPago, isOverdue);
    }, [formData.formaPago, inscription, course, cuotaActual, isOverdue]);

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

            // ACTUALIZACIÓN EN TIEMPO REAL
            await refreshData();

            onSuccess(`Depósito de $${formatNumber(montoAPagar)} registrado`);
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
                className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-auto border border-gray-200/50"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                                    <FiDollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Depositar Cuota #{installment.number}</h2>
                                    <p className="text-blue-100 text-sm mt-1.5 flex items-center gap-2">
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
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Estado de la Cuota */}
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 p-5 rounded-xl border border-gray-200/70">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-3 text-base">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <FiFileText className="w-4 h-4 text-blue-600" />
                                </div>
                                Estado de la Cuota
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-gray-600 text-xs mb-1.5 font-medium">Precio {formData.formaPago}:</div>
                                    <div className="font-bold text-blue-700 text-lg">${formatNumber(precioActual)}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-gray-600 text-xs mb-1.5 font-medium">Ya Pagado:</div>
                                    <div className="font-bold text-emerald-600 text-lg">${formatNumber(cuotaActual?.amountPaid || 0)}</div>
                                </div>
                                <div className="col-span-2 bg-gradient-to-r from-rose-50 to-pink-50 p-5 rounded-xl border border-rose-200 shadow-sm">
                                    <div className="text-gray-700 text-xs mb-1.5 font-semibold">Monto Pendiente:</div>
                                    <div className="font-bold text-rose-600 text-2xl">${formatNumber(montoPendiente)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Forma de Pago */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <FiCreditCard className="w-4 h-4 text-blue-600" />
                                </div>
                                Forma de Pago
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(metodo => (
                                    <motion.button
                                        key={metodo}
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setFormData(prev => ({ ...prev, formaPago: metodo }))}
                                        className={`py-3.5 rounded-xl border text-sm font-semibold transition-all ${
                                            formData.formaPago === metodo
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                    >
                                        {metodo}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Monto a Depositar */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <FiDollarSign className="w-4 h-4 text-blue-600" />
                                </div>
                                Monto a Depositar
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold">$</span>
                                <input
                                    type="number"
                                    name="monto"
                                    value={formData.monto}
                                    onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 font-bold text-base transition-all"
                                    required
                                />
                            </div>
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setFormData(prev => ({ ...prev, monto: montoPendiente.toFixed(2) }))}
                                className="mt-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 px-4 py-2.5 rounded-lg font-semibold transition-all border border-blue-200"
                            >
                                Pagar total: ${formatNumber(montoPendiente)}
                            </motion.button>
                        </div>

                        {/* Observaciones */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                Observaciones (opcional)
                            </label>
                            <textarea
                                value={formData.observaciones}
                                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                placeholder="Ej: Pago parcial, acuerdo de pago, etc."
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 text-sm resize-none transition-all"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4 pt-4">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="flex-1 px-5 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm"
                            >
                                Cancelar
                            </motion.button>
                            <motion.button
                                type="submit"
                                whileTap={{ scale: 0.95 }}
                                disabled={isProcessing || !formData.monto || Number(formData.monto) <= 0}
                                className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-3 text-sm shadow-lg hover:shadow-xl"
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
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ================== MODAL DE PAGO MÚLTIPLE - DISEÑO PROFESIONAL ================== */
function PaymentModal({ isOpen, onClose, selectedInstallments, showNotification, onSuccess }) {
    const { registrarPago, inscriptions, courses, refreshData } = useDB();
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [isProcessing, setIsProcessing] = useState(false);

    const cuotasConPrecio = useMemo(() => {
        return selectedInstallments.map(item => {
            const inscription = inscriptions.find(ins => ins.id === item.inscriptionId);
            const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;
            const cuotaFresca = inscription?.installments?.find(i => i.number === item.number);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(item.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = !cuotaFresca?.frozen && today > dueDate;

            const precio = calcularPrecioPorMetodo(inscription, course, cuotaFresca || item, paymentMethod, isOverdue);
            const amountPaidFresco = Number(cuotaFresca?.amountPaid || 0);
            const pending = Math.max(precio - amountPaidFresco, 0);

            return {
                ...item,
                precio,
                pending,
                amountPaid: amountPaidFresco,
                isOverdue,
                courseName: course?.nombre || 'Curso desconocido',
                yaEstaPagada: cuotaFresca?.status === 'Pagada' || cuotaFresca?.status === 'Pagado' || pending <= 0
            };
        }).filter(c => !c.yaEstaPagada && c.pending > 0);
    }, [selectedInstallments, paymentMethod, inscriptions, courses]);

    const totalAmount = useMemo(() => {
        return cuotasConPrecio.reduce((sum, c) => sum + c.pending, 0);
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

            for (const cuota of cuotasConPrecio) {
                try {
                    const inscripcionActual = inscriptions.find(ins => ins.id === cuota.inscriptionId);
                    const cuotaActual = inscripcionActual?.installments?.find(i => i.number === cuota.number);

                    if (cuotaActual?.status === 'Pagada' || cuotaActual?.status === 'Pagado') {
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
                        continue;
                    }

                    await registrarPago(
                        cuota.inscriptionId,
                        cuota.number,
                        pendienteActual,
                        paymentMethod,
                        `Pago completo de cuota #${cuota.number}`
                    );
                    successCount++;
                } catch (error) {
                    console.error('Error procesando pago:', error);
                    errorCount++;
                }
            }

            // ACTUALIZACIÓN EN TIEMPO REAL
            await refreshData();

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
                className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto border border-gray-200/50"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                                    <FiCreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Procesar Pago Múltiple</h2>
                                    <p className="text-emerald-100 text-sm mt-1.5">
                                        {cuotasConPrecio.length} cuota{cuotasConPrecio.length !== 1 ? 's' : ''} pendiente{cuotasConPrecio.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all hover:scale-110"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {cuotasConPrecio.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <FiCheck className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">¡Todas las cuotas ya están pagadas!</h3>
                                <p className="text-gray-500 text-sm max-w-md mx-auto">No hay cuotas pendientes para procesar en el carrito seleccionado.</p>
                            </div>
                        ) : (
                            <>
                                {/* Detalle de Cuotas */}
                                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 rounded-xl border border-gray-200/70">
                                    <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-3 text-base">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                            <FiFileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        Detalle de Cuotas
                                    </h3>
                                    <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                                        {cuotasConPrecio.map((cuota, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="font-bold text-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs border border-blue-200">
                                                                Cuota #{cuota.number}
                                                            </span>
                                                            {cuota.isOverdue && (
                                                                <span className="bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                                    ⚠️ Vencida
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-900 font-bold text-sm mb-2">{cuota.courseName}</div>
                                                        <div className="text-xs text-gray-600 flex items-center gap-2 mb-3">
                                                            <div className="p-1 bg-gray-100 rounded">
                                                                <FiCalendar className="w-3 h-3" />
                                                            </div>
                                                            Vencimiento: {formatDate(cuota.dueDate)}
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                                                                Precio: ${formatNumber(cuota.precio)}
                                                            </div>
                                                            {cuota.amountPaid > 0 && (
                                                                <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                                                                    Pagado: ${formatNumber(cuota.amountPaid)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-xl text-emerald-700 mb-1">
                                                            ${formatNumber(cuota.pending)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium">pendiente</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Método de Pago */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                            <FiCreditCard className="w-4 h-4 text-blue-600" />
                                        </div>
                                        Método de Pago
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                            <motion.button
                                                key={method}
                                                type="button"
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`py-4 rounded-xl border text-sm font-bold transition-all ${
                                                    paymentMethod === method
                                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                                                }`}
                                            >
                                                {method}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-5 rounded-2xl border border-emerald-200 shadow-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="text-gray-900 font-bold text-lg flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl">
                                                <FiDollarSign className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            TOTAL A COBRAR:
                                        </div>
                                        <div className="text-gray-900 font-bold text-3xl">
                                            ${formatNumber(totalAmount)}
                                        </div>
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="flex gap-4 pt-2">
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        className="flex-1 px-5 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm"
                                    >
                                        Cancelar
                                    </motion.button>
                                    <motion.button
                                        onClick={handleConfirm}
                                        whileTap={{ scale: 0.95 }}
                                        disabled={isProcessing || cuotasConPrecio.length === 0}
                                        className="flex-1 px-5 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-3 text-sm shadow-lg hover:shadow-xl"
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
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ================== CARD DE CUOTA - DISEÑO PROFESIONAL MEJORADO ================== */
function InstallmentCard({ installment, inscriptionId, isSelected, onToggleSelection, showNotification, onActionCompleted }) {
    const { freezarCuota, inscriptions, courses, refreshData } = useDB();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const inscription = inscriptions.find(ins => ins.id === inscriptionId);
    const course = inscription ? courses.find(c => c.id === inscription.courseId) : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const isOverdue = !installment.frozen && today > dueDate;
    const isToday = !installment.frozen && today.getTime() === dueDate.getTime();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    const isFullyPaid = installment.status === 'Pagada' || installment.status === 'Pagado' || installment.status === 'pagada' || installment.status === 'pagado';
    const defaultMethod = inscription?.paymentType || 'Transferencia';
    const defaultPrice = calcularPrecioPorMetodo(inscription, course, installment, defaultMethod, isOverdue);
    const amountPaid = Number(installment.amountPaid || 0);
    const pending = Math.max(defaultPrice - amountPaid, 0);
    const hasPartialPayment = amountPaid > 0 && amountPaid < defaultPrice;
    const paidPercentage = defaultPrice > 0 ? Math.round((amountPaid / defaultPrice) * 100) : 0;

    // ACTUALIZACIÓN EN TIEMPO REAL: Usamos useCallback para optimizar
    const handleFreeze = useCallback(async () => {
        try {
            setIsLoading(true);
            const newStatus = !installment.frozen;
            await freezarCuota(inscriptionId, installment.number, newStatus);

            // ACTUALIZACIÓN INMEDIATA
            await refreshData();

            showNotification('success', `Cuota ${newStatus ? 'freeze aplicado' : 'freeze removido'}`);
            setShowActions(false);
            if (onActionCompleted) onActionCompleted();
        } catch (error) {
            showNotification('error', error.message || 'Error al cambiar estado de freeze');
        } finally {
            setIsLoading(false);
        }
    }, [installment.frozen, installment.number, inscriptionId, freezarCuota, refreshData, showNotification, onActionCompleted]);

    const handlePartialPaymentAction = () => {
        setShowDepositModal(true);
        setShowActions(false);
    };

    const handleDiscount = () => {
        showNotification('info', 'Función de descuento en desarrollo');
        setShowActions(false);
    };

    const handleCardClick = (e) => {
        if (e.target.closest('button') || e.target.closest('.actions-container') || e.target.closest('.action-menu')) {
            return;
        }
        if (!isFullyPaid) {
            onToggleSelection();
        }
    };

    // Estilos mejorados para estado
    let statusConfig = {};
    if (isFullyPaid) {
        statusConfig = {
            color: 'text-emerald-700',
            bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
            border: 'border-emerald-200',
            text: 'Pagada'
        };
    } else if (hasPartialPayment) {
        statusConfig = {
            color: 'text-blue-700',
            bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
            border: 'border-blue-200',
            text: `${paidPercentage}% Pagado`
        };
    } else if (installment.frozen) {
        statusConfig = {
            color: 'text-indigo-700',
            bg: 'bg-gradient-to-r from-indigo-50 to-violet-50',
            border: 'border-indigo-200',
            text: 'Freeze'
        };
    } else if (isOverdue) {
        statusConfig = {
            color: 'text-rose-700',
            bg: 'bg-gradient-to-r from-rose-50 to-pink-50',
            border: 'border-rose-200',
            text: `Vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
        };
    } else if (isToday) {
        statusConfig = {
            color: 'text-amber-700',
            bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
            border: 'border-amber-200',
            text: 'Vence hoy'
        };
    } else if (daysUntilDue <= 3) {
        statusConfig = {
            color: 'text-orange-700',
            bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
            border: 'border-orange-200',
            text: `Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`
        };
    } else if (daysUntilDue <= 7) {
        statusConfig = {
            color: 'text-yellow-700',
            bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
            border: 'border-yellow-200',
            text: `Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`
        };
    } else {
        statusConfig = {
            color: 'text-emerald-700',
            bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
            border: 'border-emerald-200',
            text: `Vence en ${daysUntilDue} días`
        };
    }

    return (
        <>
            <motion.div
                whileHover={!isFullyPaid ? { scale: 1.005, y: -2 } : {}}
                onClick={handleCardClick}
                className={`relative rounded-2xl p-5 border-2 transition-all duration-300 overflow-visible group ${
                    isFullyPaid
                        ? 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200 cursor-default'
                        : isSelected
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-400 shadow-xl ring-2 ring-blue-200 cursor-pointer'
                            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-blue-300 hover:shadow-lg cursor-pointer'
                }`}
            >
                {/* Efecto de selección sutil */}
                {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none"></div>
                )}

                <div className="flex items-start gap-4 relative z-10">
                    {/* Checkbox de selección - Mejorado */}
                    {!isFullyPaid && (
                        <div className="flex items-start pt-1">
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSelection();
                                }}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent shadow-md'
                                        : 'border-gray-300 bg-white hover:border-blue-400'
                                }`}
                            >
                                {isSelected && (
                                    <FiCheck className="w-3.5 h-3.5 text-white" />
                                )}
                            </motion.div>
                        </div>
                    )}

                    <div className="flex-1">
                        {/* Encabezado */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h4 className={`font-bold text-base ${
                                        isFullyPaid ? 'text-gray-600' : 'text-gray-900'
                                    }`}>
                                        Cuota #{installment.number}
                                    </h4>
                                    <span className={`px-3 py-1.5 ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} rounded-xl text-xs font-bold border`}>
                                        {statusConfig.text}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-4 text-sm ${
                                    isFullyPaid ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-gray-100 rounded-lg">
                                            <FiCalendar className="w-3.5 h-3.5" />
                                        </div>
                                        {formatDate(installment.dueDate)}
                                    </div>
                                    <div className="w-px h-4 bg-gray-300"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-gray-100 rounded-lg">
                                            <FiCreditCard className="w-3.5 h-3.5" />
                                        </div>
                                        {defaultMethod}
                                    </div>
                                </div>
                            </div>

                            {/* Monto pendiente */}
                            <div className="text-right">
                                <div className={`text-xs font-semibold ${
                                    isFullyPaid ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                    {isFullyPaid ? 'Pagada' : 'Pendiente'}
                                </div>
                                <div className={`font-bold text-xl ${
                                    isFullyPaid ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {isFullyPaid ? (
                                        <>
                                            <FiCheckCircle className="inline mr-2 w-5 h-5 text-emerald-500" />
                                            ${formatNumber(defaultPrice)}
                                        </>
                                    ) : (
                                        `$${formatNumber(pending)}`
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Barra de progreso mejorada */}
                        {!isFullyPaid && defaultPrice > 0 && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                                    <span>Progreso del pago</span>
                                    <span className="font-bold">
                                        {paidPercentage}%
                                    </span>
                                </div>
                                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(paidPercentage, 100)}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-emerald-400 rounded-full shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Detalles de pago */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className={`p-4 rounded-xl border ${
                                isFullyPaid ? 'bg-gray-100/50 border-gray-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50/50 border-blue-100'
                            }`}>
                                <div className={`text-xs font-semibold ${
                                    isFullyPaid ? 'text-gray-600' : 'text-gray-700'
                                }`}>Precio Total</div>
                                <div className={`font-bold text-base ${
                                    isFullyPaid ? 'text-gray-700' : 'text-gray-900'
                                }`}>${formatNumber(defaultPrice)}</div>
                            </div>
                            <div className={`p-4 rounded-xl border ${
                                isFullyPaid ? 'bg-gray-100/50 border-gray-200' : 'bg-gradient-to-r from-emerald-50 to-green-50/50 border-emerald-100'
                            }`}>
                                <div className={`text-xs font-semibold ${
                                    isFullyPaid ? 'text-gray-600' : 'text-gray-700'
                                }`}>Pagado</div>
                                <div className={`font-bold text-base ${
                                    isFullyPaid ? 'text-gray-700' : 'text-emerald-600'
                                }`}>${formatNumber(amountPaid)}</div>
                            </div>
                        </div>

                        {/* Botones de acción - DISEÑO HORIZONTAL CON ANIMACIÓN */}
                        {!isFullyPaid && (
                            <div className="flex flex-col gap-3">
                                {/* Botón Acciones */}
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowActions(!showActions);
                                    }}
                                    disabled={isLoading}
                                    className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                                        showActions
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <FiMoreVertical className="w-4 h-4" />
                                            Acciones
                                        </>
                                    )}
                                </motion.button>

                                {/* Botones de acción horizontales con animación */}
                                <AnimatePresence>
                                    {showActions && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex gap-3 pt-1">
                                                {/* Descontar */}
                                                <motion.button
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.3, delay: 0 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDiscount();
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg border border-amber-200"
                                                >
                                                    <FiPercent className="w-4 h-4" />
                                                    Descontar
                                                </motion.button>

                                                {/* Aplicar Freeze */}
                                                <motion.button
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.3, delay: 0.1 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFreeze();
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-800 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg border border-blue-200"
                                                >
                                                    <FiLock className="w-4 h-4" />
                                                    {installment.frozen ? 'Quitar' : 'Aplicar'} Freeze
                                                </motion.button>

                                                {/* Pago Parcial */}
                                                <motion.button
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.3, delay: 0.2 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePartialPaymentAction();
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-100 to-green-100 hover:from-emerald-200 hover:to-green-200 text-emerald-800 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg border border-emerald-200"
                                                >
                                                    <FiDollarSign className="w-4 h-4" />
                                                    Pago Parcial
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Indicador de cuota pagada */}
                        {isFullyPaid && (
                            <div className="flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                                <span className="text-emerald-700 text-sm font-bold">Cuota pagada completamente</span>
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
                    if (onActionCompleted) onActionCompleted();
                }}
            />
        </>
    );
}

/* ================== PÁGINA PRINCIPAL - DISEÑO PROFESIONAL ================== */
export default function Cobros() {
    const { students = [], courses = [], inscriptions = [], refreshData: refreshDB } = useDB();
    const [search, setSearch] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedInstallments, setSelectedInstallments] = useState([]);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState('todas');
    const [sortBy, setSortBy] = useState('deudaDesc');
    const [showStudentCards, setShowStudentCards] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewMode, setViewMode] = useState('cards');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

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

    // ACTUALIZACIÓN EN TIEMPO REAL: Función mejorada para refrescar datos
    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refreshDB();
            setRefreshKey(prev => prev + 1);
            showNotification('success', 'Datos actualizados en tiempo real');
        } catch (error) {
            showNotification('error', 'Error al actualizar datos');
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshDB]);

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
    }, [students, inscriptions, courses, refreshKey]);

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
                        if (inst.status === 'Pagada' || inst.status === 'Pagado') {
                            pendingInstallments.push({
                                ...inst,
                                courseName: course?.nombre || 'Sin curso',
                                inscriptionId: inscription.id,
                                pending: 0,
                                isOverdue: false,
                                isToday: false,
                                isNextWeek: false,
                                dueDate: inst.dueDate,
                                frozen: inst.frozen,
                                fullyPaid: true
                            });
                            return;
                        }

                        const dueDate = new Date(inst.dueDate);
                        dueDate.setHours(0, 0, 0, 0);
                        const isOverdue = !inst.frozen && today > dueDate;
                        const isToday = !inst.frozen && today.getTime() === dueDate.getTime();
                        const isNextWeek = !inst.frozen && dueDate <= nextWeek && dueDate >= today;

                        if (activeFilter === 'vencidas' && !isOverdue) return;
                        if (activeFilter === 'freeze' && !inst.frozen) return;
                        if (activeFilter === 'hoy' && !isToday) return;
                        if (activeFilter === 'proximaSemana' && !isNextWeek) return;

                        const defaultMethod = inscription.paymentType || 'Transferencia';
                        const price = calcularPrecioPorMetodo(inscription, course, inst, defaultMethod, isOverdue);
                        const pending = Math.max(price - Number(inst.amountPaid || 0), 0);

                        pendingInstallments.push({
                            ...inst,
                            courseName: course?.nombre || 'Sin curso',
                            inscriptionId: inscription.id,
                            pending,
                            isOverdue,
                            isToday,
                            isNextWeek,
                            dueDate: inst.dueDate,
                            frozen: inst.frozen,
                            fullyPaid: false
                        });
                    });
                });

                if (activeFilter !== 'todas') {
                    pendingInstallments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                }

                return {
                    ...student,
                    pendingInstallments,
                    totalPending: pendingInstallments.filter(i => !i.fullyPaid).reduce((sum, i) => sum + i.pending, 0),
                    vencidasCount: pendingInstallments.filter(i => i.isOverdue && !i.fullyPaid).length,
                    hoyCount: pendingInstallments.filter(i => i.isToday && !i.fullyPaid).length,
                    proximaSemanaCount: pendingInstallments.filter(i => i.isNextWeek && !i.fullyPaid).length,
                    totalCuotas: pendingInstallments.length,
                    cuotasPagadas: pendingInstallments.filter(i => i.fullyPaid).length
                };
            })
            .filter(s => s.pendingInstallments.length > 0);
    }, [students, inscriptions, courses, activeFilter, refreshKey]);

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
                sorted.sort((a, b) => b.totalCuotas - a.totalCuotas);
                break;
            case 'cuotasAsc':
                sorted.sort((a, b) => a.totalCuotas - b.totalCuotas);
                break;
            default:
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

    const totalCarrito = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return selectedInstallments.reduce((sum, item) => {
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
    }, [selectedInstallments, inscriptions, courses, refreshKey]);

    const toggleInstallmentSelection = (courseId, installmentNumber, installment) => {
        if (installment.fullyPaid) return;

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

    const handlePaymentSuccess = async () => {
        setSelectedInstallments([]);
        setExpandedCourses({});

        // ACTUALIZACIÓN EN TIEMPO REAL: Forzar actualización inmediata
        await refreshData();

        if (selectedStudent) {
            const updatedStudent = studentsWithDebt.find(s => s.id === selectedStudent.id);
            setSelectedStudent(updatedStudent || null);
        }
        showNotification('success', 'Pago procesado exitosamente');
    };

    const handleActionCompleted = async () => {
        // ACTUALIZACIÓN EN TIEMPO REAL: Actualizar inmediatamente después de cualquier acción
        await refreshData();
    };

    const clearAllSelections = () => {
        setSelectedInstallments([]);
        showNotification('success', 'Selecciones limpiadas');
    };

    const clearFilters = () => {
        setActiveFilter('todas');
        setSearch('');
        setSortBy('deudaDesc');
        setShowStudentCards(false);
        refreshData();
    };

    const handleSearchOrFilter = () => {
        if (search || activeFilter !== 'todas') {
            setShowStudentCards(true);
        }
    };

    // ACTUALIZACIÓN EN TIEMPO REAL: Efecto para sincronizar datos automáticamente
    useEffect(() => {
        if (search || activeFilter !== 'todas') {
            setShowStudentCards(true);
        }
    }, [search, activeFilter]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-4 md:p-5 lg:p-6">
            <Notifications notifications={notifications} remove={(id) =>
                setNotifications(prev => prev.filter(n => n.id !== id))
            } />

            <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-7 text-white overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative">
                        {/* Efecto de fondo */}
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

                        <div className="flex items-center gap-4 md:gap-5 relative z-10">
                            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 md:p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                <FiDollarSign className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 tracking-tight">Gestión de Cobros</h1>
                                <p className="text-gray-300 text-sm md:text-base">
                                    Sistema de cobro de cuotas pendientes • Actualizado en tiempo real
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm p-3 md:p-4 rounded-2xl border border-white/10">
                                <div className="text-xs md:text-sm text-gray-300 font-medium">Deuda total</div>
                                <div className="text-xl md:text-2xl font-bold">${formatNumber(stats.totalDeuda)}</div>
                            </div>
                            <motion.button
                                onClick={refreshData}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 p-3 rounded-xl transition-all border border-white/10 backdrop-blur-sm"
                                title="Refrescar datos en tiempo real"
                            >
                                {isRefreshing ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <FiRefreshCw className="w-5 h-5" />
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatsCard
                        icon={FiUser}
                        title="Alumnos con deuda"
                        value={stats.totalAlumnos}
                        color="text-blue-700"
                        description={`${studentsWithDebt.length} encontrados`}
                        trend={2}
                    />
                    <StatsCard
                        icon={FiFileText}
                        title="Cuotas pendientes"
                        value={stats.totalCuotas}
                        color="text-rose-700"
                        description={`$${formatNumber(stats.totalDeuda)} total`}
                        trend={-1}
                    />
                    <StatsCard
                        icon={FiAlertCircle}
                        title="Vencidas"
                        value={stats.totalVencidas}
                        color="text-rose-600"
                        description="Necesitan atención urgente"
                        trend={5}
                    />
                    <StatsCard
                        icon={FiCalendar}
                        title="Por vencer"
                        value={stats.totalHoy + stats.totalProximaSemana}
                        color="text-amber-700"
                        description={`${stats.totalHoy} hoy`}
                        trend={0}
                    />
                </div>

                {/* Search and Filters */}
                <div className="space-y-4 md:space-y-5">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 md:p-5 shadow-lg border border-gray-200/80">
                        <div className="relative mb-4 md:mb-5">
                            <FiSearch className="absolute left-4 md:left-5 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 md:w-6 md:h-6" />
                            <input
                                type="text"
                                placeholder="Buscar alumno por nombre, DNI o email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleSearchOrFilter();
                                }}
                                className="w-full pl-12 md:pl-14 pr-4 py-3.5 md:py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:outline-none transition-all text-gray-900 text-base placeholder-gray-500 font-medium"
                            />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
                            <div className="flex-1">
                                <FilterBar onFilterChange={(filter) => {
                                    setActiveFilter(filter);
                                    handleSearchOrFilter();
                                }} filters={activeFilter} />
                            </div>

                            {/* View Mode and Sort */}
                            <div className="flex flex-col md:flex-row gap-3">
                                {/* View Mode Toggle */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200/80">
                                    <div className="flex items-center gap-1">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setViewMode('cards')}
                                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                                viewMode === 'cards'
                                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <FiEye className="w-4 h-4" />
                                            Tarjetas
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setViewMode('list')}
                                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                                viewMode === 'list'
                                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <FiList className="w-4 h-4" />
                                            Lista
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200/80">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FiChevronDown className="w-4 h-4 text-gray-600" />
                                        <h3 className="font-semibold text-xs text-gray-800">Ordenar por</h3>
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all text-gray-900 text-sm font-semibold bg-white"
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
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={clearFilters}
                                    className="text-sm text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-2 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-rose-200"
                                >
                                    <FiX className="w-4 h-4" />
                                    Limpiar filtros
                                </motion.button>
                                <div className="text-sm text-gray-600 font-medium">
                                    {activeFilter !== 'todas' && `Filtro: ${activeFilter}`}
                                    {search && activeFilter !== 'todas' && ' • '}
                                    {search && `"${search}"`}
                                    {sortBy !== 'deudaDesc' && ` • Orden: ${getSortLabel(sortBy)}`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                {showStudentCards && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4 md:p-5">
                        {!selectedStudent ? (
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg md:text-xl font-bold text-gray-900">
                                            Alumnos ({sortedStudents.length})
                                        </h2>
                                        <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                            {getSortLabel(sortBy)}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-lg font-medium">
                                        Actualizado en tiempo real
                                    </div>
                                </div>

                                {viewMode === 'cards' ? (
                                    /* Cards View */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                        {sortedStudents.map(student => (
                                            <motion.div
                                                key={student.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileHover={{ scale: 1.02, y: -3 }}
                                                onClick={() => setSelectedStudent(student)}
                                                className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-5 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-gray-200/70 hover:border-blue-400/50 group overflow-hidden"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-xl">
                                                        <FiUser className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">
                                                            {student.apellido}, {student.nombre}
                                                        </h3>
                                                        <div className="text-gray-700 space-y-2 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1 bg-gray-100 rounded-lg">
                                                                    <FiFileText className="w-3.5 h-3.5 text-gray-600" />
                                                                </div>
                                                                <span className="font-medium">DNI: {student.dni}</span>
                                                            </div>
                                                            {student.email && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1 bg-gray-100 rounded-lg">
                                                                        <FiMail className="w-3.5 h-3.5 text-gray-600" />
                                                                    </div>
                                                                    <span className="truncate font-medium">{student.email}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mt-4">
                                                            <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-1.5 rounded-lg border border-rose-200">
                                                                <span className="text-rose-700 text-xs font-bold">{student.totalCuotas} cuotas</span>
                                                            </div>
                                                            {student.cuotasPagadas > 0 && (
                                                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                                                    <span className="text-emerald-700 text-xs font-bold">{student.cuotasPagadas} pagadas</span>
                                                                </div>
                                                            )}
                                                            {student.vencidasCount > 0 && (
                                                                <div className="bg-gradient-to-r from-rose-100 to-red-100 px-3 py-1.5 rounded-lg border border-rose-300">
                                                                    <span className="text-rose-800 text-xs font-bold">{student.vencidasCount} vencidas</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-5 pt-4 border-t border-gray-200/70">
                                                    <div className="flex justify-between items-center">
                                                        <div className="text-sm text-gray-600 font-medium">Deuda pendiente</div>
                                                        <div className="font-bold text-rose-600 text-xl">
                                                            ${formatNumber(student.totalPending)}
                                                        </div>
                                                    </div>
                                                    <button className="w-full mt-3 text-blue-600 hover:text-blue-800 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 py-2.5 rounded-xl transition-colors text-sm border-2 border-blue-200 hover:border-blue-300 group">
                                                        Ver cuotas detalladas
                                                        <FiArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    /* List View */
                                    <div className="overflow-x-auto rounded-xl border border-gray-200/70">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                            <tr>
                                                <th className="px-4 py-3.5 text-left font-bold text-gray-800 text-sm">Alumno</th>
                                                <th className="px-4 py-3.5 text-left font-bold text-gray-800 text-sm">DNI</th>
                                                <th className="px-4 py-3.5 text-left font-bold text-gray-800 text-sm">Cuotas</th>
                                                <th className="px-4 py-3.5 text-left font-bold text-gray-800 text-sm">Vencidas</th>
                                                <th className="px-4 py-3.5 text-left font-bold text-gray-800 text-sm">Deuda</th>
                                                <th className="px-4 py-3.5 text-left font-bold text-gray-800 text-sm"></th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {sortedStudents.map(student => (
                                                <tr key={student.id}
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="border-b border-gray-200/50 hover:bg-gradient-to-r from-blue-50/30 to-indigo-50/20 cursor-pointer transition-all duration-200 group">
                                                    <td className="px-4 py-4">
                                                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                            {student.apellido}, {student.nombre}
                                                        </div>
                                                        <div className="text-xs text-gray-600 truncate max-w-[200px] font-medium">
                                                            {student.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 font-medium">{student.dni}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-rose-700 font-bold">{student.totalCuotas}</span>
                                                            {student.cuotasPagadas > 0 && (
                                                                <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded">({student.cuotasPagadas} pagadas)</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {student.vencidasCount > 0 ? (
                                                            <span className="bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200">
                                                                    {student.vencidasCount}
                                                                </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 font-bold text-rose-600 text-lg">
                                                        ${formatNumber(student.totalPending)}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button className="text-blue-600 hover:text-blue-800 p-1.5 group">
                                                            <FiChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {sortedStudents.length === 0 && (
                                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl p-8 md:p-10 text-center border-2 border-dashed border-gray-300/70">
                                        <div className="bg-gradient-to-r from-white to-gray-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                                            <FiCheckCircle className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">
                                            {search || activeFilter !== 'todas' ? 'No hay resultados' : '¡Todos los alumnos al día!'}
                                        </h3>
                                        <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                                            {search ? 'No se encontraron alumnos con los criterios de búsqueda' : 'No hay deudas pendientes en el sistema'}
                                        </p>
                                        {(search || activeFilter !== 'todas') && (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={clearFilters}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                                            >
                                                Limpiar búsqueda y filtros
                                            </motion.button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5 md:space-y-6">
                                {/* Student Header */}
                                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-2xl p-5 border-2 border-blue-200/70 shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setSelectedStudent(null);
                                                    setSelectedInstallments([]);
                                                    setExpandedCourses({});
                                                }}
                                                className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-3 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all text-sm border-2 border-blue-200 hover:border-blue-300"
                                            >
                                                <FiArrowLeft className="w-4 h-4" />
                                                Volver a la lista
                                            </motion.button>

                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={refreshData}
                                                className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-3 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all text-sm border-2 border-blue-200 hover:border-blue-300"
                                                title="Actualizar datos en tiempo real"
                                            >
                                                <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                                Actualizar ahora
                                            </motion.button>
                                        </div>

                                        {selectedInstallments.length > 0 && (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={clearAllSelections}
                                                className="text-rose-700 hover:text-rose-900 font-bold flex items-center gap-3 hover:bg-rose-100 px-4 py-2.5 rounded-xl transition-all text-sm border-2 border-rose-200 hover:border-rose-300"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                                Limpiar selección ({selectedInstallments.length})
                                            </motion.button>
                                        )}
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                                        <div className="flex items-center gap-4 md:gap-5">
                                            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 md:p-4 rounded-2xl shadow-sm">
                                                <FiUser className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                                                    {selectedStudent.apellido}, {selectedStudent.nombre}
                                                </h2>
                                                <div className="text-gray-800 space-y-2 text-sm md:text-base">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-gray-100 rounded-lg">
                                                            <FiFileText className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <span className="font-semibold">DNI: {selectedStudent.dni}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-gray-100 rounded-lg">
                                                            <FiMail className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <span className="font-semibold">{selectedStudent.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm md:text-base text-gray-700 font-bold">Deuda Pendiente Total</div>
                                            <div className="text-3xl md:text-4xl font-bold text-rose-600 mb-2">
                                                ${formatNumber(selectedStudent.totalPending)}
                                            </div>
                                            <div className="text-xs text-gray-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                                {selectedStudent.totalCuotas - selectedStudent.cuotasPagadas} de {selectedStudent.totalCuotas} cuotas pendientes
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Courses */}
                                {studentCourses.map(course => (
                                    <div key={course.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200/70 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-4 md:p-5 cursor-pointer hover:from-blue-700 hover:via-blue-600 hover:to-indigo-600 transition-all duration-300 flex justify-between items-center"
                                            onClick={() => toggleCourseExpansion(course.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                                    <FiFileText className="w-5 h-5 md:w-6 md:h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base md:text-lg">{course.courseName}</h3>
                                                    <div className="text-blue-100 text-sm mt-1 flex items-center gap-3">
                                                        <span className="font-medium">{course.installments.length} cuotas</span>
                                                        <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                                        <span className="font-medium">Pendiente: ${formatNumber(course.installments.filter(i => !i.fullyPaid).reduce((sum, i) => sum + i.pending, 0))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedCourses[course.id] ? 180 : 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"
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
                                                    className="overflow-visible"
                                                >
                                                    <div className="p-4 md:p-5 space-y-3 md:space-y-4 bg-gradient-to-b from-gray-50/50 to-blue-50/30">
                                                        {course.installments.map(installment => (
                                                            <InstallmentCard
                                                                key={installment.number}
                                                                installment={installment}
                                                                inscriptionId={course.inscriptionId}
                                                                isSelected={isInstallmentSelected(course.id, installment.number)}
                                                                onToggleSelection={() => toggleInstallmentSelection(course.id, installment.number, installment)}
                                                                showNotification={showNotification}
                                                                onActionCompleted={handleActionCompleted}
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
                )}

                {/* Cart Floating Button */}
                {selectedInstallments.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 text-white rounded-2xl shadow-2xl p-4 md:p-5 z-40 border-2 border-emerald-400/30 min-w-[300px] md:min-w-[350px] backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="bg-white/20 p-2 md:p-2.5 rounded-xl backdrop-blur-sm">
                                    <FiShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-emerald-100 font-medium">Total a cobrar</div>
                                    <div className="text-xl md:text-2xl font-bold">${formatNumber(totalCarrito)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-emerald-100 font-medium">Cuotas seleccionadas</div>
                                <div className="text-lg md:text-xl font-bold">{selectedInstallments.length}</div>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleProcessPayment}
                            className="w-full bg-white text-emerald-700 font-bold py-3 md:py-3.5 rounded-xl hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center gap-3 text-sm shadow-lg hover:shadow-xl"
                        >
                            <FiCreditCard className="w-5 h-5" />
                            Procesar Pago Múltiple
                        </motion.button>
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