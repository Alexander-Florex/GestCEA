// src/pages/Profesores.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPlus, FiMinus, FiSearch, FiUserPlus } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

// Helpers
const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

// Función para mostrar horarios en múltiples líneas
const renderHorarios = (horarios = []) => {
    if (!horarios || horarios.length === 0) return '-';

    return (
        <div className="space-y-1">
            {horarios.map((h, i) => (
                <div key={i} className="text-xs">
                    <span className="font-medium">{h.dia.slice(0,3)}</span>: {h.desde}-{h.hasta}
                </div>
            ))}
        </div>
    );
};

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
                        className={`px-4 py-2 rounded shadow ${n.type==='success'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}
                        onClick={()=>remove(n.id)}
                    >
                        {n.message}
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
                showNotification('success','Profesor editado');
            } else {
                addProfessor(payload);
                showNotification('success','Profesor creado');
            }
            closeForm();
        } catch(err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = prof => {
        if (window.confirm(`Eliminar a ${prof.nombre}?`)) {
            removeProfessor(prof.id);
            showNotification('success','Profesor eliminado');
        }
    };

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
                            placeholder="Buscar por nombre, DNI o materia..."
                            className="w-full pl-10 pr-4 py-3 text-lg border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white shadow-sm transition-all duration-200 hover:border-purple-400"
                            value={search}
                            onChange={e=>setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg flex items-center space-x-2"
                        onClick={() => openForm(null)}
                    >
                        <FiUserPlus className="w-5 h-5" />
                        <span>Nuevo Profesor</span>
                    </button>
                </div>
            </div>

            {/* Tabla - Diseño mejorado */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                        <tr>
                            {['ID','Nombre','Apellido','DNI','Teléfono','Email','Dirección','Localidad','Estado','Materia/s a dictar','Horarios','Acciones']
                                .map(h=> (
                                    <th key={h} className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((prof, index) => (
                            <motion.tr
                                key={prof.id}
                                className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                initial={{opacity:0,y:10}}
                                animate={{opacity:1,y:0}}
                                transition={{duration:0.2, delay: index * 0.05}}
                            >
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{prof.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{prof.nombre}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{prof.apellido}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{prof.dni}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{prof.telefono}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-32 truncate" title={prof.email}>
                                        {prof.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-32 truncate" title={prof.direccion}>
                                        {prof.direccion}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{prof.localidad}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        prof.estado === 'Activo'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {prof.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-48">
                                        {(prof.materias||[]).length > 0 ? (
                                            <div className="space-y-1">
                                                {prof.materias.map((materia, i) => (
                                                    <div key={i} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full inline-block mr-1 mb-1">
                                                        {materia}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-32">
                                        {renderHorarios(prof.horarios)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <div className="flex space-x-3">
                                        <motion.button
                                            onClick={()=>setViewing(prof)}
                                            whileHover={{scale:1.1}}
                                            whileTap={{scale:0.95}}
                                            className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-100 transition-all"
                                        >
                                            <FiEye size={18}/>
                                        </motion.button>
                                        <motion.button
                                            onClick={()=>openForm(prof)}
                                            whileHover={{scale:1.1}}
                                            whileTap={{scale:0.95}}
                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-all"
                                        >
                                            <FiEdit size={18}/>
                                        </motion.button>
                                        <motion.button
                                            onClick={()=>handleDelete(prof)}
                                            whileHover={{scale:1.1}}
                                            whileTap={{scale:0.95}}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-all"
                                        >
                                            <FiTrash2 size={18}/>
                                        </motion.button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filtered.length===0 && (
                            <tr>
                                <td colSpan={12} className="text-center py-12 text-gray-500 text-lg">
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

            {/* Modal Detalles - Mejorado con diseño horizontal */}
            <AnimatePresence>
                {viewing && (
                    <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                onClick={()=>setViewing(null)}>
                        <motion.div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border-2 border-blue-400 text-black"
                                    initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}}
                                    onClick={(e)=>e.stopPropagation()}>
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                                <button className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 shadow hover:bg-gray-200 transition-colors" onClick={()=>setViewing(null)}>
                                    <FiX className="w-5 h-5"/>
                                </button>
                                <h2 className="text-2xl font-bold text-gray-800">Detalles del Profesor</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Información principal en layout horizontal */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Foto y datos básicos */}
                                    <div className="space-y-4">
                                        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mx-auto lg:mx-0 shadow-md">
                                            <img src={viewing.photo||'/placeholder.png'} alt="Foto" className="w-full h-full object-cover"/>
                                        </div>
                                        <div className="text-center lg:text-left">
                                            <h3 className="text-xl font-semibold text-gray-800">{viewing.nombre} {viewing.apellido}</h3>
                                            <p className="text-gray-600">{viewing.titulo}</p>
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
                                                <span className="font-medium text-gray-600">Teléfono:</span>
                                                <span>{viewing.telefono}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Email:</span>
                                                <span className="break-all">{viewing.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-600">Estado:</span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${viewing.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {viewing.estado}
                            </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos de ubicación y fecha */}
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
                                                <span>{viewing.fechaAlta}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Materias y horarios en layout horizontal */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Materias a dictar</h4>
                                        <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[100px]">
                                            {(viewing.materias||[]).length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {viewing.materias.map((materia, i) => (
                                                        <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                  {materia}
                                </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No hay materias asignadas</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Horarios disponibles</h4>
                                        <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[100px]">
                                            {viewing.horarios?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {viewing.horarios.map((h,i)=>(
                                                        <div key={i} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg shadow-sm">
                                                            <span className="font-medium text-gray-700">{h.dia}</span>
                                                            <span className="text-gray-600">{h.desde} - {h.hasta}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No hay horarios definidos</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Observaciones */}
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Observaciones</h4>
                                    <textarea
                                        readOnly
                                        rows={4}
                                        className="w-full border-2 border-gray-300 rounded-xl p-4 resize-none bg-gray-50 text-gray-700"
                                        value={viewing.observaciones||''}
                                        placeholder="Sin observaciones..."
                                    />
                                </div>

                                {/* Acciones */}
                                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                                    {viewing.cv && (
                                        <button
                                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                                            onClick={()=>window.open(viewing.cv,'_blank')}
                                        >
                                            <span>Ver CV</span>
                                        </button>
                                    )}
                                    <button
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        onClick={()=>{setViewing(null); openForm(viewing);}}
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

            {/* Modal Formulario - Completamente rediseñado */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                onClick={closeForm}>
                        <motion.div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden relative text-black"
                                    initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}}
                                    onClick={(e)=>e.stopPropagation()}>

                            {/* Header fijo */}
                            <div className="bg-purple-600 text-white p-6 flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{editing ? 'Editar Profesor' : 'Nuevo Profesor'}</h2>
                                <button type="button" className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors" onClick={closeForm}>
                                    <FiX className="w-6 h-6"/>
                                </button>
                            </div>

                            {/* Contenido con scroll */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
                                <div className="p-6 space-y-8">

                                    {/* Información Personal - Grid horizontal */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Información Personal
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[
                                                {label:'Nombre',name:'nombre',type:'text'},
                                                {label:'Apellido',name:'apellido',type:'text'},
                                                {label:'DNI',name:'dni',type:'number'},
                                                {label:'Teléfono',name:'telefono',type:'number'},
                                                {label:'Email',name:'email',type:'email'},
                                                {label:'Título',name:'titulo',type:'text'},
                                            ].map(({label,name,type})=>(
                                                <div key={name} className="flex flex-col">
                                                    <label className="text-sm font-medium mb-2 text-gray-700">{label}:</label>
                                                    <input
                                                        name={name}
                                                        type={type}
                                                        value={formData[name]}
                                                        onChange={handleChange}
                                                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ubicación y Detalles */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Ubicación y Detalles
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Dirección:</label>
                                                <input name="direccion" type="text" value={formData.direccion} onChange={handleChange} className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors" required />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Localidad:</label>
                                                <input name="localidad" type="text" value={formData.localidad} onChange={handleChange} className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors" required />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Estado:</label>
                                                <select name="estado" value={formData.estado} onChange={handleChange} className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors">
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium mb-2 text-gray-700">Fecha de alta:</label>
                                                <input name="fechaAlta" type="date" value={formData.fechaAlta} onChange={handleChange} className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors" required />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Archivos */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Archivos
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
                                                <label className="text-sm font-medium mb-2 text-gray-700 block">Foto del Profesor:</label>
                                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm text-black w-full" />
                                                {formData.photo && (
                                                    <div className="mt-3">
                                                        <img src={formData.photo} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
                                                <label className="text-sm font-medium mb-2 text-gray-700 block">Curriculum Vitae (PDF):</label>
                                                <input type="file" accept="application/pdf" onChange={handleCvChange} className="text-sm text-black w-full" />
                                                {formData.cv && (
                                                    <div className="mt-3">
                                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">PDF cargado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Materias */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Materias a Dictar
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={materiaDraft}
                                                    onChange={(e)=>setMateriaDraft(e.target.value)}
                                                    placeholder="Ej: Programación, Base de Datos..."
                                                    className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                />
                                                <button type="button" onClick={addMateria} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors">
                                                    <FiPlus className="w-4 h-4"/> Agregar
                                                </button>
                                            </div>
                                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[80px]">
                                                {formData.materias.length === 0 ? (
                                                    <span className="text-gray-500 italic">Agrega una o más materias</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.materias.map(m=>(
                                                            <span key={m} className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                      {m}
                                                                <button type="button" onClick={()=>removeMateria(m)} className="hover:text-red-600 transition-colors">×</button>
                                    </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horarios */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Días y Horarios Disponibles
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-medium mb-2 text-gray-700 block">Día:</label>
                                                    <select
                                                        value={horarioDraft.dia}
                                                        onChange={(e)=>setHorarioDraft(d=>({...d, dia:e.target.value}))}
                                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    >
                                                        {diasSemana.map(d=><option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-2 text-gray-700 block">Desde:</label>
                                                    <input
                                                        type="time"
                                                        value={horarioDraft.desde}
                                                        onChange={(e)=>setHorarioDraft(d=>({...d, desde:e.target.value}))}
                                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-2 text-gray-700 block">Hasta:</label>
                                                    <input
                                                        type="time"
                                                        value={horarioDraft.hasta}
                                                        onChange={(e)=>setHorarioDraft(d=>({...d, hasta:e.target.value}))}
                                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <button type="button" onClick={addHorario} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors whitespace-nowrap">
                                                    <FiPlus className="w-4 h-4"/> Agregar
                                                </button>
                                            </div>

                                            {/* Lista de horarios */}
                                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[100px]">
                                                {formData.horarios.length === 0 ? (
                                                    <div className="text-gray-500 italic">Agrega al menos un horario disponible</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {formData.horarios.map((h,idx)=>(
                                                            <div key={`${h.dia}-${h.desde}-${h.hasta}-${idx}`} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                                                                <div className="text-black">
                                                                    <div className="font-medium text-sm">{h.dia}</div>
                                                                    <div className="text-xs text-gray-600">{h.desde} - {h.hasta}</div>
                                                                </div>
                                                                <button type="button" onClick={()=>removeHorario(idx)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Eliminar">
                                                                    <FiMinus className="w-4 h-4"/>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
                                            Observaciones
                                        </h3>
                                        <textarea
                                            name="observaciones"
                                            value={formData.observaciones}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full border-2 border-gray-300 rounded-lg p-3 text-black focus:border-purple-500 focus:outline-none transition-colors resize-none"
                                            placeholder="Observaciones adicionales sobre el profesor..."
                                        />
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
                                        <span>{editing ? 'Guardar Cambios' : 'Crear Profesor'}</span>
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