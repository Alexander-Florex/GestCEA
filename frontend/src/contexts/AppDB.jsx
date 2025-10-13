// src/contexts/AppDB.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

/** ============== CONFIG ESQUEMA VERSIONADO (escalable) ============== */
const LS_KEY = "gestcea_db_v1";
const SCHEMA_VERSION = 3; // incrementar cuando agregues una nueva migración

const AppDBContext = createContext(null);
export const useDB = () => {
    const ctx = useContext(AppDBContext);
    if (!ctx) throw new Error("useDB debe usarse dentro de <AppDBProvider>");
    return ctx;
};

/** ========================== HELPERS GENERALES ========================== */
const nowISO = () => new Date().toISOString();
const zeroTime = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const getNextId = (arr) => (arr?.length ? Math.max(...arr.map(x => Number(x?.id || 0))) + 1 : 1);
const normalize = (s = "") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

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
    if (!data?.nombre || String(data.nombre).trim().length < 3) throw new Error("El nombre del curso es obligatorio (mín. 3 caracteres).");
    if (data.vacantes != null && Number(data.vacantes) < 0) throw new Error("Las vacantes no pueden ser negativas.");
    if (data.inicio && data.fin) {
        const ini = new Date(data.inicio), fin = new Date(data.fin);
        if (ini > fin) throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
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
    if (!data?.nombre || !data?.apellido) throw new Error("Nombre y apellido son obligatorios.");
    if (data?.dni && !/^\d{7,10}$/.test(String(data.dni))) throw new Error("DNI inválido (solo números, 7 a 10 dígitos).");
    if (requireEmail && !data?.email && !data?.correo) throw new Error("El correo es obligatorio.");
    const mail = String(data?.email || data?.correo || "");
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new Error("Formato de correo inválido.");
};
// Inscripciones
const ensureInscriptionRules = (db, data) => {
    if (!data.studentId || !data.courseId) throw new Error("Alumno y Curso son obligatorios.");
    const dup = db.inscriptions.find(i => i.studentId === data.studentId && i.courseId === data.courseId);
    if (dup) throw new Error("El alumno ya está inscripto a este curso.");
    const curso = db.courses.find(c => c.id === data.courseId);
    if (!curso) throw new Error("Curso inexistente.");
    if (curso?.vacantes > 0) {
        const ocupados = db.inscriptions.filter(i => i.courseId === curso.id).length;
        if (ocupados >= curso.vacantes) throw new Error("No hay vacantes para este curso.");
    }
    const allowed = ["Efectivo", "Tarjeta", "Transferencia"];
    if (data.paymentType && !allowed.includes(data.paymentType)) throw new Error("Forma de pago inválida.");
};
const ensureInstallmentsConsistency = ({ total, installments }) => {
    const sum = Number((installments || []).reduce((a,c) => a + Number(c.amount || 0), 0).toFixed(2));
    const tot = Number(Number(total || 0).toFixed(2));
    if (sum !== tot) throw new Error(`Las cuotas (${sum.toFixed(2)}) no coinciden con el total (${tot.toFixed(2)}).`);
};
// Caja / Pagos
const validateCashMovement = (mov) => {
    if (!mov?.formaPago) throw new Error("La forma de pago es obligatoria.");
    if (Number(mov?.monto) <= 0) throw new Error("El monto debe ser mayor a 0.");
};
const ensureNotOverpay = (inscription, number, monto) => {
    const cuota = (inscription.installments || []).find(c => Number(c.number) === Number(number));
    if (!cuota) throw new Error("Cuota inexistente.");
    const pend = Number(cuota.amount) - Number(cuota.amountPaid || 0);
    if (Number(monto) > pend) throw new Error(`El pago excede lo pendiente ($${pend.toFixed(2)}).`);
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
    settings: { graceDays: 0, currency: "ARS" },

    students: [
        { id: 1, nombre: "Juan", apellido: "Pérez", dni: "12345678", email: "juan.perez@example.com", telefono: "1234567890" },
        { id: 2, nombre: "María", apellido: "Gómez", dni: "87654321", email: "maria.gomez@example.com", telefono: "0987654321" }
    ],

    professors: [
        { id: 1, nombre: "Laura", apellido: "Ramírez", email: "laura.ramirez@example.com", telefono: "1122334455" },
        { id: 2, nombre: "Carlos", apellido: "López", email: "carlos.lopez@example.com", telefono: "5566778899" }
    ],

    users: [
        { id: 1, nombre: "Admin", apellido: "", dni: "00000000", correo: "admin@gestcea.local", "contraseña": "admin", rol: "Administrador", activo: true }
    ],

    courses: [
        {
            id: 1,
            nombre: "Programación Web",
            descripcion: "Curso de desarrollo web con HTML, CSS y JavaScript.",
            vacantes: 30,
            inicio: new Date().toISOString(),
            fin: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
            profesores: [1],
            horarios: [],
            porcentajeTarjeta: 0,
            totalEfectivo: 0,
            totalTarjeta: 0,
            totalTransferencia: 0,
            cuotasEfectivo: 1,
            cuotasTarjeta: 1,
            cuotasTransferencia: 1,
            pagoFechaEfectivo: "Al día",
            pagoVencidoEfectivo: "N/A",
            pagoFechaTransferencia: "Al día",
            pagoVencidoTransferencia: "N/A",
            tiposCertificado: [],
            costosCertificado: {}
        },
        {
            id: 2,
            nombre: "Diseño Gráfico",
            descripcion: "Curso introductorio a herramientas de diseño como Photoshop e Illustrator.",
            vacantes: 20,
            inicio: new Date().toISOString(),
            fin: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
            profesores: [2],
            horarios: [],
            porcentajeTarjeta: 0,
            totalEfectivo: 0,
            totalTarjeta: 0,
            totalTransferencia: 0,
            cuotasEfectivo: 1,
            cuotasTarjeta: 1,
            cuotasTransferencia: 1,
            pagoFechaEfectivo: "Al día",
            pagoVencidoEfectivo: "N/A",
            pagoFechaTransferencia: "Al día",
            pagoVencidoTransferencia: "N/A",
            tiposCertificado: [],
            costosCertificado: {}
        }
    ],

    becas: [],
    inscriptions: [],
    cajaMovimientos: [],
    debts: []
};


