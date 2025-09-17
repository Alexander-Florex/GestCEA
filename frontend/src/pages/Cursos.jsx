// src/pages/Cursos.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPlus, FiTrash, FiInfo } from 'react-icons/fi';
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
                        className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-w-xs"
                    >
                        {content}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TeacherSelector({ selectedTeachers, onTeachersChange, isOpen, onToggle, availableTeachers }) {
    const [searchTerm, setSearchTerm] = useState('');

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

    const getSelectedTeachersText = () => {
        if (selectedTeachers.length === 0) return 'Buscar y seleccionar profesores...';
        const names = selectedTeachers.map(id => {
            const teacher = availableTeachers.find(t => t.id === id);
            return teacher ? `${teacher.nombre} ${teacher.apellido}` : '';
        }).filter(Boolean);
        return names.join(', ');
    };

    return (
        <div className="relative">
            <div className="w-full border-2 border-gray-300 rounded-xl bg-white focus-within:border-purple-500 shadow-sm">
                <input
                    type="text"
                    placeholder="Buscar profesores por nombre o especialidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => !isOpen && onToggle()}
                    className="w-full px-3 py-2 text-black focus:outline-none rounded-xl"
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-xl shadow-md max-h-60 overflow-hidden"
                    >
                        {/* Lista filtrada */}
                        <div className="max-h-40 overflow-y-auto">
                            {filteredTeachers.length === 0 ? (
                                <div className="p-3 text-gray-500 text-center">
                                    {searchTerm ? 'No se encontraron profesores que coincidan' : 'No hay profesores disponibles'}
                                </div>
                            ) : (
                                filteredTeachers.map(teacher => (
                                    <motion.div
                                        key={teacher.id}
                                        whileHover={{ backgroundColor: '#f3f4f6' }}
                                        className="flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        onClick={() => handleTeacherToggle(teacher.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTeachers.includes(teacher.id)}
                                            onChange={() => handleTeacherToggle(teacher.id)}
                                            className="mr-3 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-black">
                                                {teacher.nombre} {teacher.apellido}
                                            </div>
                                            <div className="text-sm text-gray-500">{teacher.especialidad}</div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Profesores seleccionados */}
                        {selectedTeachers.length > 0 && (
                            <div className="border-t border-gray-200 p-3 bg-gray-50">
                                <div className="text-sm font-medium text-gray-700 mb-2">Seleccionados:</div>
                                <div className="flex flex-wrap gap-1">
                                    {selectedTeachers.map(teacherId => {
                                        const teacher = availableTeachers.find(t => t.id === teacherId);
                                        return teacher ? (
                                            <span key={teacherId} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                                {teacher.nombre} {teacher.apellido}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTeacherToggle(teacherId);
                                                    }}
                                                    className="hover:text-red-600"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="p-3 border-t border-gray-200 flex justify-between">
                            <button
                                type="button"
                                onClick={() => onTeachersChange([])}
                                className="text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                                Limpiar todo
                            </button>
                            <button
                                type="button"
                                onClick={onToggle}
                                className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
                            >
                                Cerrar
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
        <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
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

/* ==================== Helpers ==================== */

const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

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
    return sortHorarios(horarios).map(h => `${h.dia.slice(0,3)} ${h.desde}-${h.hasta}`);
};

const formatDate = (iso) => {
    if (!iso) return '-';
    const [y,m,d] = String(iso).split('-');
    if (!y || !m || !d) return iso;
    return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
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

    if (hoy < fechaInicio) return { text: 'Próximo', color: 'bg-blue-100 text-blue-800' };
    if (hoy >= fechaInicio && hoy <= fechaFin) return { text: 'En Curso', color: 'bg-green-100 text-green-800' };
    return { text: 'Finalizado', color: 'bg-gray-100 text-gray-800' };
};

/* ==================== Tooltips Content ==================== */
const tooltipContent = {
    pagoFechaEfectivo: "Precio que el estudiante abona antes del 10 de cada mes con un descuento del 5%",
    pagoVencidoEfectivo: "Precio que el estudiante abona después del 10 del mes sin descuento",
    totalEfectivo: "Costo total del curso al pagarlo en efectivo",
    pagoFechaTransferencia: "Precio que el estudiante abona antes del 10 de cada mes mediante transferencia bancaria",
    pagoVencidoTransferencia: "Precio que el estudiante abona después del 10 del mes mediante transferencia",
    totalTransferencia: "Costo total del curso al pagarlo por transferencia",
    totalTarjeta: "Costo total del curso al pagarlo con tarjeta de crédito o débito",
    cuotas: "Número máximo de cuotas disponibles para el pago con tarjeta",
    cuotasEfectivo: "Número de cuotas aplicadas sobre el costo total en efectivo",
    cuotasTransferencia: "Número de cuotas aplicadas sobre el costo total por transferencia",
    porcentajeTarjeta: "Porcentaje de aumento aplicado sobre el costo total de efectivo para calcular el precio con tarjeta"
};

/* ==================== Página Cursos ==================== */

export default function Cursos() {
    const { courses, addCourse, updateCourse, removeCourse, professors } = useDB();
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterCod, setFilterCod] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isTeacherSelectorOpen, setIsTeacherSelectorOpen] = useState(false);

    // Lista global de tipos disponibles
    const availableCertTypes = useMemo(() => {
        const base = new Set(['UTN', 'CEA']);
        for (const c of courses) {
            (c.tiposCertificado || []).forEach(t => t && base.add(t));
        }
        return Array.from(base).sort();
    }, [courses]);

    // Form state actualizado
    const [formData, setFormData] = useState({
        nombre: '',
        profesores: [],
        // Efectivo
        pagoFechaEfectivo: '',
        pagoVencidoEfectivo: '',
        totalEfectivo: '',
        cuotasEfectivoEnabled: false,
        cuotasEfectivo: '',
        // Transferencias
        pagoFechaTransferencia: '',
        pagoVencidoTransferencia: '',
        totalTransferencia: '',
        cuotasTransferenciaEnabled: false,
        cuotasTransferencia: '',
        // Tarjetas
        porcentajeTarjeta: 30,
        totalTarjeta: '',
        cuotas: '',
        // certificados múltiples
        tiposCertificado: [],
        costosCertificado: {},
        // horarios
        horarios: [],
        horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
        certDraft: '',
        // fechas y vacantes
        inicio: '',
        fin: '',
        vacantes: '',
    });

    // Función para calcular automáticamente el total de tarjeta
    const calcularTotalTarjeta = (totalEfectivo, porcentaje) => {
        const total = Number(totalEfectivo) || 0;
        const pct = Number(porcentaje) || 0;
        return total + (total * pct / 100);
    };

    // Effect para actualizar automáticamente el total de tarjeta
    useEffect(() => {
        if (formData.totalEfectivo && formData.porcentajeTarjeta) {
            const nuevoTotal = calcularTotalTarjeta(formData.totalEfectivo, formData.porcentajeTarjeta);
            setFormData(prev => ({ ...prev, totalTarjeta: nuevoTotal.toFixed(2) }));
        }
    }, [formData.totalEfectivo, formData.porcentajeTarjeta]);

    // Manejar tecla Esc para cerrar modal
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
        setTimeout(() => removeNotification(id), 3000);
    };
    const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

    const filtered = useMemo(() => {
        return courses.filter(c => {
            const teacherNames = getTeacherNames(c.profesores || [], professors);
            const estado = getEstadoCurso(c.inicio, c.fin);

            const matchesSearch = (
                (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
                (teacherNames || '').toLowerCase().includes(search.toLowerCase())
            );

            const matchesEstado = !filterEstado || estado.text === filterEstado;
            const matchesCod = !filterCod || String(c.id).includes(filterCod);

            return matchesSearch && matchesEstado && matchesCod;
        });
    }, [courses, search, filterEstado, filterCod, professors]);

    /* ============ Abrir/Cerrar Form ============ */

    const openForm = (course) => {
        if (course) {
            setEditing(course);
            setFormData({
                nombre: course.nombre || '',
                profesores: course.profesores || [],
                pagoFechaEfectivo: String(course.pagoFechaEfectivo ?? ''),
                pagoVencidoEfectivo: String(course.pagoVencidoEfectivo ?? ''),
                totalEfectivo: String(course.totalEfectivo ?? ''),
                cuotasEfectivoEnabled: course.cuotasEfectivoEnabled ?? false,
                cuotasEfectivo: String(course.cuotasEfectivo ?? ''),
                pagoFechaTransferencia: String(course.pagoFechaTransferencia ?? ''),
                pagoVencidoTransferencia: String(course.pagoVencidoTransferencia ?? ''),
                totalTransferencia: String(course.totalTransferencia ?? ''),
                cuotasTransferenciaEnabled: course.cuotasTransferenciaEnabled ?? false,
                cuotasTransferencia: String(course.cuotasTransferencia ?? ''),
                porcentajeTarjeta: course.porcentajeTarjeta ?? 30,
                totalTarjeta: String(course.totalTarjeta ?? ''),
                cuotas: String(course.cuotas ?? ''),
                tiposCertificado: course.tiposCertificado || [],
                costosCertificado: { ...(course.costosCertificado || {}) },
                horarios: course.horarios || [],
                horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
                certDraft: '',
                inicio: course.inicio || '',
                fin: course.fin || '',
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
                cuotasEfectivoEnabled: false,
                cuotasEfectivo: '',
                pagoFechaTransferencia: '',
                pagoVencidoTransferencia: '',
                totalTransferencia: '',
                cuotasTransferenciaEnabled: false,
                cuotasTransferencia: '',
                porcentajeTarjeta: 30,
                totalTarjeta: '',
                cuotas: '',
                tiposCertificado: [],
                costosCertificado: {},
                horarios: [],
                horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
                certDraft: '',
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

    /* ============ Handlers Form ============ */

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

    /* ============ Submit ============ */

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (!formData.nombre || formData.profesores.length === 0) {
                throw new Error('Nombre y al menos un profesor son obligatorios');
            }

            const numericFields = [
                'pagoFechaEfectivo', 'pagoVencidoEfectivo', 'totalEfectivo',
                'pagoFechaTransferencia', 'pagoVencidoTransferencia', 'totalTransferencia',
                'totalTarjeta', 'cuotas', 'vacantes', 'porcentajeTarjeta'
            ];
            for (const field of numericFields) {
                const value = formData[field];
                if (value === '' || isNaN(Number(value))) {
                    throw new Error(`El campo ${field} debe ser un número válido`);
                }
            }

            // Validar cuotas opcionales
            if (formData.cuotasEfectivoEnabled && (formData.cuotasEfectivo === '' || isNaN(Number(formData.cuotasEfectivo)))) {
                throw new Error('Si habilitas cuotas en efectivo, debes especificar un número válido');
            }
            if (formData.cuotasTransferenciaEnabled && (formData.cuotasTransferencia === '' || isNaN(Number(formData.cuotasTransferencia)))) {
                throw new Error('Si habilitas cuotas en transferencias, debes especificar un número válido');
            }

            if (!formData.inicio) throw new Error('Fecha de inicio obligatoria');
            if (!formData.fin) throw new Error('Fecha de fin obligatoria');
            if (new Date(formData.fin) < new Date(formData.inicio)) {
                throw new Error('La fecha de fin no puede ser anterior al inicio');
            }

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
                cuotasEfectivoEnabled: formData.cuotasEfectivoEnabled,
                cuotasEfectivo: formData.cuotasEfectivoEnabled ? Number(formData.cuotasEfectivo) : null,
                pagoFechaTransferencia: Number(formData.pagoFechaTransferencia),
                pagoVencidoTransferencia: Number(formData.pagoVencidoTransferencia),
                totalTransferencia: Number(formData.totalTransferencia),
                cuotasTransferenciaEnabled: formData.cuotasTransferenciaEnabled,
                cuotasTransferencia: formData.cuotasTransferenciaEnabled ? Number(formData.cuotasTransferencia) : null,
                porcentajeTarjeta: Number(formData.porcentajeTarjeta),
                totalTarjeta: Number(formData.totalTarjeta),
                cuotas: Number(formData.cuotas),
                tiposCertificado: [...formData.tiposCertificado],
                costosCertificado: costos,
                horarios: [...formData.horarios],
                inicio: formData.inicio,
                fin: formData.fin,
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
        if (window.confirm(`¿Eliminar curso "${course.nombre}"?`)) {
            removeCourse(course.id);
            showNotification('success', 'Curso eliminado');
        }
    };

    /* ==================== Render ==================== */

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Filtros y Nuevo */}
                <div className="mb-6 space-y-4">
                    {/* Buscador principal con estilo distintivo */}
                    <div className="flex shadow-lg rounded-xl overflow-hidden">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o profesor..."
                            className="flex-grow px-6 py-4 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-l-xl focus:outline-none focus:from-white focus:to-blue-50 focus:border-blue-600 text-black placeholder-blue-600 text-lg"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button
                            onClick={() => openForm(null)}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-r-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold text-lg shadow-lg"
                        >
                            Nuevo Curso
                        </button>
                    </div>

                    {/* Filtros adicionales */}
                    <div className="flex gap-4 bg-white p-4 rounded-xl shadow-md">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Estado:</label>
                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none shadow-sm"
                            >
                                <option value="">Todos</option>
                                <option value="Próximo">Próximo</option>
                                <option value="En Curso">En Curso</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">COD:</label>
                            <input
                                type="text"
                                placeholder="Filtrar por código..."
                                value={filterCod}
                                onChange={(e) => setFilterCod(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none w-32 shadow-sm"
                            />
                        </div>

                        {(search || filterEstado || filterCod) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setFilterEstado('');
                                    setFilterCod('');
                                }}
                                className="text-sm text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabla mejorada */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                            <tr>
                                {[
                                    'COD', 'Nombre del Curso', 'Fecha Inicio', 'Fecha Fin',
                                    'Día y Horario', 'Profesor/es', 'Estado', 'Acciones'
                                ].map(h => (
                                    <th key={h} className="px-6 py-4 text-left font-semibold tracking-wide">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filtered.map((course, index) => {
                                const estado = getEstadoCurso(course.inicio, course.fin);
                                const horarios = resumenHorarios(course.horarios || []);
                                return (
                                    <motion.tr
                                        key={course.id}
                                        className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 ${
                                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                        }`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                    >
                                        <td className="px-6 py-4 text-black font-bold text-lg">#{course.id}</td>
                                        <td className="px-6 py-4 text-black font-semibold">{course.nombre}</td>
                                        <td className="px-6 py-4 text-gray-700">{formatDate(course.inicio)}</td>
                                        <td className="px-6 py-4 text-gray-700">{formatDate(course.fin)}</td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {Array.isArray(horarios) && horarios.length > 0 ? (
                                                <div className="space-y-1">
                                                    {horarios.map((horario, idx) => (
                                                        <div key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                            {horario}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{getTeacherNames(course.profesores || [], professors)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-2 rounded-full text-xs font-bold shadow-sm ${estado.color}`}>
                                                {estado.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-3">
                                                <motion.button
                                                    onClick={() => setViewing(course)}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                                                    title="Ver detalles"
                                                >
                                                    <FiEye size={20} />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => openForm(course)}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-full hover:bg-green-50"
                                                    title="Editar curso"
                                                >
                                                    <FiEdit size={20} />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleDelete(course)}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50"
                                                    title="Eliminar curso"
                                                >
                                                    <FiTrash2 size={20} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="text-4xl">📚</div>
                                            <div className="text-lg">
                                                {search || filterEstado || filterCod
                                                    ? 'No se encontraron cursos que coincidan con los filtros.'
                                                    : 'No hay cursos disponibles.'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detalles - NO MODIFICADO */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border-2 border-blue-400 text-black shadow-md"
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                                <button
                                    className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 shadow hover:bg-gray-200 transition-colors"
                                    onClick={() => setViewing(null)}
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-bold text-gray-800">Detalles del Curso</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Información principal */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Datos básicos */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Datos del curso</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">COD:</span>
                                                <span className="text-right">{viewing.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Nombre:</span>
                                                <span className="text-right">{viewing.nombre}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Profesor/es:</span>
                                                <span className="text-right">{getTeacherNames(viewing.profesores || [], professors)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Vacantes:</span>
                                                <span>{(viewing.vacantes ?? '-')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Estado:</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoCurso(viewing.inicio, viewing.fin).color}`}>
                                                    {getEstadoCurso(viewing.inicio, viewing.fin).text}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos económicos - Efectivo */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Efectivo</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Pago en Fecha:</span><span>${viewing.pagoFechaEfectivo || '-'}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Pago Vencido:</span><span>${viewing.pagoVencidoEfectivo || '-'}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Total:</span><span>${viewing.totalEfectivo || '-'}</span></div>
                                            {viewing.cuotasEfectivoEnabled && (
                                                <div className="flex justify-between"><span className="font-medium text-gray-600">Cuotas:</span><span>{viewing.cuotasEfectivo || '-'}</span></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Datos económicos - Transferencias */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Transferencias</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Pago en Fecha:</span><span>${viewing.pagoFechaTransferencia || '-'}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Pago Vencido:</span><span>${viewing.pagoVencidoTransferencia || '-'}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Total:</span><span>${viewing.totalTransferencia || '-'}</span></div>
                                            {viewing.cuotasTransferenciaEnabled && (
                                                <div className="flex justify-between"><span className="font-medium text-gray-600">Cuotas:</span><span>{viewing.cuotasTransferencia || '-'}</span></div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tarjetas */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Tarjetas</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Porcentaje:</span><span>{viewing.porcentajeTarjeta || '-'}%</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Curso Total:</span><span>${viewing.totalTarjeta || '-'}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Cuotas:</span><span>{viewing.cuotas || '-'}</span></div>
                                        </div>
                                    </div>

                                    {/* Fechas */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Fechas</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Inicio:</span>
                                                <span>{formatDate(viewing.inicio)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Fin:</span>
                                                <span>{formatDate(viewing.fin)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Horarios */}
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Días y horarios</h4>
                                    <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[100px] shadow-sm">
                                        {viewing.horarios?.length > 0 ? (
                                            <div className="space-y-2">
                                                {sortHorarios(viewing.horarios).map((h,i)=>(
                                                    <div key={i} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg shadow-sm">
                                                        <span className="font-medium text-gray-700">{h.dia}</span>
                                                        <span className="text-gray-600">{h.desde} - {h.hasta}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">Sin horarios definidos</p>
                                        )}
                                    </div>
                                </div>

                                {/* Certificados */}
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Certificados</h4>
                                    <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[80px] shadow-sm">
                                        {viewing.tiposCertificado?.length ? (
                                            <div className="flex flex-wrap gap-2">
                                                {viewing.tiposCertificado.map((t,i)=>(
                                                    <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm shadow-sm">
                                                        {t}: ${viewing.costosCertificado?.[t] ?? '-'}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No hay tipos de certificado</p>
                                        )}
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow"
                                        onClick={()=>{ setViewing(null); openForm(viewing); }}
                                    >
                                        <FiEdit className="w-4 h-4"/>
                                        <span>Editar</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario - No se cierra al hacer click afuera */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        // ❌ Removido el onClick para que no se cierre al hacer click afuera
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden relative text-black shadow-md"
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header fijo morado */}
                            <div className="bg-purple-600 text-white p-6 flex justify-between items-center shadow-sm">
                                <h2 className="text-2xl font-bold">{editing ? 'Editar Curso' : 'Nuevo Curso'}</h2>
                                <button type="button" className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors" onClick={closeForm}>
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Contenido con scroll */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-6 space-y-8">
                                    {/* Información general */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Información General
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="flex flex-col lg:col-span-2">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Nombre:</label>
                                                <input
                                                    name="nombre"
                                                    type="text"
                                                    value={formData.nombre}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    required
                                                />
                                            </div>

                                            <div className="flex flex-col lg:col-span-2">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Profesor/es:</label>
                                                <TeacherSelector
                                                    selectedTeachers={formData.profesores}
                                                    onTeachersChange={(teachers) => setFormData(fd => ({ ...fd, profesores: teachers }))}
                                                    isOpen={isTeacherSelectorOpen}
                                                    onToggle={() => setIsTeacherSelectorOpen(!isTeacherSelectorOpen)}
                                                    availableTeachers={professors}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos Económicos */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Datos Económicos
                                        </h3>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Efectivo */}
                                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center bg-green-100 py-2 rounded">Efectivo</h4>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.pagoFechaEfectivo}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Pago en Fecha <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="pagoFechaEfectivo"
                                                            type="number"
                                                            value={formData.pagoFechaEfectivo}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="0" step="0.01"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.pagoVencidoEfectivo}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Pago Vencidos <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="pagoVencidoEfectivo"
                                                            type="number"
                                                            value={formData.pagoVencidoEfectivo}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="0" step="0.01"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.totalEfectivo}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Costo Total <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="totalEfectivo"
                                                            type="number"
                                                            value={formData.totalEfectivo}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="0" step="0.01"
                                                        />
                                                    </div>

                                                    {/* Checkbox para cuotas en efectivo */}
                                                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-300">
                                                        <input
                                                            type="checkbox"
                                                            id="cuotasEfectivoEnabled"
                                                            checked={formData.cuotasEfectivoEnabled}
                                                            onChange={(e) => setFormData(fd => ({
                                                                ...fd,
                                                                cuotasEfectivoEnabled: e.target.checked,
                                                                cuotasEfectivo: e.target.checked ? fd.cuotasEfectivo : ''
                                                            }))}
                                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                        />
                                                        <label htmlFor="cuotasEfectivoEnabled" className="text-sm text-gray-700 font-medium">
                                                            Habilitar cuotas
                                                        </label>
                                                    </div>

                                                    {formData.cuotasEfectivoEnabled && (
                                                        <div className="flex flex-col">
                                                            <Tooltip content={tooltipContent.cuotasEfectivo}>
                                                                <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                    Nº Cuotas <FiInfo className="w-3 h-3 text-gray-400" />
                                                                </label>
                                                            </Tooltip>
                                                            <input
                                                                name="cuotasEfectivo"
                                                                type="number"
                                                                value={formData.cuotasEfectivo}
                                                                onChange={handleChange}
                                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                                min="1" step="1"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Transferencias */}
                                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center bg-blue-100 py-2 rounded">Transferencias</h4>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.pagoFechaTransferencia}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Pago en Fecha <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="pagoFechaTransferencia"
                                                            type="number"
                                                            value={formData.pagoFechaTransferencia}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="0" step="0.01"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.pagoVencidoTransferencia}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Pago Vencidos <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="pagoVencidoTransferencia"
                                                            type="number"
                                                            value={formData.pagoVencidoTransferencia}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="0" step="0.01"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.totalTransferencia}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Costo Total <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="totalTransferencia"
                                                            type="number"
                                                            value={formData.totalTransferencia}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="0" step="0.01"
                                                        />
                                                    </div>

                                                    {/* Checkbox para cuotas en transferencias */}
                                                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-300">
                                                        <input
                                                            type="checkbox"
                                                            id="cuotasTransferenciaEnabled"
                                                            checked={formData.cuotasTransferenciaEnabled}
                                                            onChange={(e) => setFormData(fd => ({
                                                                ...fd,
                                                                cuotasTransferenciaEnabled: e.target.checked,
                                                                cuotasTransferencia: e.target.checked ? fd.cuotasTransferencia : ''
                                                            }))}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <label htmlFor="cuotasTransferenciaEnabled" className="text-sm text-gray-700 font-medium">
                                                            Habilitar cuotas
                                                        </label>
                                                    </div>

                                                    {formData.cuotasTransferenciaEnabled && (
                                                        <div className="flex flex-col">
                                                            <Tooltip content={tooltipContent.cuotasTransferencia}>
                                                                <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                    Nº Cuotas <FiInfo className="w-3 h-3 text-gray-400" />
                                                                </label>
                                                            </Tooltip>
                                                            <input
                                                                name="cuotasTransferencia"
                                                                type="number"
                                                                value={formData.cuotasTransferencia}
                                                                onChange={handleChange}
                                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                                min="1" step="1"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tarjetas */}
                                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center bg-purple-100 py-2 rounded">Tarjetas</h4>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.porcentajeTarjeta}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                % <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="porcentajeTarjeta"
                                                            type="number"
                                                            value={formData.porcentajeTarjeta}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="0" step="0.01"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.totalTarjeta}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Curso Total <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="totalTarjeta"
                                                            type="number"
                                                            value={formData.totalTarjeta}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors bg-yellow-50"
                                                            required min="0" step="0.01"
                                                        />
                                                        <small className="text-xs text-gray-500 mt-1">
                                                            Calculado automáticamente: ${calcularTotalTarjeta(formData.totalEfectivo, formData.porcentajeTarjeta).toFixed(2)}
                                                        </small>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <Tooltip content={tooltipContent.cuotas}>
                                                            <label className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                                                                Cuotas <FiInfo className="w-3 h-3 text-gray-400" />
                                                            </label>
                                                        </Tooltip>
                                                        <input
                                                            name="cuotas"
                                                            type="number"
                                                            value={formData.cuotas}
                                                            onChange={handleChange}
                                                            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                            required min="1" step="1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certificados */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Certificados
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Tipo(s) de Certificado:</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        list="cert-types"
                                                        value={formData.certDraft}
                                                        onChange={(e) => setFormData(fd => ({ ...fd, certDraft: e.target.value }))}
                                                        placeholder="Escribe o selecciona (p.ej. UTN, CEA, ISO, etc.)"
                                                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none flex-1 transition-colors"
                                                    />
                                                    <datalist id="cert-types">
                                                        {availableCertTypes.map(t => <option key={t} value={t} />)}
                                                    </datalist>

                                                    <button
                                                        type="button"
                                                        onClick={handleAddCert}
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors shadow-sm"
                                                        title="Agregar certificado"
                                                    >
                                                        <FiPlus className="w-4 h-4" /> Agregar
                                                    </button>
                                                </div>

                                                {/* Chips */}
                                                <div className="mt-2 min-h-[40px]">
                                                    {formData.tiposCertificado.length === 0 ? (
                                                        <span className="text-sm text-gray-500">Escribe un tipo y presiona "Agregar".</span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {formData.tiposCertificado.map(t => (
                                                                <span key={t} className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm shadow-sm">
                                                                    {t}
                                                                    <button type="button" onClick={() => removeCert(t)} className="hover:text-red-600 transition-colors">✕</button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Costos por tipo */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Costo por tipo:</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {formData.tiposCertificado.length === 0 && (
                                                        <div className="text-sm text-gray-500">Agrega tipos para definir sus costos.</div>
                                                    )}
                                                    {formData.tiposCertificado.map(t => (
                                                        <div key={t} className="flex items-center gap-2">
                                                            <span className="min-w-[48px] text-gray-600">{t}:</span>
                                                            <input
                                                                type="number"
                                                                value={formData.costosCertificado?.[t] ?? ''}
                                                                onChange={(e) => handleCertCostChange(t, e.target.value)}
                                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none flex-1 transition-colors"
                                                                min="0" step="0.01" placeholder="0.00"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Días y horarios */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Días y Horarios
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Draft */}
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-medium mb-2 text-gray-700 block">Día:</label>
                                                    <select
                                                        value={formData.horarioDraft.dia}
                                                        onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, dia: e.target.value } }))}
                                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    >
                                                        {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-2 text-gray-700 block">Desde:</label>
                                                    <input
                                                        type="time"
                                                        value={formData.horarioDraft.desde}
                                                        onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, desde: e.target.value } }))}
                                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-2 text-gray-700 block">Hasta:</label>
                                                    <input
                                                        type="time"
                                                        value={formData.horarioDraft.hasta}
                                                        onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, hasta: e.target.value } }))}
                                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddHorario}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                                                    title="Agregar horario"
                                                >
                                                    <FiPlus className="w-4 h-4" /> Agregar
                                                </button>
                                            </div>

                                            {/* Listado */}
                                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[100px] shadow-sm">
                                                {formData.horarios.length === 0 ? (
                                                    <div className="text-gray-500 italic">Agrega al menos un horario.</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {sortHorarios(formData.horarios).map((h, idx) => (
                                                            <div
                                                                key={`${h.dia}-${h.desde}-${h.hasta}-${idx}`}
                                                                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200"
                                                            >
                                                                <div className="text-black">
                                                                    <div className="font-medium text-sm">{h.dia}</div>
                                                                    <div className="text-xs text-gray-600">{h.desde} - {h.hasta}</div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeHorario(idx)}
                                                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                                                    title="Eliminar"
                                                                >
                                                                    <FiTrash className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fechas y Vacantes */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Fechas y Vacantes
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Fecha de inicio:</label>
                                                <input
                                                    type="date"
                                                    name="inicio"
                                                    value={formData.inicio}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Fecha de fin:</label>
                                                <input
                                                    type="date"
                                                    name="fin"
                                                    value={formData.fin}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Vacantes:</label>
                                                <input
                                                    type="number"
                                                    name="vacantes"
                                                    value={formData.vacantes}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    min="0"
                                                    step="1"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer con botones fijo */}
                                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow"
                                    >
                                        <span>{editing ? 'Guardar Cambios' : 'Crear Curso'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}