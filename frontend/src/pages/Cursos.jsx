// src/pages/Cursos.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPlus, FiTrash } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB";

/* ==================== Componentes UI ==================== */

function TeacherSelector({ selectedTeachers, onTeachersChange, isOpen, onToggle, availableTeachers }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeachers = availableTeachers.filter(teacher =>
      `${teacher.nombre} ${teacher.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.especialidad||'').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeacherToggle = (teacherId) => {
    if (selectedTeachers.includes(teacherId)) {
      onTeachersChange(selectedTeachers.filter(id => id !== teacherId));
    } else {
      onTeachersChange([...selectedTeachers, teacherId]);
    }
  };

  const getSelectedTeachersText = () => {
    if (selectedTeachers.length === 0) return 'Seleccionar profesores...';
    const names = selectedTeachers.map(id => {
      const teacher = availableTeachers.find(t => t.id === id);
      return teacher ? `${teacher.nombre} ${teacher.apellido}` : '';
    }).filter(Boolean);
    return names.join(', ');
  };

  return (
      <div className="relative">
        <button
            type="button"
            onClick={onToggle}
            className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-left text-black focus:border-purple-500 focus:outline-none bg-white flex justify-between items-center"
        >
        <span className={selectedTeachers.length === 0 ? 'text-gray-400' : 'text-black'}>
          {getSelectedTeachersText()}
        </span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            ▼
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
              <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                  className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-xl shadow-lg max-h-60 overflow-hidden"
              >
                {/* Buscador */}
                <div className="p-3 border-b border-gray-200">
                  <input
                      type="text"
                      placeholder="Buscar profesor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Lista */}
                <div className="max-h-40 overflow-y-auto">
                  {filteredTeachers.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">No se encontraron profesores</div>
                  ) : (
                      filteredTeachers.map(teacher => (
                          <motion.div
                              key={teacher.id}
                              whileHover={{ backgroundColor: '#f3f4f6' }}
                              className="flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleTeacherToggle(teacher.id)}
                          >
                            <input
                                type="checkbox"
                                checked={selectedTeachers.includes(teacher.id)}
                                onChange={() => handleTeacherToggle(teacher.id)}
                                className="mr-3 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-black">
                                {teacher.nombre} {teacher.apellido}
                              </div>
                              <div className="text-sm text-gray-500">{teacher.especialidad}</div>
                            </div>
                          </motion.div>
                      ))
                  )}
                </div>

                {/* Acciones */}
                <div className="p-3 border-t border-gray-200 flex justify-between">
                  <button type="button" onClick={() => onTeachersChange([])} className="text-sm text-red-600 hover:text-red-800">
                    Limpiar todo
                  </button>
                  <button type="button" onClick={onToggle} className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
                    Cerrar
                  </button>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

/* ==================== Notificaciones ==================== */

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
                  className={`px-4 py-2 rounded shadow cursor-pointer ${
                      n.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                  onClick={() => remove(n.id)}
              >
                {n.message}
              </motion.div>
          ))}
        </AnimatePresence>
      </div>
  );
}

/* ==================== Helpers ==================== */

const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

const resumenHorarios = (horarios=[]) =>
    horarios.map(h => `${h.dia.slice(0,3)} ${h.desde}-${h.hasta}`).join(', ');

const getTeacherNames = (teacherIds, availableTeachers=[]) =>
    teacherIds
        .map(id => {
          const t = availableTeachers.find(x => x.id === id);
          return t ? `${t.nombre} ${t.apellido}` : '';
        })
        .filter(Boolean)
        .join(', ');

/* ==================== Página Cursos ==================== */

