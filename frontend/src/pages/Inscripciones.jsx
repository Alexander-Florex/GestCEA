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
                className="border-2 border-gray-300 rounded-xl p-3 bg-white cursor-pointer flex justify-between items-center focus-within:border-red-500 transition-colors"
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
                            className="p-3 hover:bg-red-50 cursor-pointer text-black transition-colors"
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
                            n.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'
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
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

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

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(n => n.filter(x => x.id !== id));
    };

    const filtered = useMemo(
        () => inscriptions.filter(ins =>
            [ins.studentName, ins.courseName, ins.professorName].some(f =>
                String(f).toLowerCase().includes(search.toLowerCase())
            )
        ),
        [inscriptions, search]
    );

    const openForm = (ins) => {
        if (ins) {
            setEditing(ins);
            const curso = courses.find(c => c.id === ins.courseId);
            setForm({
                studentId: ins.studentId?.toString() || '',
                courseId: ins.courseId?.toString() || '',
                professorId: ins.professorId?.toString() || '',
                paymentType: ins.paymentType || 'Efectivo',
                fullPayment: ins.fullPayment || false,
                certificados: ins.certificados || (curso?.tiposCertificado || []).map(t => ({
                    tipo: t,
                    costo: curso?.costosCertificado?.[t] || 0,
                    selected: false
                })),
                hasBonus: ins.hasBonus || false,
                bonusAmount: ins.bonusAmount || 0,
                hasBeca: ins.hasBeca || false,
                becaId: ins.becaId?.toString() || '',
                hasFactura: ins.hasFactura || false,
                tipoFactura: ins.tipoFactura || 'Factura C',
                fechaInicio: ins.fechaInicio || '',
                fechaFin: ins.fechaFin || '',
                observaciones: ins.observaciones || ''
            });
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

    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
        setViewing(null);
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
                console.log('📚 [CURSO SELECCIONADO]', curso);

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

// ✅ SUBMIT NUEVO - SIN PORCENTAJES, CON 2 PRECIOS FIJOS (EN FECHA / VENCIDO)
// y cálculo para EFECTIVO y TRANSFERENCIA
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

            // -------------------------------
            // Helpers
            // -------------------------------
            const readNumber = (...vals) => {
                for (const v of vals) {
                    const n = Number(v);
                    if (!Number.isNaN(n) && n > 0) return n;
                }
                return 0;
            };

            // Dado total y cuotas, y opcionalmente valores fijos por cuota,
            // devuelve cuotaEnFecha y cuotaVencido (si rawVencido parece total, lo divide).
            const getCuotaValues = (totalEnFecha, cuotas, rawEnFecha, rawVencido) => {
                const cuotasSafe = cuotas > 0 ? cuotas : 1;

                const cuotaEnFecha =
                    rawEnFecha > 0 ? rawEnFecha : Math.round(totalEnFecha / cuotasSafe);

                let cuotaVencido = cuotaEnFecha;
                if (rawVencido > 0) {
                    // Si rawVencido parece ser TOTAL vencido del curso, lo dividimos por cuotas
                    cuotaVencido =
                        rawVencido > totalEnFecha && cuotasSafe > 1
                            ? Math.round(rawVencido / cuotasSafe)
                            : rawVencido;
                }

                return { cuotaEnFecha, cuotaVencido };
            };

            // -------------------------------
            // 1) SNAPSHOT DEL CURSO (FIJO)
            // -------------------------------

            // cuotas compartidas para efectivo/transferencia
            const cuotasCompartidas = course.cuotasEnabled
                ? Number(
                    course.cuotasCompartidas ||
                    course.cuotasEfectivo ||
                    course.cuotasTransferencia ||
                    1
                )
                : 1;

            // Totales base por método (curso completo)
            const totalEfectivo = readNumber(course.totalEfectivo);
            const totalTransferencia = readNumber(course.totalTransferencia);
            const totalTarjeta = readNumber(course.totalTarjeta);

            // Valores FIJOS por cuota
            // (poné acá los nombres reales de tus campos si difieren.
            // Si no existen, hace fallback automático dividiendo el total)
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

            // -------------------------------
            // 2) CERTIFICADOS
            // -------------------------------
            const selectedCertificados = (form.certificados || []).filter((c) => c.selected);
            const totalCertificados = selectedCertificados.reduce(
                (sum, cert) => sum + (Number(cert.costo) || 0),
                0
            );

            // -------------------------------
            // 3) DESCUENTOS (FIJOS)
            // -------------------------------
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

            // -------------------------------
            // 4) FUNCIÓN PARA CALCULAR TODO POR MÉTODO
            // -------------------------------
            const buildFor = (forma) => {
                if (!forma || forma.cuotaEnFecha <= 0) return null;

                const numCuotas = form.fullPayment ? 1 : (forma.cuotas || 1);

                // Totales del curso (sin certificados)
                const totalCursoEnFecha = forma.cuotaEnFecha * numCuotas;
                const totalCursoVencido = forma.cuotaVencido * numCuotas;

                // Brutos
                const totalBrutoEnFecha = totalCursoEnFecha + totalCertificados;
                const totalBrutoVencido = totalCursoVencido + totalCertificados;

                // Reparto de descuento proporcional al bruto EN FECHA
                const proporcionCurso =
                    totalBrutoEnFecha > 0 ? totalCursoEnFecha / totalBrutoEnFecha : 1;

                const descuentoCurso = Math.round(descuentoTotal * proporcionCurso);
                const descuentoCert = descuentoTotal - descuentoCurso; // asegura suma exacta

                // El mismo descuento de curso se resta para enFecha y vencido
                const totalCursoFinalEnFecha = totalCursoEnFecha - descuentoCurso;
                const totalCursoFinalVencido = totalCursoVencido - descuentoCurso;
                const totalCertFinal = totalCertificados - descuentoCert;

                const totalFinalEnFecha = totalCursoFinalEnFecha + totalCertFinal;
                const totalFinalVencido = totalCursoFinalVencido + totalCertFinal;

                if (totalFinalEnFecha <= 0) {
                    throw new Error("El total final debe ser mayor a 0");
                }

                // Cuotas
                let installments = [];

                if (!form.fullPayment && numCuotas > 1) {
                    const fechaInicio = form.fechaInicio
                        ? new Date(form.fechaInicio)
                        : new Date();

                    // ✅ REPARTIR EL TOTAL FINAL (curso + certificados netos)
// para que sum(installments) == totalFinal

                    const totalFinalEnFechaRound = Math.round(totalFinalEnFecha);
                    const totalFinalVencidoRound = Math.round(totalFinalVencido);

                    const baseEnFecha = Math.round(totalFinalEnFechaRound / numCuotas);
                    const baseVencido = Math.round(totalFinalVencidoRound / numCuotas);

                    let accEnFecha = 0;
                    let accVencido = 0;

                    for (let i = 0; i < numCuotas; i++) {
                        const fechaVenc = new Date(fechaInicio);
                        fechaVenc.setMonth(fechaVenc.getMonth() + i);

                        let montoEnFecha, montoVencido;

                        if (i === numCuotas - 1) {
                            // última cuota se ajusta para cerrar exacto
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

                            // amount y amountEnFecha son lo mismo: lo que se cobra en fecha
                            amount: montoEnFecha,
                            amountEnFecha: montoEnFecha,

                            // amountVencido es el valor fijo vencido de ESA cuota
                            amountVencido: montoVencido,

                            amountPaid: 0,
                            status: "Pendiente",
                            paidAt: null,
                            frozen: false,
                        });
                    }

                }

                return {
                    numCuotas,
                    installments,
                    totalCursoEnFecha,
                    totalCursoVencido,
                    totalBrutoEnFecha,
                    totalBrutoVencido,
                    totalFinalEnFecha,
                    totalFinalVencido,
                };
            };

            // Calculamos TODO para los 3 métodos
            const builds = {
                efectivo: buildFor(cursoSnapshot.efectivo),
                transferencia: buildFor(cursoSnapshot.transferencia),
                tarjeta: buildFor(cursoSnapshot.tarjeta),
            };

            // Método principal (lo que eligió el usuario en la inscripción)
            const mainKey =
                form.paymentType === "Efectivo"
                    ? "efectivo"
                    : form.paymentType === "Transferencia"
                        ? "transferencia"
                        : "tarjeta";

            const main = builds[mainKey];
            if (!main) throw new Error("La forma de pago seleccionada no tiene precio válido.");

            // -------------------------------
            // 5) ARMAR DATA FINAL
            // -------------------------------
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

                // Totales PRINCIPALES según método elegido
                precioBaseCurso: main.totalCursoEnFecha,
                totalBruto: main.totalBrutoEnFecha,
                descuentoTotal,
                totalFinal: main.totalFinalEnFecha,
                totalFinalVencido: main.totalFinalVencido,
                total: main.totalFinalEnFecha,

                installments: main.installments,
                numCuotas: main.numCuotas,

                // ✅ NUEVO: totales y cuotas por método (para Cobros dinámico)
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

            // -------------------------------
            // 6) Guardar
            // -------------------------------
            if (editing) {
                updateInscription(editing.id, data);
                showNotification("success", "Inscripción actualizada correctamente");
            } else {
                addInscription(data);
                showNotification("success", "Inscripción creada correctamente");
            }

            closeForm();
        } catch (err) {
            console.error("❌ ERROR:", err);
            showNotification("error", err.message);
        }
    };


    const handleDelete = ins => {
        if (window.confirm(`¿Eliminar inscripción de ${ins.studentName}?`)) {
            removeInscription(ins.id);
            showNotification('success', 'Inscripción eliminada');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50 text-black p-4 sm:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-4 sm:p-6 rounded-2xl mb-6 shadow-lg">
                <h1 className="text-2xl sm:text-3xl font-bold">📚 Gestión de Inscripciones</h1>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">Administra las inscripciones académicas</p>
            </div>

            {/* Barra de búsqueda */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                    type="text"
                    placeholder="🔍 Buscar inscripción..."
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none shadow-sm"
                />
                <button
                    onClick={()=>openForm(null)}
                    className="bg-gradient-to-r from-red-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-blue-700 transition-all font-bold shadow-lg"
                >
                    + Nueva Inscripción
                </button>
            </div>

            {/* TABLA */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-red-100 to-blue-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Alumno</th>
                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Curso</th>
                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Profesor</th>
                            <th className="px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Bonif.</th>
                            <th className="px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Beca</th>
                            <th className="px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Certif.</th>
                            <th className="px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Cuotas</th>
                            <th className="px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 border-b-2 border-gray-300">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((ins,i)=>(
                            <tr key={ins.id || i} className="hover:bg-red-50 transition-colors border-b border-gray-200">
                                <td className="px-4 py-3 text-xs sm:text-sm">{ins.studentName}</td>
                                <td className="px-4 py-3 text-xs sm:text-sm">{ins.courseName}</td>
                                <td className="px-4 py-3 text-xs sm:text-sm">{ins.professorName}</td>

                                {/* Bonificación */}
                                <td className="px-4 py-3 text-center">
                                    {ins.hasBonus ? (
                                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                            ${formatNumber(ins.bonusAmount)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>

                                {/* Beca */}
                                <td className="px-4 py-3 text-center">
                                    {ins.hasBeca ? (
                                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>

                                {/* Certificados */}
                                <td className="px-4 py-3 text-center">
                                    {(ins.certificados?.length || 0) > 0 ? (
                                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                            {ins.certificados.length}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>

                                {/* Cuotas */}
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                        {ins.numCuotas || ins.installments?.length || 1}
                                    </span>
                                </td>

                                {/* Acciones */}
                                <td className="px-4 py-3">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={()=>setViewing(ins)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Ver detalles"
                                        >
                                            <FiEye className="w-4 h-4 sm:w-5 sm:h-5"/>
                                        </button>
                                        <button
                                            onClick={()=>openForm(ins)}
                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <FiEdit className="w-4 h-4 sm:w-5 sm:h-5"/>
                                        </button>
                                        <button
                                            onClick={()=>handleDelete(ins)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-semibold mb-2">No hay inscripciones registradas</p>
                            <p className="text-sm">Crea una nueva inscripción para comenzar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Ver Detalles */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeForm}
                    >
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative text-black shadow-2xl"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 sticky top-0 z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold">Detalles de Inscripción</h2>
                                        <p className="text-blue-100 text-sm mt-1">{viewing.studentName}</p>
                                    </div>
                                    <button
                                        onClick={closeForm}
                                        className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    >
                                        <FiX className="w-6 h-6"/>
                                    </button>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-6 space-y-6">
                                {/* Info Principal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">Alumno:</span>
                                        <p className="text-lg font-bold text-gray-900">{viewing.studentName}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">Curso:</span>
                                        <p className="text-lg font-bold text-gray-900">{viewing.courseName}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">Profesor:</span>
                                        <p className="text-lg font-bold text-gray-900">{viewing.professorName}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">Total Final:</span>
                                        <p className="text-lg font-bold text-green-700">${formatNumber(viewing.totalFinal || 0)}</p>
                                    </div>
                                </div>

                                {/* Cuotas */}
                                {viewing.installments && viewing.installments.length > 0 && (
                                    <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                                        <h3 className="text-lg font-bold text-red-800 mb-3">
                                            Cuotas ({viewing.installments.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {viewing.installments.map((cuota, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-red-300 flex justify-between items-center">
                                                    <div>
                                                        <span className="font-semibold text-gray-900">Cuota #{cuota.number}</span>
                                                        <span className="text-sm text-gray-600 ml-3">
                                                            Vence: {formatDate(cuota.dueDate)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">${formatNumber(cuota.amount)}</p>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                            cuota.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                                                                cuota.status === 'Parcial' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}>
                                                            {cuota.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Beneficios */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {viewing.hasBeca && (
                                        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                                            <h4 className="font-bold text-blue-800 mb-2">Beca Aplicada</h4>
                                            <p className="text-sm text-blue-700">
                                                {viewing.becaInfo?.tipo || 'Beca'} - ${formatNumber(viewing.becaMonto || 0)}
                                            </p>
                                        </div>
                                    )}
                                    {viewing.hasBonus && (
                                        <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                                            <h4 className="font-bold text-yellow-800 mb-2">Bonificación</h4>
                                            <p className="text-sm text-yellow-700">
                                                ${formatNumber(viewing.bonusAmount || 0)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Certificados */}
                                {viewing.certificados && viewing.certificados.length > 0 && (
                                    <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                                        <h3 className="text-lg font-bold text-purple-800 mb-3">Certificados</h3>
                                        <div className="space-y-2">
                                            {viewing.certificados.map((cert, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-purple-300 flex justify-between">
                                                    <span className="font-semibold text-gray-900">{cert.tipo}</span>
                                                    <span className="text-purple-700 font-bold">${formatNumber(cert.costo)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Observaciones */}
                                {viewing.observaciones && (
                                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">Observaciones</h3>
                                        <p className="text-gray-700">{viewing.observaciones}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
                            <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 flex justify-between items-center sticky top-0 z-10">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {editing ? 'Editar Inscripción' : 'Nueva Inscripción'}
                                    </h2>
                                    <p className="text-blue-100 text-sm">Completa la información del curso</p>
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
                                    {/* Información Principal */}
                                    <div className="bg-gradient-to-r from-red-50 to-blue-50 p-6 rounded-xl border-2 border-red-200">
                                        <h3 className="text-lg font-bold text-red-800 mb-4">Datos Principales</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-semibold mb-2 text-gray-700 block">Alumno *</label>
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
                                                <label className="text-sm font-semibold mb-2 text-gray-700 block">Curso *</label>
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
                                                <label className="text-sm font-semibold mb-2 text-gray-700 block">Profesor *</label>
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
                                    </div>

                                    {/* 💰 Información de Costos del Curso */}
                                    {selectedCourse && (
                                        <div className="bg-gradient-to-r from-red-50 to-blue-50 p-6 rounded-xl border-2 border-blue-200">
                                            <h3 className="text-lg font-bold text-blue-800 mb-4">💰 Información de Costos</h3>

                                            {/* Método de Pago Referencial */}
                                            <div className="mb-6 bg-white p-4 rounded-lg border-2 border-green-200">
                                                <h4 className="font-bold text-green-800 mb-3 text-sm">Método de pago preferido (referencial)</h4>
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            id="paymentEfectivo"
                                                            name="paymentType"
                                                            value="Efectivo"
                                                            checked={form.paymentType === 'Efectivo'}
                                                            onChange={handleChange}
                                                            className="w-4 h-4 text-green-600"
                                                        />
                                                        <label htmlFor="paymentEfectivo" className="text-sm font-medium text-gray-700 cursor-pointer">
                                                            Efectivo
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            id="paymentTransferencia"
                                                            name="paymentType"
                                                            value="Transferencia"
                                                            checked={form.paymentType === 'Transferencia'}
                                                            onChange={handleChange}
                                                            className="w-4 h-4 text-green-600"
                                                        />
                                                        <label htmlFor="paymentTransferencia" className="text-sm font-medium text-gray-700 cursor-pointer">
                                                            Transferencia
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            id="paymentTarjeta"
                                                            name="paymentType"
                                                            value="Tarjeta"
                                                            checked={form.paymentType === 'Tarjeta'}
                                                            onChange={handleChange}
                                                            className="w-4 h-4 text-green-600"
                                                        />
                                                        <label htmlFor="paymentTarjeta" className="text-sm font-medium text-gray-700 cursor-pointer">
                                                            Tarjeta
                                                        </label>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Esta selección es referencial. El alumno puede pagar con cualquier método.</p>
                                            </div>

                                            {/* Opción de Pago Completo */}
                                            <div className="mb-6 bg-white p-4 rounded-lg border-2 border-yellow-200">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="fullPayment"
                                                        name="fullPayment"
                                                        checked={form.fullPayment}
                                                        onChange={handleChange}
                                                        className="w-5 h-5 text-yellow-600"
                                                    />
                                                    <label htmlFor="fullPayment" className="font-bold text-yellow-800 cursor-pointer">
                                                        Abonar curso completo (Pago único)
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {form.fullPayment
                                                        ? "Se generará un único pago por el total del curso. No se crearán cuotas."
                                                        : "Se generarán cuotas mensuales según el método seleccionado."}
                                                </p>
                                            </div>

                                            {/* Tarjetas de Costos Detallados */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Efectivo */}
                                                <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-bold text-green-800 text-lg">Efectivo</h4>
                                                        {form.paymentType === 'Efectivo' && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Seleccionado
                        </span>
                                                        )}
                                                    </div>

                                                    {/* Total del Curso */}
                                                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                                        <p className="text-sm text-gray-600 mb-1">Total del Curso</p>
                                                        <p className="text-2xl font-bold text-green-700">
                                                            ${formatNumber(selectedCourse.totalEfectivo || 0)}
                                                        </p>
                                                    </div>

                                                    {/* Información por Cuota */}
                                                    {!form.fullPayment && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center border-b pb-2">
                                                                <span className="text-sm text-gray-600">Cuotas:</span>
                                                                <span className="font-bold text-gray-800">
                                {selectedCourse.cuotasEnabled ? (selectedCourse.cuotasCompartidas || 1) : 1}
                            </span>
                                                            </div>

                                                            <div className="p-2 bg-green-50 rounded border border-green-100">
                                                                <p className="text-xs text-gray-500 mb-1">Valor por cuota:</p>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-sm text-gray-700">En fecha:</p>
                                                                        <p className="text-sm font-bold text-green-700">
                                                                            ${formatNumber(selectedCourse.pagoFechaEfectivo || Math.round((selectedCourse.totalEfectivo || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-700">Vencida:</p>
                                                                        <p className="text-sm font-bold text-red-600">
                                                                            ${formatNumber(selectedCourse.pagoVencidoEfectivo || Math.round((selectedCourse.totalEfectivo || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {form.fullPayment && (
                                                        <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                                                            <p className="text-xs text-yellow-700 font-semibold">
                                                                📌 Pago único: ${formatNumber(selectedCourse.totalEfectivo || 0)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Transferencia */}
                                                <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-bold text-blue-800 text-lg">Transferencia</h4>
                                                        {form.paymentType === 'Transferencia' && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            Seleccionado
                        </span>
                                                        )}
                                                    </div>

                                                    {/* Total del Curso */}
                                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                        <p className="text-sm text-gray-600 mb-1">Total del Curso</p>
                                                        <p className="text-2xl font-bold text-blue-700">
                                                            ${formatNumber(selectedCourse.totalTransferencia || 0)}
                                                        </p>
                                                    </div>

                                                    {/* Información por Cuota */}
                                                    {!form.fullPayment && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center border-b pb-2">
                                                                <span className="text-sm text-gray-600">Cuotas:</span>
                                                                <span className="font-bold text-gray-800">
                                {selectedCourse.cuotasEnabled ? (selectedCourse.cuotasCompartidas || 1) : 1}
                            </span>
                                                            </div>

                                                            <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                                                <p className="text-xs text-gray-500 mb-1">Valor por cuota:</p>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-sm text-gray-700">En fecha:</p>
                                                                        <p className="text-sm font-bold text-blue-700">
                                                                            ${formatNumber(selectedCourse.pagoFechaTransferencia || Math.round((selectedCourse.totalTransferencia || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-700">Vencida:</p>
                                                                        <p className="text-sm font-bold text-red-600">
                                                                            ${formatNumber(selectedCourse.pagoVencidoTransferencia || Math.round((selectedCourse.totalTransferencia || 0) / (selectedCourse.cuotasCompartidas || 1)))}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {form.fullPayment && (
                                                        <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                                                            <p className="text-xs text-yellow-700 font-semibold">
                                                                📌 Pago único: ${formatNumber(selectedCourse.totalTransferencia || 0)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tarjeta */}
                                                <div className="bg-white p-4 rounded-lg border-2 border-purple-300 shadow-sm">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-bold text-purple-800 text-lg">Tarjeta</h4>
                                                        {form.paymentType === 'Tarjeta' && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                            Seleccionado
                        </span>
                                                        )}
                                                    </div>

                                                    {/* Total del Curso */}
                                                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                        <p className="text-sm text-gray-600 mb-1">Total del Curso</p>
                                                        <p className="text-2xl font-bold text-purple-700">
                                                            ${formatNumber(selectedCourse.totalTarjeta || 0)}
                                                        </p>
                                                    </div>

                                                    {/* Información por Cuota */}
                                                    {!form.fullPayment && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center border-b pb-2">
                                                                <span className="text-sm text-gray-600">Cuotas:</span>
                                                                <span className="font-bold text-gray-800">1</span>
                                                            </div>

                                                            <div className="p-2 bg-purple-50 rounded border border-purple-100">
                                                                <p className="text-xs text-gray-500 mb-1">Valor por cuota:</p>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-sm text-gray-700">En fecha:</p>
                                                                        <p className="text-sm font-bold text-purple-700">
                                                                            ${formatNumber(selectedCourse.pagoFechaTarjeta || selectedCourse.totalTarjeta || 0)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-700">Vencida:</p>
                                                                        <p className="text-sm font-bold text-red-600">
                                                                            ${formatNumber(selectedCourse.pagoVencidoTarjeta || selectedCourse.totalTarjeta || 0)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {form.fullPayment && (
                                                        <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                                                            <p className="text-xs text-yellow-700 font-semibold">
                                                                📌 Pago único: ${formatNumber(selectedCourse.totalTarjeta || 0)}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-purple-600 mt-2 font-semibold">
                                                        ⚠️ Tarjeta: Pago único (sin cuotas)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Resumen */}
                                            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <p className="text-sm font-semibold text-gray-800 mb-2">Resumen de configuración:</p>
                                                <div className="flex flex-wrap gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${form.paymentType === 'Efectivo' ? 'bg-green-500' : form.paymentType === 'Transferencia' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                                        <span className="text-sm text-gray-700">
                        Método: <span className="font-bold">{form.paymentType}</span>
                    </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${form.fullPayment ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                                                        <span className="text-sm text-gray-700">
                        Modalidad: <span className="font-bold">{form.fullPayment ? 'Pago completo' : 'En cuotas'}</span>
                    </span>
                                                    </div>
                                                    {!form.fullPayment && (
                                                        <div className="flex items-center gap-2">
                                                            <FiCalendar className="w-4 h-4 text-gray-500" />
                                                            <span className="text-sm text-gray-700">
                            Cuotas: <span className="font-bold">
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
                                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <p className="text-sm text-yellow-800">
                                                        <span className="font-bold">Vacantes disponibles:</span> {selectedCourse.vacantes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Certificados */}
                                    {form.certificados.length > 0 && (
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                                            <h3 className="text-lg font-bold text-purple-800 mb-4">Certificados</h3>
                                            <div className="space-y-3">
                                                {form.certificados.map((cert, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-300">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={cert.selected}
                                                                onChange={(e) => handleCertificadoChange(idx, e.target.checked)}
                                                                className="w-5 h-5 text-purple-600"
                                                            />
                                                            <span className="font-semibold text-gray-900">{cert.tipo}</span>
                                                        </div>
                                                        <span className="text-purple-700 font-bold">${formatNumber(cert.costo)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bonificaciones */}
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-200">
                                        <h3 className="text-lg font-bold text-yellow-800 mb-4">Bonificaciones</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="hasBonus"
                                                    name="hasBonus"
                                                    checked={form.hasBonus}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-yellow-600"
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
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                                        <h3 className="text-lg font-bold text-blue-800 mb-4">Becas</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="hasBeca"
                                                    name="hasBeca"
                                                    checked={form.hasBeca}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-blue-600"
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
                                                    getLabel={b => `${b.tipo} - Descuento: ${formatNumber(b.monto)}`}
                                                    getValue={b => b.id.toString()}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Facturación */}
                                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200">
                                        <h3 className="text-lg font-bold text-pink-800 mb-4">Facturación</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="hasFactura"
                                                    name="hasFactura"
                                                    checked={form.hasFactura}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-pink-600"
                                                />
                                                <label htmlFor="hasFactura" className="font-semibold text-pink-900 cursor-pointer">
                                                    Emitir Factura
                                                </label>
                                            </div>
                                            {form.hasFactura && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            id="facturaA"
                                                            name="tipoFactura"
                                                            value="Factura A"
                                                            checked={form.tipoFactura === 'Factura A'}
                                                            onChange={handleChange}
                                                            className="w-4 h-4 text-pink-600"
                                                        />
                                                        <label htmlFor="facturaA" className="font-semibold text-pink-900 cursor-pointer">
                                                            Factura A
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            id="facturaC"
                                                            name="tipoFactura"
                                                            value="Factura C"
                                                            checked={form.tipoFactura === 'Factura C'}
                                                            onChange={handleChange}
                                                            className="w-4 h-4 text-pink-600"
                                                        />
                                                        <label htmlFor="facturaC" className="font-semibold text-pink-900 cursor-pointer">
                                                            Factura C
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border-2 border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">Información Adicional</h3>
                                        <div>
                                            <label className="text-sm font-semibold mb-2 text-gray-700 block">Observaciones</label>
                                            <textarea
                                                name="observaciones"
                                                value={form.observaciones}
                                                onChange={handleChange}
                                                rows={4}
                                                placeholder="Observaciones adicionales..."
                                                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-black focus:border-red-500 focus:outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 flex justify-end gap-3 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-xl hover:from-red-700 hover:to-blue-700 transition-colors font-bold shadow-lg"
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