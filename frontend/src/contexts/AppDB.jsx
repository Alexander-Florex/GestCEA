// src/contexts/AppDB.jsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";

/** ============== CONFIG ESQUEMA VERSIONADO (escalable) ============== */
const LS_KEY = "gestcea_db_v1";
const LS_BACKUP_KEY = "gestcea_db_backup";
const LS_AUDIT_KEY = "gestcea_audit_log";
const SCHEMA_VERSION = 5; // ✅ Incrementado para incluir mejoras
const AUTO_BACKUP_INTERVAL = 30 * 60 * 1000; // 30 minutos

const AppDBContext = createContext(null);
export const useDB = () => {
    const ctx = useContext(AppDBContext);
    if (!ctx) throw new Error("useDB debe usarse dentro de <AppDBProvider>");
    return ctx;
};

/** ========================== UTILIDADES DE COMPRESIÓN ========================== */
const compress = (data) => {
    try {
        const jsonString = JSON.stringify(data);
        return btoa(encodeURIComponent(jsonString));
    } catch (error) {
        console.error('[DB] Error comprimiendo datos:', error);
        return null;
    }
};

const decompress = (compressed) => {
    try {
        const jsonString = decodeURIComponent(atob(compressed));
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('[DB] Error descomprimiendo datos:', error);
        return null;
    }
};

/** ========================== SISTEMA DE AUDITORÍA ========================== */
const AUDIT_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    PAYMENT: 'PAYMENT',
    INSCRIPTION: 'INSCRIPTION'
};

const createAuditLog = (action, entity, entityId, data, userId, userName) => {
    return {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        action,
        entity,
        entityId,
        data: JSON.stringify(data),
        userId,
        userName,
        userAgent: navigator.userAgent
    };
};

const saveAuditLog = (log) => {
    try {
        const existingLogs = JSON.parse(localStorage.getItem(LS_AUDIT_KEY) || '[]');
        const newLogs = [...existingLogs, log];
        const trimmedLogs = newLogs.slice(-1000);
        localStorage.setItem(LS_AUDIT_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
        console.error('[AUDIT] Error guardando log:', error);
    }
};

const getAuditLogs = (filters = {}) => {
    try {
        const logs = JSON.parse(localStorage.getItem(LS_AUDIT_KEY) || '[]');
        let filtered = logs;

        if (filters.entity) filtered = filtered.filter(log => log.entity === filters.entity);
        if (filters.entityId) filtered = filtered.filter(log => log.entityId === filters.entityId);
        if (filters.userId) filtered = filtered.filter(log => log.userId === filters.userId);
        if (filters.action) filtered = filtered.filter(log => log.action === filters.action);
        if (filters.from) filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.from));
        if (filters.to) filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.to));

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
        console.error('[AUDIT] Error obteniendo logs:', error);
        return [];
    }
};

/** ========================== HELPERS GENERALES ========================== */
const nowISO = () => new Date().toISOString();
const zeroTime = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const getNextId = (arr) => (arr?.length ? Math.max(...arr.map(x => Number(x?.id || 0))) + 1 : 1);
const normalize = (s = "") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** ========================== SISTEMA DE ÍNDICES ========================== */
class DatabaseIndex {
    constructor() {
        this.indices = {
            students: new Map(),
            professors: new Map(),
            courses: new Map(),
            inscriptions: new Map(),
            users: new Map(),
            becas: new Map()
        };
    }

    buildIndices(db) {
        this.indices.students.clear();
        (db.students || []).forEach(student => {
            if (student.dni) this.indices.students.set(`dni:${student.dni}`, student.id);
            if (student.email) this.indices.students.set(`email:${student.email}`, student.id);
        });

        this.indices.users.clear();
        (db.users || []).forEach(user => {
            if (user.dni) this.indices.users.set(`dni:${user.dni}`, user.id);
            if (user.correo) this.indices.users.set(`email:${user.correo}`, user.id);
        });

        this.indices.inscriptions.clear();
        (db.inscriptions || []).forEach(ins => {
            const key = `${ins.studentId}-${ins.courseId}`;
            this.indices.inscriptions.set(key, ins.id);
        });

        this.indices.courses.clear();
        (db.courses || []).forEach(course => {
            if (course.nombre) {
                this.indices.courses.set(normalize(course.nombre), course.id);
            }
        });

        // ✅ Nuevo índice para becas
        this.indices.becas.clear();
        (db.becas || []).forEach(beca => {
            if (beca.tipo) {
                this.indices.becas.set(normalize(beca.tipo), beca.id);
            }
        });
    }

    findStudentByDni(dni) { return this.indices.students.get(`dni:${dni}`); }
    findStudentByEmail(email) { return this.indices.students.get(`email:${email}`); }
    findUserByEmail(email) { return this.indices.users.get(`email:${email}`); }
    findUserByLogin(username) {
        const byEmail = this.indices.users.get(`email:${username}`);
        if (byEmail) return byEmail;
        const byDni = this.indices.users.get(`dni:${username}`);
        if (byDni) return byDni;
        return null;
    }
    findInscription(studentId, courseId) { return this.indices.inscriptions.get(`${studentId}-${courseId}`); }
    findCourseByName(nombre) { return this.indices.courses.get(normalize(nombre)); }
    findBecaByType(tipo) { return this.indices.becas.get(normalize(tipo)); }
}

const dbIndex = new DatabaseIndex();

/** ============================== VALIDACIONES ============================== */
// Cursos
const ensureUniqueCourseName = (courses, name, selfId=null) => {
    const n = normalize(name);
    const dup = (courses || []).find(c => {
        if (selfId && c.id === selfId) return false;
        return normalize(c?.nombre || c?.name || "") === n;
    });
    if (dup) throw new Error(`El curso "${name}" ya existe. Si necesitás otra edición, usá un sufijo numérico (p. ej. "${name} 2").`);
};

const validateCourseData = (data) => {
    if (!data?.nombre || String(data.nombre).trim().length < 3) {
        throw new Error("El nombre del curso es obligatorio (mín. 3 caracteres).");
    }
    if (data.vacantes != null && Number(data.vacantes) < 0) {
        throw new Error("Las vacantes no pueden ser negativas.");
    }
    if (data.inicio && data.fin) {
        const ini = new Date(data.inicio), fin = new Date(data.fin);
        if (ini > fin) {
            throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
        }
    }
};

// Personas (alumnos/usuarios)
const ensureUniquePersonId = (list, candidate, selfId=null) => {
    const dni = String(candidate?.dni || "").trim();
    const email = String(candidate?.email || candidate?.correo || "").toLowerCase().trim();
    const dup = (list || []).find(p => {
        if (selfId && p.id === selfId) return false;
        const dniEq = dni && String(p.dni || "").trim() === dni;
        const emailEq = email && String((p.email || p.correo || "").toLowerCase().trim()) === email;
        return dniEq || emailEq;
    });
    if (dup) throw new Error("DNI o correo ya registrado.");
};

const validatePersonBasic = (data, { requireEmail=false } = {}) => {
    if (!data?.nombre || !data?.apellido) {
        throw new Error("Nombre y apellido son obligatorios.");
    }
    if (data?.dni && !/^\d{7,10}$/.test(String(data.dni))) {
        throw new Error("DNI inválido (solo números, 7 a 10 dígitos).");
    }
    if (requireEmail && !data?.email && !data?.correo) {
        throw new Error("El correo es obligatorio.");
    }
    const mail = String(data?.email || data?.correo || "");
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        throw new Error("Formato de correo inválido.");
    }
};

// ✅ Validaciones para Becas
const validateBecaData = (data) => {
    if (!data?.tipo || String(data.tipo).trim().length < 2) {
        throw new Error("El tipo de beca es obligatorio (mín. 2 caracteres).");
    }
    if (data?.monto == null || Number(data.monto) < 0) {
        throw new Error("El monto de la beca debe ser mayor o igual a 0.");
    }
};

const ensureUniqueBecaType = (becas, tipo, selfId=null) => {
    const n = normalize(tipo);
    const dup = (becas || []).find(b => {
        if (selfId && b.id === selfId) return false;
        return normalize(b?.tipo || "") === n;
    });
    if (dup) throw new Error(`Ya existe una beca con el tipo "${tipo}".`);
};

// Inscripciones
const ensureInscriptionRules = (db, data) => {
    if (!data.studentId || !data.courseId) {
        throw new Error("Alumno y Curso son obligatorios.");
    }

    const existingId = dbIndex.findInscription(data.studentId, data.courseId);
    if (existingId) {
        throw new Error("El alumno ya está inscripto a este curso.");
    }

    const curso = db.courses.find(c => c.id === data.courseId);
    if (!curso) {
        throw new Error("Curso inexistente.");
    }

    if (curso?.vacantes > 0) {
        const ocupados = db.inscriptions.filter(i => i.courseId === curso.id).length;
        if (ocupados >= curso.vacantes) {
            throw new Error("No hay vacantes para este curso.");
        }
    }

    const allowed = ["Efectivo", "Tarjeta", "Transferencia"];
    if (data.paymentType && !allowed.includes(data.paymentType)) {
        throw new Error("Forma de pago inválida.");
    }
};

