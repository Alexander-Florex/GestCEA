import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiChevronDown } from 'react-icons/fi';

// Mock datos de alumnos
const mockStudents = [
  { id: 1, nombre: 'Juan', apellido: 'Lopez', dni: '12345678' },
  { id: 2, nombre: 'Ana', apellido: 'García', dni: '87654321' },
  { id: 3, nombre: 'Carlos', apellido: 'Martínez', dni: '11223344' },
  { id: 4, nombre: 'Laura', apellido: 'Fernández', dni: '44332211' },
];

// Mock datos de cursos
const mockCourses = [
  {
    id: 1,
    nombre: 'React Básico',
    inicio: '2024-02-01',
    fin: '2024-04-30',
    vacantes: 20,
    totalEfectivo: 15000,
    totalTarjeta: 18000,
    cuotas: 3,
    profesores: ['Carlos Mendez', 'Ana Rodriguez'],
    tiposCertificado: ['Digital', 'Físico'],
    costosCertificado: { 'Digital': 500, 'Físico': 1200 }
  },
  {
    id: 2,
    nombre: 'JavaScript Avanzado',
    inicio: '2024-03-01',
    fin: '2024-05-31',
    vacantes: 15,
    totalEfectivo: 22000,
    totalTarjeta: 25000,
    cuotas: 4,
    profesores: ['Miguel Torres', 'Sofia Lopez'],
    tiposCertificado: ['Digital', 'Físico', 'Premium'],
    costosCertificado: { 'Digital': 800, 'Físico': 1500, 'Premium': 2000 }
  },
  {
    id: 3,
    nombre: 'Python para Principiantes',
    inicio: '2024-04-01',
    fin: '2024-06-30',
    vacantes: 25,
    totalEfectivo: 18000,
    totalTarjeta: 21000,
    cuotas: 3,
    profesores: ['Eduardo Silva', 'Maria Gonzalez'],
    tiposCertificado: ['Digital'],
    costosCertificado: { 'Digital': 600 }
  }
];

// Select buscable
function SearchableSelect({ options, value, onChange, placeholder, getLabel, getValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
      options.filter(option =>
          getLabel(option).toLowerCase().includes(search.toLowerCase())
      ), [options, search, getLabel]
  );
  const selectedOption = options.find(option => getValue(option) === value);

  return (
      <div className="relative">
        <div
            className="border-2 border-black rounded-xl p-2 bg-white cursor-pointer flex justify-between items-center"
            onClick={() => setIsOpen(!isOpen)}
        >
        <span className="text-black">
          {selectedOption ? getLabel(selectedOption) : placeholder}
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
                        onChange(getValue(option));
                        setIsOpen(false);
                        setSearch('');
                      }}
                  >
                    {getLabel(option)}
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

// Formateo de fechas
const formatDate = d => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2,'0');
  const month = String(date.getMonth()+1).padStart(2,'0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const getDueDate = (start, index) => {
  const [y,m] = start.split('-').map(Number);
  const date = new Date(y, m-1 + (index-1), 10);
  return formatDate(date);
};

