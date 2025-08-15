// src/pages/Inscripciones.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiChevronDown } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

/* ================== Select buscable (robusto) ================== */
function SearchableSelect({ options, value, onChange, placeholder, getLabel, getValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const list = Array.isArray(options) ? options : [];

  const toSafeLabel = (option) => {
    try {
      const raw = getLabel ? getLabel(option) : option;
      if (raw == null) return '';
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
      if (React.isValidElement?.(raw)) {
        const childText = raw.props?.children;
        return typeof childText === 'string' ? childText : String(childText ?? '');
      }
      return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    } catch {
      return '';
    }
  };

  const getSafeValue = (option) => {
    try {
      const v = getValue ? getValue(option) : option?.value ?? option?.id ?? option;
      return v != null ? String(v) : '';
    } catch {
      return '';
    }
  };

  const filtered = useMemo(() => {
    const q = (search ?? '').toLowerCase();
    return list.filter((opt) => toSafeLabel(opt).toLowerCase().includes(q));
  }, [list, search]);

  const selectedOption = list.find((opt) => getSafeValue(opt) === String(value));

  return (
      <div className="relative">
        <div
            className="border-2 border-black rounded-xl p-2 bg-white cursor-pointer flex justify-between items-center"
            onClick={() => setIsOpen(!isOpen)}
        >
        <span className="text-black">
          {selectedOption ? toSafeLabel(selectedOption) : (placeholder || 'Seleccionar...')}
        </span>
          <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-2 border-black rounded-xl mt-1 z-10 max-h-60 overflow-y-auto">
              <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2 border-b border-gray-300 focus:outline-none text-black"
                  onClick={(e) => e.stopPropagation()}
              />
              {filtered.map((option, index) => (
                  <div
                      key={index}
                      className="p-2 hover:bg-purple-100 cursor-pointer text-black"
                      onClick={() => {
                        onChange(getSafeValue(option));
                        setIsOpen(false);
                        setSearch('');
                      }}
                  >
                    {toSafeLabel(option)}
                  </div>
              ))}
              {filtered.length === 0 && (
                  <div className="p-2 text-gray-500">No hay resultados</div>
              )}
            </div>
        )}
      </div>
  );
}

