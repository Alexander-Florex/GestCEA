// src/pages/Cursos.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiEye,
    FiEdit,
    FiTrash2,
    FiX,
    FiPlus,
    FiTrash,
    FiInfo,
    FiCopy,
    FiCalendar,
    FiUsers,
    FiClock,
    FiDollarSign,
    FiBook,
    FiCheckCircle,
    FiChevronRight,
    FiChevronLeft,
    FiStar,
    FiPercent,
    FiCreditCard,
    FiShield,
    FiSearch
} from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Componentes UI ==================== */

function Tooltip({ children, content }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="cursor-help"
            >
                {children}
            </div>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-xl shadow-2xl max-w-xs border border-white/20 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <FiInfo className="w-3 h-3" />
                            <span className="font-semibold">Información</span>
                        </div>
                        <div className="text-white/90">{content}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TeacherSelector({ selectedTeachers, onTeachersChange, isOpen, onToggle, availableTeachers }) {
    const [searchTerm, setSearchTerm] = useState('');
    const selectorRef = useRef(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
                onToggle(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onToggle]);

    const filteredTeachers = availableTeachers.filter(teacher =>
        `${teacher.nombre} ${teacher.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.especialidad || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTeacherToggle = (teacherId) => {
        if (selectedTeachers.includes(teacherId)) {
            onTeachersChange(selectedTeachers.filter(id => id !== teacherId));
        } else {
            onTeachersChange([...selectedTeachers, teacherId]);
        }
    };

    return (
        <div className="relative" ref={selectorRef}>
            {/* Input de búsqueda y tags de seleccionados */}
            <div className="w-full border-2 border-gray-200 rounded-2xl bg-white focus-within:border-blue-500 shadow-sm hover:shadow transition-shadow duration-300">
                {/* Tags de profesores seleccionados */}
                {selectedTeachers.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                        {selectedTeachers.map(teacherId => {
                            const teacher = availableTeachers.find(t => t.id === teacherId);
                            return teacher ? (
                                <motion.span
                                    key={teacherId}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm border border-blue-200"
                                >
                                    <FiUsers className="w-3 h-3" />
                                    {teacher.nombre} {teacher.apellido}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTeacherToggle(teacherId);
                                        }}
                                        className="hover:text-blue-600 ml-1 transition-colors"
                                    >
                                        <FiX className="w-3 h-3" />
                                    </button>
                                </motion.span>
                            ) : null;
                        })}
                    </div>
                )}

                {/* Input de búsqueda */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="🔍 Buscar profesores por nombre o especialidad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => !isOpen && onToggle(true)}
                        className="w-full px-4 py-3 text-gray-700 focus:outline-none rounded-2xl bg-transparent text-sm"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <FiChevronRight className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                </div>
            </div>

            {/* Dropdown de opciones */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-[100] w-full mt-1 bg-white border-2 border-gray-200 rounded-2xl shadow-lg max-h-80 overflow-hidden backdrop-blur-sm bg-white/95"
                    >
                        <div className="max-h-60 overflow-y-auto">
                            {filteredTeachers.length === 0 ? (
                                <div className="p-6 text-gray-500 text-center">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <FiUsers className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="font-medium text-sm">
                                        {searchTerm ? 'No se encontraron profesores que coincidan' : 'No hay profesores disponibles'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {searchTerm ? 'Intenta con otros términos' : 'Agrega profesores primero'}
                                    </p>
                                </div>
                            ) : (
                                filteredTeachers.map(teacher => (
                                    <motion.div
                                        key={teacher.id}
                                        whileHover={{ scale: 1.01, backgroundColor: '#f0f9ff' }}
                                        className="flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:shadow-sm group"
                                        onClick={() => handleTeacherToggle(teacher.id)}
                                    >
                                        <div className={`mr-3 w-5 h-5 rounded flex items-center justify-center ${selectedTeachers.includes(teacher.id) ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200'}`}>
                                            {selectedTeachers.includes(teacher.id) && (
                                                <FiCheckCircle className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                                                {teacher.nombre} {teacher.apellido}
                                            </div>
                                            <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                                {teacher.especialidad && (
                                                    <span className="bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-1 rounded text-xs font-medium">
                                                        {teacher.especialidad}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-medium text-xs ml-2">
                                            {teacher.nombre.charAt(0)}{teacher.apellido.charAt(0)}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer del dropdown */}
                        <div className="border-t border-gray-200 p-3 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                            <div className="text-xs font-medium text-gray-700">
                                {selectedTeachers.length} profesor{selectedTeachers.length !== 1 ? 'es' : ''} seleccionado{selectedTeachers.length !== 1 ? 's' : ''}
                            </div>
                            <button
                                type="button"
                                onClick={() => onToggle(false)}
                                className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-medium shadow hover:shadow-md flex items-center gap-1"
                            >
                                <FiCheckCircle className="w-3 h-3" />
                                Listo
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Notificaciones ==================== */

function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50 max-w-sm">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.3 }}
                        className={`px-4 py-3 rounded-xl shadow-lg cursor-pointer border-l-4 flex items-center gap-3 min-w-[280px] backdrop-blur-sm ${n.type === 'success'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-500'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-500'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        <div className={`rounded-lg p-2 ${n.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`}>
                            {n.type === 'success' ?
                                <FiCheckCircle className="w-4 h-4 text-white" /> :
                                <FiX className="w-4 h-4 text-white" />
                            }
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">{n.type === 'success' ? '¡Éxito!' : 'Error'}</p>
                            <p className="text-gray-700 text-xs">{n.message}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <FiX className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ==================== Helpers ==================== */

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const weekdayIndex = (dia) => diasSemana.indexOf(dia);

const sortHorarios = (horarios = []) => {
    return [...horarios].sort((a, b) => {
        const ia = weekdayIndex(a.dia);
        const ib = weekdayIndex(b.dia);
        if (ia !== ib) return ia - ib;
        if (a.desde !== b.desde) return (a.desde || '').localeCompare(b.desde || '');
        return (a.hasta || '').localeCompare(b.hasta || '');
    });
};

const resumenHorarios = (horarios = []) => {
    if (!horarios || horarios.length === 0) return '-';
    const horariosValidos = sortHorarios(horarios).filter(h =>
        h.desde && h.desde.trim() !== '' &&
        h.hasta && h.hasta.trim() !== ''
    );
    if (horariosValidos.length === 0) return ['-'];
    return horariosValidos.map(h => `${h.dia.slice(0, 3)} ${h.desde}-${h.hasta}`);
};

// CORRECCIÓN: Función formatDate corregida
const formatDate = (iso) => {
    if (!iso) return '-';

    try {
        const date = new Date(iso);
        if (isNaN(date.getTime())) return iso;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formateando fecha:', error, iso);
        return iso;
    }
};

const getTeacherNames = (teacherIds, availableTeachers = []) =>
    teacherIds
        .map(id => {
            const t = availableTeachers.find(x => x.id === id);
            return t ? `${t.nombre} ${t.apellido}` : '';
        })
        .filter(Boolean)
        .join(', ');

const getEstadoCurso = (inicio, fin) => {
    const hoy = new Date();
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (hoy < fechaInicio) return {
        text: 'Próximo',
        color: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200',
        icon: '⏳',
        bgColor: 'from-blue-400 to-cyan-400'
    };
    if (hoy >= fechaInicio && hoy <= fechaFin) return {
        text: 'En Curso',
        color: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200',
        icon: '▶️',
        bgColor: 'from-green-400 to-emerald-400'
    };
    return {
        text: 'Finalizado',
        color: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200',
        icon: '✅',
        bgColor: 'from-gray-400 to-slate-400'
    };
};

/* ==================== Función para calcular vacantes ==================== */
const getVacantesInfo = (course, inscriptions) => {
    const totalVacantes = Number(course.vacantes) || 0;
    if (totalVacantes === 0) return {
        disponibles: 0,
        ocupadas: 0,
        porcentaje: 0,
        color: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200',
        emoji: '⚪',
        bgColor: 'from-gray-300 to-slate-300'
    };

    const ocupadas = inscriptions.filter(i => i.courseId === course.id).length;
    const disponibles = Math.max(0, totalVacantes - ocupadas);
    const porcentaje = (disponibles / totalVacantes) * 100;

    let color, emoji, bgColor;
    if (porcentaje > 50) {
        color = 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200';
        emoji = '🟢';
        bgColor = 'from-green-300 to-emerald-300';
    } else if (porcentaje >= 10) {
        color = 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200';
        emoji = '🟡';
        bgColor = 'from-yellow-300 to-amber-300';
    } else {
        color = 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200';
        emoji = '🔴';
        bgColor = 'from-red-300 to-pink-300'
    }

    return { disponibles, ocupadas, porcentaje, color, emoji, bgColor };
};

/* ==================== Tooltips Content ==================== */
const tooltipContent = {
    pagoFechaEfectivo: "Precio que el estudiante abona antes del 10 de cada mes con un descuento del 5%",
    pagoVencidoEfectivo: "Precio que el estudiante abona después del 10 del mes sin descuento",
    totalEfectivo: "Costo total del curso al pagarlo en efectivo",
    pagoFechaTransferencia: "Precio que el estudiante abona antes del 10 de cada mes mediante transferencia bancaria",
    pagoVencidoTransferencia: "Precio que el estudiante abona después del 10 del mes mediante transferencia",
    totalTransferencia: "Costo total del curso al pagarlo por transferencia",
    totalTarjeta: "Costo total del curso al pagarlo con tarjeta de crédito o débito (calculado automáticamente como costo en efectivo + 15%)",
    cuotasCompartidas: "Número de cuotas compartido para pagos en efectivo y transferencias",
    porcentajeTarjeta: "Porcentaje de aumento aplicado sobre el costo total de efectivo para calcular el precio con tarjeta (fijo en 15%)"
};

/* ==================== Funciones Helper ==================== */

const calcularPrimerVencimiento = (fechaInicio) => {
    if (!fechaInicio) return '';
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() - 5); // 5 días antes del inicio
    return fecha.toISOString().split('T')[0];
};

/* ==================== Página Cursos ==================== */

export default function Cursos() {
    const {
        courses,
        addCourse,
        updateCourse,
        removeCourse,
        professors,
        inscriptions,
        settings,
        posponerClasesCurso
    } = useDB();
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterCod, setFilterCod] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isTeacherSelectorOpen, setIsTeacherSelectorOpen] = useState(false);
    const [postponingCourse, setPostponingCourse] = useState(null);
    const [postponeDays, setPostponeDays] = useState(7);
    const [postponeReason, setPostponeReason] = useState('');

    const availableCertTypes = useMemo(() => {
        const base = new Set(['UTN', 'CEA']);
        for (const c of courses) {
            (c.tiposCertificado || []).forEach(t => t && base.add(t));
        }
        return Array.from(base).sort();
    }, [courses]);

    const [formData, setFormData] = useState({
        nombre: '',
        profesores: [],
        pagoFechaEfectivo: '',
        pagoVencidoEfectivo: '',
        totalEfectivo: '',
        pagoFechaTransferencia: '',
        pagoVencidoTransferencia: '',
        totalTransferencia: '',
        cuotasEnabled: false,
        cuotasCompartidas: '',
        porcentajeTarjeta: settings?.porcentajeTarjeta || 15,
        totalTarjeta: '',
        tiposCertificado: [],
        costosCertificado: {},
        horarios: [],
        horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
        certDraft: '',

        // ✅ CALENDARIO ACADÉMICO (nuevos campos)
        inicioClases: '',
        finClases: '',

        // ✅ CALENDARIO FINANCIERO (nuevos campos)
        primerVencimiento: '',
        periodicidadPagos: 'mensual', // 'mensual', 'quincenal', 'semanal'

        // ❌ Campos antiguos (mantener por compatibilidad temporal)
        inicio: '',
        fin: '',

        vacantes: '',
    });

    const calcularTotalTarjeta = (totalEfectivo, porcentaje) => {
        const total = Number(totalEfectivo) || 0;
        const pct = Number(porcentaje) || 0;
        return total + (total * pct / 100);
    };

    // ✅ Actualizar porcentaje de tarjeta desde settings
    useEffect(() => {
        if (settings?.porcentajeTarjeta !== undefined) {
            setFormData(prev => ({ ...prev, porcentajeTarjeta: settings.porcentajeTarjeta }));
        }
    }, [settings?.porcentajeTarjeta]);

    // ✅ Calcular Total Efectivo automáticamente
    useEffect(() => {
        if (formData.cuotasEnabled && formData.pagoFechaEfectivo && formData.cuotasCompartidas) {
            const pagoFecha = Number(formData.pagoFechaEfectivo) || 0;
            const cuotas = Number(formData.cuotasCompartidas) || 0;
            const total = pagoFecha * cuotas;
            setFormData(prev => ({ ...prev, totalEfectivo: total.toFixed(2) }));
        }
    }, [formData.pagoFechaEfectivo, formData.cuotasCompartidas, formData.cuotasEnabled]);

    // ✅ Calcular Total Transferencia automáticamente
    useEffect(() => {
        if (formData.cuotasEnabled && formData.pagoFechaTransferencia && formData.cuotasCompartidas) {
            const pagoFecha = Number(formData.pagoFechaTransferencia) || 0;
            const cuotas = Number(formData.cuotasCompartidas) || 0;
            const total = pagoFecha * cuotas;
            setFormData(prev => ({ ...prev, totalTransferencia: total.toFixed(2) }));
        }
    }, [formData.pagoFechaTransferencia, formData.cuotasCompartidas, formData.cuotasEnabled]);

    // ✅ Calcular Total Tarjeta automáticamente (siempre 1 cuota, pago completo)
    useEffect(() => {
        if (formData.totalEfectivo && formData.porcentajeTarjeta !== undefined) {
            const nuevoTotal = calcularTotalTarjeta(formData.totalEfectivo, formData.porcentajeTarjeta);
            setFormData(prev => ({ ...prev, totalTarjeta: nuevoTotal.toFixed(2) }));
        }
    }, [formData.totalEfectivo, formData.porcentajeTarjeta]);

    // ✅ Calcular primer vencimiento automáticamente cuando se ingresa inicio de clases
    useEffect(() => {
        if (formData.inicioClases && !formData.primerVencimiento && !editing) {
            const primerVenc = calcularPrimerVencimiento(formData.inicioClases);
            setFormData(prev => ({ ...prev, primerVencimiento: primerVenc }));
        }
    }, [formData.inicioClases, editing]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isFormOpen) {
                closeForm();
            }
        };

        if (isFormOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFormOpen]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 5000);
    };
    const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

    const filtered = useMemo(() => {
        return courses.filter(c => {
            const teacherNames = getTeacherNames(c.profesores || [], professors);
            const estado = getEstadoCurso(c.inicioClases || c.inicio, c.finClases || c.fin);

            const matchesSearch = (
                (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
                (teacherNames || '').toLowerCase().includes(search.toLowerCase())
            );

            const matchesEstado = !filterEstado || estado.text === filterEstado;
            const matchesCod = !filterCod || String(c.id).includes(filterCod);

            return matchesSearch && matchesEstado && matchesCod;
        });
    }, [courses, search, filterEstado, filterCod, professors]);

    const openForm = (course) => {
        if (course) {
            setEditing(course);
            setFormData({
                nombre: course.nombre || '',
                profesores: course.profesores || [],
                pagoFechaEfectivo: String(course.pagoFechaEfectivo ?? ''),
                pagoVencidoEfectivo: String(course.pagoVencidoEfectivo ?? ''),
                totalEfectivo: String(course.totalEfectivo ?? ''),
                pagoFechaTransferencia: String(course.pagoFechaTransferencia ?? ''),
                pagoVencidoTransferencia: String(course.pagoVencidoTransferencia ?? ''),
                totalTransferencia: String(course.totalTransferencia ?? ''),
                cuotasEnabled: course.cuotasEnabled ?? false,
                cuotasCompartidas: String(course.cuotasCompartidas ?? ''),
                porcentajeTarjeta: course.porcentajeTarjeta ?? 15,
                totalTarjeta: String(course.totalTarjeta ?? ''),
                tiposCertificado: course.tiposCertificado || [],
                costosCertificado: { ...(course.costosCertificado || {}) },
                horarios: course.horarios || [],
                horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
                certDraft: '',

                // ✅ CALENDARIO ACADÉMICO
                inicioClases: course.inicioClases || course.inicio || '',
                finClases: course.finClases || course.fin || '',

                // ✅ CALENDARIO FINANCIERO
                primerVencimiento: course.primerVencimiento ||
                    (course.inicioClases ? calcularPrimerVencimiento(course.inicioClases) : ''),
                periodicidadPagos: course.periodicidadPagos || 'mensual',

                // ❌ Mantener campos antiguos por compatibilidad
                inicio: course.inicioClases || course.inicio || '',
                fin: course.finClases || course.fin || '',

                vacantes: String(course.vacantes ?? ''),
            });
        } else {
            setEditing(null);
            setFormData({
                nombre: '',
                profesores: [],
                pagoFechaEfectivo: '',
                pagoVencidoEfectivo: '',
                totalEfectivo: '',
                pagoFechaTransferencia: '',
                pagoVencidoTransferencia: '',
                totalTransferencia: '',
                cuotasEnabled: false,
                cuotasCompartidas: '',
                porcentajeTarjeta: settings?.porcentajeTarjeta || 15,
                totalTarjeta: '',
                tiposCertificado: [],
                costosCertificado: {},
                horarios: [],
                horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
                certDraft: '',

                // ✅ CALENDARIO ACADÉMICO (vacíos para nuevo curso)
                inicioClases: '',
                finClases: '',

                // ✅ CALENDARIO FINANCIERO
                primerVencimiento: '',
                periodicidadPagos: 'mensual',

                // ❌ Campos antiguos
                inicio: '',
                fin: '',

                vacantes: '',
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
        setIsTeacherSelectorOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(fd => ({ ...fd, [name]: value }));
    };

    const handleCertCostChange = (tipo, value) => {
        setFormData(fd => ({
            ...fd,
            costosCertificado: { ...fd.costosCertificado, [tipo]: value },
        }));
    };

    const normalizeCertName = (raw) => {
        const t = (raw || '').trim();
        return t.replace(/\s+/g, ' ');
    };

    const handleAddCert = () => {
        const draft = normalizeCertName(formData.certDraft);
        if (!draft) return;

        if (formData.tiposCertificado.some(t => t.toLowerCase() === draft.toLowerCase())) {
            showNotification('error', `El certificado "${draft}" ya está agregado`);
            return;
        }
        setFormData(fd => ({
            ...fd,
            tiposCertificado: [...fd.tiposCertificado, draft],
            costosCertificado: { ...fd.costosCertificado, [draft]: fd.costosCertificado?.[draft] ?? '' },
            certDraft: ''
        }));
    };

    const removeCert = (tipo) => {
        setFormData(fd => {
            const { [tipo]: _omit, ...restCosts } = fd.costosCertificado || {};
            return {
                ...fd,
                tiposCertificado: fd.tiposCertificado.filter(x => x !== tipo),
                costosCertificado: restCosts,
            };
        });
    };

    const handleAddHorario = () => {
        const { dia, desde, hasta } = formData.horarioDraft;
        if (!dia || !desde || !hasta) {
            showNotification('error', 'Completa día, desde y hasta');
            return;
        }
        const exists = formData.horarios.some(h => h.dia === dia && h.desde === desde && h.hasta === hasta);
        if (exists) {
            showNotification('error', 'Ese horario ya está agregado');
            return;
        }
        setFormData(fd => ({
            ...fd,
            horarios: [...fd.horarios, { dia, desde, hasta }],
            horarioDraft: { dia, desde: '', hasta: '' },
        }));
    };

    const removeHorario = (idx) => {
        setFormData(fd => ({
            ...fd,
            horarios: fd.horarios.filter((_, i) => i !== idx),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        try {
            if (!formData.nombre || formData.profesores.length === 0) {
                throw new Error('Nombre y al menos un profesor son obligatorios');
            }

            const numericFields = [
                'pagoFechaEfectivo', 'pagoVencidoEfectivo', 'totalEfectivo',
                'pagoFechaTransferencia', 'pagoVencidoTransferencia', 'totalTransferencia',
                'totalTarjeta', 'vacantes', 'porcentajeTarjeta'
            ];
            for (const field of numericFields) {
                const value = formData[field];
                if (value === '' || isNaN(Number(value))) {
                    throw new Error(`El campo ${field} debe ser un número válido`);
                }
            }

            if (formData.cuotasEnabled && (formData.cuotasCompartidas === '' || isNaN(Number(formData.cuotasCompartidas)))) {
                throw new Error('Si habilitas cuotas, debes especificar un número válido');
            }

            if (!formData.inicioClases) throw new Error('Fecha de inicio de clases obligatoria');
            if (!formData.finClases) throw new Error('Fecha de fin de clases obligatoria');
            if (new Date(formData.finClases) < new Date(formData.inicioClases)) {
                throw new Error('La fecha de fin no puede ser anterior al inicio');
            }

            if (!formData.primerVencimiento) throw new Error('Primer vencimiento obligatorio');
            if (!formData.periodicidadPagos) throw new Error('Periodicidad de pagos obligatoria');

            if (formData.tiposCertificado.length === 0) {
                throw new Error('Agrega al menos un tipo de certificado con el botón +');
            }
            for (const t of formData.tiposCertificado) {
                const v = formData.costosCertificado?.[t];
                if (v === '' || v == null || isNaN(Number(v))) {
                    throw new Error(`Define un costo válido para el certificado "${t}"`);
                }
            }

            const costos = {};
            formData.tiposCertificado.forEach(t => {
                costos[t] = Number(formData.costosCertificado[t]);
            });

            const courseData = {
                nombre: formData.nombre,
                profesores: formData.profesores,
                pagoFechaEfectivo: Number(formData.pagoFechaEfectivo),
                pagoVencidoEfectivo: Number(formData.pagoVencidoEfectivo),
                totalEfectivo: Number(formData.totalEfectivo),
                pagoFechaTransferencia: Number(formData.pagoFechaTransferencia),
                pagoVencidoTransferencia: Number(formData.pagoVencidoTransferencia),
                totalTransferencia: Number(formData.totalTransferencia),
                cuotasEnabled: formData.cuotasEnabled,
                cuotasCompartidas: formData.cuotasEnabled ? Number(formData.cuotasCompartidas) : null,
                porcentajeTarjeta: Number(formData.porcentajeTarjeta),
                totalTarjeta: Number(formData.totalTarjeta),
                tiposCertificado: [...formData.tiposCertificado],
                costosCertificado: costos,
                horarios: [...formData.horarios],

                // ✅ CALENDARIO ACADÉMICO
                inicioClases: formData.inicioClases,
                finClases: formData.finClases,

                // ✅ CALENDARIO FINANCIERO
                primerVencimiento: formData.primerVencimiento || calcularPrimerVencimiento(formData.inicioClases),
                periodicidadPagos: formData.periodicidadPagos,

                // ❌ Mantener campos antiguos por compatibilidad
                inicio: formData.inicioClases,
                fin: formData.finClases,

                vacantes: Number(formData.vacantes),
            };

            if (editing) {
                updateCourse(editing.id, { ...courseData, id: editing.id });
                showNotification('success', 'Curso editado correctamente');
            } else {
                addCourse(courseData);
                showNotification('success', 'Curso creado correctamente');
            }
            closeForm();
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = (course) => {
        if (window.confirm(`¿Eliminar curso "${course.nombre}"?\nEsta acción no se puede deshacer.`)) {
            removeCourse(course.id);
            showNotification('success', 'Curso eliminado');
        }
    };

    // Nueva función: Duplicar curso
    const handleDuplicate = (course) => {
        const courseData = {
            nombre: course.nombre,
            profesores: course.profesores || [],
            pagoFechaEfectivo: Number(course.pagoFechaEfectivo ?? 0),
            pagoVencidoEfectivo: Number(course.pagoVencidoEfectivo ?? 0),
            totalEfectivo: Number(course.totalEfectivo ?? 0),
            pagoFechaTransferencia: Number(course.pagoFechaTransferencia ?? 0),
            pagoVencidoTransferencia: Number(course.pagoVencidoTransferencia ?? 0),
            totalTransferencia: Number(course.totalTransferencia ?? 0),
            cuotasEnabled: course.cuotasEnabled ?? false,
            cuotasCompartidas: course.cuotasCompartidas ?? null,
            porcentajeTarjeta: Number(course.porcentajeTarjeta ?? 15),
            totalTarjeta: Number(course.totalTarjeta ?? 0),
            tiposCertificado: [...(course.tiposCertificado || [])],
            costosCertificado: { ...(course.costosCertificado || {}) },
            horarios: [...(course.horarios || [])],
            inicioClases: course.inicioClases || course.inicio || '',
            finClases: course.finClases || course.fin || '',
            primerVencimiento: course.primerVencimiento || calcularPrimerVencimiento(course.inicioClases || course.inicio),
            periodicidadPagos: course.periodicidadPagos || 'mensual',
            inicio: course.inicioClases || course.inicio || '',
            fin: course.finClases || course.fin || '',
            vacantes: Number(course.vacantes ?? 0),
        };

        try {
            addCourse(courseData);
            showNotification('success', `Curso "${course.nombre}" duplicado correctamente`);
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    // Función para manejar el posponer clases
    const handlePostponeClasses = async () => {
        if (!postponingCourse) return;

        try {
            // Calcular nueva fecha (días después)
            const currentDate = new Date(postponingCourse.inicioClases || postponingCourse.inicio);
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + postponeDays);

            // Llamar a la función del contexto
            const result = await posponerClasesCurso(
                postponingCourse.id,
                newDate.toISOString(),
                postponeReason || `Clases pospuestas ${postponeDays} días`
            );

            if (result.success) {
                showNotification('success', result.mensaje);
                setPostponingCourse(null);
                setPostponeDays(7);
                setPostponeReason('');
            }
        } catch (error) {
            showNotification('error', error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 sm:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="max-w-[1920px] mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm border border-white/30">
                                <FiBook className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold mb-1">📚 Gestión de Cursos</h1>
                                <p className="text-blue-100 text-sm font-medium">Administra y organiza todos los cursos académicos</p>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => openForm(null)}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-300 font-bold shadow-lg hover:shadow-xl w-full sm:w-auto text-center flex items-center justify-center gap-3 group border border-white/50"
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <FiPlus className="w-4 h-4" />
                            </div>
                            <span className="text-sm">Nuevo Curso</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <motion.div
                        className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow transition-shadow duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Total Cursos</p>
                                <p className="text-2xl font-bold text-blue-900">{courses.length}</p>
                                <p className="text-xs text-blue-600 mt-1">Activos en el sistema</p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-3 rounded-xl shadow">
                                <FiBook className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4 shadow-sm hover:shadow transition-shadow duration-300"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">En Curso</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {courses.filter(c => getEstadoCurso(c.inicioClases || c.inicio, c.finClases || c.fin).text === 'En Curso').length}
                                </p>
                                <p className="text-xs text-green-600 mt-1">Actualmente activos</p>
                            </div>
                            <div className="bg-gradient-to-r from-green-400 to-green-500 p-3 rounded-xl shadow">
                                <FiClock className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-gradient-to-r from-cyan-50 to-blue-100 border border-cyan-200 rounded-xl p-4 shadow-sm hover:shadow transition-shadow duration-300"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-cyan-700 mb-1 uppercase tracking-wide">Próximos</p>
                                <p className="text-2xl font-bold text-cyan-900">
                                    {courses.filter(c => getEstadoCurso(c.inicioClases || c.inicio, c.finClases || c.fin).text === 'Próximo').length}
                                </p>
                                <p className="text-xs text-cyan-600 mt-1">Por comenzar</p>
                            </div>
                            <div className="bg-gradient-to-r from-cyan-400 to-blue-400 p-3 rounded-xl shadow">
                                <FiCalendar className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="space-y-4">
                    {/* Barra de búsqueda */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nombre, profesor o código del curso..."
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none shadow-sm text-sm bg-white placeholder-gray-500"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-lg">
                                    <FiSearch className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Filtros */}
                    <motion.div
                        className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg">
                                    <FiCalendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Estado:</label>
                                    <select
                                        value={filterEstado}
                                        onChange={(e) => setFilterEstado(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none shadow-sm w-40 bg-white"
                                    >
                                        <option value="">📋 Todos</option>
                                        <option value="Próximo">📅 Próximo</option>
                                        <option value="En Curso">▶️ En Curso</option>
                                        <option value="Finalizado">✅ Finalizado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg">
                                    <FiBook className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Código:</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 101, 202..."
                                        value={filterCod}
                                        onChange={(e) => setFilterCod(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none shadow-sm w-32 bg-white"
                                    />
                                </div>
                            </div>

                            {(search || filterEstado || filterCod) && (
                                <motion.button
                                    onClick={() => {
                                        setSearch('');
                                        setFilterEstado('');
                                        setFilterCod('');
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="sm:ml-auto px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-medium text-xs shadow hover:shadow-md flex items-center gap-2"
                                >
                                    <FiX className="w-3 h-3" />
                                    Limpiar filtros
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Tabla de cursos - COMPLETAMENTE RESPONSIVE */}
                <motion.div
                    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="overflow-x-auto">
                        <div className="min-w-full inline-block align-middle">
                            <div className="overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            COD
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Nombre
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Fechas
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Horario
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Profesor/es
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Vacantes
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {filtered.map((course, index) => {
                                        const estado = getEstadoCurso(course.inicioClases || course.inicio, course.finClases || course.fin);
                                        const horarios = resumenHorarios(course.horarios || []);
                                        const vacantesInfo = getVacantesInfo(course, inscriptions);
                                        return (
                                            <motion.tr
                                                key={course.id}
                                                className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white/30'
                                                }`}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm border border-blue-200">
                                                            #{course.id}
                                                        </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-gray-900 text-sm">{course.nombre}</div>
                                                    <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                        <FiShield className="w-3 h-3 text-blue-500" />
                                                        <span className="truncate max-w-[150px]">{course.tiposCertificado?.join(', ') || 'Sin certificados'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <FiCalendar className="w-3 h-3 text-blue-500" />
                                                            <span className="text-xs font-medium text-gray-700">{formatDate(course.inicioClases || course.inicio)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <FiCalendar className="w-3 h-3 text-indigo-500" />
                                                            <span className="text-xs font-medium text-gray-700">{formatDate(course.finClases || course.fin)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {Array.isArray(horarios) && horarios.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {horarios.slice(0, 1).map((horario, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-1 rounded">
                                                                        <FiClock className="w-3 h-3 text-orange-500" />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-700 bg-gradient-to-r from-orange-50 to-yellow-50 px-2 py-1 rounded">
                                                                            {horario}
                                                                        </span>
                                                                </div>
                                                            ))}
                                                            {horarios.length > 1 && (
                                                                <div className="text-xs text-gray-500 font-medium">
                                                                    +{horarios.length - 1} más
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic text-xs flex items-center gap-1">
                                                                <FiClock className="w-3 h-3" />
                                                                Sin horarios
                                                            </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="max-w-[150px]">
                                                        <div className="text-xs font-medium text-gray-700 truncate">
                                                            {getTeacherNames(course.profesores || [], professors)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {course.profesores?.length || 0} profesor{course.profesores?.length !== 1 ? 'es' : ''}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${vacantesInfo.color} flex items-center gap-2`}>
                                                            <span className="text-lg">{vacantesInfo.emoji}</span>
                                                            <div>
                                                                <div className="font-bold">{vacantesInfo.disponibles}/{Number(course.vacantes)}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-600 font-medium">
                                                            {vacantesInfo.porcentaje.toFixed(0)}%
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${estado.color} flex items-center gap-2`}>
                                                            <span className="text-lg">{estado.icon}</span>
                                                            <span>{estado.text}</span>
                                                        </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex space-x-1.5">
                                                        <motion.button
                                                            onClick={() => setViewing(course)}
                                                            whileHover={{ scale: 1.1, y: -1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white p-2 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow hover:shadow-sm flex flex-col items-center justify-center gap-0.5 min-w-[50px]"
                                                            title="Ver detalles"
                                                        >
                                                            <FiEye size={14} />
                                                            <span className="text-[10px] font-medium">Ver</span>
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => openForm(course)}
                                                            whileHover={{ scale: 1.1, y: -1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="bg-gradient-to-r from-green-400 to-emerald-400 text-white p-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow hover:shadow-sm flex flex-col items-center justify-center gap-0.5 min-w-[50px]"
                                                            title="Editar"
                                                        >
                                                            <FiEdit size={14} />
                                                            <span className="text-[10px] font-medium">Editar</span>
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => setPostponingCourse(course)}
                                                            whileHover={{ scale: 1.1, y: -1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="bg-gradient-to-r from-cyan-400 to-blue-400 text-white p-2 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow hover:shadow-sm flex flex-col items-center justify-center gap-0.5 min-w-[50px]"
                                                            title="Posponer clases"
                                                        >
                                                            <FiCalendar size={14} />
                                                            <span className="text-[10px] font-medium">Posponer</span>
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => handleDuplicate(course)}
                                                            whileHover={{ scale: 1.1, y: -1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-2 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow hover:shadow-sm flex flex-col items-center justify-center gap-0.5 min-w-[50px]"
                                                            title="Duplicar"
                                                        >
                                                            <FiCopy size={14} />
                                                            <span className="text-[10px] font-medium">Copiar</span>
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => handleDelete(course)}
                                                            whileHover={{ scale: 1.1, y: -1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="bg-gradient-to-r from-red-400 to-orange-400 text-white p-2 rounded-lg hover:from-red-500 hover:to-orange-500 transition-all duration-300 shadow hover:shadow-sm flex flex-col items-center justify-center gap-0.5 min-w-[50px]"
                                                            title="Eliminar"
                                                        >
                                                            <FiTrash2 size={14} />
                                                            <span className="text-[10px] font-medium">Eliminar</span>
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-gray-500">
                                                <motion.div
                                                    className="flex flex-col items-center space-y-4"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <div className="text-6xl">📚</div>
                                                    <div>
                                                        <div className="text-xl font-bold text-gray-700 mb-1">
                                                            {search || filterEstado || filterCod
                                                                ? 'No se encontraron cursos'
                                                                : 'No hay cursos disponibles'}
                                                        </div>
                                                        <p className="text-gray-600 max-w-md mx-auto text-sm">
                                                            {search || filterEstado || filterCod
                                                                ? 'Intenta con otros términos de búsqueda o limpia los filtros'
                                                                : 'Haz clic en "Nuevo Curso" para comenzar'}
                                                        </p>
                                                    </div>
                                                    {(!search && !filterEstado && !filterCod) && (
                                                        <motion.button
                                                            onClick={() => openForm(null)}
                                                            whileHover={{ scale: 1.05 }}
                                                            className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow hover:shadow-md flex items-center gap-2 text-sm"
                                                        >
                                                            <FiPlus className="w-4 h-4" />
                                                            <span>Crear primer curso</span>
                                                        </motion.button>
                                                    )}
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modal Detalles */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-gray-200 shadow-xl"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header con gradiente */}
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 rounded-t-xl relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm border border-white/30">
                                                <FiBook className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">Detalles del Curso</h2>
                                                <p className="text-blue-100 text-sm font-medium mt-1">Información completa</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                            <div className="text-lg font-bold mb-1">{viewing.nombre}</div>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                                                    COD: <strong>#{viewing.id}</strong>
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getEstadoCurso(viewing.inicioClases || viewing.inicio, viewing.finClases || viewing.fin).color}`}>
                                                    {getEstadoCurso(viewing.inicioClases || viewing.inicio, viewing.finClases || viewing.fin).text}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/30"
                                        onClick={() => setViewing(null)}
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Primera fila: Información básica */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2">
                                                <FiCalendar className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Calendario Académico</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-600">Inicio de clases:</span>
                                                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3 text-blue-500" />
                                                    {formatDate(viewing.inicioClases || viewing.inicio)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-600">Fin de clases:</span>
                                                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3 text-cyan-500" />
                                                    {formatDate(viewing.finClases || viewing.fin)}
                                                </span>
                                            </div>
                                            {/* Botón para posponer clases */}
                                            <div className="mt-3 pt-2 border-t border-gray-200">
                                                <button
                                                    onClick={() => {
                                                        setViewing(null);
                                                        setPostponingCourse(viewing);
                                                    }}
                                                    className="w-full text-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-all text-xs font-medium border border-blue-200"
                                                >
                                                    Posponer clases (sin afectar pagos)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2">
                                                <FiCreditCard className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Calendario Financiero</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-600">Primer vencimiento:</span>
                                                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3 text-green-500" />
                                                    {formatDate(viewing.primerVencimiento)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-600">Periodicidad:</span>
                                                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                                                    <FiClock className="w-3 h-3 text-emerald-500" />
                                                    {viewing.periodicidadPagos || 'mensual'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-600">Código:</span>
                                                <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">#{viewing.id}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-600">Vacantes:</span>
                                                <span className="font-semibold text-gray-800 text-sm">{viewing.vacantes}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profesores */}
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2">
                                            <FiUsers className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Profesor/es</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {viewing.profesores && viewing.profesores.length > 0 ? (
                                            viewing.profesores.map(profesorId => {
                                                const profesor = professors.find(p => p.id === profesorId);
                                                return profesor ? (
                                                    <motion.div
                                                        key={profesorId}
                                                        className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white rounded-lg p-2 border border-gray-200"
                                                        whileHover={{ y: -1 }}
                                                    >
                                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                                                            {profesor.nombre.charAt(0)}{profesor.apellido.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-gray-800 text-sm">{profesor.nombre} {profesor.apellido}</div>
                                                            <div className="text-xs text-gray-600">
                                                                {profesor.especialidad || 'Sin especialidad'}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ) : null;
                                            })
                                        ) : (
                                            <div className="text-center py-4 text-gray-500">
                                                <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                    <FiUsers className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="font-medium text-sm">No hay profesores asignados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Datos económicos */}
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2">
                                            <FiDollarSign className="w-5 h-5 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Información Económica</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Efectivo */}
                                        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-lg p-3 border border-blue-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-2 rounded">
                                                    <FiDollarSign className="w-4 h-4 text-white" />
                                                </div>
                                                <h4 className="font-semibold text-blue-800 text-sm">Efectivo</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-blue-700">Pago en fecha:</span>
                                                    <span className="font-semibold text-blue-900 text-sm">${Number(viewing.pagoFechaEfectivo || 0).toLocaleString('es-AR')}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-blue-700">Pago vencido:</span>
                                                    <span className="font-semibold text-blue-900 text-sm">${Number(viewing.pagoVencidoEfectivo || 0).toLocaleString('es-AR')}</span>
                                                </div>
                                                <div className="border-t border-blue-200 pt-2 mt-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-blue-800">Total:</span>
                                                        <span className="font-bold text-blue-900">${Number(viewing.totalEfectivo || 0).toLocaleString('es-AR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transferencia */}
                                        <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50 rounded-lg p-3 border border-indigo-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 p-2 rounded">
                                                    <FiCreditCard className="w-4 h-4 text-white" />
                                                </div>
                                                <h4 className="font-semibold text-indigo-800 text-sm">Transferencia</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-indigo-700">Pago en fecha:</span>
                                                    <span className="font-semibold text-indigo-900 text-sm">${Number(viewing.pagoFechaTransferencia || 0).toLocaleString('es-AR')}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-indigo-700">Pago vencido:</span>
                                                    <span className="font-semibold text-indigo-900 text-sm">${Number(viewing.pagoVencidoTransferencia || 0).toLocaleString('es-AR')}</span>
                                                </div>
                                                <div className="border-t border-indigo-200 pt-2 mt-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-indigo-800">Total:</span>
                                                        <span className="font-bold text-indigo-900">${Number(viewing.totalTransferencia || 0).toLocaleString('es-AR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tarjeta */}
                                        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-lg p-3 border border-purple-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="bg-gradient-to-r from-purple-400 to-purple-500 p-2 rounded">
                                                    <FiPercent className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-purple-800 text-sm">Tarjeta</h4>
                                                    <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-1 py-0.5 rounded text-[10px] font-bold">1 Cuota</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-purple-700">Porcentaje:</span>
                                                    <span className="font-semibold text-purple-900 text-sm flex items-center gap-1">
                                                        {Number(viewing.porcentajeTarjeta || 0)}%
                                                        <div className="w-6 h-1 bg-gradient-to-r from-purple-300 to-purple-500 rounded-full"></div>
                                                    </span>
                                                </div>
                                                <div className="border-t border-purple-200 pt-2 mt-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-purple-800">Total único:</span>
                                                        <span className="font-bold text-purple-900">${Number(viewing.totalTarjeta || 0).toLocaleString('es-AR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información de cuotas */}
                                    {viewing.cuotasEnabled && (
                                        <motion.div
                                            className="mt-4 bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 border border-gray-200"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-1.5 rounded">
                                                    <FiInfo className="w-3 h-3 text-gray-600" />
                                                </div>
                                                <div className="text-sm">
                                                    <span className="font-semibold">Cuotas compartidas: </span>
                                                    <span className="ml-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2 py-1 rounded font-semibold">
                                                        {viewing.cuotasCompartidas || 0} cuotas
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 ml-8">
                                                Tarjeta: 1 cuota con {viewing.porcentajeTarjeta || 15}% de recargo.
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Horarios y Certificados */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Horarios */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-2">
                                                <FiClock className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Horarios</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {viewing.horarios && viewing.horarios.length > 0 ? (
                                                sortHorarios(viewing.horarios).map((horario, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-lg p-2 border border-gray-200"
                                                        whileHover={{ x: 2 }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-white rounded p-1.5 border">
                                                                <span className="font-bold text-blue-600 text-xs">{horario.dia.slice(0, 3)}</span>
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-800 text-sm">{horario.dia}</div>
                                                                <div className="text-gray-600 text-xs">
                                                                    {horario.desde && horario.hasta ? (
                                                                        <span className="font-medium text-gray-700">{horario.desde} - {horario.hasta}</span>
                                                                    ) : (
                                                                        <span className="text-red-500 italic">Sin horario</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-2 py-1 rounded text-xs font-medium">
                                                            {horario.desde && horario.hasta ? `${horario.desde}-${horario.hasta}` : 'Sin definir'}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                        <FiClock className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                    <p className="font-medium text-sm">No hay horarios</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Certificados */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-2">
                                                <FiShield className="w-5 h-5 text-red-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Certificados</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {viewing.tiposCertificado && viewing.tiposCertificado.length > 0 ? (
                                                viewing.tiposCertificado.map((tipo, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-lg p-2 border border-gray-200"
                                                        whileHover={{ x: 2 }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded p-1.5">
                                                                <FiShield className="w-4 h-4 text-red-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-800 text-sm">{tipo}</div>
                                                                <div className="text-xs text-gray-500">Certificado oficial</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                                                                ${Number(viewing.costosCertificado?.[tipo] || 0).toLocaleString('es-AR')}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                        <FiShield className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                    <p className="font-medium text-sm">No hay certificados</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 border-t border-gray-200 p-4 rounded-b-xl">
                                <div className="flex justify-center">
                                    <motion.button
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow hover:shadow-md font-semibold text-sm"
                                        onClick={() => { setViewing(null); openForm(viewing); }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <div className="bg-white/20 p-1.5 rounded group-hover:rotate-12 transition-transform">
                                            <FiEdit className="w-4 h-4" />
                                        </div>
                                        <span>Editar Curso</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative shadow-xl border border-gray-200"
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm border border-white/30">
                                        {editing ? <FiEdit className="w-6 h-6" /> : <FiPlus className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{editing ? 'Editar Curso' : 'Nuevo Curso'}</h2>
                                        <p className="text-blue-100 text-sm">Completa la información</p>
                                    </div>
                                </div>
                                <button type="button" className="bg-white/20 rounded-xl p-2 hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30" onClick={closeForm}>
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)]">
                                <div className="p-6 space-y-6">
                                    {/* Información general */}
                                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
                                        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                                            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-2 rounded">
                                                <FiInfo className="w-5 h-5" />
                                            </div>
                                            Información General
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                                                    <FiBook className="w-4 h-4 text-blue-500" />
                                                    Nombre del Curso:
                                                </label>
                                                <input
                                                    name="nombre"
                                                    type="text"
                                                    value={formData.nombre}
                                                    onChange={handleChange}
                                                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none transition-colors text-sm w-full"
                                                    required
                                                    placeholder="Ej: Desarrollo Web Full Stack"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                                                    <FiUsers className="w-4 h-4 text-blue-500" />
                                                    Profesor/es:
                                                </label>
                                                <TeacherSelector
                                                    selectedTeachers={formData.profesores}
                                                    onTeachersChange={(teachers) => setFormData(fd => ({ ...fd, profesores: teachers }))}
                                                    isOpen={isTeacherSelectorOpen}
                                                    onToggle={setIsTeacherSelectorOpen}
                                                    availableTeachers={professors}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos Económicos */}
                                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
                                        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                                            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-2 rounded">
                                                <FiDollarSign className="w-5 h-5" />
                                            </div>
                                            Datos Económicos
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Efectivo */}
                                            <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-700 mb-3 text-center bg-gradient-to-r from-blue-50 to-blue-100 py-2 rounded">Efectivo</h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <Tooltip content={tooltipContent.pagoFechaEfectivo}>
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                Pago en Fecha <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                            <input
                                                                name="pagoFechaEfectivo"
                                                                type="number"
                                                                value={formData.pagoFechaEfectivo}
                                                                onChange={handleChange}
                                                                className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none text-sm w-full"
                                                                required min="0" step="0.01"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Tooltip content={tooltipContent.pagoVencidoEfectivo}>
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                Pago Vencido <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                            <input
                                                                name="pagoVencidoEfectivo"
                                                                type="number"
                                                                value={formData.pagoVencidoEfectivo}
                                                                onChange={handleChange}
                                                                className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none text-sm w-full"
                                                                required min="0" step="0.01"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Tooltip content="Calculado automáticamente: Pago en Fecha × Nº Cuotas">
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                Total <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                            <input
                                                                name="totalEfectivo"
                                                                type="number"
                                                                value={formData.totalEfectivo}
                                                                className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none bg-yellow-50 cursor-not-allowed text-sm w-full"
                                                                required min="0" step="0.01"
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transferencias */}
                                            <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-700 mb-3 text-center bg-gradient-to-r from-indigo-50 to-indigo-100 py-2 rounded">Transferencias</h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <Tooltip content={tooltipContent.pagoFechaTransferencia}>
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                Pago en Fecha <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                            <input
                                                                name="pagoFechaTransferencia"
                                                                type="number"
                                                                value={formData.pagoFechaTransferencia}
                                                                onChange={handleChange}
                                                                className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-gray-700 focus:border-indigo-500 focus:outline-none text-sm w-full"
                                                                required min="0" step="0.01"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Tooltip content={tooltipContent.pagoVencidoTransferencia}>
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                Pago Vencido <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                            <input
                                                                name="pagoVencidoTransferencia"
                                                                type="number"
                                                                value={formData.pagoVencidoTransferencia}
                                                                onChange={handleChange}
                                                                className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-gray-700 focus:border-indigo-500 focus:outline-none text-sm w-full"
                                                                required min="0" step="0.01"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Tooltip content="Calculado automáticamente: Pago en Fecha × Nº Cuotas">
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                Total <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                            <input
                                                                name="totalTransferencia"
                                                                type="number"
                                                                value={formData.totalTransferencia}
                                                                className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-gray-700 focus:border-indigo-500 focus:outline-none bg-yellow-50 cursor-not-allowed text-sm w-full"
                                                                required min="0" step="0.01"
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tarjetas */}
                                            <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-700 mb-3 text-center bg-gradient-to-r from-purple-50 to-purple-100 py-2 rounded">Tarjetas</h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <Tooltip content={tooltipContent.porcentajeTarjeta}>
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                % Recargo <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                                                            <input
                                                                name="porcentajeTarjeta"
                                                                type="number"
                                                                value={formData.porcentajeTarjeta}
                                                                onChange={handleChange}
                                                                className="border border-gray-300 rounded-lg px-2 pr-8 py-1.5 text-gray-700 focus:border-purple-500 focus:outline-none bg-gray-100 cursor-not-allowed text-sm w-full"
                                                                required min="0" step="0.01"
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Tooltip content="Calculado: Total Efectivo + Porcentaje">
                                                            <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                                Total (1 Cuota) <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                            <input
                                                                name="totalTarjeta"
                                                                type="number"
                                                                value={formData.totalTarjeta}
                                                                className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-gray-700 focus:border-purple-500 focus:outline-none bg-yellow-50 cursor-not-allowed text-sm w-full"
                                                                required min="0" step="0.01"
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cuotas compartidas */}
                                        <div className="mt-4 border border-gray-200 rounded-lg p-3 bg-white">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <input
                                                    type="checkbox"
                                                    id="cuotasEnabled"
                                                    checked={formData.cuotasEnabled}
                                                    onChange={(e) => setFormData(fd => ({
                                                        ...fd,
                                                        cuotasEnabled: e.target.checked,
                                                        cuotasCompartidas: e.target.checked ? fd.cuotasCompartidas : ''
                                                    }))}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor="cuotasEnabled" className="text-sm text-gray-700 font-semibold">
                                                    Habilitar cuotas para Efectivo y Transferencias
                                                </label>
                                            </div>

                                            {formData.cuotasEnabled && (
                                                <div>
                                                    <Tooltip content={tooltipContent.cuotasCompartidas}>
                                                        <label className="text-xs font-semibold mb-2 text-gray-700 flex items-center gap-1">
                                                            Nº Cuotas <FiInfo className="w-3 h-3 text-gray-400" />
                                                        </label>
                                                    </Tooltip>
                                                    <input
                                                        name="cuotasCompartidas"
                                                        type="number"
                                                        value={formData.cuotasCompartidas}
                                                        onChange={handleChange}
                                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none text-sm w-full max-w-xs"
                                                        min="1" step="1"
                                                        placeholder="Ej: 3, 6, 12..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Certificados */}
                                    <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 p-4 rounded-lg border border-purple-200">
                                        <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                                            <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-2 rounded">
                                                <FiShield className="w-5 h-5" />
                                            </div>
                                            Certificados
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Tipo(s) de Certificado:
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            list="cert-types"
                                                            value={formData.certDraft}
                                                            onChange={(e) => setFormData(fd => ({ ...fd, certDraft: e.target.value }))}
                                                            placeholder="Ej: UTN, CEA, ISO..."
                                                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 focus:border-purple-500 focus:outline-none text-sm w-full"
                                                        />
                                                        <datalist id="cert-types">
                                                            {availableCertTypes.map(t => <option key={t} value={t} />)}
                                                        </datalist>
                                                    </div>

                                                    <motion.button
                                                        type="button"
                                                        onClick={handleAddCert}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-2 transition-colors text-sm font-semibold shadow-sm"
                                                    >
                                                        <FiPlus className="w-4 h-4" />
                                                        <span>Agregar</span>
                                                    </motion.button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Certificados agregados:
                                                </label>
                                                <div className="border border-gray-200 rounded-lg p-2 bg-white/90 max-h-48 overflow-y-auto">
                                                    {formData.tiposCertificado.length === 0 ? (
                                                        <div className="text-gray-500 italic text-center py-4 text-sm">Agrega certificados</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {formData.tiposCertificado.map(tipo => (
                                                                <div key={tipo} className="flex items-center gap-2 bg-white rounded p-2 shadow-sm border border-gray-200">
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                                                                            <FiShield className="w-3 h-3 text-purple-600" />
                                                                            {tipo}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <div className="relative">
                                                                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder="Costo"
                                                                                    value={formData.costosCertificado?.[tipo] ?? ''}
                                                                                    onChange={(e) => handleCertCostChange(tipo, e.target.value)}
                                                                                    className="w-32 border border-gray-300 rounded px-6 py-1 text-xs focus:border-purple-500 focus:outline-none"
                                                                                    min="0"
                                                                                    step="0.01"
                                                                                    required
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-gray-500">ARS</span>
                                                                        </div>
                                                                    </div>
                                                                    <motion.button
                                                                        type="button"
                                                                        onClick={() => removeCert(tipo)}
                                                                        whileHover={{ scale: 1.1 }}
                                                                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <FiTrash className="w-4 h-4" />
                                                                    </motion.button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horarios */}
                                    <div className="bg-gradient-to-r from-orange-50/50 to-yellow-50/50 p-4 rounded-lg border border-orange-200">
                                        <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                                            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-2 rounded">
                                                <FiClock className="w-5 h-5" />
                                            </div>
                                            Horarios
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-3 items-end">
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold mb-1 text-gray-700">Día:</label>
                                                    <select
                                                        value={formData.horarioDraft.dia}
                                                        onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, dia: e.target.value } }))}
                                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-orange-500 focus:outline-none text-sm"
                                                    >
                                                        {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold mb-1 text-gray-700">Desde:</label>
                                                    <input
                                                        type="time"
                                                        value={formData.horarioDraft.desde}
                                                        onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, desde: e.target.value } }))}
                                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-orange-500 focus:outline-none text-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold mb-1 text-gray-700">Hasta:</label>
                                                    <input
                                                        type="time"
                                                        value={formData.horarioDraft.hasta}
                                                        onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, hasta: e.target.value } }))}
                                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-orange-500 focus:outline-none text-sm"
                                                    />
                                                </div>
                                                <motion.button
                                                    type="button"
                                                    onClick={handleAddHorario}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 flex items-center gap-2 transition-colors text-sm font-semibold shadow-sm"
                                                >
                                                    <FiPlus className="w-4 h-4" />
                                                    <span>Agregar</span>
                                                </motion.button>
                                            </div>

                                            {/* Listado */}
                                            <div className="border border-gray-200 rounded-lg p-2 bg-white/90 max-h-48 overflow-y-auto">
                                                {formData.horarios.length === 0 ? (
                                                    <div className="text-gray-500 italic text-center py-4 text-sm">Agrega horarios</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {sortHorarios(formData.horarios).map((h, idx) => (
                                                            <div
                                                                key={`${h.dia}-${h.desde}-${h.hasta}-${idx}`}
                                                                className="flex items-center justify-between bg-white rounded p-2 shadow-sm border border-gray-200"
                                                            >
                                                                <div className="text-gray-700">
                                                                    <div className="font-semibold text-sm flex items-center gap-1">
                                                                        <FiClock className="w-3 h-3 text-orange-600" />
                                                                        {h.dia}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">{h.desde} - {h.hasta}</div>
                                                                </div>
                                                                <motion.button
                                                                    type="button"
                                                                    onClick={() => removeHorario(idx)}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                                                >
                                                                    <FiTrash className="w-4 h-4" />
                                                                </motion.button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fechas y Vacantes - CALENDARIOS SEPARADOS */}
                                    <div className="space-y-6">
                                        {/* CALENDARIO ACADÉMICO */}
                                        <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 p-4 rounded-lg border border-blue-200">
                                            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                                                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-2 rounded">
                                                    <FiCalendar className="w-5 h-5" />
                                                </div>
                                                Calendario Académico
                                                <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded">
                                                    EDITABLE
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">Define las fechas de inicio y fin de las clases (puedes cambiarlas después sin afectar los pagos)</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                        <FiCalendar className="w-3 h-3 text-blue-500" />
                                                        Inicio de Clases:
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="inicioClases"
                                                        value={formData.inicioClases ? formData.inicioClases.split('T')[0] : ''}
                                                        onChange={handleChange}
                                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Fecha en que comienzan las clases</p>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                        <FiCalendar className="w-3 h-3 text-cyan-500" />
                                                        Fin de Clases:
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="finClases"
                                                        value={formData.finClases ? formData.finClases.split('T')[0] : ''}
                                                        onChange={handleChange}
                                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-cyan-500 focus:outline-none text-sm"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Fecha en que finalizan las clases</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CALENDARIO FINANCIERO */}
                                        <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 rounded-lg border border-green-200">
                                            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                                                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded">
                                                    <FiCreditCard className="w-5 h-5" />
                                                </div>
                                                Calendario Financiero
                                                <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded">
                                                    FIJO
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">Define las fechas de pago (una vez definidas, no se deberían cambiar)</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                        <FiCalendar className="w-3 h-3 text-green-500" />
                                                        Primer Vencimiento:
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="primerVencimiento"
                                                        value={formData.primerVencimiento ? formData.primerVencimiento.split('T')[0] : ''}
                                                        onChange={handleChange}
                                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-green-500 focus:outline-none text-sm"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Fecha del primer pago (sugerido: 5 días antes del inicio)</p>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                        <FiClock className="w-3 h-3 text-emerald-500" />
                                                        Periodicidad de Pagos:
                                                    </label>
                                                    <select
                                                        name="periodicidadPagos"
                                                        value={formData.periodicidadPagos}
                                                        onChange={handleChange}
                                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-emerald-500 focus:outline-none text-sm"
                                                        required
                                                    >
                                                        <option value="mensual">Mensual</option>
                                                        <option value="quincenal">Quincenal</option>
                                                        <option value="semanal">Semanal</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-1">Cada cuánto se pagan las cuotas</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* VACANTES */}
                                        <div className="bg-gradient-to-r from-gray-50/50 to-slate-50/50 p-4 rounded-lg border border-gray-200">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-2 rounded">
                                                    <FiUsers className="w-5 h-5" />
                                                </div>
                                                Vacantes
                                            </h3>
                                            <div className="flex flex-col">
                                                <label className="text-xs font-semibold mb-1 text-gray-700 flex items-center gap-1">
                                                    <FiUsers className="w-3 h-3 text-gray-500" />
                                                    Número de Vacantes:
                                                </label>
                                                <input
                                                    type="number"
                                                    name="vacantes"
                                                    value={formData.vacantes}
                                                    onChange={handleChange}
                                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:border-gray-500 focus:outline-none text-sm max-w-xs"
                                                    min="0"
                                                    step="1"
                                                    required
                                                    placeholder="Ej: 20, 30..."
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Máximo número de estudiantes que pueden inscribirse</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer con botones */}
                                <div className="sticky bottom-0 bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 border-t border-gray-200 p-4 flex justify-end gap-3">
                                    <motion.button
                                        type="button"
                                        onClick={closeForm}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm shadow-sm"
                                    >
                                        Cancelar
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-colors font-semibold text-sm shadow hover:shadow-md"
                                    >
                                        {editing ? 'Guardar Cambios' : 'Crear Curso'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal para posponer clases */}
            <AnimatePresence>
                {postponingCourse && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-gradient-to-br from-white via-cyan-50/50 to-blue-50/50 rounded-xl w-full max-w-md overflow-hidden relative shadow-xl border border-cyan-200"
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                        >
                            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm border border-white/30">
                                        <FiCalendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Posponer Clases</h2>
                                        <p className="text-cyan-100 text-sm">Sin afectar fechas de pago</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="bg-white/20 rounded-xl p-2 hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30"
                                    onClick={() => setPostponingCourse(null)}
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="text-center mb-4">
                                    <div className="text-lg font-bold text-gray-800 mb-1">
                                        {postponingCourse.nombre}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Fecha actual de inicio: {formatDate(postponingCourse.inicioClases || postponingCourse.inicio)}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4 text-cyan-500" />
                                        Días a posponer:
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="30"
                                            value={postponeDays}
                                            onChange={(e) => setPostponeDays(Number(e.target.value))}
                                            className="flex-1 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="font-bold text-lg text-cyan-700 min-w-[3rem] text-center">
                                            {postponeDays} día{postponeDays !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Nueva fecha: {(() => {
                                        const currentDate = new Date(postponingCourse.inicioClases || postponingCourse.inicio);
                                        const newDate = new Date(currentDate);
                                        newDate.setDate(newDate.getDate() + postponeDays);
                                        return formatDate(newDate.toISOString());
                                    })()}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                                        <FiInfo className="w-4 h-4 text-blue-500" />
                                        Motivo (opcional):
                                    </label>
                                    <textarea
                                        value={postponeReason}
                                        onChange={(e) => setPostponeReason(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                        rows="2"
                                        placeholder="Ej: Profesor enfermo, feriado no contemplado..."
                                    />
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <FiInfo className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <div className="font-semibold text-green-800 text-sm">✅ No afectará las fechas de pago</div>
                                            <div className="text-xs text-green-600 mt-1">
                                                Las cuotas mantendrán sus fechas originales. Solo se modifica el calendario académico.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-white via-cyan-50/50 to-blue-50/50 border-t border-gray-200 p-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPostponingCourse(null)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm shadow-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePostponeClasses}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-lg hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 transition-colors font-semibold text-sm shadow hover:shadow-md"
                                >
                                    Posponer Clases
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}