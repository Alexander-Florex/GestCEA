// src/pages/Becas.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPercent, FiDollarSign, FiSettings, FiFileText } from 'react-icons/fi';
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

/* ==================== Página Parametrización ==================== */

export default function Becas() {
    const { becas, addBeca, updateBeca, removeBeca, settings, updateSettings } = useDB();

    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('becas'); // 'becas', 'transferencia', 'tarjeta', 'facturaA'

    // Estados para editar porcentajes
    const [isEditingTransfer, setIsEditingTransfer] = useState(false);
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [isEditingFacturaA, setIsEditingFacturaA] = useState(false);
    const [transferPercentage, setTransferPercentage] = useState(settings?.porcentajeTransferencia || 5);
    const [cardPercentage, setCardPercentage] = useState(settings?.porcentajeTarjeta || 15);
    const [facturaAPercentage, setFacturaAPercentage] = useState(settings?.porcentajeIVAFacturaA || 21);

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

    /* ============ Handlers Becas ============ */

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

    /* ============ Handlers Porcentajes ============ */

    const handleSaveTransferPercentage = () => {
        try {
            const percentage = Number(transferPercentage);
            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                throw new Error('El porcentaje debe estar entre 0 y 100');
            }
            updateSettings({ porcentajeTransferencia: percentage });
            setIsEditingTransfer(false);
            showNotification('success', 'Porcentaje de Transferencia actualizado correctamente');
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleSaveCardPercentage = () => {
        try {
            const percentage = Number(cardPercentage);
            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                throw new Error('El porcentaje debe estar entre 0 y 100');
            }
            updateSettings({ porcentajeTarjeta: percentage });
            setIsEditingCard(false);
            showNotification('success', 'Porcentaje de Tarjeta actualizado correctamente');
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleSaveFacturaAPercentage = () => {
        try {
            const percentage = Number(facturaAPercentage);
            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                throw new Error('El porcentaje debe estar entre 0 y 100');
            }
            updateSettings({ porcentajeIVAFacturaA: percentage });
            setIsEditingFacturaA(false);
            showNotification('success', 'Porcentaje de IVA (Factura A) actualizado correctamente');
        } catch (err) {
            showNotification('error', err.message);
        }
    };

    const handleCancelTransfer = () => {
        setTransferPercentage(settings?.porcentajeTransferencia || 5);
        setIsEditingTransfer(false);
    };

    const handleCancelCard = () => {
        setCardPercentage(settings?.porcentajeTarjeta || 15);
        setIsEditingCard(false);
    };

    const handleCancelFacturaA = () => {
        setFacturaAPercentage(settings?.porcentajeIVAFacturaA || 21);
        setIsEditingFacturaA(false);
    };

    /* ==================== Render ==================== */

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header */}
                <div className="mb-6 space-y-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Parametrización del Sistema</h1>
                        <p className="text-gray-600">Configura becas y porcentajes de cobro</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-2 bg-white rounded-xl p-2 shadow-lg border border-gray-200">
                        <button
                            onClick={() => setActiveTab('becas')}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === 'becas'
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <FiDollarSign className="w-5 h-5" />
                                <span>Becas</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('transferencia')}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === 'transferencia'
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <FiPercent className="w-5 h-5" />
                                <span>Transferencia</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('tarjeta')}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === 'tarjeta'
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <FiSettings className="w-5 h-5" />
                                <span>Tarjeta</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('facturaA')}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === 'facturaA'
                                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <FiFileText className="w-5 h-5" />
                                <span>Factura A</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Contenido según tab activo */}
                <AnimatePresence mode="wait">
                    {activeTab === 'becas' && (
                        <motion.div
                            key="becas"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Buscador y botón */}
                            <div className="flex shadow-lg rounded-xl overflow-hidden mb-6">
                                <input
                                    type="text"
                                    placeholder="Buscar por tipo de beca..."
                                    className="flex-grow px-6 py-4 border-2 border-purple-500 bg-gradient-to-r from-purple-50 to-white rounded-l-xl focus:outline-none focus:from-white focus:to-purple-50 focus:border-purple-600 text-black placeholder-purple-600 text-lg"
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

                            {/* Tabla de Becas */}
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
                                        <tbody>
                                        {filtered.map((beca, idx) => (
                                            <motion.tr
                                                key={beca.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                                                    idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                                }`}
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">#{beca.id}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">Beca {beca.tipo}</td>
                                                <td className="px-6 py-4 text-sm text-green-700 font-bold">${beca.monto.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => toggleActive(beca)}
                                                        className={`px-4 py-2 rounded-full font-semibold text-xs shadow transition-colors ${
                                                            beca.activa
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        {beca.activa ? 'Activa' : 'Inactiva'}
                                                    </motion.button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex space-x-3">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => setViewing(beca)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                            title="Ver detalles"
                                                        >
                                                            <FiEye className="w-5 h-5" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => openForm(beca)}
                                                            className="text-green-600 hover:text-green-800 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <FiEdit className="w-5 h-5" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleDelete(beca)}
                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
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
                        </motion.div>
                    )}

                    {activeTab === 'transferencia' && (
                        <motion.div
                            key="transferencia"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                                    <h2 className="text-2xl font-bold mb-2">Configuración de Transferencia</h2>
                                    <p className="text-blue-100">Establece el porcentaje adicional para pagos por transferencia</p>
                                </div>

                                <div className="p-8">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Card de configuración */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-blue-900 mb-2">Porcentaje de Recargo</h3>
                                                    <p className="text-blue-700 text-sm">
                                                        Este porcentaje se suma al monto base cuando el pago es por transferencia
                                                    </p>
                                                </div>
                                                <FiPercent className="w-12 h-12 text-blue-600" />
                                            </div>

                                            {!isEditingTransfer ? (
                                                <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-md">
                                                    <div>
                                                        <div className="text-5xl font-bold text-blue-900">
                                                            {settings?.porcentajeTransferencia || 5}%
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-2">
                                                            Recargo actual por transferencia
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditingTransfer(true)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-md"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-lg p-6 shadow-md space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Nuevo Porcentaje (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={transferPercentage}
                                                            onChange={(e) => setTransferPercentage(e.target.value)}
                                                            className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-black text-2xl font-bold focus:border-blue-500 focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Ejemplo: Si el curso cuesta $1000 y el porcentaje es 5%, el total será $1050
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={handleCancelTransfer}
                                                            className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={handleSaveTransferPercentage}
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold shadow-md"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ejemplos */}
                                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                            <h4 className="font-bold text-blue-900 mb-4">💡 Ejemplos de aplicación</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $10,000</span>
                                                    <span className="font-bold text-blue-900">
                                                        ${(10000 * (1 + (settings?.porcentajeTransferencia || 5) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $25,000</span>
                                                    <span className="font-bold text-blue-900">
                                                        ${(25000 * (1 + (settings?.porcentajeTransferencia || 5) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $50,000</span>
                                                    <span className="font-bold text-blue-900">
                                                        ${(50000 * (1 + (settings?.porcentajeTransferencia || 5) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'tarjeta' && (
                        <motion.div
                            key="tarjeta"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                                    <h2 className="text-2xl font-bold mb-2">Configuración de Tarjeta</h2>
                                    <p className="text-green-100">Establece el porcentaje adicional para pagos con tarjeta</p>
                                </div>

                                <div className="p-8">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Card de configuración */}
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-green-900 mb-2">Porcentaje de Recargo</h3>
                                                    <p className="text-green-700 text-sm">
                                                        Este porcentaje se suma al monto base cuando el pago es con tarjeta
                                                    </p>
                                                </div>
                                                <FiSettings className="w-12 h-12 text-green-600" />
                                            </div>

                                            {!isEditingCard ? (
                                                <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-md">
                                                    <div>
                                                        <div className="text-5xl font-bold text-green-900">
                                                            {settings?.porcentajeTarjeta || 15}%
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-2">
                                                            Recargo actual por tarjeta
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditingCard(true)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-md"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-lg p-6 shadow-md space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Nuevo Porcentaje (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={cardPercentage}
                                                            onChange={(e) => setCardPercentage(e.target.value)}
                                                            className="w-full border-2 border-green-300 rounded-lg px-4 py-3 text-black text-2xl font-bold focus:border-green-500 focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Ejemplo: Si el curso cuesta $1000 y el porcentaje es 15%, el total será $1150
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={handleCancelCard}
                                                            className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={handleSaveCardPercentage}
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold shadow-md"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ejemplos */}
                                        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                                            <h4 className="font-bold text-green-900 mb-4">💡 Ejemplos de aplicación</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $10,000</span>
                                                    <span className="font-bold text-green-900">
                                                        ${(10000 * (1 + (settings?.porcentajeTarjeta || 15) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $25,000</span>
                                                    <span className="font-bold text-green-900">
                                                        ${(25000 * (1 + (settings?.porcentajeTarjeta || 15) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $50,000</span>
                                                    <span className="font-bold text-green-900">
                                                        ${(50000 * (1 + (settings?.porcentajeTarjeta || 15) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'facturaA' && (
                        <motion.div
                            key="facturaA"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6">
                                    <h2 className="text-2xl font-bold mb-2">Configuración de Factura A</h2>
                                    <p className="text-orange-100">Establece el porcentaje de IVA para Factura A</p>
                                </div>

                                <div className="p-8">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Card de configuración */}
                                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-orange-900 mb-2">Porcentaje de IVA</h3>
                                                    <p className="text-orange-700 text-sm">
                                                        Este porcentaje de IVA se aplica cuando se emite una Factura A
                                                    </p>
                                                </div>
                                                <FiFileText className="w-12 h-12 text-orange-600" />
                                            </div>

                                            {!isEditingFacturaA ? (
                                                <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-md">
                                                    <div>
                                                        <div className="text-5xl font-bold text-orange-900">
                                                            {settings?.porcentajeIVAFacturaA || 21}%
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-2">
                                                            IVA actual para Factura A
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditingFacturaA(true)}
                                                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-md"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-lg p-6 shadow-md space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Nuevo Porcentaje de IVA (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={facturaAPercentage}
                                                            onChange={(e) => setFacturaAPercentage(e.target.value)}
                                                            className="w-full border-2 border-orange-300 rounded-lg px-4 py-3 text-black text-2xl font-bold focus:border-orange-500 focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Ejemplo: Si el curso cuesta $1000 y el IVA es 21%, el total será $1210
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={handleCancelFacturaA}
                                                            className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={handleSaveFacturaAPercentage}
                                                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold shadow-md"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ejemplos */}
                                        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                                            <h4 className="font-bold text-orange-900 mb-4">💡 Ejemplos de aplicación</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $10,000</span>
                                                    <span className="font-bold text-orange-900">
                                                        ${(10000 * (1 + (settings?.porcentajeIVAFacturaA || 21) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $25,000</span>
                                                    <span className="font-bold text-orange-900">
                                                        ${(25000 * (1 + (settings?.porcentajeIVAFacturaA || 21) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="text-gray-700">Curso de $50,000</span>
                                                    <span className="font-bold text-orange-900">
                                                        ${(50000 * (1 + (settings?.porcentajeIVAFacturaA || 21) / 100)).toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Información adicional */}
                                        <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                                            <h4 className="font-bold text-amber-900 mb-3">ℹ️ Información sobre Factura A</h4>
                                            <ul className="space-y-2 text-sm text-amber-800">
                                                <li>• La Factura A se emite a empresas o monotributistas inscritos en IVA</li>
                                                <li>• El IVA discriminado permite al receptor computar el crédito fiscal</li>
                                                <li>• El porcentaje estándar de IVA en Argentina es del 21%</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                            <div className="p-6 flex items-center justify-between border-b border-gray-200">
                                <button
                                    type="button"
                                    className="bg-red-100 rounded-full p-2 hover:bg-red-200 transition-colors"
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