/** ======================= REGLAS DE CUOTAS/DEUDA ======================= */
const recalcInstallment = (cuota, { justPaid = false } = {}) => {
    const amount = Number(cuota.amount || 0);
    const paid = Number(cuota.amountPaid || 0);
    let status = "Pendiente";
    if (paid >= amount) status = "Pagado";
    else if (paid > 0) status = "Parcial";
    return {
        ...cuota,
        status,
        paymentDate: status === "Pagado" ? (justPaid ? nowISO() : (cuota.paymentDate || null)) : null,
        payments: Array.isArray(cuota.payments) ? cuota.payments : []
    };
};

/**
 * Reglas de DEUDORES:
 * 1) Deudor si tiene cuotas pendientes en cursos inscriptos (no completó pagos).
 * 2) Deudor si finalizó la cursada y mantiene cuotas sin pagar.
 * 3) Deudor si abandonó sin notificar (estado AbandonoNoNotificado) y debe.
 */
const buildDebts = (db, now = new Date()) => {
    const today = zeroTime(now);
    const grace = Number(db?.settings?.graceDays || 0);
    const out = [];

    for (const ins of (db.inscriptions || [])) {
        const student = (db.students || []).find(s => s.id === ins.studentId) || {};
        const course  = (db.courses  || []).find(c => c.id === ins.courseId) || {};
        const status  = ins.status || INSCRIPTION_STATUS.CURSANDO;

        for (const c of (ins.installments || [])) {
            const amount   = Number(c.amount || 0);
            const paid     = Number(c.amountPaid || 0);
            const pending  = Math.max(0, amount - paid);
            const due      = zeroTime(c.dueDate || now);
            const venc     = new Date(due); venc.setDate(venc.getDate() + grace);
            const isOverdue = pending > 0 && venc < today;
            const daysLate  = isOverdue ? Math.ceil((today - venc) / (1000*60*60*24)) : 0;

            let estadoCuota = "Al día";
            if (pending > 0 && !isOverdue && paid > 0) estadoCuota = "Parcial al día";
            if (isOverdue && paid === 0) estadoCuota = "Vencida";
            if (isOverdue && paid > 0)  estadoCuota = "Vencida (parcial)";

            // Flags de tus reglas
            const isDebtorByPending   = pending > 0; // Regla 1
            const isDebtorAfterFinish = pending > 0 && status === INSCRIPTION_STATUS.FINALIZADO; // Regla 2
            const isDebtorDropout     = pending > 0 && status === INSCRIPTION_STATUS.ABANDONO_NO_NOTIFICADO; // Regla 3

            out.push({
                id: `${ins.id}-${c.number}`,
                inscriptionId: ins.id,
                installmentNumber: c.number,
                studentId: ins.studentId,
                studentName: [student.nombre, student.apellido].filter(Boolean).join(" ") || ins.studentName || "",
                courseId: ins.courseId,
                courseName: course.nombre || ins.courseName || "",
                dueDate: c.dueDate,
                amount, amountPaid: paid, pending,
                estado: estadoCuota,
                isOverdue, daysLate,
                inscriptionStatus: status,
                flags: { isDebtorByPending, isDebtorAfterFinish, isDebtorDropout },
                lastPaymentAt: c.paymentDate || null,
                contact: { email: student.email || "", telefono: student.telefono || "" },
                updatedAt: nowISO()
            });
        }
    }
    return out;
};

