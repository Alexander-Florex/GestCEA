// src/pages/Cursos.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPlus, FiTrash } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Componentes UI ==================== */

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
        if (selectedTeachers.length === 0) return 'Seleccionar profesores...';
        const names = selectedTeachers.map(id => {
            const teacher = availableTeachers.find(t => t.id === id);
            return teacher ? `${teacher.nombre} ${teacher.apellido}` : '';
        }).filter(Boolean);
        return names.join(', ');
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-left text-black focus:border-purple-500 focus:outline-none bg-white flex justify-between items-center shadow-sm"
            >
        <span className={selectedTeachers.length === 0 ? 'text-gray-400' : 'text-black'}>
          {getSelectedTeachersText()}
        </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    ▼
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-xl shadow-md max-h-60 overflow-hidden"
                    >
                        {/* Buscador */}
                        <div className="p-3 border-b border-gray-200">
                            <input
                                type="text"
                                placeholder="Buscar profesor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Lista */}
                        <div className="max-h-40 overflow-y-auto">
                            {filteredTeachers.length === 0 ? (
                                <div className="p-3 text-gray-500 text-center">No se encontraron profesores</div>
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

                        {/* Acciones */}
                        <div className="p-3 border-t border-gray-200 flex justify-between">
                            <button type="button" onClick={() => onTeachersChange([])} className="text-sm text-red-600 hover:text-red-800 transition-colors">
                                Limpiar todo
                            </button>
                            <button type="button" onClick={onToggle} className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors">
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

// Ordena por día de semana y luego por hora 'desde' y 'hasta'
const sortHorarios = (horarios = []) => {
    return [...horarios].sort((a, b) => {
        const ia = weekdayIndex(a.dia);
        const ib = weekdayIndex(b.dia);
        if (ia !== ib) return ia - ib;
        if (a.desde !== b.desde) return (a.desde || '').localeCompare(b.desde || '');
        return (a.hasta || '').localeCompare(b.hasta || '');
    });
};

const resumenHorarios = (horarios = []) =>
    sortHorarios(horarios).map(h => `${h.dia.slice(0,3)} ${h.desde}-${h.hasta}`).join(', ');

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

/* ==================== Página Cursos ==================== */

export default function Cursos() {
    const { courses, addCourse, updateCourse, removeCourse, professors } = useDB();
    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isTeacherSelectorOpen, setIsTeacherSelectorOpen] = useState(false);

    // ⚡ Lista global de tipos disponibles = base ['UTN','CEA'] + todos los que existan ya en los cursos guardados
    const availableCertTypes = useMemo(() => {
        const base = new Set(['UTN', 'CEA']);
        for (const c of courses) {
            (c.tiposCertificado || []).forEach(t => t && base.add(t));
        }
        return Array.from(base).sort();
    }, [courses]);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        profesores: [],
        precioEfectivo: '',
        recargoEfectivo: '',
        totalEfectivo: '',
        precioTarjeta: '',
        recargoTarjeta: '',
        totalTarjeta: '',
        cuotas: '',
        // certificados múltiples
        tiposCertificado: [],
        costosCertificado: {}, // dinámico por tipo
        // horarios
        horarios: [],
        horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
        certDraft: '', // input libre
        // fechas y vacantes
        inicio: '',
        fin: '',
        vacantes: '',
    });

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };
    const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

    const filtered = useMemo(() => {
        return courses.filter(c => {
            const teacherNames = getTeacherNames(c.profesores || [], professors);
            return (
                (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
                (teacherNames || '').toLowerCase().includes(search.toLowerCase())
            );
        });
    }, [courses, search, professors]);

    /* ============ Abrir/Cerrar Form ============ */

    const openForm = (course) => {
        if (course) {
            setEditing(course);
            setFormData({
                nombre: course.nombre || '',
                profesores: course.profesores || [],
                precioEfectivo: String(course.precioEfectivo ?? ''),
                recargoEfectivo: String(course.recargoEfectivo ?? ''),
                totalEfectivo: String(course.totalEfectivo ?? ''),
                precioTarjeta: String(course.precioTarjeta ?? ''),
                recargoTarjeta: String(course.recargoTarjeta ?? ''),
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
                precioEfectivo: '',
                recargoEfectivo: '',
                totalEfectivo: '',
                precioTarjeta: '',
                recargoTarjeta: '',
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
                'precioEfectivo', 'recargoEfectivo', 'totalEfectivo',
                'precioTarjeta', 'recargoTarjeta', 'totalTarjeta',
                'cuotas', 'vacantes'
            ];
            for (const field of numericFields) {
                const value = formData[field];
                if (value === '' || isNaN(Number(value))) {
                    throw new Error(`El campo ${field} debe ser un número válido`);
                }
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

            // Construcción dinámica de costos
            const costos = {};
            formData.tiposCertificado.forEach(t => {
                costos[t] = Number(formData.costosCertificado[t]);
            });

            const courseData = {
                nombre: formData.nombre,
                profesores: formData.profesores,
                precioEfectivo: Number(formData.precioEfectivo),
                recargoEfectivo: Number(formData.recargoEfectivo),
                totalEfectivo: Number(formData.totalEfectivo),
                precioTarjeta: Number(formData.precioTarjeta),
                recargoTarjeta: Number(formData.recargoTarjeta),
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
        <div className="p-6 relative">
            <Notifications notifications={notifications} remove={removeNotification} />

            {/* Buscador + Nuevo */}
            <div className="flex mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre o profesor..."
                    className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button
                    onClick={() => openForm(null)}
                    className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition-colors"
                >
                    Nuevo Curso
                </button>
            </div>

            {/* Tabla */}
            <div className="overflow-auto border-2 border-purple-500 rounded-lg shadow-sm">
                <table className="min-w-full bg-white">
                    <thead className="bg-purple-500 text-white">
                    <tr>
                        {[
                            'ID','Nombre','Profesor/es','Precio Efectivo','Recargo Efectivo','Total Curso Efectivo',
                            'Precio Tarjeta','Recargo Tarjeta','Total Curso Tarjeta','Nº de Cuotas',
                            'Certificados','Horarios','Acciones'
                        ].map(h => (
                            <th key={h} className="px-4 py-2 whitespace-nowrap">{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                    {filtered.map(course => (
                        <motion.tr
                            key={course.id}
                            className="hover:bg-gray-50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <td className="px-4 py-2 text-black">{course.id}</td>
                            <td className="px-4 py-2 text-black">{course.nombre}</td>
                            <td className="px-4 py-2 text-black">{getTeacherNames(course.profesores || [], professors)}</td>
                            <td className="px-4 py-2 text-black">${course.precioEfectivo}</td>
                            <td className="px-4 py-2 text-black">${course.recargoEfectivo}</td>
                            <td className="px-4 py-2 text-black">${course.totalEfectivo}</td>
                            <td className="px-4 py-2 text-black">${course.precioTarjeta}</td>
                            <td className="px-4 py-2 text-black">${course.recargoTarjeta}</td>
                            <td className="px-4 py-2 text-black">${course.totalTarjeta}</td>
                            <td className="px-4 py-2 text-black">{course.cuotas}</td>
                            <td className="px-4 py-2 text-black">
                                {course.tiposCertificado?.length
                                    ? course.tiposCertificado.map(t => `${t}: $${course.costosCertificado?.[t] ?? '-'}`).join(' | ')
                                    : '-'}
                            </td>
                            <td className="px-4 py-2 text-black">{resumenHorarios(course.horarios || [])}</td>
                            <td className="px-4 py-2 space-x-2">
                                <motion.button
                                    onClick={() => setViewing(course)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-black hover:text-purple-700 transition-colors"
                                    title="Ver detalles"
                                >
                                    <FiEye size={18} />
                                </motion.button>
                                <motion.button
                                    onClick={() => openForm(course)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-black hover:text-purple-700 transition-colors"
                                    title="Editar curso"
                                >
                                    <FiEdit size={18} />
                                </motion.button>
                                <motion.button
                                    onClick={() => handleDelete(course)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Eliminar curso"
                                >
                                    <FiTrash2 size={18} />
                                </motion.button>
                            </td>
                        </motion.tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={13} className="text-center py-4 text-gray-500">
                                {search ? 'No se encontraron cursos que coincidan con la búsqueda.' : 'No hay cursos disponibles.'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Modal Detalles - Estilo alineado con Profesores */}
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
                                {/* Información principal en layout horizontal */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Datos básicos */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Datos del curso</h4>
                                        <div className="space-y-2">
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
                                        </div>
                                    </div>

                                    {/* Económicos - efectivo */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Efectivo</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Precio:</span><span>${viewing.precioEfectivo}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Recargo:</span><span>${viewing.recargoEfectivo}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Total:</span><span>${viewing.totalEfectivo}</span></div>
                                        </div>
                                    </div>

                                    {/* Económicos - tarjeta */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Tarjeta</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Precio:</span><span>${viewing.precioTarjeta}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Recargo:</span><span>${viewing.recargoTarjeta}</span></div>
                                            <div className="flex justify-between"><span className="font-medium text-gray-600">Total:</span><span>${viewing.totalTarjeta}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fechas y horarios */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Fechas</h4>
                                        <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 shadow-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-medium text-gray-600">Inicio:</span>
                                                <span>{formatDate(viewing.inicio)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Fin:</span>
                                                <span>{formatDate(viewing.fin)}</span>
                                            </div>
                                        </div>
                                    </div>

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

            {/* Modal Formulario - Rediseñado como en Profesores */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeForm}
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

                                    {/* Económicos */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Datos Económicos
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {[
                                                { label: 'Precio Efectivo', name: 'precioEfectivo' },
                                                { label: 'Recargo Efectivo', name: 'recargoEfectivo' },
                                                { label: 'Total Curso Efectivo', name: 'totalEfectivo' },
                                                { label: 'Precio Tarjeta', name: 'precioTarjeta' },
                                                { label: 'Recargo Tarjeta', name: 'recargoTarjeta' },
                                                { label: 'Total Curso Tarjeta', name: 'totalTarjeta' },
                                                { label: 'Nº de Cuotas', name: 'cuotas' },
                                            ].map(({ label, name }) => (
                                                <div key={name} className="flex flex-col">
                                                    <label className="text-sm font-medium mb-2 text-gray-700">{label}:</label>
                                                    <input
                                                        name={name}
                                                        type="number"
                                                        value={formData[name]}
                                                        onChange={handleChange}
                                                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            ))}
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
                                                        <span className="text-sm text-gray-500">Escribe un tipo y presiona “Agregar”.</span>
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
