// backend/routes/alumnos.js
import express from 'express';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import db from '../firebase.js';

const router = express.Router();
const alumnosRef = collection(db, 'ALUMNOS');

// GET: listar todos
router.get('/', async (req, res) => {
    try {
        const snapshot = await getDocs(alumnosRef);
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(data);
    } catch (err) {
        console.error('Error al obtener alumnos:', err);
        res.status(500).json({
            error: 'Error al obtener alumnos',
            details: err.message
        });
    }
});

// POST: crear nuevo alumno
router.post('/', async (req, res) => {
    try {
        const newAlumno = {
            ...req.body,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString()
        };

        // Validación básica
        if (!newAlumno.nombre || !newAlumno.apellido || !newAlumno.dni) {
            return res.status(400).json({
                error: 'Los campos nombre, apellido y DNI son obligatorios'
            });
        }

        const docRef = await addDoc(alumnosRef, newAlumno);
        res.status(201).json({
            id: docRef.id,
            ...newAlumno
        });
    } catch (err) {
        console.error('Error al crear alumno:', err);
        res.status(500).json({
            error: 'Error al crear alumno',
            details: err.message
        });
    }
});

// PUT: actualizar alumno
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const alumnoActualizado = {
            ...req.body,
            fechaActualizacion: new Date().toISOString()
        };

        // Validación básica
        if (!alumnoActualizado.nombre || !alumnoActualizado.apellido || !alumnoActualizado.dni) {
            return res.status(400).json({
                error: 'Los campos nombre, apellido y DNI son obligatorios'
            });
        }

        await updateDoc(doc(db, 'ALUMNOS', id), alumnoActualizado);
        res.json({
            id,
            ...alumnoActualizado
        });
    } catch (err) {
        console.error('Error al actualizar alumno:', err);
        res.status(500).json({
            error: 'Error al actualizar alumno',
            details: err.message
        });
    }
});

// DELETE: eliminar alumno
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteDoc(doc(db, 'ALUMNOS', id));
        res.json({
            success: true,
            message: 'Alumno eliminado correctamente'
        });
    } catch (err) {
        console.error('Error al eliminar alumno:', err);
        res.status(500).json({
            error: 'Error al eliminar alumno',
            details: err.message
        });
    }
});

export default router;