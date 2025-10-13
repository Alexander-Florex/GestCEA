// src/pages/Cobros.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiChevronUp, FiShoppingCart, FiDollarSign, FiCreditCard, FiTrendingUp } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = d => {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
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

export default function Cobros() {
    const { students, inscriptions, courses, findStudent, findCourse } = useDB();

    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [selectedInstallments, setSelectedInstallments] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(n => [...n, { id, type, message }]);
        setTimeout(() => removeNotification(id), 3000);
    };
    const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

    // Buscar estudiantes por ID, DNI o Nombre Apellido
    const searchResults = useMemo(() => {
        if (!search.trim()) return [];
        const query = search.toLowerCase().trim();

        return students.filter(s => {
            const fullName = `${s.apellido} ${s.nombre}`.toLowerCase();
            const reverseName = `${s.nombre} ${s.apellido}`.toLowerCase();
            return (
                s.id.toString().includes(query) ||
                s.dni.includes(query) ||
                fullName.includes(query) ||
                reverseName.includes(query)
            );
        }).slice(0, 5); // Limitar a 5 resultados
    }, [search, students]);

    // Obtener cursos del estudiante seleccionado (solo cursando o con deuda)
    const studentCourses = useMemo(() => {
        if (!selectedStudent) return [];

        return inscriptions
            .filter(ins => {
                if (ins.studentId !== selectedStudent.id) return false;

                // Si está cursando, mostrar
                if (ins.status === 'Cursando') return true;

                // Si finalizó, solo mostrar si tiene deuda
                if (ins.status === 'Finalizado') {
                    const hasDebt = ins.installments?.some(inst =>
                        inst.status === 'Pendiente' || inst.status === 'Parcial'
                    );
                    return hasDebt;
                }

                // Si tiene abandono no notificado y debe, mostrar
                if (ins.status === 'AbandonoNoNotificado') {
                    const hasDebt = ins.installments?.some(inst =>
                        inst.status === 'Pendiente' || inst.status === 'Parcial'
                    );
                    return hasDebt;
                }

                return false;
            })
            .map(ins => {
                const course = findCourse(ins.courseId);
                return {
                    ...ins,
                    courseName: course?.nombre || ins.courseName || 'Curso desconocido',
                    installments: ins.installments || []
                };
            });
    }, [selectedStudent, inscriptions, findCourse]);

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSearch('');
        setExpandedCourses({});
        setSelectedInstallments([]);
    };

    const toggleCourseExpansion = (inscriptionId) => {
        setExpandedCourses(prev => ({
            ...prev,
            [inscriptionId]: !prev[inscriptionId]
        }));
    };

    const toggleInstallmentSelection = (inscriptionId, installmentNumber) => {
        const key = `${inscriptionId}-${installmentNumber}`;
        setSelectedInstallments(prev => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const isInstallmentSelected = (inscriptionId, installmentNumber) => {
        return selectedInstallments.includes(`${inscriptionId}-${installmentNumber}`);
    };

    const handleProceedToPayment = () => {
        if (selectedInstallments.length === 0) {
            showNotification('error', 'Selecciona al menos una cuota para proceder al pago');
            return;
        }
        setShowPaymentModal(true);
    };

    const calculateTotal = () => {
        let total = 0;
        selectedInstallments.forEach(key => {
            const [inscId, instNum] = key.split('-');
            const inscription = studentCourses.find(c => c.id === Number(inscId));
            if (inscription) {
                const installment = inscription.installments.find(inst => inst.number === Number(instNum));
                if (installment) {
                    const pending = Number(installment.amount) - Number(installment.amountPaid || 0);
                    total += pending;
                }
            }
        });
        return total;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="p-6 relative max-w-7xl mx-auto">
                <Notifications notifications={notifications} remove={removeNotification} />

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Módulo de Cobros</h1>
                    <p className="text-gray-600">Busca al alumno y gestiona sus pagos</p>
                </div>

                {/* Buscador */}
                <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FiSearch className="h-6 w-6 text-blue-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por ID, DNI o Apellido Nombre..."
                            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Resultados de búsqueda */}
                    <AnimatePresence>
                        {search && searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-4 space-y-2"
                            >
                                {searchResults.map(student => (
                                    <motion.div
                                        key={student.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-all"
                                        onClick={() => handleSelectStudent(student)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-blue-900">
                                                    {student.apellido}, {student.nombre}
                                                </div>
                                                <div className="text-sm text-blue-700">
                                                    DNI: {student.dni} • ID: {student.id}
                                                </div>
                                            </div>
                                            <div className="text-blue-600">→</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                        {search && searchResults.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500"
                            >
                                No se encontraron resultados
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Estudiante seleccionado y sus cursos */}
                <AnimatePresence>
                    {selectedStudent && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Info del estudiante */}
                            <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            {selectedStudent.apellido}, {selectedStudent.nombre}
                                        </h2>
                                        <p className="text-blue-100">
                                            DNI: {selectedStudent.dni} • Email: {selectedStudent.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Cambiar alumno
                                    </button>
                                </div>
                            </div>

                            {/* Cursos */}
                            {studentCourses.length > 0 ? (
                                <div className="space-y-4">
                                    {studentCourses.map(courseData => (
                                        <CourseCard
                                            key={courseData.id}
                                            courseData={courseData}
                                            isExpanded={expandedCourses[courseData.id]}
                                            onToggleExpansion={() => toggleCourseExpansion(courseData.id)}
                                            selectedInstallments={selectedInstallments}
                                            onToggleInstallment={toggleInstallmentSelection}
                                            isInstallmentSelected={isInstallmentSelected}
                                            showNotification={showNotification}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                                    <div className="text-gray-400 mb-4">
                                        <FiDollarSign className="w-16 h-16 mx-auto" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No hay pagos pendientes
                                    </h3>
                                    <p className="text-gray-500">
                                        Este alumno no tiene cursos con pagos pendientes
                                    </p>
                                </div>
                            )}

                            {/* Carrito flotante */}
                            <AnimatePresence>
                                {selectedInstallments.length > 0 && (
                                    <motion.div
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 100, opacity: 0 }}
                                        className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-6 z-40"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <FiShoppingCart className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <div className="text-sm text-gray-600">
                                                    {selectedInstallments.length} cuota{selectedInstallments.length !== 1 ? 's' : ''} seleccionada{selectedInstallments.length !== 1 ? 's' : ''}
                                                </div>
                                                <div className="text-2xl font-bold text-blue-900">
                                                    ${formatNumber(calculateTotal())}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleProceedToPayment}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
                                            >
                                                Proceder al Pago
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de pago */}
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    selectedInstallments={selectedInstallments}
                    studentCourses={studentCourses}
                    total={calculateTotal()}
                    showNotification={showNotification}
                    onSuccess={() => {
                        setSelectedInstallments([]);
                        setShowPaymentModal(false);
                    }}
                />
            </div>
        </div>
    );
}

// Componente CourseCard
function CourseCard({
                        courseData,
                        isExpanded,
                        onToggleExpansion,
                        selectedInstallments,
                        onToggleInstallment,
                        isInstallmentSelected,
                        showNotification
                    }) {
    const pendingInstallments = courseData.installments.filter(inst =>
        inst.status === 'Pendiente' || inst.status === 'Parcial'
    );

    return (
        <motion.div
            layout
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden hover:border-blue-400 transition-all"
        >
            {/* Header del curso */}
            <div
                className="p-6 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={onToggleExpansion}
            >
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{courseData.courseName}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                courseData.status === 'Cursando' ? 'bg-green-100 text-green-800' :
                                    courseData.status === 'Finalizado' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                            }`}>
                                {courseData.status}
                            </span>
                            <span className="text-gray-600">
                                {pendingInstallments.length} cuota{pendingInstallments.length !== 1 ? 's' : ''} pendiente{pendingInstallments.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FiChevronDown className="w-6 h-6 text-blue-600" />
                    </motion.div>
                </div>
            </div>

            {/* Lista de cuotas expandible */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t-2 border-gray-200"
                    >
                        <div className="p-6 bg-gray-50 space-y-3">
                            {pendingInstallments.map(installment => (
                                <InstallmentRow
                                    key={installment.number}
                                    installment={installment}
                                    inscriptionId={courseData.id}
                                    isSelected={isInstallmentSelected(courseData.id, installment.number)}
                                    onToggleSelection={() => onToggleInstallment(courseData.id, installment.number)}
                                    showNotification={showNotification}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Componente InstallmentRow
function InstallmentRow({ installment, inscriptionId, isSelected, onToggleSelection, showNotification }) {
    const [showActions, setShowActions] = useState(false);
    const pending = Number(installment.amount) - Number(installment.amountPaid || 0);

    const handlePagar = () => {
        showNotification('info', `Función "Pagar" cuota ${installment.number} - En desarrollo`);
    };

    const handleDepositar = () => {
        showNotification('info', `Función "Depositar" cuota ${installment.number} - En desarrollo`);
    };

    const handleFreezar = () => {
        showNotification('info', `Función "Freezar" cuota ${installment.number} - En desarrollo`);
    };

    return (
        <motion.div
            layout
            className={`bg-white rounded-lg border-2 p-4 transition-all ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}
        >
            <div className="flex items-center justify-between">
                {/* Checkbox */}
                <div className="flex items-center space-x-4">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelection}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                        <div className="font-bold text-gray-800">Cuota #{installment.number}</div>
                        <div className="text-sm text-gray-600">
                            Vencimiento: {formatDate(installment.dueDate)}
                        </div>
                        {installment.amountPaid > 0 && (
                            <div className="text-xs text-green-600">
                                Pagado: ${formatNumber(installment.amountPaid)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Monto y acciones */}
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-900">
                            ${formatNumber(pending)}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            installment.status === 'Parcial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {installment.status}
                        </span>
                    </div>

                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors font-semibold"
                    >
                        Acciones
                    </button>
                </div>
            </div>

            {/* Botones de acción expandibles */}
            <AnimatePresence>
                {showActions && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 flex space-x-3"
                    >
                        <button
                            onClick={handlePagar}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <FiDollarSign className="w-4 h-4" />
                            <span>Pagar</span>
                        </button>
                        <button
                            onClick={handleDepositar}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <FiTrendingUp className="w-4 h-4" />
                            <span>Depositar</span>
                        </button>
                        <button
                            onClick={handleFreezar}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <FiCreditCard className="w-4 h-4" />
                            <span>Freezar</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Componente PaymentModal
function PaymentModal({ isOpen, onClose, selectedInstallments, studentCourses, total, showNotification, onSuccess }) {
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');

    if (!isOpen) return null;

    const handleConfirmPayment = () => {
        showNotification('success', `Pago de $${formatNumber(total)} procesado con ${paymentMethod}`);
        onSuccess();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-2xl max-w-2xl w-full relative text-black shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                        <h2 className="text-2xl font-bold">Confirmar Pago</h2>
                        <p className="text-blue-100">Selecciona la forma de pago</p>
                    </div>

                    {/* Contenido */}
                    <div className="p-6 space-y-6">
                        {/* Resumen */}
                        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                            <div className="text-sm text-blue-700 mb-2">Total a pagar</div>
                            <div className="text-3xl font-bold text-blue-900">${formatNumber(total)}</div>
                            <div className="text-sm text-blue-600 mt-1">
                                {selectedInstallments.length} cuota{selectedInstallments.length !== 1 ? 's' : ''} seleccionada{selectedInstallments.length !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Forma de pago */}
                        <div>
                            <label className="text-sm font-semibold mb-3 text-gray-700 block">
                                Forma de Pago:
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {['Efectivo', 'Transferencia', 'Tarjeta'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                                            paymentMethod === method
                                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                : 'border-gray-300 hover:border-blue-300 text-gray-700'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                            {paymentMethod === 'Tarjeta' && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                    ⚠️ Tarjeta: Solo disponible para pago completo de todas las cuotas
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 flex space-x-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmPayment}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
                        >
                            Confirmar Pago
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}