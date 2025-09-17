// src/pages/Inscripciones.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiChevronDown, FiPlus, FiTrash, FiInfo, FiSearch, FiUserPlus, FiClock, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

/* ================== Tooltip Component ================== */
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

/* ================== Select buscable (robusto) ================== */
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
                className="border-2 border-gray-300 rounded-xl p-3 bg-white cursor-pointer flex justify-between items-center focus-within:border-purple-500 transition-colors"
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
                            className="p-3 hover:bg-purple-50 cursor-pointer text-black transition-colors"
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
const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return Number(num).toLocaleString('es-AR');
};

const formatDate = d => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2,'0');
    const month = String(date.getMonth()+1).padStart(2,'0');
    return `${day}/${month}/${date.getFullYear()}`;
};

const parseDDMMYYYY = (str) => {
    if (!str) return null;
    const [dd, mm, yyyy] = str.split('/').map(Number);
    return new Date(yyyy, mm - 1, dd);
};

const isOverdue = (dueStr) => {
    const due = parseDDMMYYYY(dueStr);
    if (!due) return false;
    const now = new Date();
    const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return nowOnly > dueOnly;
};

const getAdjustedAmount = (amount, dueDate) => isOverdue(dueDate) ? amount * 2 : amount;

const generarCuotas = (cuotas, total) => {
    const baseAmount = total / cuotas;
    const installments = [];
    const start = new Date();
    for (let i = 0; i < cuotas; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + i);
        installments.push({
            number: i + 1,
            dueDate: formatDate(dueDate),
            status: 'Pendiente',
            paymentDate: '',
            amount: baseAmount,
        });
    }
    return installments;
};

