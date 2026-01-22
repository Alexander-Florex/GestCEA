// src/pages/Usuarios.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiEyeOff, FiUser, FiMail, FiPhone, FiMapPin, FiKey, FiShield, FiSearch, FiPlus, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

// Componente de notificaciones mejorado
function Notifications({ notifications, remove }) {
    return (
        <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50 w-full max-w-sm sm:max-w-md">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.3 }}
                        className={`px-4 py-3 rounded-lg shadow-lg cursor-pointer flex items-center justify-between ${n.type === 'success'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                        }`}
                        onClick={() => remove(n.id)}
                    >
                        <div className="flex items-center space-x-3">
                            {n.type === 'success' ? (
                                <FiCheck className="w-5 h-5" />
                            ) : (
                                <FiAlertCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">{n.message}</span>
                        </div>
                        <FiX className="w-4 h-4 opacity-70 hover:opacity-100" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default function Usuarios() {
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
        rol: 'Usuario',
        activo: true
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
                updateUser(editing.id, formData);
                showNotification('success', 'Usuario actualizado correctamente');
            } else {
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
        const colors = {
            'Administrador': 'bg-red-100 text-red-800 border-red-300',
            'Supervisor': 'bg-blue-100 text-blue-800 border-blue-300',
            'Usuario': 'bg-green-100 text-green-800 border-green-300',
            'Personal': 'bg-green-100 text-green-800 border-green-300',
            'Profesor': 'bg-purple-100 text-purple-800 border-purple-300',
            'Contador': 'bg-amber-100 text-amber-800 border-amber-300'
        };
        return colors[rol] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-3 sm:p-4 md:p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
                {/* Header Mejorado */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Gestión de Usuarios</h1>
                        <p className="text-gray-600 mt-2 text-sm sm:text-base">Administra los usuarios del sistema de forma segura y eficiente</p>
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 w-full sm:w-auto group"
                    >
                        <FiPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-sm sm:text-base">Nuevo Usuario</span>
                    </button>
                </div>

                {/* Barra de búsqueda Mejorada */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido, DNI, correo o rol..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-black text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Tabla de usuarios Mejorada */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DNI</th>
                                <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Correo</th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rol</th>
                                <th className="hidden xs:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                                <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">#{user.id}</td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                                <FiUser className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{user.nombre} {user.apellido}</div>
                                                <div className="text-xs text-gray-500 sm:hidden">{user.correo}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{user.dni}</td>
                                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.correo}</td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRolColor(user.rol)}`}>
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td className="hidden xs:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.activo !== false
                                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                                        }`}>
                                            {user.activo !== false ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex justify-center space-x-1 sm:space-x-2">
                                            <button
                                                onClick={() => setViewing(user)}
                                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
                                                title="Ver detalles"
                                            >
                                                <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                            <button
                                                onClick={() => openForm(user)}
                                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all duration-200 hover:scale-105"
                                                title="Editar"
                                            >
                                                <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-4 sm:px-6 py-12 sm:py-16 text-center">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                                <FiUser className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg sm:text-xl font-semibold text-gray-900">
                                                    {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {search ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando un nuevo usuario'}
                                                </p>
                                            </div>
                                            {!search && (
                                                <button
                                                    onClick={() => openForm(null)}
                                                    className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-md transition-all duration-300"
                                                >
                                                    Agregar primer usuario
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
            </div>

            {/* Modal de visualización - MEJORADO */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del modal */}
                            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 sm:p-6 rounded-t-2xl z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white/10 rounded-full p-2 sm:p-3">
                                            <FiUser className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold">Detalles del Usuario</h2>
                                            <p className="text-gray-300 text-sm">Información completa del usuario</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewing(null)}
                                        className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                                        title="Cerrar"
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenido del modal */}
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                {/* Información principal */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Columna izquierda */}
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiUser className="text-blue-600" />
                                                Información Personal
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Nombre completo:</span>
                                                    <span className="font-semibold text-gray-800 text-right">{viewing.nombre} {viewing.apellido}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">DNI:</span>
                                                    <span className="font-mono text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-300 text-sm">{viewing.dni}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiMail className="text-emerald-600" />
                                                Contacto
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Correo:</span>
                                                    <span className="font-semibold text-gray-800 text-right break-all">{viewing.correo}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Teléfono:</span>
                                                    <span className="font-semibold text-gray-800">{viewing.telefono || 'No especificado'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna derecha */}
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiMapPin className="text-amber-600" />
                                                Dirección
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Dirección:</span>
                                                    <span className="font-semibold text-gray-800 text-right">{viewing.direccion || 'No especificada'}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Localidad:</span>
                                                    <span className="font-semibold text-gray-800">{viewing.localidad || 'No especificada'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiShield className="text-purple-600" />
                                                Permisos y Estado
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Rol:</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRolColor(viewing.rol)}`}>
                                                        {viewing.rol}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                    <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Estado:</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${viewing.activo !== false
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
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-300">
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <FiKey className="text-gray-600" />
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
                                            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                                            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => { setViewing(null); openForm(viewing); }}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>Editar Usuario</span>
                                    </button>
                                    <button
                                        onClick={() => setViewing(null)}
                                        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de formulario MEJORADO */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeForm}
                    >
                        <motion.form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del formulario */}
                            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 sm:p-6 rounded-t-2xl z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white/10 rounded-full p-2 sm:p-3">
                                            <FiUser className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                                            <p className="text-gray-300 text-sm">
                                                {editing ? 'Modifica la información del usuario' : 'Completa los datos del nuevo usuario'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                                        onClick={closeForm}
                                        title="Cerrar"
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenido del formulario */}
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {[
                                        { label: 'Nombre', name: 'nombre', type: 'text', required: true, icon: FiUser, colSpan: 'sm:col-span-1' },
                                        { label: 'Apellido', name: 'apellido', type: 'text', required: true, icon: FiUser, colSpan: 'sm:col-span-1' },
                                        { label: 'DNI', name: 'dni', type: 'text', required: true, icon: FiUser, colSpan: 'sm:col-span-1' },
                                        { label: 'Dirección', name: 'direccion', type: 'text', required: false, icon: FiMapPin, colSpan: 'sm:col-span-1' },
                                        { label: 'Localidad', name: 'localidad', type: 'text', required: false, icon: FiMapPin, colSpan: 'sm:col-span-1' },
                                        { label: 'Teléfono', name: 'telefono', type: 'tel', required: false, icon: FiPhone, colSpan: 'sm:col-span-1' },
                                        { label: 'Correo', name: 'correo', type: 'email', required: true, icon: FiMail, colSpan: 'sm:col-span-2' },
                                        { label: 'Contraseña', name: 'contraseña', type: showPassword ? 'text' : 'password', required: true, icon: FiKey, colSpan: 'sm:col-span-2' }
                                    ].map(({ label, name, type, required, icon: Icon, colSpan }) => (
                                        <div key={name} className={`flex flex-col ${colSpan}`}>
                                            <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-blue-600" />
                                                {label}{required && <span className="text-red-500">*</span>}:
                                            </label>
                                            <div className="relative">
                                                <input
                                                    name={name}
                                                    type={type}
                                                    value={formData[name]}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-sm"
                                                    required={required}
                                                    placeholder={`Ingrese ${label.toLowerCase()}`}
                                                />
                                                {name === 'contraseña' && (
                                                    <button
                                                        type="button"
                                                        onClick={togglePasswordVisibility}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex flex-col sm:col-span-1">
                                        <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <FiShield className="w-4 h-4 text-blue-600" />
                                            Rol<span className="text-red-500">*</span>:
                                        </label>
                                        <select
                                            name="rol"
                                            value={formData.rol}
                                            onChange={handleChange}
                                            className="border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-sm"
                                            required
                                        >
                                            <option value="Usuario">Usuario</option>
                                            <option value="Administrador">Administrador</option>
                                            <option value="Supervisor">Supervisor</option>
                                            <option value="Profesor">Profesor</option>
                                            <option value="Contador">Contador</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col justify-center sm:col-span-1">
                                        <label className="text-sm font-medium mb-2">Estado:</label>
                                        <div className="flex items-center space-x-3 h-full bg-gray-50 rounded-lg p-3 border-2 border-gray-300">
                                            <input
                                                type="checkbox"
                                                name="activo"
                                                checked={formData.activo}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 font-medium">Usuario activo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
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