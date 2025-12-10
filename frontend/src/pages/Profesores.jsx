// src/pages/Profesores.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPlus, FiMinus, FiSearch, FiUserPlus, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiBook, FiBriefcase, FiClock } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

// Helpers
const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

// Función para mostrar horarios en múltiples líneas
const renderHorarios = (horarios = []) => {
    if (!horarios || horarios.length === 0) return (
        <span className="text-gray-400 text-xs">Sin horarios definidos</span>
    );

    return (
        <div className="space-y-1">
            {horarios.map((h, i) => (
                <div key={i} className="flex items-center text-xs bg-slate-50 px-2 py-1 rounded">
                    <span className="font-medium text-slate-700 w-12">{h.dia.slice(0,3)}</span>
                    <span className="text-slate-600">: {h.desde} - {h.hasta}</span>
                </div>
            ))}
        </div>
    );
};

// Componente de notificaciones mejorado
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
                        className={`px-4 py-3 rounded-lg shadow-lg border-l-4 ${
                            n.type==='success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                                : 'bg-rose-50 text-rose-800 border-rose-500'
                        }`}
                        onClick={()=>remove(n.id)}
                    >
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${n.type==='success'?'bg-emerald-500':'bg-rose-500'}`}></div>
                            <span className="text-sm font-medium">{n.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default function Profesores() {
    const { professors, addProfessor, updateProfessor, removeProfessor } = useDB();
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
        () => professors.filter(p =>
            [p.nombre, p.apellido, p.dni, (p.materias||[]).join(' ')].some(f =>
                String(f).toLowerCase().includes(search.toLowerCase())
            )
        ),
        [professors, search]
    );

    // ===== Form state =====
    const [formData, setFormData] = useState({
        nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '', localidad: '', estado: 'Activo',
        titulo: '', fechaAlta: '', observaciones: '', cv: '', photo: '',
        materias: [],
        horarios: [],
    });

    // Drafts
    const [materiaDraft, setMateriaDraft] = useState('');
    const [horarioDraft, setHorarioDraft] = useState({ dia: 'Lunes', desde: '', hasta: '' });

    const openForm = (prof) => {
        if (prof) {
            setEditing(prof);
            setFormData({
                nombre: prof.nombre,
                apellido: prof.apellido,
                dni: prof.dni,
                telefono: prof.telefono,
                email: prof.email,
                direccion: prof.direccion,
                localidad: prof.localidad,
                estado: prof.estado,
                titulo: prof.titulo,
                fechaAlta: prof.fechaAlta,
                observaciones: prof.observaciones,
                cv: prof.cv,
                photo: prof.photo,
                materias: prof.materias || [],
                horarios: prof.horarios || [],
            });
        } else {
            setEditing(null);
            setFormData({
                nombre:'', apellido:'', dni:'', telefono:'', email:'', direccion:'', localidad:'', estado:'Activo',
                titulo:'', fechaAlta:'', observaciones:'', cv:'', photo:'', materias:[], horarios:[]
            });
        }
        setMateriaDraft('');
        setHorarioDraft({ dia:'Lunes', desde:'', hasta:'' });
        setIsFormOpen(true);
    };
    const closeForm = () => { setIsFormOpen(false); setEditing(null); };

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(fd=>({ ...fd, [name]: value }));
    };

    // Archivos
    const handleCvChange = e => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') return showNotification('error','Solo PDF permitido');
            setFormData(fd=>({ ...fd, cv: URL.createObjectURL(file) }));
        }
    };
    const handlePhotoChange = e => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(fd=>({ ...fd, photo: URL.createObjectURL(file) }));
        }
    };

    // Materias
    const addMateria = () => {
        const m = materiaDraft.trim();
        if (!m) return;
        if (formData.materias.includes(m)) {
            showNotification('error','La materia ya fue agregada');
            return;
        }
        setFormData(fd=>({ ...fd, materias: [...fd.materias, m] }));
        setMateriaDraft('');
    };
    const removeMateria = (m) => {
        setFormData(fd=>({ ...fd, materias: fd.materias.filter(x=>x!==m) }));
    };

    // Horarios
    const addHorario = () => {
        const { dia, desde, hasta } = horarioDraft;
        if (!dia || !desde || !hasta) {
            showNotification('error','Completa día, desde y hasta');
            return;
        }
        const exists = formData.horarios.some(h => h.dia===dia && h.desde===desde && h.hasta===hasta);
        if (exists) {
            showNotification('error','Ese horario ya está agregado');
            return;
        }
        setFormData(fd=>({ ...fd, horarios: [...fd.horarios, { dia, desde, hasta }] }));
        setHorarioDraft(d => ({ ...d, desde:'', hasta:'' }));
    };
    const removeHorario = (idx) => {
        setFormData(fd=>({ ...fd, horarios: fd.horarios.filter((_,i)=>i!==idx) }));
    };

    // Submit
    const handleSubmit = e => {
        e.preventDefault();
        try {
            if (!/^[0-9]+$/.test(formData.dni)) throw new Error('DNI numérico');
            if (!/^[0-9]+$/.test(formData.telefono)) throw new Error('Teléfono numérico');
            if (!formData.nombre || !formData.apellido) throw new Error('Nombre y Apellido son obligatorios');

            const payload = {
                ...formData,
                id: editing ? editing.id : null
            };

            if (editing) {
                updateProfessor(payload.id, payload);
                showNotification('success','Profesor editado correctamente');
            } else {
                addProfessor(payload);
                showNotification('success','Profesor creado correctamente');
            }
            closeForm();
        } catch(err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = prof => {
        if (window.confirm(`¿Seguro que querés eliminar a ${prof.nombre} ${prof.apellido}?`)) {
            removeProfessor(prof.id);
            showNotification('success','Profesor eliminado correctamente');
        }
    };

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
                        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Profesores</h1>
                        <p className="text-slate-200 text-sm md:text-base mt-1">
                            Administra la información de los docentes del sistema
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
                                placeholder="Buscar por nombre, DNI o materia..."
                                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white transition-all duration-200"
                                value={search}
                                onChange={e=>setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
                        onClick={() => openForm(null)}
                    >
                        <FiUserPlus className="w-5 h-5" />
                        <span>Nuevo Profesor</span>
                    </button>
                </div>
            </div>

            {/* Tabla de profesores */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                        <tr>
                            {['ID','Nombre','Apellido','DNI','Teléfono','Estado','Materias','Horarios','Acciones']
                                .map(h=> (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((prof, index) => (
                            <motion.tr
                                key={prof.id}
                                className="hover:bg-blue-50/50 transition-colors"
                                initial={{opacity:0,y:10}}
                                animate={{opacity:1,y:0}}
                                transition={{duration:0.2, delay: index * 0.05}}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        #{prof.id}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <FiUser className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="font-medium text-gray-900">{prof.nombre}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{prof.apellido}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-mono">{prof.dni}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                    <div className="flex items-center">
                                        <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                                        {prof.telefono || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                        prof.estado === 'Activo'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                            prof.estado === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}></span>
                                        {prof.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-xs">
                                        {(prof.materias||[]).length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {(prof.materias||[]).slice(0, 3).map((materia, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                                                        {materia}
                                                    </span>
                                                ))}
                                                {(prof.materias||[]).length > 3 && (
                                                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                        +{(prof.materias||[]).length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Sin materias</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-xs">
                                        {renderHorarios(prof.horarios)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <motion.button
                                            onClick={()=>setViewing(prof)}
                                            whileHover={{scale:1.05}}
                                            whileTap={{scale:0.95}}
                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Ver detalles"
                                        >
                                            <FiEye className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            onClick={()=>openForm(prof)}
                                            whileHover={{scale:1.05}}
                                            whileTap={{scale:0.95}}
                                            className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <FiEdit className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            onClick={()=>handleDelete(prof)}
                                            whileHover={{scale:1.05}}
                                            whileTap={{scale:0.95}}
                                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filtered.length===0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="p-4 bg-gray-100 rounded-full">
                                            <FiSearch className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-700 mb-1">No se encontraron resultados</h3>
                                            <p className="text-gray-500">Intenta con otros términos de búsqueda</p>
                                        </div>
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
                <div className="mt-4 text-sm text-gray-600">
                    Mostrando {filtered.length} de {professors.length} profesores
                </div>
            )}

            {/* Modal Detalles */}
            <AnimatePresence>
                {viewing && (
                    <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                onClick={()=>setViewing(null)}>
                        <motion.div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl"
                                    initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}}
                                    onClick={(e)=>e.stopPropagation()}>
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-2xl z-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <FiUser className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Detalles del Profesor</h2>
                                            <p className="text-slate-300 text-sm">Información completa del docente</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={()=>setViewing(null)}>
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
                                                <img src={viewing.photo||'/placeholder.png'} alt="Foto" className="w-full h-full object-cover"/>
                                            </div>
                                            <div className="text-center mt-6">
                                                <h3 className="text-xl font-bold text-gray-800">{viewing.nombre} {viewing.apellido}</h3>
                                                {viewing.titulo && (
                                                    <p className="text-gray-600 mt-1 flex items-center justify-center">
                                                        <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                                                        {viewing.titulo}
                                                    </p>
                                                )}
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

                                    {/* Datos personales y ubicación */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                Información Personal
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm text-gray-500">DNI</p>
                                                        <p className="font-medium text-gray-800 font-mono">{viewing.dni}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Fecha de Alta</p>
                                                        <p className="font-medium text-gray-800 flex items-center">
                                                            <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                                                            {viewing.fechaAlta || 'No especificada'}
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

                                        {/* Materias y horarios */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                    <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                    Materias a Dictar
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                                                    {(viewing.materias||[]).length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {viewing.materias.map((materia, i) => (
                                                                <span key={i} className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                                                                    {materia}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center">
                                                            <p className="text-gray-400 italic">No hay materias asignadas</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                    <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                                    Horarios Disponibles
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                                                    {viewing.horarios?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {viewing.horarios.map((h,i)=>(
                                                                <div key={i} className="flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                                                                    <div className="flex items-center">
                                                                        <FiClock className="w-4 h-4 text-gray-400 mr-2" />
                                                                        <span className="font-medium text-gray-700">{h.dia}</span>
                                                                    </div>
                                                                    <span className="text-gray-600 bg-slate-100 px-3 py-1 rounded text-sm">
                                                                        {h.desde} - {h.hasta}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center">
                                                            <p className="text-gray-400 italic">No hay horarios definidos</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Observaciones y acciones */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Observaciones
                                        </h4>
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {viewing.observaciones || 'Sin observaciones'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                                        {viewing.cv && (
                                            <button
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                                                onClick={()=>window.open(viewing.cv,'_blank')}
                                            >
                                                <FiBook className="w-4 h-4" />
                                                <span>Ver Curriculum Vitae</span>
                                            </button>
                                        )}
                                        <button
                                            className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                                            onClick={()=>{setViewing(null); openForm(viewing);}}
                                        >
                                            <FiEdit className="w-4 h-4" />
                                            <span>Editar Profesor</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Formulario */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                onClick={closeForm}>
                        <motion.div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative shadow-2xl"
                                    initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}}
                                    onClick={(e)=>e.stopPropagation()}>

                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 z-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <FiUser className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{editing ? 'Editar Profesor' : 'Nuevo Profesor'}</h2>
                                            <p className="text-slate-300 text-sm">Complete los datos del docente</p>
                                        </div>
                                    </div>
                                    <button type="button" className="p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={closeForm}>
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Formulario */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-6 space-y-8">

                                    {/* Información Personal */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Información Personal
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[
                                                {label:'Nombre *',name:'nombre',type:'text', icon: FiUser},
                                                {label:'Apellido *',name:'apellido',type:'text', icon: FiUser},
                                                {label:'DNI *',name:'dni',type:'number', icon: FiUser},
                                                {label:'Teléfono',name:'telefono',type:'number', icon: FiPhone},
                                                {label:'Email',name:'email',type:'email', icon: FiMail},
                                                {label:'Título',name:'titulo',type:'text', icon: FiBriefcase},
                                            ].map(({label,name,type, icon: Icon})=>(
                                                <div key={name} className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                                        {Icon && <Icon className="w-4 h-4 mr-2 text-gray-400" />}
                                                        {label}
                                                    </label>
                                                    <input
                                                        name={name}
                                                        type={type}
                                                        value={formData[name]}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        required={label.includes('*')}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ubicación y Detalles */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Ubicación y Detalles
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    Dirección *
                                                </label>
                                                <input name="direccion" type="text" value={formData.direccion} onChange={handleChange}
                                                       className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    Localidad *
                                                </label>
                                                <input name="localidad" type="text" value={formData.localidad} onChange={handleChange}
                                                       className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                    </div>
                                                    Estado
                                                </label>
                                                <select name="estado" value={formData.estado} onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    Fecha de alta *
                                                </label>
                                                <input name="fechaAlta" type="date" value={formData.fechaAlta} onChange={handleChange}
                                                       className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Archivos */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Archivos
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-400 transition-colors">
                                                <label className="text-sm font-medium text-gray-700 block mb-3">
                                                    Foto del Profesor
                                                </label>
                                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm text-gray-800 w-full mb-3" />
                                                {formData.photo && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-3">
                                                            <img src={formData.photo} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                                            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">Imagen cargada</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-400 transition-colors">
                                                <label className="text-sm font-medium text-gray-700 block mb-3">
                                                    Curriculum Vitae (PDF)
                                                </label>
                                                <input type="file" accept="application/pdf" onChange={handleCvChange} className="text-sm text-gray-800 w-full mb-3" />
                                                {formData.cv && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-16 h-16 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center">
                                                                <FiBook className="w-8 h-8 text-red-400" />
                                                            </div>
                                                            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">PDF cargado</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Materias */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Materias a Dictar
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input
                                                    type="text"
                                                    value={materiaDraft}
                                                    onChange={(e)=>setMateriaDraft(e.target.value)}
                                                    placeholder="Ej: Programación, Base de Datos, Matemáticas..."
                                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                                <button type="button" onClick={addMateria}
                                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 transition-colors font-medium">
                                                    <FiPlus className="w-4 h-4"/> Agregar
                                                </button>
                                            </div>
                                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[80px]">
                                                {formData.materias.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center">
                                                        <span className="text-gray-400 italic">Agrega una o más materias que dicta el profesor</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.materias.map(m=>(
                                                            <span key={m} className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                                                                {m}
                                                                <button type="button" onClick={()=>removeMateria(m)}
                                                                        className="hover:text-red-600 transition-colors text-base" title="Eliminar">
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horarios */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Días y Horarios Disponibles
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-medium text-gray-700 block mb-2">Día:</label>
                                                    <select
                                                        value={horarioDraft.dia}
                                                        onChange={(e)=>setHorarioDraft(d=>({...d, dia:e.target.value}))}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    >
                                                        {diasSemana.map(d=><option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 block mb-2">Desde:</label>
                                                    <input
                                                        type="time"
                                                        value={horarioDraft.desde}
                                                        onChange={(e)=>setHorarioDraft(d=>({...d, desde:e.target.value}))}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 block mb-2">Hasta:</label>
                                                    <input
                                                        type="time"
                                                        value={horarioDraft.hasta}
                                                        onChange={(e)=>setHorarioDraft(d=>({...d, hasta:e.target.value}))}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    />
                                                </div>
                                                <button type="button" onClick={addHorario}
                                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 transition-colors font-medium">
                                                    <FiPlus className="w-4 h-4"/> Agregar
                                                </button>
                                            </div>

                                            {/* Lista de horarios */}
                                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[100px]">
                                                {formData.horarios.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center">
                                                        <div className="text-gray-400 italic">Agrega al menos un horario disponible</div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {formData.horarios.map((h,idx)=>(
                                                            <div key={`${h.dia}-${h.desde}-${h.hasta}-${idx}`}
                                                                 className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                                                                <div className="flex items-center">
                                                                    <FiClock className="w-4 h-4 text-gray-400 mr-3" />
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">{h.dia}</div>
                                                                        <div className="text-sm text-gray-600">{h.desde} - {h.hasta}</div>
                                                                    </div>
                                                                </div>
                                                                <button type="button" onClick={()=>removeHorario(idx)}
                                                                        className="text-rose-500 hover:text-rose-700 p-2 rounded hover:bg-rose-50 transition-colors"
                                                                        title="Eliminar horario">
                                                                    <FiMinus className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-3"></div>
                                            Observaciones
                                        </h3>
                                        <textarea
                                            name="observaciones"
                                            value={formData.observaciones}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                            placeholder="Observaciones adicionales sobre el profesor..."
                                        />
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
                                            <span>{editing ? 'Guardar Cambios' : 'Crear Profesor'}</span>
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