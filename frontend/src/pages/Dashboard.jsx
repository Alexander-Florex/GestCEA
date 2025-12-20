// src/pages/Dashboard.jsx
import React from 'react';
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
    FaHome
} from 'react-icons/fa';

const menuItems = [
    {
        icon: FaUsers,
        title: "Alumnos",
        subtitle: "Administra los registros de todos los estudiantes.",
        path: "alumnos"
    },
    {
        icon: FaChalkboardTeacher,
        title: "Profesores",
        subtitle: "Gestiona la información de los docentes.",
        path: "profesores"
    },
    {
        icon: FaBook,
        title: "Cursos",
        subtitle: "Explora y administra los cursos.",
        path: "cursos"
    },
    {
        icon: FaClipboardList,
        title: "Inscribir a curso",
        subtitle: "Gestiona las inscripciones de los estudiantes.",
        path: "inscripciones"
    },
    {
        icon: FaGraduationCap,
        title: "Parametrización",
        subtitle: "Administra las parametrizaciones del sistema.",
        path: "becas"
    },
    {
        icon: FaCashRegister,
        title: "Caja Diaria",
        subtitle: "Visualiza los movimientos diarios por forma de pago.",
        path: "caja-diaria"
    },
    {
        icon: FaDollarSign,
        title: "Deudores",
        subtitle: "Visualiza estudiantes con deudas.",
        path: "deudores"
    },
    {
        icon: FaChartBar,
        title: "Informes",
        subtitle: "Reportes y estadísticas del sistema.",
        path: "informes"
    },
    {
        icon: FaUsers,
        title: "Usuarios",
        subtitle: "Visualiza a los usuarios con acceso al sistema.",
        path: "usuarios"
    },
    {
        icon: FaMoneyBillWave,
        title: "Cobros",
        subtitle: "Registrar y consultar cobros de alumnos.",
        path: "cobros"
    }
];

export default function Dashboard() {
    const location = useLocation();
    const isMainDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50">
            <Navbar />

            {/* Header con colores rojo y azul */}
            <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
                <p className="text-red-100 text-lg">
                    Bienvenido al sistema de gestión CEA CURSOS
                </p>
            </div>

            {/* Layout principal */}
            <div className="flex flex-1">
                {/* Menú lateral - solo se muestra cuando NO estamos en el dashboard principal */}
                {!isMainDashboard && (
                    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
                        {/* Botón de inicio */}
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50 border-b border-gray-200 transition-colors"
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
                                        className={`flex items-center gap-3 px-4 py-3 transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-r from-red-100 to-blue-100 border-l-4 border-blue-600 text-blue-700 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                                        }`}
                                    >
                                        <Icon className={`text-xl ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                )}

                {/* Contenido principal */}
                <main className="flex-1 overflow-auto">
                    {isMainDashboard ? (
                        // Vista de cards cuando estamos en el dashboard principal
                        <div className="p-6 flex flex-wrap">
                            {menuItems.map((item) => (
                                <AnimatedCard
                                    key={item.path}
                                    icon={item.icon}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    linkText={`Ver ${item.title.toLowerCase()}`}
                                    to={item.path}
                                />
                            ))}
                        </div>
                    ) : (
                        // Outlet para las rutas hijas
                        <div className="p-6">
                            <Outlet />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}