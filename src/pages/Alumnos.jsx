// src/pages/Alumnos.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

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
    const { students, addStudent, updateStudent, removeStudent } = useDB();
    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({});
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
                    f.toLowerCase().includes(search.toLowerCase())
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

    // Manejo inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((fd) => ({ ...fd, [name]: value }));
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
            } else {
                addStudent({ ...formData });
                showNotification('success', 'Alumno creado correctamente');
            }
            closeForm();
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

    return (
        <div className="p-6 relative">
            <Notifications notifications={notifications} remove={removeNotification} />

            {/* Buscador + Nuevo */}
            <div className="flex mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o DNI..."
                    className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition"
                    onClick={() => openForm(null)}
                >
                    Nuevo Alumno
                </button>
            </div>

            {/* Tabla */}
            <div className="overflow-auto border-2 border-purple-500 rounded-lg">
                <table className="min-w-full bg-white">
                    <thead className="bg-purple-500 text-white">
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
                            <th key={h} className="px-4 py-2 whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((alumno) => (
                        <motion.tr
                            key={alumno.id}
                            className="hover:bg-gray-50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {[
                                alumno.id,
                                alumno.nombre,
                                alumno.apellido,
                                alumno.dni,
                                alumno.telefono,
                                alumno.email.length > 10
                                    ? alumno.email.slice(0, 10) + '…'
                                    : alumno.email,
                                alumno.direccion,
                                alumno.localidad,
                                alumno.estado,
                            ].map((c, i) => (
                                <td key={i} className="px-4 py-2 text-black">
                                    {c}
                                </td>
                            ))}
                            <td className="px-4 py-2 space-x-2">
                                <motion.button
                                    onClick={() => setViewing(alumno)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-black hover:text-purple-700"
                                >
                                    <FiEye size={18} />
                                </motion.button>
                                <motion.button
                                    onClick={() => openForm(alumno)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-black hover:text-purple-700"
                                >
                                    <FiEdit size={18} />
                                </motion.button>
                                <motion.button
                                    onClick={() => handleDelete(alumno)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <FiTrash2 size={18} />
                                </motion.button>
                            </td>
                        </motion.tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan="10" className="text-center py-6 text-gray-500">
                                No hay resultados
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Modal Ver Detalles - Mejorado con diseño horizontal */}
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

                                {/* Acciones */}
                                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
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

            {/* Modal Crear/Editar - Completamente rediseñado */}
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