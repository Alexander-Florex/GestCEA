// src/pages/Alumnos.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiUserPlus, FiClock, FiSearch, FiChevronDown } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

// Componente SearchableSelect
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
                className="border-2 border-gray-300 rounded-lg p-3 bg-white cursor-pointer flex justify-between items-center focus-within:border-green-500 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-black">
                    {selectedOption ? toSafeLabel(selectedOption) : (placeholder || 'Seleccionar...')}
                </span>
                <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-lg mt-1 z-20 max-h-60 overflow-y-auto shadow-lg">
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
                            className="p-3 hover:bg-green-100 cursor-pointer text-black border-b border-gray-100 last:border-b-0"
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

// Función para formatear números con puntos como separadores de miles (SIN decimales)
function formatNumber(num) {
    const number = Number(num) || 0;
    return Math.round(number).toLocaleString('es-ES');
}

// Componente de notificaciones animadas
function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50">
            <AnimatePresence>
                {notifications.map(({ id, type, message }) => (
                    <motion.div
                        key={id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                        className={`px-4 py-2 rounded shadow ${
                            type === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                        onClick={() => remove(id)}
                    >
                        {message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default function Alumnos() {
    const { students, addStudent, updateStudent, removeStudent, courses, professors, findCourse, findProfessor, addInscription, inscriptions, becas, cajaMovimientos } = useDB();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isInscriptionOpen, setIsInscriptionOpen] = useState(false);
    const [isHistorialOpen, setIsHistorialOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [inscriptionData, setInscriptionData] = useState({});
    const [notifications, setNotifications] = useState([]);

    // Mostrar notificación
    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications((n) => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };
    const removeNotification = (id) => {
        setNotifications((n) => n.filter((x) => x.id !== id));
    };

    // Filtrar alumnos
    const filtered = useMemo(
        () =>
            students.filter((a) =>
                [a.nombre, a.apellido, a.dni].some((f) =>
                    f?.toLowerCase().includes(search.toLowerCase())
                )
            ),
        [students, search]
    );

    // Abrir form (nuevo o editar)
    const openForm = (alumno) => {
        if (alumno) {
            setEditing(alumno);
            setFormData({ ...alumno });
        } else {
            setEditing(null);
            setFormData({
                nombre: '',
                apellido: '',
                dni: '',
                telefono: '',
                email: '',
                direccion: '',
                localidad: '',
                estado: 'Activo',
                fechaNacimiento: '',
                padreTutor: '',
                observaciones: '',
                foto: '',
            });
        }
        setIsFormOpen(true);
    };
    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
    };

    // Abrir modal de inscripción
    const openInscription = (alumno) => {
        setViewing(null);
        setInscriptionData({
            studentId: alumno.id,
            courseId: '',
            professorId: '',
            paymentType: 'Efectivo',
            fullPayment: false,
            // campos del curso que se autocompletan
            customInicio: '',
            customFin: '',
            customVacantes: 0,
            // Efectivo
            efectivoPagoEnFecha: 0,
            efectivoPagoVencido: 0,
            efectivoTotal: 0,
            efectivoCuotas: 0,
            // Transferencias
            transferenciasPagoEnFecha: 0,
            transferenciasPagoVencido: 0,
            transferenciasTotal: 0,
            transferenciasCuotas: 0,
            // Tarjetas
            tarjetasPorcentaje: 0,
            tarjetasCursoTotal: 0,
            tarjetasCuotas: 0,
            // certificados múltiples
            selectedCertificados: [],
            // bonificación
            hasBonus: false,
            bonusAmount: 0,
            // becas
            hasBeca: false,
            selectedBecaId: '',
            observaciones: ''
        });
        setIsInscriptionOpen(true);
    };

    const closeInscription = () => {
        setIsInscriptionOpen(false);
        setInscriptionData({});
    };

    // Abrir modal de historial
    const openHistorial = (alumno) => {
        setViewing(null);
        setIsHistorialOpen(true);
    };

    const closeHistorial = () => {
        setIsHistorialOpen(false);
    };

    // Manejo inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((fd) => ({ ...fd, [name]: value }));
    };

    const handleInscriptionChange = (e) => {
        const { name, value, type, checked } = e.target;
        setInscriptionData((fd) => ({
            ...fd,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Autocompletar campos por curso seleccionado - CORREGIDO con nombres reales
    useEffect(() => {
        const c = courses.find(c => c.id === Number(inscriptionData.courseId));
        if (c) {
            setInscriptionData(prev => ({
                ...prev,
                customInicio: c.inicio || '',
                customFin: c.fin || '',
                customVacantes: c.vacantes ?? 0,
                // Efectivo - usando nombres correctos del JSON
                efectivoPagoEnFecha: Number(c.pagoFechaEfectivo ?? 0),
                efectivoPagoVencido: Number(c.pagoVencidoEfectivo ?? 0),
                efectivoTotal: Number(c.totalEfectivo ?? 0),
                efectivoCuotas: Number(c.cuotasEfectivo ?? 1),
                // Transferencias - usando nombres correctos del JSON
                transferenciasPagoEnFecha: Number(c.pagoFechaTransferencia ?? 0),
                transferenciasPagoVencido: Number(c.pagoVencidoTransferencia ?? 0),
                transferenciasTotal: Number(c.totalTransferencia ?? 0),
                transferenciasCuotas: Number(c.cuotasTransferencia ?? 1),
                // Tarjetas - usando nombres correctos del JSON
                tarjetasPorcentaje: Number(c.porcentajeTarjeta ?? 0),
                tarjetasCursoTotal: Number(c.totalTarjeta ?? 0),
                tarjetasCuotas: Number(c.cuotas ?? 1),
                // Certificados - resetear selección
                selectedCertificados: []
            }));
        }
    }, [inscriptionData.courseId, courses]);

    // Crear / editar
    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (!formData.nombre || !formData.apellido || !formData.dni) {
                throw new Error('Nombre, Apellido y DNI son obligatorios');
            }
            if (editing) {
                updateStudent(editing.id, { ...formData });
                showNotification('success', 'Alumno editado correctamente');
            } else {
                addStudent({ ...formData });
                showNotification('success', 'Alumno creado correctamente');
            }
            closeForm();
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    // Calcular total final con nueva estructura de datos Y becas
    const calcTotalFinal = () => {
        let baseTotal = 0;

        // Calcular total base según forma de pago
        switch (inscriptionData.paymentType) {
            case 'Efectivo':
                baseTotal = Number(inscriptionData.efectivoTotal) || 0;
                break;
            case 'Transferencia':
                baseTotal = Number(inscriptionData.transferenciasTotal) || 0;
                break;
            case 'Tarjeta':
                baseTotal = Number(inscriptionData.tarjetasCursoTotal) || 0;
                break;
            default:
                baseTotal = 0;
        }

        // Calcular costo total de certificados seleccionados
        const c = courses.find(c => c.id === Number(inscriptionData.courseId));
        let costoCertificados = 0;
        if (c && inscriptionData.selectedCertificados) {
            inscriptionData.selectedCertificados.forEach(certTipo => {
                costoCertificados += Number(c.costosCertificado?.[certTipo] || 0);
            });
        }

        // Aplicar bonificación
        const bonificacion = inscriptionData.hasBonus ? Number(inscriptionData.bonusAmount) || 0 : 0;

        // Aplicar descuento por beca
        let descuentoBeca = 0;
        if (inscriptionData.hasBeca && inscriptionData.selectedBecaId) {
            const selectedBeca = becas.find(b => b.id === Number(inscriptionData.selectedBecaId) && b.activa);
            if (selectedBeca) {
                // Aplicar el descuento de la beca sobre el total del curso (no sobre certificados)
                descuentoBeca = Number(selectedBeca.monto) || 0;
            }
        }

        const total = baseTotal + costoCertificados - bonificacion - descuentoBeca;
        return Math.max(0, total);
    };

    // Obtener número de cuotas según forma de pago
    const getCuotasForPaymentType = () => {
        switch (inscriptionData.paymentType) {
            case 'Efectivo':
                return Number(inscriptionData.efectivoCuotas) || 1;
            case 'Transferencia':
                return Number(inscriptionData.transferenciasCuotas) || 1;
            case 'Tarjeta':
                return Number(inscriptionData.tarjetasCuotas) || 1;
            default:
                return 1;
        }
    };

    // Obtener pago por cuota según forma de pago
    const getPagoEnFecha = () => {
        switch (inscriptionData.paymentType) {
            case 'Efectivo':
                return Number(inscriptionData.efectivoPagoEnFecha) || 0;
            case 'Transferencia':
                return Number(inscriptionData.transferenciasPagoEnFecha) || 0;
            case 'Tarjeta':
                // Para tarjetas, calculamos basado en el total y cuotas
                const totalTarjeta = Number(inscriptionData.tarjetasCursoTotal) || 0;
                const cuotasTarjeta = Number(inscriptionData.tarjetasCuotas) || 1;
                return totalTarjeta / cuotasTarjeta;
            default:
                return 0;
        }
    };

    // Manejar inscripción con nueva estructura
    const handleInscriptionSubmit = (e) => {
        e.preventDefault();
        try {
            if (!inscriptionData.courseId || !inscriptionData.professorId) {
                throw new Error('Debe seleccionar curso y profesor');
            }

            const student = students.find(s => s.id === Number(inscriptionData.studentId));
            const course = findCourse(inscriptionData.courseId);
            const professor = findProfessor(inscriptionData.professorId);

            if (!course || !student || !professor) {
                throw new Error('Curso, alumno o profesor no encontrado');
            }

            const totalNeto = calcTotalFinal();

            const inscriptionPayload = {
                studentId: student.id,
                courseId: course.id,
                studentName: `${student.nombre} ${student.apellido}`,
                courseName: course.nombre,
                professorId: professor.id,
                professorName: `${professor.nombre} ${professor.apellido}`,
                inicio: inscriptionData.customInicio,
                fin: inscriptionData.customFin,
                vacantes: inscriptionData.customVacantes,
                paymentType: inscriptionData.paymentType,
                // Datos de efectivo
                efectivo: {
                    pagoEnFecha: Number(inscriptionData.efectivoPagoEnFecha),
                    pagoVencido: Number(inscriptionData.efectivoPagoVencido),
                    total: Number(inscriptionData.efectivoTotal),
                    cuotas: Number(inscriptionData.efectivoCuotas)
                },
                // Datos de transferencias
                transferencias: {
                    pagoEnFecha: Number(inscriptionData.transferenciasPagoEnFecha),
                    pagoVencido: Number(inscriptionData.transferenciasPagoVencido),
                    total: Number(inscriptionData.transferenciasTotal),
                    cuotas: Number(inscriptionData.transferenciasCuotas)
                },
                // Datos de tarjetas
                tarjetas: {
                    porcentaje: Number(inscriptionData.tarjetasPorcentaje),
                    cursoTotal: Number(inscriptionData.tarjetasCursoTotal),
                    cuotas: Number(inscriptionData.tarjetasCuotas)
                },
                // Certificados múltiples
                certificados: inscriptionData.selectedCertificados || [],
                // Bonificación
                hasBonus: inscriptionData.hasBonus,
                bonusAmount: Number(inscriptionData.bonusAmount || 0),
                // Otros datos
                fullPayment: inscriptionData.fullPayment,
                totalFinal: totalNeto,
                fechaInscripcion: new Date().toISOString(),
                estado: 'Cursando',
                activo: true,
                personal: user?.name || 'Usuario Sistema',
                pago: 'Pendiente',
                observaciones: inscriptionData.observaciones,
                installments: inscriptionData.fullPayment ? [] : [], // Se puede generar después si es necesario
            };

            addInscription(inscriptionPayload);
            showNotification('success', 'Inscripción realizada correctamente');
            closeInscription();
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    // Eliminar alumno
    const handleDelete = (alumno) => {
        if (window.confirm(`¿Seguro que querés eliminar a ${alumno.nombre}?`)) {
            removeStudent(alumno.id);
            showNotification('success', 'Alumno eliminado correctamente');
        }
    };

    // Calcular resumen de inscripción
    const calculateInscriptionSummary = () => {
        if (!inscriptionData.courseId) return null;

        const course = findCourse(inscriptionData.courseId);
        if (!course) return null;

        let costoTotal = course.costo || 0;
        let bonificacion = parseFloat(inscriptionData.bonificacion) || 0;
        let costoCertificados = 0;
        let descuentoBeca = 0;

        // Calcular costo certificados
        inscriptionData.certificados?.forEach(certTipo => {
            costoCertificados += course.costosCertificado?.[certTipo] || 0;
        });

        // Calcular descuento beca
        if (inscriptionData.becaHabilitada) {
            const beca = becas.find(b => b.tipo === inscriptionData.tipoBeca && b.activa);
            if (beca) {
                descuentoBeca = inscriptionData.tipoBeca === 'completa' ? costoTotal : costoTotal * 0.5;
            }
        }

        const montoFinal = costoTotal + costoCertificados - bonificacion - descuentoBeca;

        return {
            costoTotal,
            costoCertificados,
            bonificacion,
            descuentoBeca,
            montoFinal: Math.max(0, montoFinal)
        };
    };

    // Obtener historial del alumno mejorado
    const getStudentHistory = (studentId) => {
        const studentInscriptions = inscriptions.filter(i => i.studentId === studentId);
        const studentMovements = cajaMovimientos.filter(m => m.studentId === studentId);

        // Determinar estado de cada curso
        const coursesWithStatus = studentInscriptions.map(inscription => {
            const course = findCourse(inscription.courseId);
            const today = new Date();
            const startDate = new Date(inscription.inicio || course?.inicio);
            const endDate = new Date(inscription.fin || course?.fin);

            let estado = 'Cursando';
            if (today < startDate) {
                estado = 'Próximamente';
            } else if (today > endDate) {
                estado = 'Finalizado';
            }

            return {
                ...inscription,
                courseName: course?.nombre || 'Curso no encontrado',
                estado,
                startDate,
                endDate
            };
        });

        return {
            inscripciones: studentInscriptions,
            cursos: coursesWithStatus,
            movimientos: studentMovements,
            esDeudor: studentMovements.some(m => m.estado === 'Pendiente' || m.pago === 'Pendiente')
        };
    };

    // Función para navegar a inscripciones filtradas
    const navigateToInscriptions = (studentId) => {
        // Aquí puedes implementar la navegación según tu router
        // Por ejemplo, si usas React Router:
        // navigate(`/inscripciones?studentId=${studentId}`);
        alert(`Navegando a inscripciones filtradas por alumno ID: ${studentId}`);
        closeHistorial();
    };

    const summary = calculateInscriptionSummary();
    const historial = viewing ? getStudentHistory(viewing.id) : null;

    return (
        <div className="p-6 relative">
            <Notifications notifications={notifications} remove={removeNotification} />

            {/* Buscador + Nuevo - Diseño mejorado */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido o DNI..."
                            className="w-full pl-10 pr-4 py-3 text-lg border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white shadow-sm transition-all duration-200 hover:border-purple-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg flex items-center space-x-2"
                        onClick={() => openForm(null)}
                    >
                        <FiUserPlus className="w-5 h-5" />
                        <span>Nuevo Alumno</span>
                    </button>
                </div>
            </div>

            {/* Tabla - Diseño mejorado */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                        <tr>
                            {[
                                'ID',
                                'Nombre',
                                'Apellido',
                                'DNI',
                                'Teléfono',
                                'Email',
                                'Dirección',
                                'Localidad',
                                'Estado',
                                'Acciones',
                            ].map((h) => (
                                <th key={h} className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((alumno, index) => (
                            <motion.tr
                                key={alumno.id}
                                className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{alumno.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{alumno.nombre}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{alumno.apellido}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{alumno.dni}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{alumno.telefono}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-32 truncate" title={alumno.email}>
                                        {alumno.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-32 truncate" title={alumno.direccion}>
                                        {alumno.direccion}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{alumno.localidad}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        alumno.estado === 'Activo'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {alumno.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <div className="flex space-x-3">
                                        <motion.button
                                            onClick={() => setViewing(alumno)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-100 transition-all"
                                        >
                                            <FiEye size={18} />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => openForm(alumno)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-all"
                                        >
                                            <FiEdit size={18} />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => handleDelete(alumno)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-all"
                                        >
                                            <FiTrash2 size={18} />
                                        </motion.button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="10" className="text-center py-12 text-gray-500 text-lg">
                                    <div className="flex flex-col items-center space-y-2">
                                        <FiSearch className="w-12 h-12 text-gray-300" />
                                        <span>No hay resultados para tu búsqueda</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Ver Detalles - Con nuevos botones */}
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
                            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border-2 border-blue-400 text-black"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                                <button className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 shadow hover:bg-gray-200 transition-colors" onClick={() => setViewing(null)}>
                                    <FiX className="w-5 h-5"/>
                                </button>
                                <h2 className="text-2xl font-bold text-gray-800">Detalles del Alumno</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Información principal en layout horizontal */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Foto y datos básicos */}
                                    <div className="space-y-4">
                                        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mx-auto lg:mx-0 shadow-md">
                                            {viewing.foto ? (
                                                <img src={viewing.foto} alt="Foto del alumno" className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center lg:text-left">
                                            <h3 className="text-xl font-semibold text-gray-800">{viewing.nombre} {viewing.apellido}</h3>
                                            <p className="text-gray-600">Estudiante</p>
                                        </div>
                                    </div>

                                    {/* Datos personales */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Datos Personales</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">DNI:</span>
                                                <span>{viewing.dni}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Fecha de Nacimiento:</span>
                                                <span>{viewing.fechaNacimiento || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Teléfono:</span>
                                                <span>{viewing.telefono}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Email:</span>
                                                <span className="break-all text-sm">{viewing.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Estado:</span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${viewing.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {viewing.estado}
                            </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos de ubicación */}
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2">Ubicación</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Dirección:</span>
                                                <span className="text-right">{viewing.direccion}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Localidad:</span>
                                                <span>{viewing.localidad}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Fecha de alta:</span>
                                                <span>{new Date().toISOString().split('T')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Información adicional en layout horizontal */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Datos de Padres/Tutores/Empresa</h4>
                                        <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[120px]">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {viewing.padreTutor || 'No se han registrado datos de padres, tutores o empresa'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Observaciones</h4>
                                        <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[120px]">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {viewing.observaciones || 'Sin observaciones'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones - Nuevos botones */}
                                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                                        onClick={() => openInscription(viewing)}
                                    >
                                        <FiUserPlus className="w-4 h-4"/>
                                        <span>Inscribir a Curso</span>
                                    </button>
                                    <button
                                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                                        onClick={() => openHistorial(viewing)}
                                    >
                                        <FiClock className="w-4 h-4"/>
                                        <span>Ver Historial</span>
                                    </button>
                                    <button
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        onClick={()=>{setViewing(null); openForm(viewing);}}
                                    >
                                        <FiEdit className="w-4 h-4"/>
                                        <span>Editar Alumno</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Inscribir a Curso */}
            <AnimatePresence>
                {isInscriptionOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeInscription}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden relative text-black"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-green-600 text-white p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Inscribir Alumno a Curso</h2>
                                    <p className="text-green-100">Complete los datos requeridos para la inscripción</p>
                                </div>
                                <button
                                    type="button"
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={closeInscription}
                                >
                                    <FiX className="w-6 h-6"/>
                                </button>
                            </div>

                            {/* Contenido con scroll */}
                            <form onSubmit={handleInscriptionSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-6 space-y-6">

                                    {/* Información Principal */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Alumno (solo lectura) */}
                                        <div>
                                            <label className="text-sm font-semibold mb-2 text-green-700 block">Alumno:</label>
                                            <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-100 text-black">
                                                {(() => {
                                                    const student = students.find(s => s.id === inscriptionData.studentId);
                                                    return student ? `${student.nombre} ${student.apellido} (DNI: ${student.dni})` : 'Alumno seleccionado';
                                                })()}
                                            </div>
                                        </div>

                                        {/* Curso */}
                                        <div>
                                            <label className="text-sm font-semibold mb-2 text-green-700 block">Curso *:</label>
                                            <SearchableSelect
                                                options={courses}
                                                value={inscriptionData.courseId}
                                                onChange={(v) => setInscriptionData(prev => ({ ...prev, courseId: v }))}
                                                placeholder="Selecciona un curso..."
                                                getLabel={c => c.nombre}
                                                getValue={c => c.id.toString()}
                                            />
                                        </div>

                                        {/* Profesor */}
                                        <div>
                                            <label className="text-sm font-semibold mb-2 text-green-700 block">Profesor *:</label>
                                            <SearchableSelect
                                                options={(() => {
                                                    const selectedCourse = courses.find(c => c.id === Number(inscriptionData.courseId));
                                                    return professors.filter(p => selectedCourse?.profesores?.includes(p.id));
                                                })()}
                                                value={inscriptionData.professorId}
                                                onChange={(v) => setInscriptionData(prev => ({ ...prev, professorId: v }))}
                                                placeholder="Selecciona un profesor..."
                                                getLabel={p => `${p.nombre} ${p.apellido}`}
                                                getValue={p => p.id.toString()}
                                            />
                                        </div>

                                        {/* Fechas (solo lectura) */}
                                        <div>
                                            <label className="text-sm font-semibold mb-2 text-gray-500 block">Fecha Inicio:</label>
                                            <input
                                                type="date"
                                                value={inscriptionData.customInicio}
                                                disabled
                                                className="w-full border-2 border-gray-300 rounded-lg p-3 text-black bg-gray-100 cursor-not-allowed"
                                            />
                                            <small className="text-gray-500 mt-1">Se toma del curso</small>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold mb-2 text-gray-500 block">Fecha Fin:</label>
                                            <input
                                                type="date"
                                                value={inscriptionData.customFin}
                                                disabled
                                                className="w-full border-2 border-gray-300 rounded-lg p-3 text-black bg-gray-100 cursor-not-allowed"
                                            />
                                            <small className="text-gray-500 mt-1">Se toma del curso</small>
                                        </div>

                                        {/* Vacantes (solo lectura) */}
                                        <div>
                                            <label className="text-sm font-semibold mb-2 text-green-700 block">Vacantes:</label>
                                            <input
                                                type="number"
                                                value={inscriptionData.customVacantes}
                                                disabled
                                                className="w-full border-2 border-gray-300 rounded-lg p-3 text-black bg-gray-100 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Forma de Pago Detallada */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-green-600 rounded mr-3"></div>
                                            Forma de Pago
                                        </h3>

                                        {/* Selector de tipo de pago */}
                                        <div className="mb-6">
                                            <label className="text-sm font-semibold mb-2 text-green-700 block">Tipo de Pago *:</label>
                                            <select
                                                name="paymentType"
                                                value={inscriptionData.paymentType}
                                                onChange={handleInscriptionChange}
                                                className="w-full border-2 border-green-300 rounded-lg p-3 text-black focus:border-green-500 focus:outline-none"
                                            >
                                                <option value="Efectivo">Efectivo</option>
                                                <option value="Transferencia">Transferencia</option>
                                                <option value="Tarjeta">Tarjeta</option>
                                            </select>
                                        </div>

                                        {/* Campos específicos por tipo de pago */}
                                        {inscriptionData.paymentType === 'Efectivo' && (
                                            <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-4">
                                                <h4 className="text-lg font-semibold text-green-800 mb-4">Datos de Efectivo</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-green-700 block">Pago en Fecha (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="efectivoPagoEnFecha"
                                                            value={inscriptionData.efectivoPagoEnFecha}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-green-300 rounded-lg p-3 text-black focus:border-green-500 focus:outline-none"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-green-700 block">Pago Vencido (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="efectivoPagoVencido"
                                                            value={inscriptionData.efectivoPagoVencido}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-green-300 rounded-lg p-3 text-black focus:border-green-500 focus:outline-none"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-green-700 block">Total del Curso:</label>
                                                        <input
                                                            type="number"
                                                            name="efectivoTotal"
                                                            value={inscriptionData.efectivoTotal}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-green-300 rounded-lg p-3 text-black focus:border-green-500 focus:outline-none"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-green-700 block">Número de Cuotas:</label>
                                                        <input
                                                            type="number"
                                                            name="efectivoCuotas"
                                                            value={inscriptionData.efectivoCuotas}
                                                            onChange={handleInscriptionChange}
                                                            disabled={inscriptionData.fullPayment}
                                                            className={`w-full border-2 rounded-lg p-3 text-black ${
                                                                inscriptionData.fullPayment
                                                                    ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                                                                    : 'border-green-300 focus:border-green-500 focus:outline-none'
                                                            }`}
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {inscriptionData.paymentType === 'Transferencia' && (
                                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-4">
                                                <h4 className="text-lg font-semibold text-blue-800 mb-4">Datos de Transferencias</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-blue-700 block">Pago en Fecha (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="transferenciasPagoEnFecha"
                                                            value={inscriptionData.transferenciasPagoEnFecha}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-blue-300 rounded-lg p-3 text-black focus:border-blue-500 focus:outline-none"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-blue-700 block">Pago Vencido (Por Cuota):</label>
                                                        <input
                                                            type="number"
                                                            name="transferenciasPagoVencido"
                                                            value={inscriptionData.transferenciasPagoVencido}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-blue-300 rounded-lg p-3 text-black focus:border-blue-500 focus:outline-none"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-blue-700 block">Total del Curso:</label>
                                                        <input
                                                            type="number"
                                                            name="transferenciasTotal"
                                                            value={inscriptionData.transferenciasTotal}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-blue-300 rounded-lg p-3 text-black focus:border-blue-500 focus:outline-none"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-blue-700 block">Número de Cuotas:</label>
                                                        <input
                                                            type="number"
                                                            name="transferenciasCuotas"
                                                            value={inscriptionData.transferenciasCuotas}
                                                            onChange={handleInscriptionChange}
                                                            disabled={inscriptionData.fullPayment}
                                                            className={`w-full border-2 rounded-lg p-3 text-black ${
                                                                inscriptionData.fullPayment
                                                                    ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                                                                    : 'border-blue-300 focus:border-blue-500 focus:outline-none'
                                                            }`}
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {inscriptionData.paymentType === 'Tarjeta' && (
                                            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-4">
                                                <h4 className="text-lg font-semibold text-purple-800 mb-4">Datos de Tarjetas</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-purple-700 block">Porcentaje (%):</label>
                                                        <input
                                                            type="number"
                                                            name="tarjetasPorcentaje"
                                                            value={inscriptionData.tarjetasPorcentaje}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-purple-300 rounded-lg p-3 text-black focus:border-purple-500 focus:outline-none"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-purple-700 block">Curso Total:</label>
                                                        <input
                                                            type="number"
                                                            name="tarjetasCursoTotal"
                                                            value={inscriptionData.tarjetasCursoTotal}
                                                            onChange={handleInscriptionChange}
                                                            className="w-full border-2 border-purple-300 rounded-lg p-3 text-black focus:border-purple-500 focus:outline-none"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold mb-2 text-purple-700 block">Número de Cuotas:</label>
                                                        <input
                                                            type="number"
                                                            name="tarjetasCuotas"
                                                            value={inscriptionData.tarjetasCuotas}
                                                            onChange={handleInscriptionChange}
                                                            disabled={inscriptionData.fullPayment}
                                                            className={`w-full border-2 rounded-lg p-3 text-black ${
                                                                inscriptionData.fullPayment
                                                                    ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                                                                    : 'border-purple-300 focus:border-purple-500 focus:outline-none'
                                                            }`}
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Certificados Múltiples */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-green-600 rounded mr-3"></div>
                                            Certificados (Múltiples Selecciones)
                                        </h3>
                                        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                                            <p className="text-sm text-orange-700 mb-4">El alumno puede seleccionar múltiples certificados para este curso</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(() => {
                                                    const selectedCourse = courses.find(c => c.id === Number(inscriptionData.courseId));
                                                    const certificateTypes = selectedCourse?.tiposCertificado || [];
                                                    return certificateTypes.length > 0 ? certificateTypes.map(tipo => (
                                                        <div key={tipo} className="flex items-center space-x-3 p-4 bg-white border-2 border-orange-200 rounded-lg hover:border-orange-300 transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                id={`cert-${tipo}`}
                                                                checked={inscriptionData.selectedCertificados?.includes(tipo) || false}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setInscriptionData(prev => ({
                                                                        ...prev,
                                                                        selectedCertificados: checked
                                                                            ? [...(prev.selectedCertificados || []), tipo]
                                                                            : (prev.selectedCertificados || []).filter(c => c !== tipo)
                                                                    }));
                                                                }}
                                                                className="w-5 h-5 text-green-600"
                                                            />
                                                            <label htmlFor={`cert-${tipo}`} className="flex-1 cursor-pointer">
                                                                <div className="font-semibold text-gray-800">{tipo}</div>
                                                                <div className="text-sm text-orange-600 font-medium">
                                                                    ${Number(selectedCourse?.costosCertificado?.[tipo] || 0).toFixed(2)}
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )) : (
                                                        <div className="col-span-2 text-center py-4 text-gray-500">
                                                            No hay certificados disponibles para este curso
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bonificación */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-green-600 rounded mr-3"></div>
                                            Bonificación
                                        </h3>
                                        <div className="flex items-center gap-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <input
                                                type="checkbox"
                                                id="hasBonus"
                                                name="hasBonus"
                                                checked={inscriptionData.hasBonus}
                                                onChange={handleInscriptionChange}
                                                className="w-5 h-5 text-green-600"
                                            />
                                            <label htmlFor="hasBonus" className="font-semibold text-yellow-800">
                                                Bonificación (descuento sobre el total)
                                            </label>
                                            <input
                                                type="number"
                                                name="bonusAmount"
                                                value={inscriptionData.bonusAmount}
                                                onChange={handleInscriptionChange}
                                                disabled={!inscriptionData.hasBonus}
                                                min="0"
                                                className={`border-2 rounded-lg p-2 text-black ${
                                                    inscriptionData.hasBonus
                                                        ? 'border-yellow-400 focus:border-yellow-500'
                                                        : 'bg-gray-100 border-gray-300 cursor-not-allowed'
                                                }`}
                                                placeholder="Monto a descontar"
                                            />
                                        </div>
                                    </div>

                                    {/* Becas */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-green-600 rounded mr-3"></div>
                                            Becas
                                        </h3>
                                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                                            <div className="flex items-center gap-4 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="hasBeca"
                                                    name="hasBeca"
                                                    checked={inscriptionData.hasBeca}
                                                    onChange={handleInscriptionChange}
                                                    className="w-5 h-5 text-green-600"
                                                />
                                                <label htmlFor="hasBeca" className="font-semibold text-blue-800">
                                                    Aplicar Beca
                                                </label>
                                            </div>

                                            {inscriptionData.hasBeca && (
                                                <div>
                                                    <label className="text-sm font-semibold mb-2 text-blue-700 block">Seleccionar Beca Activa:</label>
                                                    <select
                                                        name="selectedBecaId"
                                                        value={inscriptionData.selectedBecaId}
                                                        onChange={handleInscriptionChange}
                                                        className="w-full border-2 border-blue-300 rounded-lg p-3 text-black focus:border-blue-500 focus:outline-none"
                                                    >
                                                        <option value="">Seleccionar beca...</option>
                                                        {becas
                                                            .filter(beca => beca.activa)
                                                            .map(beca => (
                                                                <option key={beca.id} value={beca.id}>
                                                                    {beca.tipo} - ${formatNumber(beca.monto)} de descuento
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                    {inscriptionData.selectedBecaId && (
                                                        <div className="mt-2 p-2 bg-blue-100 rounded text-sm text-blue-700">
                                                            {(() => {
                                                                const selectedBeca = becas.find(b => b.id === Number(inscriptionData.selectedBecaId));
                                                                return selectedBeca ? `Descuento aplicado: ${formatNumber(selectedBeca.monto)}` : '';
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resumen Final Actualizado */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-green-600 rounded mr-3"></div>
                                            Resumen de Precios
                                        </h3>
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    {/* Total del Curso según forma de pago */}
                                                    {inscriptionData.paymentType === 'Efectivo' && (
                                                        <div className="bg-green-100 p-4 rounded-lg">
                                                            <div className="text-green-800 font-bold text-lg">Total Curso (Efectivo)</div>
                                                            <div className="text-2xl font-bold text-green-900">${formatNumber(inscriptionData.efectivoTotal)}</div>
                                                            {!inscriptionData.fullPayment && inscriptionData.efectivoCuotas > 0 && (
                                                                <div className="text-sm text-green-700 mt-2">
                                                                    <div>Pago en Fecha: ${formatNumber(inscriptionData.efectivoPagoEnFecha)} por cuota</div>
                                                                    <div>Pago Vencido: ${formatNumber(inscriptionData.efectivoPagoVencido)} por cuota</div>
                                                                    <div className="font-semibold">Cuotas: {formatNumber(inscriptionData.efectivoCuotas)}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {inscriptionData.paymentType === 'Transferencia' && (
                                                        <div className="bg-blue-100 p-4 rounded-lg">
                                                            <div className="text-blue-800 font-bold text-lg">Total Curso (Transferencia)</div>
                                                            <div className="text-2xl font-bold text-blue-900">${formatNumber(inscriptionData.transferenciasTotal)}</div>
                                                            {!inscriptionData.fullPayment && inscriptionData.transferenciasCuotas > 0 && (
                                                                <div className="text-sm text-blue-700 mt-2">
                                                                    <div>Pago en Fecha: ${formatNumber(inscriptionData.transferenciasPagoEnFecha)} por cuota</div>
                                                                    <div>Pago Vencido: ${formatNumber(inscriptionData.transferenciasPagoVencido)} por cuota</div>
                                                                    <div className="font-semibold">Cuotas: {formatNumber(inscriptionData.transferenciasCuotas)}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {inscriptionData.paymentType === 'Tarjeta' && (
                                                        <div className="bg-purple-100 p-4 rounded-lg">
                                                            <div className="text-purple-800 font-bold text-lg">Total Curso (Tarjeta)</div>
                                                            <div className="text-2xl font-bold text-purple-900">${formatNumber(inscriptionData.tarjetasCursoTotal)}</div>
                                                            <div className="text-sm text-purple-700 mt-2">
                                                                <div>Porcentaje: {formatNumber(inscriptionData.tarjetasPorcentaje)}%</div>
                                                                {!inscriptionData.fullPayment && inscriptionData.tarjetasCuotas > 0 && (
                                                                    <>
                                                                        <div>Por Cuota: ${formatNumber(Number(inscriptionData.tarjetasCursoTotal) / Math.max(1, Number(inscriptionData.tarjetasCuotas)))}</div>
                                                                        <div className="font-semibold">Cuotas: {formatNumber(inscriptionData.tarjetasCuotas)}</div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Certificados Seleccionados */}
                                                    <div className="bg-orange-100 p-4 rounded-lg">
                                                        <div className="text-orange-800 font-bold text-lg mb-2">Certificados Seleccionados</div>
                                                        {inscriptionData.selectedCertificados && inscriptionData.selectedCertificados.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {inscriptionData.selectedCertificados.map(certTipo => {
                                                                    const selectedCourse = courses.find(c => c.id === Number(inscriptionData.courseId));
                                                                    const costo = Number(selectedCourse?.costosCertificado?.[certTipo] || 0);
                                                                    return (
                                                                        <div key={certTipo} className="flex justify-between text-sm">
                                                                            <span className="font-medium">{certTipo}</span>
                                                                            <span className="text-orange-900 font-bold">${formatNumber(costo)}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                                <div className="border-t border-orange-300 pt-2 mt-2">
                                                                    <div className="flex justify-between font-bold">
                                                                        <span>Total Certificados:</span>
                                                                        <span className="text-orange-900">
                                                                            ${(() => {
                                                                            const selectedCourse = courses.find(c => c.id === Number(inscriptionData.courseId));
                                                                            let total = 0;
                                                                            inscriptionData.selectedCertificados.forEach(certTipo => {
                                                                                total += Number(selectedCourse?.costosCertificado?.[certTipo] || 0);
                                                                            });
                                                                            return formatNumber(total);
                                                                        })()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-orange-700">No hay certificados seleccionados</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Bonificación */}
                                                    {inscriptionData.hasBonus && (
                                                        <div className="bg-yellow-100 p-4 rounded-lg">
                                                            <div className="text-yellow-800 font-bold text-lg">Bonificación</div>
                                                            <div className="text-xl font-bold text-yellow-900">-${Number(inscriptionData.bonusAmount || 0).toFixed(2)}</div>
                                                            <div className="text-sm text-yellow-700 mt-1">Descuento aplicado</div>
                                                        </div>
                                                    )}

                                                    {/* Total Final */}
                                                    <div className="bg-green-100 p-6 rounded-lg border-2 border-green-300">
                                                        <div className="text-green-800 font-bold text-xl mb-2">TOTAL FINAL</div>
                                                        <div className="text-4xl font-bold text-green-900">
                                                            ${calcTotalFinal().toFixed(2)}
                                                        </div>
                                                        <div className="text-sm text-green-700 mt-2">
                                                            Incluye curso + certificados - bonificación
                                                        </div>

                                                        {/* Información de cuotas para el total final */}
                                                        {!inscriptionData.fullPayment && (
                                                            <div className="mt-3 pt-3 border-t border-green-300">
                                                                <div className="text-sm text-green-700">
                                                                    <div className="font-semibold">Plan de Cuotas:</div>
                                                                    <div>Cuotas: {getCuotasForPaymentType()}</div>
                                                                    <div>Valor estimado por cuota: ${(calcTotalFinal() / Math.max(1, getCuotasForPaymentType())).toFixed(2)}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pago Total */}
                                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <input
                                            type="checkbox"
                                            id="fullPayment"
                                            name="fullPayment"
                                            checked={inscriptionData.fullPayment}
                                            onChange={handleInscriptionChange}
                                            className="w-5 h-5 text-green-600"
                                        />
                                        <label htmlFor="fullPayment" className="font-semibold text-blue-800">
                                            Pago Total (sin plan de cuotas)
                                        </label>
                                    </div>

                                    {/* Observaciones */}
                                    <div>
                                        <label className="text-sm font-semibold mb-2 text-green-700 block">Observaciones:</label>
                                        <textarea
                                            name="observaciones"
                                            value={inscriptionData.observaciones || ''}
                                            onChange={handleInscriptionChange}
                                            rows={3}
                                            className="w-full border-2 border-green-300 rounded-lg p-3 text-black focus:border-green-500 focus:outline-none"
                                            placeholder="Observaciones adicionales sobre la inscripción..."
                                        />
                                    </div>
                                </div>

                                {/* Footer con botones */}
                                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-between">
                                    <button
                                        type="button"
                                        onClick={closeInscription}
                                        className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold"
                                    >
                                        Confirmar Inscripción
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Ver Historial */}
            <AnimatePresence>
                {isHistorialOpen && (
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
                                    <h2 className="text-2xl font-bold">Historial del Alumno</h2>
                                    <p className="text-orange-100">Cursos y actividad académica</p>
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
                                {viewing && historial && (
                                    <div className="space-y-6">
                                        {/* Información del Alumno */}
                                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-orange-800">{viewing.nombre} {viewing.apellido}</h3>
                                                    <p className="text-orange-600">DNI: {viewing.dni}</p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        historial.esDeudor
                                                            ? 'bg-red-100 text-red-800 border border-red-200'
                                                            : 'bg-green-100 text-green-800 border border-green-200'
                                                    }`}>
                                                        {historial.esDeudor ? 'DEUDOR' : 'AL DÍA'}
                                                    </span>
                                                    <span className="text-orange-600 text-sm">
                                                        Total inscripciones: {historial.cursos.length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cursos del Alumno */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1 h-6 bg-orange-600 rounded mr-3"></div>
                                                Cursos Inscriptos
                                            </h3>

                                            {historial.cursos.length > 0 ? (
                                                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                                                    <table className="min-w-full">
                                                        <thead className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                                                Nombre del Curso
                                                            </th>
                                                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                                                Estado
                                                            </th>
                                                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                                                Fechas
                                                            </th>
                                                            <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                                                                Acciones
                                                            </th>
                                                        </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                        {historial.cursos.map((curso, index) => (
                                                            <motion.tr
                                                                key={curso.id}
                                                                className={`hover:bg-orange-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.2, delay: index * 0.1 }}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {curso.courseName}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            ID: {curso.courseId}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                                                            curso.estado === 'Próximamente' ? 'bg-blue-100 text-blue-800' :
                                                                                curso.estado === 'Cursando' ? 'bg-green-100 text-green-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                            {curso.estado}
                                                                        </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    <div>
                                                                        <div>Inicio: {new Date(curso.startDate).toLocaleDateString()}</div>
                                                                        <div>Fin: {new Date(curso.endDate).toLocaleDateString()}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <button
                                                                        onClick={() => navigateToInscriptions(viewing.id)}
                                                                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                                                                    >
                                                                        Ver
                                                                    </button>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                    <div className="text-gray-400 mb-2">
                                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-500 mb-1">No hay cursos registrados</h3>
                                                    <p className="text-gray-400">Este alumno aún no se ha inscripto a ningún curso</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Resumen de Pagos */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1 h-6 bg-orange-600 rounded mr-3"></div>
                                                Historial de Pagos
                                            </h3>
                                            {historial.movimientos.length > 0 ? (
                                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                                                    <div className="space-y-3">
                                                        {historial.movimientos.slice(0, 5).map(movimiento => (
                                                            <div key={movimiento.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                                <div>
                                                                    <p className="font-medium text-gray-800">Pago - {movimiento.formaPago}</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {new Date(movimiento.fechaHora).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                    movimiento.pago === 'Completada' ? 'bg-green-100 text-green-800' :
                                                                        movimiento.pago === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {movimiento.pago}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {historial.movimientos.length > 5 && (
                                                            <div className="text-center text-sm text-gray-500 pt-2">
                                                                ... y {historial.movimientos.length - 5} movimientos más
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-500">No hay movimientos de pago registrados</p>
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

            {/* Modal Crear/Editar - Mantiene el diseño original */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeForm}
                    >
                        <motion.div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden relative text-black"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    onClick={(e) => e.stopPropagation()}>

                            {/* Header fijo */}
                            <div className="bg-purple-600 text-white p-6 flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{editing ? 'Editar Alumno' : 'Nuevo Alumno'}</h2>
                                <button type="button" className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors" onClick={closeForm}>
                                    <FiX className="w-6 h-6"/>
                                </button>
                            </div>

                            {/* Contenido con scroll */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-6 space-y-8">

                                    {/* Foto del alumno */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Foto del Alumno
                                        </h3>
                                        <div className="flex items-center gap-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors">
                                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                                                {formData.foto ? (
                                                    <img src={formData.foto} alt="Foto del alumno" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-sm font-medium mb-2 text-gray-700 block">Seleccionar foto:</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (e) => {
                                                                setFormData(fd => ({ ...fd, foto: e.target.result }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, GIF</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información Personal */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Información Personal
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Nombre', name: 'nombre'},
                                                { label: 'Apellido', name: 'apellido'},
                                                { label: 'DNI', name: 'dni'},
                                                { label: 'Teléfono', name: 'telefono'},
                                                { label: 'Email', name: 'email', type: 'email'},
                                                { label: 'Fecha de Nacimiento', name: 'fechaNacimiento', type: 'date'},
                                            ].map(({ label, name, type }) => (
                                                <div key={name} className="flex flex-col">
                                                    <label className="text-sm font-medium mb-2 text-gray-700">{label}:</label>
                                                    <input
                                                        name={name}
                                                        type={type || 'text'}
                                                        value={formData[name] || ''}
                                                        onChange={handleChange}
                                                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                        required={['nombre', 'apellido', 'dni'].includes(name)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ubicación y Estado */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Ubicación y Estado
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Dirección:</label>
                                                <input
                                                    name="direccion"
                                                    type="text"
                                                    value={formData.direccion || ''}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Localidad:</label>
                                                <input
                                                    name="localidad"
                                                    type="text"
                                                    value={formData.localidad || ''}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Estado:</label>
                                                <select
                                                    name="estado"
                                                    value={formData.estado || 'Activo'}
                                                    onChange={handleChange}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                >
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información Adicional */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Información Adicional
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Padres/Tutores/Empresa */}
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Datos de Padres/Tutores/Empresa:</label>
                                                <textarea
                                                    name="padreTutor"
                                                    value={formData.padreTutor || ''}
                                                    onChange={handleChange}
                                                    rows={5}
                                                    className="border-2 border-gray-300 rounded-lg p-3 text-black focus:border-purple-500 focus:outline-none transition-colors resize-none"
                                                    placeholder="Información de contacto de padres, tutores o empresa..."
                                                />
                                            </div>

                                            {/* Observaciones */}
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Observaciones:</label>
                                                <textarea
                                                    name="observaciones"
                                                    value={formData.observaciones || ''}
                                                    onChange={handleChange}
                                                    rows={5}
                                                    className="border-2 border-gray-300 rounded-lg p-3 text-black focus:border-purple-500 focus:outline-none transition-colors resize-none"
                                                    placeholder="Observaciones adicionales sobre el alumno..."
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
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                                    >
                                        <span>{editing ? 'Guardar Cambios' : 'Crear Alumno'}</span>
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