export default function Inscripciones() {
  const [inscripciones, setInscripciones] = useState([]);
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

  const filtered = useMemo(() =>
      inscripciones.filter(i =>
          i.studentName.toLowerCase().includes(search.toLowerCase()) ||
          i.courseName.toLowerCase().includes(search.toLowerCase())
      ), [inscripciones, search]
  );

  const [form, setForm] = useState({
    studentId:'',
    courseId:'',
    professor:'',
    paymentType:'Efectivo',
    fullPayment:false,
    customInicio:'',
    customFin:'',
    customVacantes:0,
    customTotalEfectivo:0,
    customTotalTarjeta:0,
    customCuotas:0,
    customTipoCertificado:'',
    customCostoCertificado:0
  });

  // Auto-completar datos del curso seleccionado
  useEffect(() => {
    const c = mockCourses.find(c=>c.id===Number(form.courseId));
    if(c) {
      setForm(prev=>({
        ...prev,
        customInicio: c.inicio,
        customFin: c.fin,
        customVacantes: c.vacantes,
        customTotalEfectivo: c.totalEfectivo,
        customTotalTarjeta: c.totalTarjeta,
        customCuotas: c.cuotas,
        customTipoCertificado: c.tiposCertificado[0],
        customCostoCertificado: c.costosCertificado[c.tiposCertificado[0]]
      }));
    }
  }, [form.courseId]);

  // Auto-completar costo del certificado
  useEffect(() => {
    const c = mockCourses.find(c=>c.id===Number(form.courseId));
    if(c && form.customTipoCertificado) {
      setForm(prev=>({
        ...prev,
        customCostoCertificado: c.costosCertificado[form.customTipoCertificado]||0
      }));
    }
  }, [form.customTipoCertificado, form.courseId]);

  const openForm = insc => {
    if(insc) {
      setEditing(insc);
      setForm({
        studentId:insc.studentId.toString(),
        courseId:insc.courseId.toString(),
        professor:insc.professor,
        paymentType:insc.paymentType,
        fullPayment:insc.fullPayment,
        customInicio:insc.inicio,
        customFin:insc.fin,
        customVacantes:insc.vacantes,
        customTotalEfectivo:insc.totalEfectivo,
        customTotalTarjeta:insc.totalTarjeta,
        customCuotas:insc.cuotas,
        customTipoCertificado:insc.tipoCertificado,
        customCostoCertificado:insc.costoCertificado
      });
    } else {
      setEditing(null);
      setForm({
        studentId:'', courseId:'', professor:'', paymentType:'Efectivo', fullPayment:false,
        customInicio:'', customFin:'', customVacantes:0,
        customTotalEfectivo:0, customTotalTarjeta:0, customCuotas:0,
        customTipoCertificado:'', customCostoCertificado:0
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleChange = e => {
    const {name, type, checked, value} = e.target;
    setForm(f=>({ ...f, [name]: type==='checkbox'? checked : value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    try {
      if(!form.studentId||!form.courseId||!form.professor)
        throw new Error('Completa los campos obligatorios');

      const student = mockStudents.find(s=>s.id===Number(form.studentId));
      const course = mockCourses.find(c=>c.id===Number(form.courseId));

      // Crear array de cuotas si no pago total
      let installments = [];
      if(!form.fullPayment) {
        installments = Array.from({ length: form.customCuotas }).map((_, i) => {
          const num = i+1;
          const due = getDueDate(form.customInicio, num);
          const amount = (form.paymentType==='Efectivo' ? form.customTotalEfectivo : form.customTotalTarjeta) / form.customCuotas;
          return { number: num, dueDate: due, status: 'Pendiente', paymentDate: '', amount };
        });
      }

      const newInsc = {
        id: editing ? editing.id : (inscripciones.length ? Math.max(...inscripciones.map(i=>i.id))+1 : 1),
        studentName: `${student.nombre} ${student.apellido}`,
        courseName: course.nombre,
        professor: form.professor,
        inicio: form.customInicio,
        fin: form.customFin,
        vacantes: form.customVacantes,
        paymentType: form.paymentType,
        totalEfectivo: form.customTotalEfectivo,
        totalTarjeta: form.customTotalTarjeta,
        cuotas: form.customCuotas,
        tipoCertificado: form.customTipoCertificado,
        costoCertificado: form.customCostoCertificado,
        fullPayment: form.fullPayment,
        installments,
        studentId: student.id,
        courseId: course.id
      };

      if(editing) {
        setInscripciones(insc=>insc.map(i=>i.id===editing.id? newInsc : i));
        showNotification('success', 'Inscripción actualizada correctamente');
      } else {
        setInscripciones(insc=>[...insc, newInsc]);
        showNotification('success', 'Inscripción creada exitosamente');
      }
      closeForm();
    } catch(err) {
      showNotification('error', err.message);
    }
  };

  const handleDelete = insc => {
    if(window.confirm('¿Estás seguro de eliminar esta inscripción?')) {
      setInscripciones(inscArr=>inscArr.filter(i=>i.id!==insc.id));
      showNotification('success', 'Inscripción eliminada');
    }
  };

  const handlePayInstallment = (inscId, num) => {
    setInscripciones(arr => arr.map(insc => {
      if(insc.id === inscId) {
        const installments = insc.installments.map(inst => {
          if(inst.number === num && inst.status==='Pendiente') {
            return { ...inst, status: 'Pagado', paymentDate: formatDate(new Date()) };
          }
          return inst;
        });
        return { ...insc, installments };
      }
      return insc;
    }));
    showNotification('success', `Cuota ${num} pagada exitosamente`);
  };

  // Opciones dinámicas
  const selectedCourse = mockCourses.find(c=>c.id===Number(form.courseId));
  const selectedCourseProfessors = selectedCourse?.profesores || [];
  const selectedCourseCertificates = selectedCourse?.tiposCertificado || [];

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
              {['ID','Alumno','Curso','Profesor','Inicio','Fin','Pago Total','Tipo Pago','N° Cuotas','Certificado','Valor Total','Acciones'].map(h=>(
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
                  <td className="px-4 py-3 text-black">{insc.professor}</td>
                  <td className="px-4 py-3 text-black">{formatDate(insc.inicio)}</td>
                  <td className="px-4 py-3 text-black">{formatDate(insc.fin)}</td>
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
                  <td className="px-4 py-3 text-black font-bold text-purple-700">
                    ${(insc.paymentType==='Efectivo'? insc.totalEfectivo : insc.totalTarjeta) + insc.costoCertificado}
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
                  <td colSpan={12} className="text-center py-8 text-gray-500">
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
              <motion.div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  initial={{opacity:0}}
                  animate={{opacity:1}}
                  exit={{opacity:0}}
              >
                <motion.div
                    className="bg-white p-6 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-y-auto relative text-black shadow-2xl"
                    initial={{scale:0.8, opacity:0}}
                    animate={{scale:1, opacity:1}}
                    exit={{scale:0.8, opacity:0}}
                    transition={{type:"spring", damping:20}}
                >
                  <button
                      className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors"
                      onClick={()=>setViewing(null)}
                  >
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
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-semibold mb-1">PROFESOR</div>
                        <div className="text-lg font-bold">{viewing.professor}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-600 font-semibold mb-1">TIPO DE PAGO</div>
                        <div className="text-lg font-bold">{viewing.paymentType}</div>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="text-sm text-indigo-600 font-semibold mb-1">TOTAL DEL CURSO</div>
                        <div className="text-lg font-bold">${viewing.paymentType==='Efectivo'? viewing.totalEfectivo : viewing.totalTarjeta}</div>
                      </div>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <div className="text-sm text-pink-600 font-semibold mb-1">CERTIFICADO</div>
                        <div className="text-lg font-bold">{viewing.tipoCertificado} - ${viewing.costoCertificado}</div>
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
                            {viewing.installments.map((inst, index)=>(
                                <tr key={inst.number} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                  <td className="px-4 py-3 text-black font-bold">#{inst.number}</td>
                                  <td className="px-4 py-3 text-black">{inst.dueDate}</td>
                                  <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${inst.status==='Pagado'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
                                {inst.status}
                              </span>
                                  </td>
                                  <td className="px-4 py-3 text-black">{inst.paymentDate||'-'}</td>
                                  <td className="px-4 py-3 text-black font-bold text-purple-700">${inst.amount.toFixed(2)}</td>
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
              <motion.div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  initial={{opacity:0}}
                  animate={{opacity:1}}
                  exit={{opacity:0}}
              >
                <motion.form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-black relative shadow-2xl"
                    initial={{scale:0.8, opacity:0}}
                    animate={{scale:1, opacity:1}}
                    exit={{scale:0.8, opacity:0}}
                    transition={{type:"spring", damping:20}}
                >
                  <button
                      type="button"
                      className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors"
                      onClick={closeForm}
                  >
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
                          options={mockStudents}
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
                          options={mockCourses}
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
                          options={selectedCourseProfessors.map(p=>({name:p}))}
                          value={form.professor}
                          onChange={v=>setForm(prev=>({...prev, professor:v}))}
                          placeholder="Selecciona un profesor..."
                          getLabel={p=>p.name}
                          getValue={p=>p.name}
                      />
                    </div>

                    {/* Fechas bloqueadas */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-gray-500">Fecha Inicio:</label>
                      <input
                          type="date"
                          name="customInicio"
                          value={form.customInicio}
                          disabled
                          className="border-2 border-gray-300 rounded-xl p-3 text-black bg-gray-100 cursor-not-allowed"
                      />
                      <small className="text-gray-500 mt-1">Campo bloqueado - Se toma del curso</small>
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-gray-500">Fecha Fin:</label>
                      <input
                          type="date"
                          name="customFin"
                          value={form.customFin}
                          disabled
                          className="border-2 border-gray-300 rounded-xl p-3 text-black bg-gray-100 cursor-not-allowed"
                      />
                      <small className="text-gray-500 mt-1">Campo bloqueado - Se toma del curso</small>
                    </div>

                    {/* Vacantes */}
                    <div className="flex flex-col">
                      <label className="mb-2 font-semibold text-purple-700">Vacantes:</label>
                      <input
                          type="number"
                          name="customVacantes"
                          value={form.customVacantes}
                          onChange={handleChange}
                          className="border-2 border-purple-300 rounded-xl p-3 text-black focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    {/* Forma de Pago */}
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

                    {/* Campos dinámicos según tipo de pago */}
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
                  </div>

                  {/* Resumen de precios dinámico */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-l-4 border-purple-500 mt-6">
                    <h3 className="font-bold text-lg mb-4 text-purple-800">💰 Resumen de Precios</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {form.paymentType==='Efectivo' ? (
                            <div className="bg-green-100 p-4 rounded-lg">
                              <div className="text-green-800 font-bold text-lg">Total Curso (Efectivo)</div>
                              <div className="text-2xl font-bold text-green-900">${form.customTotalEfectivo}</div>
                              {!form.fullPayment && form.customCuotas > 0 && (
                                  <div className="text-sm text-green-700 mt-2">
                                    ${(form.customTotalEfectivo/form.customCuotas).toFixed(2)} por cuota ({form.customCuotas} cuotas)
                                  </div>
                              )}
                            </div>
                        ) : (
                            <div className="bg-blue-100 p-4 rounded-lg">
                              <div className="text-blue-800 font-bold text-lg">Total Curso (Tarjeta)</div>
                              <div className="text-2xl font-bold text-blue-900">${form.customTotalTarjeta}</div>
                              {!form.fullPayment && form.customCuotas > 0 && (
                                  <div className="text-sm text-blue-700 mt-2">
                                    ${(form.customTotalTarjeta/form.customCuotas).toFixed(2)} por cuota ({form.customCuotas} cuotas)
                                  </div>
                              )}
                            </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="bg-orange-100 p-4 rounded-lg">
                          <div className="text-orange-800 font-bold">Certificado: {form.customTipoCertificado}</div>
                          <div className="text-xl font-bold text-orange-900">${form.customCostoCertificado}</div>
                        </div>

                        <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
                          <div className="text-purple-800 font-bold text-lg">TOTAL FINAL</div>
                          <div className="text-3xl font-bold text-purple-900">
                            ${(form.paymentType==='Efectivo' ? form.customTotalEfectivo : form.customTotalTarjeta) + form.customCostoCertificado}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pago total checkbox */}
                  <div className="flex items-center space-x-3 mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
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
                  <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="px-8 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all font-semibold shadow-md"
                    >
                      ❌ Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
                    >
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