// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AnimatedCard from '../components/AnimatedCard';
import {
    FaUsers,
    FaChalkboardTeacher,
    FaBook,
    FaClipboardList,
    FaDollarSign,
    FaGraduationCap,
    FaCashRegister,
    FaChartBar,
    FaMoneyBillWave,
    FaHome,
    FaBars,
    FaTimes,
    FaChevronRight
} from 'react-icons/fa';

const menuItems = [
    {
        icon: FaUsers,
        title: "Alumnos",
        subtitle: "Administra los registros de todos los estudiantes.",
        path: "alumnos",
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: FaChalkboardTeacher,
        title: "Profesores",
        subtitle: "Gestiona la información de los docentes.",
        path: "profesores",
        color: "from-purple-500 to-pink-500"
    },
    {
        icon: FaBook,
        title: "Cursos",
        subtitle: "Explora y administra los cursos.",
        path: "cursos",
        color: "from-emerald-500 to-teal-500"
    },
    {
        icon: FaClipboardList,
        title: "Inscribir a curso",
        subtitle: "Gestiona las inscripciones de los estudiantes.",
        path: "inscripciones",
        color: "from-amber-500 to-orange-500"
    },
    {
        icon: FaGraduationCap,
        title: "Parametrización",
        subtitle: "Administra las parametrizaciones del sistema.",
        path: "becas",
        color: "from-indigo-500 to-blue-500"
    },
    {
        icon: FaCashRegister,
        title: "Caja Diaria",
        subtitle: "Visualiza los movimientos diarios por forma de pago.",
        path: "caja-diaria",
        color: "from-green-500 to-emerald-500"
    },
    {
        icon: FaDollarSign,
        title: "Deudores",
        subtitle: "Visualiza estudiantes con deudas.",
        path: "deudores",
        color: "from-red-500 to-rose-500"
    },
    {
        icon: FaChartBar,
        title: "Informes",
        subtitle: "Reportes y estadísticas del sistema.",
        path: "informes",
        color: "from-violet-500 to-purple-500"
    },
    {
        icon: FaUsers,
        title: "Usuarios",
        subtitle: "Visualiza a los usuarios con acceso al sistema.",
        path: "usuarios",
        color: "from-sky-500 to-blue-500"
    },
    {
        icon: FaMoneyBillWave,
        title: "Cobros",
        subtitle: "Registrar y consultar cobros de alumnos.",
        path: "cobros",
        color: "from-lime-500 to-green-500"
    }
];

export default function Dashboard() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const isMainDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

    // Detectar cambios en el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cerrar sidebar al cambiar de ruta en móviles
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <Navbar />

            {/* Header mejorado */}
            <header className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                <div className="container mx-auto px-4 py-6 md:py-8 relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                                Panel de Control
                            </h1>
                            <p className="text-blue-100 text-sm md:text-base lg:text-lg font-light">
                                Bienvenido al sistema de gestión integral CEA CURSOS
                            </p>
                        </div>

                        {/* Botón de menú móvil */}
                        {!isMainDashboard && isMobile && (
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                aria-label="Toggle menu"
                            >
                                {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Layout principal */}
            <div className="flex flex-1">
                {/* Menú lateral - versión desktop */}
                {!isMainDashboard && !isMobile && (
                    <aside className="w-64 bg-white/90 backdrop-blur-sm shadow-xl border-r border-gray-200/50 hidden lg:block">
                        <div className="sticky top-0 h-screen overflow-y-auto">
                            {/* Botón de inicio */}
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-200/50 transition-all group"
                            >
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg group-hover:scale-110 transition-transform">
                                    <FaHome className="text-white text-lg" />
                                </div>
                                <span className="font-semibold text-gray-800">Inicio</span>
                            </Link>

                            {/* Items del menú */}
                            <nav className="py-4">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname.includes(item.path);

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center justify-between px-4 py-3 transition-all group mx-2 rounded-lg ${isActive
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 text-blue-700 font-semibold shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isActive ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-100 group-hover:bg-blue-50'}`}>
                                                    <Icon className={`text-lg ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'}`} />
                                                </div>
                                                <span className="font-medium">{item.title}</span>
                                            </div>
                                            <FaChevronRight className={`text-sm ${isActive ? 'text-blue-500' : 'text-gray-300 group-hover:text-gray-400'}`} />
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>
                )}

                {/* Menú lateral - versión móvil (drawer) */}
                {!isMainDashboard && isMobile && isSidebarOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />

                        {/* Drawer */}
                        <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
                            <div className="h-full overflow-y-auto">
                                {/* Encabezado del drawer */}
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800">Menú</h2>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 rounded-lg hover:bg-gray-100"
                                    >
                                        <FaTimes size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                {/* Botón de inicio */}
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-blue-50 border-b border-gray-200 transition-colors"
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <FaHome className="text-xl text-blue-600" />
                                    <span className="font-medium">Inicio</span>
                                </Link>

                                {/* Items del menú */}
                                <nav className="py-2">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname.includes(item.path);

                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive
                                                    ? 'bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                                onClick={() => setIsSidebarOpen(false)}
                                            >
                                                <Icon className={`text-xl ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                                                <span>{item.title}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </aside>
                    </>
                )}

                {/* Contenido principal */}
                <main className={`flex-1 min-w-0 transition-all duration-300 ${!isMainDashboard && !isMobile ? 'lg:ml-0' : ''}`}>
                    {isMainDashboard ? (
                        // Vista de cards cuando estamos en el dashboard principal
                        <div className="container mx-auto px-4 py-6 md:py-8">
                            {/* Encabezado del dashboard */}
                            <div className="mb-8">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                                    Resumen del Sistema
                                </h2>
                                <p className="text-gray-600">
                                    Accede rápidamente a todas las funcionalidades del sistema
                                </p>
                            </div>

                            {/* Grid de cards responsivo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                                {menuItems.map((item) => (
                                    <AnimatedCard
                                        key={item.path}
                                        icon={item.icon}
                                        title={item.title}
                                        subtitle={item.subtitle}
                                        linkText={`Acceder`}
                                        to={item.path}
                                        gradient={item.color}
                                    />
                                ))}
                            </div>

                            {/* Estadísticas o información adicional */}
                            <div className="mt-10 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Sistema en funcionamiento
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                        <div className="text-2xl font-bold text-blue-600">24/7</div>
                                        <div className="text-gray-600">Disponibilidad</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                        <div className="text-2xl font-bold text-green-600">100%</div>
                                        <div className="text-gray-600">Datos seguros</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                        <div className="text-2xl font-bold text-purple-600">✓</div>
                                        <div className="text-gray-600">Sincronizado</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Outlet para las rutas hijas - SIN container que limite el ancho
                        <div className="w-full h-full">
                            {/* Breadcrumb */}
                            <div className="bg-white border-b border-gray-200">
                                <div className="container mx-auto px-4 py-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
                                            Inicio
                                        </Link>
                                        <FaChevronRight className="mx-2 text-xs" />
                                        <span className="font-medium text-gray-800 capitalize">
                                            {location.pathname.split('/').pop()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido de la página hija - SIN limitaciones de ancho */}
                            <div className="w-full h-[calc(100vh-200px)] overflow-auto">
                                <Outlet />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Footer minimalista */}
            <footer className="bg-white border-t border-gray-200/50 py-4">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-gray-600 text-sm">
                            © {new Date().getFullYear()} CEA CURSOS - Sistema de Gestión
                        </div>
                        <div className="text-gray-500 text-xs mt-2 md:mt-0">
                            v2.0 • Última actualización: Hoy
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}