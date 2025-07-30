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
  FaDollarSign
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
          title="Inscripciones"
          subtitle="Gestiona las inscripciones de los estudiantes."
          linkText="Ver inscripciones"
          to="inscripciones"
        />
        <AnimatedCard
          icon={FaDollarSign}
          title="Deudores"
          subtitle="Visualiza estudiantes con deudas."
          linkText="Ver deudores"
          to="deudores"
        />
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
