// src/pages/Deudores.jsx
import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FiSearch, FiMail, FiPhone, FiChevronDown,
    FiCalendar, FiAlertCircle, FiDollarSign,
    FiBell, FiMessageSquare, FiCheck, FiSend,
    FiFilter, FiX, FiCalendar as FiCal,
    FiUsers, FiFileText, FiCreditCard, FiTrendingUp,
    FiArrowLeft, FiEye, FiEyeOff, FiUser, FiClock,
    FiPercent, FiArchive, FiRefreshCw
} from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

/* ==================== Helpers ==================== */
const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('es-AR');
};

const formatDate = d => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2,'0');
    const month = String(date.getMonth()+1).padStart(2,'0');
    return `${day}/${month}/${date.getFullYear()}`;
};

const getDaysLate = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
};

const isCurrentMonth = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    return targetDate.getMonth() === today.getMonth() &&
        targetDate.getFullYear() === today.getFullYear();
};

/* ================== FUNCIÓN CRÍTICA: CALCULAR PRECIO ================== */
const calcularPrecioPorMetodo = (inscription, course, installment, metodo, isOverdue) => {
    const methodKey = metodo === "Efectivo" ? "efectivo"
        : metodo === "Transferencia" ? "transferencia"
            : "tarjeta";

    let precio = 0;

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

        if (precio > 0) return precio;
    }

    precio = isOverdue
        ? (Number(installment.amountVencido) || Number(installment.amount) || 0)
        : (Number(installment.amountEnFecha) || Number(installment.amount) || 0);

    return precio;
};

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
                        className={`px-4 py-3 rounded-lg shadow-xl text-white font-semibold text-sm ${n.type === 'success' ? 'bg-green-600 border-l-4 border-green-700' :
                            n.type === 'error' ? 'bg-red-600 border-l-4 border-red-700' :
                                n.type === 'warning' ? 'bg-yellow-600 border-l-4 border-yellow-700' :
                                    'bg-blue-600 border-l-4 border-blue-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {n.type === 'success' && <FiCheck className="w-4 h-4" />}
                            {n.type === 'error' && <FiAlertCircle className="w-4 h-4" />}
                            {n.type === 'warning' && <FiAlertCircle className="w-4 h-4" />}
                            {n.type === 'info' && <FiBell className="w-4 h-4" />}
                            {n.message}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Filtro Mejorado ==================== */
function FiltroAvanzado({ filtroFecha, setFiltroFecha, filtroTipo, setFiltroTipo, showNotification }) {
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const limpiarFiltros = () => {
        setFiltroFecha({ desde: null, hasta: null });
        setFiltroTipo('todos');
        setMostrarFiltros(false);
        showNotification('info', 'Filtros limpiados');
    };

    const aplicarFiltros = () => {
        setMostrarFiltros(false);
        let mensaje = 'Filtros aplicados: ';
        if (filtroTipo !== 'todos') {
            mensaje += filtroTipo === 'vencidas' ? 'Solo vencidas' : 'Mes actual';
        }
        if (filtroFecha.desde || filtroFecha.hasta) {
            mensaje += ' | Rango de fechas';
        }
        showNotification('success', mensaje);
    };

    const tieneFiltros = filtroTipo !== 'todos' || filtroFecha.desde || filtroFecha.hasta;

    return (
        <div className="relative">
            <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${tieneFiltros
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
            >
                <FiFilter className="w-4 h-4" />
                <span>Filtros</span>
                {tieneFiltros && (
                    <span className="ml-1 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        {filtroTipo !== 'todos' ? 1 : 0 + (filtroFecha.desde || filtroFecha.hasta ? 1 : 0)}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {mostrarFiltros && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-5"
                    >
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    <FiFilter className="w-4 h-4" />
                                    Filtros Avanzados
                                </h4>
                                {tieneFiltros && (
                                    <button
                                        onClick={limpiarFiltros}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Limpiar todo
                                    </button>
                                )}
                            </div>

                            {/* Tipo de cuota */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Tipo de cuota:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'todos', label: 'Todos', icon: FiUsers },
                                        { value: 'vencidas', label: 'Vencidas', icon: FiAlertCircle },
                                        { value: 'mesActual', label: 'Este mes', icon: FiCalendar }
                                    ].map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setFiltroTipo(option.value)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${filtroTipo === option.value
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                    : 'bg-gray-50 border-gray-300 hover:border-blue-400'
                                                }`}
                                            >
                                                <Icon className={`w-4 h-4 mb-1 ${filtroTipo === option.value ? 'text-blue-600' : 'text-gray-500'}`} />
                                                <span className="text-xs font-medium">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rango de fechas */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Rango de fechas:
                                </label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Desde</label>
                                        <input
                                            type="date"
                                            value={filtroFecha.desde || ''}
                                            onChange={(e) => setFiltroFecha(prev => ({ ...prev, desde: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Hasta</label>
                                        <input
                                            type="date"
                                            value={filtroFecha.hasta || ''}
                                            onChange={(e) => setFiltroFecha(prev => ({ ...prev, hasta: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setMostrarFiltros(false)}
                                    className="flex-1 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all border border-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={aplicarFiltros}
                                    className="flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Card de Deudor Compacto ==================== */
function DeudorCard({ alumno, isActive, onClick, showNotification }) {
    const cuotasVencidas = alumno.cuotas.filter(c => c.isOverdue && !c.isPaid).length;
    const cuotasTotales = alumno.cuotas.filter(c => !c.isPaid).length;
    const diasAtraso = cuotasVencidas > 0 ?
        Math.max(...alumno.cuotas.filter(c => c.isOverdue && !c.isPaid).map(c => getDaysLate(c.dueDate))) : 0;

    const getSeverity = () => {
        if (cuotasVencidas > 3) return 'critical';
        if (cuotasVencidas > 0) return 'high';
        if (cuotasTotales > 0) return 'medium';
        return 'low';
    };

    const severity = getSeverity();
    const severityColors = {
        critical: 'from-red-500 to-red-600',
        high: 'from-orange-500 to-orange-600',
        medium: 'from-yellow-500 to-yellow-600',
        low: 'from-gray-500 to-gray-600'
    };

    const severityBgColors = {
        critical: 'bg-red-50 border-red-200',
        high: 'bg-orange-50 border-orange-200',
        medium: 'bg-yellow-50 border-yellow-200',
        low: 'bg-gray-50 border-gray-200'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
                opacity: isActive ? 0 : 1,
                scale: isActive ? 0.9 : 1,
                height: isActive ? 0 : 'auto',
                marginBottom: isActive ? 0 : '1rem'
            }}
            exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative ${isActive ? 'hidden' : 'block'}`}
        >
            <div
                onClick={onClick}
                className={`group bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 ${severityBgColors[severity]}`}
            >
                {/* Header con gradiente */}
                <div className={`bg-gradient-to-r ${severityColors[severity]} p-4 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
                        <FiAlertCircle className="w-full h-full text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <FiUser className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-white font-bold text-sm truncate max-w-[180px]">
                                    {alumno.studentName}
                                </h3>
                            </div>
                            {cuotasVencidas > 0 && (
                                <span className="bg-white/30 text-white text-xs px-2 py-1 rounded-full font-bold">
                                    {cuotasVencidas} VENCIDAS
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                    {/* Monto pendiente */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">Total pendiente</div>
                        <div className="text-2xl font-bold text-gray-900 truncate">
                            ${formatNumber(alumno.totalPending)}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Cuotas</div>
                            <div className="text-lg font-semibold text-gray-900">{cuotasTotales}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Cursos</div>
                            <div className="text-lg font-semibold text-gray-900">{alumno.cursos.length}</div>
                        </div>
                    </div>

                    {/* Info adicional */}
                    <div className="space-y-2">
                        {diasAtraso > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <FiClock className="w-3 h-3 text-red-500" />
                                <span className="text-red-600 font-medium">{diasAtraso} días de atraso</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMail className="w-3 h-3" />
                            <span className="truncate">{alumno.contact.email || 'Sin email'}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Click para ver detalles
                            </span>
                            <FiEye className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Indicador de severidad */}
                <div className={`absolute top-0 left-0 w-1 h-full ${severityColors[severity].replace('from-', 'bg-').split(' ')[0]}`}></div>
            </div>
        </motion.div>
    );
}

/* ==================== Vista Expandida de Deudor ==================== */
function DeudorExpandido({ alumno, onClose, showNotification }) {
    const [selectedCuotas, setSelectedCuotas] = useState([]);
    const [metodoPago, setMetodoPago] = useState('Transferencia');
    const [isSending, setIsSending] = useState(false);

    const cuotasPendientes = alumno.cuotas.filter(c => !c.isPaid);
    const cuotasVencidas = cuotasPendientes.filter(c => c.isOverdue);
    const totalSelected = selectedCuotas.reduce((sum, c) => sum + c.pending, 0);

    const toggleCuota = (cuota) => {
        if (cuota.isPaid) return;

        setSelectedCuotas(prev => {
            const exists = prev.some(c =>
                c.installmentNumber === cuota.installmentNumber &&
                c.dueDate === cuota.dueDate
            );

            if (exists) {
                return prev.filter(c =>
                    !(c.installmentNumber === cuota.installmentNumber && c.dueDate === cuota.dueDate)
                );
            } else {
                return [...prev, { ...cuota, courseName: cuota.courseName || 'Curso' }];
            }
        });
    };

    const selectAllCuotas = () => {
        const allCuotas = alumno.cursos.flatMap(curso =>
            curso.cuotas
                .filter(cuota => !cuota.isPaid)
                .map(cuota => ({
                    ...cuota,
                    courseName: curso.courseName
                }))
        );
        setSelectedCuotas(allCuotas);
    };

    const clearSelection = () => {
        setSelectedCuotas([]);
    };

    const generateMessage = () => {
        if (selectedCuotas.length === 0) return '';

        const total = selectedCuotas.reduce((sum, c) => sum + c.pending, 0);
        const cuotasVencidas = selectedCuotas.filter(c => c.isOverdue);
        const cuotasPorVencer = selectedCuotas.filter(c => !c.isOverdue);

        let message = `Hola ${alumno.studentName}, te recordamos que tienes cuotas pendientes:\n\n`;

        if (cuotasVencidas.length > 0) {
            message += `📅 *CUOTAS VENCIDAS:*\n`;
            cuotasVencidas.forEach(cuota => {
                const daysLate = getDaysLate(cuota.dueDate);
                message += `• ${cuota.courseName} - Cuota #${cuota.installmentNumber}: $${formatNumber(cuota.pending)} (Vencida el ${formatDate(cuota.dueDate)}) - ${daysLate} días de atraso\n`;
            });
            message += `\n`;
        }

        if (cuotasPorVencer.length > 0) {
            message += `⏰ *CUOTAS POR VENCER:*\n`;
            cuotasPorVencer.forEach(cuota => {
                message += `• ${cuota.courseName} - Cuota #${cuota.installmentNumber}: $${formatNumber(cuota.pending)} (Vence el ${formatDate(cuota.dueDate)})\n`;
            });
            message += `\n`;
        }

        message += `💰 *TOTAL A PAGAR: $${formatNumber(total)}*\n\n`;
        message += `Por favor, regulariza tu situación lo antes posible.`;

        return message;
    };

    const handleSendWhatsApp = () => {
        if (selectedCuotas.length === 0) {
            showNotification('warning', 'Selecciona al menos una cuota para enviar');
            return;
        }

        const message = generateMessage();
        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = alumno.contact.telefono?.replace(/\D/g, '');

        if (phoneNumber) {
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
            showNotification('success', `WhatsApp abierto para ${alumno.studentName}`);
        } else {
            showNotification('error', 'No hay número de teléfono para enviar WhatsApp');
        }
    };

    const handleSendEmail = () => {
        if (selectedCuotas.length === 0) {
            showNotification('warning', 'Selecciona al menos una cuota para enviar');
            return;
        }

        const message = generateMessage();
        const subject = `Recordatorio de pago - ${alumno.studentName}`;
        const mailto = `mailto:${alumno.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        window.location.href = mailto;
        showNotification('info', `Email preparado para ${alumno.studentName}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto"
        >
            <div className="max-w-6xl mx-auto p-4 lg:p-6">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                                >
                                    <FiArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">{alumno.studentName}</h1>
                                    <p className="text-blue-100">Detalle completo de deudas</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-white mb-1">
                                    ${formatNumber(alumno.totalPending)}
                                </div>
                                <div className="text-blue-100 text-sm">
                                    Total pendiente
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                                <div className="text-white text-sm mb-1">Cuotas totales</div>
                                <div className="text-2xl font-bold text-white">{cuotasPendientes.length}</div>
                            </div>
                            <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                                <div className="text-white text-sm mb-1">Cuotas vencidas</div>
                                <div className="text-2xl font-bold text-white">{cuotasVencidas.length}</div>
                            </div>
                            <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                                <div className="text-white text-sm mb-1">Cursos</div>
                                <div className="text-2xl font-bold text-white">{alumno.cursos.length}</div>
                            </div>
                            <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                                <div className="text-white text-sm mb-1">Contacto</div>
                                <div className="text-lg font-semibold text-white truncate">
                                    {alumno.contact.telefono || alumno.contact.email || 'Sin contacto'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel de acciones */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Acciones rápidas</h3>
                                <p className="text-gray-600 text-sm">Selecciona cuotas para enviar recordatorios</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={selectAllCuotas}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <FiCheck className="w-4 h-4" />
                                    Seleccionar todas
                                </button>
                                <button
                                    onClick={clearSelection}
                                    disabled={selectedCuotas.length === 0}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedCuotas.length === 0
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    <FiX className="w-4 h-4" />
                                    Limpiar
                                </button>
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                                >
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </select>
                            </div>
                        </div>

                        {/* Cuotas seleccionadas */}
                        {selectedCuotas.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-blue-700 font-bold">{selectedCuotas.length}</span>
                                            <span className="text-blue-600">cuotas seleccionadas</span>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-800">
                                            ${formatNumber(totalSelected)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSendWhatsApp}
                                            disabled={!alumno.contact.telefono}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${alumno.contact.telefono
                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <FiMessageSquare className="w-4 h-4" />
                                            Enviar WhatsApp
                                        </button>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={!alumno.contact.email}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${alumno.contact.email
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <FiMail className="w-4 h-4" />
                                            Enviar Email
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Lista de cursos */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FiFileText className="w-5 h-5 text-blue-600" />
                        Cursos con cuotas pendientes
                    </h2>

                    {alumno.cursos.map((curso, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <FiFileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{curso.courseName}</h3>
                                            <p className="text-gray-600 text-sm">
                                                {curso.cuotas.filter(c => !c.isPaid).length} cuotas pendientes
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900">
                                            ${formatNumber(curso.cuotas.filter(c => !c.isPaid).reduce((sum, c) => sum + c.pending, 0))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cuotas del curso */}
                            <div className="p-4">
                                <div className="space-y-3">
                                    {curso.cuotas
                                        .filter(c => !c.isPaid)
                                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                                        .map((cuota, cIdx) => (
                                            <div
                                                key={cIdx}
                                                onClick={() => toggleCuota(cuota)}
                                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCuotas.some(sc =>
                                                    sc.installmentNumber === cuota.installmentNumber && sc.dueDate === cuota.dueDate
                                                ) ? 'bg-blue-50 border-blue-300 border-l-4 border-l-blue-500' :
                                                    cuota.isOverdue ? 'bg-red-50 border-red-200 border-l-4 border-l-red-500' :
                                                        'bg-gray-50 border-gray-200 hover:border-blue-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 border rounded flex items-center justify-center ${selectedCuotas.some(sc =>
                                                            sc.installmentNumber === cuota.installmentNumber && sc.dueDate === cuota.dueDate
                                                        ) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                                            {selectedCuotas.some(sc =>
                                                                sc.installmentNumber === cuota.installmentNumber && sc.dueDate === cuota.dueDate
                                                            ) && <FiCheck className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                Cuota #{cuota.installmentNumber}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <FiCalendar className="w-3 h-3" />
                                                                Vence: {formatDate(cuota.dueDate)}
                                                                {cuota.isOverdue && (
                                                                    <span className="text-red-600 font-medium">
                                                                        ({getDaysLate(cuota.dueDate)} días de atraso)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-bold text-gray-900">
                                                            ${formatNumber(cuota.pending)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {cuota.isOverdue ? 'Vencido' : 'Pendiente'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Información de contacto */}
                <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FiMail className="w-4 h-4" />
                                <span className="font-medium">Email:</span>
                                <span>{alumno.contact.email || 'No especificado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <FiPhone className="w-4 h-4" />
                                <span className="font-medium">Teléfono:</span>
                                <span>{alumno.contact.telefono || 'No especificado'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all shadow-md"
                            >
                                Volver al listado
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ==================== Componente Principal ==================== */
export default function Deudores() {
    const { students = [], inscriptions = [], courses = [] } = useDB();
    const [notifications, setNotifications] = useState([]);
    const [search, setSearch] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroFecha, setFiltroFecha] = useState({ desde: null, hasta: null });
    const [deudorExpandido, setDeudorExpandido] = useState(null);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const debtors = useMemo(() => {
        console.log('\n🔍 [DEUDORES] Calculando deudores...');
        console.log('   Estudiantes:', students.length);
        console.log('   Inscripciones:', inscriptions.length);
        console.log('   Cursos:', courses.length);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const byStudent = new Map();

        inscriptions.forEach((ins) => {
            const student = students.find(s => s.id === ins.studentId);
            const course = courses.find(c => c.id === ins.courseId);

            if (!student || !course) return;

            const todasLasCuotas = (ins.installments || []).filter(inst => true);

            const tieneCuotasPendientes = todasLasCuotas.some(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const isOverdue = !inst.frozen && today > dueDate;

                const defaultMethod = ins.paymentType || 'Transferencia';
                const montoActual = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, isOverdue);
                const pending = Math.max(montoActual - Number(inst.amountPaid || 0), 0);

                return pending > 0;
            });

            if (!tieneCuotasPendientes) return;

            if (!byStudent.has(ins.studentId)) {
                byStudent.set(ins.studentId, {
                    studentId: ins.studentId,
                    studentName: `${student.apellido} ${student.nombre}`,
                    contact: {
                        email: student.email || '',
                        telefono: student.telefono || ''
                    },
                    totalPending: 0,
                    cuotas: [],
                    cursos: []
                });
            }

            const deudor = byStudent.get(ins.studentId);

            const cuotasData = todasLasCuotas.map(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const isOverdue = !inst.frozen && today > dueDate;

                const defaultMethod = ins.paymentType || 'Transferencia';
                const montoActual = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, isOverdue);
                const pending = Math.max(montoActual - Number(inst.amountPaid || 0), 0);

                const amountEnFecha = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, false);
                const amountVencido = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, true);

                const isPaid = pending === 0 || inst.status === 'Pagada' || inst.status === 'Pagado';

                return {
                    installmentNumber: inst.number,
                    dueDate: inst.dueDate,
                    amountEnFecha: amountEnFecha,
                    amountVencido: amountVencido,
                    montoActual: montoActual,
                    amountPaid: Number(inst.amountPaid || 0),
                    pending: pending,
                    isOverdue: isOverdue,
                    frozen: inst.frozen || false,
                    estado: inst.status || 'Pendiente',
                    courseName: course.nombre,
                    isPaid: isPaid
                };
            });

            const totalCurso = cuotasData.filter(c => !c.isPaid).reduce((sum, c) => sum + c.pending, 0);
            deudor.totalPending += totalCurso;
            deudor.cuotas.push(...cuotasData);

            deudor.cursos.push({
                courseName: course.nombre,
                inscriptionId: ins.id,
                estadoCurso: ins.status || 'Cursando',
                fechaInscripcion: ins.createdAt || ins.fechaInscripcion,
                cuotas: cuotasData
            });
        });

        const result = Array.from(byStudent.values()).sort((a, b) => b.totalPending - a.totalPending);
        console.log(`🎯 [DEUDORES] Total: ${result.length} deudores`);
        return result;
    }, [students, inscriptions, courses]);

    const deudoresFiltrados = useMemo(() => {
        let filtered = debtors;

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(d =>
                d.studentName.toLowerCase().includes(searchLower) ||
                d.contact.email.toLowerCase().includes(searchLower) ||
                d.contact.telefono.includes(search)
            );
        }

        if (filtroTipo === 'vencidas') {
            filtered = filtered.filter(d =>
                d.cuotas.some(c => c.isOverdue && !c.isPaid)
            );
        } else if (filtroTipo === 'mesActual') {
            filtered = filtered.filter(d =>
                d.cuotas.some(c => isCurrentMonth(c.dueDate) && !c.isPaid)
            );
        }

        if (filtroFecha.desde || filtroFecha.hasta) {
            filtered = filtered.filter(d => {
                const cuotasFiltradas = d.cuotas.filter(c => {
                    if (!filtroFecha.desde && !filtroFecha.hasta) return true;

                    const fechaCuota = new Date(c.dueDate);
                    fechaCuota.setHours(0, 0, 0, 0);

                    if (filtroFecha.desde) {
                        const desde = new Date(filtroFecha.desde);
                        desde.setHours(0, 0, 0, 0);
                        if (fechaCuota < desde) return false;
                    }

                    if (filtroFecha.hasta) {
                        const hasta = new Date(filtroFecha.hasta);
                        hasta.setHours(23, 59, 59, 999);
                        if (fechaCuota > hasta) return false;
                    }

                    return true;
                });
                return cuotasFiltradas.length > 0;
            });
        }

        return filtered;
    }, [debtors, search, filtroTipo, filtroFecha]);

    const stats = useMemo(() => {
        return {
            totalDeudores: deudoresFiltrados.length,
            totalDeuda: deudoresFiltrados.reduce((sum, d) => sum + (d.totalPending || 0), 0),
            totalCuotas: deudoresFiltrados.reduce((sum, d) =>
                sum + ((d.cuotas || []).filter(c => !c.isPaid).length), 0
            ),
            cuotasVencidas: deudoresFiltrados.reduce((sum, d) =>
                sum + ((d.cuotas || []).filter(c => c.isOverdue && !c.isPaid).length), 0
            )
        };
    }, [deudoresFiltrados]);

    const tieneFiltrosActivos = search || filtroTipo !== 'todos' || filtroFecha.desde || filtroFecha.hasta;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 lg:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            {deudorExpandido ? (
                <DeudorExpandido
                    alumno={deudorExpandido}
                    onClose={() => setDeudorExpandido(null)}
                    showNotification={showNotification}
                />
            ) : (
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 lg:p-8">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                            <FiAlertCircle className="w-8 h-8 text-white" />
                                        </div>
                                        Gestión de Deudores
                                    </h1>
                                    <p className="text-blue-100 mt-2">
                                        Control profesional de cuotas pendientes de pago
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-blue-200">Total pendiente en sistema</div>
                                    <div className="text-4xl font-bold text-white">${formatNumber(stats.totalDeuda)}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl shadow-lg p-5 border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                                    <FiUsers className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.totalDeudores}</div>
                                    <div className="text-sm text-gray-600">Deudores activos</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl shadow-lg p-5 border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl">
                                    <FiTrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">${formatNumber(stats.totalDeuda)}</div>
                                    <div className="text-sm text-gray-600">Total adeudado</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-xl shadow-lg p-5 border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
                                    <FiFileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.totalCuotas}</div>
                                    <div className="text-sm text-gray-600">Cuotas pendientes</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-xl shadow-lg p-5 border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
                                    <FiAlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.cuotasVencidas}</div>
                                    <div className="text-sm text-gray-600">Cuotas vencidas</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Search and Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                    >
                        <div className="space-y-4">
                            <div className="flex flex-col lg:flex-row gap-3">
                                <div className="flex-1">
                                    <div className="relative">
                                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Buscar deudor por nombre, email o teléfono..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all text-base text-gray-900 placeholder-gray-500"
                                        />
                                    </div>
                                </div>

                                <FiltroAvanzado
                                    filtroFecha={filtroFecha}
                                    setFiltroFecha={setFiltroFecha}
                                    filtroTipo={filtroTipo}
                                    setFiltroTipo={setFiltroTipo}
                                    showNotification={showNotification}
                                />
                            </div>

                            {tieneFiltrosActivos && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-xl border border-blue-200"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-blue-800">
                                            <FiFilter className="w-4 h-4" />
                                            <span className="font-medium">
                                                Mostrando {deudoresFiltrados.length} de {debtors.length} deudores
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSearch('');
                                                setFiltroTipo('todos');
                                                setFiltroFecha({ desde: null, hasta: null });
                                            }}
                                            className="text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
                                        >
                                            <FiRefreshCw className="w-3 h-3" />
                                            Limpiar filtros
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Grid de Deudores */}
                    {deudoresFiltrados.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center"
                        >
                            <div className="max-w-md mx-auto">
                                <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <FiAlertCircle className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {tieneFiltrosActivos ? 'No hay coincidencias' : '¡Todo al día!'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {tieneFiltrosActivos
                                        ? 'No se encontraron deudores con los filtros aplicados.'
                                        : 'Excelente trabajo, todos los alumnos están al corriente con sus pagos.'}
                                </p>
                                {tieneFiltrosActivos && (
                                    <button
                                        onClick={() => {
                                            setSearch('');
                                            setFiltroTipo('todos');
                                            setFiltroFecha({ desde: null, hasta: null });
                                        }}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-md"
                                    >
                                        Ver todos los deudores
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Deudores <span className="text-blue-600">({deudoresFiltrados.length})</span>
                                </h2>
                                <div className="text-sm text-gray-600">
                                    Haz clic en cualquier card para ver detalles
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <AnimatePresence>
                                    {deudoresFiltrados.map((alumno) => (
                                        <DeudorCard
                                            key={alumno.studentId}
                                            alumno={alumno}
                                            isActive={deudorExpandido?.studentId === alumno.studentId}
                                            onClick={() => setDeudorExpandido(alumno)}
                                            showNotification={showNotification}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}