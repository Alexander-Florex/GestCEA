// src/pages/Deudores.jsx
import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FiSearch, FiMail, FiPhone, FiChevronDown,
    FiCalendar, FiAlertCircle, FiDollarSign,
    FiBell, FiMessageSquare, FiCheck, FiSend,
    FiFilter, FiX, FiCalendar as FiCal
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

const formatDateForInput = d => {
    if (!d) return '';
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
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
                        className={`px-4 py-3 rounded-lg shadow-xl text-white font-semibold text-sm ${
                            n.type === 'success' ? 'bg-green-600' :
                                n.type === 'error' ? 'bg-red-600' :
                                    n.type === 'warning' ? 'bg-yellow-600' :
                                        'bg-blue-600'
                        }`}
                    >
                        {n.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Filtro por Rango de Fechas ==================== */
function FiltroRangoFechas({ filtroFecha, setFiltroFecha, showNotification }) {
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const aplicarFiltro = () => {
        setMostrarCalendario(false);
        if (filtroFecha.desde || filtroFecha.hasta) {
            let mensaje = 'Filtro aplicado: ';
            if (filtroFecha.desde && filtroFecha.hasta) {
                mensaje += `Desde ${formatDate(filtroFecha.desde)} hasta ${formatDate(filtroFecha.hasta)}`;
            } else if (filtroFecha.desde) {
                mensaje += `Desde ${formatDate(filtroFecha.desde)}`;
            } else if (filtroFecha.hasta) {
                mensaje += `Hasta ${formatDate(filtroFecha.hasta)}`;
            }
            showNotification('info', mensaje);
        }
    };

    const limpiarFiltro = () => {
        setFiltroFecha({ desde: null, hasta: null });
        setMostrarCalendario(false);
        showNotification('info', 'Filtro de fechas limpiado');
    };

    const establecerHoy = (campo) => {
        const hoy = new Date();
        const hoyFormateado = hoy.toISOString().split('T')[0];
        setFiltroFecha(prev => ({
            ...prev,
            [campo]: hoyFormateado
        }));
    };

    // Función para manejar cambio de fecha directamente
    const manejarCambioFecha = (campo, valor) => {
        setFiltroFecha(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const getDisplayDate = (fecha) => {
        if (!fecha) return '';
        if (fecha.includes('/')) return fecha;

        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
    };

    const getTextoFiltro = () => {
        if (!filtroFecha.desde && !filtroFecha.hasta) return 'Rango de fechas';

        const desdeDisplay = getDisplayDate(filtroFecha.desde);
        const hastaDisplay = getDisplayDate(filtroFecha.hasta);

        if (filtroFecha.desde && filtroFecha.hasta) {
            return `${desdeDisplay} - ${hastaDisplay}`;
        }
        if (filtroFecha.desde) return `Desde ${desdeDisplay}`;
        if (filtroFecha.hasta) return `Hasta ${hastaDisplay}`;
        return 'Rango de fechas';
    };

    const tieneFiltro = filtroFecha.desde || filtroFecha.hasta;

    return (
        <div className="relative">
            <button
                onClick={() => setMostrarCalendario(!mostrarCalendario)}
                className={`flex items-center gap-2 px-4 py-2 lg:py-3 border-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                    tieneFiltro
                        ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}
            >
                <FiCal className="w-4 h-4" />
                <span className="max-w-40 truncate">{getTextoFiltro()}</span>
                {tieneFiltro && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            limpiarFiltro();
                        }}
                        className="text-white hover:text-red-200"
                    >
                        <FiX className="w-3 h-3" />
                    </button>
                )}
            </button>

            <AnimatePresence>
                {mostrarCalendario && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4"
                    >
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-800 text-sm">Filtrar por rango de fechas</h4>

                            {/* Fecha Desde */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Fecha Desde:
                                </label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={filtroFecha.desde || ''}
                                            onChange={(e) => manejarCambioFecha('desde', e.target.value)}
                                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:border-blue-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => establecerHoy('desde')}
                                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                                        >
                                            Hoy
                                        </button>
                                    </div>
                                    {filtroFecha.desde && (
                                        <p className="text-xs text-gray-600">
                                            Seleccionado: {getDisplayDate(filtroFecha.desde)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Fecha Hasta */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Fecha Hasta:
                                </label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={filtroFecha.hasta || ''}
                                            onChange={(e) => manejarCambioFecha('hasta', e.target.value)}
                                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:border-blue-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => establecerHoy('hasta')}
                                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                                        >
                                            Hoy
                                        </button>
                                    </div>
                                    {filtroFecha.hasta && (
                                        <p className="text-xs text-gray-600">
                                            Seleccionado: {getDisplayDate(filtroFecha.hasta)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Información del filtro */}
                            <div className="text-xs text-gray-600 space-y-1 bg-blue-50 p-3 rounded-lg">
                                <p className="font-semibold">Comportamiento del filtro:</p>
                                <p>• <strong>Solo Desde:</strong> Cuotas desde esta fecha en adelante (incluyendo la fecha)</p>
                                <p>• <strong>Solo Hasta:</strong> Cuotas hasta esta fecha (incluyendo la fecha)</p>
                                <p>• <strong>Ambas:</strong> Cuotas entre estas fechas (incluyendo ambas)</p>
                                <p>• <strong>Ninguna:</strong> Todas las cuotas pendientes</p>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={limpiarFiltro}
                                    disabled={!tieneFiltro}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        tieneFiltro
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Borrar
                                </button>
                                <button
                                    onClick={aplicarFiltro}
                                    className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>

                            {/* Fechas actuales seleccionadas */}
                            {tieneFiltro && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-xs text-yellow-700 font-semibold">Fechas seleccionadas:</p>
                                    {filtroFecha.desde && (
                                        <p className="text-xs text-yellow-600">Desde: {getDisplayDate(filtroFecha.desde)}</p>
                                    )}
                                    {filtroFecha.hasta && (
                                        <p className="text-xs text-yellow-600">Hasta: {getDisplayDate(filtroFecha.hasta)}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Card de Cuota Seleccionable ==================== */
function CuotaSeleccionable({ cuota, curso, isSelected, onToggle, showCheckbox = true }) {
    const isVencida = cuota.isOverdue;
    const daysLate = isVencida ? getDaysLate(cuota.dueDate) : 0;
    const esMesActual = isCurrentMonth(cuota.dueDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 lg:p-4 rounded-lg border-2 ${
                isSelected
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                    : isVencida
                        ? 'bg-red-50 border-red-400'
                        : esMesActual
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-white border-gray-300'
            } shadow-sm hover:shadow-md transition-all cursor-pointer`}
            onClick={() => onToggle(cuota)}
        >
            <div className="flex items-start gap-3">
                {showCheckbox && (
                    <div className="flex items-start pt-1">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            isSelected
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'border-gray-400 bg-white'
                        }`}>
                            {isSelected && <FiCheck className="w-3 h-3" />}
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-sm lg:text-base">
                                {curso.courseName} - Cuota #{cuota.installmentNumber}
                            </span>
                            {isVencida && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
                                    VENCIDA
                                </span>
                            )}
                            {!isVencida && esMesActual && (
                                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full font-semibold">
                                    VENCE ESTE MES
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-lg lg:text-xl font-bold text-red-700">
                                ${formatNumber(cuota.pending)}
                            </div>
                            {cuota.isOverdue && cuota.amountEnFecha !== cuota.amountVencido && (
                                <div className="text-xs text-gray-600">
                                    En fecha hubiera sido: ${formatNumber(cuota.amountEnFecha - cuota.amountPaid)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs lg:text-sm text-gray-600 gap-1">
                        <div className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            <span>Vencimiento: {formatDate(cuota.dueDate)}</span>
                        </div>
                        {isVencida && (
                            <span className="text-red-600 font-semibold">
                                {daysLate} día{daysLate !== 1 ? 's' : ''} de atraso
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Estado: {cuota.estado}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ==================== Card de Curso ==================== */
function CursoCard({ curso, selectedCuotas, onToggleCuota, showCheckbox = true }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const totalCurso = curso.cuotas.reduce((sum, c) => sum + (Number(c.pending) || 0), 0);
    const cuotasVencidas = curso.cuotas.filter(c => c.isOverdue).length;
    const cuotasSeleccionadasEnCurso = curso.cuotas.filter(c =>
        selectedCuotas.some(sc => sc.installmentNumber === c.installmentNumber && sc.dueDate === c.dueDate)
    ).length;

    const getEstadoBadge = () => {
        if (curso.estadoCurso === 'Cursando') {
            return { text: 'Cursando', color: 'bg-blue-100 text-blue-800 border-blue-300' };
        } else if (curso.estadoCurso === 'Finalizado') {
            return { text: 'Finalizado', color: 'bg-green-100 text-green-800 border-green-300' };
        } else if (curso.estadoCurso === 'Baja') {
            return { text: 'Baja', color: 'bg-gray-100 text-gray-800 border-gray-300' };
        } else if (curso.estadoCurso === 'AbandonoNoNotificado') {
            return { text: 'Abandono', color: 'bg-red-100 text-red-800 border-red-300' };
        }
        return { text: curso.estadoCurso, color: 'bg-gray-100 text-gray-800 border-gray-300' };
    };

    const estadoBadge = getEstadoBadge();

    return (
        <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-lg transition-shadow">
            <div
                className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-3 lg:p-4 cursor-pointer hover:from-red-700 hover:to-blue-700 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-base lg:text-lg font-bold mb-1">{curso.courseName}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs lg:text-sm text-blue-100">
                            <span className="flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {formatDate(curso.fechaInscripcion)}
                            </span>
                            <span className={`px-2 py-1 rounded border ${estadoBadge.color} text-xs font-semibold w-fit`}>
                                {estadoBadge.text}
                            </span>
                            {showCheckbox && cuotasSeleccionadasEnCurso > 0 && (
                                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-semibold">
                                    {cuotasSeleccionadasEnCurso} seleccionada{cuotasSeleccionadasEnCurso !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right mr-2 lg:mr-4">
                        <div className="text-lg lg:text-2xl font-bold">
                            ${formatNumber(totalCurso)}
                        </div>
                        <div className="text-xs text-blue-100">
                            {curso.cuotas.length} cuota{curso.cuotas.length !== 1 ? 's' : ''}
                        </div>
                        {cuotasVencidas > 0 && (
                            <div className="text-xs text-red-200 font-semibold mt-1 flex items-center justify-end gap-1">
                                <FiAlertCircle className="w-3 h-3" />
                                {cuotasVencidas} vencida{cuotasVencidas !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FiChevronDown className="w-5 h-5 lg:w-6 lg:h-6" />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 lg:p-4 space-y-3 bg-gray-50">
                            {curso.cuotas
                                .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0))
                                .map((cuota, idx) => (
                                    <CuotaSeleccionable
                                        key={idx}
                                        cuota={cuota}
                                        curso={curso}
                                        isSelected={selectedCuotas.some(sc =>
                                            sc.installmentNumber === cuota.installmentNumber &&
                                            sc.dueDate === cuota.dueDate
                                        )}
                                        onToggle={onToggleCuota}
                                        showCheckbox={showCheckbox}
                                    />
                                ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Card de Alumno ==================== */
function AlumnoCard({ alumno, showNotification }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedCuotas, setSelectedCuotas] = useState([]);
    const [isSending, setIsSending] = useState(false);

    // Función para alternar selección de cuota
    const toggleCuota = (cuota) => {
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

    // Función para seleccionar todas las cuotas
    const selectAllCuotas = () => {
        const allCuotas = alumno.cursos.flatMap(curso =>
            curso.cuotas.map(cuota => ({
                ...cuota,
                courseName: curso.courseName
            }))
        );
        setSelectedCuotas(allCuotas);
    };

    // Función para limpiar selección
    const clearSelection = () => {
        setSelectedCuotas([]);
    };

    // Función para generar mensaje personalizado
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

    const handleSendEmail = () => {
        if (selectedCuotas.length === 0) {
            showNotification('warning', 'Selecciona al menos una cuota para enviar');
            return;
        }

        const message = generateMessage();
        showNotification('info', `Enviando email a ${alumno.contact.email || 'Sin email'} con ${selectedCuotas.length} cuota${selectedCuotas.length !== 1 ? 's' : ''}`);
        console.log('Email message:', message);
        // Aquí iría la lógica real de envío de email
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
            showNotification('success', `WhatsApp abierto para ${alumno.studentName} con ${selectedCuotas.length} cuota${selectedCuotas.length !== 1 ? 's' : ''}`);
        } else {
            showNotification('error', 'No hay número de teléfono para enviar WhatsApp');
        }
    };

    const handleSendSMS = () => {
        if (selectedCuotas.length === 0) {
            showNotification('warning', 'Selecciona al menos una cuota para enviar');
            return;
        }

        const message = generateMessage();
        showNotification('info', `Enviando SMS a ${alumno.contact.telefono || 'Sin teléfono'} con ${selectedCuotas.length} cuota${selectedCuotas.length !== 1 ? 's' : ''}`);
        console.log('SMS message:', message);
        // Aquí iría la lógica real de envío de SMS
    };

    const hasSelectedCuotas = selectedCuotas.length > 0;
    const totalSelected = selectedCuotas.reduce((sum, c) => sum + c.pending, 0);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow"
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-4 lg:p-6 cursor-pointer hover:from-red-700 hover:to-blue-700 transition-colors"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl lg:text-2xl font-bold mb-2">{alumno.studentName}</h2>
                        <div className="flex flex-wrap gap-2 text-sm">
                            {alumno.contact.email && (
                                <div className="flex items-center gap-1 bg-white/20 px-2 lg:px-3 py-1 rounded-full">
                                    <FiMail className="w-3 h-3" />
                                    <span className="text-xs lg:text-sm">{alumno.contact.email}</span>
                                </div>
                            )}
                            {alumno.contact.telefono && (
                                <div className="flex items-center gap-1 bg-white/20 px-2 lg:px-3 py-1 rounded-full">
                                    <FiPhone className="w-3 h-3" />
                                    <span className="text-xs lg:text-sm">{alumno.contact.telefono}</span>
                                </div>
                            )}
                            {hasSelectedCuotas && (
                                <div className="flex items-center gap-1 bg-green-500 px-2 lg:px-3 py-1 rounded-full">
                                    <FiCheck className="w-3 h-3" />
                                    <span className="text-xs lg:text-sm">
                                        {selectedCuotas.length} cuota{selectedCuotas.length !== 1 ? 's' : ''} seleccionada{selectedCuotas.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl lg:text-4xl font-bold mb-1">
                            ${formatNumber(alumno.totalPending)}
                        </div>
                        <div className="text-xs lg:text-sm text-blue-100">
                            {alumno.cursos.length} curso{alumno.cursos.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs lg:text-sm text-blue-100">
                            {alumno.cuotas.length} cuota{alumno.cuotas.length !== 1 ? 's' : ''} pendiente{alumno.cuotas.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="hidden lg:block"
                    >
                        <FiChevronDown className="w-6 h-6 lg:w-8 lg:h-8" />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                            {/* Panel de selección de cuotas */}
                            {hasSelectedCuotas && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h4 className="font-bold text-blue-800 text-lg">
                                                {selectedCuotas.length} cuota{selectedCuotas.length !== 1 ? 's' : ''} seleccionada{selectedCuotas.length !== 1 ? 's' : ''}
                                            </h4>
                                            <p className="text-blue-600 text-sm">
                                                Total seleccionado: <span className="font-bold">${formatNumber(totalSelected)}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={clearSelection}
                                                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm transition-colors"
                                            >
                                                Limpiar
                                            </button>
                                            <button
                                                onClick={selectAllCuotas}
                                                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors"
                                            >
                                                Seleccionar Todas
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex flex-wrap gap-2 lg:gap-3">
                                <button
                                    onClick={handleSendEmail}
                                    disabled={!alumno.contact.email || !hasSelectedCuotas}
                                    className={`flex items-center justify-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                                        alumno.contact.email && hasSelectedCuotas
                                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <FiMail className="w-4 h-4" />
                                    <span className="hidden sm:inline">Enviar Email</span>
                                    <span className="sm:hidden">Email</span>
                                </button>
                                <button
                                    onClick={handleSendWhatsApp}
                                    disabled={!alumno.contact.telefono || !hasSelectedCuotas}
                                    className={`flex items-center justify-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                                        alumno.contact.telefono && hasSelectedCuotas
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <FiMessageSquare className="w-4 h-4" />
                                    <span className="hidden sm:inline">WhatsApp</span>
                                    <span className="sm:hidden">WA</span>
                                </button>
                                <button
                                    onClick={handleSendSMS}
                                    disabled={!alumno.contact.telefono || !hasSelectedCuotas}
                                    className={`flex items-center justify-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                                        alumno.contact.telefono && hasSelectedCuotas
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <FiBell className="w-4 h-4" />
                                    <span className="hidden sm:inline">SMS</span>
                                    <span className="sm:hidden">SMS</span>
                                </button>
                            </div>

                            {/* Lista de cursos */}
                            <div className="space-y-4">
                                <h3 className="text-base lg:text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <FiDollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />
                                    Detalle por Curso - Selecciona las cuotas a notificar
                                </h3>
                                {alumno.cursos.map((curso, idx) => (
                                    <CursoCard
                                        key={idx}
                                        curso={curso}
                                        selectedCuotas={selectedCuotas}
                                        onToggleCuota={toggleCuota}
                                        showCheckbox={true}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ==================== Componente Principal ==================== */
export default function Deudores() {
    const { students, inscriptions, courses } = useDB();

    const [search, setSearch] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroFecha, setFiltroFecha] = useState({ desde: null, hasta: null });
    const [notifications, setNotifications] = useState([]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(n => n.filter(x => x.id !== id));
    };

    // Función para verificar si una cuota coincide con el filtro de rango de fechas
    const cuotaCoincideConFiltroFecha = (cuota) => {
        const fechaVencimiento = new Date(cuota.dueDate);

        // Si no hay filtros de fecha, mostrar todas
        if (!filtroFecha.desde && !filtroFecha.hasta) return true;

        const desde = filtroFecha.desde ? new Date(filtroFecha.desde) : null;
        const hasta = filtroFecha.hasta ? new Date(filtroFecha.hasta) : null;

        // Resetear horas para comparar solo fechas
        if (desde) desde.setHours(0, 0, 0, 0);
        if (hasta) hasta.setHours(23, 59, 59, 999); // Incluir todo el día
        fechaVencimiento.setHours(0, 0, 0, 0); // Resetear horas de la fecha de vencimiento

        // Lógica del filtro
        if (desde && hasta) {
            // Rango completo: desde X hasta Y
            return fechaVencimiento >= desde && fechaVencimiento <= hasta;
        } else if (desde && !hasta) {
            // Solo desde: todas las cuotas desde X en adelante
            return fechaVencimiento >= desde;
        } else if (!desde && hasta) {
            // Solo hasta: todas las cuotas hasta Y
            return fechaVencimiento <= hasta;
        }

        return true;
    };

    // ✅ LÓGICA CORREGIDA CON LOGS DETALLADOS
    const debtors = useMemo(() => {
        console.log('🔍 [DEUDORES] Iniciando cálculo de deudores...');
        console.log('📊 [DEUDORES] Total inscripciones:', inscriptions.length);
        console.log('👥 [DEUDORES] Total estudiantes:', students.length);
        console.log('📚 [DEUDORES] Total cursos:', courses.length);

        const today = new Date();
        const byStudent = new Map();

        inscriptions.forEach((ins, insIndex) => {
            console.log(`\n📝 [INSCRIPCIÓN ${insIndex + 1}/${inscriptions.length}]`, {
                id: ins.id,
                studentId: ins.studentId,
                courseId: ins.courseId,
                status: ins.status,
                installments: ins.installments?.length || 0
            });

            const student = students.find(s => s.id === ins.studentId);
            const course = courses.find(c => c.id === ins.courseId);

            if (!student) {
                console.warn('⚠️ [DEUDORES] Estudiante no encontrado:', ins.studentId);
                return;
            }
            if (!course) {
                console.warn('⚠️ [DEUDORES] Curso no encontrado:', ins.courseId);
                return;
            }

            // ✅ Filtrar cuotas con pending > 0
            const cuotasPendientes = (ins.installments || []).filter(inst => {
                const dueDate = new Date(inst.dueDate);
                const isOverdue = dueDate < today;

                // ✅ Usar el monto correcto según si está vencida
                const montoActual = isOverdue
                    ? (Number(inst.amountVencido) || Number(inst.amount) || 0)
                    : (Number(inst.amountEnFecha) || Number(inst.amount) || 0);

                const pending = montoActual - Number(inst.amountPaid || 0);

                console.log(`  💰 Cuota #${inst.number}: ${isOverdue ? 'VENCIDA' : 'EN FECHA'} - monto=${montoActual}, paid=${inst.amountPaid}, pending=${pending}`);

                return pending > 0;
            });

            console.log(`✅ Cuotas pendientes: ${cuotasPendientes.length}/${ins.installments?.length || 0}`);

            if (cuotasPendientes.length === 0) {
                console.log('⏭️ No tiene cuotas pendientes, saltando...');
                return;
            }

            if (!byStudent.has(ins.studentId)) {
                byStudent.set(ins.studentId, {
                    studentId: ins.studentId,
                    studentName: `${student.nombre} ${student.apellido}`,
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

            // ✅ Procesar cada cuota con el monto correcto
            const cuotasData = cuotasPendientes.map(inst => {
                const dueDate = new Date(inst.dueDate);
                const isOverdue = dueDate < today;

                // ✅ Usar monto según fecha
                const montoActual = isOverdue
                    ? (Number(inst.amountVencido) || Number(inst.amount) || 0)
                    : (Number(inst.amountEnFecha) || Number(inst.amount) || 0);

                const pending = montoActual - Number(inst.amountPaid || 0);

                return {
                    installmentNumber: inst.number,
                    dueDate: inst.dueDate,
                    amountEnFecha: Number(inst.amountEnFecha || inst.amount || 0),
                    amountVencido: Number(inst.amountVencido || inst.amount || 0),
                    montoActual: montoActual, // ✅ Monto que debe pagar HOY
                    amountPaid: Number(inst.amountPaid || 0),
                    pending: pending,
                    isOverdue: isOverdue,
                    estado: inst.status || 'Pendiente'
                };
            });

            const totalCurso = cuotasData.reduce((sum, c) => sum + c.pending, 0);
            deudor.totalPending += totalCurso;
            deudor.cuotas.push(...cuotasData);

            deudor.cursos.push({
                courseName: course.nombre || ins.courseName,
                inscriptionId: ins.id,
                estadoCurso: ins.status || 'Cursando',
                fechaInscripcion: ins.createdAt || ins.fechaInscripcion,
                cuotas: cuotasData
            });

            console.log(`✅ Deudor: ${deudor.studentName}, Total: $${deudor.totalPending}`);
        });

        const result = Array.from(byStudent.values()).sort((a, b) => b.totalPending - a.totalPending);

        console.log('\n🎯 [DEUDORES] RESULTADO FINAL:');
        console.log(`   Total deudores: ${result.length}`);
        console.log(`   Deuda total: $${result.reduce((sum, d) => sum + d.totalPending, 0)}`);

        return result;
    }, [students, inscriptions, courses]);

    const deudoresFiltrados = useMemo(() => {
        let filtered = debtors;

        // Filtro de búsqueda por texto
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(d =>
                d.studentName.toLowerCase().includes(searchLower) ||
                d.contact.email.toLowerCase().includes(searchLower) ||
                d.contact.telefono.includes(search)
            );
        }

        // Aplicar filtros combinados (tipo y fecha)
        filtered = filtered.map(d => {
            const cursosFiltrados = d.cursos.map(curso => {
                const cuotasFiltradas = curso.cuotas.filter(c => {
                    // Filtro por tipo (vencidas/mesActual/todos)
                    let pasaFiltroTipo = true;
                    if (filtroTipo === 'vencidas') pasaFiltroTipo = c.isOverdue;
                    else if (filtroTipo === 'mesActual') pasaFiltroTipo = isCurrentMonth(c.dueDate);

                    // Filtro por rango de fechas
                    const pasaFiltroFecha = cuotaCoincideConFiltroFecha(c);

                    return pasaFiltroTipo && pasaFiltroFecha;
                });
                return { ...curso, cuotas: cuotasFiltradas };
            }).filter(curso => curso.cuotas.length > 0);

            if (cursosFiltrados.length === 0) return null;

            const totalPending = cursosFiltrados.reduce(
                (sum, curso) => sum + curso.cuotas.reduce((s, c) => s + c.pending, 0), 0
            );

            return {
                ...d,
                cursos: cursosFiltrados,
                cuotas: cursosFiltrados.flatMap(c => c.cuotas),
                totalPending
            };
        }).filter(d => d !== null);

        return filtered;
    }, [debtors, search, filtroTipo, filtroFecha]);

    const stats = useMemo(() => {
        return {
            totalDeudores: deudoresFiltrados.length,
            totalDeuda: deudoresFiltrados.reduce((sum, d) => sum + (d.totalPending || 0), 0),
            totalCuotas: deudoresFiltrados.reduce((sum, d) => sum + (d.cuotas?.length || 0), 0),
            cuotasVencidas: deudoresFiltrados.reduce((sum, d) =>
                sum + ((d.cuotas || []).filter(c => c.isOverdue).length), 0
            )
        };
    }, [deudoresFiltrados]);

    const tieneFiltrosActivos = search || filtroTipo !== 'todos' || filtroFecha.desde || filtroFecha.hasta;

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50 p-4 lg:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-600 to-blue-600 rounded-2xl shadow-2xl p-6 lg:p-8 text-white"
                >
                    <h1 className="text-2xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
                        <FiAlertCircle className="w-6 h-6 lg:w-10 lg:h-10" />
                        Gestión de Deudores
                    </h1>
                    <p className="text-red-100 text-sm lg:text-base">
                        Control y seguimiento de cuotas pendientes de pago
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
                >
                    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border-l-4 border-red-500">
                        <div className="text-xl lg:text-3xl font-bold text-red-700 mb-1">
                            {stats.totalDeudores}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600">
                            {stats.totalDeudores === 1 ? 'Deudor' : 'Deudores'}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border-l-4 border-blue-500">
                        <div className="text-xl lg:text-3xl font-bold text-blue-700 mb-1">
                            ${formatNumber(stats.totalDeuda)}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600">Total Pendiente</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border-l-4 border-red-400">
                        <div className="text-xl lg:text-3xl font-bold text-red-700 mb-1">
                            {stats.totalCuotas}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600">
                            {stats.totalCuotas === 1 ? 'Cuota Pendiente' : 'Cuotas Pendientes'}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border-l-4 border-blue-400">
                        <div className="text-xl lg:text-3xl font-bold text-blue-700 mb-1">
                            {stats.cuotasVencidas}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600">
                            {stats.cuotasVencidas === 1 ? 'Cuota Vencida' : 'Cuotas Vencidas'}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-4 lg:p-6 space-y-4"
                >
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, email o teléfono..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 lg:pl-10 pr-4 py-2 lg:py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-black text-sm lg:text-base"
                                />
                            </div>
                        </div>

                        <div className="lg:w-64">
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full px-4 py-2 lg:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-black bg-white text-sm lg:text-base"
                            >
                                <option value="todos">Todas las cuotas</option>
                                <option value="mesActual">Mes actual</option>
                                <option value="vencidas">Solo vencidas</option>
                            </select>
                        </div>

                        <FiltroRangoFechas
                            filtroFecha={filtroFecha}
                            setFiltroFecha={setFiltroFecha}
                            showNotification={showNotification}
                        />
                    </div>

                    {tieneFiltrosActivos && (
                        <div className="flex items-center justify-between bg-red-50 px-3 lg:px-4 py-2 rounded-lg">
                            <span className="text-xs lg:text-sm text-red-700">
                                Mostrando {deudoresFiltrados.length} de {debtors.length} deudores
                                {(filtroFecha.desde || filtroFecha.hasta) && ' • Con filtro de fechas'}
                            </span>
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setFiltroTipo('todos');
                                    setFiltroFecha({ desde: null, hasta: null });
                                }}
                                className="text-xs lg:text-sm text-red-600 hover:text-red-800 font-semibold"
                            >
                                Limpiar todos los filtros
                            </button>
                        </div>
                    )}
                </motion.div>

                <div className="space-y-4 lg:space-y-6">
                    {deudoresFiltrados.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-xl shadow-lg p-8 lg:p-12 text-center"
                        >
                            <FiAlertCircle className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-700 mb-2">
                                No hay deudores
                            </h3>
                            <p className="text-gray-500 text-sm lg:text-base">
                                {tieneFiltrosActivos
                                    ? 'No se encontraron deudores con los filtros aplicados'
                                    : '¡Todos los alumnos están al día con sus pagos!'}
                            </p>
                        </motion.div>
                    ) : (
                        deudoresFiltrados.map((alumno) => (
                            <AlumnoCard
                                key={alumno.studentId}
                                alumno={alumno}
                                showNotification={showNotification}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}