// src/contexts/AppDB.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LS_KEY = "gestcea_db_v1";

const defaultDB = {
    students: [],      // {id, nombre, apellido, dni, ...}
    professors: [],    // {id, nombre, apellido, materias:[], horarios:[{dia,desde,hasta}], ...}
    courses: [],       // {id, nombre, profesores:[ids], ... tiposCertificado:[], costosCertificado:{UTN,CEA}, horarios:[] }
    inscriptions: []   // {id, studentId, courseId, ... installments:[]}
};

const AppDBContext = createContext(null);

export function AppDBProvider({ children, seed }) {
    // seed opcional para precargar datos demo
    const [db, setDb] = useState(() => {
        const fromLS = localStorage.getItem(LS_KEY);
        if (fromLS) return JSON.parse(fromLS);
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
    const addInscription = (data) =>
        setDb((d) => ({ ...d, inscriptions: [...d.inscriptions, { ...data, id: getNextId(d.inscriptions) }] }));
    const updateInscription = (id, patch) =>
        setDb((d) => ({ ...d, inscriptions: d.inscriptions.map(i => i.id === id ? { ...i, ...patch } : i) }));
    const removeInscription = (id) =>
        setDb((d) => ({ ...d, inscriptions: d.inscriptions.filter(i => i.id !== id) }));

    // ---- helpers de consulta cruzada (opcionales) ----
    const findStudent = (id) => db.students.find(s => s.id === Number(id));
    const findCourse  = (id) => db.courses.find(c => c.id === Number(id));
    const findProfessor= (id) => db.professors.find(p => p.id === Number(id));

    const value = useMemo(() => ({
        db,
        // getters
        students: db.students,
        professors: db.professors,
        courses: db.courses,
        inscriptions: db.inscriptions,
        findStudent, findCourse, findProfessor,
        // mutations
        addStudent, updateStudent, removeStudent,
        addProfessor, updateProfessor, removeProfessor,
        addCourse, updateCourse, removeCourse,
        addInscription, updateInscription, removeInscription,
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
