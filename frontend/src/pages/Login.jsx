// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDB } from '../contexts/AppDB';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiLogIn, FiAlertCircle } from 'react-icons/fi';

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const { findUserByLogin } = useDB();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCredentials, setShowCredentials] = useState(true);

    // Si ya está autenticado, redirigir al dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // ✅ Intentar login con integración de AppDB
            const success = login(formData, findUserByLogin);

            if (!success) {
                // El login ya muestra alert(), pero podemos agregar mensaje visual
                setError('Credenciales incorrectas o usuario inactivo');
            }
        } catch (error) {
            console.error('Error en login:', error);
            setError('Error inesperado. Por favor, intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setError(''); // Limpiar error al escribir
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fillDemoCredentials = () => {
        setFormData({
            username: 'admin@gestcea.local',
            password: 'admin'
        });
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            >
                {/* Logo / Título */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 mb-4"
                    >
                        <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        GestCEA
                    </h1>
                    <p className="text-gray-600">Sistema de Gestión Integral</p>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg"
                    >
                        <div className="flex items-center">
                            <FiAlertCircle className="text-red-500 mr-2" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </motion.div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Usuario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuario
                        </label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-black placeholder-gray-400"
                                placeholder="correo@ejemplo.com o DNI"
                                required
                                autoComplete="username"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Puedes usar tu correo electrónico o DNI
                        </p>
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-black placeholder-gray-400"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Botón de login */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={isLoading ? {} : { scale: 1.02 }}
                        whileTap={isLoading ? {} : { scale: 0.98 }}
                        className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 transition-all duration-300 ${
                            isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Iniciando sesión...</span>
                            </>
                        ) : (
                            <>
                                <FiLogIn size={20} />
                                <span>Iniciar Sesión</span>
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Credenciales de ejemplo */}
                {showCredentials && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6"
                    >
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowCredentials(false)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                                <p className="text-sm text-blue-800 font-semibold mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Credenciales de Prueba
                                </p>
                                <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Usuario:</span>
                                        <code className="px-2 py-1 bg-white rounded text-blue-700 font-mono text-xs">
                                            admin@gestcea.local
                                        </code>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Contraseña:</span>
                                        <code className="px-2 py-1 bg-white rounded text-blue-700 font-mono text-xs">
                                            admin
                                        </code>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={fillDemoCredentials}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                >
                                    Usar estas credenciales
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        © 2025 GestCEA. Todos los derechos reservados.
                    </p>
                </div>
            </motion.div>

            {/* Indicador de versión */}
            <div className="fixed bottom-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                <p className="text-xs text-gray-600">
                    v5.0 <span className="text-green-600">●</span>
                </p>
            </div>
        </div>
    );
}