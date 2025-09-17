import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alumnos from './pages/Alumnos';
import Profesores from './pages/Profesores';
import Cursos from './pages/Cursos';
import Inscripciones from './pages/Inscripciones';
import Becas from './pages/Becas';
import CajaDiaria from './pages/CajaDiaria';
import Informes from './pages/Informes';
import Usuarios from './pages/Usuarios';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user?.role === 'Administrador' ? children : <Navigate to="/login" />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            >
                <Route path="alumnos" element={<Alumnos />} />
                <Route path="profesores" element={<Profesores />} />
                <Route path="cursos" element={<Cursos />} />
                <Route path="inscripciones" element={<Inscripciones />} />
                <Route path="becas" element={<Becas />} />
                <Route path="caja-diaria" element={<CajaDiaria />} />
                <Route path="informes" element={<Informes />} />
                <Route path="deudores" element={<Navigate to="/dashboard/inscripciones" />} />
                <Route path="usuarios" element={<Usuarios />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}