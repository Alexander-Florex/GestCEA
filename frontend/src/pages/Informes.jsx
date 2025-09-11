// src/pages/Informes.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiBarChart, FiTrendingUp, FiPieChart, FiFileText } from 'react-icons/fi';

export default function Informes() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="p-6 relative max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-bold text-gray-800 mb-2"
                    >
                        Informes y Reportes
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-gray-600"
                    >
                        Centro de análisis y estadísticas del sistema
                    </motion.p>
                </div>

                {/* Contenedor principal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                >
                    {/* Header del contenedor */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
                        <div className="flex items-center justify-center space-x-4">
                            <FiBarChart className="w-12 h-12" />
                            <div className="text-center">
                                <h2 className="text-3xl font-bold">Sistema de Informes</h2>
                                <p className="text-white/80 text-lg">Análisis avanzado de datos</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-12">
                        <div className="text-center space-y-8">
                            {/* Icono principal */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                className="flex justify-center"
                            >
                                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-full p-8">
                                    <FiFileText className="w-24 h-24 text-purple-600" />
                                </div>
                            </motion.div>

                            {/* Texto principal */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                                className="space-y-4"
                            >
                                <h3 className="text-3xl font-bold text-gray-800">
                                    Próximo a Desarrollar
                                </h3>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                                    Estamos trabajando en un completo sistema de informes que incluirá
                                    reportes detallados, gráficos interactivos y análisis avanzados
                                    para ayudarte a tomar mejores decisiones.
                                </p>
                            </motion.div>

                            {/* Características futuras */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.9 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
                            >
                                <div className="text-center space-y-3">
                                    <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                                        <FiTrendingUp className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Reportes de Ventas</h4>
                                    <p className="text-sm text-gray-600">Análisis detallado de ingresos y tendencias</p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                                        <FiPieChart className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Estadísticas de Cursos</h4>
                                    <p className="text-sm text-gray-600">Datos sobre inscripciones y rendimiento</p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                                        <FiBarChart className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Dashboard Analítico</h4>
                                    <p className="text-sm text-gray-600">Visualización de métricas clave</p>
                                </div>
                            </motion.div>

                            {/* Mensaje adicional */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1.1 }}
                                className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mt-8"
                            >
                                <p className="text-gray-700 font-medium">
                                    Mientras tanto, puedes acceder a la información desde las otras secciones del sistema.
                                    ¡Pronto tendrás acceso a reportes consolidados y análisis avanzados!
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer informativo */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.3 }}
                    className="mt-8 text-center"
                >
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg inline-block">
                        <p className="text-sm text-blue-700">
                            <strong>Tip:</strong> Utiliza las secciones de Caja Diaria y otras funcionalidades
                            existentes para obtener información detallada sobre tu negocio.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}