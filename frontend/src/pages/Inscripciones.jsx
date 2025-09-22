// src/pages/Inscripciones.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiChevronDown, FiPlus, FiMinus } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

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
    return now > due && now.getDate() > 10;
};

// Función para calcular valor de cuota según la fecha
const getCuotaAmount = (baseAmount, dueDate, paymentData) => {
    if (!dueDate || !paymentData) return baseAmount;

    const due = parseDDMMYYYY(dueDate);
    if (!due) return paymentData.pagoFecha || baseAmount;

    const now = new Date();
    const dayOfMonth = due.getDate();

    // Si es después del día 10 del mes o si ya venció y estamos después del día 10
    if (dayOfMonth > 10 || (now > due && now.getDate() > 10)) {
        return paymentData.pagoVencido || baseAmount;
    }

    // Si es antes del día 10, usar pago en fecha
    return paymentData.pagoFecha || baseAmount;
};

const generarCuotas = (numCuotas, totalFinal, paymentData) => {
    const installments = [];
    const start = new Date();

    for (let i = 0; i < numCuotas; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + i);
        const dueDateStr = formatDate(dueDate);

        // Usar el valor específico del tipo de pago para cada cuota
        const cuotaAmount = getCuotaAmount(totalFinal / numCuotas, dueDateStr, paymentData);

        installments.push({
            number: i + 1,
            dueDate: dueDateStr,
            status: 'Pendiente',
            paymentDate: '',
            amount: cuotaAmount,
        });
    }
    return installments;
};