const ensureInstallmentsConsistency = ({ total, installments }) => {
    const sum = Number((installments || []).reduce((a,c) => a + Number(c.amountEnFecha || c.amount || 0), 0).toFixed(2));
    const tot = Number(Number(total || 0).toFixed(2));
    if (sum !== tot) {
        throw new Error(`Las cuotas (${sum.toFixed(2)}) no coinciden con el total (${tot.toFixed(2)}).`);
    }
};

// Caja
const validateCashMovement = (mov) => {
    if (!mov?.formaPago) throw new Error("La forma de pago es obligatoria.");
    if (Number(mov?.monto) <= 0) throw new Error("El monto debe ser mayor a 0.");
};

const ensureNotOverpay = (inscription, number, monto, formaPago = null) => {
    const cuotaMain = (inscription.installments || []).find(c => Number(c.number) === Number(number));
    if (!cuotaMain) throw new Error("Cuota inexistente.");

    let amountDue = Number(cuotaMain.amountEnFecha ?? cuotaMain.amount ?? 0);

    if (formaPago && inscription.installmentsByMethod) {
        const key =
            formaPago === "Efectivo" ? "efectivo" :
                formaPago === "Transferencia" ? "transferencia" :
                    "tarjeta";

        const lista = inscription.installmentsByMethod[key];
        const cuotaAlt = Array.isArray(lista)
            ? lista.find(c => Number(c.number) === Number(number))
            : null;

        if (cuotaAlt) {
            const today = new Date();
            const dueDate = new Date(cuotaAlt.dueDate ?? cuotaMain.dueDate);
            const isOverdue = !cuotaMain.frozen && today > dueDate;

            const enFecha = Number(cuotaAlt.amountEnFecha ?? cuotaAlt.amount ?? amountDue);
            const vencido = Number(cuotaAlt.amountVencido ?? enFecha);

            amountDue = isOverdue ? vencido : enFecha;
        }
    }

    const pend = amountDue - Number(cuotaMain.amountPaid || 0);
    if (Number(monto) > pend + 0.000001) {
        throw new Error(`El pago excede lo pendiente ($${pend.toFixed(2)}).`);
    }
};


/** ======================= DEFAULT DB (ESCALABLE) ======================= */
export const INSCRIPTION_STATUS = {
    CURSANDO: 'Cursando',
    FINALIZADO: 'Finalizado',
    BAJA: 'Baja',
    ABANDONO_NO_NOTIFICADO: 'AbandonoNoNotificado'
};

