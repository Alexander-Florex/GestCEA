import { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api/alumnos';

export default function useAlumnos() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAlumnos = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(API);
            if (!res.ok) throw new Error('Error al cargar alumnos');
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching alumnos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlumnos();
    }, []);

    const createAlumno = async (alumno) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alumno),
            });
            if (!res.ok) throw new Error('Error al crear alumno');
            const nuevo = await res.json();
            setStudents((prev) => [...prev, nuevo]);
            return { success: true, data: nuevo };
        } catch (err) {
            console.error('Error creating alumno:', err);
            return { success: false, error: err.message };
        }
    };

    const updateAlumno = async (id, alumno) => {
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alumno),
            });
            if (!res.ok) throw new Error('Error al actualizar alumno');
            const actualizado = await res.json();
            setStudents((prev) => prev.map((a) => (a.id === id ? actualizado : a)));
            return { success: true, data: actualizado };
        } catch (err) {
            console.error('Error updating alumno:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteAlumno = async (id) => {
        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Error al eliminar alumno');
            setStudents((prev) => prev.filter((a) => a.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting alumno:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        students,
        loading,
        error,
        createAlumno,
        updateAlumno,
        deleteAlumno,
        fetchAlumnos,
    };
}