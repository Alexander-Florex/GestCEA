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
    FiPercent, FiArchive, FiRefreshCw, FiChevronRight,
    FiChevronLeft, FiMoreVertical, FiExternalLink,
    FiSun, FiMoon, FiClock as FiClockIcon, FiMapPin
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

const getDayOfWeek = (date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date(date).getDay()];
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

/* ==================== Sistema de Colores ==================== */
const getRowColor = (cuota, cuotasPorAlumno) => {
    // Calcular días restantes para el vencimiento
    const today = new Date();
    const dueDate = new Date(cuota.dueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    // Contar cuotas vencidas de este alumno
    const totalCuotasVencidas = cuotasPorAlumno[cuota.studentId]?.vencidas || 0;
    const totalCuotasPendientes = cuotasPorAlumno[cuota.studentId]?.pendientes || 0;

    // Si la cuota ya está vencida
    if (cuota.isOverdue) {
        // ROJO: Deudor con más de 1 cuota vencida
        if (totalCuotasVencidas > 1) {
            return {
                bg: 'bg-red-50 hover:bg-red-100',
                border: 'border-l-4 border-l-red-500',
                text: 'text-red-900',
                indicator: 'bg-red-500'
            };
        }
        // NARANJA: Debe exactamente 1 cuota vencida
        else if (totalCuotasVencidas === 1) {
            return {
                bg: 'bg-orange-50 hover:bg-orange-100',
                border: 'border-l-4 border-l-orange-500',
                text: 'text-orange-900',
                indicator: 'bg-orange-500'
            };
        }
    }

    // Si la cuota no está vencida
    if (daysUntilDue > 0) {
        // AMARILLO: La fecha de vencimiento está muy cerca a mitad del tiempo
        // Calculamos el "punto medio" del período
        const periodoTotal = 30; // Asumiendo 30 días como período estándar (se puede ajustar)
        const diasDesdeInicio = periodoTotal - daysUntilDue;
        const mitadTiempo = periodoTotal / 2;

        const estaEnMitadTiempo = Math.abs(diasDesdeInicio - mitadTiempo) <= 3;

        if (estaEnMitadTiempo && daysUntilDue <= 15) {
            return {
                bg: 'bg-yellow-50 hover:bg-yellow-100',
                border: 'border-l-4 border-l-yellow-500',
                text: 'text-yellow-900',
                indicator: 'bg-yellow-500'
            };
        }

        // VERDE: No es deudor y tiene mucho tiempo para abonar (más de 15 días)
        if (daysUntilDue > 15) {
            return {
                bg: 'bg-green-50 hover:bg-green-100',
                border: 'border-l-4 border-l-green-500',
                text: 'text-green-900',
                indicator: 'bg-green-500'
            };
        }

        // VERDE CLARO: Tiene tiempo pero no tanto (7-15 días)
        if (daysUntilDue >= 7 && daysUntilDue <= 15) {
            return {
                bg: 'bg-green-50 hover:bg-green-100',
                border: 'border-l-4 border-l-green-400',
                text: 'text-green-800',
                indicator: 'bg-green-400'
            };
        }

        // AMARILLO: Pocos días restantes (1-6 días)
        if (daysUntilDue >= 1 && daysUntilDue <= 6) {
            return {
                bg: 'bg-yellow-50 hover:bg-yellow-100',
                border: 'border-l-4 border-l-yellow-500',
                text: 'text-yellow-900',
                indicator: 'bg-yellow-500'
            };
        }
    }

    // Color por defecto (gris)
    return {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-l-4 border-l-gray-400',
        text: 'text-gray-900',
        indicator: 'bg-gray-400'
    };
};

/* ==================== Filtro Mejorado con Todos los Filtros ==================== */
function FiltroAvanzado({
                            filtroFecha, setFiltroFecha,
                            filtroTipo, setFiltroTipo,
                            filtroCurso, setFiltroCurso,
                            filtroDia, setFiltroDia,
                            filtroHorario, setFiltroHorario,
                            filtroMonto, setFiltroMonto,
                            filtroNumeroCuota, setFiltroNumeroCuota,
                            cursosLista,
                            showNotification
                        }) {
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [mostrarFiltroEspecifico, setMostrarFiltroEspecifico] = useState('');

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horarios = ['Mañana', 'Tarde', 'Noche'];
    const rangosMontos = [
        { label: 'Menos de $10,000', value: '0-10000' },
        { label: '$10,000 - $50,000', value: '10000-50000' },
        { label: '$50,000 - $100,000', value: '50000-100000' },
        { label: 'Más de $100,000', value: '100000-' }
    ];
    const numerosCuotas = Array.from({ length: 12 }, (_, i) => i + 1);

    const limpiarFiltros = () => {
        setFiltroFecha({ desde: null, hasta: null });
        setFiltroTipo('todos');
        setFiltroCurso('todos');
        setFiltroDia('todos');
        setFiltroHorario('todos');
        setFiltroMonto({ min: '', max: '', rango: 'todos' });
        setFiltroNumeroCuota('todos');
        setMostrarFiltros(false);
        showNotification('info', 'Todos los filtros limpiados');
    };

    const aplicarFiltros = () => {
        setMostrarFiltros(false);
        let mensaje = 'Filtros aplicados: ';
        const filtros = [];

        if (filtroTipo !== 'todos') filtros.push(filtroTipo === 'vencidas' ? 'Solo vencidas' : 'Este mes');
        if (filtroCurso !== 'todos') filtros.push(`Curso: ${filtroCurso}`);
        if (filtroDia !== 'todos') filtros.push(`Día: ${filtroDia}`);
        if (filtroHorario !== 'todos') filtros.push(`Horario: ${filtroHorario}`);
        if (filtroMonto.rango !== 'todos' || filtroMonto.min || filtroMonto.max) filtros.push('Rango de montos');
        if (filtroNumeroCuota !== 'todos') filtros.push(`Cuota: ${filtroNumeroCuota}`);
        if (filtroFecha.desde || filtroFecha.hasta) filtros.push('Rango de fechas');

        mensaje += filtros.join(', ') || 'Todos';
        showNotification('success', mensaje);
    };

    const tieneFiltros = filtroTipo !== 'todos' || filtroFecha.desde || filtroFecha.hasta ||
        filtroCurso !== 'todos' || filtroDia !== 'todos' || filtroHorario !== 'todos' ||
        filtroMonto.rango !== 'todos' || filtroMonto.min || filtroMonto.max ||
        filtroNumeroCuota !== 'todos';

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
                <span>Filtros Avanzados</span>
                {tieneFiltros && (
                    <span className="ml-1 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        +
                    </span>
                )}
            </button>

            <AnimatePresence>
                {mostrarFiltros && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-5 max-h-[80vh] overflow-y-auto"
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

                            {/* Filtro por tipo de cuota */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiAlertCircle className="w-4 h-4" />
                                    Tipo de cuota:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'todos', label: 'Todos', icon: FiUsers, color: 'gray' },
                                        { value: 'vencidas', label: 'Vencidas', icon: FiAlertCircle, color: 'red' },
                                        { value: 'mesActual', label: 'Este mes', icon: FiCalendar, color: 'blue' }
                                    ].map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setFiltroTipo(option.value)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${filtroTipo === option.value
                                                    ? `bg-${option.color}-50 border-${option.color}-500 text-${option.color}-700`
                                                    : 'bg-gray-50 border-gray-300 hover:border-blue-400'
                                                }`}
                                            >
                                                <Icon className={`w-4 h-4 mb-1 ${filtroTipo === option.value ? `text-${option.color}-600` : 'text-gray-500'}`} />
                                                <span className="text-xs font-medium">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Filtro por curso */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiFileText className="w-4 h-4" />
                                    Curso:
                                </label>
                                <select
                                    value={filtroCurso}
                                    onChange={(e) => setFiltroCurso(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="todos">Todos los cursos</option>
                                    {cursosLista.map((curso, idx) => (
                                        <option key={idx} value={curso}>{curso}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por día de la semana */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiCalendar className="w-4 h-4" />
                                    Día de la semana:
                                </label>
                                <select
                                    value={filtroDia}
                                    onChange={(e) => setFiltroDia(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="todos">Todos los días</option>
                                    {diasSemana.map((dia, idx) => (
                                        <option key={idx} value={dia}>{dia}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por horario */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiClockIcon className="w-4 h-4" />
                                    Horario:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {horarios.map((horario) => (
                                        <button
                                            key={horario}
                                            onClick={() => setFiltroHorario(filtroHorario === horario ? 'todos' : horario)}
                                            className={`p-2 rounded-lg border text-sm ${filtroHorario === horario
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-gray-50 border-gray-300 hover:border-blue-400'
                                            }`}
                                        >
                                            {horario}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filtro por monto */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiDollarSign className="w-4 h-4" />
                                    Monto a pagar:
                                </label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Mínimo"
                                            value={filtroMonto.min}
                                            onChange={(e) => setFiltroMonto(prev => ({ ...prev, min: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Máximo"
                                            value={filtroMonto.max}
                                            onChange={(e) => setFiltroMonto(prev => ({ ...prev, max: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <select
                                        value={filtroMonto.rango}
                                        onChange={(e) => setFiltroMonto(prev => ({ ...prev, rango: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="todos">Todos los montos</option>
                                        {rangosMontos.map((rango, idx) => (
                                            <option key={idx} value={rango.value}>{rango.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Filtro por número de cuota */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiCreditCard className="w-4 h-4" />
                                    Número de cuota:
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={filtroNumeroCuota}
                                        onChange={(e) => setFiltroNumeroCuota(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="todos">Todas las cuotas</option>
                                        {numerosCuotas.map((numero) => (
                                            <option key={numero} value={numero}>Cuota #{numero}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Filtro por rango de fechas */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiCalendar className="w-4 h-4" />
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

/* ==================== Componente de Fila de Tabla con Colores ==================== */
function DeudorFila({ cuota, index, selected, onSelect, onSendWhatsApp, onSendEmail, cuotasPorAlumno }) {
    const diasAtraso = getDaysLate(cuota.dueDate);
    const rowColor = getRowColor(cuota, cuotasPorAlumno);

    const getStatusColor = () => {
        if (cuota.isPaid) return 'bg-green-100 text-green-800';
        if (cuota.isOverdue) return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    const getStatusText = () => {
        if (cuota.isPaid) return 'Pagada';
        if (cuota.isOverdue) return 'Vencida';
        return 'Pendiente';
    };

    // Calcular días restantes
    const today = new Date();
    const dueDate = new Date(cuota.dueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    // Determinar etiqueta de proximidad
    const getProximityLabel = () => {
        if (cuota.isOverdue) return 'Vencido';
        if (daysUntilDue <= 0) return 'Vence hoy';
        if (daysUntilDue <= 3) return 'Muy pronto';
        if (daysUntilDue <= 7) return 'Próximo';
        return 'Lejano';
    };

    return (
        <tr className={`border-b border-gray-200 transition-all duration-300 ${rowColor.bg} ${rowColor.border}`}>
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onSelect(cuota)}
                    disabled={cuota.isPaid}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${rowColor.indicator}`}></div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {cuota.studentName}
                        </div>
                        <div className="text-xs text-gray-500">
                            {getProximityLabel()}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-700">
                    {cuota.courseName}
                </div>
                <div className="text-xs text-gray-500">
                    {cuota.contact.telefono || 'Sin teléfono'}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="text-sm font-bold text-gray-900">
                    Cuota #{cuota.installmentNumber}
                </div>
                <div className="text-xs text-gray-500">
                    {getDayOfWeek(cuota.dueDate)}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="text-sm text-gray-700">
                    {formatDate(cuota.dueDate)}
                </div>
                {cuota.isOverdue ? (
                    <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                        <FiClock className="w-3 h-3" />
                        {diasAtraso} días de atraso
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">
                        {daysUntilDue > 0 ? `${daysUntilDue} días restantes` : 'Vence hoy'}
                    </div>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="text-sm font-semibold text-gray-900">
                    ${formatNumber(cuota.pending)}
                </div>
                {cuota.amountEnFecha !== cuota.amountVencido && (
                    <div className="text-xs text-gray-500">
                        <span className="line-through">${formatNumber(cuota.amountEnFecha)}</span>
                        <span className="ml-1 text-red-600">${formatNumber(cuota.amountVencido)}</span>
                    </div>
                )}
            </td>
            <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onSendWhatsApp(cuota)}
                        disabled={!cuota.contact.telefono}
                        className={`p-2 rounded-lg transition-colors ${cuota.contact.telefono
                            ? 'text-green-600 hover:bg-green-50 hover:text-green-700'
                            : 'text-gray-300 cursor-not-allowed'}`}
                        title="Enviar WhatsApp"
                    >
                        <FiMessageSquare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onSendEmail(cuota)}
                        disabled={!cuota.contact.email}
                        className={`p-2 rounded-lg transition-colors ${cuota.contact.email
                            ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                            : 'text-gray-300 cursor-not-allowed'}`}
                        title="Enviar Email"
                    >
                        <FiMail className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

/* ==================== Componente Principal ==================== */
export default function Deudores() {
    const { students = [], inscriptions = [], courses = [] } = useDB();
    const [notifications, setNotifications] = useState([]);
    const [search, setSearch] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroFecha, setFiltroFecha] = useState({ desde: null, hasta: null });
    const [filtroCurso, setFiltroCurso] = useState('todos');
    const [filtroDia, setFiltroDia] = useState('todos');
    const [filtroHorario, setFiltroHorario] = useState('todos');
    const [filtroMonto, setFiltroMonto] = useState({ min: '', max: '', rango: 'todos' });
    const [filtroNumeroCuota, setFiltroNumeroCuota] = useState('todos');
    const [selectedCuotas, setSelectedCuotas] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sortConfig, setSortConfig] = useState({ key: 'studentName', direction: 'ascending' });

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Obtener lista de cursos únicos para el filtro
    const cursosLista = useMemo(() => {
        const nombres = courses.map(c => c.nombre).filter(Boolean);
        return [...new Set(nombres)].sort();
    }, [courses]);

    // Calcular todas las cuotas pendientes
    const allCuotas = useMemo(() => {
        console.log('\n🔍 [DEUDORES] Calculando cuotas...');
        console.log('   Estudiantes:', students.length);
        console.log('   Inscripciones:', inscriptions.length);
        console.log('   Cursos:', courses.length);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cuotasArray = [];

        inscriptions.forEach((ins) => {
            const student = students.find(s => s.id === ins.studentId);
            const course = courses.find(c => c.id === ins.courseId);

            if (!student || !course) return;

            const todasLasCuotas = (ins.installments || []).filter(inst => true);

            todasLasCuotas.forEach(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const isOverdue = !inst.frozen && today > dueDate;

                const defaultMethod = ins.paymentType || 'Transferencia';
                const montoActual = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, isOverdue);
                const pending = Math.max(montoActual - Number(inst.amountPaid || 0), 0);

                const isPaid = pending === 0 || inst.status === 'Pagada' || inst.status === 'Pagado';

                if (!isPaid) {
                    cuotasArray.push({
                        id: `${ins.id}-${inst.number}-${inst.dueDate}`,
                        studentId: student.id,
                        studentName: `${student.apellido} ${student.nombre}`,
                        contact: {
                            email: student.email || '',
                            telefono: student.telefono || ''
                        },
                        courseId: course.id,
                        courseName: course.nombre,
                        installmentNumber: inst.number,
                        dueDate: inst.dueDate,
                        amountEnFecha: calcularPrecioPorMetodo(ins, course, inst, defaultMethod, false),
                        amountVencido: calcularPrecioPorMetodo(ins, course, inst, defaultMethod, true),
                        montoActual: montoActual,
                        amountPaid: Number(inst.amountPaid || 0),
                        pending: pending,
                        isOverdue: isOverdue,
                        frozen: inst.frozen || false,
                        estado: inst.status || 'Pendiente',
                        isPaid: isPaid,
                        inscriptionId: ins.id
                    });
                }
            });
        });

        console.log(`🎯 [DEUDORES] Total cuotas pendientes: ${cuotasArray.length}`);
        return cuotasArray;
    }, [students, inscriptions, courses]);

    // Calcular estadísticas por alumno para el sistema de colores
    const cuotasPorAlumno = useMemo(() => {
        const stats = {};
        allCuotas.forEach(cuota => {
            if (!stats[cuota.studentId]) {
                stats[cuota.studentId] = {
                    vencidas: 0,
                    pendientes: 0,
                    total: 0
                };
            }
            stats[cuota.studentId].pendientes++;
            stats[cuota.studentId].total += cuota.pending;
            if (cuota.isOverdue) {
                stats[cuota.studentId].vencidas++;
            }
        });
        return stats;
    }, [allCuotas]);

    // Filtrar cuotas con todos los filtros
    const cuotasFiltradas = useMemo(() => {
        let filtered = allCuotas;

        // Filtro de búsqueda
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(c =>
                c.studentName.toLowerCase().includes(searchLower) ||
                c.courseName.toLowerCase().includes(searchLower) ||
                c.contact.email.toLowerCase().includes(searchLower) ||
                c.contact.telefono.includes(search)
            );
        }

        // Filtro por tipo
        if (filtroTipo === 'vencidas') {
            filtered = filtered.filter(c => c.isOverdue);
        } else if (filtroTipo === 'mesActual') {
            filtered = filtered.filter(c => isCurrentMonth(c.dueDate));
        }

        // Filtro por curso
        if (filtroCurso !== 'todos') {
            filtered = filtered.filter(c => c.courseName === filtroCurso);
        }

        // Filtro por día de la semana
        if (filtroDia !== 'todos') {
            filtered = filtered.filter(c => {
                const diaCuota = getDayOfWeek(c.dueDate);
                return diaCuota === filtroDia;
            });
        }

        // Filtro por horario (simulado - necesitarías agregar horarios a los cursos)
        if (filtroHorario !== 'todos') {
            // Esto es un ejemplo - necesitas tener datos de horario en tus cursos
            filtered = filtered.filter(c => {
                // Asumiendo que el curso tiene un campo 'horario'
                const course = courses.find(course => course.id === c.courseId);
                return course && course.horario === filtroHorario;
            });
        }

        // Filtro por monto
        if (filtroMonto.min !== '' || filtroMonto.max !== '' || filtroMonto.rango !== 'todos') {
            filtered = filtered.filter(c => {
                const monto = c.pending;

                // Filtro por rango personalizado
                if (filtroMonto.min !== '' && monto < Number(filtroMonto.min)) return false;
                if (filtroMonto.max !== '' && monto > Number(filtroMonto.max)) return false;

                // Filtro por rangos predefinidos
                if (filtroMonto.rango !== 'todos') {
                    const [min, max] = filtroMonto.rango.split('-').map(Number);
                    if (max && (monto < min || monto > max)) return false;
                    if (!max && monto < min) return false;
                }

                return true;
            });
        }

        // Filtro por número de cuota
        if (filtroNumeroCuota !== 'todos') {
            filtered = filtered.filter(c =>
                Number(c.installmentNumber) === Number(filtroNumeroCuota)
            );
        }

        // Filtro por fecha
        if (filtroFecha.desde || filtroFecha.hasta) {
            filtered = filtered.filter(c => {
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
        }

        return filtered;
    }, [allCuotas, search, filtroTipo, filtroCurso, filtroDia, filtroHorario, filtroMonto, filtroNumeroCuota, filtroFecha, courses]);

    // Ordenar cuotas
    const cuotasOrdenadas = useMemo(() => {
        const sorted = [...cuotasFiltradas];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Manejar fechas
                if (sortConfig.key === 'dueDate') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                // Manejar números
                if (sortConfig.key === 'pending' || sortConfig.key === 'installmentNumber') {
                    aValue = Number(aValue);
                    bValue = Number(bValue);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sorted;
    }, [cuotasFiltradas, sortConfig]);

    // Paginación
    const totalPages = Math.ceil(cuotasOrdenadas.length / itemsPerPage);
    const paginatedCuotas = cuotasOrdenadas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats con información de colores
    const stats = useMemo(() => {
        const uniqueStudents = [...new Set(cuotasFiltradas.map(c => c.studentId))];

        // Contar por colores
        let rojoCount = 0;
        let naranjaCount = 0;
        let amarilloCount = 0;
        let verdeCount = 0;

        cuotasFiltradas.forEach(cuota => {
            const rowColor = getRowColor(cuota, cuotasPorAlumno);
            if (rowColor.bg.includes('red')) rojoCount++;
            else if (rowColor.bg.includes('orange')) naranjaCount++;
            else if (rowColor.bg.includes('yellow')) amarilloCount++;
            else if (rowColor.bg.includes('green')) verdeCount++;
        });

        return {
            totalDeudores: uniqueStudents.length,
            totalDeuda: cuotasFiltradas.reduce((sum, c) => sum + (c.pending || 0), 0),
            totalCuotas: cuotasFiltradas.length,
            cuotasVencidas: cuotasFiltradas.filter(c => c.isOverdue).length,
            cursosConDeuda: [...new Set(cuotasFiltradas.map(c => c.courseName))].length,
            porColor: {
                rojo: rojoCount,
                naranja: naranjaCount,
                amarillo: amarilloCount,
                verde: verdeCount
            }
        };
    }, [cuotasFiltradas, cuotasPorAlumno]);

    // Funciones de ordenamiento
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Funciones para selección de cuotas
    const toggleCuota = (cuota) => {
        setSelectedCuotas(prev => {
            const exists = prev.some(c => c.id === cuota.id);
            if (exists) {
                return prev.filter(c => c.id !== cuota.id);
            } else {
                return [...prev, cuota];
            }
        });
    };

    const selectAllPage = () => {
        const allPageCuotas = paginatedCuotas.filter(c => !c.isPaid);
        setSelectedCuotas(prev => {
            const newSelected = [...prev];
            allPageCuotas.forEach(cuota => {
                if (!prev.some(c => c.id === cuota.id)) {
                    newSelected.push(cuota);
                }
            });
            return newSelected;
        });
    };

    const clearSelection = () => {
        setSelectedCuotas([]);
    };

    // Funciones para enviar recordatorios
    const generateMessageForCuota = (cuota) => {
        const diasAtraso = getDaysLate(cuota.dueDate);
        let message = `Hola ${cuota.studentName}, te recordamos que tienes una cuota pendiente:\n\n`;
        message += `📅 *DETALLE DE CUOTA*\n`;
        message += `• Curso: ${cuota.courseName}\n`;
        message += `• Cuota #${cuota.installmentNumber}\n`;
        message += `• Monto: $${formatNumber(cuota.pending)}\n`;
        message += `• Vencimiento: ${formatDate(cuota.dueDate)} (${getDayOfWeek(cuota.dueDate)})\n`;

        if (cuota.isOverdue) {
            message += `• Estado: VENCIDA (${diasAtraso} días de atraso)\n`;
        } else {
            const daysUntilDue = Math.ceil((new Date(cuota.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            message += `• Estado: PENDIENTE (vence en ${daysUntilDue} días)\n`;
        }

        message += `\n💰 *TOTAL: $${formatNumber(cuota.pending)}*\n\n`;
        message += `Por favor, regulariza tu pago lo antes posible.`;

        return message;
    };

    const handleSendWhatsApp = (cuota) => {
        const message = generateMessageForCuota(cuota);
        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = cuota.contact.telefono?.replace(/\D/g, '');

        if (phoneNumber) {
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
            showNotification('success', `WhatsApp enviado a ${cuota.studentName}`);
        } else {
            showNotification('error', 'No hay número de teléfono para enviar WhatsApp');
        }
    };

    const handleSendEmail = (cuota) => {
        const message = generateMessageForCuota(cuota);
        const subject = `Recordatorio de pago - ${cuota.studentName}`;
        const mailto = `mailto:${cuota.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        window.location.href = mailto;
        showNotification('info', `Email preparado para ${cuota.studentName}`);
    };

    // Envío masivo
    const handleBulkSendWhatsApp = () => {
        if (selectedCuotas.length === 0) {
            showNotification('warning', 'Selecciona al menos una cuota para enviar');
            return;
        }

        // Agrupar por estudiante
        const cuotasPorEstudiante = selectedCuotas.reduce((acc, cuota) => {
            if (!acc[cuota.studentId]) {
                acc[cuota.studentId] = {
                    studentName: cuota.studentName,
                    phone: cuota.contact.telefono,
                    cuotas: []
                };
            }
            acc[cuota.studentId].cuotas.push(cuota);
            return acc;
        }, {});

        // Enviar mensaje al primer estudiante
        const firstStudent = Object.values(cuotasPorEstudiante)[0];
        if (firstStudent && firstStudent.phone) {
            const total = firstStudent.cuotas.reduce((sum, c) => sum + c.pending, 0);
            let message = `Hola ${firstStudent.studentName}, te recordamos tus cuotas pendientes:\n\n`;

            firstStudent.cuotas.forEach(cuota => {
                const diasAtraso = getDaysLate(cuota.dueDate);
                message += `• ${cuota.courseName} - Cuota #${cuota.installmentNumber}: $${formatNumber(cuota.pending)} (Vence: ${formatDate(cuota.dueDate)})${cuota.isOverdue ? ` - VENCIDA (${diasAtraso} días)` : ''}\n`;
            });

            message += `\n💰 *TOTAL: $${formatNumber(total)}*\n\n`;
            message += `Por favor, regulariza tu situación lo antes posible.`;

            const encodedMessage = encodeURIComponent(message);
            const phoneNumber = firstStudent.phone.replace(/\D/g, '');
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
            showNotification('success', `WhatsApp enviado a ${firstStudent.studentName}`);
        } else {
            showNotification('error', 'No hay número de teléfono para enviar WhatsApp');
        }
    };

    const tieneFiltrosActivos = search || filtroTipo !== 'todos' || filtroFecha.desde || filtroFecha.hasta ||
        filtroCurso !== 'todos' || filtroDia !== 'todos' || filtroHorario !== 'todos' ||
        filtroMonto.rango !== 'todos' || filtroMonto.min || filtroMonto.max ||
        filtroNumeroCuota !== 'todos';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 lg:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

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

                {/* Stats Cards con información de colores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
                                <div className="text-sm text-gray-600">Deudores</div>
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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-xl shadow-lg p-5 border border-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                                <FiFileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{stats.cursosConDeuda}</div>
                                <div className="text-sm text-gray-600">Cursos con deuda</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-xl shadow-lg p-5 border border-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
                                <FiFilter className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{cuotasFiltradas.length}</div>
                                <div className="text-sm text-gray-600">Cuotas filtradas</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Leyenda de colores */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Leyenda de colores:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-gray-700">Rojo: +1 cuota vencida</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-sm text-gray-700">Naranja: 1 cuota vencida</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-sm text-gray-700">Amarillo: mitad de tiempo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm text-gray-700">Verde: mucho tiempo</span>
                        </div>
                    </div>
                </div>

                {/* Search, Filters and Bulk Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                >
                    <div className="space-y-4">
                        {/* Search and Filter Row */}
                        <div className="flex flex-col lg:flex-row gap-3">
                            <div className="flex-1">
                                <div className="relative">
                                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por alumno, curso, email o teléfono..."
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
                                filtroCurso={filtroCurso}
                                setFiltroCurso={setFiltroCurso}
                                filtroDia={filtroDia}
                                setFiltroDia={setFiltroDia}
                                filtroHorario={filtroHorario}
                                setFiltroHorario={setFiltroHorario}
                                filtroMonto={filtroMonto}
                                setFiltroMonto={setFiltroMonto}
                                filtroNumeroCuota={filtroNumeroCuota}
                                setFiltroNumeroCuota={setFiltroNumeroCuota}
                                cursosLista={cursosLista}
                                showNotification={showNotification}
                            />
                        </div>

                        {/* Bulk Actions */}
                        {selectedCuotas.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-blue-700 font-bold">{selectedCuotas.length}</span>
                                            <span className="text-blue-600">cuotas seleccionadas</span>
                                        </div>
                                        <div className="text-xl font-bold text-blue-800">
                                            ${formatNumber(selectedCuotas.reduce((sum, c) => sum + c.pending, 0))}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={clearSelection}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <FiX className="w-4 h-4" />
                                            Deseleccionar todas
                                        </button>
                                        <button
                                            onClick={handleBulkSendWhatsApp}
                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all shadow-md flex items-center gap-2"
                                        >
                                            <FiMessageSquare className="w-4 h-4" />
                                            Enviar WhatsApp (masivo)
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Active Filters */}
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
                                            Mostrando {cuotasFiltradas.length} cuotas de {allCuotas.length} totales
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSearch('');
                                            setFiltroTipo('todos');
                                            setFiltroFecha({ desde: null, hasta: null });
                                            setFiltroCurso('todos');
                                            setFiltroDia('todos');
                                            setFiltroHorario('todos');
                                            setFiltroMonto({ min: '', max: '', rango: 'todos' });
                                            setFiltroNumeroCuota('todos');
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

                {/* Table Container */}
                {cuotasFiltradas.length === 0 ? (
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
                                    ? 'No se encontraron cuotas con los filtros aplicados.'
                                    : 'Excelente trabajo, todas las cuotas están al corriente.'}
                            </p>
                            {tieneFiltrosActivos && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setFiltroTipo('todos');
                                        setFiltroFecha({ desde: null, hasta: null });
                                        setFiltroCurso('todos');
                                        setFiltroDia('todos');
                                        setFiltroHorario('todos');
                                        setFiltroMonto({ min: '', max: '', rango: 'todos' });
                                        setFiltroNumeroCuota('todos');
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-md"
                                >
                                    Ver todas las cuotas
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* Table Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Cuotas Pendientes <span className="text-blue-600">({cuotasFiltradas.length})</span>
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Las filas se colorean automáticamente según el estado del deudor
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={selectAllPage}
                                    className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                                >
                                    Seleccionar página
                                </button>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                                >
                                    <option value={10}>10 por página</option>
                                    <option value={20}>20 por página</option>
                                    <option value={50}>50 por página</option>
                                    <option value={100}>100 por página</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={paginatedCuotas.length > 0 && paginatedCuotas.every(c => selectedCuotas.some(sc => sc.id === c.id))}
                                            onChange={() => {
                                                if (paginatedCuotas.every(c => selectedCuotas.some(sc => sc.id === c.id))) {
                                                    setSelectedCuotas(prev => prev.filter(c => !paginatedCuotas.some(pc => pc.id === c.id)));
                                                } else {
                                                    const nuevasCuotas = paginatedCuotas.filter(c => !selectedCuotas.some(sc => sc.id === c.id));
                                                    setSelectedCuotas(prev => [...prev, ...nuevasCuotas]);
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('studentName')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Alumno / Estado
                                            {sortConfig.key === 'studentName' && (
                                                <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('courseName')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Curso / Contacto
                                            {sortConfig.key === 'courseName' && (
                                                <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Cuota / Día
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('dueDate')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Vencimiento
                                            {sortConfig.key === 'dueDate' && (
                                                <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('pending')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Monto
                                            {sortConfig.key === 'pending' && (
                                                <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {paginatedCuotas.map((cuota, index) => (
                                    <DeudorFila
                                        key={cuota.id}
                                        cuota={cuota}
                                        index={index}
                                        selected={selectedCuotas.some(c => c.id === cuota.id)}
                                        onSelect={() => toggleCuota(cuota)}
                                        onSendWhatsApp={() => handleSendWhatsApp(cuota)}
                                        onSendEmail={() => handleSendEmail(cuota)}
                                        cuotasPorAlumno={cuotasPorAlumno}
                                    />
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, cuotasOrdenadas.length)}</span> de{" "}
                                    <span className="font-medium">{cuotasOrdenadas.length}</span> cuotas
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                        }`}
                                    >
                                        <FiChevronLeft className="w-4 h-4" />
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium ${currentPage === pageNum
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium ${currentPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                        }`}
                                    >
                                        <FiChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}