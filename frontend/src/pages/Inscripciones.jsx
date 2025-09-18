// src/pages/Inscripciones.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiChevronDown, FiPlus, FiTrash, FiSearch, FiUserPlus, FiClock, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

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
        isEnrolled: true,
        enrollmentCost: 25000,
        enableInstallments: false,
        customInstallments: 0,
        hasBeca: false,
        becaId: '',
        certificados: [],
        certificadoDraft: { tipo: '', costo: 0 },
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
        hasBonus: false,
        bonusAmount: 0
    });

    /* ===== Autocompletar por curso - MEJORADO ===== */
    useEffect(() => {
        const c = courses.find(c=>c.id === Number(form.courseId));
        if(c) {
            console.log('Curso seleccionado:', {
                nombre: c.nombre,
                totalEfectivo: c.totalEfectivo,
                totalTransferencia: c.totalTransferencia,
                totalTarjeta: c.totalTarjeta,
                pagoFechaEfectivo: c.pagoFechaEfectivo,
                pagoVencidoEfectivo: c.pagoVencidoEfectivo
            });

            setForm(prev=>({
                ...prev,
                customInicio: c.inicio || '',
                customFin: c.fin || '',
                customVacantes: Number(c.vacantes) || 0,
                customPagoFechaEfectivo: Number(c.pagoFechaEfectivo) || 0,
                customPagoVencidoEfectivo: Number(c.pagoVencidoEfectivo) || 0,
                customTotalEfectivo: Number(c.totalEfectivo) || 0,
                customPagoFechaTransferencia: Number(c.pagoFechaTransferencia) || 0,
                customPagoVencidoTransferencia: Number(c.pagoVencidoTransferencia) || 0,
                customTotalTransferencia: Number(c.totalTransferencia) || 0,
                customTotalTarjeta: Number(c.totalTarjeta) || 0,
                customCuotas: Number(c.cuotas) || 0,
                certificados: []
            }));
        }
    }, [form.courseId, courses]);

    const openForm = inscripcion => {
        if(inscripcion) {
            setEditing(inscripcion);
            setForm({
                studentId: inscripcion.studentId?.toString() || '',
                courseId: inscripcion.courseId?.toString() || '',
                professorId: inscripcion.professorId?.toString() || '',
                paymentType: inscripcion.paymentType || 'Efectivo',
                fullPayment: inscripcion.fullPayment || false,
                isEnrolled: inscripcion.isEnrolled ?? true,
                enrollmentCost: Number(inscripcion.enrollmentCost) || 25000,
                enableInstallments: inscripcion.enableInstallments ?? false,
                customInstallments: Number(inscripcion.customInstallments) || 0,
                hasBeca: inscripcion.hasBeca ?? false,
                becaId: inscripcion.becaId?.toString() || '',
                certificados: inscripcion.certificados || [],
                certificadoDraft: { tipo: '', costo: 0 },
                customInicio: inscripcion.inicio || '',
                customFin: inscripcion.fin || '',
                customVacantes: Number(inscripcion.vacantes) || 0,
                customPagoFechaEfectivo: Number(inscripcion.pagoFechaEfectivo) || 0,
                customPagoVencidoEfectivo: Number(inscripcion.pagoVencidoEfectivo) || 0,
                customTotalEfectivo: Number(inscripcion.totalEfectivo) || 0,
                customPagoFechaTransferencia: Number(inscripcion.pagoFechaTransferencia) || 0,
                customPagoVencidoTransferencia: Number(inscripcion.pagoVencidoTransferencia) || 0,
                customTotalTransferencia: Number(inscripcion.totalTransferencia) || 0,
                customTotalTarjeta: Number(inscripcion.totalTarjeta) || 0,
                customCuotas: Number(inscripcion.cuotas) || 0,
                hasBonus: !!inscripcion.hasBonus,
                bonusAmount: Number(inscripcion.bonusAmount) || 0
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

    const openHistorial = () => {
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
            setForm(f=>({ ...f, [name]: Number(value) || 0 }));
        } else {
            setForm(f=>({ ...f, [name]: value }));
        }
    };

    const handleAddCertificado = () => {
        if (!form.certificadoDraft.tipo?.trim()) {
            showNotification('error', 'Completa el tipo de certificado');
            return;
        }
        if (form.certificadoDraft.costo <= 0) {
            showNotification('error', 'El costo del certificado debe ser mayor a 0');
            return;
        }
        const exists = form.certificados.some(c => c.tipo?.toLowerCase() === form.certificadoDraft.tipo.toLowerCase());
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

    const courseHasInstallments = () => {
        if (!selectedCourse) return false;
        if (form.paymentType === 'Efectivo') return selectedCourse.cuotasEfectivoEnabled;
        if (form.paymentType === 'Transferencia') return selectedCourse.cuotasTransferenciaEnabled;
        if (form.paymentType === 'Tarjeta') return true;
        return false;
    };

    // FUNCIÓN DE CÁLCULO MEJORADA
    const calcTotalFinal = () => {
        let courseCost = 0;

        if (form.paymentType === 'Efectivo') {
            courseCost = Number(form.customTotalEfectivo) || 0;
        } else if (form.paymentType === 'Transferencia') {
            courseCost = Number(form.customTotalTransferencia) || 0;
        } else if (form.paymentType === 'Tarjeta') {
            courseCost = Number(form.customTotalTarjeta) || 0;
        }

        const enrollmentCost = form.isEnrolled ? 0 : Number(form.enrollmentCost) || 0;
        const certificadosCost = form.certificados.reduce((sum, cert) => sum + (Number(cert.costo) || 0), 0);
        const becaDiscount = form.hasBeca && selectedBeca ? Number(selectedBeca.monto) || 0 : 0;
        const bonusDiscount = form.hasBonus ? Number(form.bonusAmount) || 0 : 0;

        const subtotal = courseCost + enrollmentCost + certificadosCost;
        const totalWithDiscounts = subtotal - becaDiscount - bonusDiscount;

        console.log('Cálculo total:', {
            courseCost,
            enrollmentCost,
            certificadosCost,
            becaDiscount,
            bonusDiscount,
            subtotal,
            totalWithDiscounts: Math.max(0, totalWithDiscounts)
        });

        return Math.max(0, totalWithDiscounts);
    };

    // SUBMIT MEJORADO CON VALIDACIONES
    const handleSubmit = e => {
        e.preventDefault();
        try {
            if(!form.studentId||!form.courseId||!form.professorId)
                throw new Error('Completa los campos obligatorios: Alumno, Curso y Profesor');

            const student = students.find(s=>s.id===Number(form.studentId));
            const course = courses.find(c=>c.id===Number(form.courseId));
            const professor = professors.find(p => p.id === Number(form.professorId));

            if (!student) throw new Error('Alumno no encontrado');
            if (!course) throw new Error('Curso no encontrado');
            if (!professor) throw new Error('Profesor no encontrado');

            if (!form.isEnrolled && (Number(form.enrollmentCost) || 0) <= 0) {
                throw new Error('El costo de inscripción debe ser mayor a 0');
            }

            if (form.certificados.length === 0) {
                throw new Error('Debe agregar al menos un certificado');
            }

            // Validar que el curso tenga precios definidos
            let courseCost = 0;
            if (form.paymentType === 'Efectivo') {
                courseCost = Number(form.customTotalEfectivo) || 0;
            } else if (form.paymentType === 'Transferencia') {
                courseCost = Number(form.customTotalTransferencia) || 0;
            } else if (form.paymentType === 'Tarjeta') {
                courseCost = Number(form.customTotalTarjeta) || 0;
            }

            if (courseCost <= 0) {
                throw new Error(`El curso no tiene precio definido para ${form.paymentType}. Revisa la configuración del curso.`);
            }

            const totalFinal = calcTotalFinal();

            if (totalFinal <= 0) {
                throw new Error('El total final debe ser mayor a 0. Revisa los costos del curso y certificados.');
            }

            if (form.hasBonus && form.bonusAmount >= totalFinal + form.bonusAmount) {
                throw new Error('La bonificación no puede ser igual o mayor al total del curso');
            }

            let installments = [];
            if (!form.fullPayment && form.enableInstallments) {
                const numCuotas = Number(form.customInstallments) || 0;
                if (numCuotas <= 0) throw new Error('Ingrese número de cuotas válido.');
                if (numCuotas > (Number(form.customCuotas) || 0)) {
                    throw new Error(`El número de cuotas no puede exceder ${form.customCuotas}`);
                }
                installments = generarCuotas(numCuotas, totalFinal);
            }

            const newInscripcion = {
                studentId: student.id,
                courseId: course.id,
                studentName: `${student.nombre} ${student.apellido}`,
                courseName: course.nombre,
                professorId: professor.id,
                professorName: `${professor.nombre} ${professor.apellido}`,
                inicio: form.customInicio || course.inicio,
                fin: form.customFin || course.fin,
                vacantes: Number(form.customVacantes) || Number(course.vacantes) || 0,
                paymentType: form.paymentType,
                isEnrolled: form.isEnrolled,
                enrollmentCost: Number(form.enrollmentCost) || 0,
                enableInstallments: form.enableInstallments,
                customInstallments: Number(form.customInstallments) || 0,
                hasBeca: form.hasBeca,
                becaId: form.hasBeca ? Number(form.becaId) : null,
                becaMonto: form.hasBeca && selectedBeca ? Number(selectedBeca.monto) || 0 : 0,
                certificados: [...form.certificados],
                pagoFechaEfectivo: Number(form.customPagoFechaEfectivo) || 0,
                pagoVencidoEfectivo: Number(form.customPagoVencidoEfectivo) || 0,
                totalEfectivo: Number(form.customTotalEfectivo) || 0,
                pagoFechaTransferencia: Number(form.customPagoFechaTransferencia) || 0,
                pagoVencidoTransferencia: Number(form.customPagoVencidoTransferencia) || 0,
                totalTransferencia: Number(form.customTotalTransferencia) || 0,
                totalTarjeta: Number(form.customTotalTarjeta) || 0,
                cuotas: Number(form.customCuotas) || 0,
                hasBonus: form.hasBonus,
                bonusAmount: Number(form.bonusAmount) || 0,
                fullPayment: form.fullPayment,
                installments,
                horariosCurso: course.horarios || [],
                totalFinal: totalFinal,
                formaPago: form.paymentType,
                estado: 'Cursando',
                activo: true,
                pago: form.fullPayment ? 'Completada' : 'Pendiente',
                personal: user?.name || 'Usuario Sistema',
                fechaInscripcion: new Date().toISOString()
            };

            console.log('Nueva inscripción creada:', newInscripcion);

            if(editing) {
                updateInscription(editing.id, newInscripcion);
                showNotification('success', 'Inscripción actualizada correctamente');
            } else {
                addInscription(newInscripcion);
                showNotification('success', 'Inscripción creada exitosamente');
            }
            closeForm();
        } catch(err) {
            console.error('Error en inscripción:', err);
            showNotification('error', err.message);
        }
    };

    const handleDelete = inscripcion => {
        if (window.confirm(`¿Seguro que querés eliminar la inscripción de ${inscripcion.studentName} al curso ${inscripcion.courseName}?`)) {
            removeInscription(inscripcion.id);
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

    const getInscriptionHistory = (inscriptionId) => {
        const inscripcion = inscriptions.find(i => i.id === inscriptionId);
        if (!inscripcion) return null;

        const movements = cajaMovimientos.filter(m =>
            m.studentId === inscripcion.studentId && m.courseId === inscripcion.courseId
        );

        const totalPagado = movements
            .filter(m => m.pago === 'Completada')
            .length * ((inscripcion.totalFinal || 0) / Math.max(1, inscripcion.customInstallments || 1));

        const totalPendiente = (inscripcion.totalFinal || 0) - totalPagado;

        return {
            inscripcion: inscripcion,
            movimientos: movements,
            totalPagado,
            totalPendiente,
            estadoPago: totalPendiente <= 0 ? 'Completo' : 'Pendiente'
        };
    };

    const historial = viewing ? getInscriptionHistory(viewing.id) : null;

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
                    <div className="overflow-y-auto">
                        <table className="w-full table-fixed">
                            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                            <tr>
                                <th className="px-3 py-4 text-left font-bold text-base w-12">#</th>
                                <th className="px-3 py-4 text-left font-bold text-base w-36">Alumno</th>
                                <th className="px-3 py-4 text-left font-bold text-base w-28">Curso</th>
                                <th className="px-3 py-4 text-left font-bold text-base w-28">Profesor</th>
                                <th className="px-3 py-4 text-left font-bold text-base w-20">Inicio</th>
                                <th className="px-3 py-4 text-left font-bold text-base w-20">Fin</th>
                                <th className="px-3 py-4 text-center font-bold text-base w-16">Vacantes</th>
                                <th className="px-3 py-4 text-center font-bold text-base w-28">Forma Pago</th>
                                <th className="px-3 py-4 text-center font-bold text-base w-16">Pago Total</th>
                                <th className="px-3 py-4 text-right font-bold text-base w-24">Total Final</th>
                                <th className="px-3 py-4 text-center font-bold text-base w-16">Beca</th>
                                <th className="px-3 py-4 text-center font-bold text-base w-20">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filtered.map((inscripcion, index)=>(
                                <motion.tr
                                    key={inscripcion.id}
                                    className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 ${
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                    initial={{opacity:0,y:10}}
                                    animate={{opacity:1,y:0}}
                                    transition={{duration:0.2, delay: index * 0.05}}
                                >
                                    <td className="px-3 py-4 text-black font-bold text-lg">{inscripcion.id}</td>
                                    <td className="px-3 py-4">
                                        <div className="text-black font-semibold text-base truncate" title={inscripcion.studentName}>
                                            {inscripcion.studentName}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="text-black font-semibold text-base truncate" title={inscripcion.courseName}>
                                            {inscripcion.courseName}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="text-gray-700 text-base truncate" title={inscripcion.professorName}>
                                            {inscripcion.professorName}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-gray-700 text-base font-medium">
                                        {formatDate(inscripcion.inicio)}
                                    </td>
                                    <td className="px-3 py-4 text-gray-700 text-base font-medium">
                                        {formatDate(inscripcion.fin)}
                                    </td>
                                    <td className="px-3 py-4 text-gray-700 text-base font-bold text-center">
                                        {inscripcion.vacantes ?? '-'}
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-sm font-bold whitespace-nowrap ${
                                            inscripcion.paymentType==='Efectivo'?'bg-green-100 text-green-800':
                                                inscripcion.paymentType==='Transferencia'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'
                                        }`}>
                                            {inscripcion.paymentType}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        {inscripcion.fullPayment ?
                                            <FiCheck size={20} className="text-green-600 mx-auto"/> :
                                            <FiX size={20} className="text-red-600 mx-auto"/>
                                        }
                                    </td>
                                    <td className="px-3 py-4 text-right">
                                        <div className="text-black font-bold text-purple-700 text-lg">
                                            ${formatNumber(inscripcion.totalFinal || 0)}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        {inscripcion.hasBeca ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                                -${formatNumber(inscripcion.becaMonto || 0)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-base">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex space-x-1 justify-center">
                                            <motion.button
                                                onClick={() => setViewing(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                <FiEye size={18} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openForm(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-full hover:bg-green-50"
                                                title="Editar inscripción"
                                            >
                                                <FiEdit size={18} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-50"
                                                title="Eliminar inscripción"
                                            >
                                                <FiTrash2 size={18} />
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
                                            <div className="text-xl">
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

            {/* Modal Detalles - MEJORADO */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white p-6 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative text-black shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors"
                                onClick={() => setViewing(null)}
                            >
                                <FiX size={20} />
                            </button>

                            <h2 className="text-3xl font-bold mb-6 text-purple-800">Detalles de la Inscripción</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    {/* Información del Alumno */}
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <div className="text-sm text-purple-600 font-semibold mb-1">ALUMNO</div>
                                        <div className="text-lg font-bold">{viewing.studentName}</div>
                                        <div className="text-sm text-purple-700 mt-1">
                                            ID: #{viewing.studentId}
                                        </div>
                                    </div>

                                    {/* Información del Curso */}
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-600 font-semibold mb-1">CURSO</div>
                                        <div className="text-lg font-bold">{viewing.courseName}</div>
                                        <div className="text-sm text-blue-700 mt-1">
                                            Inicio: {formatDate(viewing.inicio)} • Fin: {formatDate(viewing.fin)} • Vacantes: {viewing.vacantes ?? '-'}
                                        </div>
                                    </div>

                                    {/* Información del Profesor */}
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600 font-semibold mb-1">PROFESOR</div>
                                        <div className="text-lg font-bold">{viewing.professorName}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Forma de Pago */}
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <div className="text-sm text-orange-600 font-semibold mb-1">FORMA DE PAGO</div>
                                        <div className="text-lg font-bold">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                viewing.paymentType==='Efectivo'?'bg-green-100 text-green-800':
                                                    viewing.paymentType==='Transferencia'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'
                                            }`}>
                                                {viewing.paymentType}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Costos Detallados - MEJORADO */}
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                        <div className="text-sm text-indigo-600 font-semibold mb-2">COSTOS DETALLADOS</div>

                                        {viewing.paymentType === 'Efectivo' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Pago en Fecha:</span>
                                                    <span className="font-bold text-green-600">${formatNumber(Number(viewing.pagoFechaEfectivo) || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Pago Vencido:</span>
                                                    <span className="font-bold text-red-600">${formatNumber(Number(viewing.pagoVencidoEfectivo) || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-t border-indigo-300 pt-2">
                                                    <span className="font-bold">Total Curso:</span>
                                                    <span className="font-bold text-indigo-900">${formatNumber(Number(viewing.totalEfectivo) || 0)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {viewing.paymentType === 'Transferencia' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Pago en Fecha:</span>
                                                    <span className="font-bold text-green-600">${formatNumber(Number(viewing.pagoFechaTransferencia) || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Pago Vencido:</span>
                                                    <span className="font-bold text-red-600">${formatNumber(Number(viewing.pagoVencidoTransferencia) || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-t border-indigo-300 pt-2">
                                                    <span className="font-bold">Total Curso:</span>
                                                    <span className="font-bold text-indigo-900">${formatNumber(Number(viewing.totalTransferencia) || 0)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {viewing.paymentType === 'Tarjeta' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm border-t border-indigo-300 pt-2">
                                                    <span className="font-bold">Total Curso:</span>
                                                    <span className="font-bold text-indigo-900">${formatNumber(Number(viewing.totalTarjeta) || 0)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Certificados - MEJORADO */}
                                        {viewing.certificados && viewing.certificados.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-indigo-300">
                                                <div className="text-xs text-indigo-600 font-semibold mb-2">CERTIFICADOS</div>
                                                {viewing.certificados.map((cert, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span>{cert.tipo || 'Sin tipo'}:</span>
                                                        <span className="font-bold text-orange-600">+${formatNumber(Number(cert.costo) || 0)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Descuentos - MEJORADO */}
                                        {(viewing.hasBeca || viewing.hasBonus) && (
                                            <div className="mt-4 pt-3 border-t border-indigo-300">
                                                <div className="text-xs text-indigo-600 font-semibold mb-2">DESCUENTOS</div>
                                                {viewing.hasBeca && (
                                                    <div className="flex justify-between text-sm">
                                                        <span>Beca:</span>
                                                        <span className="font-bold text-yellow-600">-${formatNumber(Number(viewing.becaMonto) || 0)}</span>
                                                    </div>
                                                )}
                                                {viewing.hasBonus && (
                                                    <div className="flex justify-between text-sm">
                                                        <span>Bonificación:</span>
                                                        <span className="font-bold text-yellow-600">-${formatNumber(Number(viewing.bonusAmount) || 0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Total Final */}
                                        <div className="mt-4 pt-3 border-t-2 border-indigo-400">
                                            <div className="flex justify-between">
                                                <span className="text-lg font-bold text-indigo-800">TOTAL FINAL:</span>
                                                <span className="text-2xl font-bold text-indigo-900">
                                                    ${formatNumber(Number(viewing.totalFinal) || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Plan de Cuotas o Pago Completo - MEJORADO */}
                            {viewing.fullPayment ? (
                                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-xl border-l-4 border-green-500">
                                    <div className="flex items-center space-x-3">
                                        <FiCheck size={28} className="text-green-600"/>
                                        <div>
                                            <div className="text-xl font-bold text-green-800">Pago Total Realizado</div>
                                            <div className="text-green-600">El curso ha sido pagado completamente</div>
                                        </div>
                                    </div>
                                </div>
                            ) : viewing.installments && viewing.installments.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-semibold text-gray-800">Plan de Cuotas</h3>
                                    <div className="overflow-auto border-2 border-gray-300 rounded-xl shadow-lg">
                                        <table className="min-w-full bg-white">
                                            <thead className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                                            <tr>
                                                {['Cuota','Vencimiento','Estado','Fecha Pago','Monto','Acción'].map(h=>(
                                                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {viewing.installments.map((inst, index) => (
                                                <tr key={inst.number} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                                    <td className="px-4 py-3 text-black font-bold">#{inst.number}</td>
                                                    <td className="px-4 py-3 text-black">
                                                        <div className="flex items-center gap-2">
                                                            <span>{inst.dueDate}</span>
                                                            {isOverdue(inst.dueDate) && inst.status === 'Pendiente' && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Vencida</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${inst.status==='Pagado'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
                                                            {inst.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-black">{inst.paymentDate || '-'}</td>
                                                    <td className="px-4 py-3 text-black font-bold text-purple-700">
                                                        ${formatNumber(getAdjustedAmount(Number(inst.amount) || 0, inst.dueDate))}
                                                        {inst.status === 'Pagado' && inst.amountPaid != null && (
                                                            <span className="ml-2 text-xs text-gray-500">(Pagado: ${formatNumber(inst.amountPaid)})</span>
                                                        )}
                                                        {isOverdue(inst.dueDate) && inst.status==='Pendiente' && (
                                                            <div className="text-xs text-red-600 mt-1">Incluye recargo por pago fuera de término</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {inst.status==='Pendiente' && (
                                                            <button
                                                                onClick={() => handlePayInstallment(viewing.id, inst.number)}
                                                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-md"
                                                            >
                                                                Pagar
                                                            </button>
                                                        )}
                                                        {inst.status==='Pagado' && (
                                                            <div className="flex items-center text-green-600">
                                                                <FiCheck size={16} className="mr-1"/>
                                                                <span className="text-sm font-semibold">Pagado</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                /* Cuando no hay cuotas */
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                                    <div className="text-yellow-800 font-semibold text-lg mb-2">
                                        No hay plan de cuotas configurado
                                    </div>
                                    <div className="text-yellow-600">
                                        Esta inscripción no tiene cuotas habilitadas o no se configuró un plan de pagos
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex justify-center space-x-4 pt-6 mt-6 border-t border-gray-200">
                                <button
                                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                                    onClick={() => { setViewing(viewing); setIsHistorialOpen(true); }}
                                >
                                    <FiClock className="w-4 h-4"/>
                                    <span>Ver Historial</span>
                                </button>
                                <button
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                    onClick={() => { openForm(viewing); setViewing(null); }}
                                >
                                    <FiEdit className="w-4 h-4"/>
                                    <span>Editar Inscripción</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Historial - MEJORADO */}
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

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                {historial && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-orange-800">${formatNumber(Number(historial.totalPagado) || 0)}</div>
                                                    <div className="text-orange-600">Total Pagado</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-800">${formatNumber(Number(historial.totalPendiente) || 0)}</div>
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

                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1 h-6 bg-orange-600 rounded mr-3"></div>
                                                Movimientos de Caja
                                            </h3>

                                            {historial.movimientos && historial.movimientos.length > 0 ? (
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

            {/* Modal Formulario - COMPLETO MEJORADO */}
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
                            <div className="bg-purple-600 text-white p-6 flex justify-between items-center shadow-sm">
                                <h2 className="text-2xl font-bold">{editing ? 'Editar' : 'Nueva'} Inscripción</h2>
                                <button type="button" className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors" onClick={closeForm}>
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

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
                                                            certificadoDraft: { ...fd.certificadoDraft, costo: Number(e.target.value) || 0 }
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
                                                                        <span className="ml-2 text-gray-600">${formatNumber(cert.costo || 0)}</span>
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

                                    {/* Becas y Bonificaciones */}
                                    <div className="shadow-sm rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Becas y Descuentos
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Becas */}
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

                                            {/* Bonificaciones */}
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <input
                                                        type="checkbox"
                                                        id="hasBonus"
                                                        name="hasBonus"
                                                        checked={form.hasBonus}
                                                        onChange={handleChange}
                                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                                    />
                                                    <label htmlFor="hasBonus" className="font-semibold text-green-800">
                                                        ¿Tiene Bonificación?
                                                    </label>
                                                </div>
                                                {form.hasBonus && (
                                                    <div className="flex flex-col">
                                                        <label className="text-sm font-medium mb-2 text-gray-700">Monto de Bonificación:</label>
                                                        <input
                                                            type="number"
                                                            name="bonusAmount"
                                                            value={form.bonusAmount}
                                                            onChange={handleChange}
                                                            className="border-2 border-green-300 rounded-lg px-3 py-2 text-black focus:border-green-500 focus:outline-none transition-colors w-48"
                                                            min="0"
                                                            placeholder="Ingrese monto"
                                                        />
                                                        <small className="text-green-600 mt-1">Descuento adicional por bonificación</small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumen Final - MEJORADO */}
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-l-4 border-purple-500">
                                        <h3 className="font-bold text-lg mb-4 text-purple-800">Resumen Final</h3>

                                        {/* Desglose */}
                                        <div className="space-y-2 mb-4 text-sm">
                                            <div className="flex justify-between">
                                                <span>Costo del curso ({form.paymentType}):</span>
                                                <span>${formatNumber(
                                                    form.paymentType === 'Efectivo' ? form.customTotalEfectivo :
                                                        form.paymentType === 'Transferencia' ? form.customTotalTransferencia :
                                                            form.customTotalTarjeta
                                                )}</span>
                                            </div>
                                            {!form.isEnrolled && (
                                                <div className="flex justify-between">
                                                    <span>Costo inscripción:</span>
                                                    <span>+${formatNumber(form.enrollmentCost)}</span>
                                                </div>
                                            )}
                                            {form.certificados.length > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Certificados ({form.certificados.length}):</span>
                                                    <span>+${formatNumber(form.certificados.reduce((sum, cert) => sum + (Number(cert.costo) || 0), 0))}</span>
                                                </div>
                                            )}
                                            {form.hasBeca && selectedBeca && (
                                                <div className="flex justify-between text-yellow-700">
                                                    <span>Beca ({selectedBeca.tipo}):</span>
                                                    <span>-${formatNumber(selectedBeca.monto)}</span>
                                                </div>
                                            )}
                                            {form.hasBonus && form.bonusAmount > 0 && (
                                                <div className="flex justify-between text-green-700">
                                                    <span>Bonificación:</span>
                                                    <span>-${formatNumber(form.bonusAmount)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
                                            <div className="text-sm text-purple-800">TOTAL FINAL</div>
                                            <div className="text-3xl font-bold text-purple-900">
                                                ${formatNumber(calcTotalFinal())}
                                            </div>
                                            {form.enableInstallments && form.customInstallments > 0 && !form.fullPayment && (
                                                <div className="text-sm text-purple-700 mt-2">
                                                    En {form.customInstallments} cuotas de ${formatNumber(calcTotalFinal() / form.customInstallments)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

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