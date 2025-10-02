import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiMail, FiPhone, FiAlertCircle, FiX } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('es-AR');
};

const formatDate = d => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2,'0');
    const month = String(date.getMonth()+1).padStart(2,'0');
    return `${day}/${month}/${date.getFullYear()}`;
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

export default function Deudores() {
    const { getDebtorsDetailed, findStudent } = useDB();

    const [search, setSearch] = useState('');
    const [onlyOverdue, setOnlyOverdue] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n=>[...n,{id,type,message}]);
        setTimeout(()=>removeNotification(id), 3000);
    };
    const removeNotification = id => setNotifications(n=>n.filter(x=>x.id!==id));

    // Obtener deudores con filtro de vencidos
    const debtors = useMemo(() => {
        return getDebtorsDetailed({ onlyOverdue });
    }, [onlyOverdue, getDebtorsDetailed]);

    // Filtrar por búsqueda
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return debtors.filter(d =>
            d.studentName.toLowerCase().includes(q) ||
            (d.contact?.email || '').toLowerCase().includes(q) ||
            (d.contact?.telefono || '').toLowerCase().includes(q)
        );
    }, [debtors, search]);

    const getMotivosBadges = (motivos) => {
        const labels = {
            regla1: { text: 'Cuotas Pendientes', color: 'bg-yellow-100 text-yellow-800' },
            regla2: { text: 'Finalizó con Deuda', color: 'bg-orange-100 text-orange-800' },
            regla3: { text: 'Abandono No Notificado', color: 'bg-red-100 text-red-800' }
        };
        return motivos.map(m => labels[m] || { text: m, color: 'bg-gray-100 text-gray-800' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-red-800 mb-2">Gestión de Deudores</h1>
                    <p className="text-gray-600">Alumnos con pagos pendientes o vencidos</p>
                </div>

                {/* Controles */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            className="w-full pl-12 pr-4 py-3 text-lg border-2 border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black bg-white shadow-sm transition-all duration-200"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 bg-white px-4 py-3 rounded-xl border-2 border-red-300 shadow-sm cursor-pointer hover:bg-red-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={onlyOverdue}
                                onChange={e => setOnlyOverdue(e.target.checked)}
                                className="w-5 h-5 text-red-600"
                            />
                            <span className="text-gray-700 font-medium">Solo Vencidos</span>
                        </label>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="text-sm text-gray-600 mb-1">Total Deudores</div>
                        <div className="text-3xl font-bold text-gray-800">{filtered.length}</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                        <div className="text-sm text-gray-600 mb-1">Deuda Total</div>
                        <div className="text-3xl font-bold text-red-600">
                            ${formatNumber(filtered.reduce((sum, d) => sum + d.totalPending, 0))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                        <div className="text-sm text-gray-600 mb-1">Cuotas Pendientes</div>
                        <div className="text-3xl font-bold text-orange-600">
                            {filtered.reduce((sum, d) => sum + d.cuotas.length, 0)}
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                            <tr>
                                <th className="px-4 py-4 text-left font-bold">Alumno</th>
                                <th className="px-4 py-4 text-left font-bold">Contacto</th>
                                <th className="px-4 py-4 text-center font-bold">Cuotas Adeudadas</th>
                                <th className="px-4 py-4 text-right font-bold">Deuda Total</th>
                                <th className="px-4 py-4 text-left font-bold">Motivo</th>
                                <th className="px-4 py-4 text-center font-bold">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filtered.map((debtor, index) => (
                                <motion.tr
                                    key={debtor.studentId}
                                    className={`hover:bg-red-50 transition-all duration-200 ${
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                    initial={{opacity:0,y:10}}
                                    animate={{opacity:1,y:0}}
                                    transition={{duration:0.2, delay: index * 0.05}}
                                >
                                    <td className="px-4 py-4">
                                        <div className="font-semibold text-black">{debtor.studentName}</div>
                                        <div className="text-sm text-gray-500">ID: {debtor.studentId}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            {debtor.contact?.email && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <FiMail size={14} className="mr-1" />
                                                    {debtor.contact.email}
                                                </div>
                                            )}
                                            {debtor.contact?.telefono && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <FiPhone size={14} className="mr-1" />
                                                    {debtor.contact.telefono}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                            <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800">
                                                {debtor.cuotas.length}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                            <span className="text-red-700 font-bold text-lg">
                                                ${formatNumber(debtor.totalPending)}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {getMotivosBadges(debtor.motivos).map((badge, i) => (
                                                <span key={i} className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                                                        {badge.text}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center">
                                            <motion.button
                                                onClick={() => setViewing(debtor)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                <FiAlertCircle size={18} />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        <div className="text-xl">
                                            {search ? 'No se encontraron deudores que coincidan.' :
                                                onlyOverdue ? 'No hay deudores con pagos vencidos.' :
                                                    '¡Excelente! No hay deudores registrados.'}
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewing(null)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative text-black shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-red-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">{viewing.studentName}</h2>
                                    <p className="text-red-100">Detalle de Deudas</p>
                                </div>
                                <button
                                    className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
                                    onClick={() => setViewing(null)}
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Información del Alumno */}
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <h3 className="font-bold text-red-800 mb-3">Información de Contacto</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {viewing.contact?.email && (
                                            <div className="flex items-center">
                                                <FiMail className="text-red-600 mr-2" />
                                                <span className="text-gray-700">{viewing.contact.email}</span>
                                            </div>
                                        )}
                                        {viewing.contact?.telefono && (
                                            <div className="flex items-center">
                                                <FiPhone className="text-red-600 mr-2" />
                                                <span className="text-gray-700">{viewing.contact.telefono}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resumen */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                        <div className="text-sm text-yellow-700 mb-1">Total Cuotas</div>
                                        <div className="text-2xl font-bold text-yellow-800">{viewing.cuotas.length}</div>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <div className="text-sm text-red-700 mb-1">Deuda Total</div>
                                        <div className="text-2xl font-bold text-red-800">${formatNumber(viewing.totalPending)}</div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                        <div className="text-sm text-orange-700 mb-1">Motivos</div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {getMotivosBadges(viewing.motivos).map((badge, i) => (
                                                <span key={i} className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                                                    {badge.text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Detalle de Cuotas */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Cuotas Adeudadas</h3>
                                    <div className="overflow-x-auto border-2 border-gray-300 rounded-xl shadow-lg">
                                        <table className="min-w-full bg-white">
                                            <thead className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Curso</th>
                                                <th className="px-4 py-3 text-center font-semibold">Cuota #</th>
                                                <th className="px-4 py-3 text-left font-semibold">Vencimiento</th>
                                                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                                                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                                                <th className="px-4 py-3 text-right font-semibold">Pagado</th>
                                                <th className="px-4 py-3 text-right font-semibold">Pendiente</th>
                                                <th className="px-4 py-3 text-center font-semibold">Días Vencido</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {viewing.cuotas.map((cuota, index) => (
                                                <tr key={cuota.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                                    <td className="px-4 py-3 text-black font-medium">{cuota.courseName}</td>
                                                    <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
                                                                #{cuota.installmentNumber}
                                                            </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-black">{formatDate(cuota.dueDate)}</td>
                                                    <td className="px-4 py-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                cuota.estado === 'Vencida' ? 'bg-red-100 text-red-800' :
                                                                    cuota.estado === 'Vencida (parcial)' ? 'bg-orange-100 text-orange-800' :
                                                                        cuota.estado === 'Parcial al día' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-green-100 text-green-800'
                                                            }`}>
                                                                {cuota.estado}
                                                            </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-black font-bold">
                                                        ${formatNumber(cuota.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-semibold">
                                                        ${formatNumber(cuota.amountPaid)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-bold">
                                                        ${formatNumber(cuota.pending)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {cuota.isOverdue && cuota.daysLate > 0 ? (
                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                                                                    {cuota.daysLate} días
                                                                </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                            <tr>
                                                <td colSpan={6} className="px-4 py-3 text-right font-bold text-gray-800">TOTAL ADEUDADO:</td>
                                                <td className="px-4 py-3 text-right">
                                                        <span className="text-2xl font-bold text-red-600">
                                                            ${formatNumber(viewing.totalPending)}
                                                        </span>
                                                </td>
                                                <td></td>
                                            </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}