/* ================== Página Principal ================== */
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

    // Estado del formulario completo según las imágenes
    const [form, setForm] = useState({
        studentId: '',
        courseId: '',
        professorId: '',
        paymentType: 'Efectivo',
        fullPayment: false,
        // Campos dinámicos según tipo de pago
        // Efectivo
        pagoFechaEfectivo: 0,
        pagoVencidoEfectivo: 0,
        totalEfectivo: 0,
        cuotasEfectivo: 0,
        // Transferencia
        pagoFechaTransferencia: 0,
        pagoVencidoTransferencia: 0,
        totalTransferencia: 0,
        cuotasTransferencia: 0,
        // Tarjeta
        porcentajeTarjeta: 30,
        totalTarjeta: 0,
        cuotasTarjeta: 0,
        // Certificados múltiples
        certificados: [],
        // Bonificación
        hasBonus: false,
        bonusAmount: 0,
        // Becas
        hasBeca: false,
        becaId: '',
        // Fechas y datos del curso
        fechaInicio: '',
        fechaFin: '',
        vacantes: 0,
        // Observaciones
        observaciones: ''
    });

    /* ===== Autocompletar datos del curso ===== */
    useEffect(() => {
        const course = courses.find(c => c.id === Number(form.courseId));
        if (course) {
            // Obtener certificados disponibles del curso
            const certificadosDisponibles = [];
            if (course.costosCertificado) {
                Object.entries(course.costosCertificado).forEach(([tipo, costo]) => {
                    certificadosDisponibles.push({ tipo, costo: Number(costo), selected: false });
                });
            }

            setForm(prev => ({
                ...prev,
                fechaInicio: course.inicio || '',
                fechaFin: course.fin || '',
                vacantes: Number(course.vacantes) || 0,
                // Efectivo
                pagoFechaEfectivo: Number(course.pagoFechaEfectivo) || 0,
                pagoVencidoEfectivo: Number(course.pagoVencidoEfectivo) || 0,
                totalEfectivo: Number(course.totalEfectivo) || 0,
                cuotasEfectivo: Number(course.cuotasEfectivo) || 0,
                // Transferencia
                pagoFechaTransferencia: Number(course.pagoFechaTransferencia) || 0,
                pagoVencidoTransferencia: Number(course.pagoVencidoTransferencia) || 0,
                totalTransferencia: Number(course.totalTransferencia) || 0,
                cuotasTransferencia: Number(course.cuotasTransferencia) || 0,
                // Tarjeta
                totalTarjeta: Number(course.totalTarjeta) || 0,
                cuotasTarjeta: Number(course.cuotasTarjeta) || 0,
                certificados: certificadosDisponibles
            }));
        }
    }, [form.courseId, courses]);

    // Cálculo automático del total de tarjeta con porcentaje
    useEffect(() => {
        if (form.paymentType === 'Tarjeta' && form.totalTarjeta > 0) {
            const course = courses.find(c => c.id === Number(form.courseId));
            if (course) {
                const baseAmount = Number(course.totalTarjeta) || 0;
                const percentage = Number(form.porcentajeTarjeta) || 0;
                const calculatedTotal = baseAmount + (baseAmount * percentage / 100);

                if (calculatedTotal !== form.totalTarjeta) {
                    setForm(prev => ({ ...prev, totalTarjeta: calculatedTotal }));
                }
            }
        }
    }, [form.porcentajeTarjeta, form.courseId, courses]);

    const openForm = inscripcion => {
        if (inscripcion) {
            setEditing(inscripcion);
            setForm({
                studentId: inscripcion.studentId?.toString() || '',
                courseId: inscripcion.courseId?.toString() || '',
                professorId: inscripcion.professorId?.toString() || '',
                paymentType: inscripcion.paymentType || 'Efectivo',
                fullPayment: inscripcion.fullPayment || false,
                pagoFechaEfectivo: Number(inscripcion.pagoFechaEfectivo) || 0,
                pagoVencidoEfectivo: Number(inscripcion.pagoVencidoEfectivo) || 0,
                totalEfectivo: Number(inscripcion.totalEfectivo) || 0,
                cuotasEfectivo: Number(inscripcion.cuotasEfectivo) || 0,
                pagoFechaTransferencia: Number(inscripcion.pagoFechaTransferencia) || 0,
                pagoVencidoTransferencia: Number(inscripcion.pagoVencidoTransferencia) || 0,
                totalTransferencia: Number(inscripcion.totalTransferencia) || 0,
                cuotasTransferencia: Number(inscripcion.cuotasTransferencia) || 0,
                porcentajeTarjeta: Number(inscripcion.porcentajeTarjeta) || 30,
                totalTarjeta: Number(inscripcion.totalTarjeta) || 0,
                cuotasTarjeta: Number(inscripcion.cuotasTarjeta) || 0,
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
            setForm({
                studentId: '', courseId: '', professorId: '', paymentType: 'Efectivo', fullPayment: false,
                pagoFechaEfectivo: 0, pagoVencidoEfectivo: 0, totalEfectivo: 0, cuotasEfectivo: 0,
                pagoFechaTransferencia: 0, pagoVencidoTransferencia: 0, totalTransferencia: 0, cuotasTransferencia: 0,
                porcentajeTarjeta: 30, totalTarjeta: 0, cuotasTarjeta: 0,
                certificados: [], hasBonus: false, bonusAmount: 0,
                hasBeca: false, becaId: '', fechaInicio: '', fechaFin: '', vacantes: 0, observaciones: ''
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => { setIsFormOpen(false); setEditing(null); };

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

    // Cálculo del total final
    const calcularTotalFinal = () => {
        let costoBase = 0;

        // Determinar costo base según tipo de pago
        switch (form.paymentType) {
            case 'Efectivo':
                costoBase = Number(form.totalEfectivo) || 0;
                break;
            case 'Transferencia':
                costoBase = Number(form.totalTransferencia) || 0;
                break;
            case 'Tarjeta':
                costoBase = Number(form.totalTarjeta) || 0;
                break;
            default:
                costoBase = 0;
        }

        // Agregar certificados seleccionados
        const costoCertificados = form.certificados
            .filter(cert => cert.selected)
            .reduce((sum, cert) => sum + (Number(cert.costo) || 0), 0);

        // Aplicar descuentos
        const descuentoBeca = form.hasBeca && form.becaId ?
            Number(findBeca(form.becaId)?.monto) || 0 : 0;
        const descuentoBonificacion = form.hasBonus ? Number(form.bonusAmount) || 0 : 0;

        const total = costoBase + costoCertificados - descuentoBeca - descuentoBonificacion;
        return Math.max(0, total);
    };

    const selectedCourse = courses.find(c => c.id === Number(form.courseId));
    const availableCourseProfessors = (professors || []).filter(p =>
        (selectedCourse?.profesores || []).includes(p.id)
    );
    const availableBecas = (becas || []).filter(b => b.activa);
    const selectedBeca = becas.find(b => b.id === Number(form.becaId));

    const getPaymentTypeData = () => {
        switch (form.paymentType) {
            case 'Efectivo':
                return {
                    pagoFecha: form.pagoFechaEfectivo,
                    pagoVencido: form.pagoVencidoEfectivo,
                    total: form.totalEfectivo,
                    cuotas: form.cuotasEfectivo
                };
            case 'Transferencia':
                return {
                    pagoFecha: form.pagoFechaTransferencia,
                    pagoVencido: form.pagoVencidoTransferencia,
                    total: form.totalTransferencia,
                    cuotas: form.cuotasTransferencia
                };
            case 'Tarjeta':
                return {
                    pagoFecha: form.totalTarjeta / (form.cuotasTarjeta || 1),
                    pagoVencido: form.totalTarjeta / (form.cuotasTarjeta || 1),
                    total: form.totalTarjeta,
                    cuotas: form.cuotasTarjeta
                };
            default:
                return { pagoFecha: 0, pagoVencido: 0, total: 0, cuotas: 0 };
        }
    };

    // Función para obtener datos completos de la inscripción
    const getInscriptionDetails = (inscription) => {
        if (!inscription) return null;

        const student = findStudent(inscription.studentId);
        const course = findCourse(inscription.courseId);
        const professor = findProfessor(inscription.professorId);
        const beca = inscription.hasBeca && inscription.becaId ? findBeca(inscription.becaId) : null;

        // Obtener valores específicos del tipo de pago
        let paymentData = {
            pagoFecha: 0,
            pagoVencido: 0,
            total: 0,
            cuotas: 0
        };

        switch (inscription.paymentType) {
            case 'Efectivo':
                paymentData = {
                    pagoFecha: inscription.pagoFechaEfectivo || 0,
                    pagoVencido: inscription.pagoVencidoEfectivo || 0,
                    total: inscription.totalEfectivo || 0,
                    cuotas: inscription.cuotasEfectivo || 0
                };
                break;
            case 'Transferencia':
                paymentData = {
                    pagoFecha: inscription.pagoFechaTransferencia || 0,
                    pagoVencido: inscription.pagoVencidoTransferencia || 0,
                    total: inscription.totalTransferencia || 0,
                    cuotas: inscription.cuotasTransferencia || 0
                };
                break;
            case 'Tarjeta':
                const totalTarjeta = inscription.totalTarjeta || 0;
                const cuotasTarjeta = inscription.cuotasTarjeta || 1;
                paymentData = {
                    pagoFecha: totalTarjeta / cuotasTarjeta,
                    pagoVencido: totalTarjeta / cuotasTarjeta,
                    total: totalTarjeta,
                    cuotas: cuotasTarjeta
                };
                break;
        }

        return {
            inscription,
            student,
            course,
            professor,
            beca,
            paymentData
        };
    };

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

            const totalFinal = calcularTotalFinal();
            const paymentTypeData = getPaymentTypeData();

            let installments = [];
            if (!form.fullPayment && paymentTypeData.cuotas > 0) {
                installments = generarCuotas(paymentTypeData.cuotas, totalFinal, paymentTypeData);
            }

            const certificadosSeleccionados = form.certificados.filter(cert => cert.selected);

            const newInscription = {
                studentId: student.id,
                courseId: course.id,
                studentName: `${student.nombre} ${student.apellido}`,
                courseName: course.nombre,
                professorId: professor.id,
                professorName: `${professor.nombre} ${professor.apellido}`,
                paymentType: form.paymentType,
                fullPayment: form.fullPayment,
                // Datos específicos del tipo de pago
                pagoFechaEfectivo: form.pagoFechaEfectivo,
                pagoVencidoEfectivo: form.pagoVencidoEfectivo,
                totalEfectivo: form.totalEfectivo,
                cuotasEfectivo: form.cuotasEfectivo,
                pagoFechaTransferencia: form.pagoFechaTransferencia,
                pagoVencidoTransferencia: form.pagoVencidoTransferencia,
                totalTransferencia: form.totalTransferencia,
                cuotasTransferencia: form.cuotasTransferencia,
                porcentajeTarjeta: form.porcentajeTarjeta,
                totalTarjeta: form.totalTarjeta,
                cuotasTarjeta: form.cuotasTarjeta,
                // Certificados, becas y bonificaciones
                certificados: certificadosSeleccionados,
                hasBonus: form.hasBonus,
                bonusAmount: form.bonusAmount,
                hasBeca: form.hasBeca,
                becaId: form.hasBeca ? Number(form.becaId) : null,
                becaMonto: form.hasBeca && selectedBeca ? Number(selectedBeca.monto) : 0,
                // Fechas y datos del curso
                fechaInicio: form.fechaInicio,
                fechaFin: form.fechaFin,
                vacantes: form.vacantes,
                observaciones: form.observaciones,
                // Cuotas e información calculada
                installments,
                totalFinal,
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
            } else {
                showNotification('success', 'Función eliminar implementada - actualiza el contexto AppDB');
            }
        }
    };

    const handlePayInstallment = (inscId, num) => {
        const insc = inscriptions.find(i => i.id === inscId);
        if (!insc) return showNotification('error', 'Inscripción no encontrada.');

        const updatedInstallments = insc.installments.map(inst =>
            inst.number === num ? {
                ...inst,
                status: 'Pagado',
                paymentDate: formatDate(new Date()),
                amountPaid: inst.amount
            } : inst
        );

        updateInscription(inscId, { ...insc, installments: updatedInstallments });
        showNotification('success', `Cuota ${num} pagada correctamente.`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-800 mb-2">Inscribir Alumno a Curso</h1>
                    <p className="text-gray-600">Complete los datos requeridos para la inscripción</p>
                </div>

                {/* Buscador y botón Nueva Inscripción */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por alumno, curso o profesor..."
                            className="w-full px-4 py-3 text-lg border-2 border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black bg-white shadow-sm transition-all duration-200"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
                    >
                        Nueva Inscripción
                    </button>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                            <tr>
                                <th className="px-4 py-4 text-left font-bold">#</th>
                                <th className="px-4 py-4 text-left font-bold">Alumno</th>
                                <th className="px-4 py-4 text-left font-bold">Curso</th>
                                <th className="px-4 py-4 text-left font-bold">Profesor</th>
                                <th className="px-4 py-4 text-left font-bold">Tipo Pago</th>
                                <th className="px-4 py-4 text-center font-bold">Pago Total</th>
                                <th className="px-4 py-4 text-right font-bold">Total Final</th>
                                <th className="px-4 py-4 text-center font-bold">Acciones</th>
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
                                    <td className="px-4 py-4 text-black font-bold">{inscripcion.id}</td>
                                    <td className="px-4 py-4 text-black font-semibold">{inscripcion.studentName}</td>
                                    <td className="px-4 py-4 text-black font-semibold">{inscripcion.courseName}</td>
                                    <td className="px-4 py-4 text-gray-700">{inscripcion.professorName}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                            inscripcion.paymentType==='Efectivo'?'bg-green-100 text-green-800':
                                                inscripcion.paymentType==='Transferencia'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'
                                        }`}>
                                            {inscripcion.paymentType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {inscripcion.fullPayment ?
                                            <FiCheck size={20} className="text-green-600 mx-auto"/> :
                                            <FiX size={20} className="text-red-600 mx-auto"/>
                                        }
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="text-green-700 font-bold text-lg">
                                            ${formatNumber(inscripcion.totalFinal || 0)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center space-x-2">
                                            <motion.button
                                                onClick={() => setViewing(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                <FiEye size={18} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openForm(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-yellow-600 hover:text-yellow-800 transition-colors p-2 rounded-full hover:bg-yellow-50"
                                                title="Editar"
                                            >
                                                <FiEdit size={18} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(inscripcion)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 size={18} />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-500">
                                        <div className="text-xl">
                                            {search ? 'No se encontraron inscripciones que coincidan.' : 'No hay inscripciones registradas.'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detalles - COMPLETO CON TODA LA INFORMACIÓN DEL CURSO */}
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
                            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative text-black shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Detalles de la Inscripción</h2>
                                <button
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={() => setViewing(null)}
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                {(() => {
                                    const details = getInscriptionDetails(viewing);
                                    if (!details) {
                                        return <div className="text-red-500">Error al cargar los detalles</div>;
                                    }

                                    const { inscription, student, course, professor, beca, paymentData } = details;

                                    return (
                                        <div className="space-y-6">
                                            {/* Información principal */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Columna izquierda */}
                                                <div className="space-y-4">
                                                    {/* Alumno */}
                                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                        <div className="text-sm text-purple-600 font-semibold mb-1">ALUMNO</div>
                                                        <div className="text-lg font-bold">{inscription.studentName}</div>
                                                        {student && (
                                                            <div className="text-sm text-purple-700 mt-1">
                                                                DNI: {student.dni} • Email: {student.email} • Teléfono: {student.telefono}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Curso */}
                                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                        <div className="text-sm text-blue-600 font-semibold mb-1">CURSO</div>
                                                        <div className="text-lg font-bold">{inscription.courseName}</div>
                                                        <div className="text-sm text-blue-700 mt-1">
                                                            Inicio: {formatDate(inscription.fechaInicio)} • Fin: {formatDate(inscription.fechaFin)} • Vacantes: {inscription.vacantes}
                                                        </div>
                                                        {course && course.descripcion && (
                                                            <div className="text-sm text-blue-600 mt-2">{course.descripcion}</div>
                                                        )}
                                                    </div>

                                                    {/* Profesor */}
                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                        <div className="text-sm text-green-600 font-semibold mb-1">PROFESOR</div>
                                                        <div className="text-lg font-bold">{inscription.professorName}</div>
                                                        {professor && (
                                                            <div className="text-sm text-green-700 mt-1">
                                                                Email: {professor.email} • Teléfono: {professor.telefono}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Columna derecha */}
                                                <div className="space-y-4">
                                                    {/* Tipo de Pago */}
                                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                        <div className="text-sm text-orange-600 font-semibold mb-1">TIPO DE PAGO</div>
                                                        <div className="text-lg font-bold">{inscription.paymentType}</div>
                                                    </div>

                                                    {/* Totales específicos por tipo de pago */}
                                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                                        <div className="text-sm text-indigo-600 font-semibold mb-2">TOTALES</div>

                                                        {inscription.paymentType === 'Efectivo' && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Pago en Fecha:</span>
                                                                    <span className="font-bold text-green-600">${formatNumber(paymentData.pagoFecha)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Pago Vencido:</span>
                                                                    <span className="font-bold text-red-600">${formatNumber(paymentData.pagoVencido)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm border-t pt-2">
                                                                    <span className="font-bold">Total:</span>
                                                                    <span className="font-bold">${formatNumber(paymentData.total)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Cuotas:</span>
                                                                    <span className="font-bold">{paymentData.cuotas}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {inscription.paymentType === 'Transferencia' && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Pago en Fecha:</span>
                                                                    <span className="font-bold text-green-600">${formatNumber(paymentData.pagoFecha)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Pago Vencido:</span>
                                                                    <span className="font-bold text-red-600">${formatNumber(paymentData.pagoVencido)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm border-t pt-2">
                                                                    <span className="font-bold">Total:</span>
                                                                    <span className="font-bold">${formatNumber(paymentData.total)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Cuotas:</span>
                                                                    <span className="font-bold">{paymentData.cuotas}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {inscription.paymentType === 'Tarjeta' && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Porcentaje:</span>
                                                                    <span className="font-bold">{inscription.porcentajeTarjeta || 0}%</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm border-t pt-2">
                                                                    <span className="font-bold">Curso Total:</span>
                                                                    <span className="font-bold">${formatNumber(paymentData.total)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Cuotas:</span>
                                                                    <span className="font-bold">{paymentData.cuotas}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Certificados */}
                                                        {inscription.certificados && inscription.certificados.length > 0 && (
                                                            <div className="mt-4 pt-3 border-t">
                                                                <div className="text-xs font-semibold mb-2">CERTIFICADOS SELECCIONADOS</div>
                                                                {inscription.certificados.map((cert, idx) => (
                                                                    <div key={idx} className="flex justify-between text-sm">
                                                                        <span>{cert.tipo}:</span>
                                                                        <span className="font-bold text-orange-600">${formatNumber(cert.costo || 0)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Descuentos */}
                                                        {(inscription.hasBeca || inscription.hasBonus) && (
                                                            <div className="mt-4 pt-3 border-t">
                                                                <div className="text-xs font-semibold mb-2">DESCUENTOS</div>
                                                                {inscription.hasBeca && beca && (
                                                                    <div className="flex justify-between text-sm">
                                                                        <span>Beca {beca.tipo}:</span>
                                                                        <span className="font-bold text-yellow-600">-${formatNumber(beca.monto || 0)}</span>
                                                                    </div>
                                                                )}
                                                                {inscription.hasBonus && inscription.bonusAmount > 0 && (
                                                                    <div className="flex justify-between text-sm">
                                                                        <span>Bonificación:</span>
                                                                        <span className="font-bold text-yellow-600">-${formatNumber(inscription.bonusAmount)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Total Final */}
                                                        <div className="mt-4 pt-3 border-t-2 border-indigo-400">
                                                            <div className="flex justify-between">
                                                                <span className="text-lg font-bold text-indigo-800">TOTAL FINAL:</span>
                                                                <span className="text-2xl font-bold text-indigo-900">
                                                                    ${formatNumber(inscription.totalFinal || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Plan de Cuotas o Pago Completo */}
                                            {inscription.fullPayment ? (
                                                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-xl border-l-4 border-green-500">
                                                    <div className="flex items-center space-x-3">
                                                        <FiCheck size={28} className="text-green-600"/>
                                                        <div>
                                                            <div className="text-xl font-bold text-green-800">Pago Total Realizado</div>
                                                            <div className="text-green-600">El curso ha sido pagado completamente</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : inscription.installments && inscription.installments.length > 0 ? (
                                                <div className="space-y-4">
                                                    <h3 className="text-2xl font-semibold text-gray-800">Plan de Cuotas</h3>
                                                    <div className="overflow-auto border-2 border-gray-300 rounded-xl shadow-lg">
                                                        <table className="min-w-full bg-white">
                                                            <thead className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left font-semibold">Cuota</th>
                                                                <th className="px-4 py-3 text-left font-semibold">Vencimiento</th>
                                                                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                                                                <th className="px-4 py-3 text-left font-semibold">Fecha Pago</th>
                                                                <th className="px-4 py-3 text-left font-semibold">Monto</th>
                                                                <th className="px-4 py-3 text-left font-semibold">Acción</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {inscription.installments.map((inst, index) => (
                                                                <tr key={inst.number} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                                                    <td className="px-4 py-3 text-black font-bold">#{inst.number}</td>
                                                                    <td className="px-4 py-3 text-black">
                                                                        <div className="flex items-center gap-2">
                                                                            <span>{inst.dueDate}</span>
                                                                            {isOverdue(inst.dueDate) && inst.status === 'Pendiente' && (
                                                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Vencida</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                            inst.status==='Pagado'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'
                                                                        }`}>
                                                                            {inst.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-black">{inst.paymentDate || '-'}</td>
                                                                    <td className="px-4 py-3 text-black font-bold text-purple-700">
                                                                        ${formatNumber(inst.amount || 0)}
                                                                        {inst.status === 'Pagado' && inst.amountPaid && (
                                                                            <span className="ml-2 text-xs text-gray-500">(Pagado: ${formatNumber(inst.amountPaid)})</span>
                                                                        )}
                                                                        {isOverdue(inst.dueDate) && inst.status==='Pendiente' && (
                                                                            <div className="text-xs text-red-600 mt-1">Con recargo por pago fuera de término</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        {inst.status==='Pendiente' && (
                                                                            <button
                                                                                onClick={() => handlePayInstallment(inscription.id, inst.number)}
                                                                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold shadow-md"
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
                                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                                                    <div className="text-yellow-800 font-semibold text-lg mb-2">
                                                        No hay plan de cuotas configurado
                                                    </div>
                                                    <div className="text-yellow-600">
                                                        Esta inscripción no tiene cuotas configuradas
                                                    </div>
                                                </div>
                                            )}

                                            {/* Observaciones */}
                                            {inscription.observaciones && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                    <div className="text-sm text-gray-600 font-semibold mb-2">OBSERVACIONES</div>
                                                    <div className="text-black">{inscription.observaciones}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario - COMPLETO SEGÚN LAS IMÁGENES */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden relative text-black shadow-2xl"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-green-600 text-white p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Inscribir Alumno a Curso</h2>
                                    <p className="text-green-100">Complete los datos requeridos para la inscripción</p>
                                </div>
                                <button
                                    type="button"
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={closeForm}
                                >
                                    <FiX className="w-6 h-6"/>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-6 space-y-6">
                                    {/* Información básica */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium mb-2 text-gray-700">Alumno:</label>
                                            <SearchableSelect
                                                options={students}
                                                value={form.studentId}
                                                onChange={v => setForm(prev => ({ ...prev, studentId: v }))}
                                                placeholder="Alexander Flores Ramírez (DNI: 12345678)"
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
                                                placeholder="Base de datos"
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
                                                placeholder="Alexander Flores Ramírez"
                                                getLabel={p => `${p.nombre} ${p.apellido}`}
                                                getValue={p => p.id.toString()}
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium mb-2 text-gray-700">Fecha Inicio:</label>
                                            <input
                                                type="date"
                                                value={form.fechaInicio}
                                                disabled
                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black bg-gray-100 cursor-not-allowed"
                                            />
                                            <small className="text-gray-500 mt-1">Se toma del curso</small>
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium mb-2 text-gray-700">Fecha Fin:</label>
                                            <input
                                                type="date"
                                                value={form.fechaFin}
                                                disabled
                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black bg-gray-100 cursor-not-allowed"
                                            />
                                            <small className="text-gray-500 mt-1">Se toma del curso</small>
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium mb-2 text-green-700">Vacantes:</label>
                                            <input
                                                type="number"
                                                value={form.vacantes}
                                                disabled
                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black bg-gray-100 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Forma de Pago */}
                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="text-lg font-semibold text-green-800 mb-4">Forma de Pago</h3>

                                        <div className="mb-4">
                                            <label className="text-sm font-medium mb-2 text-gray-700">Tipo de Pago *:</label>
                                            <select
                                                name="paymentType"
                                                value={form.paymentType}
                                                onChange={handleChange}
                                                className="w-full border-2 border-green-300 rounded-lg px-3 py-2 text-black focus:border-green-500 focus:outline-none"
                                            >
                                                <option value="Efectivo">Efectivo</option>
                                                <option value="Transferencia">Transferencia</option>
                                                <option value="Tarjeta">Tarjeta</option>
                                            </select>
                                        </div>

                                        {/* Datos dinámicos por tipo de pago */}
                                        {form.paymentType === 'Efectivo' && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                <h4 className="font-semibold text-green-800 mb-3">Datos de Efectivo</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-green-700">Pago en Fecha (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="pagoFechaEfectivo"
                                                            value={form.pagoFechaEfectivo}
                                                            onChange={handleChange}
                                                            className="w-full border border-green-300 rounded-lg px-3 py-2 text-black focus:border-green-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-green-700">Pago Vencido (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="pagoVencidoEfectivo"
                                                            value={form.pagoVencidoEfectivo}
                                                            onChange={handleChange}
                                                            className="w-full border border-green-300 rounded-lg px-3 py-2 text-black focus:border-green-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-green-700">Total del Curso:</label>
                                                        <input
                                                            type="number"
                                                            name="totalEfectivo"
                                                            value={form.totalEfectivo}
                                                            onChange={handleChange}
                                                            className="w-full border border-green-300 rounded-lg px-3 py-2 text-black focus:border-green-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-green-700">Número de Cuotas:</label>
                                                        <input
                                                            type="number"
                                                            name="cuotasEfectivo"
                                                            value={form.cuotasEfectivo}
                                                            onChange={handleChange}
                                                            className="w-full border border-green-300 rounded-lg px-3 py-2 text-black focus:border-green-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {form.paymentType === 'Transferencia' && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <h4 className="font-semibold text-blue-800 mb-3">Datos de Transferencias</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-blue-700">Pago en Fecha (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="pagoFechaTransferencia"
                                                            value={form.pagoFechaTransferencia}
                                                            onChange={handleChange}
                                                            className="w-full border border-blue-300 rounded-lg px-3 py-2 text-black focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-blue-700">Pago Vencido (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="pagoVencidoTransferencia"
                                                            value={form.pagoVencidoTransferencia}
                                                            onChange={handleChange}
                                                            className="w-full border border-blue-300 rounded-lg px-3 py-2 text-black focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-blue-700">Total del Curso:</label>
                                                        <input
                                                            type="number"
                                                            name="totalTransferencia"
                                                            value={form.totalTransferencia}
                                                            onChange={handleChange}
                                                            className="w-full border border-blue-300 rounded-lg px-3 py-2 text-black focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-blue-700">Número de Cuotas:</label>
                                                        <input
                                                            type="number"
                                                            name="cuotasTransferencia"
                                                            value={form.cuotasTransferencia}
                                                            onChange={handleChange}
                                                            className="w-full border border-blue-300 rounded-lg px-3 py-2 text-black focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {form.paymentType === 'Tarjeta' && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                                <h4 className="font-semibold text-purple-800 mb-3">Datos de Tarjetas</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-purple-700">Porcentaje (%):</label>
                                                        <input
                                                            type="number"
                                                            name="porcentajeTarjeta"
                                                            value={form.porcentajeTarjeta}
                                                            onChange={handleChange}
                                                            className="w-full border border-purple-300 rounded-lg px-3 py-2 text-black focus:border-purple-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-purple-700">Curso Total:</label>
                                                        <input
                                                            type="number"
                                                            name="totalTarjeta"
                                                            value={form.totalTarjeta}
                                                            disabled
                                                            className="w-full border border-purple-300 rounded-lg px-3 py-2 text-black bg-purple-100"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 text-purple-700">Cuotas:</label>
                                                        <input
                                                            type="number"
                                                            name="cuotasTarjeta"
                                                            value={form.cuotasTarjeta}
                                                            onChange={handleChange}
                                                            className="w-full border border-purple-300 rounded-lg px-3 py-2 text-black focus:border-purple-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Certificados (Múltiples Selecciones) */}
                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="text-lg font-semibold text-green-800 mb-4">Certificados (Múltiples Selecciones)</h3>
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                            <p className="text-orange-800 text-sm mb-4">El alumno puede seleccionar múltiples certificados para este curso</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {form.certificados.map((cert, index) => (
                                                    <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-orange-300">
                                                        <input
                                                            type="checkbox"
                                                            id={`cert-${index}`}
                                                            checked={cert.selected || false}
                                                            onChange={(e) => handleCertificadoChange(index, e.target.checked)}
                                                            className="w-5 h-5 text-green-600"
                                                        />
                                                        <label htmlFor={`cert-${index}`} className="flex-1 cursor-pointer">
                                                            <div className="font-semibold text-gray-800">{cert.tipo}</div>
                                                            <div className="text-orange-600 font-bold">${formatNumber(cert.costo)}</div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            {form.certificados.length === 0 && (
                                                <div className="text-center text-orange-600 py-4">
                                                    No hay certificados seleccionados
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bonificación */}
                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="text-lg font-semibold text-green-800 mb-4">Bonificación</h3>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-4">
                                                <input
                                                    type="checkbox"
                                                    id="hasBonus"
                                                    name="hasBonus"
                                                    checked={form.hasBonus}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-green-600"
                                                />
                                                <label htmlFor="hasBonus" className="font-semibold text-yellow-800">
                                                    Bonificación (descuento sobre el total)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="bonusAmount"
                                                    value={form.bonusAmount}
                                                    onChange={handleChange}
                                                    disabled={!form.hasBonus}
                                                    placeholder="0"
                                                    className={`border-2 rounded-lg px-3 py-2 text-black w-32 ${
                                                        form.hasBonus
                                                            ? 'border-yellow-400 focus:border-yellow-500'
                                                            : 'bg-gray-100 border-gray-300 cursor-not-allowed'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Becas */}
                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="text-lg font-semibold text-green-800 mb-4">Becas</h3>
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="hasBeca"
                                                    name="hasBeca"
                                                    checked={form.hasBeca}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-green-600"
                                                />
                                                <label htmlFor="hasBeca" className="font-semibold text-blue-800">
                                                    Aplicar Beca
                                                </label>
                                            </div>
                                            {form.hasBeca && (
                                                <div>
                                                    <SearchableSelect
                                                        options={availableBecas}
                                                        value={form.becaId}
                                                        onChange={v => setForm(prev => ({ ...prev, becaId: v }))}
                                                        placeholder="Seleccionar beca..."
                                                        getLabel={b => `${b.tipo} - $${formatNumber(b.monto)}`}
                                                        getValue={b => b.id.toString()}
                                                    />
                                                    {selectedBeca && (
                                                        <div className="mt-2 text-sm text-blue-700">
                                                            Descuento: $-{formatNumber(selectedBeca.monto)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resumen de Precios */}
                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="text-lg font-semibold text-green-800 mb-4">Resumen de Precios</h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Total Curso */}
                                            <div className="space-y-3">
                                                {form.paymentType === 'Efectivo' && (
                                                    <div className="bg-green-100 p-4 rounded-lg">
                                                        <div className="text-green-800 font-bold text-lg">Total Curso (Efectivo)</div>
                                                        <div className="text-2xl font-bold text-green-900">${formatNumber(form.totalEfectivo)}</div>
                                                        {!form.fullPayment && form.cuotasEfectivo > 0 && (
                                                            <div className="text-sm text-green-700 mt-2">
                                                                Por Cuota: ${formatNumber(form.pagoFechaEfectivo)} - Cuotas: {form.cuotasEfectivo}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {form.paymentType === 'Transferencia' && (
                                                    <div className="bg-blue-100 p-4 rounded-lg">
                                                        <div className="text-blue-800 font-bold text-lg">Total Curso (Transferencia)</div>
                                                        <div className="text-2xl font-bold text-blue-900">${formatNumber(form.totalTransferencia)}</div>
                                                        {!form.fullPayment && form.cuotasTransferencia > 0 && (
                                                            <div className="text-sm text-blue-700 mt-2">
                                                                Por Cuota: ${formatNumber(form.pagoFechaTransferencia)} - Cuotas: {form.cuotasTransferencia}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {form.paymentType === 'Tarjeta' && (
                                                    <div className="bg-purple-100 p-4 rounded-lg">
                                                        <div className="text-purple-800 font-bold text-lg">Total Curso (Tarjeta)</div>
                                                        <div className="text-2xl font-bold text-purple-900">${formatNumber(form.totalTarjeta)}</div>
                                                        <div className="text-sm text-purple-700 mt-1">Porcentaje: {form.porcentajeTarjeta}%</div>
                                                        {!form.fullPayment && form.cuotasTarjeta > 0 && (
                                                            <div className="text-sm text-purple-700 mt-2">
                                                                Por Cuota: ${formatNumber(form.totalTarjeta / Math.max(1, form.cuotasTarjeta))} - Cuotas: {form.cuotasTarjeta}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Certificados Seleccionados */}
                                                <div className="bg-orange-100 p-4 rounded-lg">
                                                    <div className="text-orange-800 font-bold">Certificados Seleccionados</div>
                                                    {form.certificados.filter(c => c.selected).length > 0 ? (
                                                        <div className="text-orange-900">
                                                            {form.certificados.filter(c => c.selected).map(cert => (
                                                                <div key={cert.tipo} className="text-sm">
                                                                    {cert.tipo}: +${formatNumber(cert.costo)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-orange-600">No hay certificados seleccionados</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Total Final */}
                                            <div className="space-y-3">
                                                {/* Descuentos */}
                                                {(form.hasBeca || form.hasBonus) && (
                                                    <div className="bg-yellow-100 p-4 rounded-lg">
                                                        <div className="text-yellow-800 font-bold mb-2">Descuentos</div>
                                                        {form.hasBeca && selectedBeca && (
                                                            <div className="text-sm text-yellow-700">
                                                                Beca {selectedBeca.tipo}: -${formatNumber(selectedBeca.monto)}
                                                            </div>
                                                        )}
                                                        {form.hasBonus && (
                                                            <div className="text-sm text-yellow-700">
                                                                Bonificación: -${formatNumber(form.bonusAmount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Total Final */}
                                                <div className="bg-green-100 p-4 rounded-lg border-2 border-green-400">
                                                    <div className="text-green-800 font-bold text-lg">TOTAL FINAL</div>
                                                    <div className="text-3xl font-bold text-green-900">
                                                        ${formatNumber(calcularTotalFinal())}
                                                    </div>
                                                    <div className="text-sm text-green-700 mt-1">Incluye curso + certificados - bonificación</div>

                                                    {/* Plan de Cuotas */}
                                                    {!form.fullPayment && (() => {
                                                        const paymentData = getPaymentTypeData();
                                                        return paymentData.cuotas > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-green-300">
                                                                <div className="text-green-800 font-bold">Plan de Cuotas:</div>
                                                                <div className="text-sm text-green-700">
                                                                    Cuotas: {paymentData.cuotas}
                                                                </div>
                                                                <div className="text-sm text-green-700">
                                                                    Valor estimado por cuota: ${formatNumber(calcularTotalFinal() / paymentData.cuotas)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pago Total */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="fullPayment"
                                                name="fullPayment"
                                                checked={form.fullPayment}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-green-600"
                                            />
                                            <label htmlFor="fullPayment" className="font-semibold text-gray-800">
                                                Pago Total (sin plan de cuotas)
                                            </label>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="text-lg font-semibold text-green-800 mb-2">Observaciones:</h3>
                                        <textarea
                                            name="observaciones"
                                            value={form.observaciones}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Observaciones adicionales sobre la inscripción..."
                                            className="w-full border-2 border-green-300 rounded-lg px-3 py-2 text-black focus:border-green-500 focus:outline-none resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Botones */}
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
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow"
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