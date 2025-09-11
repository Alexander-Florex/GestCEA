// src/pages/Becas.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Notificaciones ==================== */

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

/* ==================== Página Becas ==================== */

export default function Becas() {
    const { becas, addBeca, updateBeca, removeBeca } = useDB();

    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const [formData, setFormData] = useState({
        tipo: 'Media',
        monto: '',
        activa: true
    });

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };
    const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

    const filtered = useMemo(() => {
        return becas.filter(beca =>
            beca.tipo.toLowerCase().includes(search.toLowerCase())
        );
    }, [becas, search]);

    /* ============ Abrir/Cerrar Form ============ */

    const openForm = (beca) => {
        if (beca) {
            setEditing(beca);
            setFormData({
                tipo: beca.tipo,
                monto: String(beca.monto),
                activa: beca.activa
            });
        } else {
            setEditing(null);
            setFormData({
                tipo: 'Media',
                monto: '',
                activa: true
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
    };

    /* ============ Handlers Form ============ */

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(fd => ({
            ...fd,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (!formData.monto || isNaN(Number(formData.monto))) {
                throw new Error('El monto debe ser un número válido');
            }

            const becaData = {
                tipo: formData.tipo,
                monto: Number(formData.monto),
                activa: formData.activa
            };

            if (editing) {
                updateBeca(editing.id, becaData);
                showNotification('success', 'Beca editada correctamente');
            } else {
                addBeca(becaData);
                showNotification('success', 'Beca creada correctamente');
            }
            closeForm();
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleDelete = (beca) => {
        if (window.confirm(`¿Eliminar beca "${beca.tipo}"?`)) {
            removeBeca(beca.id);
            showNotification('success', 'Beca eliminada');
        }
    };

    const toggleActive = (beca) => {
        updateBeca(beca.id, { activa: !beca.activa });
        showNotification('success', `Beca ${beca.activa ? 'desactivada' : 'activada'}`);
    };

    /* ==================== Render ==================== */

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header y Buscador */}
                <div className="mb-6 space-y-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestión de Becas</h1>
                        <p className="text-gray-600">Administra las becas disponibles para estudiantes</p>
                    </div>

                    <div className="flex shadow-lg rounded-xl overflow-hidden">
                        <input
                            type="text"
                            placeholder="Buscar por tipo de beca..."
                            className="flex-grow px-6 py-4 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-l-xl focus:outline-none focus:from-white focus:to-blue-50 focus:border-blue-600 text-black placeholder-blue-600 text-lg"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button
                            onClick={() => openForm(null)}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-r-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold text-lg shadow-lg"
                        >
                            Nueva Beca
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                            <tr>
                                {['ID', 'Tipo de Beca', 'Monto', 'Estado', 'Acciones'].map(h => (
                                    <th key={h} className="px-6 py-4 text-left font-semibold tracking-wide">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filtered.map((beca, index) => (
                                <motion.tr
                                    key={beca.id}
                                    className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 ${
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <td className="px-6 py-4 text-black font-bold text-lg">#{beca.id}</td>
                                    <td className="px-6 py-4 text-black font-semibold">Beca {beca.tipo}</td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">${beca.monto.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleActive(beca)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors ${
                                                beca.activa
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}
                                        >
                                            {beca.activa ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            <motion.button
                                                onClick={() => setViewing(beca)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                <FiEye size={20} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openForm(beca)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-full hover:bg-green-50"
                                                title="Editar beca"
                                            >
                                                <FiEdit size={20} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(beca)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50"
                                                title="Eliminar beca"
                                            >
                                                <FiTrash2 size={20} />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="text-4xl">🎓</div>
                                            <div className="text-lg">
                                                {search ? 'No se encontraron becas que coincidan con la búsqueda.' : 'No hay becas disponibles.'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detalles */}
            <AnimatePresence>
                {viewing && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-2xl relative border-2 border-blue-400 text-black shadow-md"
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                                <button
                                    className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 shadow hover:bg-gray-200 transition-colors"
                                    onClick={() => setViewing(null)}
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-bold text-gray-800">Detalles de la Beca</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-purple-800 mb-2">Información General</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">ID:</span>
                                                    <span>#{viewing.id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Tipo:</span>
                                                    <span className="font-semibold">Beca {viewing.tipo}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Monto:</span>
                                                    <span className="font-bold text-green-600">${viewing.monto.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Estado:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        viewing.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {viewing.activa ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-blue-800 mb-2">Descripción</h4>
                                            <p className="text-gray-700 text-sm">
                                                {viewing.tipo === 'Media'
                                                    ? 'Beca parcial que cubre un porcentaje del costo total del curso.'
                                                    : 'Beca completa que cubre el 100% del costo del curso.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow"
                                        onClick={() => { setViewing(null); openForm(viewing); }}
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

            {/* Modal Formulario */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-lg w-full max-w-2xl relative text-black shadow-md"
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-purple-600 text-white p-6 flex justify-between items-center rounded-t-lg">
                                <h2 className="text-2xl font-bold">{editing ? 'Editar Beca' : 'Nueva Beca'}</h2>
                                <button
                                    type="button"
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={closeForm}
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium mb-2 text-gray-700">Tipo de Beca:</label>
                                            <select
                                                name="tipo"
                                                value={formData.tipo}
                                                onChange={handleChange}
                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                required
                                            >
                                                <option value="Media">Media</option>
                                                <option value="Completa">Completa</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium mb-2 text-gray-700">Monto:</label>
                                            <input
                                                name="monto"
                                                type="number"
                                                value={formData.monto}
                                                onChange={handleChange}
                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:border-purple-500 focus:outline-none transition-colors"
                                                required
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="activa"
                                            name="activa"
                                            checked={formData.activa}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <label htmlFor="activa" className="text-sm font-medium text-gray-700">
                                            Beca activa
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow"
                                    >
                                        {editing ? 'Guardar Cambios' : 'Crear Beca'}
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