/* ================== Página Principal ================== */
export default function Inscripciones() {
    const {
        students = [], courses = [], professors = [], becas = [],
        inscriptions = [], addInscription, updateInscription, removeInscription,
        cajaMovimientos = []
    } = useDB();
    const { user } = useAuth();

    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isHistorialOpen, setIsHistorialOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

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
        paymentType: 'Efectivo',
        fullPayment: false,
        // Nueva funcionalidad
        isEnrolled: true,
        enrollmentCost: 25000,
        enableInstallments: false,
        customInstallments: 0,
        hasBeca: false,
        becaId: '',
        // Certificados múltiples
        certificados: [],
        certificadoDraft: { tipo: '', costo: 0 },
        // Del curso
        customInicio: '',
        customFin: '',
        customVacantes: 0,
        customPagoFechaEfectivo: 0,
        customPagoVencidoEfectivo: 0,
        customTotalEfectivo: 0,
        customPagoFechaTransferencia: 0,
        customPagoVencidoTransferencia: 0,
        customTotalTransferencia: 0,
        customTotalTarjeta: 0,
        customCuotas: 0,
        // Bonificación
        hasBonus: false,
        bonusAmount: 0
    });

    /* ===== Autocompletar por curso ===== */
    useEffect(() => {
        const c = courses.find(c=>c.id === Number(form.courseId));
        if(c) {
            setForm(prev=>({
                ...prev,
                customInicio: c.inicio || '',
                customFin: c.fin || '',
                customVacantes: c.vacantes ?? 0,
                customPagoFechaEfectivo: Number(c.pagoFechaEfectivo ?? 0),
                customPagoVencidoEfectivo: Number(c.pagoVencidoEfectivo ?? 0),
                customTotalEfectivo: Number(c.totalEfectivo ?? 0),
                customPagoFechaTransferencia: Number(c.pagoFechaTransferencia ?? 0),
                customPagoVencidoTransferencia: Number(c.pagoVencidoTransferencia ?? 0),
                customTotalTransferencia: Number(c.totalTransferencia ?? 0),
                customTotalTarjeta: Number(c.totalTarjeta ?? 0),
                customCuotas: Number(c.cuotas ?? 0),
                // Reset certificados cuando cambia el curso
                certificados: []
            }));
        }
    }, [form.courseId, courses]);

    const openForm = insc => {
        if(insc) {
            setEditing(insc);
            setForm({
                studentId: insc.studentId.toString(),
                courseId: insc.courseId.toString(),
                professorId: insc.professorId?.toString() || '',
                paymentType: insc.paymentType,
                fullPayment: insc.fullPayment,
                isEnrolled: insc.isEnrolled ?? true,
                enrollmentCost: Number(insc.enrollmentCost ?? 25000),
                enableInstallments: insc.enableInstallments ?? false,
                customInstallments: Number(insc.customInstallments ?? 0),
                hasBeca: insc.hasBeca ?? false,
                becaId: insc.becaId?.toString() || '',
                certificados: insc.certificados || [],
                certificadoDraft: { tipo: '', costo: 0 },
                customInicio: insc.inicio || '',
                customFin: insc.fin || '',
                customVacantes: Number(insc.vacantes ?? 0),
                customPagoFechaEfectivo: Number(insc.pagoFechaEfectivo ?? 0),
                customPagoVencidoEfectivo: Number(insc.pagoVencidoEfectivo ?? 0),
                customTotalEfectivo: Number(insc.totalEfectivo ?? 0),
                customPagoFechaTransferencia: Number(insc.pagoFechaTransferencia ?? 0),
                customPagoVencidoTransferencia: Number(insc.pagoVencidoTransferencia ?? 0),
                customTotalTransferencia: Number(insc.totalTransferencia ?? 0),
                customTotalTarjeta: Number(insc.totalTarjeta ?? 0),
                customCuotas: Number(insc.cuotas ?? 0),
                hasBonus: !!insc.hasBonus,
                bonusAmount: Number(insc.bonusAmount || 0)
            });
        } else {
            setEditing(null);
            setForm({
                studentId: '', courseId: '', professorId: '', paymentType: 'Efectivo', fullPayment: false,
                isEnrolled: true, enrollmentCost: 25000, enableInstallments: false, customInstallments: 0,
                hasBeca: false, becaId: '', certificados: [], certificadoDraft: { tipo: '', costo: 0 },
                customInicio: '', customFin: '', customVacantes: 0,
                customPagoFechaEfectivo: 0, customPagoVencidoEfectivo: 0, customTotalEfectivo: 0,
                customPagoFechaTransferencia: 0, customPagoVencidoTransferencia: 0, customTotalTransferencia: 0,
                customTotalTarjeta: 0, customCuotas: 0,
                hasBonus: false, bonusAmount: 0
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => { setIsFormOpen(false); setEditing(null); };

    // Abrir modal de historial
    const openHistorial = (insc) => {
        setViewing(null);
        setIsHistorialOpen(true);
    };

    const closeHistorial = () => {
        setIsHistorialOpen(false);
    };

    const handleChange = e => {
        const {name, type, checked, value} = e.target;
        if (type === 'checkbox') {
            setForm(f=>({ ...f, [name]: checked }));
        } else if (type === 'number') {
            setForm(f=>({ ...f, [name]: Number(value) }));
        } else {
            setForm(f=>({ ...f, [name]: value }));
        }
    };

    // Manejar certificados
    const handleAddCertificado = () => {
        if (!form.certificadoDraft.tipo || form.certificadoDraft.costo <= 0) {
            showNotification('error', 'Completa tipo y costo del certificado');
            return;
        }
        const exists = form.certificados.some(c => c.tipo.toLowerCase() === form.certificadoDraft.tipo.toLowerCase());
        if (exists) {
            showNotification('error', 'Ya existe un certificado con ese tipo');
            return;
        }
        setForm(f => ({
            ...f,
            certificados: [...f.certificados, { ...f.certificadoDraft }],
            certificadoDraft: { tipo: '', costo: 0 }
        }));
    };

    const removeCertificado = (index) => {
        setForm(f => ({
            ...f,
            certificados: f.certificados.filter((_, i) => i !== index)
        }));
    };

    const selectedCourse = courses.find(c=>c.id===Number(form.courseId));
    const availableCourseProfessors = (professors || []).filter(p => (selectedCourse?.profesores || []).includes(p.id));
    const availableBecas = (becas || []).filter(b => b.activa);
    const selectedBeca = becas.find(b => b.id === Number(form.becaId));

    // Verificar si el curso tiene cuotas habilitadas para la forma de pago seleccionada
    const courseHasInstallments = () => {
        if (!selectedCourse) return false;
        if (form.paymentType === 'Efectivo') return selectedCourse.cuotasEfectivoEnabled;
        if (form.paymentType === 'Transferencia') return selectedCourse.cuotasTransferenciaEnabled;
        if (form.paymentType === 'Tarjeta') return true; // Las tarjetas siempre tienen cuotas
        return false;
    };

    const calcTotalFinal = () => {
        let courseCost = 0;
        if (form.paymentType === 'Efectivo') courseCost = Number(form.customTotalEfectivo);
        else if (form.paymentType === 'Transferencia') courseCost = Number(form.customTotalTransferencia);
        else if (form.paymentType === 'Tarjeta') courseCost = Number(form.customTotalTarjeta);

        const enrollmentCost = form.isEnrolled ? 0 : Number(form.enrollmentCost);
        const certificadosCost = form.certificados.reduce((sum, cert) => sum + Number(cert.costo), 0);
        const becaDiscount = form.hasBeca && selectedBeca ? Number(selectedBeca.monto) : 0;
        const bonusDiscount = form.hasBonus ? Number(form.bonusAmount) : 0;

        const subtotal = courseCost + enrollmentCost + certificadosCost;
        const totalWithDiscounts = subtotal - becaDiscount - bonusDiscount;

        return Math.max(0, totalWithDiscounts);
    };

    const handleSubmit = e => {
        e.preventDefault();
        try {
            if(!form.studentId||!form.courseId||!form.professorId)
                throw new Error('Completa los campos obligatorios');

            const student = students.find(s=>s.id===Number(form.studentId));
            const course = courses.find(c=>c.id===Number(form.courseId));
            const professor = professors.find(p => p.id === Number(form.professorId));
            if (!course || !student || !professor) throw new Error('Curso, alumno o profesor no encontrado.');

            if (!form.isEnrolled && form.enrollmentCost <= 0) {
                throw new Error('El costo de inscripción debe ser mayor a 0');
            }

            if (form.certificados.length === 0) {
                throw new Error('Debe agregar al menos un certificado');
            }

            const totalFinal = calcTotalFinal();

            if (form.hasBonus && form.bonusAmount > totalFinal + form.bonusAmount) {
                throw new Error('La bonificación no puede superar el total del curso');
            }

            let installments = [];
            if (!form.fullPayment && form.enableInstallments) {
                if (Number(form.customInstallments) <= 0) throw new Error('Ingrese número de cuotas válido.');
                installments = generarCuotas(Number(form.customInstallments), totalFinal);
            }

            const newInsc = {
                studentId: student.id,
                courseId: course.id,
                studentName: `${student.nombre} ${student.apellido}`,
                courseName: course.nombre,
                professorId: professor.id,
                professorName: `${professor.nombre} ${professor.apellido}`,
                inicio: course.inicio,
                fin: course.fin,
                vacantes: course.vacantes,
                paymentType: form.paymentType,
                isEnrolled: form.isEnrolled,
                enrollmentCost: Number(form.enrollmentCost),
                enableInstallments: form.enableInstallments,
                customInstallments: Number(form.customInstallments),
                hasBeca: form.hasBeca,
                becaId: form.hasBeca ? Number(form.becaId) : null,
                becaMonto: form.hasBeca && selectedBeca ? selectedBeca.monto : 0,
                certificados: [...form.certificados],
                pagoFechaEfectivo: Number(form.customPagoFechaEfectivo),
                pagoVencidoEfectivo: Number(form.customPagoVencidoEfectivo),
                totalEfectivo: Number(form.customTotalEfectivo),
                pagoFechaTransferencia: Number(form.customPagoFechaTransferencia),
                pagoVencidoTransferencia: Number(form.customPagoVencidoTransferencia),
                totalTransferencia: Number(form.customTotalTransferencia),
                totalTarjeta: Number(form.customTotalTarjeta),
                cuotas: Number(form.customCuotas),
                hasBonus: form.hasBonus,
                bonusAmount: Number(form.bonusAmount || 0),
                fullPayment: form.fullPayment,
                installments,
                horariosCurso: course.horarios || [],
                totalFinal: totalFinal,
                // Para CajaDiaria
                formaPago: form.paymentType,
                estado: 'Cursando',
                activo: true,
                pago: form.fullPayment ? 'Completada' : 'Pendiente',
                personal: user?.name || 'Usuario Sistema',
                fechaInscripcion: new Date().toISOString()
            };

            if(editing) {
                updateInscription(editing.id, newInsc);
                showNotification('success', 'Inscripción actualizada correctamente');
            } else {
                addInscription(newInsc);
                showNotification('success', 'Inscripción creada exitosamente');
            }
            closeForm();
        } catch(err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = insc => {
        if (window.confirm(`¿Seguro que querés eliminar la inscripción de ${insc.studentName} al curso ${insc.courseName}?`)) {
            removeInscription(insc.id);
            showNotification('success', 'Inscripción eliminada correctamente');
        }
    };

    const handlePayInstallment = (inscId, num) => {
        const insc = (inscriptions || []).find(i => i.id === inscId);
        if (!insc) return showNotification('error', 'Inscripción no encontrada.');
        const updatedInstallments = (insc.installments || []).map(inst =>
            inst.number === num ? { ...inst, status: 'Pagado', paymentDate: formatDate(new Date()) } : inst
        );
        updateInscription(inscId, { ...insc, installments: updatedInstallments });
        showNotification('success', `Cuota ${num} pagada.`);
    };

    // Obtener historial de la inscripción
    const getInscriptionHistory = (inscriptionId) => {
        const insc = inscriptions.find(i => i.id === inscriptionId);
        if (!insc) return null;

        const movements = cajaMovimientos.filter(m =>
            m.studentId === insc.studentId && m.courseId === insc.courseId
        );

        const totalPagado = movements
            .filter(m => m.pago === 'Completada')
            .length * (insc.totalFinal / Math.max(1, insc.customInstallments || 1));

        const totalPendiente = insc.totalFinal - totalPagado;

        return {
            inscripcion: insc,
            movimientos: movements,
            totalPagado,
            totalPendiente,
            estadoPago: totalPendiente <= 0 ? 'Completo' : 'Pendiente'
        };
    };

    const historial = viewing ? getInscriptionHistory(viewing.id) : null;

    /* ================== Render ================== */
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header */}
                <div className="mb-6 space-y-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Sistema de Inscripciones</h1>
                        <p className="text-gray-600">Gestiona las inscripciones de cursos de manera eficiente</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por alumno, curso o profesor..."
                                className="w-full pl-10 pr-4 py-3 text-lg border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white shadow-sm transition-all duration-200 hover:border-purple-400"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => openForm(null)}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg flex items-center space-x-2"
                        >
                            <FiUserPlus className="w-5 h-5" />
                            <span>Nueva Inscripción</span>
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                            <tr>
                                {['ID','Alumno','Curso','Profesor','Inicio','Fin','Vacantes','Forma Pago','Pago Total','Total Final','Beca','Acciones'].map(h=>(
                                    <th key={h} className="px-6 py-4 text-left font-semibold tracking-wide">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filtered.map((insc, index)=>(
                                <motion.tr
                                    key={insc.id}
                                    className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 ${
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                    initial={{opacity:0,y:10}}
                                    animate={{opacity:1,y:0}}
                                    transition={{duration:0.2, delay: index * 0.05}}
                                >
                                    <td className="px-6 py-4 text-black font-bold text-lg">#{insc.id}</td>
                                    <td className="px-6 py-4 text-black font-semibold">{insc.studentName}</td>
                                    <td className="px-6 py-4 text-black font-semibold">{insc.courseName}</td>
                                    <td className="px-6 py-4 text-gray-700">{insc.professorName}</td>
                                    <td className="px-6 py-4 text-gray-700">{formatDate(insc.inicio)}</td>
                                    <td className="px-6 py-4 text-gray-700">{formatDate(insc.fin)}</td>
                                    <td className="px-6 py-4 text-gray-700">{insc.vacantes ?? '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-2 rounded-full text-xs font-bold shadow-sm ${
                                            insc.paymentType==='Efectivo'?'bg-green-100 text-green-800':
                                                insc.paymentType==='Transferencia'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'
                                        }`}>
                                            {insc.paymentType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {insc.fullPayment ?
                                            <FiCheck size={20} className="text-green-600 mx-auto"/> :
                                            <FiX size={20} className="text-red-600 mx-auto"/>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-black font-bold text-purple-700">
                                        ${formatNumber(insc.totalFinal || 0)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {insc.hasBeca ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                                                -${formatNumber(insc.becaMonto || 0)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            <motion.button
                                                onClick={() => setViewing(insc)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                <FiEye size={20} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openForm(insc)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-full hover:bg-green-50"
                                                title="Editar inscripción"
                                            >
                                                <FiEdit size={20} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(insc)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50"
                                                title="Eliminar inscripción"
                                            >
                                                <FiTrash2 size={20} />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filtered.length===0 && (
                                <tr>
                                    <td colSpan={12} className="text-center py-12 text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <FiSearch className="w-12 h-12 text-gray-300" />
                                            <div className="text-lg">
                                                {search ? 'No se encontraron inscripciones que coincidan con los filtros.' : 'No hay inscripciones disponibles.'}
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

            {/* Modal Detalles - Mejorado como en Alumnos */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto relative border-2 border-blue-400 text-black shadow-md"
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
                                <h2 className="text-2xl font-bold text-gray-800">Detalles de la Inscripción</h2>
                                <p className="text-gray-600">Información completa del registro</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Información principal en layout horizontal */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Datos del Alumno */}
                                    <div className="space-y-4">
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                                                <FiUserPlus className="mr-2" />
                                                Información del Alumno
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Nombre:</span>
                                                    <span>{viewing.studentName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">ID Alumno:</span>
                                                    <span>#{viewing.studentId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos del Curso */}
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                                <FiCalendar className="mr-2" />
                                                Información del Curso
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Curso:</span>
                                                    <span>{viewing.courseName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Profesor:</span>
                                                    <span>{viewing.professorName}</span>
                                                </div>
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

                                    {/* Datos de Pago */}
                                    <div className="space-y-4">
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                                                <FiDollarSign className="mr-2" />
                                                Información de Pago
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Forma de Pago:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        viewing.paymentType==='Efectivo'?'bg-green-100 text-green-800':
                                                            viewing.paymentType==='Transferencia'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {viewing.paymentType}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Total Final:</span>
                                                    <span className="font-bold text-green-600">${formatNumber(viewing.totalFinal || 0)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Pago Total:</span>
                                                    {viewing.fullPayment ?
                                                        <FiCheck size={16} className="text-green-600"/> :
                                                        <FiX size={16} className="text-red-600"/>
                                                    }
                                                </div>
                                                {viewing.hasBeca && (
                                                    <div className="flex justify-between">
                                                        <span className="font-medium text-gray-600">Beca:</span>
                                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                                                            -${formatNumber(viewing.becaMonto || 0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Certificados */}
                                {viewing.certificados && viewing.certificados.length > 0 && (
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Certificados</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {viewing.certificados.map((cert, idx) => (
                                                <div key={idx} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                    <div className="font-medium text-orange-800">{cert.tipo}</div>
                                                    <div className="text-sm text-orange-600">${formatNumber(cert.costo)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cuotas si existen */}
                                {viewing.installments && viewing.installments.length > 0 && (
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Plan de Cuotas</h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {viewing.installments.map((inst, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded border">
                                                        <div>
                                                            <span className="font-medium">Cuota {inst.number}</span>
                                                            <div className="text-sm text-gray-600">Vence: {inst.dueDate}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold">${formatNumber(inst.amount)}</div>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                                inst.status === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {inst.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                                        onClick={() => openHistorial(viewing)}
                                    >
                                        <FiClock className="w-4 h-4"/>
                                        <span>Ver Historial</span>
                                    </button>
                                    <button
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        onClick={() => { setViewing(null); openForm(viewing); }}
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

            {/* Modal Historial */}
            <AnimatePresence>
                {isHistorialOpen && viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeHistorial}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden relative text-black"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-orange-600 text-white p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Historial de Pagos</h2>
                                    <p className="text-orange-100">Movimientos y estado de cuenta</p>
                                </div>
                                <button
                                    type="button"
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={closeHistorial}
                                >
                                    <FiX className="w-6 h-6"/>
                                </button>
                            </div>

                            {/* Contenido */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                {historial && (
                                    <div className="space-y-6">
                                        {/* Resumen */}
                                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-orange-800">${formatNumber(historial.totalPagado)}</div>
                                                    <div className="text-orange-600">Total Pagado</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-800">${formatNumber(historial.totalPendiente)}</div>
                                                    <div className="text-red-600">Total Pendiente</div>
                                                </div>
                                                <div className="text-center">
                                                    <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                                                        historial.estadoPago === 'Completo'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {historial.estadoPago}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Movimientos */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1 h-6 bg-orange-600 rounded mr-3"></div>
                                                Movimientos de Caja
                                            </h3>

                                            {historial.movimientos.length > 0 ? (
                                                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                                                    <table className="min-w-full">
                                                        <thead className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                                                Fecha
                                                            </th>
                                                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                                                Forma de Pago
                                                            </th>
                                                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                                                Estado
                                                            </th>
                                                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                                                Personal
                                                            </th>
                                                        </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                        {historial.movimientos.map((movimiento, index) => (
                                                            <motion.tr
                                                                key={movimiento.id}
                                                                className={`hover:bg-orange-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.2, delay: index * 0.1 }}
                                                            >
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    {new Date(movimiento.fechaHora).toLocaleString()}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                        movimiento.formaPago==='Efectivo'?'bg-green-100 text-green-800':
                                                                            movimiento.formaPago==='Transferencia'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'
                                                                    }`}>
                                                                        {movimiento.formaPago}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                                                        movimiento.pago === 'Completada' ? 'bg-green-100 text-green-800' :
                                                                            movimiento.pago === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {movimiento.pago}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    {movimiento.personal}
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                    <div className="text-gray-400 mb-2">
                                                        <FiDollarSign className="w-16 h-16 mx-auto" />
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-500 mb-1">No hay movimientos registrados</h3>
                                                    <p className="text-gray-400">Esta inscripción aún no tiene pagos registrados</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario - Igual al original pero mejorado */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden relative text-black shadow-md"
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header fijo morado */}
                            <div className="bg-purple-600 text-white p-6 flex justify-between items-center shadow-sm">
                                <h2 className="text-2xl font-bold">{editing ? 'Editar' : 'Nueva'} Inscripción</h2>
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
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Alumno *:</label>
                                                <SearchableSelect
                                                    options={students}
                                                    value={form.studentId}
                                                    onChange={v => setForm(prev => ({ ...prev, studentId: v }))}
                                                    placeholder="Selecciona un alumno..."
                                                    getLabel={s => `${s.nombre} ${s.apellido} (DNI: ${s.dni})`}
                                                    getValue={s => s.id.toString()}
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Curso *:</label>
                                                <SearchableSelect
                                                    options={courses}
                                                    value={form.courseId}
                                                    onChange={v => setForm(prev => ({ ...prev, courseId: v }))}
                                                    placeholder="Selecciona un curso..."
                                                    getLabel={c => c.nombre}
                                                    getValue={c => c.id.toString()}
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Profesor *:</label>
                                                <SearchableSelect
                                                    options={availableCourseProfessors}
                                                    value={form.professorId}
                                                    onChange={v => setForm(prev => ({ ...prev, professorId: v }))}
                                                    placeholder="Selecciona un profesor..."
                                                    getLabel={p => `${p.nombre} ${p.apellido}`}
                                                    getValue={p => p.id.toString()}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estado de Inscripción */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Estado de Inscripción
                                        </h3>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="isEnrolled"
                                                    name="isEnrolled"
                                                    checked={form.isEnrolled}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <label htmlFor="isEnrolled" className="font-semibold text-yellow-800">
                                                    ¿Está inscripto el alumno?
                                                </label>
                                            </div>
                                            {!form.isEnrolled && (
                                                <div className="flex flex-col">
                                                    <label className="text-sm font-medium mb-2 text-gray-700">Costo de Inscripción:</label>
                                                    <input
                                                        type="number"
                                                        name="enrollmentCost"
                                                        value={form.enrollmentCost}
                                                        onChange={handleChange}
                                                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Forma de Pago */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Forma de Pago
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Tipo de Pago *:</label>
                                                <select
                                                    name="paymentType"
                                                    value={form.paymentType}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    required
                                                >
                                                    <option value="Efectivo">Efectivo</option>
                                                    <option value="Transferencia">Transferencia</option>
                                                    <option value="Tarjeta">Tarjeta</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    id="fullPayment"
                                                    name="fullPayment"
                                                    checked={form.fullPayment}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <label htmlFor="fullPayment" className="font-semibold text-gray-700">
                                                    Pago Total (sin cuotas)
                                                </label>
                                            </div>
                                        </div>

                                        {/* Información de precios del curso */}
                                        {selectedCourse && (
                                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-2">Pago en Fecha</h4>
                                                    <div className="text-lg font-bold text-green-600">
                                                        ${formatNumber(
                                                        form.paymentType === 'Efectivo' ? form.customPagoFechaEfectivo :
                                                            form.paymentType === 'Transferencia' ? form.customPagoFechaTransferencia :
                                                                'N/A'
                                                    )}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-2">Pago Vencido</h4>
                                                    <div className="text-lg font-bold text-red-600">
                                                        ${formatNumber(
                                                        form.paymentType === 'Efectivo' ? form.customPagoVencidoEfectivo :
                                                            form.paymentType === 'Transferencia' ? form.customPagoVencidoTransferencia :
                                                                'N/A'
                                                    )}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-2">Costo Total</h4>
                                                    <div className="text-lg font-bold text-purple-600">
                                                        ${formatNumber(
                                                        form.paymentType === 'Efectivo' ? form.customTotalEfectivo :
                                                            form.paymentType === 'Transferencia' ? form.customTotalTransferencia :
                                                                form.customTotalTarjeta
                                                    )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cuotas */}
                                        {courseHasInstallments() && !form.fullPayment && (
                                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <input
                                                        type="checkbox"
                                                        id="enableInstallments"
                                                        name="enableInstallments"
                                                        checked={form.enableInstallments}
                                                        onChange={handleChange}
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor="enableInstallments" className="font-semibold text-blue-800">
                                                        Habilitar cuotas en esta inscripción
                                                    </label>
                                                </div>
                                                {form.enableInstallments && (
                                                    <div className="flex flex-col">
                                                        <label className="text-sm font-medium mb-2 text-gray-700">Número de Cuotas:</label>
                                                        <input
                                                            type="number"
                                                            name="customInstallments"
                                                            value={form.customInstallments}
                                                            onChange={handleChange}
                                                            className="border-2 border-blue-300 rounded-lg px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-colors w-32"
                                                            min="1"
                                                            max={form.customCuotas}
                                                        />
                                                        <small className="text-blue-600 mt-1">Máximo: {form.customCuotas} cuotas</small>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Certificados */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Certificados
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Agregar Certificado:</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Tipo de certificado"
                                                        value={form.certificadoDraft.tipo}
                                                        onChange={(e) => setForm(fd => ({
                                                            ...fd,
                                                            certificadoDraft: { ...fd.certificadoDraft, tipo: e.target.value }
                                                        }))}
                                                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none flex-1 transition-colors"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Costo"
                                                        value={form.certificadoDraft.costo}
                                                        onChange={(e) => setForm(fd => ({
                                                            ...fd,
                                                            certificadoDraft: { ...fd.certificadoDraft, costo: Number(e.target.value) }
                                                        }))}
                                                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none w-32 transition-colors"
                                                        min="0"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCertificado}
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors shadow-sm"
                                                    >
                                                        <FiPlus className="w-4 h-4" /> Agregar
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Certificados Agregados:</label>
                                                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[60px] shadow-sm">
                                                    {form.certificados.length === 0 ? (
                                                        <span className="text-sm text-gray-500">No hay certificados agregados.</span>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {form.certificados.map((cert, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200"
                                                                >
                                                                    <div className="text-black">
                                                                        <span className="font-medium">{cert.tipo}</span>
                                                                        <span className="ml-2 text-gray-600">${formatNumber(cert.costo)}</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeCertificado(idx)}
                                                                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
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
                                    </div>

                                    {/* Becas */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Becas
                                        </h3>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="hasBeca"
                                                    name="hasBeca"
                                                    checked={form.hasBeca}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                                                />
                                                <label htmlFor="hasBeca" className="font-semibold text-yellow-800">
                                                    ¿Tiene Beca?
                                                </label>
                                            </div>
                                            {form.hasBeca && (
                                                <div className="flex flex-col">
                                                    <label className="text-sm font-medium mb-2 text-gray-700">Seleccionar Beca:</label>
                                                    <SearchableSelect
                                                        options={availableBecas}
                                                        value={form.becaId}
                                                        onChange={v => setForm(prev => ({ ...prev, becaId: v }))}
                                                        placeholder="Selecciona una beca..."
                                                        getLabel={b => `Beca ${b.tipo} - $${formatNumber(b.monto)}`}
                                                        getValue={b => b.id.toString()}
                                                    />
                                                    {selectedBeca && (
                                                        <div className="mt-2 text-sm text-yellow-700">
                                                            Descuento: $-{formatNumber(selectedBeca.monto)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bonificación */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Bonificación
                                        </h3>
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="hasBonus"
                                                    name="hasBonus"
                                                    checked={form.hasBonus}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                                />
                                                <label htmlFor="hasBonus" className="font-semibold text-orange-800">
                                                    Aplicar bonificación (descuento adicional)
                                                </label>
                                            </div>
                                            {form.hasBonus && (
                                                <div className="flex flex-col">
                                                    <label className="text-sm font-medium mb-2 text-gray-700">Monto a descontar:</label>
                                                    <input
                                                        type="number"
                                                        name="bonusAmount"
                                                        value={form.bonusAmount}
                                                        onChange={handleChange}
                                                        className="border-2 border-orange-300 rounded-lg px-3 py-2 text-black focus:border-orange-500 focus:outline-none transition-colors w-48"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                    />
                                                    <small className="text-orange-600 mt-1">
                                                        No puede superar el total del curso
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resumen Final */}
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-l-4 border-purple-500">
                                        <h3 className="font-bold text-lg mb-4 text-purple-800">💰 Resumen Final</h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                                    <div className="text-sm text-gray-600">Costo del Curso</div>
                                                    <div className="text-xl font-bold text-gray-800">
                                                        ${formatNumber(
                                                        form.paymentType === 'Efectivo' ? form.customTotalEfectivo :
                                                            form.paymentType === 'Transferencia' ? form.customTotalTransferencia :
                                                                form.customTotalTarjeta
                                                    )}
                                                    </div>
                                                </div>
                                                {!form.isEnrolled && (
                                                    <div className="bg-yellow-100 p-4 rounded-lg">
                                                        <div className="text-sm text-yellow-800">+ Costo Inscripción</div>
                                                        <div className="text-lg font-bold text-yellow-900">${formatNumber(form.enrollmentCost)}</div>
                                                    </div>
                                                )}
                                                {form.certificados.length > 0 && (
                                                    <div className="bg-blue-100 p-4 rounded-lg">
                                                        <div className="text-sm text-blue-800">+ Certificados</div>
                                                        <div className="text-lg font-bold text-blue-900">
                                                            ${formatNumber(form.certificados.reduce((sum, cert) => sum + cert.costo, 0))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                {form.hasBeca && selectedBeca && (
                                                    <div className="bg-yellow-100 p-4 rounded-lg">
                                                        <div className="text-sm text-yellow-800">- Beca {selectedBeca.tipo}</div>
                                                        <div className="text-lg font-bold text-yellow-900">-${formatNumber(selectedBeca.monto)}</div>
                                                    </div>
                                                )}
                                                {form.hasBonus && (
                                                    <div className="bg-orange-100 p-4 rounded-lg">
                                                        <div className="text-sm text-orange-800">- Bonificación</div>
                                                        <div className="text-lg font-bold text-orange-900">-${formatNumber(form.bonusAmount)}</div>
                                                    </div>
                                                )}
                                                <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
                                                    <div className="text-sm text-purple-800">TOTAL FINAL</div>
                                                    <div className="text-3xl font-bold text-purple-900">
                                                        ${formatNumber(calcTotalFinal())}
                                                    </div>
                                                    {form.enableInstallments && !form.fullPayment && form.customInstallments > 0 && (
                                                        <div className="text-sm text-purple-700 mt-2">
                                                            ${formatNumber(calcTotalFinal() / form.customInstallments)} x {form.customInstallments} cuotas
                                                        </div>
                                                    )}
                                                </div>
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
                                        <span>{editing ? 'Guardar Cambios' : 'Crear Inscripción'}</span>
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