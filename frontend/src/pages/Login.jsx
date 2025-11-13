// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDB } from '../contexts/AppDB';

export default function Login() {
    const { login } = useAuth();
    const { users } = useDB();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const success = login(formData, users);

            if (!success) {
                setIsLoading(false);
            }
        } catch (error) {
            console.error('[Login] Error:', error);
            alert('Error al iniciar sesión');
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-red-50 to-blue-50 p-4 relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply opacity-20 animate-blob animation-delay-4000"></div>

            {/* Líneas decorativas */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-red-300 to-transparent opacity-30"></div>
                <div className="absolute bottom-1/3 right-1/3 w-32 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-30"></div>
                <div className="absolute top-1/2 right-1/4 w-px h-24 bg-gradient-to-b from-transparent via-red-400 to-transparent opacity-20"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Tarjeta Principal */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-3xl">

                    {/* Header con Logo */}
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 p-8 text-center relative overflow-hidden">
                        {/* Banda decorativa */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white via-red-300 to-white opacity-60"></div>

                        {/* Logo */}
                        <div className="mb-4 flex justify-center">
                            <div className="bg-white rounded-2xl p-3 shadow-lg transform hover:scale-105 transition-transform duration-300">
                                <img
                                    src="/src/assets/logo.png"
                                    alt="CEA CURSOS Logo"
                                    className="w-16 h-16 object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                {/* Fallback si el logo no carga */}
                                <div className="hidden items-center justify-center w-16 h-16">
                                    <div className="text-center">
                                        <div className="font-bold text-red-600 text-lg">CEA</div>
                                        <div className="text-blue-600 text-xs font-medium">CURSOS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Texto del sistema */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-white">
                                CEA <span className="text-red-200">CURSOS</span>
                            </h1>
                            <p className="text-blue-100 text-sm font-medium">
                                Sistema de Gestión Académica
                            </p>
                        </div>

                        {/* Elementos decorativos del header */}
                        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full"></div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full"></div>
                    </div>

                    {/* Formulario */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campo Usuario */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Usuario
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-red-600">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-300"
                                        placeholder="admin@gestcea.local"
                                        required
                                    />
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-focus-within:w-full"></div>
                                </div>
                            </div>

                            {/* Campo Contraseña */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Contraseña
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-300"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-focus-within:w-full"></div>
                                </div>
                            </div>

                            {/* Botón de Login */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg relative overflow-hidden ${
                                    isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 shadow-red-500/25'
                                }`}
                            >
                                {/* Efecto de brillo en hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>

                                {isLoading ? (
                                    <span className="flex items-center justify-center relative z-10">
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Iniciando sesión...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center relative z-10">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Iniciar Sesión
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Credenciales de prueba */}
                        <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-blue-50 rounded-xl border border-red-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center flex items-center justify-center">
                                <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Credenciales de prueba
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center bg-white/70 rounded-lg px-3 py-2 border border-red-100">
                                    <span className="text-gray-600 font-medium">Usuario:</span>
                                    <span className="font-mono text-red-700 bg-red-100 px-2 py-1 rounded text-xs">admin@gestcea.local</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/70 rounded-lg px-3 py-2 border border-blue-100">
                                    <span className="text-gray-600 font-medium">Contraseña:</span>
                                    <span className="font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">admin</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-center text-xs text-gray-500">
                            © 2025 CEA CURSOS. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .hover\\:shadow-3xl:hover {
                    box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1);
                }
            `}</style>
        </div>
    );
}