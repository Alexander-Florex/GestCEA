// src/pages/Becas.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPercent, FiDollarSign, FiSettings, FiFileText, FiCreditCard, FiSearch, FiPlus, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

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

export default function Becas() {
    const { becas, addBeca, updateBeca, removeBeca, settings, updateSettings } = useDB();

    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('becas');

    // Estados para editar valores
    const [isEditingMatricula, setIsEditingMatricula] = useState(false);
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [isEditingFacturaA, setIsEditingFacturaA] = useState(false);
    const [matriculaMonto, setMatriculaMonto] = useState(settings?.montoMatricula || 25000);
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
                showNotification('success', 'Beca actualizada correctamente');
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
        if (window.confirm(`¿Está seguro de eliminar la beca "${beca.tipo}"?`)) {
            try {
                removeBeca(beca.id);
                showNotification('success', 'Beca eliminada correctamente');
            } catch (err) {
                showNotification('error', err.message);
            }
        }
    };

    const toggleActive = (beca) => {
        updateBeca(beca.id, { activa: !beca.activa });
        showNotification('success', `Beca ${beca.activa ? 'desactivada' : 'activada'} correctamente`);
    };

    /* ============ Handlers Valores ============ */

    const handleSaveMatriculaMonto = () => {
        try {
            const monto = Number(matriculaMonto);
            if (isNaN(monto) || monto < 0) {
                throw new Error('El monto debe ser un número positivo');
            }
            updateSettings({ montoMatricula: monto });
            setIsEditingMatricula(false);
            showNotification('success', 'Monto de Matrícula actualizado correctamente');
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

    const handleCancelMatricula = () => {
        setMatriculaMonto(settings?.montoMatricula || 25000);
        setIsEditingMatricula(false);
    };

    const handleCancelCard = () => {
        setCardPercentage(settings?.porcentajeTarjeta || 15);
        setIsEditingCard(false);
    };

    const handleCancelFacturaA = () => {
        setFacturaAPercentage(settings?.porcentajeIVAFacturaA || 21);
        setIsEditingFacturaA(false);
    };

    // Función para obtener color según tipo de beca
    const getBecaColor = (tipo) => {
        return tipo === 'Completa'
            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300'
            : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="p-3 sm:p-4 md:p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header Mejorado */}
                <div className="mb-6 space-y-4">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Parametrización del Sistema
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Configura becas y valores de cobro del sistema
                        </p>
                    </div>

                    {/* Tabs Responsive */}
                    <div className="flex flex-wrap gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                        {[
                            { id: 'becas', label: 'Becas', icon: FiDollarSign },
                            { id: 'matricula', label: 'Matrícula', icon: FiCreditCard },
                            { id: 'tarjeta', label: 'Tarjeta', icon: FiSettings },
                            { id: 'facturaA', label: 'Factura A', icon: FiFileText }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[120px] sm:min-w-[140px] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-xs sm:text-sm md:text-base">{tab.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contenido según tab activo */}
                <AnimatePresence mode="wait">
                    {activeTab === 'becas' && (
                        <motion.div
                            key="becas"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Buscador y botón */}
                            <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiSearch className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar por tipo de beca..."
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-black text-sm sm:text-base"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => openForm(null)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg w-full sm:w-auto"
                                >
                                    <FiPlus className="w-5 h-5" />
                                    <span>Nueva Beca</span>
                                </button>
                            </div>

                            {/* Tabla de Becas */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Monto
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {filtered.map((beca) => (
                                            <motion.tr
                                                key={beca.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50 transition-colors duration-150"
                                            >
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    #{beca.id}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getBecaColor(beca.tipo)}`}>
                                                            Beca {beca.tipo}
                                                        </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-green-700">
                                                        ${beca.monto.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleActive(beca)}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                                                            beca.activa
                                                                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 hover:bg-green-100'
                                                                : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 hover:bg-red-100'
                                                        }`}
                                                    >
                                                        {beca.activa ? 'Activa' : 'Inactiva'}
                                                    </button>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => setViewing(beca)}
                                                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
                                                            title="Ver detalles"
                                                        >
                                                            <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openForm(beca)}
                                                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all duration-200 hover:scale-105"
                                                            title="Editar"
                                                        >
                                                            <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(beca)}
                                                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
                                                            title="Eliminar"
                                                        >
                                                            <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 sm:px-6 py-12 sm:py-16 text-center">
                                                    <div className="flex flex-col items-center space-y-4">
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                                            <FiDollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg sm:text-xl font-semibold text-gray-900">
                                                                {search ? 'No se encontraron becas' : 'No hay becas disponibles'}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-2">
                                                                {search ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando una nueva beca'}
                                                            </p>
                                                        </div>
                                                        {!search && (
                                                            <button
                                                                onClick={() => openForm(null)}
                                                                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-md transition-all duration-300"
                                                            >
                                                                Agregar primera beca
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
                        </motion.div>
                    )}

                    {activeTab === 'matricula' && (
                        <motion.div
                            key="matricula"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold mb-2">Configuración de Matrícula</h2>
                                            <p className="text-gray-300 text-sm">
                                                Establece el valor fijo de la matrícula para todos los cursos
                                            </p>
                                        </div>
                                        <FiCreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Card de configuración */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Valor de Matrícula</h3>
                                                    <p className="text-gray-600 text-sm">
                                                        Este valor fijo se suma al costo base de cada curso como matrícula inicial
                                                    </p>
                                                </div>
                                            </div>

                                            {!isEditingMatricula ? (
                                                <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-0">
                                                    <div className="text-center sm:text-left">
                                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">
                                                            ${(settings?.montoMatricula || 25000).toLocaleString('es-AR')}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Valor actual de matrícula
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditingMatricula(true)}
                                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg w-full sm:w-auto"
                                                    >
                                                        Editar Valor
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Nuevo Valor de Matrícula ($)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="100"
                                                            value={matriculaMonto}
                                                            onChange={(e) => setMatriculaMonto(e.target.value)}
                                                            className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-black text-lg sm:text-xl font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                                                            autoFocus
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Ejemplo: Si el curso cuesta $1000 y la matrícula es $25000, el total inicial será $26000
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <button
                                                            onClick={handleCancelMatricula}
                                                            className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={handleSaveMatriculaMonto}
                                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ejemplos */}
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200">
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <FiInfo className="text-blue-600" />
                                                Ejemplos de aplicación
                                            </h4>
                                            <div className="space-y-3">
                                                {[
                                                    { label: 'Curso de $10,000 + Matrícula', value: 10000 },
                                                    { label: 'Curso de $25,000 + Matrícula', value: 25000 },
                                                    { label: 'Curso de $50,000 + Matrícula', value: 50000 }
                                                ].map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                                                        <span className="text-sm text-gray-700">{item.label}</span>
                                                        <span className="font-bold text-gray-800">
                                                            ${(item.value + (settings?.montoMatricula || 25000)).toLocaleString('es-AR')}
                                                        </span>
                                                    </div>
                                                ))}
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold mb-2">Configuración de Tarjeta</h2>
                                            <p className="text-gray-300 text-sm">
                                                Establece el porcentaje adicional para pagos con tarjeta
                                            </p>
                                        </div>
                                        <FiSettings className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Card de configuración */}
                                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 sm:p-6 border border-emerald-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Porcentaje de Recargo</h3>
                                                    <p className="text-gray-600 text-sm">
                                                        Este porcentaje se suma al monto base cuando el pago es con tarjeta
                                                    </p>
                                                </div>
                                            </div>

                                            {!isEditingCard ? (
                                                <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-0">
                                                    <div className="text-center sm:text-left">
                                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">
                                                            {settings?.porcentajeTarjeta || 15}%
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Recargo actual por tarjeta
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditingCard(true)}
                                                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg w-full sm:w-auto"
                                                    >
                                                        Editar Porcentaje
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
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
                                                            className="w-full border-2 border-emerald-300 rounded-lg px-4 py-3 text-black text-lg sm:text-xl font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                                                            autoFocus
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Ejemplo: Si el curso cuesta $1000 y el porcentaje es 15%, el total será $1150
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <button
                                                            onClick={handleCancelCard}
                                                            className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={handleSaveCardPercentage}
                                                            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-3 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ejemplos */}
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200">
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <FiInfo className="text-emerald-600" />
                                                Ejemplos de aplicación
                                            </h4>
                                            <div className="space-y-3">
                                                {[
                                                    { label: 'Curso de $10,000', value: 10000 },
                                                    { label: 'Curso de $25,000', value: 25000 },
                                                    { label: 'Curso de $50,000', value: 50000 }
                                                ].map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                                                        <span className="text-sm text-gray-700">{item.label}</span>
                                                        <span className="font-bold text-gray-800">
                                                            ${(item.value * (1 + (settings?.porcentajeTarjeta || 15) / 100)).toLocaleString('es-AR')}
                                                        </span>
                                                    </div>
                                                ))}
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold mb-2">Configuración de Factura A</h2>
                                            <p className="text-gray-300 text-sm">
                                                Establece el porcentaje de IVA para Factura A
                                            </p>
                                        </div>
                                        <FiFileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6">
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Card de configuración */}
                                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 sm:p-6 border border-purple-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Porcentaje de IVA</h3>
                                                    <p className="text-gray-600 text-sm">
                                                        Este porcentaje de IVA se aplica cuando se emite una Factura A
                                                    </p>
                                                </div>
                                            </div>

                                            {!isEditingFacturaA ? (
                                                <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-0">
                                                    <div className="text-center sm:text-left">
                                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">
                                                            {settings?.porcentajeIVAFacturaA || 21}%
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            IVA actual para Factura A
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditingFacturaA(true)}
                                                        className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg w-full sm:w-auto"
                                                    >
                                                        Editar Porcentaje
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
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
                                                            className="w-full border-2 border-purple-300 rounded-lg px-4 py-3 text-black text-lg sm:text-xl font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-colors"
                                                            autoFocus
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Ejemplo: Si el curso cuesta $1000 y el IVA es 21%, el total será $1210
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <button
                                                            onClick={handleCancelFacturaA}
                                                            className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={handleSaveFacturaAPercentage}
                                                            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-3 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ejemplos */}
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200">
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <FiInfo className="text-purple-600" />
                                                Ejemplos de aplicación
                                            </h4>
                                            <div className="space-y-3">
                                                {[
                                                    { label: 'Curso de $10,000', value: 10000 },
                                                    { label: 'Curso de $25,000', value: 25000 },
                                                    { label: 'Curso de $50,000', value: 50000 }
                                                ].map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                                                        <span className="text-sm text-gray-700">{item.label}</span>
                                                        <span className="font-bold text-gray-800">
                                                            ${(item.value * (1 + (settings?.porcentajeIVAFacturaA || 21) / 100)).toLocaleString('es-AR')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Información adicional */}
                                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiInfo className="text-blue-600" />
                                                Información sobre Factura A
                                            </h4>
                                            <ul className="space-y-2 text-sm text-gray-700">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-500 mt-1">•</span>
                                                    <span>La Factura A se emite a empresas o monotributistas inscritos en IVA</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-500 mt-1">•</span>
                                                    <span>El IVA discriminado permite al receptor computar el crédito fiscal</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-blue-500 mt-1">•</span>
                                                    <span>El porcentaje estándar de IVA en Argentina es del 21%</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal Detalles Mejorado */}
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
                                            <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold">Detalles de la Beca</h2>
                                            <p className="text-gray-300 text-sm">Información completa de la beca</p>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Información General */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiInfo className="text-blue-600" />
                                            Información General
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">ID:</span>
                                                <span className="font-semibold text-gray-800">#{viewing.id}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Tipo:</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBecaColor(viewing.tipo)}`}>
                                                    Beca {viewing.tipo}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monto y Estado */}
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiDollarSign className="text-emerald-600" />
                                            Valor y Estado
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Monto:</span>
                                                <span className="text-xl font-bold text-emerald-700">
                                                    ${viewing.monto.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                                <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">Estado:</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${viewing.activa
                                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                                    : 'bg-red-100 text-red-800 border border-red-300'
                                                }`}>
                                                    {viewing.activa ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-300">
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <FiInfo className="text-gray-600" />
                                        Descripción
                                    </h3>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        {viewing.tipo === 'Media'
                                            ? 'Beca parcial que cubre un porcentaje del costo total del curso. Ideal para estudiantes que requieren apoyo financiero pero pueden cubrir parte del costo.'
                                            : 'Beca completa que cubre el 100% del costo del curso. Destinada a estudiantes con excelencia académica o situación económica desfavorable.'}
                                    </p>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => { setViewing(null); openForm(viewing); }}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>Editar Beca</span>
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

            {/* Modal Formulario Mejorado */}
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
                                            <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold">
                                                {editing ? 'Editar Beca' : 'Nueva Beca'}
                                            </h2>
                                            <p className="text-gray-300 text-sm">
                                                {editing ? 'Modifica la información de la beca' : 'Completa los datos de la nueva beca'}
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
                                    {/* Tipo de Beca */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <FiInfo className="w-4 h-4 text-blue-600" />
                                            Tipo de Beca<span className="text-red-500">*</span>:
                                        </label>
                                        <select
                                            name="tipo"
                                            value={formData.tipo}
                                            onChange={handleChange}
                                            className="border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-sm"
                                            required
                                        >
                                            <option value="Media">Media</option>
                                            <option value="Completa">Completa</option>
                                        </select>
                                    </div>

                                    {/* Monto */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <FiDollarSign className="w-4 h-4 text-emerald-600" />
                                            Monto ($)<span className="text-red-500">*</span>:
                                        </label>
                                        <input
                                            name="monto"
                                            type="number"
                                            value={formData.monto}
                                            onChange={handleChange}
                                            className="border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors text-sm"
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Estado */}
                                    <div className="flex flex-col justify-center sm:col-span-2">
                                        <label className="text-sm font-medium mb-2">Estado:</label>
                                        <div className="flex items-center space-x-3 h-full bg-gray-50 rounded-lg p-3 border-2 border-gray-300">
                                            <input
                                                type="checkbox"
                                                id="activa"
                                                name="activa"
                                                checked={formData.activa}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="activa" className="text-sm text-gray-700 font-medium">
                                                Beca activa
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Botones del formulario */}
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
                                        {editing ? 'Guardar Cambios' : 'Crear Beca'}
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