export default function Cursos() {
  const { courses, addCourse, updateCourse, removeCourse, professors } = useDB();
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isTeacherSelectorOpen, setIsTeacherSelectorOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    profesores: [],
    precioEfectivo: '',
    recargoEfectivo: '',
    totalEfectivo: '',
    precioTarjeta: '',
    recargoTarjeta: '',
    totalTarjeta: '',
    cuotas: '',
    // certificados múltiples
    tiposCertificado: [],
    costosCertificado: { UTN: '', CEA: '' },
    // horarios
    horarios: [],
    horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
    certDraft: 'UTN',
    // NUEVO: fechas y vacantes
    inicio: '',
    fin: '',
    vacantes: '',
  });

  const showNotification = (type, message) => {
    const id = Date.now();
    setNotifications(n => [...n, { id, type, message }]);
    setTimeout(() => removeNotification(id), 3000);
  };
  const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const teacherNames = getTeacherNames(c.profesores || [], professors);
      return (
          (c.nombre||'').toLowerCase().includes(search.toLowerCase()) ||
          (teacherNames||'').toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [courses, search, professors]);

  /* ============ Abrir/Cerrar Form ============ */

  const openForm = (course) => {
    if (course) {
      setEditing(course);
      setFormData({
        nombre: course.nombre || '',
        profesores: course.profesores || [],
        precioEfectivo: String(course.precioEfectivo ?? ''),
        recargoEfectivo: String(course.recargoEfectivo ?? ''),
        totalEfectivo: String(course.totalEfectivo ?? ''),
        precioTarjeta: String(course.precioTarjeta ?? ''),
        recargoTarjeta: String(course.recargoTarjeta ?? ''),
        totalTarjeta: String(course.totalTarjeta ?? ''),
        cuotas: String(course.cuotas ?? ''),
        tiposCertificado: course.tiposCertificado || [],
        costosCertificado: {
          UTN: (course.costosCertificado?.UTN ?? '').toString(),
          CEA: (course.costosCertificado?.CEA ?? '').toString(),
        },
        horarios: course.horarios || [],
        horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
        certDraft: 'UTN',
        inicio: course.inicio || '',
        fin: course.fin || '',
        vacantes: String(course.vacantes ?? ''),
      });
    } else {
      setEditing(null);
      setFormData({
        nombre: '',
        profesores: [],
        precioEfectivo: '',
        recargoEfectivo: '',
        totalEfectivo: '',
        precioTarjeta: '',
        recargoTarjeta: '',
        totalTarjeta: '',
        cuotas: '',
        tiposCertificado: [],
        costosCertificado: { UTN: '', CEA: '' },
        horarios: [],
        horarioDraft: { dia: 'Lunes', desde: '', hasta: '' },
        certDraft: 'UTN',
        inicio: '',
        fin: '',
        vacantes: '',
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setIsTeacherSelectorOpen(false);
  };

  /* ============ Handlers Form ============ */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  const handleCertCostChange = (tipo, value) => {
    setFormData(fd => ({
      ...fd,
      costosCertificado: { ...fd.costosCertificado, [tipo]: value },
    }));
  };

  const handleAddCert = () => {
    const t = formData.certDraft;
    if (!t) return;
    if (formData.tiposCertificado.includes(t)) {
      showNotification('error', `El certificado ${t} ya está agregado`);
      return;
    }
    setFormData(fd => ({
      ...fd,
      tiposCertificado: [...fd.tiposCertificado, t],
    }));
  };

  const removeCert = (tipo) => {
    setFormData(fd => ({
      ...fd,
      tiposCertificado: fd.tiposCertificado.filter(x => x !== tipo),
    }));
  };

  const handleAddHorario = () => {
    const { dia, desde, hasta } = formData.horarioDraft;
    if (!dia || !desde || !hasta) {
      showNotification('error', 'Completa día, desde y hasta');
      return;
    }
    const exists = formData.horarios.some(h => h.dia === dia && h.desde === desde && h.hasta === hasta);
    if (exists) {
      showNotification('error', 'Ese horario ya está agregado');
      return;
    }
    setFormData(fd => ({
      ...fd,
      horarios: [...fd.horarios, { dia, desde, hasta }],
      horarioDraft: { dia, desde: '', hasta: '' },
    }));
  };

  const removeHorario = (idx) => {
    setFormData(fd => ({
      ...fd,
      horarios: fd.horarios.filter((_, i) => i !== idx),
    }));
  };

  /* ============ Submit ============ */

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!formData.nombre || formData.profesores.length === 0) {
        throw new Error('Nombre y al menos un profesor son obligatorios');
      }

      const numericFields = [
        'precioEfectivo', 'recargoEfectivo', 'totalEfectivo',
        'precioTarjeta', 'recargoTarjeta', 'totalTarjeta',
        'cuotas', 'vacantes'
      ];
      for (const field of numericFields) {
        const value = formData[field];
        if (value === '' || isNaN(Number(value))) {
          throw new Error(`El campo ${field} debe ser un número válido`);
        }
      }

      if (!formData.inicio) throw new Error('Fecha de inicio obligatoria');
      if (!formData.fin) throw new Error('Fecha de fin obligatoria');
      if (new Date(formData.fin) < new Date(formData.inicio)) {
        throw new Error('La fecha de fin no puede ser anterior al inicio');
      }

      if (formData.tiposCertificado.length === 0) {
        throw new Error('Agrega al menos un tipo de certificado con el botón +');
      }
      for (const t of formData.tiposCertificado) {
        const v = formData.costosCertificado[t];
        if (v === '' || isNaN(Number(v))) {
          throw new Error(`Define un costo válido para el certificado ${t}`);
        }
      }

      const courseData = {
        nombre: formData.nombre,
        profesores: formData.profesores,
        precioEfectivo: Number(formData.precioEfectivo),
        recargoEfectivo: Number(formData.recargoEfectivo),
        totalEfectivo: Number(formData.totalEfectivo),
        precioTarjeta: Number(formData.precioTarjeta),
        recargoTarjeta: Number(formData.recargoTarjeta),
        totalTarjeta: Number(formData.totalTarjeta),
        cuotas: Number(formData.cuotas),
        tiposCertificado: [...formData.tiposCertificado],
        costosCertificado: {
          UTN: formData.tiposCertificado.includes('UTN') ? Number(formData.costosCertificado.UTN) : undefined,
          CEA: formData.tiposCertificado.includes('CEA') ? Number(formData.costosCertificado.CEA) : undefined,
        },
        horarios: [...formData.horarios],
        inicio: formData.inicio,
        fin: formData.fin,
        vacantes: Number(formData.vacantes),
      };

      if (editing) {
        updateCourse({ ...courseData, id: editing.id });
        showNotification('success', 'Curso editado correctamente');
      } else {
        addCourse(courseData);
        showNotification('success', 'Curso creado correctamente');
      }
      closeForm();
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  const handleDelete = (course) => {
    if (window.confirm(`¿Eliminar curso "${course.nombre}"?`)) {
      removeCourse(course.id);
      showNotification('success', 'Curso eliminado');
    }
  };

  /* ==================== Render ==================== */

  return (
      <div className="p-6 relative">
        <Notifications notifications={notifications} remove={removeNotification} />

        {/* Buscador + Nuevo */}
        <div className="flex mb-4">
          <input
              type="text"
              placeholder="Buscar por nombre o profesor..."
              className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black"
              value={search}
              onChange={e => setSearch(e.target.value)}
          />
          <button
              onClick={() => openForm(null)}
              className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition"
          >
            Nuevo Curso
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-auto border-2 border-purple-500 rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-purple-500 text-white">
            <tr>
              {[
                'ID','Nombre','Profesor/es','Precio Efectivo','Recargo Efectivo','Total Curso Efectivo',
                'Precio Tarjeta','Recargo Tarjeta','Total Curso Tarjeta','Nº de Cuotas',
                'Certificados','Horarios','Acciones'
              ].map(h => (
                  <th key={h} className="px-4 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
            </thead>
            <tbody>
            {filtered.map(course => (
                <motion.tr
                    key={course.id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                  <td className="px-4 py-2 text-black">{course.id}</td>
                  <td className="px-4 py-2 text-black">{course.nombre}</td>
                  <td className="px-4 py-2 text-black">{getTeacherNames(course.profesores||[], professors)}</td>
                  <td className="px-4 py-2 text-black">${course.precioEfectivo}</td>
                  <td className="px-4 py-2 text-black">${course.recargoEfectivo}</td>
                  <td className="px-4 py-2 text-black">${course.totalEfectivo}</td>
                  <td className="px-4 py-2 text-black">${course.precioTarjeta}</td>
                  <td className="px-4 py-2 text-black">${course.recargoTarjeta}</td>
                  <td className="px-4 py-2 text-black">${course.totalTarjeta}</td>
                  <td className="px-4 py-2 text-black">{course.cuotas}</td>
                  <td className="px-4 py-2 text-black">
                    {course.tiposCertificado?.length
                        ? course.tiposCertificado.map(t => `${t}: $${course.costosCertificado?.[t] ?? '-'}`).join(' | ')
                        : '-'}
                  </td>
                  <td className="px-4 py-2 text-black">{resumenHorarios(course.horarios||[])}</td>
                  <td className="px-4 py-2 space-x-2">
                    <motion.button
                        onClick={() => setViewing(course)}
                        whileHover={{ scale: 1.2 }}
                        className="text-black hover:text-purple-700"
                        title="Ver detalles"
                    >
                      <FiEye size={18} />
                    </motion.button>
                    <motion.button
                        onClick={() => openForm(course)}
                        whileHover={{ scale: 1.2 }}
                        className="text-black hover:text-purple-700"
                        title="Editar curso"
                    >
                      <FiEdit size={18} />
                    </motion.button>
                    <motion.button
                        onClick={() => handleDelete(course)}
                        whileHover={{ scale: 1.2 }}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar curso"
                    >
                      <FiTrash2 size={18} />
                    </motion.button>
                  </td>
                </motion.tr>
            ))}
            {filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center py-4 text-gray-500">
                    {search ? 'No se encontraron cursos que coincidan con la búsqueda.' : 'No hay cursos disponibles.'}
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
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setViewing(null)}
              >
                <motion.div
                    className="bg-white p-6 rounded-lg max-w-xl w-full mx-4 relative space-y-4 text-black border-2 border-blue-400"
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                    onClick={(e) => e.stopPropagation()}
                >
                  <button
                      className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                      onClick={() => setViewing(null)} title="Cerrar"
                  >
                    <FiX size={20} />
                  </button>
                  <h2 className="text-xl font-semibold">Detalles del Curso</h2>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'Nombre', value: viewing.nombre },
                      { label: 'Profesor/es', value: getTeacherNames(viewing.profesores||[], professors) },
                      { label: 'Precio Efectivo', value: `$${viewing.precioEfectivo}` },
                      { label: 'Recargo Efectivo', value: `$${viewing.recargoEfectivo}` },
                      { label: 'Total Curso Efectivo', value: `$${viewing.totalEfectivo}` },
                      { label: 'Precio Tarjeta', value: `$${viewing.precioTarjeta}` },
                      { label: 'Recargo Tarjeta', value: `$${viewing.recargoTarjeta}` },
                      { label: 'Total Curso Tarjeta', value: `$${viewing.totalTarjeta}` },
                      { label: 'Nº de Cuotas', value: viewing.cuotas },
                      {
                        label: 'Certificados',
                        value: viewing.tiposCertificado?.length
                            ? viewing.tiposCertificado.map(t => `${t}: $${viewing.costosCertificado?.[t] ?? '-'}`).join(' | ')
                            : '-',
                      },
                      {
                        label: 'Días y Horarios',
                        value: viewing.horarios?.length
                            ? viewing.horarios.map(h => `${h.dia} ${h.desde}-${h.hasta}`).join(' · ')
                            : '-',
                      },
                      // NUEVO: Fechas y vacantes
                      { label: 'Fecha de inicio', value: viewing.inicio || '-' },
                      { label: 'Fecha de fin', value: viewing.fin || '-' },
                      { label: 'Vacantes', value: (viewing.vacantes ?? '-') },
                    ].map((field, i) => (
                        <div key={i} className="flex flex-col">
                          <label className="font-medium text-sm text-gray-600">{field.label}:</label>
                          <div className="mt-1 w-full border-2 border-gray-300 rounded-xl p-2 text-black bg-gray-50">
                            {field.value}
                          </div>
                        </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Formulario */}
        <AnimatePresence>
          {isFormOpen && (
              <motion.div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={closeForm}
              >
                <motion.form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-lg max-w-3xl w-full mx-4 relative space-y-4 text-black max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                    onClick={(e) => e.stopPropagation()}
                >
                  <button
                      type="button"
                      className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                      onClick={closeForm} title="Cerrar"
                  >
                    <FiX size={20} />
                  </button>
                  <h2 className="text-xl font-semibold mb-2">{editing ? 'Editar Curso' : 'Nuevo Curso'}</h2>

                  {/* Nombre y Profesores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-sm font-medium mb-1">Nombre:</label>
                      <input
                          name="nombre" type="text" value={formData.nombre} onChange={handleChange}
                          className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none" required
                      />
                    </div>

                    <div className="flex flex-col md:col-span-2">
                      <label className="text-sm font-medium mb-1">Profesor/es:</label>
                      <TeacherSelector
                          selectedTeachers={formData.profesores}
                          onTeachersChange={(teachers) => setFormData(fd => ({ ...fd, profesores: teachers }))}
                          isOpen={isTeacherSelectorOpen}
                          onToggle={() => setIsTeacherSelectorOpen(!isTeacherSelectorOpen)}
                          availableTeachers={professors}
                      />
                    </div>
                  </div>

                  {/* Económicos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Precio Efectivo', name: 'precioEfectivo' },
                      { label: 'Recargo Efectivo', name: 'recargoEfectivo' },
                      { label: 'Total Curso Efectivo', name: 'totalEfectivo' },
                      { label: 'Precio Tarjeta', name: 'precioTarjeta' },
                      { label: 'Recargo Tarjeta', name: 'recargoTarjeta' },
                      { label: 'Total Curso Tarjeta', name: 'totalTarjeta' },
                      { label: 'Nº de Cuotas', name: 'cuotas' },
                    ].map(({ label, name }) => (
                        <div key={name} className="flex flex-col">
                          <label className="text-sm font-medium mb-1">{label}:</label>
                          <input
                              name={name} type="number" value={formData[name]} onChange={handleChange}
                              className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                              required min="0" step="0.01"
                          />
                        </div>
                    ))}
                  </div>

                  {/* Certificados con + y costos por tipo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Tipo(s) de Certificado:</label>
                      <div className="flex gap-2">
                        <select
                            value={formData.certDraft}
                            onChange={(e) => setFormData(fd => ({ ...fd, certDraft: e.target.value }))}
                            className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none flex-1"
                        >
                          {['UTN','CEA'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={handleAddCert}
                            className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2"
                            title="Agregar certificado"
                        >
                          <FiPlus /> Agregar
                        </button>
                      </div>

                      {/* Chips certificados */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.tiposCertificado.map(t => (
                            <span key={t} className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                              {t}
                              <button type="button" onClick={() => removeCert(t)} className="hover:text-red-600">✕</button>
                            </span>
                        ))}
                        {formData.tiposCertificado.length === 0 && (
                            <span className="text-sm text-gray-500">Usa el + para agregar UTN/CEA</span>
                        )}
                      </div>
                    </div>

                    {/* Costos por tipo */}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Costo por tipo:</label>
                      <div className="grid grid-cols-1 gap-2">
                        {['UTN','CEA'].map(t => (
                            <div key={t} className="flex items-center gap-2">
                              <span className="min-w-[48px] text-gray-600">{t}:</span>
                              <input
                                  type="number"
                                  value={formData.costosCertificado[t]}
                                  onChange={(e) => handleCertCostChange(t, e.target.value)}
                                  className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none flex-1"
                                  min="0" step="0.01" placeholder="0.00"
                                  disabled={!formData.tiposCertificado.includes(t)}
                              />
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Días y horarios */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Días y horarios:</label>

                    {/* Draft */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                      <div className="md:col-span-2">
                        <select
                            value={formData.horarioDraft.dia}
                            onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, dia: e.target.value } }))}
                            className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                        >
                          {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <input
                            type="time"
                            value={formData.horarioDraft.desde}
                            onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, desde: e.target.value } }))}
                            className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                            type="time"
                            value={formData.horarioDraft.hasta}
                            onChange={(e) => setFormData(fd => ({ ...fd, horarioDraft: { ...fd.horarioDraft, hasta: e.target.value } }))}
                            className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleAddHorario}
                            className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2"
                            title="Agregar horario"
                        >
                          <FiPlus /> Agregar
                        </button>
                      </div>
                    </div>

                    {/* Listado */}
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {formData.horarios.length === 0 && (
                          <div className="text-sm text-gray-500">Agrega al menos un horario.</div>
                      )}
                      {formData.horarios.map((h, idx) => (
                          <div key={`${h.dia}-${h.desde}-${h.hasta}-${idx}`}
                               className="flex items-center justify-between border-2 border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                            <div className="text-black">{h.dia} — {h.desde} a {h.hasta}</div>
                            <button type="button" onClick={() => removeHorario(idx)} className="text-red-600 hover:text-red-800" title="Eliminar">
                              <FiTrash />
                            </button>
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* NUEVO: Fechas y Vacantes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Fecha de inicio:</label>
                      <input
                          type="date"
                          name="inicio"
                          value={formData.inicio}
                          onChange={handleChange}
                          className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                          required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Fecha de fin:</label>
                      <input
                          type="date"
                          name="fin"
                          value={formData.fin}
                          onChange={handleChange}
                          className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                          required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Vacantes:</label>
                      <input
                          type="number"
                          name="vacantes"
                          value={formData.vacantes}
                          onChange={handleChange}
                          className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                          min="0"
                          step="1"
                          required
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-2 mt-2 pt-4 border-t">
                    <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition">
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                      {editing ? 'Guardar Cambios' : 'Crear Curso'}
                    </button>
                  </div>
                </motion.form>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
