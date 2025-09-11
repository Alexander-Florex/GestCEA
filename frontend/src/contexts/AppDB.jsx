// src/contexts/AppDB.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const LS_KEY = "gestcea_db_v1";

const defaultDB = {
    students: [],      // {id, nombre, apellido, dni, ...}
    professors: [],    // {id, nombre, apellido, materias:[], horarios:[{dia,desde,hasta}], ...}
    courses: [],       // {id, nombre, profesores:[ids], ... tiposCertificado:[], costosCertificado:{UTN,CEA}, horarios:[] }
    inscriptions: [],  // {id, studentId, courseId, ... installments:[]}
    becas: [],         // {id, tipo, monto, activa}
    cajaMovimientos: [] // {id, studentId, courseId, formaPago, fechaHora, personal, estado, activo, pago}
};

const AppDBContext = createContext(null);

export function AppDBProvider({ children, seed }) {
    // seed opcional para precargar datos demo
    const [db, setDb] = useState(() => {
        const fromLS = localStorage.getItem(LS_KEY);
        if (fromLS) {
            const parsedDB = JSON.parse(fromLS);
            // Asegurar que existan las nuevas propiedades
            return {
                ...defaultDB,
                ...parsedDB,
                becas: parsedDB.becas || [],
                cajaMovimientos: parsedDB.cajaMovimientos || []
            };
        }
        return seed ? { ...defaultDB, ...seed } : defaultDB;
    });

    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify(db));
    }, [db]);

    // ==== helpers ====
    const getNextId = (arr) => (arr.length ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1);

    // ---- Students ----
    const addStudent = (data) =>
        setDb((d) => ({ ...d, students: [...d.students, { ...data, id: getNextId(d.students) }] }));
    const updateStudent = (id, patch) =>
        setDb((d) => ({ ...d, students: d.students.map(s => s.id === id ? { ...s, ...patch } : s) }));
    const removeStudent = (id) =>
        setDb((d) => ({ ...d, students: d.students.filter(s => s.id !== id) }));

    // ---- Professors ----
    const addProfessor = (data) =>
        setDb((d) => ({ ...d, professors: [...d.professors, { ...data, id: getNextId(d.professors) }] }));
    const updateProfessor = (id, patch) =>
        setDb((d) => ({ ...d, professors: d.professors.map(p => p.id === id ? { ...p, ...patch } : p) }));
    const removeProfessor = (id) =>
        setDb((d) => ({ ...d, professors: d.professors.filter(p => p.id !== id) }));

    // ---- Courses ----
    const addCourse = (data) =>
        setDb((d) => ({ ...d, courses: [...d.courses, { ...data, id: getNextId(d.courses) }] }));
    const updateCourse = (id, patch) =>
        setDb((d) => ({ ...d, courses: d.courses.map(c => c.id === id ? { ...c, ...patch } : c) }));
    const removeCourse = (id) =>
        setDb((d) => ({ ...d, courses: d.courses.filter(c => c.id !== id) }));

    // ---- Inscriptions ----
    const addInscription = (data) => {
        const newId = getNextId(db.inscriptions);
        const inscriptionData = { ...data, id: newId };

        setDb((d) => ({ ...d, inscriptions: [...d.inscriptions, inscriptionData] }));

        // Automáticamente crear movimiento de caja cuando se agrega una inscripción
        if (data.formaPago) {
            addCajaMovimiento({
                studentId: data.studentId,
                courseId: data.courseId,
                formaPago: data.formaPago,
                estado: data.estado || 'Cursando',
                activo: data.activo !== undefined ? data.activo : true,
                pago: data.pago || 'Completada'
            });
        }

        return inscriptionData;
    };

    const updateInscription = (id, patch) =>
        setDb((d) => ({ ...d, inscriptions: d.inscriptions.map(i => i.id === id ? { ...i, ...patch } : i) }));
    const removeInscription = (id) =>
        setDb((d) => ({ ...d, inscriptions: d.inscriptions.filter(i => i.id !== id) }));

    // ---- Becas ----
    const addBeca = (data) =>
        setDb((d) => ({ ...d, becas: [...d.becas, { ...data, id: getNextId(d.becas) }] }));
    const updateBeca = (id, patch) =>
        setDb((d) => ({ ...d, becas: d.becas.map(b => b.id === id ? { ...b, ...patch } : b) }));
    const removeBeca = (id) =>
        setDb((d) => ({ ...d, becas: d.becas.filter(b => b.id !== id) }));

    // ---- Caja Movimientos ----
    const addCajaMovimiento = (data) => {
        const fechaHora = new Date().toISOString();
        const movimiento = {
            ...data,
            id: getNextId(db.cajaMovimientos),
            fechaHora,
            personal: getCurrentUserName() // Obtener el usuario actual
        };

        setDb((d) => ({ ...d, cajaMovimientos: [...d.cajaMovimientos, movimiento] }));
        return movimiento;
    };

    const updateCajaMovimiento = (id, patch) =>
        setDb((d) => ({ ...d, cajaMovimientos: d.cajaMovimientos.map(m => m.id === id ? { ...m, ...patch } : m) }));

    const removeCajaMovimiento = (id) =>
        setDb((d) => ({ ...d, cajaMovimientos: d.cajaMovimientos.filter(m => m.id !== id) }));

    // ---- helpers de consulta cruzada ----
    const findStudent = (id) => db.students.find(s => s.id === Number(id));
    const findCourse = (id) => db.courses.find(c => c.id === Number(id));
    const findProfessor = (id) => db.professors.find(p => p.id === Number(id));
    const findBeca = (id) => db.becas.find(b => b.id === Number(id));

    // Helper para obtener nombre del usuario actual (requiere AuthContext)
    const getCurrentUserName = () => {
        // Esto debería obtener el usuario actual del contexto de autenticación
        // Por ahora retornamos un valor por defecto
        return "Usuario Sistema";
    };

    // Obtener movimientos de caja por forma de pago
    const getMovimientosByFormaPago = (formaPago) =>
        db.cajaMovimientos.filter(m => m.formaPago === formaPago);

    // Obtener movimientos de caja por fecha
    const getMovimientosByFecha = (fecha) => {
        const fechaInicio = new Date(fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(fecha);
        fechaFin.setHours(23, 59, 59, 999);

        return db.cajaMovimientos.filter(m => {
            const movimientoFecha = new Date(m.fechaHora);
            return movimientoFecha >= fechaInicio && movimientoFecha <= fechaFin;
        });
    };

    const value = useMemo(() => ({
        db,
        // getters
        students: db.students,
        professors: db.professors,
        courses: db.courses,
        inscriptions: db.inscriptions,
        becas: db.becas,
        cajaMovimientos: db.cajaMovimientos,
        findStudent, findCourse, findProfessor, findBeca,
        getMovimientosByFormaPago,
        getMovimientosByFecha,
        // mutations
        addStudent, updateStudent, removeStudent,
        addProfessor, updateProfessor, removeProfessor,
        addCourse, updateCourse, removeCourse,
        addInscription, updateInscription, removeInscription,
        addBeca, updateBeca, removeBeca,
        addCajaMovimiento, updateCajaMovimiento, removeCajaMovimiento,
        // util
        reset: () => setDb(defaultDB),
    }), [db]);

    return <AppDBContext.Provider value={value}>{children}</AppDBContext.Provider>;
}

export const useDB = () => {
    const ctx = useContext(AppDBContext);
    if (!ctx) throw new Error("useDB debe usarse dentro de <AppDBProvider>");
    return ctx;
};