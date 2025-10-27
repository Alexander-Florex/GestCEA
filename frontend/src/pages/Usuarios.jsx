// src/pages/Usuarios.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiEyeOff } from 'react-icons/fi';
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
                return 'bg-red-100 text-red-800';
            case 'Supervisor':
                return 'bg-blue-100 text-blue-800';
            case 'Usuario':
            case 'Personal':
                return 'bg-green-100 text-green-800';
            case 'Profesor':
                return 'bg-purple-100 text-purple-800';
            case 'Contador':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <button
                        onClick={() => openForm(null)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center space-x-2"
                    >
                        <FiX className="rotate-45" size={20} />
                        <span>Nuevo Usuario</span>
                    </button>
                </div>

                {/* Barra de búsqueda */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido, DNI, correo o rol..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-black"
                    />
                </div>

                {/* Tabla de usuarios */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">ID</th>
                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Nombre</th>
                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">DNI</th>
                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Correo</th>
                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Rol</th>
                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Estado</th>
                            <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {filtered.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-900">#{user.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                    {user.nombre} {user.apellido}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{user.dni}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{user.correo}</td>
                                <td className="px-6 py-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRolColor(user.rol)}`}>
                                            {user.rol}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            user.activo !== false
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.activo !== false ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={() => setViewing(user)}
                                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                                            title="Ver detalles"
                                        >
                                            <FiEye size={16} />
                                        </button>
                                        <button
                                            onClick={() => openForm(user)}
                                            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <FiEdit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    {search ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de visualización */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 relative space-y-4 text-black border-2 border-blue-400"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                                onClick={() => setViewing(null)}
                                title="Cerrar"
                            >
                                <FiX size={20} />
                            </button>
                            <h2 className="text-xl font-semibold">Detalles del Usuario</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { label: 'Nombre', value: viewing.nombre },
                                    { label: 'Apellido', value: viewing.apellido },
                                    { label: 'DNI', value: viewing.dni },
                                    { label: 'Dirección', value: viewing.direccion || 'N/A' },
                                    { label: 'Localidad', value: viewing.localidad || 'N/A' },
                                    { label: 'Teléfono', value: viewing.telefono || 'N/A' },
                                    { label: 'Correo', value: viewing.correo },
                                ].map((field, i) => (
                                    <div key={i} className="flex flex-col">
                                        <label className="font-medium text-sm text-gray-600">{field.label}:</label>
                                        <div className="mt-1 w-full border-2 border-gray-300 rounded-xl p-2 text-black bg-gray-50">
                                            {field.value}
                                        </div>
                                    </div>
                                ))}
                                <div className="flex flex-col">
                                    <label className="font-medium text-sm text-gray-600">Contraseña:</label>
                                    <div className="mt-1 w-full flex items-center border-2 border-gray-300 rounded-xl p-2 text-black bg-gray-50">
                                        <div className="flex-grow">
                                            {showPassword ? viewing.contraseña : '•'.repeat(viewing.contraseña.length)}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="ml-2 text-gray-500 hover:text-gray-700"
                                            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-sm text-gray-600">Rol:</label>
                                    <div className="mt-1 w-full border-2 border-gray-300 rounded-xl p-2 bg-gray-50">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolColor(viewing.rol)}`}>
                                            {viewing.rol}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-sm text-gray-600">Estado:</label>
                                    <div className="mt-1 w-full border-2 border-gray-300 rounded-xl p-2 bg-gray-50">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            viewing.activo !== false
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {viewing.activo !== false ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
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
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeForm}
                    >
                        <motion.form
                            onSubmit={handleSubmit}
                            className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 relative space-y-4 text-black max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                                onClick={closeForm}
                                title="Cerrar"
                            >
                                <FiX size={20} />
                            </button>
                            <h2 className="text-xl font-semibold mb-4">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: 'Nombre', name: 'nombre', type: 'text', required: true },
                                    { label: 'Apellido', name: 'apellido', type: 'text', required: true },
                                    { label: 'DNI', name: 'dni', type: 'text', required: true },
                                    { label: 'Dirección', name: 'direccion', type: 'text', required: false },
                                    { label: 'Localidad', name: 'localidad', type: 'text', required: false },
                                    { label: 'Teléfono', name: 'telefono', type: 'tel', required: false },
                                    { label: 'Correo', name: 'correo', type: 'email', required: true },
                                    { label: 'Contraseña', name: 'contraseña', type: 'password', required: true }
                                ].map(({ label, name, type, required }) => (
                                    <div key={name} className="flex flex-col">
                                        <label className="text-sm font-medium mb-1">
                                            {label}{required && <span className="text-red-500">*</span>}:
                                        </label>
                                        <input
                                            name={name}
                                            type={type}
                                            value={formData[name]}
                                            onChange={handleChange}
                                            className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                                            required={required}
                                        />
                                    </div>
                                ))}

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Rol<span className="text-red-500">*</span>:</label>
                                    <select
                                        name="rol"
                                        value={formData.rol}
                                        onChange={handleChange}
                                        className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                                        required
                                    >
                                        <option value="Usuario">Usuario</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Supervisor">Supervisor</option>
                                        <option value="Profesor">Profesor</option>
                                        <option value="Contador">Contador</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Estado:</label>
                                    <div className="flex items-center space-x-2 h-full">
                                        <input
                                            type="checkbox"
                                            name="activo"
                                            checked={formData.activo}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Usuario activo</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                                >
                                    {editing ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}