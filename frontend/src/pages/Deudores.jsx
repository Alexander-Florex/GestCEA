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

/* ================== FUNCIÓN CRÍTICA: CALCULAR PRECIO SEGÚN MÉTODO ================== */
/**
 * Esta función es IDÉNTICA a la de Cobros.jsx
 * Calcula el precio correcto según:
 * 1. Método de pago (por defecto Transferencia para deudores)
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
    const isPaid = cuota.isPaid;

    // ✅ Si está pagada, no permitir click ni selección
    const handleClick = () => {
        if (isPaid) return; // No hacer nada si está pagada
        onToggle(cuota);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 lg:p-4 rounded-lg border-2 ${
                isPaid
                    ? 'bg-gray-100 border-gray-300 opacity-60'  // ✅ Estilo gris para pagadas
                    : isSelected
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                        : isVencida
                            ? 'bg-red-50 border-red-400'
                            : esMesActual
                                ? 'bg-yellow-50 border-yellow-400'
                                : 'bg-white border-gray-300'
            } shadow-sm ${!isPaid ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed'} transition-all`}
            onClick={handleClick}
        >
            <div className="flex items-start gap-3">
                {showCheckbox && (
                    <div className="flex items-start pt-1">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            isPaid
                                ? 'bg-gray-300 border-gray-400 cursor-not-allowed'  // ✅ Checkbox gris para pagadas
                                : isSelected
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-400 bg-white'
                        }`}>
                            {isSelected && !isPaid && <FiCheck className="w-3 h-3" />}
                            {isPaid && <FiCheck className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold text-sm lg:text-base ${isPaid ? 'text-gray-500' : 'text-gray-800'}`}>
                                {curso.courseName} - Cuota #{cuota.installmentNumber}
                            </span>
                            {/* ✅ Badge PAGADA */}
                            {isPaid && (
                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-semibold">
                                    PAGADA
                                </span>
                            )}
                            {/* Badges de vencida y mes actual solo si NO está pagada */}
                            {!isPaid && isVencida && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
                                    VENCIDA
                                </span>
                            )}
                            {!isPaid && !isVencida && esMesActual && (
                                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full font-semibold">
                                    ESTE MES
                                </span>
                            )}
                        </div>
                        <span className={`text-lg lg:text-xl font-bold ${isPaid ? 'text-gray-500 line-through' : 'text-red-700'}`}>
                            ${formatNumber(cuota.pending)}
                        </span>
                    </div>

                    <div className={`flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm ${isPaid ? 'text-gray-500' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Vence: {formatDate(cuota.dueDate)}</span>
                        </div>
                        {!isPaid && isVencida && (
                            <span className="text-red-600 font-semibold">
                                ({daysLate} {daysLate === 1 ? 'día' : 'días'} de atraso)
                            </span>
                        )}
                        {cuota.amountPaid > 0 && (
                            <span className={`font-semibold ${isPaid ? 'text-green-600' : 'text-green-600'}`}>
                                Pagado: ${formatNumber(cuota.amountPaid)}
                            </span>
                        )}
                    </div>

                    {/* Mostrar precios en fecha y vencido solo si NO está pagada */}
                    {!isPaid && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                En fecha: ${formatNumber(cuota.amountEnFecha)}
                            </span>
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                                Vencido: ${formatNumber(cuota.amountVencido)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

/* ==================== Card de Curso ==================== */
function CursoCard({ curso, selectedCuotas, onToggleCuota, showCheckbox = true }) {
    const [isExpanded, setIsExpanded] = useState(true);

    // ✅ Calcular cuotas pendientes (no pagadas) para los contadores
    const cuotasPendientes = curso.cuotas.filter(c => !c.isPaid);
    const totalCurso = cuotasPendientes.reduce((sum, c) => sum + c.pending, 0);
    const cuotasVencidas = cuotasPendientes.filter(c => c.isOverdue).length;

    // ✅ Función de comparación para ordenar cuotas (modificada para Deudores)
    const compararCuotas = (a, b) => {
        // 0. PRIMERO: Las pagadas siempre al final
        if (a.isPaid && !b.isPaid) return 1;
        if (!a.isPaid && b.isPaid) return -1;

        // Si ambas están pagadas, ordenar por número de cuota
        if (a.isPaid && b.isPaid) {
            return Number(a.installmentNumber) - Number(b.installmentNumber);
        }

        // 1. Segundo: vencidas vs no vencidas (entre las no pagadas)
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;

        // 2. Si ambas vencidas: más días de atraso primero
        if (a.isOverdue && b.isOverdue) {
            const diasA = getDaysLate(a.dueDate);
            const diasB = getDaysLate(b.dueDate);
            return diasB - diasA; // Más días primero
        }

        // 3. Si ninguna vencida: más próxima a vencer primero
        const fechaA = new Date(a.dueDate);
        const fechaB = new Date(b.dueDate);
        return fechaA - fechaB;
    };

    // ✅ Ordenar cuotas usando la misma lógica que Cobros.jsx
    const cuotasOrdenadas = [...curso.cuotas].sort(compararCuotas);

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-gradient-to-r from-red-100 to-blue-100 p-3 lg:p-4 cursor-pointer hover:from-red-200 hover:to-blue-200 transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <FiDollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm lg:text-base">{curso.courseName}</h4>
                            <div className="text-xs lg:text-sm text-gray-600">
                                {cuotasPendientes.length} cuota{cuotasPendientes.length !== 1 ? 's' : ''} pendiente{cuotasPendientes.length !== 1 ? 's' : ''}
                                {cuotasVencidas > 0 && (
                                    <span className="text-red-600 font-semibold ml-2">
                                        ({cuotasVencidas} vencida{cuotasVencidas !== 1 ? 's' : ''})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-lg lg:text-xl font-bold text-red-700">
                            ${formatNumber(totalCurso)}
                        </span>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <FiChevronDown className="w-5 h-5 text-gray-600" />
                        </motion.div>
                    </div>
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
                            {/* ✅ Usar cuotasOrdenadas en lugar de curso.cuotas */}
                            {cuotasOrdenadas.map((cuota, idx) => (
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

    // ✅ Calcular cuotas pendientes (no pagadas) para los contadores
    const cuotasPendientes = alumno.cuotas.filter(c => !c.isPaid);
    const totalCuotasPendientes = cuotasPendientes.length;

    // ✅ Función de comparación para ordenar cuotas (modificada para Deudores)
    const compararCuotas = (a, b) => {
        // 0. PRIMERO: Las pagadas siempre al final
        if (a.isPaid && !b.isPaid) return 1;
        if (!a.isPaid && b.isPaid) return -1;

        // Si ambas están pagadas, ordenar por número de cuota
        if (a.isPaid && b.isPaid) {
            return Number(a.installmentNumber) - Number(b.installmentNumber);
        }

        // 1. Segundo: vencidas vs no vencidas (entre las no pagadas)
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;

        // 2. Si ambas vencidas: más días de atraso primero
        if (a.isOverdue && b.isOverdue) {
            const diasA = getDaysLate(a.dueDate);
            const diasB = getDaysLate(b.dueDate);
            return diasB - diasA; // Más días primero
        }

        // 3. Si ninguna vencida: más próxima a vencer primero
        const fechaA = new Date(a.dueDate);
        const fechaB = new Date(b.dueDate);
        return fechaA - fechaB;
    };

    const toggleCuota = (cuota) => {
        // ✅ No permitir seleccionar cuotas pagadas
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
        // ✅ Solo seleccionar cuotas pendientes (no pagadas)
        const allCuotas = alumno.cursos.flatMap(curso =>
            curso.cuotas
                .filter(cuota => !cuota.isPaid)  // Excluir pagadas
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

        // ✅ Ordenar cuotas seleccionadas antes de generar mensaje
        const cuotasOrdenadas = [...selectedCuotas].sort(compararCuotas);
        const cuotasVencidas = cuotasOrdenadas.filter(c => c.isOverdue);
        const cuotasPorVencer = cuotasOrdenadas.filter(c => !c.isOverdue);

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
                            {totalCuotasPendientes} cuota{totalCuotasPendientes !== 1 ? 's' : ''} pendiente{totalCuotasPendientes !== 1 ? 's' : ''}
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
                                    Cursos con cuotas pendientes
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
    const { students = [], inscriptions = [], courses = [] } = useDB();
    const [notifications, setNotifications] = useState([]);
    const [search, setSearch] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroFecha, setFiltroFecha] = useState({ desde: null, hasta: null });

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // ✅ Función de comparación para ordenar cuotas (modificada para Deudores)
    const compararCuotas = (a, b) => {
        // 0. PRIMERO: Las pagadas siempre al final
        if (a.isPaid && !b.isPaid) return 1;
        if (!a.isPaid && b.isPaid) return -1;

        // Si ambas están pagadas, ordenar por número de cuota
        if (a.isPaid && b.isPaid) {
            return Number(a.installmentNumber) - Number(b.installmentNumber);
        }

        // 1. Segundo: vencidas vs no vencidas (entre las no pagadas)
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;

        // 2. Si ambas vencidas: más días de atraso primero
        if (a.isOverdue && b.isOverdue) {
            const diasA = getDaysLate(a.dueDate);
            const diasB = getDaysLate(b.dueDate);
            return diasB - diasA; // Más días primero
        }

        // 3. Si ninguna vencida: más próxima a vencer primero
        const fechaA = new Date(a.dueDate);
        const fechaB = new Date(b.dueDate);
        return fechaA - fechaB;
    };

    // Función para verificar si una cuota coincide con el filtro de fecha
    const cuotaCoincideConFiltroFecha = (cuota) => {
        if (!filtroFecha.desde && !filtroFecha.hasta) return true;

        const fechaCuota = new Date(cuota.dueDate);
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
    };

    // ✅ LÓGICA CORREGIDA: Incluir TODAS las cuotas (pagadas y pendientes)
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

            // ✅ INCLUIR TODAS las cuotas (pagadas y pendientes)
            // Las pagadas se mostrarán bloqueadas en gris
            const todasLasCuotas = (ins.installments || []).filter(inst => {
                // Incluir todas las cuotas sin excluir ninguna
                return true;
            });

            // Solo mostrar el alumno si tiene al menos una cuota pendiente (no pagada)
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

            // ✅ Procesar TODAS las cuotas (pagadas y pendientes)
            const cuotasData = todasLasCuotas.map(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const isOverdue = !inst.frozen && today > dueDate;

                // Método por defecto de la inscripción
                const defaultMethod = ins.paymentType || 'Transferencia';

                // ✅ Calcular precio actual según método y vencimiento
                const montoActual = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, isOverdue);
                const pending = Math.max(montoActual - Number(inst.amountPaid || 0), 0);

                // Calcular también los montos en fecha y vencido para mostrar
                const amountEnFecha = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, false);
                const amountVencido = calcularPrecioPorMetodo(ins, course, inst, defaultMethod, true);

                // ✅ Determinar si la cuota está pagada
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
                    isPaid: isPaid  // ✅ Nueva propiedad para identificar cuotas pagadas
                };
            });

            // ✅ ORDENAR cuotas dentro de cada curso (igual que en Cobros.jsx)
            const cuotasOrdenadas = cuotasData.sort(compararCuotas);

            const totalCurso = cuotasOrdenadas.filter(c => !c.isPaid).reduce((sum, c) => sum + c.pending, 0);
            deudor.totalPending += totalCurso;
            deudor.cuotas.push(...cuotasOrdenadas);

            deudor.cursos.push({
                courseName: course.nombre,
                inscriptionId: ins.id,
                estadoCurso: ins.status || 'Cursando',
                fechaInscripcion: ins.createdAt || ins.fechaInscripcion,
                cuotas: cuotasOrdenadas  // ✅ Usar las cuotas ordenadas
            });
        });

        const result = Array.from(byStudent.values()).sort((a, b) => b.totalPending - a.totalPending);

        console.log(`🎯 [DEUDORES] Total: ${result.length} deudores, $${result.reduce((sum, d) => sum + d.totalPending, 0)}`);

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
                // ✅ Siempre incluir todas las cuotas para visualización
                // Pero para filtros, excluir las pagadas de la lógica de filtrado
                const cuotasFiltradas = curso.cuotas.filter(c => {
                    // ✅ PRIMERO: Excluir cuotas pagadas de los filtros
                    if (c.isPaid) return false;

                    // Filtro por tipo (vencidas/mesActual/todos)
                    let pasaFiltroTipo = true;
                    if (filtroTipo === 'vencidas') pasaFiltroTipo = c.isOverdue;
                    else if (filtroTipo === 'mesActual') pasaFiltroTipo = isCurrentMonth(c.dueDate);

                    // Filtro por rango de fechas
                    const pasaFiltroFecha = cuotaCoincideConFiltroFecha(c);

                    return pasaFiltroTipo && pasaFiltroFecha;
                });

                // ✅ Devolver TODAS las cuotas originales, pero marcar las que pasan el filtro
                return {
                    ...curso,
                    cuotas: curso.cuotas, // Todas las cuotas para visualización
                    cuotasFiltradasParaTotal: cuotasFiltradas // Solo para cálculos
                };
            }).filter(curso => curso.cuotasFiltradasParaTotal.length > 0);

            if (cursosFiltrados.length === 0) return null;

            const totalPending = cursosFiltrados.reduce(
                (sum, curso) => sum + curso.cuotasFiltradasParaTotal.reduce((s, c) => s + c.pending, 0), 0
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
            // ✅ Contar solo cuotas pendientes (no pagadas)
            totalCuotas: deudoresFiltrados.reduce((sum, d) =>
                sum + ((d.cuotas || []).filter(c => !c.isPaid).length), 0
            ),
            // ✅ Contar solo cuotas vencidas que no estén pagadas
            cuotasVencidas: deudoresFiltrados.reduce((sum, d) =>
                sum + ((d.cuotas || []).filter(c => c.isOverdue && !c.isPaid).length), 0
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