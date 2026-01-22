// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IoLogOut, IoPersonCircle } from 'react-icons/io5';
import logo from '../assets/logo.png';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Efecto para detectar scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Efecto para detectar tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsUserMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isUserMenuOpen && !event.target.closest('.user-menu')) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isUserMenuOpen]);

    return (
        <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50'
            : 'bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900'
        }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo y marca */}
                    <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${isScrolled ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-white/10'}`}>
                            <img
                                src={logo}
                                alt="CEA Cursos"
                                className="h-7 w-auto filter brightness-0 invert"
                            />
                        </div>
                        <div>
                            <h1 className={`text-lg font-bold tracking-tight ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                                CEA CURSOS
                            </h1>
                            <p className={`text-xs ${isScrolled ? 'text-gray-500' : 'text-blue-200'}`}>
                                Sistema de Gestión
                            </p>
                        </div>
                    </div>

                    {/* Acciones del usuario */}
                    <div className="flex items-center">
                        {/* Perfil del usuario - Versión Desktop */}
                        {!isMobile && (
                            <div className="flex items-center space-x-4">
                                <div className={`text-right mr-4 ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                                    <p className="text-sm font-medium">{user?.name || 'Usuario'}</p>
                                    <p className="text-xs opacity-80">{user?.role || 'Administrador'}</p>
                                </div>

                                <div className="relative user-menu">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className={`flex items-center justify-center h-9 w-9 rounded-full overflow-hidden ${isScrolled
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90'
                                            : 'bg-gradient-to-r from-blue-400 to-cyan-400 hover:opacity-90'
                                        } transition-opacity`}
                                    >
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <IoPersonCircle className="h-6 w-6 text-white" />
                                        )}
                                    </button>

                                    {/* Menú desplegable - Solo Cerrar Sesión */}
                                    {isUserMenuOpen && (
                                        <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl overflow-hidden border backdrop-blur-md ${isScrolled
                                            ? 'bg-white/95 border-gray-200'
                                            : 'bg-gray-900/95 border-gray-700'
                                        }`}>
                                            {/* Información del usuario */}
                                            <div className={`p-4 border-b ${isScrolled ? 'border-gray-200' : 'border-gray-700'}`}>
                                                <div className="flex items-center space-x-3">
                                                    <div className={`flex items-center justify-center h-10 w-10 rounded-full ${isScrolled
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                                        : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                                    }`}>
                                                        {user?.avatar ? (
                                                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <IoPersonCircle className="h-6 w-6 text-white" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold text-sm ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                                                            {user?.name || 'Usuario'}
                                                        </p>
                                                        <p className={`text-xs ${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>
                                                            {user?.email || 'usuario@ceacursos.com'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Botón de cerrar sesión */}
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors ${isScrolled
                                                    ? 'hover:bg-red-50 text-red-600'
                                                    : 'hover:bg-red-500/20 text-red-400'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <IoLogOut className="h-5 w-5" />
                                                    <span>Cerrar sesión</span>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Versión Móvil */}
                        {isMobile && (
                            <div className="relative user-menu">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className={`flex items-center space-x-2 p-2 rounded-lg ${isScrolled
                                        ? 'hover:bg-gray-100 text-gray-700'
                                        : 'hover:bg-white/10 text-white'
                                    } ${isUserMenuOpen ? (isScrolled ? 'bg-gray-100' : 'bg-white/10') : ''}`}
                                >
                                    <div className={`flex items-center justify-center h-9 w-9 rounded-full overflow-hidden ${isScrolled
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                        : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                    }`}>
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <IoPersonCircle className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                </button>

                                {/* Menú desplegable móvil */}
                                {isUserMenuOpen && (
                                    <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl overflow-hidden border backdrop-blur-md ${isScrolled
                                        ? 'bg-white/95 border-gray-200'
                                        : 'bg-gray-900/95 border-gray-700'
                                    }`}>
                                        {/* Información del usuario */}
                                        <div className={`p-4 border-b ${isScrolled ? 'border-gray-200' : 'border-gray-700'}`}>
                                            <div className="flex items-center space-x-3">
                                                <div className={`flex items-center justify-center h-12 w-12 rounded-full ${isScrolled
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                                    : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                                }`}>
                                                    {user?.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <IoPersonCircle className="h-7 w-7 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                                                        {user?.name || 'Usuario'}
                                                    </p>
                                                    <p className={`text-sm ${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>
                                                        {user?.email || 'usuario@ceacursos.com'}
                                                    </p>
                                                    <p className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${isScrolled
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-blue-900/50 text-blue-200'
                                                    }`}>
                                                        {user?.role || 'Administrador'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón de cerrar sesión */}
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsUserMenuOpen(false);
                                            }}
                                            className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors ${isScrolled
                                                ? 'hover:bg-red-50 text-red-600'
                                                : 'hover:bg-red-500/20 text-red-400'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <IoLogOut className="h-5 w-5" />
                                                <span>Cerrar sesión</span>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Indicador de sesión activa */}
            <div className="h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        </header>
    );
}