/* ================== Notificaciones ================== */
function Notifications({ notifications, remove }) {
  return (
      <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50">
        <AnimatePresence>
          {notifications.map(n => (
              <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                  className={`px-4 py-2 rounded shadow ${n.type==='success'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}
                  onClick={()=>remove(n.id)}
              >{n.message}</motion.div>
          ))}
        </AnimatePresence>
      </div>
  );
}

/* ================== Fechas / cuotas helpers ================== */
const formatDate = d => {
  if (!d) return '';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2,'0');
  const month = String(date.getMonth()+1).padStart(2,'0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const parseDDMMYYYY = (str) => {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
};
const isOverdue = (dueStr) => {
  const due = parseDDMMYYYY(dueStr);
  if (!due) return false;
  const now = new Date();
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return nowOnly > dueOnly;
};
const getAdjustedAmount = (amount, dueDate) => isOverdue(dueDate) ? amount * 2 : amount;

const generarCuotas = (cuotas, total) => {
  const baseAmount = total / cuotas;
  const installments = [];
  const start = new Date();
  for (let i = 0; i < cuotas; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + i);
    installments.push({
      number: i + 1,
      dueDate: formatDate(dueDate),
      status: 'Pendiente',
      paymentDate: '',
      amount: baseAmount,
    });
  }
  return installments;
};

/* ================== Página ================== */
export default function Inscripciones() {
  // Usa las claves del contexto EXACTAS de AppDB.jsx (inscriptions, etc.)
  const {
    students = [], courses = [], professors = [],
    inscriptions = [], addInscription, updateInscription
  } = useDB();

  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const showNotification = (type, message) => {
    const id = Date.now();
    setNotifications(n=>[...n,{id,type,message}]);
    setTimeout(()=>removeNotification(id), 3000);
  };
  const removeNotification = id => setNotifications(n=>n.filter(x=>x.id!==id));

  const filtered = useMemo(
      () => (inscriptions || []).filter(i =>
          (i.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
          (i.courseName  || '').toLowerCase().includes(search.toLowerCase())
      ),
      [inscriptions, search]
  );

  const [form, setForm] = useState({
    studentId:'',
    courseId:'',
    professorId:'',
    paymentType:'Efectivo',
    fullPayment:false,
    // del curso
    customInicio:'',
    customFin:'',
    customVacantes:0,
    customTotalEfectivo:0,
    customTotalTarjeta:0,
    customCuotas:0,
    customTipoCertificado:'',
    customCostoCertificado:0,
    // bonificación
    hasBonus:false,
    bonusAmount:0
  });

  /* ===== Autocompletar por curso ===== */
  useEffect(() => {
    const c = courses.find(c=>c.id === Number(form.courseId));
    if(c) {
      setForm(prev=>({
        ...prev,
        customInicio: c.inicio || '',
        customFin: c.fin || '',
        customVacantes: c.vacantes ?? 0,
        customTotalEfectivo: Number(c.totalEfectivo ?? 0),
        customTotalTarjeta: Number(c.totalTarjeta ?? 0),
        customCuotas: Number(c.cuotas ?? 0),
        customTipoCertificado: c.tiposCertificado?.[0] ?? '',
        customCostoCertificado: Number(c.costosCertificado?.[c.tiposCertificado?.[0]] ?? 0)
      }));
    }
  }, [form.courseId, courses]);

  // costo certificado al cambiar tipo
  useEffect(() => {
    const c = courses.find(c=>c.id === Number(form.courseId));
    if(c && form.customTipoCertificado) {
      setForm(prev=>({
        ...prev,
        customCostoCertificado: Number(c.costosCertificado?.[form.customTipoCertificado] ?? 0)
      }));
    }
  }, [form.customTipoCertificado, form.courseId, courses]);

  const openForm = insc => {
    if(insc) {
      setEditing(insc);
      setForm({
        studentId:insc.studentId.toString(),
        courseId:insc.courseId.toString(),
        professorId:insc.professorId?.toString() || '',
        paymentType:insc.paymentType,
        fullPayment:insc.fullPayment,
        customInicio:insc.inicio || '',
        customFin:insc.fin || '',
        customVacantes:Number(insc.vacantes ?? 0),
        customTotalEfectivo:Number(insc.totalEfectivo ?? 0),
        customTotalTarjeta:Number(insc.totalTarjeta ?? 0),
        customCuotas:Number(insc.cuotas ?? 0),
        customTipoCertificado:insc.tipoCertificado || '',
        customCostoCertificado:Number(insc.costoCertificado ?? 0),
        hasBonus: !!insc.hasBonus,
        bonusAmount: Number(insc.bonusAmount || 0)
      });
    } else {
      setEditing(null);
      setForm({
        studentId:'', courseId:'', professorId:'', paymentType:'Efectivo', fullPayment:false,
        customInicio:'', customFin:'', customVacantes:0,
        customTotalEfectivo:0, customTotalTarjeta:0, customCuotas:0,
        customTipoCertificado:'', customCostoCertificado:0,
        hasBonus:false, bonusAmount:0
      });
    }
    setIsFormOpen(true);
  };
  const closeForm = () => { setIsFormOpen(false); setEditing(null); };

  // cambios seguros
  const handleChange = e => {
    const {name, type, checked, value} = e.target;
    if (type === 'checkbox') {
      setForm(f=>({ ...f, [name]: checked }));
    } else if (type === 'number') {
      setForm(f=>({ ...f, [name]: Number(value) }));
    } else {
      setForm(f=>({ ...f, [name]: value }));
    }
  };

  const selectedCourse = courses.find(c=>c.id===Number(form.courseId));
  const availableCourseProfessors = (professors || []).filter(p => (selectedCourse?.profesores || []).includes(p.id));
  const selectedCourseCertificates = selectedCourse?.tiposCertificado || [];

  const calcTotalFinal = (paymentType, totalEf, totalTar, cert, bonus=0) => {
    const base = Number(paymentType==='Efectivo' ? totalEf : totalTar);
    const total = base + Number(cert) - Number(bonus || 0);
    return Math.max(0, total);
  };

  const handleSubmit = e => {
    e.preventDefault();
    try {
      if(!form.studentId||!form.courseId||!form.professorId)
        throw new Error('Completa los campos obligatorios');

      const student = students.find(s=>s.id===Number(form.studentId));
      const course = courses.find(c=>c.id===Number(form.courseId));
      const professor = professors.find(p => p.id === Number(form.professorId));
      if (!course || !student || !professor) throw new Error('Curso, alumno o profesor no encontrado.');

      const totalNeto = calcTotalFinal(
          form.paymentType,
          form.customTotalEfectivo,
          form.customTotalTarjeta,
          form.customCostoCertificado,
          form.hasBonus ? form.bonusAmount : 0
      );

      let installments = [];
      if(!form.fullPayment) {
        if (Number(form.customCuotas) <= 0) throw new Error('Ingrese número de cuotas válido.');
        installments = generarCuotas(Number(form.customCuotas), totalNeto);
      }

      const newInsc = {
        studentId: student.id,
        courseId: course.id,
        studentName: `${student.nombre} ${student.apellido}`,
        courseName: course.nombre,
        professorId: professor.id,
        professorName: `${professor.nombre} ${professor.apellido}`,
        inicio: course.inicio,
        fin: course.fin,
        vacantes: course.vacantes,
        paymentType: form.paymentType,
        totalEfectivo: Number(form.customTotalEfectivo),
        totalTarjeta: Number(form.customTotalTarjeta),
        cuotas: Number(form.customCuotas),
        tipoCertificado: form.customTipoCertificado,
        costoCertificado: Number(form.customCostoCertificado),
        hasBonus: form.hasBonus,
        bonusAmount: Number(form.bonusAmount || 0),
        fullPayment: form.fullPayment,
        installments,
        horariosCurso: course.horarios || [],
      };

      if(editing) {
        updateInscription(editing.id, newInsc);
        showNotification('success', 'Inscripción actualizada correctamente');
      } else {
        // AppDB.jsx ya asigna el id; no hace falta ponerlo aquí
        addInscription(newInsc);
        showNotification('success', 'Inscripción creada exitosamente');
      }
      closeForm();
    } catch(err) {
      showNotification('error', err.message);
    }
  };

  const handleDelete = insc => {
    // Si tenés removeInscription en el contexto, podés llamarlo aquí
    showNotification('success', 'Inscripción eliminada (implementa removeInscription si querés borrarla de la DB).');
  };

  const handlePayInstallment = (inscId, num) => {
    const insc = (inscriptions || []).find(i => i.id === inscId);
    if (!insc) return showNotification('error', 'Inscripción no encontrada.');
    const updatedInstallments = (insc.installments || []).map(inst =>
        inst.number === num ? { ...inst, status: 'Pagado', paymentDate: formatDate(new Date()) } : inst
    );
    updateInscription(inscId, { ...insc, installments: updatedInstallments });
    showNotification('success', `Cuota ${num} pagada.`);
  };

  /* ================== Render ================== */
  return (
      <div className="p-6 relative min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <Notifications notifications={notifications} remove={removeNotification} />

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Sistema de Inscripciones</h1>
          <p className="text-gray-600">Gestiona las inscripciones de cursos de manera eficiente</p>
        </div>

        {/* Buscador + Nuevo */}
        <div className="flex mb-6 shadow-lg">
          <input
              type="text"
              placeholder="Buscar por alumno o curso..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="flex-grow px-4 py-3 border-2 border-purple-500 rounded-l-lg focus:outline-none focus:border-purple-700 text-black"
          />
          <button
              onClick={()=>openForm(null)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-r-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg"
          >
            Nueva Inscripción
          </button>
        </div>

        {/* Tabla principal */}
        <div className="overflow-auto border-2 border-purple-500 rounded-xl shadow-2xl bg-white">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <tr>
              {['ID','Alumno','Curso','Profesor','Inicio','Fin','Vacantes','Pago Total','Tipo Pago','N° Cuotas','Certificado','Bonificación','Valor Total','Acciones'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
            </thead>
            <tbody>
            {filtered.map((insc, index)=>(
                <motion.tr
                    key={insc.id}
                    className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                    initial={{opacity:0,y:10}}
                    animate={{opacity:1,y:0}}
                    transition={{duration:0.2, delay: index * 0.05}}
                >
                  <td className="px-4 py-3 text-black font-medium">{insc.id}</td>
                  <td className="px-4 py-3 text-black">{insc.studentName}</td>
                  <td className="px-4 py-3 text-black">{insc.courseName}</td>
                  <td className="px-4 py-3 text-black">{insc.professorName}</td>
                  <td className="px-4 py-3 text-black">{formatDate(insc.inicio)}</td>
                  <td className="px-4 py-3 text-black">{formatDate(insc.fin)}</td>
                  <td className="px-4 py-3 text-black">{insc.vacantes ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {insc.fullPayment ?
                        <FiCheck size={20} className="text-green-600 mx-auto"/> :
                        <FiX size={20} className="text-red-600 mx-auto"/>
                    }
                  </td>
                  <td className="px-4 py-3 text-black">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${insc.paymentType==='Efectivo'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>
                    {insc.paymentType}
                  </span>
                  </td>
                  <td className="px-4 py-3 text-black text-center font-medium">{insc.fullPayment ? '-' : insc.cuotas}</td>
                  <td className="px-4 py-3 text-black">{insc.tipoCertificado}</td>
                  <td className="px-4 py-3 text-black">{insc.hasBonus ? `-$${Number(insc.bonusAmount).toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-3 text-black font-bold text-purple-700">
                    ${ calcTotalFinal(insc.paymentType, insc.totalEfectivo, insc.totalTarjeta, insc.costoCertificado, insc.hasBonus ? insc.bonusAmount : 0).toFixed(2) }
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <motion.button
                        onClick={()=>setViewing(insc)}
                        whileHover={{scale:1.1}}
                        whileTap={{scale:0.95}}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-all"
                    >
                      <FiEye size={18}/>
                    </motion.button>
                    <motion.button
                        onClick={()=>openForm(insc)}
                        whileHover={{scale:1.1}}
                        whileTap={{scale:0.95}}
                        className="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100 transition-all"
                    >
                      <FiEdit size={18}/>
                    </motion.button>
                    <motion.button
                        onClick={()=>handleDelete(insc)}
                        whileHover={{scale:1.1}}
                        whileTap={{scale:0.95}}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-all"
                    >
                      <FiTrash2 size={18}/>
                    </motion.button>
                  </td>
                </motion.tr>
            ))}
            {filtered.length===0 && (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-4xl">📚</div>
                      <div>No hay inscripciones que coincidan con tu búsqueda</div>
                    </div>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

        {/* Modal Detalles */}
        <AnimatePresence>
          {viewing && (
              <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <motion.div
                    className="bg-white p-6 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-y-auto relative text-black shadow-2xl"
                    initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.8, opacity:0}}
                    transition={{type:"spring", damping:20}}
                >
                  <button className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors" onClick={()=>setViewing(null)}>
                    <FiX size={20}/>
                  </button>

                  <h2 className="text-2xl font-bold mb-6 text-purple-800">Detalles de la Inscripción</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-semibold mb-1">ALUMNO</div>
                        <div className="text-lg font-bold">{viewing.studentName}</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-semibold mb-1">CURSO</div>
                        <div className="text-lg font-bold">{viewing.courseName}</div>
                        <div className="text-sm text-blue-700 mt-1">
                          Inicio: {formatDate(viewing.inicio)} · Fin: {formatDate(viewing.fin)} · Vacantes: {viewing.vacantes ?? '-'}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-semibold mb-1">PROFESOR</div>
                        <div className="text-lg font-bold">{viewing.professorName}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-600 font-semibold mb-1">TIPO DE PAGO</div>
                        <div className="text-lg font-bold">{viewing.paymentType}</div>
                      </div>

                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="text-sm text-indigo-600 font-semibold mb-1">TOTALES</div>
                        <div className="text-sm text-indigo-700">
                          Curso: ${viewing.paymentType==='Efectivo'? viewing.totalEfectivo : viewing.totalTarjeta}
                        </div>
                        <div className="text-sm text-indigo-700">
                          Certificado: {viewing.tipoCertificado || '-'} {viewing.costoCertificado ? `- $${viewing.costoCertificado}` : ''}
                        </div>
                        {viewing.hasBonus && (
                            <div className="text-sm text-indigo-700">Bonificación: -${Number(viewing.bonusAmount).toFixed(2)}</div>
                        )}
                        <div className="text-xl font-bold text-indigo-900 mt-1">
                          Total final: ${calcTotalFinal(viewing.paymentType, viewing.totalEfectivo, viewing.totalTarjeta, viewing.costoCertificado, viewing.hasBonus ? viewing.bonusAmount : 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {viewing.fullPayment ? (
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-xl border-l-4 border-green-500">
                        <div className="flex items-center space-x-3">
                          <FiCheck size={28} className="text-green-600"/>
                          <div>
                            <div className="text-xl font-bold text-green-800">Pago Total Realizado</div>
                            <div className="text-green-600">El curso ha sido pagado completamente</div>
                          </div>
                        </div>
                      </div>
                  ) : (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800">Plan de Cuotas</h3>
                        <div className="overflow-auto border-2 border-gray-300 rounded-xl shadow-lg">
                          <table className="min-w-full bg-white">
                            <thead className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                            <tr>
                              {['Cuota','Vencimiento','Estado','Fecha Pago','Monto','Acción'].map(h=>(
                                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                              ))}
                            </tr>
                            </thead>
                            <tbody>
                            {(viewing.installments || []).map((inst, index)=>(
                                <tr key={inst.number} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                  <td className="px-4 py-3 text-black font-bold">#{inst.number}</td>
                                  <td className="px-4 py-3 text-black">
                                    <div className="flex items-center gap-2">
                                      <span>{inst.dueDate}</span>
                                      {isOverdue(inst.dueDate) && inst.status === 'Pendiente' && (
                                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Vencida</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${inst.status==='Pagado'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
                                {inst.status}
                              </span>
                                  </td>
                                  <td className="px-4 py-3 text-black">{inst.paymentDate||'-'}</td>
                                  <td className="px-4 py-3 text-black font-bold text-purple-700">
                                    ${ getAdjustedAmount(Number(inst.amount), inst.dueDate).toFixed(2) }
                                    {inst.status === 'Pagado' && inst.amountPaid != null && (
                                        <span className="ml-2 text-xs text-gray-500">(Pagado: ${Number(inst.amountPaid).toFixed(2)})</span>
                                    )}
                                    {isOverdue(inst.dueDate) && inst.status==='Pendiente' && (
                                        <div className="text-xs text-red-600 mt-1">Incluye recargo por pago fuera de término</div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {inst.status==='Pendiente' && (
                                        <button
                                            onClick={()=>handlePayInstallment(viewing.id, inst.number)}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-md"
                                        >
                                          Pagar
                                        </button>
                                    )}
                                    {inst.status==='Pagado' && (
                                        <div className="flex items-center text-green-600">
                                          <FiCheck size={16} className="mr-1"/>
                                          <span className="text-sm font-semibold">Pagado</span>
                                        </div>
                                    )}
                                  </td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  )}
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Formulario */}
        <AnimatePresence>
          {isFormOpen && (
              <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <motion.form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-black relative shadow-2xl"
                    initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.8, opacity:0}}
                    transition={{type:"spring", damping:20}}
                >
                  <button type="button" className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors" onClick={closeForm}>
                    <FiX size={20}/>
                  </button>

                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-purple-800">{editing?'Editar':'Nueva'} Inscripción</h2>
                    <p className="text-gray-600">Complete los datos requeridos para la inscripción</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Alumno */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Alumno *:</label>
                      <SearchableSelect
                          options={students}
                          value={form.studentId}
                          onChange={v=>setForm(prev=>({...prev, studentId:v}))}
                          placeholder="Selecciona un alumno..."
                          getLabel={s=>`${s.nombre} ${s.apellido} (DNI: ${s.dni})`}
                          getValue={s=>s.id.toString()}
                      />
                    </div>

                    {/* Curso */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Curso *:</label>
                      <SearchableSelect
                          options={courses}
                          value={form.courseId}
                          onChange={v=>setForm(prev=>({...prev, courseId:v}))}
                          placeholder="Selecciona un curso..."
                          getLabel={c=>c.nombre}
                          getValue={c=>c.id.toString()}
                      />
                    </div>

                    {/* Profesor */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Profesor *:</label>
                      <SearchableSelect
                          options={availableCourseProfessors}
                          value={form.professorId}
                          onChange={v=>setForm(prev=>({...prev, professorId:v}))}
                          placeholder="Selecciona un profesor..."
                          getLabel={p=>`${p.nombre} ${p.apellido}`}
                          getValue={p=>p.id.toString()}
                      />
                    </div>

                    {/* Fechas (solo lectura) */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-gray-500">Fecha Inicio:</label>
                      <input type="date" name="customInicio" value={form.customInicio} disabled className="border-2 border-gray-300 rounded-xl p-3 text-black bg-gray-100 cursor-not-allowed" />
                      <small className="text-gray-500 mt-1">Se toma del curso</small>
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-gray-500">Fecha Fin:</label>
                      <input type="date" name="customFin" value={form.customFin} disabled className="border-2 border-gray-300 rounded-xl p-3 text-black bg-gray-100 cursor-not-allowed" />
                      <small className="text-gray-500 mt-1">Se toma del curso</small>
                    </div>

                    {/* Vacantes (solo lectura) */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Vacantes:</label>
                      <input
                          type="number"
                          name="customVacantes"
                          value={form.customVacantes}
                          disabled
                          className="border-2 border-gray-300 rounded-xl p-3 text-black bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    {/* Forma de pago */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Forma de Pago *:</label>
                      <select
                          name="paymentType"
                          value={form.paymentType}
                          onChange={handleChange}
                          className="border-2 border-purple-300 rounded-xl p-3 text-black focus:border-purple-500 focus:outline-none"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                      </select>
                    </div>

                    {/* Totales por forma */}
                    {form.paymentType==='Efectivo' && (
                        <div className="flex flex-col">
                          <label className="mb-2 font-semibold text-green-700">Total Curso (Efectivo) $:</label>
                          <input
                              type="number"
                              name="customTotalEfectivo"
                              value={form.customTotalEfectivo}
                              onChange={handleChange}
                              className="border-2 border-green-300 rounded-xl p-3 text-black focus:border-green-500 focus:outline-none"
                          />
                        </div>
                    )}
                    {form.paymentType==='Tarjeta' && (
                        <div className="flex flex-col">
                          <label className="mb-2 font-semibold text-blue-700">Total Curso (Tarjeta) $:</label>
                          <input
                              type="number"
                              name="customTotalTarjeta"
                              value={form.customTotalTarjeta}
                              onChange={handleChange}
                              className="border-2 border-blue-300 rounded-xl p-3 text-black focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                    )}

                    {/* Cuotas */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Número de Cuotas:</label>
                      <input
                          type="number"
                          name="customCuotas"
                          value={form.customCuotas}
                          onChange={handleChange}
                          disabled={form.fullPayment}
                          className={`border-2 rounded-xl p-3 text-black ${form.fullPayment?'bg-gray-100 cursor-not-allowed border-gray-300':'border-purple-300 focus:border-purple-500 focus:outline-none'}`}
                      />
                      {form.fullPayment && <small className="text-gray-500 mt-1">Deshabilitado por pago total</small>}
                    </div>

                    {/* Certificado */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Tipo Certificado:</label>
                      {selectedCourseCertificates.length > 1 ? (
                          <select
                              name="customTipoCertificado"
                              value={form.customTipoCertificado}
                              onChange={handleChange}
                              className="border-2 border-purple-300 rounded-xl p-3 text-black focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">Ninguno</option>
                            {selectedCourseCertificates.map(tipo=>
                                <option key={tipo} value={tipo}>{tipo}</option>
                            )}
                          </select>
                      ) : (
                          <input
                              type="text"
                              name="customTipoCertificado"
                              value={form.customTipoCertificado}
                              onChange={handleChange}
                              className="border-2 border-purple-300 rounded-xl p-3 text-black focus:border-purple-500 focus:outline-none"
                          />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Costo Certificado $:</label>
                      <input
                          type="number"
                          name="customCostoCertificado"
                          value={form.customCostoCertificado}
                          onChange={handleChange}
                          className="border-2 border-purple-300 rounded-xl p-3 text-black focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    {/* Bonificación */}
                    <div className="md:col-span-3 flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <input
                          type="checkbox"
                          id="hasBonus"
                          name="hasBonus"
                          checked={form.hasBonus}
                          onChange={handleChange}
                          className="w-5 h-5 text-purple-600"
                      />
                      <label htmlFor="hasBonus" className="font-semibold text-yellow-800">
                        Bonificación (descuento sobre el total)
                      </label>
                      <input
                          type="number"
                          name="bonusAmount"
                          value={form.bonusAmount}
                          onChange={handleChange}
                          disabled={!form.hasBonus}
                          min="0"
                          className={`border-2 rounded-xl p-2 text-black ${form.hasBonus ? 'border-yellow-400 focus:border-yellow-500' : 'bg-gray-100 border-gray-300 cursor-not-allowed'}`}
                          placeholder="Monto a descontar"
                      />
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-l-4 border-purple-500 mt-2">
                    <h3 className="font-bold text-lg mb-4 text-purple-800">💰 Resumen de Precios</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {form.paymentType==='Efectivo' ? (
                            <div className="bg-green-100 p-4 rounded-lg">
                              <div className="text-green-800 font-bold text-lg">Total Curso (Efectivo)</div>
                              <div className="text-2xl font-bold text-green-900">${Number(form.customTotalEfectivo).toFixed(2)}</div>
                              {!form.fullPayment && form.customCuotas > 0 && (
                                  <div className="text-sm text-green-700 mt-2">
                                    ${(Number(form.customTotalEfectivo)/Math.max(1,Number(form.customCuotas))).toFixed(2)} por cuota ({Number(form.customCuotas)} cuotas)
                                  </div>
                              )}
                            </div>
                        ) : (
                            <div className="bg-blue-100 p-4 rounded-lg">
                              <div className="text-blue-800 font-bold text-lg">Total Curso (Tarjeta)</div>
                              <div className="text-2xl font-bold text-blue-900">${Number(form.customTotalTarjeta).toFixed(2)}</div>
                              {!form.fullPayment && form.customCuotas > 0 && (
                                  <div className="text-sm text-blue-700 mt-2">
                                    ${(Number(form.customTotalTarjeta)/Math.max(1,Number(form.customCuotas))).toFixed(2)} por cuota ({Number(form.customCuotas)} cuotas)
                                  </div>
                              )}
                            </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="bg-orange-100 p-4 rounded-lg">
                          <div className="text-orange-800 font-bold">Certificado: {form.customTipoCertificado||'-'}</div>
                          <div className="text-xl font-bold text-orange-900">${Number(form.customCostoCertificado).toFixed(2)}</div>
                        </div>

                        {form.hasBonus && (
                            <div className="bg-yellow-100 p-4 rounded-lg">
                              <div className="text-yellow-800 font-bold">Bonificación</div>
                              <div className="text-xl font-bold text-yellow-900">-${Number(form.bonusAmount||0).toFixed(2)}</div>
                            </div>
                        )}

                        <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
                          <div className="text-purple-800 font-bold text-lg">TOTAL FINAL</div>
                          <div className="text-3xl font-bold text-purple-900">
                            ${ calcTotalFinal(form.paymentType, form.customTotalEfectivo, form.customTotalTarjeta, form.customCostoCertificado, form.hasBonus ? form.bonusAmount : 0).toFixed(2) }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pago total */}
                  <div className="flex items-center space-x-3 mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <input
                        type="checkbox"
                        id="fullPayment"
                        name="fullPayment"
                        checked={form.fullPayment}
                        onChange={handleChange}
                        className="w-5 h-5 text-purple-600"
                    />
                    <label htmlFor="fullPayment" className="font-semibold text-yellow-800">
                      ✅ Pago Total (sin plan de cuotas)
                    </label>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-between mt-6 pt-6 border-t-2 border-gray-200">
                    <button type="button" onClick={closeForm} className="px-8 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all font-semibold shadow-md">
                      ❌ Cancelar
                    </button>
                    <button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg">
                      {editing ? '✏️ Actualizar' : '➕ Crear'} Inscripción
                    </button>
                  </div>
                </motion.form>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
