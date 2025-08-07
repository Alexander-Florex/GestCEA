// src/pages/Usuarios.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiEyeOff } from 'react-icons/fi';

// Datos simulados iniciales de usuarios
const initialUsers = [
    {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        direccion: 'Av. Corrientes 1234',
        localidad: 'Buenos Aires',
        telefono: '11-1234-5678',
        correo: 'juan.perez@email.com',
        contraseña: 'password123',
        rol: 'Administrador'
    },
    {
        id: 2,
        nombre: 'María',
        apellido: 'González',
        dni: '87654321',
        direccion: 'Calle Falsa 456',
        localidad: 'Córdoba',
        telefono: '351-987-6543',
        correo: 'maria.gonzalez@email.com',
        contraseña: 'password456',
        rol: 'Supervisor'
    },
    {
        id: 3,
        nombre: 'Carlos',
        apellido: 'López',
        dni: '11223344',
        direccion: 'San Martín 789',
        localidad: 'Rosario',
        telefono: '341-555-7890',
        correo: 'carlos.lopez@email.com',
        contraseña: 'password789',
        rol: 'Personal'
    }
];

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
    const [users, setUsers] = useState(initialUsers);
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
        rol: 'Personal'
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
                direccion: user.direccion,
                localidad: user.localidad,
                telefono: user.telefono,
                correo: user.correo,
                contraseña: user.contraseña,
                rol: user.rol
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
                rol: 'Personal'
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(fd => ({ ...fd, [name]: value }));
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
                throw new Error('El correo electrónico no tiene un formato válido');
            }

            if (!validateDNI(formData.dni)) {
                throw new Error('El DNI debe tener 7 u 8 dígitos');
            }

            // Verificar DNI único
            const existingUserWithDNI = users.find(u => u.dni === formData.dni && (!editing || u.id !== editing.id));
            if (existingUserWithDNI) {
                throw new Error('Ya existe un usuario con ese DNI');
            }

            // Verificar correo único
            const existingUserWithEmail = users.find(u => u.correo === formData.correo && (!editing || u.id !== editing.id));
            if (existingUserWithEmail) {
                throw new Error('Ya existe un usuario con ese correo electrónico');
            }

            const userData = {
                id: editing ? editing.id : Math.max(0, ...users.map(u => u.id)) + 1,
                nombre: formData.nombre,
                apellido: formData.apellido,
                dni: formData.dni,
                direccion: formData.direccion,
                localidad: formData.localidad,
                telefono: formData.telefono,
                correo: formData.correo,
                contraseña: formData.contraseña,
                rol: formData.rol
            };

            if (editing) {
                setUsers(us => us.map(u => u.id === editing.id ? userData : u));
                showNotification('success', 'Usuario editado correctamente');
            } else {
                setUsers(us => [...us, userData]);
                showNotification('success', 'Usuario creado correctamente');
            }
            closeForm();
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = (user) => {
        if (window.confirm(`¿Eliminar usuario "${user.nombre} ${user.apellido}"?`)) {
            setUsers(us => us.filter(u => u.id !== user.id));
            showNotification('success', 'Usuario eliminado');
        }
    };

    const getRolColor = (rol) => {
        switch (rol) {
            case 'Administrador':
                return 'bg-red-100 text-red-800';
            case 'Supervisor':
                return 'bg-blue-100 text-blue-800';
            case 'Personal':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="p-6 relative">
            <Notifications notifications={notifications} remove={removeNotification} />

            <div className="flex mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre, apellido, DNI, correo o rol..."
                    className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button
                    onClick={() => openForm(null)}
                    className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition"
                >
                    Nuevo Usuario
                </button>
            </div>

            <div className="overflow-auto border-2 border-purple-500 rounded-lg">
                <table className="min-w-full bg-white">
                    <thead className="bg-purple-500 text-white">
                    <tr>
                        {[
                            'ID', 'Nombre', 'Apellido', 'DNI', 'Dirección', 'Localidad',
                            'Teléfono', 'Correo', 'Contraseña', 'Rol', 'Acciones'
                        ].map(h => (
                            <th key={h} className="px-4 py-2 whitespace-nowrap">{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map(user => (
                        <motion.tr
                            key={user.id}
                            className="hover:bg-gray-50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <td className="px-4 py-2 text-black">{user.id}</td>
                            <td className="px-4 py-2 text-black">{user.nombre}</td>
                            <td className="px-4 py-2 text-black">{user.apellido}</td>
                            <td className="px-4 py-2 text-black">{user.dni}</td>
                            <td className="px-4 py-2 text-black">{user.direccion}</td>
                            <td className="px-4 py-2 text-black">{user.localidad}</td>
                            <td className="px-4 py-2 text-black">{user.telefono}</td>
                            <td className="px-4 py-2 text-black">{user.correo}</td>
                            <td className="px-4 py-2 text-black">{'•'.repeat(user.contraseña.length)}</td>
                            <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolColor(user.rol)}`}>
                    {user.rol}
                  </span>
                            </td>
                            <td className="px-4 py-2 space-x-2">
                                <motion.button
                                    onClick={() => setViewing(user)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-black hover:text-purple-700"
                                    title="Ver detalles"
                                >
                                    <FiEye size={18} />
                                </motion.button>
                                <motion.button
                                    onClick={() => openForm(user)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-black hover:text-purple-700"
                                    title="Editar usuario"
                                >
                                    <FiEdit size={18} />
                                </motion.button>
                                <motion.button
                                    onClick={() => handleDelete(user)}
                                    whileHover={{ scale: 1.2 }}
                                    className="text-red-500 hover:text-red-700"
                                    title="Eliminar usuario"
                                >
                                    <FiTrash2 size={18} />
                                </motion.button>
                            </td>
                        </motion.tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={11} className="text-center py-4 text-gray-500">
                                {search ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios disponibles.'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
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
                                    { label: 'Dirección', value: viewing.direccion },
                                    { label: 'Localidad', value: viewing.localidad },
                                    { label: 'Teléfono', value: viewing.telefono },
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
                                        <option value="Personal">Personal</option>
                                        <option value="Supervisor">Supervisor</option>
                                        <option value="Administrador">Administrador</option>
                                    </select>
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