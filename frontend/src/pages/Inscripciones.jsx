// src/pages/Inscripciones.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiChevronDown, FiClock, FiCalendar } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

/* ================== Select buscable ================== */
function SearchableSelect({ options, value, onChange, placeholder, getLabel, getValue }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const list = Array.isArray(options) ? options : [];

    const toSafeLabel = (option) => {
        try {
            const raw = getLabel ? getLabel(option) : option;
            if (raw == null) return '';
            if (typeof raw === 'string') return raw;
            if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
            if (React.isValidElement?.(raw)) {
                const childText = raw.props?.children;
                return typeof childText === 'string' ? childText : String(childText ?? '');
            }
            return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
        } catch {
            return '';
        }
    };

    const getSafeValue = (option) => {
        try {
            const v = getValue ? getValue(option) : option?.value ?? option?.id ?? option;
            return v != null ? String(v) : '';
        } catch {
            return '';
        }
    };

    const filtered = useMemo(() => {
        const q = (search ?? '').toLowerCase();
        return list.filter((opt) => toSafeLabel(opt).toLowerCase().includes(q));
    }, [list, search]);

    const selectedOption = list.find((opt) => getSafeValue(opt) === String(value));

    return (
        <div className="relative">
            <div
                className="border-2 border-gray-300 rounded-xl p-3 bg-white cursor-pointer flex justify-between items-center focus-within:border-green-500 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-black">
                    {selectedOption ? toSafeLabel(selectedOption) : (placeholder || 'Seleccionar...')}
                </span>
                <FiChevronDown className={`transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-xl mt-1 z-10 max-h-60 overflow-y-auto shadow-lg">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-3 border-b border-gray-300 focus:outline-none text-black"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {filtered.map((option, index) => (
                        <div
                            key={index}
                            className="p-3 hover:bg-green-50 cursor-pointer text-black transition-colors"
                            onClick={() => {
                                onChange(getSafeValue(option));
                                setIsOpen(false);
                                setSearch('');
                            }}
                        >
                            {toSafeLabel(option)}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-3 text-gray-500">No hay resultados</div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ================== Notificaciones ================== */
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

/* ================== Helpers ================== */
const formatDate = d => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2,'0');
    const month = String(date.getMonth()+1).padStart(2,'0');
    return `${day}/${month}/${date.getFullYear()}`;
};

const diasSemana = {
    'Lunes': 'Lun',
    'Martes': 'Mar',
    'Miércoles': 'Mié',
    'Jueves': 'Jue',
    'Viernes': 'Vie',
    'Sábado': 'Sáb',
    'Domingo': 'Dom'
};

export default function Inscripciones() {
    const {
        students = [], courses = [], professors = [], becas = [],
        inscriptions = [], addInscription, updateInscription, removeInscription,
        findStudent, findCourse, findProfessor, findBeca
    } = useDB();

    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [certificadosOriginales, setCertificadosOriginales] = useState([]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n=>[...n,{id,type,message}]);
        setTimeout(()=>removeNotification(id), 3000);
    };
    const removeNotification = id => setNotifications(n=>n.filter(x=>x.id!==id));

    const filtered = useMemo(
        () => (inscriptions || []).filter(i =>
            (i.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
            (i.courseName  || '').toLowerCase().includes(search.toLowerCase()) ||
            (i.professorName || '').toLowerCase().includes(search.toLowerCase())
        ),
        [inscriptions, search]
    );

    const [form, setForm] = useState({
        studentId: '',
        courseId: '',
        professorId: '',
        certificados: [],
        hasBonus: false,
        bonusAmount: 0,
        hasBeca: false,
        becaId: '',
        fechaInicio: '',
        fechaFin: '',
        vacantes: 0,
        observaciones: ''
    });

    /* ===== Autocompletar datos del curso ===== */
    useEffect(() => {
        const course = courses.find(c => c.id === Number(form.courseId));
        if (course) {
            const certificadosDisponibles = [];
            if (course.costosCertificado) {
                Object.entries(course.costosCertificado).forEach(([tipo, costo]) => {
                    const wasSelected = certificadosOriginales.find(cert =>
                        cert.tipo === tipo
                    );

                    certificadosDisponibles.push({
                        tipo,
                        costo: Number(costo),
                        selected: wasSelected ? true : false
                    });
                });
            }

            setForm(prev => ({
                ...prev,
                fechaInicio: course.inicio || '',
                fechaFin: course.fin || '',
                vacantes: Number(course.vacantes) || 0,
                certificados: certificadosDisponibles
            }));
        }
    }, [form.courseId, courses, certificadosOriginales]);

    const openForm = inscripcion => {
        if (inscripcion) {
            setEditing(inscripcion);
            setCertificadosOriginales(inscripcion.certificados || []);
            setForm({
                studentId: inscripcion.studentId?.toString() || '',
                courseId: inscripcion.courseId?.toString() || '',
                professorId: inscripcion.professorId?.toString() || '',
                certificados: inscripcion.certificados || [],
                hasBonus: !!inscripcion.hasBonus,
                bonusAmount: Number(inscripcion.bonusAmount) || 0,
                hasBeca: !!inscripcion.hasBeca,
                becaId: inscripcion.becaId?.toString() || '',
                fechaInicio: inscripcion.fechaInicio || '',
                fechaFin: inscripcion.fechaFin || '',
                vacantes: Number(inscripcion.vacantes) || 0,
                observaciones: inscripcion.observaciones || ''
            });
        } else {
            setEditing(null);
            setCertificadosOriginales([]);
            setForm({
                studentId: '', courseId: '', professorId: '',
                certificados: [], hasBonus: false, bonusAmount: 0,
                hasBeca: false, becaId: '', fechaInicio: '', fechaFin: '', vacantes: 0, observaciones: ''
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
        setCertificadosOriginales([]);
    };

    const handleChange = e => {
        const {name, type, checked, value} = e.target;
        if (type === 'checkbox') {
            setForm(f => ({ ...f, [name]: checked }));
        } else if (type === 'number') {
            setForm(f => ({ ...f, [name]: Number(value) || 0 }));
        } else {
            setForm(f => ({ ...f, [name]: value }));
        }
    };

    const handleCertificadoChange = (index, checked) => {
        setForm(f => ({
            ...f,
            certificados: f.certificados.map((cert, i) =>
                i === index ? { ...cert, selected: checked } : cert
            )
        }));
    };

    const selectedCourse = courses.find(c => c.id === Number(form.courseId));
    const availableCourseProfessors = (professors || []).filter(p =>
        (selectedCourse?.profesores || []).includes(p.id)
    );
    const availableBecas = (becas || []).filter(b => b.activa);

    const handleSubmit = e => {
        e.preventDefault();
        try {
            if (!form.studentId || !form.courseId || !form.professorId)
                throw new Error('Completa los campos obligatorios: Alumno, Curso y Profesor');

            const student = students.find(s => s.id === Number(form.studentId));
            const course = courses.find(c => c.id === Number(form.courseId));
            const professor = professors.find(p => p.id === Number(form.professorId));

            if (!student) throw new Error('Alumno no encontrado');
            if (!course) throw new Error('Curso no encontrado');
            if (!professor) throw new Error('Profesor no encontrado');

            const certificadosSeleccionados = form.certificados.filter(cert => cert.selected);

            const newInscription = {
                studentId: student.id,
                courseId: course.id,
                studentName: `${student.nombre} ${student.apellido}`,
                courseName: course.nombre,
                professorId: professor.id,
                professorName: `${professor.nombre} ${professor.apellido}`,
                certificados: certificadosSeleccionados,
                hasBonus: form.hasBonus,
                bonusAmount: form.bonusAmount,
                hasBeca: form.hasBeca,
                becaId: form.hasBeca ? Number(form.becaId) : null,
                fechaInicio: form.fechaInicio,
                fechaFin: form.fechaFin,
                vacantes: form.vacantes,
                observaciones: form.observaciones,
                fechaCreacion: new Date().toISOString()
            };

            if (editing) {
                updateInscription(editing.id, newInscription);
                showNotification('success', 'Inscripción actualizada correctamente');
            } else {
                addInscription(newInscription);
                showNotification('success', 'Inscripción creada exitosamente');
            }
            closeForm();
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = inscripcion => {
        if (window.confirm(`¿Seguro que querés eliminar la inscripción de ${inscripcion.studentName} al curso ${inscripcion.courseName}?`)) {
            if (removeInscription) {
                removeInscription(inscripcion.id);
                showNotification('success', 'Inscripción eliminada correctamente');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <div className="p-4 sm:p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-2">Inscripciones Académicas</h1>
                    <p className="text-gray-600 text-sm sm:text-base">Gestión de inscripciones de alumnos a cursos</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por alumno, curso o profesor..."
                            className="w-full px-4 py-3 text-base sm:text-lg border-2 border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black bg-white shadow-sm transition-all duration-200"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-base sm:text-lg whitespace-nowrap"
                    >
                        Nueva Inscripción
                    </button>
                </div>

                {/* Tabla Mejorada - Responsive */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                            <tr>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-sm sm:text-base">#</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-sm sm:text-base">Alumno</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-sm sm:text-base">Curso</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-sm sm:text-base">Profesor</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-sm sm:text-base">Certificaciones</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center font-bold text-sm sm:text-base">Beca</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center font-bold text-sm sm:text-base">Bonif.</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center font-bold text-sm sm:text-base">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filtered.map((inscripcion, index) => (
                                <motion.tr
                                    key={inscripcion.id}
                                    className={`hover:bg-green-50 transition-all duration-200 ${
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                    initial={{opacity:0,y:10}}
                                    animate={{opacity:1,y:0}}
                                    transition={{duration:0.2, delay: index * 0.05}}
                                >
                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-black font-bold text-sm sm:text-base">{inscripcion.id}</td>
                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-black font-semibold text-sm sm:text-base">{inscripcion.studentName}</td>
                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-black font-semibold text-sm sm:text-base">{inscripcion.courseName}</td>
                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-gray-700 text-sm sm:text-base">{inscripcion.professorName}</td>
                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                        {inscripcion.certificados && inscripcion.certificados.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {inscripcion.certificados.map((cert, idx) => (
                                                    <span key={idx} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-lg border border-orange-200 font-medium">
                                                        {cert.tipo}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs sm:text-sm">Sin certificaciones</span>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                                        {inscripcion.hasBeca ? (
                                            <div className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full">
                                                <FiCheck className="text-green-600 font-bold" size={18} />
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-full">
                                                <span className="text-red-600 font-bold text-base sm:text-lg">✗</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                                        {inscripcion.hasBonus ? (
                                            <div className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full">
                                                <span className="text-blue-600 font-bold text-base sm:text-lg">$</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full">
                                                <span className="text-gray-400 font-bold text-base sm:text-lg">-</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                        <div className="flex justify-center space-x-1 sm:space-x-2">
                                            <motion.button
                                                onClick={() => setViewing(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                <FiEye size={16} className="sm:w-[18px] sm:h-[18px]" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openForm(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-yellow-600 hover:text-yellow-800 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-yellow-50"
                                                title="Editar"
                                            >
                                                <FiEdit size={16} className="sm:w-[18px] sm:h-[18px]" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-red-600 hover:text-red-800 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-red-50"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 sm:py-12 text-gray-500">
                                        <div className="text-lg sm:text-xl">
                                            {search ? 'No se encontraron inscripciones.' : 'No hay inscripciones registradas.'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detalles Mejorado */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative text-black shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold">Detalles de la Inscripción</h2>
                                    <p className="text-purple-100 text-xs sm:text-sm mt-1">Información completa del alumno y curso</p>
                                </div>
                                <button
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={() => setViewing(null)}
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="p-4 sm:p-6">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        {/* Columna Izquierda */}
                                        <div className="space-y-4">
                                            {/* Alumno */}
                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold">A</span>
                                                    </div>
                                                    <div className="text-sm text-purple-600 font-bold">ALUMNO</div>
                                                </div>
                                                <div className="text-lg sm:text-xl font-bold text-purple-900">{viewing.studentName}</div>
                                            </div>

                                            {/* Curso con Horarios */}
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <FiCalendar className="text-white" size={16} />
                                                    </div>
                                                    <div className="text-sm text-blue-600 font-bold">CURSO</div>
                                                </div>
                                                <div className="text-lg sm:text-xl font-bold text-blue-900 mb-3">{viewing.courseName}</div>

                                                {/* Fechas */}
                                                <div className="bg-white/60 rounded-lg p-3 mb-3 border border-blue-200">
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-blue-600 font-semibold">Inicio:</span>
                                                            <div className="text-blue-900 font-bold">{formatDate(viewing.fechaInicio)}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-600 font-semibold">Fin:</span>
                                                            <div className="text-blue-900 font-bold">{formatDate(viewing.fechaFin)}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Horarios */}
                                                {(() => {
                                                    const course = courses.find(c => c.id === viewing.courseId);
                                                    const horarios = course?.horarios || [];
                                                    return horarios.length > 0 ? (
                                                        <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FiClock className="text-blue-600" size={16} />
                                                                <span className="text-sm text-blue-600 font-semibold">Horarios:</span>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {horarios.map((h, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                                                        <span className="font-bold text-blue-900 text-sm">{h.dia}</span>
                                                                        <span className="text-blue-700 font-semibold text-sm">{h.desde} - {h.hasta}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/60 rounded-lg p-3 text-center text-blue-600 text-sm border border-blue-200">
                                                            Sin horarios definidos
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Profesor */}
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold">P</span>
                                                    </div>
                                                    <div className="text-sm text-green-600 font-bold">PROFESOR</div>
                                                </div>
                                                <div className="text-lg sm:text-xl font-bold text-green-900">{viewing.professorName}</div>
                                            </div>
                                        </div>

                                        {/* Columna Derecha */}
                                        <div className="space-y-4">
                                            {/* Certificaciones */}
                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold text-xs">C</span>
                                                    </div>
                                                    <div className="text-sm text-orange-600 font-bold">CERTIFICACIONES</div>
                                                </div>
                                                {viewing.certificados && viewing.certificados.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {viewing.certificados.map((cert, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded-lg border-2 border-orange-300 shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-bold text-orange-900">{cert.tipo}</span>
                                                                    <span className="text-orange-600 font-bold text-lg">
                                                                        ${cert.costo?.toLocaleString('es-AR') || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 text-orange-700 bg-white rounded-lg border border-orange-200">
                                                        Sin certificaciones
                                                    </div>
                                                )}
                                            </div>

                                            {/* Beneficios */}
                                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border-2 border-yellow-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold text-xs">B</span>
                                                    </div>
                                                    <div className="text-sm text-yellow-600 font-bold">BENEFICIOS</div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="bg-white p-3 rounded-lg border border-yellow-300 flex justify-between items-center">
                                                        <span className="font-semibold text-yellow-900">Beca:</span>
                                                        <span className={`font-bold text-lg ${viewing.hasBeca ? 'text-green-600' : 'text-red-600'}`}>
                                                            {viewing.hasBeca ? '✓ Sí' : '✗ No'}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border border-yellow-300 flex justify-between items-center">
                                                        <span className="font-semibold text-yellow-900">Bonificación:</span>
                                                        <span className={`font-bold text-lg ${viewing.hasBonus ? 'text-blue-600' : 'text-gray-500'}`}>
                                                            {viewing.hasBonus ? `$ ${viewing.bonusAmount}` : '✗ No'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vacantes */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold text-xs">V</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 font-bold">VACANTES</div>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900 text-center py-2">
                                                    {viewing.vacantes || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    {viewing.observaciones && (
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold text-xs">O</span>
                                                </div>
                                                <div className="text-sm text-gray-600 font-bold">OBSERVACIONES</div>
                                            </div>
                                            <div className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{viewing.observaciones}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario Mejorado */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative text-black shadow-2xl"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6 flex justify-between items-center sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold">Inscripción Académica</h2>
                                    <p className="text-green-100 text-xs sm:text-sm">Información del curso y beneficios</p>
                                </div>
                                <button
                                    type="button"
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={closeForm}
                                >
                                    <FiX className="w-5 h-5 sm:w-6 sm:h-6"/>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-4 sm:p-6 space-y-6">
                                    {/* Información Principal */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border-2 border-green-200">
                                        <h3 className="text-lg font-bold text-green-800 mb-4">Datos Principales</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-sm font-semibold mb-2 text-gray-700">Alumno *:</label>
                                                <SearchableSelect
                                                    options={students}
                                                    value={form.studentId}
                                                    onChange={v => setForm(prev => ({ ...prev, studentId: v }))}
                                                    placeholder="Seleccionar alumno..."
                                                    getLabel={s => `${s.nombre} ${s.apellido} (DNI: ${s.dni})`}
                                                    getValue={s => s.id.toString()}
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="text-sm font-semibold mb-2 text-gray-700">Curso *:</label>
                                                <SearchableSelect
                                                    options={courses}
                                                    value={form.courseId}
                                                    onChange={v => setForm(prev => ({ ...prev, courseId: v }))}
                                                    placeholder="Seleccionar curso..."
                                                    getLabel={c => c.nombre}
                                                    getValue={c => c.id.toString()}
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="text-sm font-semibold mb-2 text-gray-700">Profesor *:</label>
                                                <SearchableSelect
                                                    options={availableCourseProfessors}
                                                    value={form.professorId}
                                                    onChange={v => setForm(prev => ({ ...prev, professorId: v }))}
                                                    placeholder="Seleccionar profesor..."
                                                    getLabel={p => `${p.nombre} ${p.apellido}`}
                                                    getValue={p => p.id.toString()}
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="text-sm font-semibold mb-2 text-gray-700">Fecha Inicio:</label>
                                                <input
                                                    type="date"
                                                    value={form.fechaInicio}
                                                    disabled
                                                    className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black bg-gray-100 cursor-not-allowed"
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="text-sm font-semibold mb-2 text-gray-700">Fecha Fin:</label>
                                                <input
                                                    type="date"
                                                    value={form.fechaFin}
                                                    disabled
                                                    className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black bg-gray-100 cursor-not-allowed"
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="text-sm font-semibold mb-2 text-gray-700">Vacantes:</label>
                                                <input
                                                    type="number"
                                                    value={form.vacantes}
                                                    disabled
                                                    className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black bg-gray-100 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        {/* Horarios del curso */}
                                        {selectedCourse && selectedCourse.horarios && selectedCourse.horarios.length > 0 && (
                                            <div className="mt-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FiClock className="text-blue-600" />
                                                    <span className="font-semibold text-blue-800">Horarios del curso:</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedCourse.horarios.map((h, idx) => (
                                                        <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-blue-300 shadow-sm">
                                                            <span className="font-bold text-blue-900 text-sm">{h.dia}</span>
                                                            <span className="text-blue-700 text-sm ml-2">{h.desde} - {h.hasta}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Certificados */}
                                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-6 rounded-xl border-2 border-orange-200">
                                        <h3 className="text-lg font-bold text-orange-800 mb-4">Certificaciones</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {form.certificados.map((cert, index) => (
                                                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border-2 border-orange-300 hover:border-orange-400 transition-colors hover:shadow-md">
                                                    <input
                                                        type="checkbox"
                                                        id={`cert-${index}`}
                                                        checked={cert.selected || false}
                                                        onChange={(e) => handleCertificadoChange(index, e.target.checked)}
                                                        className="w-5 h-5 text-green-600 mt-1 cursor-pointer"
                                                    />
                                                    <label htmlFor={`cert-${index}`} className="flex-1 cursor-pointer">
                                                        <div className="font-bold text-gray-900">{cert.tipo}</div>
                                                        <div className="text-sm text-orange-600 font-bold mt-1">
                                                            ${cert.costo?.toLocaleString('es-AR') || 0}
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        {form.certificados.length === 0 && (
                                            <div className="text-center text-orange-600 py-6 bg-white rounded-lg border border-orange-200">
                                                No hay certificados disponibles
                                            </div>
                                        )}
                                    </div>

                                    {/* Bonificación y Becas */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Bonificación */}
                                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 sm:p-6 rounded-xl border-2 border-yellow-200">
                                            <h3 className="text-lg font-bold text-yellow-800 mb-4">Bonificación</h3>
                                            <div className="bg-white p-4 rounded-lg border border-yellow-300">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <input
                                                        type="checkbox"
                                                        id="hasBonus"
                                                        name="hasBonus"
                                                        checked={form.hasBonus}
                                                        onChange={handleChange}
                                                        className="w-5 h-5 text-green-600 cursor-pointer"
                                                    />
                                                    <label htmlFor="hasBonus" className="font-semibold text-yellow-900 cursor-pointer">
                                                        Aplicar bonificación
                                                    </label>
                                                </div>
                                                {form.hasBonus && (
                                                    <input
                                                        type="number"
                                                        name="bonusAmount"
                                                        value={form.bonusAmount}
                                                        onChange={handleChange}
                                                        placeholder="Monto de bonificación"
                                                        className="w-full border-2 border-yellow-400 rounded-lg px-3 py-2 text-black focus:border-yellow-500 focus:outline-none"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Becas */}
                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-xl border-2 border-blue-200">
                                            <h3 className="text-lg font-bold text-blue-800 mb-4">Becas</h3>
                                            <div className="bg-white p-4 rounded-lg border border-blue-300">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <input
                                                        type="checkbox"
                                                        id="hasBeca"
                                                        name="hasBeca"
                                                        checked={form.hasBeca}
                                                        onChange={handleChange}
                                                        className="w-5 h-5 text-green-600 cursor-pointer"
                                                    />
                                                    <label htmlFor="hasBeca" className="font-semibold text-blue-900 cursor-pointer">
                                                        Aplicar Beca
                                                    </label>
                                                </div>
                                                {form.hasBeca && (
                                                    <SearchableSelect
                                                        options={availableBecas}
                                                        value={form.becaId}
                                                        onChange={v => setForm(prev => ({ ...prev, becaId: v }))}
                                                        placeholder="Seleccionar beca..."
                                                        getLabel={b => `${b.tipo} - Descuento: $${b.monto}`}
                                                        getValue={b => b.id.toString()}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 sm:p-6 rounded-xl border-2 border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-3">Observaciones:</h3>
                                        <textarea
                                            name="observaciones"
                                            value={form.observaciones}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Observaciones adicionales..."
                                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-black focus:border-green-500 focus:outline-none resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-colors font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        {editing ? 'Guardar Cambios' : 'Crear Inscripción'}
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