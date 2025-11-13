// src/pages/Usuarios.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiEyeOff, FiUser, FiMail, FiPhone, FiMapPin, FiKey, FiShield } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx"; // ✅ IMPORTAR useDB

// Componente de notificaciones animadas
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
                        className={`px-4 py-2 rounded shadow cursor-pointer ${
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

export default function Usuarios() {
    // ✅ USAR AppDB en lugar de estado local
    const { users, addUser, updateUser, removeUser } = useDB();

    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        direccion: '',
        localidad: '',
        telefono: '',
        correo: '',
        contraseña: '',
        rol: 'Usuario', // ✅ Cambiado de 'Personal' a 'Usuario' para coincidir con el esquema
        activo: true // ✅ Agregado campo activo
    });
    const [notifications, setNotifications] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };

    const removeNotification = (id) => {
        setNotifications(n => n.filter(x => x.id !== id));
    };

    const filtered = useMemo(
        () =>
            users.filter(u =>
                u.nombre.toLowerCase().includes(search.toLowerCase()) ||
                u.apellido.toLowerCase().includes(search.toLowerCase()) ||
                u.dni.includes(search) ||
                u.correo.toLowerCase().includes(search.toLowerCase()) ||
                u.rol.toLowerCase().includes(search.toLowerCase())
            ),
        [users, search]
    );

    const openForm = (user) => {
        if (user) {
            setEditing(user);
            setFormData({
                nombre: user.nombre,
                apellido: user.apellido,
                dni: user.dni,
                direccion: user.direccion || '',
                localidad: user.localidad || '',
                telefono: user.telefono || '',
                correo: user.correo,
                contraseña: user.contraseña,
                rol: user.rol,
                activo: user.activo !== false
            });
        } else {
            setEditing(null);
            setFormData({
                nombre: '',
                apellido: '',
                dni: '',
                direccion: '',
                localidad: '',
                telefono: '',
                correo: '',
                contraseña: '',
                rol: 'Usuario',
                activo: true
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(fd => ({
            ...fd,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateDNI = (dni) => {
        return /^\d{7,8}$/.test(dni);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            // Validaciones
            if (!formData.nombre || !formData.apellido || !formData.dni || !formData.correo || !formData.contraseña) {
                throw new Error('Todos los campos son obligatorios');
            }

            if (!validateEmail(formData.correo)) {
                throw new Error('El correo electrónico no es válido');
            }

            if (!validateDNI(formData.dni)) {
                throw new Error('El DNI debe tener 7 u 8 dígitos');
            }

            if (formData.contraseña.length < 4) {
                throw new Error('La contraseña debe tener al menos 4 caracteres');
            }

            if (editing) {
                // ✅ Actualizar usuario existente usando AppDB
                updateUser(editing.id, formData);
                showNotification('success', 'Usuario actualizado correctamente');
            } else {
                // ✅ Crear nuevo usuario usando AppDB
                addUser(formData);
                showNotification('success', 'Usuario creado correctamente');
            }

            closeForm();
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = (user) => {
        if (window.confirm(`¿Está seguro de eliminar al usuario ${user.nombre} ${user.apellido}?`)) {
            try {
                // ✅ Eliminar usuario usando AppDB
                removeUser(user.id);
                showNotification('success', 'Usuario eliminado correctamente');
            } catch (err) {
                showNotification('error', err.message);
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const getRolColor = (rol) => {
        switch (rol) {
            case 'Administrador':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'Supervisor':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Usuario':
            case 'Personal':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'Profesor':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'Contador':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50 p-4 lg:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-4xl font-bold text-gray-800">Gestión de Usuarios</h1>
                        <p className="text-gray-600 mt-1 text-sm lg:text-base">Administra los usuarios del sistema</p>
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-4 lg:px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center space-x-2 w-full lg:w-auto"
                    >
                        <FiX className="rotate-45" size={18} />
                        <span>Nuevo Usuario</span>
                    </button>
                </div>

                {/* Barra de búsqueda */}
                <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido, DNI, correo o rol..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-black text-sm lg:text-base"
                    />
                </div>

                {/* Tabla de usuarios */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-red-600 to-blue-600 text-white">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold uppercase">ID</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold uppercase">Nombre</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold uppercase">DNI</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold uppercase">Correo</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold uppercase">Rol</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold uppercase">Estado</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm font-bold uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {filtered.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-900 font-semibold">#{user.id}</td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-900 font-medium">
                                        {user.nombre} {user.apellido}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{user.dni}</td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{user.correo}</td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm">
                                        <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-bold border ${getRolColor(user.rol)}`}>
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm">
                                        <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-bold ${
                                            user.activo !== false
                                                ? 'bg-green-100 text-green-800 border border-green-300'
                                                : 'bg-red-100 text-red-800 border border-red-300'
                                        }`}>
                                            {user.activo !== false ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm">
                                        <div className="flex justify-center space-x-1 lg:space-x-2">
                                            <button
                                                onClick={() => setViewing(user)}
                                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                                                title="Ver detalles"
                                            >
                                                <FiEye size={14} className="lg:w-4 lg:h-4" />
                                            </button>
                                            <button
                                                onClick={() => openForm(user)}
                                                className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <FiEdit size={14} className="lg:w-4 lg:h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 size={14} className="lg:w-4 lg:h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 lg:py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <FiUser className="w-8 h-8 lg:w-12 lg:h-12 text-gray-300" />
                                            <p className="text-base lg:text-lg font-medium">
                                                {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {search ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando un nuevo usuario'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de visualización - MEJORADO */}
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
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto relative max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del modal */}
                            <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white/20 rounded-full p-3">
                                            <FiUser className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl lg:text-2xl font-bold">Detalles del Usuario</h2>
                                            <p className="text-blue-100 text-sm">Información completa del usuario</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewing(null)}
                                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                                        title="Cerrar"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Contenido del modal */}
                            <div className="p-6 space-y-6">
                                {/* Información principal */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Columna izquierda */}
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-red-50 to-blue-50 rounded-xl p-4 border-2 border-red-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiUser className="text-red-600" />
                                                Información Personal
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">Nombre completo:</span>
                                                    <span className="font-semibold text-gray-800">{viewing.nombre} {viewing.apellido}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">DNI:</span>
                                                    <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded border">{viewing.dni}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-blue-50 to-red-50 rounded-xl p-4 border-2 border-blue-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiMail className="text-blue-600" />
                                                Contacto
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">Correo:</span>
                                                    <span className="font-semibold text-gray-800">{viewing.correo}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                                                    <span className="font-semibold text-gray-800">{viewing.telefono || 'No especificado'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna derecha */}
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-red-50 to-blue-50 rounded-xl p-4 border-2 border-red-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiMapPin className="text-red-600" />
                                                Dirección
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">Dirección:</span>
                                                    <span className="font-semibold text-gray-800 text-right">{viewing.direccion || 'No especificada'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">Localidad:</span>
                                                    <span className="font-semibold text-gray-800">{viewing.localidad || 'No especificada'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-blue-50 to-red-50 rounded-xl p-4 border-2 border-blue-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiShield className="text-blue-600" />
                                                Permisos y Estado
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">Rol:</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRolColor(viewing.rol)}`}>
                                                        {viewing.rol}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">Estado:</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        viewing.activo !== false
                                                            ? 'bg-green-100 text-green-800 border border-green-300'
                                                            : 'bg-red-100 text-red-800 border border-red-300'
                                                    }`}>
                                                        {viewing.activo !== false ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contraseña */}
                                <div className="bg-gradient-to-br from-red-50 to-blue-50 rounded-xl p-4 border-2 border-red-200">
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <FiKey className="text-red-600" />
                                        Credenciales de Acceso
                                    </h3>
                                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-300">
                                        <div className="flex-grow">
                                            <span className="text-sm font-medium text-gray-600 mr-4">Contraseña:</span>
                                            <span className="font-mono text-gray-800">
                                                {showPassword ? viewing.contraseña : '•'.repeat(12)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="text-gray-500 hover:text-gray-700 transition-colors"
                                            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => { setViewing(null); openForm(viewing); }}
                                        className="flex-1 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiEdit size={18} />
                                        <span>Editar Usuario</span>
                                    </button>
                                    <button
                                        onClick={() => setViewing(null)}
                                        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-all"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de formulario */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeForm}
                    >
                        <motion.form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto relative max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del formulario */}
                            <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white/20 rounded-full p-3">
                                            <FiUser className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl lg:text-2xl font-bold">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                                            <p className="text-blue-100 text-sm">
                                                {editing ? 'Modifica la información del usuario' : 'Completa los datos del nuevo usuario'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                                        onClick={closeForm}
                                        title="Cerrar"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Contenido del formulario */}
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Nombre', name: 'nombre', type: 'text', required: true, icon: FiUser },
                                        { label: 'Apellido', name: 'apellido', type: 'text', required: true, icon: FiUser },
                                        { label: 'DNI', name: 'dni', type: 'text', required: true, icon: FiUser },
                                        { label: 'Dirección', name: 'direccion', type: 'text', required: false, icon: FiMapPin },
                                        { label: 'Localidad', name: 'localidad', type: 'text', required: false, icon: FiMapPin },
                                        { label: 'Teléfono', name: 'telefono', type: 'tel', required: false, icon: FiPhone },
                                        { label: 'Correo', name: 'correo', type: 'email', required: true, icon: FiMail },
                                        { label: 'Contraseña', name: 'contraseña', type: 'password', required: true, icon: FiKey }
                                    ].map(({ label, name, type, required, icon: Icon }) => (
                                        <div key={name} className="flex flex-col">
                                            <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-red-600" />
                                                {label}{required && <span className="text-red-500">*</span>}:
                                            </label>
                                            <input
                                                name={name}
                                                type={type}
                                                value={formData[name]}
                                                onChange={handleChange}
                                                className="border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-red-500 focus:outline-none transition-colors text-sm lg:text-base"
                                                required={required}
                                                placeholder={`Ingrese ${label.toLowerCase()}`}
                                            />
                                        </div>
                                    ))}

                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <FiShield className="w-4 h-4 text-blue-600" />
                                            Rol<span className="text-red-500">*</span>:
                                        </label>
                                        <select
                                            name="rol"
                                            value={formData.rol}
                                            onChange={handleChange}
                                            className="border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-blue-500 focus:outline-none transition-colors text-sm lg:text-base"
                                            required
                                        >
                                            <option value="Usuario">Usuario</option>
                                            <option value="Administrador">Administrador</option>
                                            <option value="Supervisor">Supervisor</option>
                                            <option value="Profesor">Profesor</option>
                                            <option value="Contador">Contador</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col justify-center">
                                        <label className="text-sm font-medium mb-2">Estado:</label>
                                        <div className="flex items-center space-x-3 h-full bg-gray-50 rounded-lg p-3 border-2 border-gray-300">
                                            <input
                                                type="checkbox"
                                                name="activo"
                                                checked={formData.activo}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-700 font-medium">Usuario activo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
                                    >
                                        {editing ? 'Guardar Cambios' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}