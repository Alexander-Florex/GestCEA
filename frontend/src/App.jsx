import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alumnos from './pages/Alumnos';
import Profesores from './pages/Profesores';
import Cursos from './pages/Cursos';
import Inscripciones from './pages/Inscripciones';
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
                <Route path="deudores" element={<Navigate to="/dashboard/inscripciones" />} /> {/* placeholder if deudores page not implemented */}
                <Route path="usuarios" element={<Usuarios />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}
