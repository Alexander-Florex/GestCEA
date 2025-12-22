// src/pages/Inscripciones.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiChevronDown, FiClock, FiCalendar, FiUser, FiBook, FiDollarSign, FiPercent, FiFileText, FiTag, FiCreditCard, FiTrendingUp, FiPlus, FiMinus, FiChevronRight } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

/* ================== Select buscable mejorado ================== */
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
                className="border-2 border-gray-200 rounded-xl p-3 bg-white cursor-pointer flex justify-between items-center focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200 hover:border-blue-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selectedOption ? toSafeLabel(selectedOption) : (placeholder || 'Seleccionar...')}
                </span>
                <FiChevronDown className={`transition-transform duration-200 text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-xl mt-1 z-50 max-h-60 overflow-y-auto shadow-2xl backdrop-blur-sm"
                >
                    <div className="sticky top-0 bg-white border-b border-gray-100">
                        <input
                            type="text"
                            placeholder="🔍 Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full p-3 focus:outline-none text-gray-900 placeholder-gray-400"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.map((option, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-3 hover:bg-blue-50 cursor-pointer text-gray-800 transition-all duration-200 border-b border-gray-50 last:border-b-0"
                                onClick={() => {
                                    onChange(getSafeValue(option));
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                    {toSafeLabel(option)}
                                </div>
                            </motion.div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="p-6 text-center text-gray-400">
                                <div className="mb-2">🔍</div>
                                <p className="text-sm">No se encontraron resultados</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/* ================== Notificaciones mejoradas ================== */
function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-6 right-6 flex flex-col space-y-3 z-50">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                        }}
                        className={`px-6 py-4 rounded-xl shadow-lg cursor-pointer backdrop-blur-sm border-l-4 ${
                            n.type === 'success'
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-green-500'
                                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-900 border-red-500'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{n.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ================== Card de Estadísticas ================== */
function StatsCard({ icon: Icon, title, value, color, subtitle }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={`rounded-2xl p-6 border-0 shadow-sm hover:shadow-xl transition-all duration-300 ${color}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center mb-2">
                        <div className={`p-2 rounded-lg ${color.split(' ')[0]} mr-3`}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white uppercase tracking-wide">{title}</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
                </div>
            </div>
        </motion.div>
    );
}

/* ================== Course Card en Modal de Alumno ================== */
function CourseCard({ course, inscription, onEdit, onDelete, student }) {
    const formatDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${date.getFullYear()}`;
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        return Number(num).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const paidInstallments = inscription?.installments?.filter(i => i.status === 'Pagado' || i.status === 'Pagada')?.length || 0;
    const totalInstallments = inscription?.installments?.length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
            <div className="p-6">
                {/* Encabezado del Curso */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-lg font-bold text-gray-900">{course?.nombre || 'Curso sin nombre'}</h4>
                        <p className="text-sm text-gray-600 mt-1">ID: {inscription.courseId} • Inscrito: {formatDate(inscription.fechaInscripcion)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inscription.status === 'Cursando' ? 'bg-green-100 text-green-800' :
                            inscription.status === 'Finalizado' ? 'bg-blue-100 text-blue-800' :
                                inscription.status === 'Pendiente' ? 'bg-amber-100 text-amber-800' :
                                    'bg-gray-100 text-gray-800'
                    }`}>
                        {inscription.status}
                    </span>
                </div>

                {/* Información del Curso */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Profesor</p>
                        <p className="font-semibold text-gray-900">{inscription.professorName}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Método de Pago</p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                inscription.paymentType === 'Efectivo' ? 'bg-green-500' :
                                    inscription.paymentType === 'Transferencia' ? 'bg-blue-500' :
                                        'bg-purple-500'
                            }`}></div>
                            <span className="font-semibold text-gray-900">{inscription.paymentType}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Total Final</p>
                        <p className="text-xl font-bold text-green-700">${formatNumber(inscription.totalFinal || inscription.total || 0)}</p>
                    </div>
                </div>

                {/* Progreso de Cuotas */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Cuotas: {paidInstallments} de {totalInstallments}</span>
                        <span className="text-sm font-semibold text-blue-600">{Math.round((paidInstallments / totalInstallments) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(paidInstallments / totalInstallments) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Beneficios */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {inscription.hasBonus && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200">
                            <FiDollarSign className="w-3 h-3 mr-1" />
                            Bonif. ${formatNumber(inscription.bonusAmount)}
                        </span>
                    )}
                    {inscription.hasBeca && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
                            <FiTag className="w-3 h-3 mr-1" />
                            {inscription.becaInfo?.tipo || 'Beca'}
                        </span>
                    )}
                    {inscription.certificados?.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200">
                            <FiFileText className="w-3 h-3 mr-1" />
                            {inscription.certificados.length} Certif.
                        </span>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(inscription)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 font-medium text-sm flex items-center gap-2"
                    >
                        <FiEdit className="w-4 h-4" />
                        Editar
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(inscription)}
                        className="px-4 py-2 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 rounded-lg hover:from-red-100 hover:to-rose-100 transition-all duration-200 font-medium text-sm flex items-center gap-2"
                    >
                        <FiTrash2 className="w-4 h-4" />
                        Eliminar
                    </motion.button>
                </div>
            </div>
        </motion.div>
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

const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function Inscripciones() {
    const {
        students = [], courses = [], professors = [], becas = [],
        inscriptions = [], addInscription, updateInscription, removeInscription,
        findStudent, findCourse, findProfessor, findBeca
    } = useDB();

    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null); // Ahora será un objeto con student y sus inscriptions
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('todos');

    const [form, setForm] = useState({
        studentId: '',
        courseId: '',
        professorId: '',
        paymentType: 'Efectivo',
        fullPayment: false,
        certificados: [],
        hasBonus: false,
        bonusAmount: 0,
        hasBeca: false,
        becaId: '',
        hasFactura: false,
        tipoFactura: 'Factura C',
        fechaInicio: '',
        fechaFin: '',
        observaciones: ''
    });

    // Agrupar inscripciones por alumno
    const groupedByStudent = useMemo(() => {
        const groups = {};

        inscriptions.forEach(inscription => {
            const studentId = inscription.studentId;

            if (!groups[studentId]) {
                const student = students.find(s => s.id === studentId);
                if (!student) return;

                groups[studentId] = {
                    student,
                    inscriptions: [],
                    totalCursos: 0,
                    estadoGeneral: 'Cursando', // Default
                    totalIngresos: 0,
                    cuotasPagadas: 0,
                    cuotasTotales: 0
                };
            }

            // Encontrar curso asociado
            const course = courses.find(c => c.id === inscription.courseId);

            groups[studentId].inscriptions.push({
                ...inscription,
                course
            });

            // Actualizar estadísticas del grupo
            groups[studentId].totalCursos++;
            groups[studentId].totalIngresos += (inscription.totalFinal || inscription.total || 0);

            // Contar cuotas
            const paidInstallments = inscription.installments?.filter(i =>
                i.status === 'Pagado' || i.status === 'Pagada'
            ).length || 0;
            const totalInstallments = inscription.installments?.length || 0;

            groups[studentId].cuotasPagadas += paidInstallments;
            groups[studentId].cuotasTotales += totalInstallments;

            // Determinar estado general
            if (inscription.status === 'Cursando') {
                groups[studentId].estadoGeneral = 'Cursando';
            } else if (inscription.status === 'Finalizado' && groups[studentId].estadoGeneral !== 'Cursando') {
                groups[studentId].estadoGeneral = 'Finalizado';
            }
        });

        return Object.values(groups);
    }, [inscriptions, students, courses]);

    // Filtrar grupos por búsqueda
    const filteredGroups = useMemo(() => {
        let filtered = groupedByStudent;

        if (search) {
            const searchTerm = search.toLowerCase();
            filtered = filtered.filter(group =>
                group.student.nombre.toLowerCase().includes(searchTerm) ||
                group.student.apellido.toLowerCase().includes(searchTerm) ||
                group.student.dni?.toLowerCase().includes(searchTerm) ||
                group.inscriptions.some(ins =>
                    ins.course?.nombre?.toLowerCase().includes(searchTerm)
                )
            );
        }

        // Filtrar por pestaña activa
        switch(activeTab) {
            case 'cursando':
                return filtered.filter(group => group.estadoGeneral === 'Cursando');
            case 'finalizado':
                return filtered.filter(group => group.estadoGeneral === 'Finalizado');
            case 'pendiente':
                return filtered.filter(group => group.estadoGeneral === 'Pendiente');
            default:
                return filtered;
        }
    }, [groupedByStudent, search, activeTab]);

    // Calcular estadísticas generales
    const stats = useMemo(() => {
        const totalAlumnos = new Set(inscriptions.map(i => i.studentId)).size;
        const totalCursos = inscriptions.length;
        const cursando = inscriptions.filter(i => i.status === 'Cursando').length;
        const finalizado = inscriptions.filter(i => i.status === 'Finalizado').length;
        const totalIngresos = inscriptions.reduce((sum, ins) => sum + (ins.totalFinal || ins.total || 0), 0);

        return { totalAlumnos, totalCursos, cursando, finalizado, totalIngresos };
    }, [inscriptions]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 4000);
    };

    const removeNotification = (id) => {
        setNotifications(n => n.filter(x => x.id !== id));
    };

    // Función para cargar los datos de una inscripción en el formulario
    const loadInscriptionData = (inscription) => {
        const course = courses.find(c => c.id === inscription.courseId);
        const professor = professors.find(p => p.id === inscription.professorId);

        // Convertir los certificados de la inscripción al formato del formulario
        const certificadosForm = (course?.tiposCertificado || []).map(tipo => ({
            tipo: tipo,
            costo: course?.costosCertificado?.[tipo] || 0,
            selected: inscription.certificados?.some(c => c.tipo === tipo) || false
        }));

        setForm({
            studentId: inscription.studentId?.toString() || '',
            courseId: inscription.courseId?.toString() || '',
            professorId: inscription.professorId?.toString() || '',
            paymentType: inscription.paymentType || 'Efectivo',
            fullPayment: inscription.fullPayment || false,
            certificados: certificadosForm,
            hasBonus: inscription.hasBonus || false,
            bonusAmount: inscription.bonusAmount || 0,
            hasBeca: inscription.hasBeca || false,
            becaId: inscription.becaId?.toString() || '',
            hasFactura: inscription.hasFactura || false,
            tipoFactura: inscription.tipoFactura || 'Factura C',
            fechaInicio: inscription.fechaInicio || '',
            fechaFin: inscription.fechaFin || '',
            observaciones: inscription.observaciones || ''
        });
    };

    const openForm = (ins) => {
        if (ins) {
            setEditing(ins);
            loadInscriptionData(ins);
        } else {
            setEditing(null);
            setForm({
                studentId: '',
                courseId: '',
                professorId: '',
                paymentType: 'Efectivo',
                fullPayment: false,
                certificados: [],
                hasBonus: false,
                bonusAmount: 0,
                hasBeca: false,
                becaId: '',
                hasFactura: false,
                tipoFactura: 'Factura C',
                fechaInicio: '',
                fechaFin: '',
                observaciones: ''
            });
        }
        setIsFormOpen(true);
    };

    // MODIFICADO: Ahora acepta un parámetro para mantener el modal de detalles abierto
    const closeForm = (keepViewing = false) => {
        setIsFormOpen(false);
        setEditing(null);
        if (!keepViewing) {
            setViewing(null);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Al cambiar el curso, obtener certificados y resetear profesor
    useEffect(() => {
        if (form.courseId) {
            const curso = courses.find(c => c.id === Number(form.courseId));
            if (curso) {
                // Cargar certificados del curso
                const certificadosCurso = (curso.tiposCertificado || []).map(tipo => ({
                    tipo: tipo,
                    costo: curso.costosCertificado?.[tipo] || 0,
                    selected: false
                }));

                setForm(prev => ({
                    ...prev,
                    certificados: certificadosCurso,
                    professorId: '' // Reset profesor cuando cambia curso
                }));
            }
        }
    }, [form.courseId, courses]);

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

    const studentsWithEmpty = [{ id: '', nombre: '', apellido: '', dni: '' }, ...students];
    const coursesWithEmpty = [{ id: '', nombre: '' }, ...courses];
    const professorsWithEmpty = [{ id: '', nombre: '', apellido: '' }, ...availableCourseProfessors];

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (!form.studentId || !form.courseId || !form.professorId) {
                throw new Error("Completa los campos obligatorios: Alumno, Curso y Profesor");
            }

            const student = students.find((s) => s.id === Number(form.studentId));
            const course = courses.find((c) => c.id === Number(form.courseId));
            const professor = professors.find((p) => p.id === Number(form.professorId));

            if (!student) throw new Error("Alumno no encontrado");
            if (!course) throw new Error("Curso no encontrado");
            if (!professor) throw new Error("Profesor no encontrado");

            const readNumber = (...vals) => {
                for (const v of vals) {
                    const n = Number(v);
                    if (!Number.isNaN(n) && n > 0) return n;
                }
                return 0;
            };

            const getCuotaValues = (totalEnFecha, cuotas, rawEnFecha, rawVencido) => {
                const cuotasSafe = cuotas > 0 ? cuotas : 1;

                const cuotaEnFecha =
                    rawEnFecha > 0 ? rawEnFecha : Math.round(totalEnFecha / cuotasSafe);

                let cuotaVencido = cuotaEnFecha;
                if (rawVencido > 0) {
                    cuotaVencido =
                        rawVencido > totalEnFecha && cuotasSafe > 1
                            ? Math.round(rawVencido / cuotasSafe)
                            : rawVencido;
                }

                return { cuotaEnFecha, cuotaVencido };
            };

            const cuotasCompartidas = course.cuotasEnabled
                ? Number(
                    course.cuotasCompartidas ||
                    course.cuotasEfectivo ||
                    course.cuotasTransferencia ||
                    1
                )
                : 1;

            const totalEfectivo = readNumber(course.totalEfectivo);
            const totalTransferencia = readNumber(course.totalTransferencia);
            const totalTarjeta = readNumber(course.totalTarjeta);

            const efRawEnFecha = readNumber(
                course.pagoEnFechaEfectivo,
                course.pagoFechaEfectivo,
                course.efectivoEnFecha,
                course.cuotaEfectivoEnFecha
            );
            const efRawVencido = readNumber(
                course.pagoVencidoEfectivo,
                course.efectivoVencido,
                course.cuotaEfectivoVencido,
                course.totalEfectivoVencido
            );

            const trRawEnFecha = readNumber(
                course.pagoEnFechaTransferencia,
                course.pagoFechaTransferencia,
                course.transferenciaEnFecha,
                course.cuotaTransferenciaEnFecha
            );
            const trRawVencido = readNumber(
                course.pagoVencidoTransferencia,
                course.transferenciaVencido,
                course.cuotaTransferenciaVencido,
                course.totalTransferenciaVencido
            );

            const tarRawEnFecha = readNumber(
                course.pagoEnFechaTarjeta,
                course.totalTarjeta
            );
            const tarRawVencido = readNumber(
                course.pagoVencidoTarjeta,
                course.totalTarjetaVencido
            );

            const { cuotaEnFecha: efCuotaEnFecha, cuotaVencido: efCuotaVencido } =
                getCuotaValues(totalEfectivo, cuotasCompartidas, efRawEnFecha, efRawVencido);

            const { cuotaEnFecha: trCuotaEnFecha, cuotaVencido: trCuotaVencido } =
                getCuotaValues(
                    totalTransferencia,
                    cuotasCompartidas,
                    trRawEnFecha,
                    trRawVencido
                );

            const { cuotaEnFecha: tarCuotaEnFecha, cuotaVencido: tarCuotaVencido } =
                getCuotaValues(totalTarjeta, 1, tarRawEnFecha, tarRawVencido);

            const cursoSnapshot = {
                cursoId: course.id,
                cursoNombre: course.nombre,

                efectivo: {
                    cuotas: cuotasCompartidas,
                    cuotaEnFecha: efCuotaEnFecha,
                    cuotaVencido: efCuotaVencido,
                },
                transferencia: {
                    cuotas: cuotasCompartidas,
                    cuotaEnFecha: trCuotaEnFecha,
                    cuotaVencido: trCuotaVencido,
                },
                tarjeta: {
                    cuotas: 1,
                    cuotaEnFecha: tarCuotaEnFecha,
                    cuotaVencido: tarCuotaVencido,
                },
            };

            const selectedCertificados = (form.certificados || []).filter((c) => c.selected);
            const totalCertificados = selectedCertificados.reduce(
                (sum, cert) => sum + (Number(cert.costo) || 0),
                0
            );

            let descuentoBeca = 0;
            let becaInfo = null;

            if (form.hasBeca && form.becaId) {
                const beca = becas.find((b) => b.id === Number(form.becaId));
                if (beca) {
                    descuentoBeca = Number(beca.monto) || 0;
                    becaInfo = { id: beca.id, tipo: beca.tipo, monto: descuentoBeca };
                }
            }

            const descuentoBonificacion = form.hasBonus
                ? Number(form.bonusAmount) || 0
                : 0;

            const descuentoTotal = descuentoBeca + descuentoBonificacion;

            const buildFor = (forma) => {
                if (!forma || forma.cuotaEnFecha <= 0) return null;

                const numCuotas = form.fullPayment ? 1 : (forma.cuotas || 1);

                const totalCursoEnFecha = forma.cuotaEnFecha * numCuotas;
                const totalCursoVencido = forma.cuotaVencido * numCuotas;

                const totalCursoFinalEnFecha = totalCursoEnFecha - descuentoTotal;
                const totalCursoFinalVencido = totalCursoVencido - descuentoTotal;

                if (totalCursoFinalEnFecha <= 0) {
                    throw new Error("El total final del curso debe ser mayor a 0");
                }

                let installments = [];

                if (!form.fullPayment && numCuotas > 1) {
                    const fechaInicio = form.fechaInicio
                        ? new Date(form.fechaInicio)
                        : new Date();

                    const totalFinalEnFechaRound = Math.round(totalCursoFinalEnFecha);
                    const totalFinalVencidoRound = Math.round(totalCursoFinalVencido);

                    const baseEnFecha = Math.round(totalFinalEnFechaRound / numCuotas);
                    const baseVencido = Math.round(totalFinalVencidoRound / numCuotas);

                    let accEnFecha = 0;
                    let accVencido = 0;

                    for (let i = 0; i < numCuotas; i++) {
                        const fechaVenc = new Date(fechaInicio);
                        fechaVenc.setMonth(fechaVenc.getMonth() + i);

                        let montoEnFecha, montoVencido;

                        if (i === numCuotas - 1) {
                            montoEnFecha = totalFinalEnFechaRound - accEnFecha;
                            montoVencido = totalFinalVencidoRound - accVencido;
                        } else {
                            montoEnFecha = baseEnFecha;
                            montoVencido = baseVencido;
                            accEnFecha += montoEnFecha;
                            accVencido += montoVencido;
                        }

                        installments.push({
                            number: i + 1,
                            dueDate: fechaVenc.toISOString().split("T")[0],
                            amount: montoEnFecha,
                            amountEnFecha: montoEnFecha,
                            amountVencido: montoVencido,
                            amountPaid: 0,
                            status: "Pendiente",
                            paidAt: null,
                            frozen: false,
                        });
                    }

                } else {
                    const fechaInicio = form.fechaInicio
                        ? new Date(form.fechaInicio)
                        : new Date();

                    installments.push({
                        number: 1,
                        dueDate: fechaInicio.toISOString().split("T")[0],
                        amount: Math.round(totalCursoFinalEnFecha),
                        amountEnFecha: Math.round(totalCursoFinalEnFecha),
                        amountVencido: Math.round(totalCursoFinalVencido),
                        amountPaid: 0,
                        status: "Pendiente",
                        paidAt: null,
                        frozen: false,
                    });
                }

                return {
                    numCuotas,
                    installments,
                    totalCursoEnFecha,
                    totalCursoVencido,
                    totalFinalEnFecha: totalCursoFinalEnFecha,
                    totalFinalVencido: totalCursoFinalVencido,
                };
            };

            const builds = {
                efectivo: buildFor(cursoSnapshot.efectivo),
                transferencia: buildFor(cursoSnapshot.transferencia),
                tarjeta: buildFor(cursoSnapshot.tarjeta),
            };

            const mainKey =
                form.paymentType === "Efectivo"
                    ? "efectivo"
                    : form.paymentType === "Transferencia"
                        ? "transferencia"
                        : "tarjeta";

            const main = builds[mainKey];
            if (!main) throw new Error("La forma de pago seleccionada no tiene precio válido.");

            const data = {
                studentId: student.id,
                studentName: `${student.nombre} ${student.apellido}`,
                courseId: course.id,
                courseName: course.nombre,
                professorId: professor.id,
                professorName: `${professor.nombre} ${professor.apellido}`,

                cursoSnapshot,
                paymentType: form.paymentType,
                fullPayment: form.fullPayment,

                certificados: selectedCertificados,
                totalCertificados,

                hasBonus: form.hasBonus,
                bonusAmount: descuentoBonificacion,
                hasBeca: form.hasBeca,
                becaId: form.hasBeca ? Number(form.becaId) : null,
                becaMonto: descuentoBeca,
                becaInfo,

                hasFactura: form.hasFactura,
                tipoFactura: form.hasFactura ? form.tipoFactura : null,

                fechaInscripcion: new Date().toISOString(),
                inicio: form.fechaInicio,
                fin: form.fechaFin,
                observaciones: form.observaciones,
                status: "Cursando",

                precioBaseCurso: main.totalCursoEnFecha,
                totalBruto: main.totalBrutoEnFecha,
                descuentoTotal,
                totalFinal: main.totalFinalEnFecha,
                totalFinalVencido: main.totalFinalVencido,
                total: main.totalFinalEnFecha,

                installments: main.installments,
                numCuotas: main.numCuotas,

                totalsByMethod: {
                    efectivo: builds.efectivo
                        ? {
                            totalFinal: builds.efectivo.totalFinalEnFecha,
                            totalFinalVencido: builds.efectivo.totalFinalVencido,
                            numCuotas: builds.efectivo.numCuotas,
                        }
                        : null,
                    transferencia: builds.transferencia
                        ? {
                            totalFinal: builds.transferencia.totalFinalEnFecha,
                            totalFinalVencido: builds.transferencia.totalFinalVencido,
                            numCuotas: builds.transferencia.numCuotas,
                        }
                        : null,
                    tarjeta: builds.tarjeta
                        ? {
                            totalFinal: builds.tarjeta.totalFinalEnFecha,
                            totalFinalVencido: builds.tarjeta.totalFinalVencido,
                            numCuotas: builds.tarjeta.numCuotas,
                        }
                        : null,
                },

                installmentsByMethod: {
                    efectivo: builds.efectivo?.installments || [],
                    transferencia: builds.transferencia?.installments || [],
                    tarjeta: builds.tarjeta?.installments || [],
                },

                horarios: course.horarios || [],
                vacantes: course.vacantes || 0,
            };

            if (editing) {
                updateInscription(editing.id, data);
                showNotification("success", "✅ Inscripción actualizada correctamente");
            } else {
                addInscription(data);
                showNotification("success", "🎉 Inscripción creada exitosamente");
            }

            // MODIFICADO: Mantener el modal de detalles abierto si estamos editando desde ahí
            closeForm(!!viewing);
        } catch (err) {
            console.error("❌ ERROR:", err);
            showNotification("error", `❌ ${err.message}`);
        }
    };

    const handleDeleteInscription = (inscription) => {
        if (window.confirm(`¿Eliminar inscripción de ${inscription.studentName} en el curso ${inscription.courseName}?`)) {
            removeInscription(inscription.id);
            showNotification('success', '🗑️ Inscripción eliminada');

            // Cerrar modal si estamos viendo ese alumno
            if (viewing && viewing.student.id === inscription.studentId) {
                const updatedViewing = { ...viewing };
                updatedViewing.inscriptions = updatedViewing.inscriptions.filter(
                    ins => ins.id !== inscription.id
                );

                if (updatedViewing.inscriptions.length === 0) {
                    setViewing(null);
                } else {
                    setViewing(updatedViewing);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900 p-4 sm:p-8">
            <Notifications notifications={notifications} remove={removeNotification} />

            {/* Header Principal */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            🎓 Gestión de Inscripciones
                        </h1>
                        <p className="text-gray-600 mt-2">Administra todas las inscripciones académicas agrupadas por alumno</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openForm(null)}
                        className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <FiPlus className="text-xl" />
                        Nueva Inscripción
                    </motion.button>
                </div>

                {/* Tarjetas de Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        icon={FiUser}
                        title="Total Alumnos"
                        value={stats.totalAlumnos}
                        color="bg-gradient-to-r from-blue-600 to-blue-700"
                        subtitle="Alumnos únicos"
                    />
                    <StatsCard
                        icon={FiBook}
                        title="Total Cursos"
                        value={stats.totalCursos}
                        color="bg-gradient-to-r from-emerald-600 to-teal-700"
                        subtitle="Inscripciones activas"
                    />
                    <StatsCard
                        icon={FiTrendingUp}
                        title="Cursando"
                        value={stats.cursando}
                        color="bg-gradient-to-r from-purple-600 to-purple-700"
                        subtitle="Cursos en progreso"
                    />
                    <StatsCard
                        icon={FiDollarSign}
                        title="Ingresos Totales"
                        value={`$${formatNumber(stats.totalIngresos)}`}
                        color="bg-gradient-to-r from-amber-600 to-orange-700"
                        subtitle="Acumulado"
                    />
                </div>
            </motion.div>

            {/* Panel de Control */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar por alumno, DNI o curso..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-5 py-3 pl-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <FiEye className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                            {['todos', 'cursando', 'finalizado', 'pendiente'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        activeTab === tab
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* TABLA MEJORADA - Agrupada por Alumno */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <FiUser className="w-4 h-4" />
                                    Alumno
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <FiBook className="w-4 h-4" />
                                    Cursos
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <FiCreditCard className="w-4 h-4" />
                                    Cuotas
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <FiDollarSign className="w-4 h-4" />
                                    Total
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filteredGroups.map((group, i) => (
                            <motion.tr
                                key={group.student.id || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-blue-50/50 transition-colors duration-200"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                                                <span className="font-bold text-blue-600">
                                                    {group.student.nombre?.charAt(0)}{group.student.apellido?.charAt(0)}
                                                </span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {group.student.nombre} {group.student.apellido}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                DNI: {group.student.dni || 'Sin DNI'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {group.student.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-gray-900">
                                            {group.totalCursos} curso{group.totalCursos !== 1 ? 's' : ''}
                                        </div>
                                        <div className="text-xs text-gray-500 max-w-xs truncate">
                                            {group.inscriptions.slice(0, 2).map(ins => ins.course?.nombre).join(', ')}
                                            {group.totalCursos > 2 && ` +${group.totalCursos - 2} más`}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                                                    style={{ width: `${(group.cuotasPagadas / group.cuotasTotales) * 100 || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {group.cuotasPagadas} de {group.cuotasTotales} pagadas
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        group.estadoGeneral === 'Cursando' ? 'bg-green-100 text-green-800' :
                                            group.estadoGeneral === 'Finalizado' ? 'bg-blue-100 text-blue-800' :
                                                'bg-amber-100 text-amber-800'
                                    }`}>
                                        {group.estadoGeneral}
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-green-700">
                                        ${formatNumber(group.totalIngresos)}
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setViewing(group)}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm flex items-center gap-2"
                                            title="Ver detalles"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            Ver
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                // Crear nueva inscripción para este alumno
                                                const newForm = { ...form };
                                                newForm.studentId = group.student.id.toString();
                                                setForm(newForm);
                                                setEditing(null);
                                                setIsFormOpen(true);
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-medium text-sm flex items-center gap-2"
                                            title="Agregar curso"
                                        >
                                            <FiPlus className="w-4 h-4" />
                                            Curso
                                        </motion.button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>

                    {filteredGroups.length === 0 && (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 mb-4">
                                <FiUser className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay alumnos inscritos</h3>
                            <p className="text-gray-500 mb-6">Crea una nueva inscripción para comenzar</p>
                            <button
                                onClick={() => openForm(null)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold flex items-center gap-2 mx-auto"
                            >
                                <FiPlus className="w-5 h-5" />
                                Crear primera inscripción
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Modal de Detalles del Alumno */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative text-gray-900 shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 z-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold">👨‍🎓 Detalles del Alumno</h2>
                                        <p className="text-blue-100 text-sm mt-1">
                                            {viewing.student.nombre} {viewing.student.apellido} • DNI: {viewing.student.dni} • {viewing.totalCursos} curso{viewing.totalCursos !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const newForm = { ...form };
                                                newForm.studentId = viewing.student.id.toString();
                                                setForm(newForm);
                                                setEditing(null);
                                                setViewing(null);
                                                setIsFormOpen(true);
                                            }}
                                            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-200 text-sm font-medium flex items-center gap-2"
                                        >
                                            <FiPlus className="w-4 h-4" />
                                            Nuevo Curso
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setViewing(null)}
                                            className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                        >
                                            <FiX className="w-6 h-6" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Información del Alumno */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-blue-500">
                                                <FiUser className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">Alumno</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{viewing.student.nombre} {viewing.student.apellido}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-emerald-500">
                                                <FiBook className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">Cursos</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{viewing.totalCursos}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-amber-500">
                                                <FiCreditCard className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">Cuotas</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {viewing.cuotasPagadas}/{viewing.cuotasTotales}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-green-500">
                                                <FiDollarSign className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">Total</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-700">${formatNumber(viewing.totalIngresos)}</p>
                                    </div>
                                </div>

                                {/* Información de Contacto */}
                                <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200 mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiUser className="w-5 h-5 text-blue-600" />
                                        Información de Contacto
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-600">DNI</p>
                                            <p className="font-semibold text-gray-900">{viewing.student.dni || 'No especificado'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-semibold text-gray-900">{viewing.student.email || 'No especificado'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-600">Teléfono</p>
                                            <p className="font-semibold text-gray-900">{viewing.student.telefono || 'No especificado'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de Cursos */}
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiBook className="w-5 h-5 text-emerald-600" />
                                        Cursos Inscritos ({viewing.inscriptions.length})
                                    </h3>

                                    {viewing.inscriptions.length === 0 ? (
                                        <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-300">
                                            <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600 mb-4">El alumno no está inscrito en ningún curso</p>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    const newForm = { ...form };
                                                    newForm.studentId = viewing.student.id.toString();
                                                    setForm(newForm);
                                                    setEditing(null);
                                                    setViewing(null);
                                                    setIsFormOpen(true);
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm flex items-center gap-2 mx-auto"
                                            >
                                                <FiPlus className="w-4 h-4" />
                                                Inscribir en un curso
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {viewing.inscriptions.map((inscription, index) => (
                                                <CourseCard
                                                    key={inscription.id || index}
                                                    course={inscription.course}
                                                    inscription={inscription}
                                                    student={viewing.student}
                                                    // MODIFICADO: Ahora carga los datos de la inscripción antes de abrir el formulario
                                                    onEdit={() => {
                                                        loadInscriptionData(inscription);
                                                        setEditing(inscription);
                                                        setIsFormOpen(true);
                                                    }}
                                                    onDelete={() => handleDeleteInscription(inscription)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Botón para agregar más cursos */}
                                {viewing.inscriptions.length > 0 && (
                                    <div className="text-center pt-6 border-t border-gray-200">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const newForm = { ...form };
                                                newForm.studentId = viewing.student.id.toString();
                                                setForm(newForm);
                                                setEditing(null);
                                                setViewing(null);
                                                setIsFormOpen(true);
                                            }}
                                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-bold flex items-center gap-2 mx-auto"
                                        >
                                            <FiPlus className="w-5 h-5" />
                                            Agregar otro curso
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario Mejorado (Mismo que antes) */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative text-gray-900 shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {editing ? '✏️ Editar Inscripción' : '🎓 Nueva Inscripción'}
                                    </h2>
                                    <p className="text-blue-100 text-sm">Completa la información del curso</p>
                                </div>
                                <motion.button
                                    type="button"
                                    whileHover={{ rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    // MODIFICADO: Ahora mantiene el modal de detalles abierto si existe
                                    onClick={() => closeForm(!!viewing)}
                                >
                                    <FiX className="w-6 h-6" />
                                </motion.button>
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-8 space-y-8">
                                    {/* Información Principal */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200"
                                    >
                                        <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                                            <FiUser className="w-5 h-5" />
                                            Datos Principales
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold mb-3 text-gray-700 block">Alumno *</label>
                                                <SearchableSelect
                                                    options={studentsWithEmpty}
                                                    value={form.studentId}
                                                    onChange={v => setForm(prev => ({ ...prev, studentId: v }))}
                                                    placeholder="Seleccionar alumno..."
                                                    getLabel={s => s.id ? `${s.nombre} ${s.apellido} (DNI: ${s.dni})` : ''}
                                                    getValue={s => s.id ? s.id.toString() : ''}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-semibold mb-3 text-gray-700 block">Curso *</label>
                                                <SearchableSelect
                                                    options={coursesWithEmpty}
                                                    value={form.courseId}
                                                    onChange={v => setForm(prev => ({ ...prev, courseId: v }))}
                                                    placeholder="Seleccionar curso..."
                                                    getLabel={c => c.id ? c.nombre : ''}
                                                    getValue={c => c.id ? c.id.toString() : ''}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-semibold mb-3 text-gray-700 block">Profesor *</label>
                                                <SearchableSelect
                                                    options={professorsWithEmpty}
                                                    value={form.professorId}
                                                    onChange={v => setForm(prev => ({ ...prev, professorId: v }))}
                                                    placeholder="Seleccionar profesor..."
                                                    getLabel={p => p.id ? `${p.nombre} ${p.apellido}` : ''}
                                                    getValue={p => p.id ? p.id.toString() : ''}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* 💰 Información de Costos del Curso */}
                                    {selectedCourse && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200"
                                        >
                                            <h3 className="text-xl font-bold text-emerald-800 mb-6 flex items-center gap-2">
                                                <FiDollarSign className="w-5 h-5" />
                                                Información de Costos
                                            </h3>

                                            {/* Método de Pago */}
                                            <div className="mb-8 bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                                                <h4 className="font-bold text-blue-800 mb-4 text-lg">Método de pago referencial</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {['Efectivo', 'Transferencia', 'Tarjeta'].map((method) => (
                                                        <motion.div
                                                            key={method}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                                form.paymentType === method
                                                                    ? 'border-blue-500 bg-blue-50'
                                                                    : 'border-gray-200 hover:border-blue-300'
                                                            }`}
                                                            onClick={() => setForm(prev => ({ ...prev, paymentType: method }))}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                                    form.paymentType === method
                                                                        ? 'border-blue-500 bg-blue-500'
                                                                        : 'border-gray-300'
                                                                }`}>
                                                                    {form.paymentType === method && (
                                                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                                                    )}
                                                                </div>
                                                                <span className="font-medium text-gray-900">{method}</span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-3">Esta selección es referencial. El alumno puede pagar con cualquier método.</p>
                                            </div>

                                            {/* Opción de Pago Completo */}
                                            <div className="mb-8 bg-white p-6 rounded-xl border-2 border-amber-200 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            id="fullPayment"
                                                            name="fullPayment"
                                                            checked={form.fullPayment}
                                                            onChange={handleChange}
                                                            className="sr-only"
                                                        />
                                                        <label
                                                            htmlFor="fullPayment"
                                                            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                                                form.fullPayment ? 'bg-amber-500' : 'bg-gray-300'
                                                            }`}
                                                        >
                                                            <span className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                                                                form.fullPayment ? 'translate-x-4' : ''
                                                            }`}></span>
                                                        </label>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label htmlFor="fullPayment" className="text-lg font-bold text-amber-800 cursor-pointer">
                                                            Abonar curso completo (Pago único)
                                                        </label>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {form.fullPayment
                                                                ? "Se generará un único pago por el total del curso. No se crearán cuotas."
                                                                : "Se generarán cuotas mensuales según el método seleccionado."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tarjetas de Costos Detallados */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Efectivo */}
                                                <motion.div
                                                    whileHover={{ y: -5 }}
                                                    className={`bg-white p-5 rounded-xl border-2 ${
                                                        form.paymentType === 'Efectivo' ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                                                    } shadow-sm transition-all`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 text-lg">Efectivo</h4>
                                                        {form.paymentType === 'Efectivo' && (
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                                Seleccionado
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                                        <p className="text-sm text-gray-600 mb-1">Total del Curso</p>
                                                        <p className="text-2xl font-bold text-blue-700">
                                                            ${formatNumber(selectedCourse.totalEfectivo || 0)}
                                                        </p>
                                                    </div>

                                                    {!form.fullPayment && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center border-b pb-2">
                                                                <span className="text-sm text-gray-600">Cuotas:</span>
                                                                <span className="font-bold text-gray-900">
                                                                    {selectedCourse.cuotasEnabled ? (selectedCourse.cuotasCompartidas || 1) : 1}
                                                                </span>
                                                            </div>

                                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                                <p className="text-xs text-gray-500 mb-2">Valor por cuota:</p>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-xs text-gray-600">En fecha</p>
                                                                        <p className="text-sm font-bold text-blue-700">
                                                                            ${formatNumber(selectedCourse.pagoFechaEfectivo || Math.round((selectedCourse.totalEfectivo || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs text-gray-600">Vencida</p>
                                                                        <p className="text-sm font-bold text-red-600">
                                                                            ${formatNumber(selectedCourse.pagoVencidoEfectivo || Math.round((selectedCourse.totalEfectivo || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {form.fullPayment && (
                                                        <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                                                            <p className="text-sm font-semibold text-amber-700">
                                                                📌 Pago único: ${formatNumber(selectedCourse.totalEfectivo || 0)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>

                                                {/* Transferencia */}
                                                <motion.div
                                                    whileHover={{ y: -5 }}
                                                    className={`bg-white p-5 rounded-xl border-2 ${
                                                        form.paymentType === 'Transferencia' ? 'border-emerald-500 shadow-lg' : 'border-gray-200'
                                                    } shadow-sm transition-all`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 text-lg">Transferencia</h4>
                                                        {form.paymentType === 'Transferencia' && (
                                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                                                Seleccionado
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                                                        <p className="text-sm text-gray-600 mb-1">Total del Curso</p>
                                                        <p className="text-2xl font-bold text-emerald-700">
                                                            ${formatNumber(selectedCourse.totalTransferencia || 0)}
                                                        </p>
                                                    </div>

                                                    {!form.fullPayment && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center border-b pb-2">
                                                                <span className="text-sm text-gray-600">Cuotas:</span>
                                                                <span className="font-bold text-gray-900">
                                                                    {selectedCourse.cuotasEnabled ? (selectedCourse.cuotasCompartidas || 1) : 1}
                                                                </span>
                                                            </div>

                                                            <div className="p-3 bg-emerald-50 rounded-lg">
                                                                <p className="text-xs text-gray-500 mb-2">Valor por cuota:</p>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-xs text-gray-600">En fecha</p>
                                                                        <p className="text-sm font-bold text-emerald-700">
                                                                            ${formatNumber(selectedCourse.pagoFechaTransferencia || Math.round((selectedCourse.totalTransferencia || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs text-gray-600">Vencida</p>
                                                                        <p className="text-sm font-bold text-red-600">
                                                                            ${formatNumber(selectedCourse.pagoVencidoTransferencia || Math.round((selectedCourse.totalTransferencia || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {form.fullPayment && (
                                                        <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                                                            <p className="text-sm font-semibold text-amber-700">
                                                                📌 Pago único: ${formatNumber(selectedCourse.totalTransferencia || 0)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>

                                                {/* Tarjeta */}
                                                <motion.div
                                                    whileHover={{ y: -5 }}
                                                    className={`bg-white p-5 rounded-xl border-2 ${
                                                        form.paymentType === 'Tarjeta' ? 'border-purple-500 shadow-lg' : 'border-gray-200'
                                                    } shadow-sm transition-all`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 text-lg">Tarjeta</h4>
                                                        {form.paymentType === 'Tarjeta' && (
                                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                                                Seleccionado
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                                        <p className="text-sm text-gray-600 mb-1">Total del Curso</p>
                                                        <p className="text-2xl font-bold text-purple-700">
                                                            ${formatNumber(selectedCourse.totalTarjeta || 0)}
                                                        </p>
                                                    </div>

                                                    {!form.fullPayment && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center border-b pb-2">
                                                                <span className="text-sm text-gray-600">Cuotas:</span>
                                                                <span className="font-bold text-gray-900">1</span>
                                                            </div>

                                                            <div className="p-3 bg-purple-50 rounded-lg">
                                                                <p className="text-xs text-gray-500 mb-2">Valor por cuota:</p>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-xs text-gray-600">En fecha</p>
                                                                        <p className="text-sm font-bold text-purple-700">
                                                                            ${formatNumber(selectedCourse.pagoFechaTarjeta || selectedCourse.totalTarjeta || 0)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs text-gray-600">Vencida</p>
                                                                        <p className="text-sm font-bold text-red-600">
                                                                            ${formatNumber(selectedCourse.pagoVencidoTarjeta || selectedCourse.totalTarjeta || 0)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {form.fullPayment && (
                                                        <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                                                            <p className="text-sm font-semibold text-amber-700">
                                                                📌 Pago único: ${formatNumber(selectedCourse.totalTarjeta || 0)}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="mt-3 p-2 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                                                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                                                            <FiCreditCard className="w-3 h-3" />
                                                            Tarjeta: Pago único (sin cuotas)
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Resumen */}
                                            <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5">
                                                <p className="text-sm font-semibold text-gray-800 mb-3">Resumen de configuración:</p>
                                                <div className="flex flex-wrap gap-4">
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                                                        <div className={`w-3 h-3 rounded-full ${
                                                            form.paymentType === 'Efectivo' ? 'bg-blue-500' :
                                                                form.paymentType === 'Transferencia' ? 'bg-emerald-500' :
                                                                    'bg-purple-500'
                                                        }`}></div>
                                                        <span className="text-sm text-gray-700">
                                                            Método: <span className="font-bold text-gray-900">{form.paymentType}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                                                        <div className={`w-3 h-3 rounded-full ${form.fullPayment ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                                        <span className="text-sm text-gray-700">
                                                            Modalidad: <span className="font-bold text-gray-900">{form.fullPayment ? 'Pago completo' : 'En cuotas'}</span>
                                                        </span>
                                                    </div>
                                                    {!form.fullPayment && (
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                                                            <FiCalendar className="w-4 h-4 text-gray-500" />
                                                            <span className="text-sm text-gray-700">
                                                                Cuotas: <span className="font-bold text-gray-900">
                                                                    {form.paymentType === 'Tarjeta' ? '1' :
                                                                        selectedCourse.cuotasEnabled ? (selectedCourse.cuotasCompartidas || 1) : 1}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Vacantes */}
                                            {selectedCourse.vacantes > 0 && (
                                                <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                        <p className="text-sm text-amber-800 font-medium">
                                                            <span className="font-bold">Vacantes disponibles:</span> {selectedCourse.vacantes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Certificados */}
                                    {form.certificados.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200"
                                        >
                                            <h3 className="text-xl font-bold text-purple-800 mb-6 flex items-center gap-2">
                                                <FiFileText className="w-5 h-5" />
                                                Certificados
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {form.certificados.map((cert, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        whileHover={{ scale: 1.02 }}
                                                        className="bg-white p-4 rounded-xl border border-purple-300 flex justify-between items-center"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={cert.selected}
                                                                    onChange={(e) => handleCertificadoChange(idx, e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div
                                                                    onClick={() => handleCertificadoChange(idx, !cert.selected)}
                                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                                                        cert.selected
                                                                            ? 'bg-purple-500 border-purple-500'
                                                                            : 'border-gray-300'
                                                                    }`}
                                                                >
                                                                    {cert.selected && (
                                                                        <FiCheck className="w-3 h-3 text-white" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="font-semibold text-gray-900">{cert.tipo}</span>
                                                        </div>
                                                        <span className="text-lg font-bold text-purple-700">${formatNumber(cert.costo)}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Bonificaciones */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-2 border-amber-200"
                                    >
                                        <h3 className="text-xl font-bold text-amber-800 mb-6 flex items-center gap-2">
                                            <FiPercent className="w-5 h-5" />
                                            Bonificaciones
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        id="hasBonus"
                                                        name="hasBonus"
                                                        checked={form.hasBonus}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <label
                                                        htmlFor="hasBonus"
                                                        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                                            form.hasBonus ? 'bg-amber-500' : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        <span className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                                                            form.hasBonus ? 'translate-x-4' : ''
                                                        }`}></span>
                                                    </label>
                                                </div>
                                                <label htmlFor="hasBonus" className="text-lg font-semibold text-amber-900 cursor-pointer">
                                                    Aplicar bonificación
                                                </label>
                                            </div>
                                            {form.hasBonus && (
                                                <div className="pl-14">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 font-bold">$</span>
                                                        <input
                                                            type="number"
                                                            name="bonusAmount"
                                                            value={form.bonusAmount}
                                                            onChange={handleChange}
                                                            placeholder="Monto de bonificación"
                                                            className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 pl-8 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Becas */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200"
                                    >
                                        <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                                            <FiTag className="w-5 h-5" />
                                            Becas
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        id="hasBeca"
                                                        name="hasBeca"
                                                        checked={form.hasBeca}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <label
                                                        htmlFor="hasBeca"
                                                        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                                            form.hasBeca ? 'bg-blue-500' : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        <span className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                                                            form.hasBeca ? 'translate-x-4' : ''
                                                        }`}></span>
                                                    </label>
                                                </div>
                                                <label htmlFor="hasBeca" className="text-lg font-semibold text-blue-900 cursor-pointer">
                                                    Aplicar Beca
                                                </label>
                                            </div>
                                            {form.hasBeca && (
                                                <div className="pl-14">
                                                    <SearchableSelect
                                                        options={availableBecas}
                                                        value={form.becaId}
                                                        onChange={v => setForm(prev => ({ ...prev, becaId: v }))}
                                                        placeholder="Seleccionar beca..."
                                                        getLabel={b => `${b.tipo} - Descuento: $${formatNumber(b.monto)}`}
                                                        getValue={b => b.id.toString()}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Facturación */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl border-2 border-pink-200"
                                    >
                                        <h3 className="text-xl font-bold text-pink-800 mb-6 flex items-center gap-2">
                                            <FiFileText className="w-5 h-5" />
                                            Facturación
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        id="hasFactura"
                                                        name="hasFactura"
                                                        checked={form.hasFactura}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <label
                                                        htmlFor="hasFactura"
                                                        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                                            form.hasFactura ? 'bg-pink-500' : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        <span className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                                                            form.hasFactura ? 'translate-x-4' : ''
                                                        }`}></span>
                                                    </label>
                                                </div>
                                                <label htmlFor="hasFactura" className="text-lg font-semibold text-pink-900 cursor-pointer">
                                                    Emitir Factura
                                                </label>
                                            </div>
                                            {form.hasFactura && (
                                                <div className="pl-14 space-y-3">
                                                    {['Factura A', 'Factura C'].map((tipo) => (
                                                        <div key={tipo} className="flex items-center gap-3">
                                                            <div
                                                                onClick={() => setForm(prev => ({ ...prev, tipoFactura: tipo }))}
                                                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer"
                                                                style={{
                                                                    borderColor: form.tipoFactura === tipo ? '#ec4899' : '#d1d5db',
                                                                    backgroundColor: form.tipoFactura === tipo ? '#ec4899' : 'transparent'
                                                                }}
                                                            >
                                                                {form.tipoFactura === tipo && (
                                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                                )}
                                                            </div>
                                                            <span className="font-semibold text-gray-900 cursor-pointer" onClick={() => setForm(prev => ({ ...prev, tipoFactura: tipo }))}>
                                                                {tipo}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Observaciones */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border-2 border-gray-200"
                                    >
                                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                            <FiEdit className="w-5 h-5" />
                                            Información Adicional
                                        </h3>
                                        <div>
                                            <label className="text-sm font-semibold mb-3 text-gray-700 block">Observaciones</label>
                                            <textarea
                                                name="observaciones"
                                                value={form.observaciones}
                                                onChange={handleChange}
                                                rows={4}
                                                placeholder="Escribe aquí observaciones adicionales..."
                                                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none transition-all"
                                            />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Botones */}
                                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 flex justify-end gap-3 shadow-lg">
                                    {/* MODIFICADO: El botón cancelar ahora mantiene el modal de detalles abierto si existe */}
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => closeForm(!!viewing)}
                                        className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                                    >
                                        Cancelar
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
                                    >
                                        {editing ? '💾 Guardar Cambios' : '🎉 Crear Inscripción'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}