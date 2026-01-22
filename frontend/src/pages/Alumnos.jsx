// src/pages/Alumnos.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiUserPlus, FiClock, FiSearch, FiChevronDown, FiUser, FiMapPin, FiPhone, FiMail, FiCalendar, FiBook, FiFilter, FiCheckCircle, FiXCircle, FiPrinter } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { jsPDF } from "jspdf";

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
                className="border border-gray-300 rounded-lg p-3 bg-white cursor-pointer flex justify-between items-center focus-within:border-blue-500 transition-colors hover:border-blue-400"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-gray-800 truncate">
                    {selectedOption ? toSafeLabel(selectedOption) : (placeholder || 'Seleccionar...')}
                </span>
                <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-500`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 z-20 max-h-60 overflow-y-auto shadow-lg">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.map((option, index) => (
                            <div
                                key={index}
                                className="p-3 hover:bg-blue-50 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0 transition-colors"
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
                            <div className="p-3 text-gray-500 text-center">No hay resultados</div>
                        )}
                    </div>
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
                        className={`px-4 py-3 rounded-lg shadow-lg border-l-4 ${
                            type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                                : 'bg-rose-50 text-rose-800 border-rose-500'
                        }`}
                        onClick={() => remove(id)}
                    >
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <span className="text-sm font-medium">{message}</span>
                        </div>
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
    const [isHistorialOpen, setIsHistorialOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [filters, setFilters] = useState({
        estado: 'todos',
        localidad: '',
        deudor: 'todos'
    });
    const [showFilters, setShowFilters] = useState(false);

    // Mostrar notificación
    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications((n) => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };
    const removeNotification = (id) => {
        setNotifications((n) => n.filter((x) => x.id !== id));
    };

    // Obtener localidades únicas
    const localidades = useMemo(() => {
        const locs = students
            .map(s => s.localidad)
            .filter(loc => loc && loc.trim() !== '');
        return [...new Set(locs)].sort();
    }, [students]);

    // Filtrar alumnos
    const filtered = useMemo(() => {
        let result = students;

        // Filtro de búsqueda por nombre, apellido o DNI
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter((a) =>
                [a.nombre, a.apellido, a.dni].some((f) =>
                    f?.toLowerCase().includes(searchLower)
                )
            );
        }

        // Filtro por estado
        if (filters.estado !== 'todos') {
            result = result.filter(a => a.estado === filters.estado);
        }

        // Filtro por localidad
        if (filters.localidad) {
            result = result.filter(a => a.localidad === filters.localidad);
        }

        // Filtro por deudor
        if (filters.deudor !== 'todos') {
            result = result.filter(a => {
                const historial = getStudentHistory(a.id);
                const esDeudor = historial.esDeudor;
                return filters.deudor === 'deudores' ? esDeudor : !esDeudor;
            });
        }

        return result;
    }, [students, search, filters]);

    // Limpiar filtros
    const clearFilters = () => {
        setFilters({
            estado: 'todos',
            localidad: '',
            deudor: 'todos'
        });
    };

    // Abrir form (nuevo o editar)
    const openForm = (student) => {
        if (student) {
            setEditing(student);
            setFormData({ ...student });
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

    // Abrir modal de historial
    const openHistorial = (student) => {
        setViewing(student);
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

    // Manejo filtros
    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Función para generar el PDF
    const generatePDF = (alumno, studentId) => {
        const doc = new jsPDF();

        // Configurar fuente y tamaño
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        // Título
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('CURSOS CEA', 105, 20, null, null, 'center');

        // Subtítulo
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Reconocidos con 1ª hora DE SENSACIÓN / VIGORIZO', 105, 28, null, null, 'center');
        doc.text('Horario: Lunes y Viernes de 4 | 2 | Tx. Salón 9 | 10 h', 105, 34, null, null, 'center');

        // Información del alumno
        doc.setFontSize(12);
        doc.text(`Alumno: ${alumno.nombre} ${alumno.apellido}`, 20, 50);
        doc.text(`Número de Recibo: ${studentId}`, 20, 60);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 70);
        doc.text(`Op: ${user?.name || 'Usuario'}`, 20, 80);
        doc.text('Descripción del pago: Se inscribió alumno al sistema CEA', 20, 90);

        // Tabla de valores
        doc.text('Valor Matrícula', 20, 110);
        doc.text('Descuento', 20, 120);
        doc.text('TOTAL', 20, 130);

        // Valores numéricos alineados a la derecha
        const valorMatricula = 25000;
        const descuento = 0;
        const total = valorMatricula - descuento;

        doc.text(`$ ${valorMatricula.toLocaleString('es-ES')}`, 180, 110, null, null, 'right');
        doc.text(`$ ${descuento.toLocaleString('es-ES')}`, 180, 120, null, null, 'right');
        doc.text(`$ ${total.toLocaleString('es-ES')}`, 180, 130, null, null, 'right');

        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(20, 140, 190, 140);

        // Pie de página
        doc.setFontSize(8);
        doc.text('SE RECUERDA QUE LOS DESCUENTOS SE EFECTUAN RESPETANDO EL CRONOGRAMA DE PAGOS', 105, 150, null, null, 'center');

        // Guardar el PDF
        doc.save(`recibo_${studentId}_${alumno.nombre}_${alumno.apellido}.pdf`);
    };

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
                closeForm();
            } else {
                // Crear alumno y obtener el ID
                const studentId = addStudent({ ...formData });
                showNotification('success', 'Alumno creado correctamente');

                // Generar PDF
                generatePDF(formData, studentId);

                closeForm();
            }
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    // Eliminar alumno
    const handleDelete = (student) => {
        if (window.confirm(`¿Seguro que querés eliminar a ${student.nombre} ${student.apellido}?`)) {
            removeStudent(student.id);
            showNotification('success', 'Alumno eliminado correctamente');
        }
    };

    // Obtener historial del alumno mejorado
    const getStudentHistory = (studentId) => {
        const studentInscriptions = inscriptions.filter(i => i.studentId === studentId);
        const studentMovements = cajaMovimientos.filter(m => m.studentId === studentId);

        // Determinar estado de cada curso
        const coursesWithStatus = studentInscriptions.map(inscription => {
            const course = findCourse(inscription.courseId);
            const today = new Date();
            const startDate = new Date(inscription.fechaInicio || inscription.inicio || course?.inicio);
            const endDate = new Date(inscription.fechaFin || inscription.fin || course?.fin);

            // Usar el estado de la inscripción si existe, sino calcularlo
            let estado = inscription.status || 'Cursando';

            // Si no tiene status definido, calcularlo por fechas
            if (!inscription.status || inscription.status === 'Cursando') {
                if (today < startDate) {
                    estado = 'Próximamente';
                } else if (today > endDate) {
                    estado = 'Finalizado';
                } else {
                    estado = 'Cursando';
                }
            }

            // Verificar si tiene cuotas pendientes
            const tieneCuotasPendientes = inscription.installments?.some(
                inst => inst.status === 'Pendiente' || inst.status === 'Parcial'
            );

            return {
                ...inscription,
                courseName: course?.nombre || inscription.courseName || 'Curso no encontrado',
                professorName: inscription.professorName || 'Profesor no asignado',
                estado,
                estadoOriginal: inscription.status,
                startDate,
                endDate,
                tieneCuotasPendientes,
                totalPagado: inscription.installments?.reduce((sum, inst) => sum + (Number(inst.amountPaid) || 0), 0) || 0,
                totalDeuda: inscription.totalFinal || 0
            };
        });

        // Verificar si es deudor (tiene cuotas pendientes en cualquier inscripción)
        const esDeudor = coursesWithStatus.some(c => c.tieneCuotasPendientes);

        const result = {
            inscripciones: studentInscriptions,
            cursos: coursesWithStatus,
            movimientos: studentMovements,
            esDeudor,
            totalCursos: coursesWithStatus.length,
            cursosActivos: coursesWithStatus.filter(c => c.estado === 'Cursando').length,
            cursosFinalizados: coursesWithStatus.filter(c => c.estado === 'Finalizado').length
        };

        return result;
    };

    // Función para navegar a inscripciones filtradas
    const navigateToInscriptions = (studentId) => {
        alert(`Navegando a inscripciones filtradas por alumno ID: ${studentId}`);
        closeHistorial();
    };

    const historial = viewing ? getStudentHistory(viewing.id) : null;

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen relative">
            <Notifications notifications={notifications} remove={removeNotification} />

            {/* Header con gradiente suave */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 md:p-8 rounded-2xl shadow-lg mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <FiUser className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Alumnos</h1>
                        <p className="text-slate-200 text-sm md:text-base mt-1">
                            Administra la información de todos los estudiantes del sistema
                        </p>
                    </div>
                </div>
            </div>

            {/* Panel de búsqueda y acciones */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, apellido o DNI..."
                                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white transition-all duration-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiFilter className="w-5 h-5" />
                            <span>Filtros</span>
                        </button>
                        <button
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
                            onClick={() => openForm(null)}
                        >
                            <FiUserPlus className="w-5 h-5" />
                            <span>Nuevo Alumno</span>
                        </button>
                    </div>
                </div>

                {/* Panel de filtros desplegable */}
                {showFilters && (
                    <motion.div
                        className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <FiFilter className="w-5 h-5 mr-2 text-gray-600" />
                                Filtros Avanzados
                            </h3>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center"
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Filtro por Estado */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                    <FiCheckCircle className="w-4 h-4 mr-2 text-gray-400" />
                                    Estado
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleFilterChange('estado', 'todos')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            filters.estado === 'todos'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('estado', 'Activo')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                                            filters.estado === 'Activo'
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FiCheckCircle className="w-3 h-3 mr-1" />
                                        Activos
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('estado', 'Inactivo')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                                            filters.estado === 'Inactivo'
                                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FiXCircle className="w-3 h-3 mr-1" />
                                        Inactivos
                                    </button>
                                </div>
                            </div>

                            {/* Filtro por Localidad */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    Localidad
                                </label>
                                <select
                                    value={filters.localidad}
                                    onChange={(e) => handleFilterChange('localidad', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Todas las localidades</option>
                                    {localidades.map((localidad, index) => (
                                        <option key={index} value={localidad}>
                                            {localidad}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Estado de Pagos */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                    <FiBook className="w-4 h-4 mr-2 text-gray-400" />
                                    Estado de Pagos
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleFilterChange('deudor', 'todos')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            filters.deudor === 'todos'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('deudor', 'deudores')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            filters.deudor === 'deudores'
                                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        Deudores
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('deudor', 'aldia')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            filters.deudor === 'aldia'
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        Al día
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contador de resultados filtrados */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {filters.estado !== 'todos' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium mr-2">
                                            Estado: {filters.estado}
                                        </span>
                                    )}
                                    {filters.localidad && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium mr-2">
                                            Localidad: {filters.localidad}
                                        </span>
                                    )}
                                    {filters.deudor !== 'todos' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium mr-2">
                                            {filters.deudor === 'deudores' ? 'Deudores' : 'Al día'}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                    {filtered.length} de {students.length} alumnos
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Tabla de alumnos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                        <tr>
                            {[
                                'ID',
                                'Nombre',
                                'Apellido',
                                'DNI',
                                'Teléfono',
                                'Email',
                                'Localidad',
                                'Estado',
                                'Acciones',
                            ].map((h) => (
                                <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((alumno, index) => {
                            const historialAlumno = getStudentHistory(alumno.id);
                            return (
                                <motion.tr
                                    key={alumno.id}
                                    className="hover:bg-blue-50/50 transition-colors"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        #{alumno.id}
                                    </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                <FiUser className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="font-medium text-gray-900">{alumno.nombre}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{alumno.apellido}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-mono">{alumno.dni}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        <div className="flex items-center">
                                            <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                                            {alumno.telefono || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate" title={alumno.email}>
                                            {alumno.email ? (
                                                <div className="flex items-center">
                                                    <FiMail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                                    <span className="text-gray-900">{alumno.email}</span>
                                                </div>
                                            ) : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        <div className="flex items-center">
                                            <FiMapPin className="h-4 w-4 text-gray-400 mr-2" />
                                            {alumno.localidad || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            alumno.estado === 'Activo'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                alumno.estado === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`}></span>
                                            {alumno.estado}
                                        </span>
                                            {historialAlumno.esDeudor && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800" title="Tiene pagos pendientes">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"></span>
                                                Deuda
                                            </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <motion.button
                                                onClick={() => setViewing(alumno)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="Ver detalles"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openForm(alumno)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <FiEdit className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openHistorial(alumno)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors"
                                                title="Ver historial"
                                            >
                                                <FiClock className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(alumno)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="9" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="p-4 bg-gray-100 rounded-full">
                                            <FiSearch className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-700 mb-1">No se encontraron resultados</h3>
                                            <p className="text-gray-500">Intenta con otros términos de búsqueda o ajusta los filtros</p>
                                        </div>
                                        {(filters.estado !== 'todos' || filters.localidad || filters.deudor !== 'todos') && (
                                            <button
                                                onClick={clearFilters}
                                                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                                            >
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Contador de resultados */}
            {filtered.length > 0 && (
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Mostrando {filtered.length} de {students.length} alumnos
                    </div>
                    <div className="text-sm text-gray-600">
                        {(filters.estado !== 'todos' || filters.localidad || filters.deudor !== 'todos') && (
                            <button
                                onClick={clearFilters}
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                            >
                                <FiX className="w-3 h-3 mr-1" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Ver Detalles */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-2xl z-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <FiUser className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Detalles del Alumno</h2>
                                            <p className="text-slate-300 text-sm">Información completa del estudiante</p>
                                        </div>
                                    </div>
                                    <button
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        onClick={() => setViewing(null)}
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Información principal */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Foto y datos básicos */}
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                            <div className="w-32 h-32 mx-auto bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                                                {viewing.foto ? (
                                                    <img src={viewing.foto} alt="Foto del alumno" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                                        <FiUser className="w-16 h-16 text-blue-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center mt-6">
                                                <h3 className="text-xl font-bold text-gray-800">{viewing.nombre} {viewing.apellido}</h3>
                                                <p className="text-gray-600 mt-1">Estudiante</p>
                                                <div className="mt-4">
                                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                                        viewing.estado === 'Activo'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${
                                                            viewing.estado === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}></span>
                                                        {viewing.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Información de contacto */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                Información de Contacto
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                                        <FiPhone className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Teléfono</p>
                                                        <p className="font-medium text-gray-800">{viewing.telefono || 'No especificado'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                                        <FiMail className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Email</p>
                                                        <p className="font-medium text-gray-800 break-all">{viewing.email || 'No especificado'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos personales */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                Datos Personales
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm text-gray-500">DNI</p>
                                                        <p className="font-medium text-gray-800 font-mono">{viewing.dni}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                                                        <p className="font-medium text-gray-800 flex items-center">
                                                            <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                                                            {viewing.fechaNacimiento || 'No especificada'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Localidad</p>
                                                        <p className="font-medium text-gray-800 flex items-center">
                                                            <FiMapPin className="w-4 h-4 text-gray-400 mr-2" />
                                                            {viewing.localidad || 'No especificada'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Dirección</p>
                                                        <p className="font-medium text-gray-800">{viewing.direccion || 'No especificada'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Información adicional */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                    <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                    Datos de Padres/Tutores
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                                                    <p className="text-gray-700 whitespace-pre-wrap">
                                                        {viewing.padreTutor || 'No se han registrado datos de padres, tutores o empresa'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                    <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                    Observaciones
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                                                    <p className="text-gray-700 whitespace-pre-wrap">
                                                        {viewing.observaciones || 'Sin observaciones'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                                    <button
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                                        onClick={() => { setViewing(null); openForm(viewing); }}
                                    >
                                        <FiEdit className="w-4 h-4" />
                                        <span>Editar Alumno</span>
                                    </button>
                                    <button
                                        className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                                        onClick={() => openHistorial(viewing)}
                                    >
                                        <FiBook className="w-4 h-4" />
                                        <span>Ver Historial Académico</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Ver Historial */}
            <AnimatePresence>
                {isHistorialOpen && viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeHistorial}
                    >
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative shadow-2xl"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 z-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <FiBook className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Historial Académico</h2>
                                            <p className="text-slate-300 text-sm">Cursos y actividad del estudiante</p>
                                        </div>
                                    </div>
                                    <button
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        onClick={closeHistorial}
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                {historial && (
                                    <div className="space-y-8">
                                        {/* Información del Alumno */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">{viewing.nombre} {viewing.apellido}</h3>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-sm text-gray-600">DNI: {viewing.dni}</span>
                                                        <span className="text-sm text-gray-600">Estado: {viewing.estado}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                                        historial.esDeudor
                                                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                    }`}>
                                                        {historial.esDeudor ? 'DEUDOR' : 'AL DÍA'}
                                                    </span>
                                                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                        {historial.totalCursos} cursos
                                                    </span>
                                                    <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                                                        {historial.cursosActivos} activos
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cursos del Alumno */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                Cursos Inscriptos
                                            </h3>

                                            {historial.cursos.length > 0 ? (
                                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                    Curso
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                    Estado
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                    Fechas
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                    Pagos
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                            {historial.cursos.map((curso, index) => (
                                                                <motion.tr
                                                                    key={curso.id}
                                                                    className="hover:bg-blue-50/50 transition-colors"
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.2, delay: index * 0.1 }}
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">
                                                                                {curso.courseName}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 mt-1">
                                                                                Profesor: {curso.professorName}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                                                curso.estado === 'Próximamente' ? 'bg-blue-100 text-blue-800' :
                                                                                    curso.estado === 'Cursando' ? 'bg-emerald-100 text-emerald-800' :
                                                                                        'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                                <span className={`w-2 h-2 rounded-full mr-2 ${
                                                                                    curso.estado === 'Próximamente' ? 'bg-blue-500' :
                                                                                        curso.estado === 'Cursando' ? 'bg-emerald-500' :
                                                                                            'bg-gray-500'
                                                                                }`}></span>
                                                                                {curso.estado}
                                                                            </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="space-y-1">
                                                                            <div className="text-sm text-gray-900">
                                                                                Inicio: {new Date(curso.startDate).toLocaleDateString()}
                                                                            </div>
                                                                            <div className="text-sm text-gray-900">
                                                                                Fin: {new Date(curso.endDate).toLocaleDateString()}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="space-y-1">
                                                                            <div className="text-sm text-gray-900">
                                                                                Total: ${formatNumber(curso.totalDeuda)}
                                                                            </div>
                                                                            <div className="text-sm text-gray-600">
                                                                                Pagado: ${formatNumber(curso.totalPagado)}
                                                                            </div>
                                                                            {curso.tieneCuotasPendientes && (
                                                                                <div className="text-xs text-rose-600 font-medium">
                                                                                    Pendientes
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </motion.tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                                    <div className="text-gray-400 mb-3">
                                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-600 mb-1">No hay cursos registrados</h3>
                                                    <p className="text-gray-500">Este alumno aún no se ha inscripto a ningún curso</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Historial de Pagos */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                Historial de Pagos
                                            </h3>
                                            {historial.movimientos.length > 0 ? (
                                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                                    <div className="space-y-3">
                                                        {historial.movimientos.slice(0, 5).map(movimiento => (
                                                            <div key={movimiento.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-center">
                                                                    <div className={`p-2 rounded-lg mr-3 ${
                                                                        movimiento.pago === 'Completada' ? 'bg-emerald-100' :
                                                                            movimiento.pago === 'Pendiente' ? 'bg-amber-100' :
                                                                                'bg-rose-100'
                                                                    }`}>
                                                                        <div className={`w-3 h-3 rounded-full ${
                                                                            movimiento.pago === 'Completada' ? 'bg-emerald-500' :
                                                                                movimiento.pago === 'Pendiente' ? 'bg-amber-500' :
                                                                                    'bg-rose-500'
                                                                        }`}></div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-800">Pago - {movimiento.formaPago}</p>
                                                                        <p className="text-sm text-gray-600">
                                                                            {new Date(movimiento.fechaHora).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                    movimiento.pago === 'Completada' ? 'bg-emerald-100 text-emerald-800' :
                                                                        movimiento.pago === 'Pendiente' ? 'bg-amber-100 text-amber-800' :
                                                                            'bg-rose-100 text-rose-800'
                                                                }`}>
                                                                    {movimiento.pago}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {historial.movimientos.length > 5 && (
                                                            <div className="text-center pt-3">
                                                                <button
                                                                    onClick={() => navigateToInscriptions(viewing.id)}
                                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                                >
                                                                    Ver todos los {historial.movimientos.length} movimientos →
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
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

            {/* Modal Crear/Editar */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeForm}
                    >
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden relative shadow-2xl"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 z-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <FiUser className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{editing ? 'Editar Alumno' : 'Nuevo Alumno'}</h2>
                                            <p className="text-slate-300 text-sm">Complete los datos del estudiante</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        onClick={closeForm}
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Formulario */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-6 space-y-8">
                                    {/* Foto del alumno */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Foto del Alumno
                                        </h3>
                                        <div className="flex flex-col md:flex-row items-center gap-6 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
                                            <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                                                {formData.foto ? (
                                                    <img src={formData.foto} alt="Foto del alumno" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                        <FiUser className="w-16 h-16 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="text-sm font-medium text-gray-700 mb-2 block">Seleccionar foto:</label>
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
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, GIF (Máx. 5MB)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información Personal */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Información Personal
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[
                                                { label: 'Nombre *', name: 'nombre', icon: FiUser },
                                                { label: 'Apellido *', name: 'apellido', icon: FiUser },
                                                { label: 'DNI *', name: 'dni', icon: FiUser },
                                                { label: 'Teléfono', name: 'telefono', icon: FiPhone },
                                                { label: 'Email', name: 'email', type: 'email', icon: FiMail },
                                                { label: 'Fecha de Nacimiento', name: 'fechaNacimiento', type: 'date', icon: FiCalendar },
                                            ].map(({ label, name, type, icon: Icon }) => (
                                                <div key={name} className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                                        {Icon && <Icon className="w-4 h-4 mr-2 text-gray-400" />}
                                                        {label}
                                                    </label>
                                                    <input
                                                        name={name}
                                                        type={type || 'text'}
                                                        value={formData[name] || ''}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        required={label.includes('*')}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ubicación y Estado */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Ubicación y Estado
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    Dirección *
                                                </label>
                                                <input
                                                    name="direccion"
                                                    type="text"
                                                    value={formData.direccion || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    Localidad *
                                                </label>
                                                <input
                                                    name="localidad"
                                                    type="text"
                                                    value={formData.localidad || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                    </div>
                                                    Estado
                                                </label>
                                                <select
                                                    name="estado"
                                                    value={formData.estado || 'Activo'}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información Adicional */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Información Adicional
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">
                                                    Datos de Padres/Tutores/Empresa:
                                                </label>
                                                <textarea
                                                    name="padreTutor"
                                                    value={formData.padreTutor || ''}
                                                    onChange={handleChange}
                                                    rows={5}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                                    placeholder="Información de contacto de padres, tutores o empresa..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">
                                                    Observaciones:
                                                </label>
                                                <textarea
                                                    name="observaciones"
                                                    value={formData.observaciones || ''}
                                                    onChange={handleChange}
                                                    rows={5}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                                    placeholder="Observaciones adicionales sobre el alumno..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                                        >
                                            <span>{editing ? 'Guardar Cambios' : 'Crear + Imprimir'}</span>
                                            {!editing && <FiPrinter className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}