const defaultDB = {
    __schema: SCHEMA_VERSION,
    __createdAt: nowISO(),
    __lastModified: nowISO(),
    settings: {
        // ✅ Settings completo con todos los porcentajes
        graceDays: 0,
        currency: "ARS",
        autoBackup: true,
        backupInterval: 30,
        enableAudit: true,
        porcentajeTransferencia: 5,  // ✅ Agregado
        porcentajeTarjeta: 15,         // ✅ Agregado
        porcentajeIVAFacturaA: 21      // ✅ Agregado
    },

    students: [
        {
            id: 1,
            nombre: "Lucas",
            apellido: "Pérez",
            dni: "30123456",
            email: "lucas.perez@example.com",
            telefono: "+54 11 5555-1001",
            direccion: "Av. Corrientes 1234, CABA",
            fechaNacimiento: "1995-03-15",
            observaciones: "Interesado en desarrollo web",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            nombre: "Martina",
            apellido: "Gómez",
            dni: "31234567",
            email: "martina.gomez@example.com",
            telefono: "+54 11 5555-1002",
            direccion: "Av. Callao 567, CABA",
            fechaNacimiento: "1998-07-22",
            observaciones: "Experiencia previa en diseño",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            nombre: "Agustín",
            apellido: "Romero",
            dni: "32345678",
            email: "agustin.romero@example.com",
            telefono: "+54 11 5555-1003",
            direccion: "Av. Santa Fe 2890, CABA",
            fechaNacimiento: "1997-11-08",
            observaciones: "Estudiante de sistemas",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 4,
            nombre: "Valentina",
            apellido: "López",
            dni: "33456789",
            email: "valentina.lopez@example.com",
            telefono: "+54 11 5555-1004",
            direccion: "Av. Rivadavia 4523, CABA",
            fechaNacimiento: "1999-05-30",
            observaciones: "Busca cambio de carrera",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 5,
            nombre: "Joaquín",
            apellido: "Fernández",
            dni: "34567890",
            email: "joaquin.fernandez@example.com",
            telefono: "+54 11 5555-1005",
            direccion: "Av. Cabildo 1789, CABA",
            fechaNacimiento: "1996-09-12",
            observaciones: "Programador autodidacta",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 6,
            nombre: "Camila",
            apellido: "Sánchez",
            dni: "35678901",
            email: "camila.sanchez@example.com",
            telefono: "+54 11 5555-1006",
            direccion: "Av. Las Heras 3456, CABA",
            fechaNacimiento: "2000-01-25",
            observaciones: "Recién egresada del secundario",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 7,
            nombre: "Mateo",
            apellido: "Ruiz",
            dni: "36789012",
            email: "mateo.ruiz@example.com",
            telefono: "+54 11 5555-1007",
            direccion: "Av. Belgrano 2345, CABA",
            fechaNacimiento: "1994-12-03",
            observaciones: "Trabaja en IT, busca especialización",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 8,
            nombre: "Sofía",
            apellido: "Herrera",
            dni: "37890123",
            email: "sofia.herrera@example.com",
            telefono: "+54 11 5555-1008",
            direccion: "Av. Córdoba 5678, CABA",
            fechaNacimiento: "1998-04-17",
            observaciones: "Interesada en seguridad informática",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 9,
            nombre: "Benjamín",
            apellido: "Castro",
            dni: "38901234",
            email: "benjamin.castro@example.com",
            telefono: "+54 11 5555-1009",
            direccion: "Av. Pueyrredón 1234, CABA",
            fechaNacimiento: "1997-08-28",
            observaciones: "Emprendedor tecnológico",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 10,
            nombre: "Emilia",
            apellido: "Navarro",
            dni: "39012345",
            email: "emilia.navarro@example.com",
            telefono: "+54 11 5555-1010",
            direccion: "Av. Libertador 6789, CABA",
            fechaNacimiento: "1999-10-14",
            observaciones: "Diseñadora gráfica en transición",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
    ],

    professors: [
        {
            id: 1,
            nombre: "Ana",
            apellido: "Morales",
            dni: "40011223",
            email: "ana.morales@gestcea.edu",
            telefono: "+54 11 5500-2001",
            especialidad: "Desarrollo Web Full Stack",
            titulos: "Lic. en Sistemas, Master en Desarrollo Web",
            experiencia: "12 años en desarrollo web y docencia",
            disponibilidad: "Lunes a Viernes 14-20hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            nombre: "Diego",
            apellido: "Salazar",
            dni: "40122334",
            email: "diego.salazar@gestcea.edu",
            telefono: "+54 11 5500-2002",
            especialidad: "Bases de Datos y SQL",
            titulos: "Ing. en Sistemas, Certificación Oracle DBA",
            experiencia: "15 años como DBA y consultor",
            disponibilidad: "Martes y Jueves 18-22hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            nombre: "Paula",
            apellido: "Cabrera",
            dni: "40233445",
            email: "paula.cabrera@gestcea.edu",
            telefono: "+54 11 5500-2003",
            especialidad: "Redes y Telecomunicaciones",
            titulos: "Ing. en Telecomunicaciones, CCNA",
            experiencia: "10 años en infraestructura de redes",
            disponibilidad: "Lunes, Miércoles y Viernes 16-20hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 4,
            nombre: "Gabriel",
            apellido: "Torres",
            dni: "40344556",
            email: "gabriel.torres@gestcea.edu",
            telefono: "+54 11 5500-2004",
            especialidad: "Algoritmos y Estructuras de Datos",
            titulos: "Dr. en Ciencias de la Computación",
            experiencia: "20 años en investigación y docencia",
            disponibilidad: "Martes y Jueves 14-18hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 5,
            nombre: "Laura",
            apellido: "Rivas",
            dni: "40455667",
            email: "laura.rivas@gestcea.edu",
            telefono: "+54 11 5500-2005",
            especialidad: "Frontend y React",
            titulos: "Lic. en Diseño Multimedia, Certified React Developer",
            experiencia: "8 años en desarrollo frontend",
            disponibilidad: "Lunes a Miércoles 18-22hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 6,
            nombre: "Sebastián",
            apellido: "Núñez",
            dni: "40566778",
            email: "sebastian.nunez@gestcea.edu",
            telefono: "+54 11 5500-2006",
            especialidad: "Backend y APIs",
            titulos: "Ing. en Sistemas, AWS Certified Developer",
            experiencia: "11 años en arquitectura de software",
            disponibilidad: "Miércoles a Viernes 16-21hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 7,
            nombre: "Andrea",
            apellido: "Pineda",
            dni: "40677889",
            email: "andrea.pineda@gestcea.edu",
            telefono: "+54 11 5500-2007",
            especialidad: "Arquitectura de Software",
            titulos: "Ing. en Sistemas, Master en Arquitectura de Software",
            experiencia: "14 años como arquitecta de soluciones",
            disponibilidad: "Lunes y Miércoles 19-22hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 8,
            nombre: "Nicolás",
            apellido: "Duarte",
            dni: "40788990",
            email: "nicolas.duarte@gestcea.edu",
            telefono: "+54 11 5500-2008",
            especialidad: "Seguridad Informática",
            titulos: "Lic. en Seguridad Informática, CEH, CISSP",
            experiencia: "13 años en ciberseguridad",
            disponibilidad: "Martes y Jueves 17-21hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 9,
            nombre: "Marcela",
            apellido: "Varela",
            dni: "40899011",
            email: "marcela.varela@gestcea.edu",
            telefono: "+54 11 5500-2009",
            especialidad: "Testing y QA",
            titulos: "Lic. en Sistemas, ISTQB Certified",
            experiencia: "9 años en testing y automatización",
            disponibilidad: "Lunes a Jueves 15-19hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 10,
            nombre: "Tomás",
            apellido: "Quiroga",
            dni: "40910122",
            email: "tomas.quiroga@gestcea.edu",
            telefono: "+54 11 5500-2010",
            especialidad: "Programación Avanzada",
            titulos: "Ing. en Sistemas, Master en Inteligencia Artificial",
            experiencia: "16 años en desarrollo y machine learning",
            disponibilidad: "Miércoles y Viernes 18-22hs",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
    ],

    users: [
        {
            id: 1,
            nombre: "Admin",
            apellido: "Sistema",
            dni: "00000000",
            correo: "admin@gestcea.local",
            contraseña: "admin", // ⚠️ En producción, hashear con bcrypt
            rol: "Administrador",
            activo: true,
            createdAt: nowISO(),
            updatedAt: nowISO()
        }
    ],
    courses: [
        {
            id: 1,
            nombre: "Programación Web I",
            descripcion: "Fundamentos de HTML, CSS y JavaScript básico para crear sitios web estáticos y dinámicos",
            vacantes: 25,
            inicio: "2025-11-10T12:00:00.000Z",
            fin: "2026-02-10T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Presencial",
            nivel: "Inicial",

            // Costos por forma de pago
            totalEfectivo: 180000,
            totalTarjeta: 207000,
            totalTransferencia: 189000,

            // Cantidad de cuotas
            cuotasEfectivo: 3,
            cuotasTarjeta: 6,
            cuotasTransferencia: 3,

            // Valores de cuotas al día
            pagoFechaEfectivo: "60000",
            pagoFechaTransferencia: "63000",
            pagoFechaTarjeta: "34500",

            // Valores de cuotas vencidas
            pagoVencidoEfectivo: "66000",
            pagoVencidoTransferencia: "69300",
            pagoVencidoTarjeta: "37950",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            // Profesores asignados
            profesores: [1],

            // Horarios
            horarios: [
                { dia: "Lunes", horaInicio: "18:00", horaFin: "21:00" },
                { dia: "Miércoles", horaInicio: "18:00", horaFin: "21:00" }
            ],

            // Certificados
            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 5000,
                "Aprobación": 8000
            },

            requisitos: "Conocimientos básicos de computación",
            materialesIncluidos: "Acceso a plataforma online, material descargable",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 2,
            nombre: "Programación Web II",
            descripcion: "JavaScript avanzado, DOM manipulation, AJAX y primeros pasos con frameworks modernos",
            vacantes: 20,
            inicio: "2025-12-01T12:00:00.000Z",
            fin: "2026-03-01T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Híbrido",
            nivel: "Intermedio",

            totalEfectivo: 210000,
            totalTarjeta: 241500,
            totalTransferencia: 220500,

            cuotasEfectivo: 3,
            cuotasTarjeta: 6,
            cuotasTransferencia: 3,

            pagoFechaEfectivo: "70000",
            pagoFechaTransferencia: "73500",
            pagoFechaTarjeta: "40250",

            pagoVencidoEfectivo: "77000",
            pagoVencidoTransferencia: "80850",
            pagoVencidoTarjeta: "44275",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [1, 10],

            horarios: [
                { dia: "Martes", horaInicio: "19:00", horaFin: "22:00" },
                { dia: "Jueves", horaInicio: "19:00", horaFin: "22:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 5000,
                "Aprobación": 8000
            },

            requisitos: "Haber cursado Programación Web I o equivalente",
            materialesIncluidos: "Acceso a plataforma, proyecto final incluido",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 3,
            nombre: "Base de Datos MySQL",
            descripcion: "Diseño, implementación y administración de bases de datos relacionales con MySQL",
            vacantes: 30,
            inicio: "2025-11-15T12:00:00.000Z",
            fin: "2026-02-15T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Presencial",
            nivel: "Intermedio",

            totalEfectivo: 195000,
            totalTarjeta: 224250,
            totalTransferencia: 204750,

            cuotasEfectivo: 3,
            cuotasTarjeta: 6,
            cuotasTransferencia: 3,

            pagoFechaEfectivo: "65000",
            pagoFechaTransferencia: "68250",
            pagoFechaTarjeta: "37375",

            pagoVencidoEfectivo: "71500",
            pagoVencidoTransferencia: "75075",
            pagoVencidoTarjeta: "41113",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [2],

            horarios: [
                { dia: "Lunes", horaInicio: "19:00", horaFin: "22:00" },
                { dia: "Miércoles", horaInicio: "19:00", horaFin: "22:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 5000,
                "Aprobación": 10000
            },

            requisitos: "Conocimientos básicos de programación",
            materialesIncluidos: "Laboratorio virtual MySQL, guías prácticas",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 4,
            nombre: "Redes y Subnetting",
            descripcion: "Fundamentos de redes, protocolos TCP/IP, configuración de routers y switches",
            vacantes: 18,
            inicio: "2025-11-20T12:00:00.000Z",
            fin: "2026-02-20T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Presencial",
            nivel: "Intermedio",

            totalEfectivo: 240000,
            totalTarjeta: 276000,
            totalTransferencia: 252000,

            cuotasEfectivo: 4,
            cuotasTarjeta: 6,
            cuotasTransferencia: 4,

            pagoFechaEfectivo: "60000",
            pagoFechaTransferencia: "63000",
            pagoFechaTarjeta: "46000",

            pagoVencidoEfectivo: "66000",
            pagoVencidoTransferencia: "69300",
            pagoVencidoTarjeta: "50600",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [3],

            horarios: [
                { dia: "Martes", horaInicio: "18:00", horaFin: "21:00" },
                { dia: "Viernes", horaInicio: "18:00", horaFin: "21:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 6000,
                "Aprobación": 10000
            },

            requisitos: "Conocimientos básicos de sistemas operativos",
            materialesIncluidos: "Acceso a simulador de redes Cisco Packet Tracer",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 5,
            nombre: "Algoritmos y Estructuras de Datos",
            descripcion: "Análisis de algoritmos, complejidad computacional y estructuras de datos fundamentales",
            vacantes: 28,
            inicio: "2025-12-05T12:00:00.000Z",
            fin: "2026-03-05T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Virtual",
            nivel: "Intermedio",

            totalEfectivo: 165000,
            totalTarjeta: 189750,
            totalTransferencia: 173250,

            cuotasEfectivo: 3,
            cuotasTarjeta: 6,
            cuotasTransferencia: 3,

            pagoFechaEfectivo: "55000",
            pagoFechaTransferencia: "57750",
            pagoFechaTarjeta: "31625",

            pagoVencidoEfectivo: "60500",
            pagoVencidoTransferencia: "63525",
            pagoVencidoTarjeta: "34788",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [4],

            horarios: [
                { dia: "Lunes", horaInicio: "20:00", horaFin: "22:00" },
                { dia: "Miércoles", horaInicio: "20:00", horaFin: "22:00" },
                { dia: "Viernes", horaInicio: "20:00", horaFin: "22:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 5000,
                "Aprobación": 8000
            },

            requisitos: "Programación básica en cualquier lenguaje",
            materialesIncluidos: "Plataforma de ejercicios online, videos explicativos",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 6,
            nombre: "React Avanzado",
            descripcion: "Patrones avanzados de React, hooks personalizados, context API y performance optimization",
            vacantes: 22,
            inicio: "2025-11-25T12:00:00.000Z",
            fin: "2026-02-25T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Híbrido",
            nivel: "Avanzado",

            totalEfectivo: 225000,
            totalTarjeta: 258750,
            totalTransferencia: 236250,

            cuotasEfectivo: 3,
            cuotasTarjeta: 6,
            cuotasTransferencia: 3,

            pagoFechaEfectivo: "75000",
            pagoFechaTransferencia: "78750",
            pagoFechaTarjeta: "43125",

            pagoVencidoEfectivo: "82500",
            pagoVencidoTransferencia: "86625",
            pagoVencidoTarjeta: "47438",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [5],

            horarios: [
                { dia: "Lunes", horaInicio: "19:00", horaFin: "22:00" },
                { dia: "Jueves", horaInicio: "19:00", horaFin: "22:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 5000,
                "Aprobación": 10000
            },

            requisitos: "Experiencia previa con React y JavaScript ES6+",
            materialesIncluidos: "Repositorio de ejemplos, acceso a comunidad privada",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 7,
            nombre: "Node.js y Express",
            descripcion: "Desarrollo de aplicaciones backend con Node.js, Express, autenticación y APIs REST",
            vacantes: 26,
            inicio: "2025-12-10T12:00:00.000Z",
            fin: "2026-03-10T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Virtual",
            nivel: "Intermedio",

            totalEfectivo: 195000,
            totalTarjeta: 224250,
            totalTransferencia: 204750,

            cuotasEfectivo: 3,
            cuotasTarjeta: 6,
            cuotasTransferencia: 3,

            pagoFechaEfectivo: "65000",
            pagoFechaTransferencia: "68250",
            pagoFechaTarjeta: "37375",

            pagoVencidoEfectivo: "71500",
            pagoVencidoTransferencia: "75075",
            pagoVencidoTarjeta: "41113",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [6],

            horarios: [
                { dia: "Martes", horaInicio: "20:00", horaFin: "22:00" },
                { dia: "Jueves", horaInicio: "20:00", horaFin: "22:00" },
                { dia: "Sábado", horaInicio: "10:00", horaFin: "13:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 5000,
                "Aprobación": 10000
            },

            requisitos: "Conocimientos de JavaScript y bases de datos",
            materialesIncluidos: "Servidor de desarrollo incluido, templates de proyectos",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 8,
            nombre: "Arquitectura de Software",
            descripcion: "Patrones de diseño, principios SOLID, arquitecturas limpias y microservicios",
            vacantes: 16,
            inicio: "2025-11-30T12:00:00.000Z",
            fin: "2026-02-28T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Presencial",
            nivel: "Avanzado",

            totalEfectivo: 270000,
            totalTarjeta: 310500,
            totalTransferencia: 283500,

            cuotasEfectivo: 4,
            cuotasTarjeta: 6,
            cuotasTransferencia: 4,

            pagoFechaEfectivo: "67500",
            pagoFechaTransferencia: "70875",
            pagoFechaTarjeta: "51750",

            pagoVencidoEfectivo: "74250",
            pagoVencidoTransferencia: "77963",
            pagoVencidoTarjeta: "56925",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [7],

            horarios: [
                { dia: "Miércoles", horaInicio: "18:30", horaFin: "21:30" },
                { dia: "Viernes", horaInicio: "18:30", horaFin: "21:30" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 8000,
                "Aprobación": 15000
            },

            requisitos: "Experiencia en desarrollo de software (mín. 2 años)",
            materialesIncluidos: "Casos de estudio reales, acceso a mentorías",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 9,
            nombre: "Seguridad Informática",
            descripcion: "Fundamentos de ciberseguridad, ethical hacking, análisis de vulnerabilidades y hardening",
            vacantes: 20,
            inicio: "2025-12-15T12:00:00.000Z",
            fin: "2026-03-15T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Híbrido",
            nivel: "Avanzado",

            totalEfectivo: 300000,
            totalTarjeta: 345000,
            totalTransferencia: 315000,

            cuotasEfectivo: 4,
            cuotasTarjeta: 6,
            cuotasTransferencia: 4,

            pagoFechaEfectivo: "75000",
            pagoFechaTransferencia: "78750",
            pagoFechaTarjeta: "57500",

            pagoVencidoEfectivo: "82500",
            pagoVencidoTransferencia: "86625",
            pagoVencidoTarjeta: "63250",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [8],

            horarios: [
                { dia: "Lunes", horaInicio: "19:00", horaFin: "22:00" },
                { dia: "Jueves", horaInicio: "19:00", horaFin: "22:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 10000,
                "Aprobación": 20000
            },

            requisitos: "Conocimientos de redes y sistemas operativos",
            materialesIncluidos: "Laboratorio de pentesting, herramientas profesionales",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },

        {
            id: 10,
            nombre: "Testing y QA Automation",
            descripcion: "Metodologías de testing, frameworks de automatización y estrategias de calidad de software",
            vacantes: 24,
            inicio: "2025-12-20T12:00:00.000Z",
            fin: "2026-03-20T12:00:00.000Z",
            duracion: "3 meses",
            modalidad: "Virtual",
            nivel: "Intermedio",

            totalEfectivo: 180000,
            totalTarjeta: 207000,
            totalTransferencia: 189000,

            cuotasEfectivo: 3,
            cuotasTarjeta: 6,
            cuotasTransferencia: 3,

            pagoFechaEfectivo: "60000",
            pagoFechaTransferencia: "63000",
            pagoFechaTarjeta: "34500",

            pagoVencidoEfectivo: "66000",
            pagoVencidoTransferencia: "69300",
            pagoVencidoTarjeta: "37950",

            porcentajeTarjeta: 15,
            porcentajeRecargoCuotaVencida: 10,

            profesores: [9],

            horarios: [
                { dia: "Martes", horaInicio: "19:00", horaFin: "22:00" },
                { dia: "Sábado", horaInicio: "09:00", horaFin: "12:00" }
            ],

            tiposCertificado: ["Asistencia", "Aprobación"],
            costosCertificado: {
                "Asistencia": 5000,
                "Aprobación": 10000
            },

            requisitos: "Conocimientos básicos de programación",
            materialesIncluidos: "Frameworks de testing, acceso a entornos de prueba",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],

    inscriptions: [
        {
            id: 1,
            studentId: 1,
            courseId: 1,
            fechaInscripcion: new Date().toISOString(),
            paymentType: "Efectivo",
            total: 180000,
            status: INSCRIPTION_STATUS.CURSANDO,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            installments: [
                { number: 1, dueDate: "2025-11-10", amount: 60000, amountPaid: 60000, paidAt: "2025-11-10", status: "Pagado" },
                { number: 2, dueDate: "2025-12-10", amount: 60000, amountPaid: 0, status: "Pendiente" },
                { number: 3, dueDate: "2026-01-10", amount: 60000, amountPaid: 0, status: "Pendiente" }
            ]
        },
        {
            id: 2,
            studentId: 2,
            courseId: 2,
            fechaInscripcion: new Date().toISOString(),
            paymentType: "Tarjeta",
            total: 241500,
            status: INSCRIPTION_STATUS.CURSANDO,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            installments: [
                { number: 1, dueDate: "2025-12-01", amount: 40250, amountPaid: 40250, paidAt: "2025-12-01", status: "Pagado" },
                { number: 2, dueDate: "2026-01-01", amount: 40250, amountPaid: 0, status: "Pendiente" },
                { number: 3, dueDate: "2026-02-01", amount: 40250, amountPaid: 0, status: "Pendiente" },
                { number: 4, dueDate: "2026-03-01", amount: 40250, amountPaid: 0, status: "Pendiente" },
                { number: 5, dueDate: "2026-04-01", amount: 40250, amountPaid: 0, status: "Pendiente" },
                { number: 6, dueDate: "2026-05-01", amount: 40250, amountPaid: 0, status: "Pendiente" }
            ]
        },
        {
            id: 3,
            studentId: 3,
            courseId: 3,
            fechaInscripcion: new Date().toISOString(),
            paymentType: "Transferencia",
            total: 204750,
            status: INSCRIPTION_STATUS.CURSANDO,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            installments: [
                { number: 1, dueDate: "2025-11-15", amount: 68250, amountPaid: 68250, paidAt: "2025-11-15", status: "Pagado" },
                { number: 2, dueDate: "2025-12-15", amount: 68250, amountPaid: 0, status: "Pendiente" },
                { number: 3, dueDate: "2026-01-15", amount: 68250, amountPaid: 0, status: "Pendiente" }
            ]
        },
        {
            id: 4,
            studentId: 4,
            courseId: 4,
            fechaInscripcion: new Date().toISOString(),
            paymentType: "Efectivo",
            total: 240000,
            status: INSCRIPTION_STATUS.CURSANDO,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            installments: [
                { number: 1, dueDate: "2025-11-20", amount: 60000, amountPaid: 60000, paidAt: "2025-11-20", status: "Pagado" },
                { number: 2, dueDate: "2025-12-20", amount: 60000, amountPaid: 0, status: "Pendiente" },
                { number: 3, dueDate: "2026-01-20", amount: 60000, amountPaid: 0, status: "Pendiente" },
                { number: 4, dueDate: "2026-02-20", amount: 60000, amountPaid: 0, status: "Pendiente" }
            ]
        },
        {
            id: 5,
            studentId: 5,
            courseId: 5,
            fechaInscripcion: new Date().toISOString(),
            paymentType: "Tarjeta",
            total: 189750,
            status: INSCRIPTION_STATUS.CURSANDO,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            installments: [
                { number: 1, dueDate: "2025-12-05", amount: 31625, amountPaid: 31625, paidAt: "2025-12-05", status: "Pagado" },
                { number: 2, dueDate: "2026-01-05", amount: 31625, amountPaid: 0, status: "Pendiente" },
                { number: 3, dueDate: "2026-02-05", amount: 31625, amountPaid: 0, status: "Pendiente" },
                { number: 4, dueDate: "2026-03-05", amount: 31625, amountPaid: 0, status: "Pendiente" },
                { number: 5, dueDate: "2026-04-05", amount: 31625, amountPaid: 0, status: "Pendiente" },
                { number: 6, dueDate: "2026-05-05", amount: 31625, amountPaid: 0, status: "Pendiente" }
            ]
        }
    ],

    // ✅ Nueva colección para Becas
    becas: [
        {
            id: 1,
            tipo: "Beca Académica",
            descripcion: "Beca por excelencia académica",
            monto: 50000,
            porcentaje: 25,
            activa: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            tipo: "Beca Deportiva",
            descripcion: "Beca para deportistas destacados",
            monto: 30000,
            porcentaje: 15,
            activa: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            tipo: "Beca Social",
            descripcion: "Beca por situación socioeconómica",
            monto: 75000,
            porcentaje: 35,
            activa: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],

    // ✅ Nueva colección para Asignación de Becas
    asignacionBecas: [
        {
            id: 1,
            studentId: 1,
            becaId: 1,
            cursoId: 1,
            fechaAsignacion: new Date().toISOString(),
            montoAsignado: 50000,
            porcentajeAsignado: 25,
            estado: "Activa",
            observaciones: "Excelente rendimiento académico",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],

    caja: [],
    certificados: [],
    auditLog: []
};

/** ========================== MIGRACIONES ========================== */
const migrations = {
    2: (db) => {
        if (!db.settings) db.settings = {};
        db.settings.graceDays = db.settings.graceDays || 0;
        db.settings.currency = db.settings.currency || "ARS";
        db.settings.autoBackup = db.settings.autoBackup ?? true;
        db.settings.backupInterval = db.settings.backupInterval || 30;
        db.settings.enableAudit = db.settings.enableAudit ?? true;
        return db;
    },
    3: (db) => {
        if (!db.becas) db.becas = [];
        if (!db.asignacionBecas) db.asignacionBecas = [];
        return db;
    },
    4: (db) => {
        if (!db.settings.porcentajeTransferencia) db.settings.porcentajeTransferencia = 5;
        if (!db.settings.porcentajeTarjeta) db.settings.porcentajeTarjeta = 15;
        if (!db.settings.porcentajeIVAFacturaA) db.settings.porcentajeIVAFacturaA = 21;
        return db;
    },
    5: (db) => {
        // ✅ Migración para asegurar que los cursos tengan todos los campos de costos
        (db.courses || []).forEach(course => {
            if (!course.totalEfectivo) course.totalEfectivo = 0;
            if (!course.totalTarjeta) course.totalTarjeta = 0;
            if (!course.totalTransferencia) course.totalTransferencia = 0;
            if (!course.cuotasEfectivo) course.cuotasEfectivo = 1;
            if (!course.cuotasTarjeta) course.cuotasTarjeta = 1;
            if (!course.cuotasTransferencia) course.cuotasTransferencia = 1;
            if (!course.pagoFechaEfectivo) course.pagoFechaEfectivo = "0";
            if (!course.pagoFechaTransferencia) course.pagoFechaTransferencia = "0";
            if (!course.pagoFechaTarjeta) course.pagoFechaTarjeta = "0";
            if (!course.pagoVencidoEfectivo) course.pagoVencidoEfectivo = "0";
            if (!course.pagoVencidoTransferencia) course.pagoVencidoTransferencia = "0";
            if (!course.pagoVencidoTarjeta) course.pagoVencidoTarjeta = "0";
            if (!course.porcentajeTarjeta) course.porcentajeTarjeta = 15;
            if (!course.porcentajeRecargoCuotaVencida) course.porcentajeRecargoCuotaVencida = 10;
        });
        return db;
    }
};

const migrateDB = (db) => {
    const currentVersion = db.__schema || 1;
    if (currentVersion < SCHEMA_VERSION) {
        for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
            if (migrations[v]) {
                console.log(`[DB] Aplicando migración v${v}`);
                db = migrations[v](db);
            }
        }
    }
    db.__schema = SCHEMA_VERSION;
    db.__lastModified = nowISO();
    return db;
};

/** ========================== SISTEMA DE BACKUP ========================== */
const createBackup = (db) => {
    try {
        const backupData = {
            ...db,
            __backupAt: nowISO(),
            __backupVersion: SCHEMA_VERSION
        };
        const compressed = compress(backupData);
        if (compressed) {
            localStorage.setItem(LS_BACKUP_KEY, compressed);
            console.log('[BACKUP] Backup creado exitosamente');
            return true;
        }
    } catch (error) {
        console.error('[BACKUP] Error creando backup:', error);
    }
    return false;
};

const restoreBackup = () => {
    try {
        const compressed = localStorage.getItem(LS_BACKUP_KEY);
        if (!compressed) {
            console.warn('[BACKUP] No hay backup disponible');
            return null;
        }
        const backup = decompress(compressed);
        if (backup && backup.__backupVersion) {
            console.log('[BACKUP] Backup restaurado exitosamente');
            return backup;
        }
    } catch (error) {
        console.error('[BACKUP] Error restaurando backup:', error);
    }
    return null;
};

/** ========================== CORE DB ========================== */
export const AppDBProvider = ({ children }) => {
    const { user } = useAuth();
    const [db, setDB] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ========================== PERSISTENCIA ==========================
    const loadDB = useCallback(() => {
        try {
            setError(null);
            const compressed = localStorage.getItem(LS_KEY);
            let loadedDB = compressed ? decompress(compressed) : null;

            if (!loadedDB) {
                console.log('[DB] Inicializando nueva base de datos');
                loadedDB = defaultDB;
            } else if (loadedDB.__schema !== SCHEMA_VERSION) {
                console.log(`[DB] Migrando de v${loadedDB.__schema} a v${SCHEMA_VERSION}`);
                loadedDB = migrateDB(loadedDB);
            }

            // ✅ Asegurar que todas las colecciones existan
            const collections = [
                'students', 'professors', 'users', 'courses', 'inscriptions',
                'caja', 'certificados', 'auditLog', 'settings',
                'becas', 'asignacionBecas' // ✅ Nuevas colecciones
            ];

            collections.forEach(col => {
                if (!loadedDB[col]) loadedDB[col] = [];
            });

            if (!loadedDB.settings) loadedDB.settings = { ...defaultDB.settings };

            // ✅ Reconstruir índices
            dbIndex.buildIndices(loadedDB);

            setDB(loadedDB);
            return loadedDB;
        } catch (err) {
            console.error('[DB] Error cargando base de datos:', err);
            setError('Error cargando los datos. Se usará base limpia.');
            const cleanDB = { ...defaultDB };
            setDB(cleanDB);
            return cleanDB;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveDB = useCallback((newDB) => {
        try {
            const dbToSave = { ...newDB, __lastModified: nowISO() };
            const compressed = compress(dbToSave);
            if (compressed) {
                localStorage.setItem(LS_KEY, compressed);
                setDB(dbToSave);
                dbIndex.buildIndices(dbToSave);

                // ✅ Auto-backup si está habilitado
                if (dbToSave.settings?.autoBackup) {
                    createBackup(dbToSave);
                }
                return true;
            }
        } catch (err) {
            console.error('[DB] Error guardando base de datos:', err);
            setError('Error guardando los datos.');
        }
        return false;
    }, []);

    // ========================== OPERACIONES CRUD ==========================
    // ✅ CREATE con validación y auditoría
    const create = useCallback((collection, data = {}) => {
        if (!db || !db[collection]) throw new Error(`Colección "${collection}" no existe.`);

        let newData = { ...data };

        // ✅ Validaciones específicas por colección
        switch (collection) {
            case 'courses':
                validateCourseData(newData);
                ensureUniqueCourseName(db.courses, newData.nombre);
                break;
            case 'students':
                validatePersonBasic(newData);
                ensureUniquePersonId(db.students, newData);
                break;
            case 'users':
                validatePersonBasic(newData, { requireEmail: true });
                ensureUniquePersonId(db.users, newData);
                break;
            case 'becas':
                validateBecaData(newData);
                ensureUniqueBecaType(db.becas, newData.tipo);
                break;
            case 'inscriptions':
                ensureInscriptionRules(db, newData);
                ensureInstallmentsConsistency(newData);
                break;
        }

        // ✅ Asignar ID y timestamps
        newData.id = getNextId(db[collection]);
        newData.createdAt = nowISO();
        newData.updatedAt = nowISO();

        const updatedCollection = [...db[collection], newData];
        const updatedDB = { ...db, [collection]: updatedCollection };

        // ✅ Auditoría
        if (db.settings?.enableAudit && user) {
            const auditLog = createAuditLog(
                AUDIT_ACTIONS.CREATE,
                collection,
                newData.id,
                newData,
                user.id,
                `${user.nombre} ${user.apellido}`
            );
            saveAuditLog(auditLog);
        }

        return saveDB(updatedDB) ? newData : null;
    }, [db, saveDB, user]);

    // ✅ READ con filtros y búsqueda
    const read = useCallback((collection, filters = {}) => {
        if (!db || !db[collection]) return [];

        let items = [...db[collection]];

        // ✅ Filtros básicos
        if (filters.id) items = items.filter(item => item.id === filters.id);
        if (filters.activo !== undefined) items = items.filter(item => item.activo === filters.activo);
        if (filters.status) items = items.filter(item => item.status === filters.status);

        // ✅ Búsqueda por texto
        if (filters.search) {
            const searchTerm = normalize(filters.search);
            items = items.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(searchTerm)
                )
            );
        }

        // ✅ Ordenamiento
        if (filters.sortBy) {
            items.sort((a, b) => {
                const aVal = a[filters.sortBy];
                const bVal = b[filters.sortBy];
                if (filters.sortOrder === 'desc') {
                    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                }
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            });
        }

        return items;
    }, [db]);

    // ✅ UPDATE con validación y auditoría
    const update = useCallback((collection, id, updates) => {
        if (!db || !db[collection]) throw new Error(`Colección "${collection}" no existe.`);

        const index = db[collection].findIndex(item => item.id === id);
        if (index === -1) throw new Error(`Elemento no encontrado en ${collection}.`);

        let updatedItem = { ...db[collection][index], ...updates, updatedAt: nowISO() };

        // ✅ Validaciones específicas por colección
        switch (collection) {
            case 'courses':
                validateCourseData(updatedItem);
                ensureUniqueCourseName(db.courses, updatedItem.nombre, id);
                break;
            case 'students':
                validatePersonBasic(updatedItem);
                ensureUniquePersonId(db.students, updatedItem, id);
                break;
            case 'users':
                validatePersonBasic(updatedItem, { requireEmail: true });
                ensureUniquePersonId(db.users, updatedItem, id);
                break;
            case 'becas':
                validateBecaData(updatedItem);
                ensureUniqueBecaType(db.becas, updatedItem.tipo, id);
                break;
            case 'inscriptions':
                if (updates.installments) {
                    ensureInstallmentsConsistency(updatedItem);
                }
                break;
        }

        const updatedCollection = [...db[collection]];
        updatedCollection[index] = updatedItem;
        const updatedDB = { ...db, [collection]: updatedCollection };

        // ✅ Auditoría
        if (db.settings?.enableAudit && user) {
            const auditLog = createAuditLog(
                AUDIT_ACTIONS.UPDATE,
                collection,
                id,
                { updates, previous: db[collection][index] },
                user.id,
                `${user.nombre} ${user.apellido}`
            );
            saveAuditLog(auditLog);
        }

        return saveDB(updatedDB) ? updatedItem : null;
    }, [db, saveDB, user]);

    // ✅ DELETE con auditoría
    const remove = useCallback((collection, id, options = {}) => {
        if (!db || !db[collection]) throw new Error(`Colección "${collection}" no existe.`);

        const item = db[collection].find(item => item.id === id);
        if (!item) throw new Error(`Elemento no encontrado en ${collection}.`);

        // ✅ Soft delete si está soportado
        if (options.soft && 'activo' in item) {
            return update(collection, id, { activo: false });
        }

        const updatedCollection = db[collection].filter(item => item.id !== id);
        const updatedDB = { ...db, [collection]: updatedCollection };

        // ✅ Auditoría
        if (db.settings?.enableAudit && user) {
            const auditLog = createAuditLog(
                AUDIT_ACTIONS.DELETE,
                collection,
                id,
                item,
                user.id,
                `${user.nombre} ${user.apellido}`
            );
            saveAuditLog(auditLog);
        }

        return saveDB(updatedDB);
    }, [db, saveDB, update, user]);

    // ========================== OPERACIONES ESPECÍFICAS ==========================

    // ✅ INSCRIPCIONES - GENERA installmentsByMethod
    const inscribirAlumno = useCallback((studentId, courseId, paymentType) => {
        const curso = db.courses.find(c => c.id === courseId);
        if (!curso) throw new Error("Curso no encontrado.");

        // ✅ Calcular total según forma de pago
        let total = 0;
        let cuotas = 1;

        switch (paymentType) {
            case "Efectivo":
                total = curso.totalEfectivo;
                cuotas = curso.cuotasEfectivo;
                break;
            case "Tarjeta":
                total = curso.totalTarjeta;
                cuotas = curso.cuotasTarjeta;
                break;
            case "Transferencia":
                total = curso.totalTransferencia;
                cuotas = curso.cuotasTransferencia;
                break;
            default:
                throw new Error("Forma de pago no válida.");
        }

        // ✅ Generar cuotas PRINCIPALES (según método elegido)
        const installments = Array.from({ length: cuotas }, (_, i) => {
            const installmentNumber = i + 1;
            let amount = 0;

            switch (paymentType) {
                case "Efectivo":
                    amount = Number(curso.pagoFechaEfectivo);
                    break;
                case "Tarjeta":
                    amount = Number(curso.pagoFechaTarjeta);
                    break;
                case "Transferencia":
                    amount = Number(curso.pagoFechaTransferencia);
                    break;
            }

            const dueDate = new Date(curso.inicio);
            dueDate.setMonth(dueDate.getMonth() + i);

            return {
                number: installmentNumber,
                dueDate: dueDate.toISOString().split('T')[0],
                amount,
                amountEnFecha: amount, // ✅ Precio en fecha
                amountVencido: paymentType === "Efectivo"
                    ? Number(curso.pagoVencidoEfectivo)
                    : paymentType === "Tarjeta"
                        ? Number(curso.pagoVencidoTarjeta)
                        : Number(curso.pagoVencidoTransferencia), // ✅ Precio vencido
                amountPaid: 0,
                status: "Pendiente",
                frozen: false
            };
        });

        // ✅ CRÍTICO: Generar installmentsByMethod para TODOS los métodos
        const installmentsByMethod = {
            efectivo: Array.from({ length: curso.cuotasEfectivo }, (_, i) => {
                const dueDate = new Date(curso.inicio);
                dueDate.setMonth(dueDate.getMonth() + i);
                return {
                    number: i + 1,
                    dueDate: dueDate.toISOString().split('T')[0],
                    amount: Number(curso.pagoFechaEfectivo),
                    amountEnFecha: Number(curso.pagoFechaEfectivo),
                    amountVencido: Number(curso.pagoVencidoEfectivo)
                };
            }),
            transferencia: Array.from({ length: curso.cuotasTransferencia }, (_, i) => {
                const dueDate = new Date(curso.inicio);
                dueDate.setMonth(dueDate.getMonth() + i);
                return {
                    number: i + 1,
                    dueDate: dueDate.toISOString().split('T')[0],
                    amount: Number(curso.pagoFechaTransferencia),
                    amountEnFecha: Number(curso.pagoFechaTransferencia),
                    amountVencido: Number(curso.pagoVencidoTransferencia)
                };
            }),
            tarjeta: Array.from({ length: curso.cuotasTarjeta }, (_, i) => {
                const dueDate = new Date(curso.inicio);
                dueDate.setMonth(dueDate.getMonth() + i);
                return {
                    number: i + 1,
                    dueDate: dueDate.toISOString().split('T')[0],
                    amount: Number(curso.pagoFechaTarjeta),
                    amountEnFecha: Number(curso.pagoFechaTarjeta),
                    amountVencido: Number(curso.pagoVencidoTarjeta)
                };
            })
        };

        const inscriptionData = {
            studentId,
            courseId,
            fechaInscripcion: nowISO(),
            paymentType,
            total,
            status: INSCRIPTION_STATUS.CURSANDO,
            installments,
            installmentsByMethod // ✅ AGREGADO: Precios por todos los métodos
        };

        return create('inscriptions', inscriptionData);
    }, [db, create]);

    // ✅ PAGOS (ACTUALIZADO sin romper nada)
    const registrarPago = useCallback(
        (inscriptionId, installmentNumber, monto, formaPago, observaciones = "") => {
            // ✅ Obtener datos frescos de la DB
            const inscription = db.inscriptions.find((i) => i.id === inscriptionId);
            if (!inscription) throw new Error("Inscripción no encontrada.");

            const installment = inscription.installments.find(
                (i) => i.number === installmentNumber
            );
            if (!installment) throw new Error("Cuota no encontrada.");

            // ✅ Verificar si ya está pagada
            if (installment.status === 'Pagada' || installment.status === 'Pagado') {
                throw new Error("Esta cuota ya está pagada.");
            }

            const course = db.courses.find((c) => c.id === inscription.courseId);
            const student = db.students.find((s) => s.id === inscription.studentId);
            if (!student) throw new Error("Estudiante no encontrado.");

            // Método real a usar
            const metodo = formaPago || inscription.paymentType || "Efectivo";

            // =============== CALCULAR MONTO ACTUAL ===============
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = !installment.frozen && today > dueDate;

            let montoActual = 0;

            // Determinar la key del método
            const methodKey = metodo === "Efectivo" ? "efectivo"
                : metodo === "Transferencia" ? "transferencia"
                    : "tarjeta";

            // PRIORIDAD 1: installmentsByMethod (sistema nuevo)
            if (inscription.installmentsByMethod && inscription.installmentsByMethod[methodKey]) {
                const instByMethod = inscription.installmentsByMethod[methodKey].find(
                    i => Number(i.number) === Number(installmentNumber)
                );

                if (instByMethod) {
                    const enFecha = Number(instByMethod.amountEnFecha ?? instByMethod.amount) || 0;
                    const vencido = Number(instByMethod.amountVencido ?? enFecha) || enFecha;
                    montoActual = isOverdue ? vencido : enFecha;
                }
            }

            // PRIORIDAD 2: Curso (fallback)
            if (montoActual === 0 && course) {
                if (isOverdue) {
                    switch (metodo) {
                        case "Efectivo":
                            montoActual = Number(course.pagoVencidoEfectivo) || 0;
                            break;
                        case "Transferencia":
                            montoActual = Number(course.pagoVencidoTransferencia) || 0;
                            break;
                        case "Tarjeta":
                            montoActual = Number(course.pagoVencidoTarjeta) || 0;
                            break;
                    }
                } else {
                    switch (metodo) {
                        case "Efectivo":
                            montoActual = Number(course.pagoFechaEfectivo) || 0;
                            break;
                        case "Transferencia":
                            montoActual = Number(course.pagoFechaTransferencia) || 0;
                            break;
                        case "Tarjeta":
                            montoActual = Number(course.pagoFechaTarjeta) || 0;
                            break;
                    }
                }
            }

            // PRIORIDAD 3: Cuota estática (último recurso)
            if (montoActual === 0) {
                montoActual = isOverdue
                    ? (Number(installment.amountVencido) || Number(installment.amount) || 0)
                    : (Number(installment.amountEnFecha) || Number(installment.amount) || 0);
            }

            const amountPaidActual = Number(installment.amountPaid || 0);
            const pending = Math.max(montoActual - amountPaidActual, 0);

            const montoNum = Number(monto);
            if (montoNum <= 0) throw new Error("El monto debe ser mayor a 0.");

            // ✅ Tolerancia de $1 para evitar errores de redondeo
            if (montoNum > pending + 1) {
                console.warn(`⚠️ Monto ($${montoNum}) supera pendiente ($${pending}), ajustando...`);
                // En lugar de error, ajustar al máximo permitido
            }

            // ✅ Ajustar monto si excede (por redondeo)
            const montoFinal = Math.min(montoNum, pending);

            const nuevoAmountPaid = amountPaidActual + montoFinal;
            const quedaCompleto = nuevoAmountPaid >= montoActual - 0.01;

            const updatedInstallments = inscription.installments.map((i) =>
                i.number === installmentNumber
                    ? {
                        ...i,
                        amountPaid: nuevoAmountPaid,
                        paidAt: quedaCompleto ? nowISO() : i.paidAt ?? null,
                        status: quedaCompleto ? "Pagada" : "Parcial",
                    }
                    : i
            );

            // ✅ Actualizar inscripción directamente en la DB
            const updatedInscriptions = db.inscriptions.map(ins =>
                ins.id === inscriptionId
                    ? { ...ins, installments: updatedInstallments, updatedAt: nowISO() }
                    : ins
            );

            // ✅ CORREGIDO: Registrar en caja con campos correctos para CajaDiaria
            const movimientoCaja = {
                id: getNextId(db.caja || []),
                estudiante: `${student.nombre} ${student.apellido}`,
                personal: user
                    ? (user.name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Sistema')
                    : 'Sistema',
                operacion: `${quedaCompleto ? 'Pago completo' : 'Pago parcial'} cuota ${installmentNumber} - ${course?.nombre || 'Curso'}${observaciones ? ` (${observaciones})` : ''}`,
                entrada: montoFinal,
                salida: 0,
                metodo: metodo,
                fechaHora: nowISO(),
                studentId: student.id,
                courseId: inscription.courseId,
                inscriptionId: inscriptionId,
                installmentNumber: installmentNumber,
                tipo: 'Cobro',
                createdAt: nowISO(),
            };

            const updatedDB = {
                ...db,
                inscriptions: updatedInscriptions,
                caja: [...(db.caja || []), movimientoCaja],
                __lastModified: nowISO()
            };

            // ✅ Auditoría
            if (db.settings?.enableAudit && user) {
                const auditLog = createAuditLog(
                    AUDIT_ACTIONS.PAYMENT,
                    "inscriptions",
                    inscriptionId,
                    {
                        installmentNumber,
                        monto: montoFinal,
                        formaPago: metodo,
                        previousAmountPaid: amountPaidActual,
                        newAmountPaid: nuevoAmountPaid,
                        montoActual,
                        isOverdue,
                        studentName: `${student.nombre} ${student.apellido}`,
                    },
                    user.id,
                    `${user.nombre} ${user.apellido}`
                );
                saveAuditLog(auditLog);
            }

            if (saveDB(updatedDB)) {
                setDB(updatedDB);
                return true;
            }
            return false;
        },
        [db, saveDB, user]
    );



    // ✅ BECAS
    const asignarBeca = useCallback((studentId, becaId, cursoId, observaciones = "") => {
        const beca = db.becas.find(b => b.id === becaId);
        if (!beca) throw new Error("Beca no encontrada.");
        if (!beca.activa) throw new Error("La beca no está activa.");

        const asignacionData = {
            studentId,
            becaId,
            cursoId,
            fechaAsignacion: nowISO(),
            montoAsignado: beca.monto,
            porcentajeAsignado: beca.porcentaje,
            estado: "Activa",
            observaciones,
            createdAt: nowISO(),
            updatedAt: nowISO()
        };

        return create('asignacionBecas', asignacionData);
    }, [create, db]);


    // ✅ DEPOSITAR CUOTA (Pago parcial)
    const depositarCuota = useCallback((inscriptionId, installmentNumber, monto, formaPago, observaciones = '') => {
        try {
            // ✅ Obtener datos frescos de la DB
            const inscription = db.inscriptions.find(ins => ins.id === inscriptionId);
            if (!inscription) throw new Error('Inscripción no encontrada');

            const installment = inscription.installments.find(inst => inst.number === installmentNumber);
            if (!installment) throw new Error('Cuota no encontrada');

            // ✅ Verificar si ya está pagada
            if (installment.status === 'Pagada' || installment.status === 'Pagado') {
                throw new Error('Esta cuota ya está pagada.');
            }

            const student = db.students.find(s => s.id === inscription.studentId);
            const course = db.courses.find(c => c.id === inscription.courseId);

            if (!student) throw new Error('Alumno no encontrado');
            if (!course) throw new Error('Curso no encontrado');

            // ✅ CALCULAR MONTO ACTUAL SEGÚN MÉTODO DE PAGO
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = !installment.frozen && today > dueDate;

            let montoActual = 0;

            // Determinar la key del método
            const methodKey = formaPago === "Efectivo" ? "efectivo"
                : formaPago === "Transferencia" ? "transferencia"
                    : "tarjeta";

            // PRIORIDAD 1: installmentsByMethod (sistema nuevo)
            if (inscription.installmentsByMethod && inscription.installmentsByMethod[methodKey]) {
                const instByMethod = inscription.installmentsByMethod[methodKey].find(
                    i => Number(i.number) === Number(installmentNumber)
                );

                if (instByMethod) {
                    const enFecha = Number(instByMethod.amountEnFecha ?? instByMethod.amount) || 0;
                    const vencido = Number(instByMethod.amountVencido ?? enFecha) || enFecha;
                    montoActual = isOverdue ? vencido : enFecha;
                }
            }

            // PRIORIDAD 2: Curso (fallback)
            if (montoActual === 0 && course) {
                if (isOverdue) {
                    switch (formaPago) {
                        case "Efectivo":
                            montoActual = Number(course.pagoVencidoEfectivo) || 0;
                            break;
                        case "Transferencia":
                            montoActual = Number(course.pagoVencidoTransferencia) || 0;
                            break;
                        case "Tarjeta":
                            montoActual = Number(course.pagoVencidoTarjeta) || 0;
                            break;
                    }
                } else {
                    switch (formaPago) {
                        case "Efectivo":
                            montoActual = Number(course.pagoFechaEfectivo) || 0;
                            break;
                        case "Transferencia":
                            montoActual = Number(course.pagoFechaTransferencia) || 0;
                            break;
                        case "Tarjeta":
                            montoActual = Number(course.pagoFechaTarjeta) || 0;
                            break;
                    }
                }
            }

            // PRIORIDAD 3: Cuota estática (último recurso)
            if (montoActual === 0) {
                montoActual = isOverdue
                    ? (Number(installment.amountVencido) || Number(installment.amount) || 0)
                    : (Number(installment.amountEnFecha) || Number(installment.amount) || 0);
            }

            const amountPaidActual = Number(installment.amountPaid || 0);
            const montoPendiente = Math.max(montoActual - amountPaidActual, 0);

            const montoNum = Number(monto);
            if (montoNum <= 0) throw new Error('El monto debe ser mayor a cero');

            // ✅ Tolerancia de $1 para evitar errores de redondeo
            if (montoNum > montoPendiente + 1) {
                throw new Error(`El monto ($${montoNum.toFixed(2)}) no puede superar lo pendiente ($${montoPendiente.toFixed(2)})`);
            }

            // ✅ Ajustar monto si excede ligeramente (por redondeo)
            const montoFinal = Math.min(montoNum, montoPendiente);

            // Actualizar amountPaid
            const nuevoAmountPaid = amountPaidActual + montoFinal;
            const quedaCompleto = nuevoAmountPaid >= montoActual - 0.01;

            const updatedInstallment = {
                ...installment,
                amountPaid: nuevoAmountPaid,
                status: quedaCompleto ? 'Pagada' : 'Parcial',
                paidAt: quedaCompleto ? new Date().toISOString() : installment.paidAt
            };

            // Actualizar la inscripción
            const updatedInstallments = inscription.installments.map(inst =>
                inst.number === installmentNumber ? updatedInstallment : inst
            );

            const updatedInscription = {
                ...inscription,
                installments: updatedInstallments,
                updatedAt: new Date().toISOString()
            };

            // ✅ CORREGIDO: Crear movimiento de caja con campos correctos
            const nextCajaId = getNextId(db.caja || []);
            const cajaMovimiento = {
                id: nextCajaId,
                estudiante: `${student.nombre} ${student.apellido}`,
                personal: user
                    ? (user.name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Sistema')
                    : 'Sistema',
                operacion: `${quedaCompleto ? 'Pago completo' : 'Pago parcial'} cuota ${installmentNumber} - ${course.nombre}${observaciones ? ` (${observaciones})` : ''}`,
                entrada: montoFinal,
                salida: 0,
                metodo: formaPago,
                fechaHora: new Date().toISOString(),
                studentId: student.id,
                courseId: course.id,
                inscriptionId: inscription.id,
                installmentNumber: installmentNumber,
                tipo: 'Cobro',
                createdAt: new Date().toISOString(),
            };

            // Actualizar DB
            const updatedDB = {
                ...db,
                inscriptions: db.inscriptions.map(ins => ins.id === inscriptionId ? updatedInscription : ins),
                caja: [...(db.caja || []), cajaMovimiento],
                __lastModified: nowISO()
            };

            if (saveDB(updatedDB)) {
                setDB(updatedDB);

                // Auditoría
                if (user) {
                    const auditLog = createAuditLog(
                        AUDIT_ACTIONS.PAYMENT,
                        'inscription',
                        inscriptionId,
                        {
                            installmentNumber,
                            monto: montoFinal,
                            formaPago,
                            quedaCompleto,
                            montoActual,
                            isOverdue,
                            studentName: `${student.nombre} ${student.apellido}`,
                        },
                        user.id,
                        user.name || `${user.nombre} ${user.apellido}`
                    );
                    saveAuditLog(auditLog);
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('[DB] Error en depositarCuota:', error);
            setError(error.message);
            throw error;
        }
    }, [db, user, saveDB]);


    // ✅ CONSULTAS ESPECIALIZADAS
    const getStudentInscriptions = useCallback((studentId) => {
        return db.inscriptions
            .filter(ins => ins.studentId === studentId)
            .map(ins => {
                const course = db.courses.find(c => c.id === ins.courseId);
                return { ...ins, course };
            });
    }, [db]);

    const getCourseInscriptions = useCallback((courseId) => {
        return db.inscriptions
            .filter(ins => ins.courseId === courseId)
            .map(ins => {
                const student = db.students.find(s => s.id === ins.studentId);
                return { ...ins, student };
            });
    }, [db]);

    const getStudentWithBecas = useCallback((studentId) => {
        const student = db.students.find(s => s.id === studentId);
        if (!student) return null;

        const becasAsignadas = db.asignacionBecas
            .filter(ab => ab.studentId === studentId && ab.estado === "Activa")
            .map(ab => {
                const beca = db.becas.find(b => b.id === ab.becaId);
                return { ...ab, beca };
            });

        return { ...student, becas: becasAsignadas };
    }, [db]);

    // ========================== GESTIÓN DE DB ==========================
    const resetDB = useCallback(() => {
        if (window.confirm("¿Estás seguro? Se perderán todos los datos.")) {
            localStorage.removeItem(LS_KEY);
            setDB(defaultDB);
            saveDB(defaultDB);
            return true;
        }
        return false;
    }, [saveDB]);

    const exportDB = useCallback(() => {
        const dataStr = JSON.stringify(db, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `gestcea_backup_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, [db]);

    const importDB = useCallback((jsonData) => {
        try {
            const importedDB = JSON.parse(jsonData);
            const toUse = importedDB.__schema ? migrateDB(importedDB) : migrateDB({ ...defaultDB, ...importedDB });
            if (saveDB(toUse)) {
                setDB(toUse);
                return true;
            }
            return false;
        } catch (e) {
            console.error('[DB] Error importando backup:', e);
            setError('Archivo inválido para importar.');
            return false;
        }
    }, [saveDB]);

    // ========================== EFECTOS ==========================
    // Cargar DB al montar
    useEffect(() => {
        loadDB();
    }, [loadDB]);

    // Auto-backup periódico
    useEffect(() => {
        const id = setInterval(() => {
            if (db && db.settings?.autoBackup) {
                createBackup(db);
            }
        }, AUTO_BACKUP_INTERVAL);
        return () => clearInterval(id);
    }, [db]);

    // ✅ FREEZAR / DESFREEZAR CUOTA (se guarda en la DB)
    const freezarCuota = useCallback(
        (inscriptionId, installmentNumber, newStatus) => {
            try {
                if (!db) throw new Error('Base de datos no inicializada');

                // Buscar inscripción fresca
                const inscription = db.inscriptions.find(
                    ins => ins.id === inscriptionId
                );
                if (!inscription) throw new Error('Inscripción no encontrada');

                // Actualizar solo la cuota indicada
                const updatedInstallments = (inscription.installments || []).map(inst => {
                    if (Number(inst.number) === Number(installmentNumber)) {
                        return {
                            ...inst,
                            frozen: newStatus,
                            // opcional: metadatos de freeze
                            freezeAt: newStatus ? nowISO() : null,
                            freezeByUserId: newStatus && user ? user.id : null,
                        };
                    }
                    return inst;
                });

                // Usamos el update genérico para respetar validaciones y auditoría
                const updated = update('inscriptions', inscriptionId, {
                    installments: updatedInstallments,
                });

                if (!updated) {
                    throw new Error('No se pudo actualizar la cuota');
                }

                return true;
            } catch (error) {
                console.error('[DB] Error en freezarCuota:', error);
                setError(error.message || 'Error al cambiar estado de freeze');
                throw error;
            }
        },
        [db, user, update]
    );

    // ========================== RENDER ==========================
    const contextValue = useMemo(() => ({
        // Estado
        db,
        loading,
        error,

        // ✅ Colecciones base (AGREGADO)
        students: db?.students || [],
        professors: db?.professors || [],
        courses: db?.courses || [],
        inscriptions: db?.inscriptions || [],
        becas: db?.becas || [],
        users: db?.users || [],
        cajaMovimientos: db?.caja || [],              // ✅ AGREGADO
        settings: db?.settings || {},                  // ✅ AGREGADO

        // CRUD Básico
        create,
        read,
        update,
        remove,

        // Operaciones Específicas
        inscribirAlumno,
        registrarPago,
        asignarBeca,
        depositarCuota,
        freezarCuota,

        // CRUD específico por entidad
        addStudent: (data) => create('students', data),
        updateStudent: (id, data) => update('students', id, data),
        removeStudent: (id) => remove('students', id),
        findStudent: (id) => db?.students?.find(s => s.id === id),

        addProfessor: (data) => create('professors', data),
        updateProfessor: (id, data) => update('professors', id, data),
        removeProfessor: (id) => remove('professors', id),
        findProfessor: (id) => db?.professors?.find(p => p.id === id),

        addCourse: (data) => create('courses', data),
        updateCourse: (id, data) => update('courses', id, data),
        removeCourse: (id) => remove('courses', id),
        findCourse: (id) => db?.courses?.find(c => c.id === id),

        addInscription: (data) => create('inscriptions', data),
        updateInscription: (id, data) => update('inscriptions', id, data),
        removeInscription: (id) => remove('inscriptions', id),

        addBeca: (data) => create('becas', data),
        updateBeca: (id, data) => update('becas', id, data),
        removeBeca: (id) => remove('becas', id),
        findBeca: (id) => db?.becas?.find(b => b.id === id),

        // ✅ AGREGADO: CRUD para Users
        addUser: (data) => create('users', data),
        updateUser: (id, data) => update('users', id, data),
        removeUser: (id) => remove('users', id),
        findUser: (id) => db?.users?.find(u => u.id === id),

        // ✅ AGREGADO: Función para Settings
        updateSettings: (newSettings) => {
            const updatedDB = {
                ...db,
                settings: { ...db.settings, ...newSettings },
                __lastModified: nowISO()
            };
            return saveDB(updatedDB);
        },

        // ✅ AGREGADO: Función para Caja
        addCajaMovimiento: (data) => create('caja', data),

        // Consultas
        getStudentInscriptions,
        getCourseInscriptions,
        getStudentWithBecas,
        getAuditLogs,

        // Gestión DB
        resetDB,
        exportDB,
        importDB,
        createBackup: () => createBackup(db),
        restoreBackup,

        // Índices (para búsquedas rápidas)
        findStudentByDni: (dni) => dbIndex.findStudentByDni(dni),
        findStudentByEmail: (email) => dbIndex.findStudentByEmail(email),
        findUserByEmail: (email) => dbIndex.findUserByEmail(email),
        findUserByLogin: (username) => {
            const userId = dbIndex.findUserByLogin(username);
            return db?.users?.find(u => u.id === userId);
        },
        findInscription: (studentId, courseId) => dbIndex.findInscription(studentId, courseId),
        findCourseByName: (nombre) => dbIndex.findCourseByName(nombre),
        findBecaByType: (tipo) => dbIndex.findBecaByType(tipo)
    }), [
        db, loading, error, create, read, update, remove,
        inscribirAlumno, registrarPago, asignarBeca, depositarCuota, freezarCuota,
        getStudentInscriptions, getCourseInscriptions, getStudentWithBecas,
        resetDB, exportDB, importDB, restoreBackup, saveDB  // ✅ AGREGADO saveDB
    ]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <AppDBContext.Provider value={contextValue}>
            {children}
        </AppDBContext.Provider>
    );
};

export default AppDBContext;