/** ============================= MIGRACIONES ============================= */
function migrate(db) {
    let cur = { ...defaultDB, ...db };
    const v = Number(db?.__schema || 1);

    // v1 -> v2: agregar payments[] y recalcular status de cada cuota
    if (v < 2) {
        cur.inscriptions = (cur.inscriptions || []).map(ins => ({
            ...ins,
            installments: (ins.installments || []).map(c => recalcInstallment({ payments: [], ...c }))
        }));
        cur.__schema = 2;
    }

    // v2 -> v3: agregar settings + debts y reconstruir
    if (cur.__schema < 3) {
        cur.settings = cur.settings || { graceDays: 0, currency: "ARS" };
        cur.debts = buildDebts(cur, new Date());
        cur.__schema = 3;
    }

    return { ...defaultDB, ...cur };
}

/** ============================== PROVIDER ============================== */
export function AppDBProvider({ children, seed }) {
    const { user } = useAuth() || {};
    const [db, setDb] = useState(() => {
        const fromLS = localStorage.getItem(LS_KEY);
        if (fromLS) return migrate(JSON.parse(fromLS));
        return migrate(seed ? { ...defaultDB, ...seed } : defaultDB);
    });

    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(db)); }, [db]);

    const currentUserName = () =>
        user?.name || [user?.nombre, user?.apellido].filter(Boolean).join(" ") || "Usuario Sistema";

    /** ============================ STUDENTS ============================ */
    const addStudent = (data) => setDb(d => {
        validatePersonBasic(data);
        ensureUniquePersonId(d.users.concat(d.students), data);
        return { ...d, students: [...d.students, { ...data, id: getNextId(d.students) }] };
    });
    const updateStudent = (id, patch) => setDb(d => {
        const cur = d.students.find(s => s.id === id); if (!cur) return d;
        const merged = { ...cur, ...patch };
        validatePersonBasic(merged);
        ensureUniquePersonId(d.users.concat(d.students), merged, id);
        return { ...d, students: d.students.map(s => s.id === id ? merged : s) };
    });
    const removeStudent = (id) => setDb(d => ({ ...d, students: d.students.filter(s => s.id !== id) }));

    /** ============================ PROFESSORS ============================ */
    const addProfessor = (data) => setDb(d => ({ ...d, professors: [...d.professors, { ...data, id: getNextId(d.professors) }] }));
    const updateProfessor = (id, patch) => setDb(d => ({ ...d, professors: d.professors.map(p => p.id === id ? { ...p, ...patch } : p) }));
    const removeProfessor = (id) => setDb(d => ({ ...d, professors: d.professors.filter(p => p.id !== id) }));

    /** ============================== USERS ============================== */
    const addUser = (data) => setDb(d => {
        validatePersonBasic(data, { requireEmail: true });
        ensureUniquePersonId(d.users.concat(d.students), data);
        if (!data["contraseña"] || String(data["contraseña"]).length < 4) throw new Error("La contraseña debe tener al menos 4 caracteres.");
        return { ...d, users: [...d.users, { ...data, id: getNextId(d.users), activo: data.activo !== false }] };
    });
    const updateUser = (id, patch) => setDb(d => {
        const cur = d.users.find(u => u.id === id); if (!cur) return d;
        const merged = { ...cur, ...patch };
        validatePersonBasic(merged, { requireEmail: true });
        ensureUniquePersonId(d.users.concat(d.students), merged, id);
        return { ...d, users: d.users.map(u => u.id === id ? merged : u) };
    });
    const removeUser = (id) => setDb(d => ({ ...d, users: d.users.filter(u => u.id !== id) }));
    const findUserById = (id) => db.users.find(u => u.id === Number(id));
    const findUserByLogin = (login) => db.users.find(u => (u.correo === login || u.dni === login));

    /** ============================== COURSES ============================== */
    const withCourseDefaults = (data) => ({
        porcentajeTarjeta: 0,
        totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0,
        cuotasEfectivo: 1, cuotasTarjeta: 1, cuotasTransferencia: 1,
        pagoFechaEfectivo: "Al día", pagoVencidoEfectivo: "N/A",
        pagoFechaTransferencia: "Al día", pagoVencidoTransferencia: "N/A",
        tiposCertificado: [], costosCertificado: {},
        horarios: [], profesores: [], vacantes: 0,
        ...data
    });
    const addCourse = (data) => setDb(d => {
        validateCourseData(data);
        ensureUniqueCourseName(d.courses, data.nombre);
        return { ...d, courses: [...d.courses, { ...withCourseDefaults(data), id: getNextId(d.courses) }] };
    });
    const updateCourse = (id, patch) => setDb(d => {
        const cur = d.courses.find(c => c.id === id); if (!cur) return d;
        const merged = { ...cur, ...patch };
        validateCourseData(merged);
        ensureUniqueCourseName(d.courses, merged.nombre, id);
        return { ...d, courses: d.courses.map(c => c.id === id ? merged : c) };
    });
    const removeCourse = (id) => setDb(d => ({ ...d, courses: d.courses.filter(c => c.id !== id) }));

    /** ============================ INSCRIPTIONS ============================ */
    const generateInstallments = ({ total, count, firstDueISO }) => {
        const totalNum = Number(total) || 0;
        const n = Math.max(1, Number(count) || 1);
        const monto = Math.round((totalNum / n) * 100) / 100;
        const firstDate = firstDueISO ? new Date(firstDueISO) : new Date();
        return Array.from({ length: n }, (_, i) => {
            const d = new Date(firstDate); d.setMonth(d.getMonth() + i);
            return {
                number: i + 1,
                amount: monto,
                amountPaid: 0,
                dueDate: d.toISOString(),
                status: "Pendiente",
                paymentDate: null,
                payments: [] // historial
            };
        });
    };

    const addInscription = (data) => {
        const newId = getNextId(db.inscriptions);

        const base = {
            porcentajeTarjeta: 0,
            totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0,
            cuotasEfectivo: 1, cuotasTarjeta: 1, cuotasTransferencia: 1,
            pagoFechaEfectivo: "Al día", pagoVencidoEfectivo: "N/A",
            pagoFechaTransferencia: "Al día", pagoVencidoTransferencia: "N/A",
        };

        const ins = {
            ...base,
            ...data,
            id: newId,
            status: data?.status || INSCRIPTION_STATUS.CURSANDO,
            installments: data?.installments || []
        };

        console.log('🔍 addInscription recibió installments:', data?.installments);
        console.log('🔍 ins.installments después de merge:', ins.installments);

        ensureInscriptionRules(db, ins);
        if (ins.fullPayment && Number(ins.totalFinal) <= 0) throw new Error("El total final debe ser mayor a 0 para pago total.");
        if (ins.installments?.length) ensureInstallmentsConsistency({ total: ins.totalFinal, installments: ins.installments });

        setDb(d => {
            const next = { ...d, inscriptions: [...d.inscriptions, ins] };
            return { ...next, debts: buildDebts(next) };
        });

        const forma = ins.formaPago || ins.paymentType;
        const montoInit = ins.monto || ins.totalFinal;
        if (forma && montoInit) {
            addCajaMovimiento({
                studentId: ins.studentId, courseId: ins.courseId, formaPago: forma,
                estado: ins.status, activo: ins.activo !== false,
                pago: ins.fullPayment ? "Pago Total" : "Seña/Inicial", monto: montoInit,
            });
        }
        return ins;
    };

    const updateInscription = (id, patch) => setDb(d => {
        const next = { ...d, inscriptions: d.inscriptions.map(i => i.id === id ? { ...i, ...patch } : i) };
        return { ...next, debts: buildDebts(next) };
    });
    const removeInscription = (id) => setDb(d => {
        const next = { ...d, inscriptions: d.inscriptions.filter(i => i.id !== id) };
        return { ...next, debts: buildDebts(next) };
    });

    const setInscriptionStatus = (id, status) => setDb(d => {
        const next = { ...d, inscriptions: d.inscriptions.map(i => i.id === id ? { ...i, status } : i) };
        return { ...next, debts: buildDebts(next) };
    });

    /** ================================ CAJA ================================ */
    const addCajaMovimiento = (data) => {
        validateCashMovement(data);
        const movimiento = { ...data, id: getNextId(db.cajaMovimientos), fechaHora: nowISO(), personal: currentUserName() };
        setDb(d => ({ ...d, cajaMovimientos: [...d.cajaMovimientos, movimiento] }));
        return movimiento;
    };

    const updateCajaMovimiento = (id, patch) => setDb(d => ({ ...d, cajaMovimientos: d.cajaMovimientos.map(m => m.id === id ? { ...m, ...patch } : m) }));

    const removeCajaMovimiento = (id) => setDb(d => ({ ...d, cajaMovimientos: d.cajaMovimientos.filter(m => m.id !== id) }));

    // ⬇️ AGREGAR ESTA FUNCIÓN AQUÍ ⬇️
    const getMovimientosByFecha = (fechaISO) => {
        if (!fechaISO) return [];
        const fecha = fechaISO.split('T')[0]; // Extraer solo YYYY-MM-DD
        return (db.cajaMovimientos || []).filter(mov => {
            if (!mov.fechaHora) return false;
            const movFecha = mov.fechaHora.split('T')[0];
            return movFecha === fecha;
        });
    };

    /** ====================== DEPÓSITOS/PAGOS DE CUOTA ====================== */
    const getInstallmentPendingAmount = (inscriptionId, number) => {
        const ins = db.inscriptions.find(i => i.id === Number(inscriptionId));
        const cuota = ins?.installments?.find(c => Number(c.number) === Number(number));
        if (!cuota) return 0;
        return Math.max(0, Number(cuota.amount) - Number(cuota.amountPaid || 0));
    };

    const depositToInstallment = (inscriptionId, number, { monto, formaPago = "Efectivo", nota } = {}) => {
        const amount = Number(monto);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("El monto del depósito debe ser > 0.");
        const ins = db.inscriptions.find(i => i.id === Number(inscriptionId)); if (!ins) throw new Error("Inscripción inexistente.");
        const idx = ins.installments.findIndex(c => Number(c.number) === Number(number)); if (idx === -1) throw new Error("Cuota inexistente.");
        ensureNotOverpay(ins, number, amount);

        const prev = ins.installments[idx];
        const updated = recalcInstallment({
            ...prev,
            amountPaid: Number(prev.amountPaid || 0) + amount,
            payments: [...(prev.payments || []), { id: Date.now(), date: nowISO(), amount, formaPago, note: nota || null }]
        }, { justPaid: Number(prev.amountPaid || 0) + amount >= Number(prev.amount) });

        setDb(d => {
            const nextIns = d.inscriptions.map(i => i.id === ins.id ? { ...i, installments: i.installments.map((c, j) => j === idx ? updated : c) } : i);
            const next = { ...d, inscriptions: nextIns };
            return { ...next, debts: buildDebts(next) };
        });

        addCajaMovimiento({
            studentId: ins.studentId, courseId: ins.courseId, formaPago,
            estado: ins.status, activo: true, pago: `Depósito Cuota ${number}`, monto: amount,
            inscriptionId: ins.id, installmentNumber: number, nota
        });
    };

    const payInstallment = (inscriptionId, number, { formaPago = "Efectivo" } = {}) => {
        const restante = getInstallmentPendingAmount(inscriptionId, number);
        if (restante <= 0) throw new Error("La cuota ya está cancelada.");
        depositToInstallment(inscriptionId, number, { monto: restante, formaPago, nota: "Pago total de cuota" });
    };

    /** ============================ DEUDORES/SETTINGS ============================ */
    const rebuildDebts = () => setDb(d => ({ ...d, debts: buildDebts(d) }));
    const getDebts = ({ onlyOverdue = false } = {}) => (db.debts || []).filter(x => (onlyOverdue ? x.isOverdue : true));

    const getDebtorsGrouped = ({ onlyOverdue = false } = {}) => {
        const rows = getDebts({ onlyOverdue });
        const map = new Map();
        for (const r of rows) {
            if (r.pending <= 0) continue;
            if (!map.has(r.studentId)) {
                map.set(r.studentId, { studentId: r.studentId, studentName: r.studentName, contact: r.contact, totalPending: 0, cuotas: [] });
            }
            const g = map.get(r.studentId);
            g.totalPending += r.pending;
            g.cuotas.push(r);
        }
        return Array.from(map.values()).sort((a,b) => b.totalPending - a.totalPending);
    };

    const getDebtorsDetailed = ({ onlyOverdue = false } = {}) => {
        const rows = getDebts({ onlyOverdue });
        const byStudent = new Map();

        for (const r of rows) {
            if (r.pending <= 0) continue; // solo deudas reales
            const key = r.studentId;
            if (!byStudent.has(key)) {
                byStudent.set(key, {
                    studentId: key,
                    studentName: r.studentName,
                    contact: r.contact,
                    totalPending: 0,
                    cuotas: [],
                    motivos: new Set() // 'regla1', 'regla2', 'regla3'
                });
            }
            const g = byStudent.get(key);
            g.totalPending += r.pending;
            g.cuotas.push(r);

            if (r.flags?.isDebtorByPending)   g.motivos.add('regla1'); // cuotas pendientes
            if (r.flags?.isDebtorAfterFinish) g.motivos.add('regla2'); // finalizó y adeuda
            if (r.flags?.isDebtorDropout)     g.motivos.add('regla3'); // abandono no notificado y adeuda
        }

        return Array.from(byStudent.values())
            .map(x => ({ ...x, motivos: Array.from(x.motivos) }))
            .sort((a,b) => b.totalPending - a.totalPending);
    };

    const updateSettings = (patch) => setDb(d => {
        const next = { ...d, settings: { ...d.settings, ...patch } };
        return { ...next, debts: buildDebts(next) };
    });

    /** ============================== FINDERS ============================== */
    const findStudent   = (id) => db.students.find(s => s.id === Number(id));
    const findCourse    = (id) => db.courses.find(c => c.id === Number(id));
    const findProfessor = (id) => db.professors.find(p => p.id === Number(id));
    const findBeca      = (id) => db.becas.find(b => b.id === Number(id));

    /** ============================== VALUE ============================== */
    const value = useMemo(() => ({
        db,
        // colecciones
        students: db.students, professors: db.professors, users: db.users, courses: db.courses,
        becas: db.becas, inscriptions: db.inscriptions, cajaMovimientos: db.cajaMovimientos, debts: db.debts,
        settings: db.settings,
        // constantes útiles en UI
        INSCRIPTION_STATUS,
        // finders
        findStudent, findCourse, findProfessor, findUserById, findUserByLogin, findBeca,
        // students
        addStudent, updateStudent, removeStudent,
        // professors
        addProfessor, updateProfessor, removeProfessor,
        // users
        addUser, updateUser, removeUser,
        // courses
        addCourse, updateCourse, removeCourse,
        // inscriptions
        addInscription, updateInscription, removeInscription, generateInstallments, setInscriptionStatus,
        // caja/pagos
        addCajaMovimiento, updateCajaMovimiento, removeCajaMovimiento,
        getMovimientosByFecha, // ⬅️ AGREGAR AQUÍ
        depositToInstallment, payInstallment, getInstallmentPendingAmount,
        // deudores
        rebuildDebts, getDebts, getDebtorsGrouped, getDebtorsDetailed,
        // settings
        updateSettings,
        // util
        reset: () => setDb(migrate(defaultDB))
    }), [db, user]);

    return <AppDBContext.Provider value={value}>{children}</AppDBContext.Provider>;
}
