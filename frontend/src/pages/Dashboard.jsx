// src/pages/Dashboard.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
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
    FaChartBar
} from 'react-icons/fa';

export default function Dashboard() {
    return (
        <div className="flex flex-col min-h-screen text-white">
            <Navbar />
            <div className="p-6 flex flex-wrap">
                <AnimatedCard
                    icon={FaUsers}
                    title="Alumnos"
                    subtitle="Administra los registros de todos los estudiantes."
                    linkText="Ver alumnos"
                    to="alumnos"
                />
                <AnimatedCard
                    icon={FaChalkboardTeacher}
                    title="Profesores"
                    subtitle="Gestiona la información de los docentes."
                    linkText="Ver profesores"
                    to="profesores"
                />
                <AnimatedCard
                    icon={FaBook}
                    title="Cursos"
                    subtitle="Explora y administra los cursos."
                    linkText="Ver cursos"
                    to="cursos"
                />
                <AnimatedCard
                    icon={FaClipboardList}
                    title="Ver Inscripciones"
                    subtitle="Gestiona las inscripciones de los estudiantes."
                    linkText="Ver inscripciones"
                    to="inscripciones"
                />
                <AnimatedCard
                    icon={FaGraduationCap}
                    title="Parametrización"
                    subtitle="Administra las parametrizaciones del sistema."
                    linkText="Ver parametros"
                    to="becas"
                />
                <AnimatedCard
                    icon={FaCashRegister}
                    title="Caja Diaria"
                    subtitle="Visualiza los movimientos diarios por forma de pago."
                    linkText="Ver caja diaria"
                    to="caja-diaria"
                />
                <AnimatedCard
                    icon={FaDollarSign}
                    title="Deudores"
                    subtitle="Visualiza estudiantes con deudas."
                    linkText="Ver deudores"
                    to="deudores"
                />
                <AnimatedCard
                    icon={FaChartBar}
                    title="Informes"
                    subtitle="Reportes y estadísticas del sistema."
                    linkText="Ver informes"
                    to="informes"
                />
                <AnimatedCard
                    icon={FaUsers}
                    title="Usuarios"
                    subtitle="Visualiza a los usuarios con acceso al sistema."
                    linkText="Ver usuarios"
                    to="usuarios"
                />
            </div>
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
}