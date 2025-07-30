// src/pages/Cursos.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

// Datos simulados de profesores disponibles
const availableTeachers = [
  { id: 1, nombre: 'Juan', apellido: 'Pérez', especialidad: 'React/JavaScript' },
  { id: 2, nombre: 'Ana', apellido: 'Gómez', especialidad: 'Frontend' },
  { id: 3, nombre: 'Carlos', apellido: 'Ruiz', especialidad: 'Base de Datos' },
  { id: 4, nombre: 'María', apellido: 'López', especialidad: 'Backend' },
  { id: 5, nombre: 'Pedro', apellido: 'Martínez', especialidad: 'Full Stack' },
  { id: 6, nombre: 'Laura', apellido: 'García', especialidad: 'UI/UX' },
  { id: 7, nombre: 'Miguel', apellido: 'Rodríguez', especialidad: 'DevOps' },
  { id: 8, nombre: 'Sofia', apellido: 'Hernández', especialidad: 'Mobile' },
];

// Datos simulados iniciales de cursos
const initialCourses = [
  {
    id: 1,
    nombre: 'Programación React',
    profesores: [1, 2], // IDs de profesores asignados
    precioEfectivo: 1000,
    recargoEfectivo: 100,
    totalEfectivo: 1100,
    precioTarjeta: 1200,
    recargoTarjeta: 120,
    totalTarjeta: 1320,
    cuotas: 3,
    tipoCertificado: 'UTN',
    costoCertificado: 200,
  },
  {
    id: 2,
    nombre: 'Bases de Datos',
    profesores: [3], // IDs de profesores asignados
    precioEfectivo: 800,
    recargoEfectivo: 80,
    totalEfectivo: 880,
    precioTarjeta: 900,
    recargoTarjeta: 90,
    totalTarjeta: 990,
    cuotas: 2,
    tipoCertificado: 'CEA',
    costoCertificado: 150,
  },
];

// Componente selector de profesores
function TeacherSelector({ selectedTeachers, onTeachersChange, isOpen, onToggle }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeachers = availableTeachers.filter(teacher =>
    `${teacher.nombre} ${teacher.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
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
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
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

            {/* Lista de profesores */}
            <div className="max-h-40 overflow-y-auto">
              {filteredTeachers.length === 0 ? (
                <div className="p-3 text-gray-500 text-center">
                  No se encontraron profesores
                </div>
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
                      <div className="text-sm text-gray-500">
                        {teacher.especialidad}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Botones de acción */}
            <div className="p-3 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={() => onTeachersChange([])}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Limpiar todo
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de notificaciones animadas
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

export default function Cursos() {
  const [courses, setCourses] = useState(initialCourses);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', 
    profesores: [], // Ahora es un array de IDs
    precioEfectivo: '', 
    recargoEfectivo: '', 
    totalEfectivo: '',
    precioTarjeta: '', 
    recargoTarjeta: '', 
    totalTarjeta: '', 
    cuotas: '', 
    tipoCertificado: 'UTN', 
    costoCertificado: ''
  });
  const [notifications, setNotifications] = useState([]);
  const [isTeacherSelectorOpen, setIsTeacherSelectorOpen] = useState(false);

  const showNotification = (type, message) => {
    const id = Date.now();
    setNotifications(n => [...n, { id, type, message }]);
    setTimeout(() => removeNotification(id), 3000);
  };
  
  const removeNotification = (id) => {
    setNotifications(n => n.filter(x => x.id !== id));
  };

  // Helper function para obtener nombres de profesores
  const getTeacherNames = (teacherIds) => {
    return teacherIds.map(id => {
      const teacher = availableTeachers.find(t => t.id === id);
      return teacher ? `${teacher.nombre} ${teacher.apellido}` : '';
    }).filter(Boolean).join(', ');
  };

  const filtered = useMemo(
    () =>
      courses.filter(c => {
        const teacherNames = getTeacherNames(c.profesores);
        return c.nombre.toLowerCase().includes(search.toLowerCase()) ||
               teacherNames.toLowerCase().includes(search.toLowerCase());
      }),
    [courses, search]
  );

  const openForm = (course) => {
    if (course) {
      setEditing(course);
      setFormData({
        nombre: course.nombre,
        profesores: course.profesores, // Array de IDs
        precioEfectivo: course.precioEfectivo.toString(),
        recargoEfectivo: course.recargoEfectivo.toString(),
        totalEfectivo: course.totalEfectivo.toString(),
        precioTarjeta: course.precioTarjeta.toString(),
        recargoTarjeta: course.recargoTarjeta.toString(),
        totalTarjeta: course.totalTarjeta.toString(),
        cuotas: course.cuotas.toString(),
        tipoCertificado: course.tipoCertificado,
        costoCertificado: course.costoCertificado.toString()
      });
    } else {
      setEditing(null);
      setFormData({
        nombre: '', 
        profesores: [], // Array vacío
        precioEfectivo: '', 
        recargoEfectivo: '', 
        totalEfectivo: '',
        precioTarjeta: '', 
        recargoTarjeta: '', 
        totalTarjeta: '', 
        cuotas: '', 
        tipoCertificado: 'UTN', 
        costoCertificado: ''
      });
    }
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setIsTeacherSelectorOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!formData.nombre || formData.profesores.length === 0) {
        throw new Error('Nombre y al menos un profesor son obligatorios');
      }

      // Validar campos numéricos
      const numericFields = [
        'precioEfectivo', 'recargoEfectivo', 'totalEfectivo', 
        'precioTarjeta', 'recargoTarjeta', 'totalTarjeta', 
        'cuotas', 'costoCertificado'
      ];
      
      for (const field of numericFields) {
        const value = formData[field];
        if (!value || isNaN(Number(value))) {
          throw new Error(`El campo ${field} debe ser un número válido`);
        }
      }

      // Convertir datos del formulario a números para crear el curso
      const courseData = {
        id: editing ? editing.id : Math.max(0, ...courses.map(c => c.id)) + 1,
        nombre: formData.nombre,
        profesores: formData.profesores, // Array de IDs
        precioEfectivo: Number(formData.precioEfectivo),
        recargoEfectivo: Number(formData.recargoEfectivo),
        totalEfectivo: Number(formData.totalEfectivo),
        precioTarjeta: Number(formData.precioTarjeta),
        recargoTarjeta: Number(formData.recargoTarjeta),
        totalTarjeta: Number(formData.totalTarjeta),
        cuotas: Number(formData.cuotas),
        tipoCertificado: formData.tipoCertificado,
        costoCertificado: Number(formData.costoCertificado),
      };

      if (editing) {
        setCourses(cs => cs.map(c => c.id === editing.id ? courseData : c));
        showNotification('success', 'Curso editado correctamente');
      } else {
        setCourses(cs => [...cs, courseData]);
        showNotification('success', 'Curso creado correctamente');
      }
      closeForm();
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  const handleDelete = (course) => {
    if (window.confirm(`¿Eliminar curso "${course.nombre}"?`)) {
      setCourses(cs => cs.filter(c => c.id !== course.id));
      showNotification('success', 'Curso eliminado');
    }
  };

  return (
    <div className="p-6 relative">
      <Notifications notifications={notifications} remove={removeNotification} />

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

      <div className="overflow-auto border-2 border-purple-500 rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-purple-500 text-white">
            <tr>
              {[
                'ID','Nombre','Profesor/es','Precio Efectivo','Recargo Efectivo','Total Curso Efectivo',
                'Precio Tarjeta','Recargo Tarjeta','Total Curso Tarjeta','Nº de Cuotas','Tipo de Certificado','Costo de Certificado','Acciones'
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
                <td className="px-4 py-2 text-black">{getTeacherNames(course.profesores)}</td>
                <td className="px-4 py-2 text-black">${course.precioEfectivo}</td>
                <td className="px-4 py-2 text-black">${course.recargoEfectivo}</td>
                <td className="px-4 py-2 text-black">${course.totalEfectivo}</td>
                <td className="px-4 py-2 text-black">${course.precioTarjeta}</td>
                <td className="px-4 py-2 text-black">${course.recargoTarjeta}</td>
                <td className="px-4 py-2 text-black">${course.totalTarjeta}</td>
                <td className="px-4 py-2 text-black">{course.cuotas}</td>
                <td className="px-4 py-2 text-black">{course.tipoCertificado}</td>
                <td className="px-4 py-2 text-black">${course.costoCertificado}</td>
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

      {/* Modal de visualización */}
      <AnimatePresence>
        {viewing && (
          <motion.div 
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setViewing(null)}
          >
            <motion.div 
              className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 relative space-y-4 text-black border-2 border-blue-400" 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100" 
                onClick={() => setViewing(null)}
                title="Cerrar"
              >
                <FiX size={20} />
              </button>
              <h2 className="text-xl font-semibold">Detalles del Curso</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Nombre', value: viewing.nombre },
                  { label: 'Profesor/es', value: getTeacherNames(viewing.profesores) },
                  { label: 'Precio Efectivo', value: `$${viewing.precioEfectivo}` },
                  { label: 'Recargo Efectivo', value: `$${viewing.recargoEfectivo}` },
                  { label: 'Total Curso Efectivo', value: `$${viewing.totalEfectivo}` },
                  { label: 'Precio Tarjeta', value: `$${viewing.precioTarjeta}` },
                  { label: 'Recargo Tarjeta', value: `$${viewing.recargoTarjeta}` },
                  { label: 'Total Curso Tarjeta', value: `$${viewing.totalTarjeta}` },
                  { label: 'Nº de Cuotas', value: viewing.cuotas },
                  { label: 'Tipo de Certificado', value: viewing.tipoCertificado },
                  { label: 'Costo de Certificado', value: `$${viewing.costoCertificado}` }
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

      {/* Modal de formulario */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={closeForm}
          >
            <motion.form 
              onSubmit={handleSubmit} 
              className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 relative space-y-4 text-black max-h-[90vh] overflow-y-auto" 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button" 
                className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100" 
                onClick={closeForm}
                title="Cerrar"
              >
                <FiX size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">{editing ? 'Editar Curso' : 'Nuevo Curso'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium mb-1">Nombre:</label>
                  <input
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium mb-1">Profesor/es:</label>
                  <TeacherSelector
                    selectedTeachers={formData.profesores}
                    onTeachersChange={(teachers) => setFormData(fd => ({ ...fd, profesores: teachers }))}
                    isOpen={isTeacherSelectorOpen}
                    onToggle={() => setIsTeacherSelectorOpen(!isTeacherSelectorOpen)}
                  />
                </div>

                {[
                  { label: 'Precio Efectivo', name: 'precioEfectivo', type: 'number' },
                  { label: 'Recargo Efectivo', name: 'recargoEfectivo', type: 'number' },
                  { label: 'Total Curso Efectivo', name: 'totalEfectivo', type: 'number' },
                  { label: 'Precio Tarjeta', name: 'precioTarjeta', type: 'number' },
                  { label: 'Recargo Tarjeta', name: 'recargoTarjeta', type: 'number' },
                  { label: 'Total Curso Tarjeta', name: 'totalTarjeta', type: 'number' },
                  { label: 'Nº de Cuotas', name: 'cuotas', type: 'number' },
                  { label: 'Tipo de Certificado', name: 'tipoCertificado', type: 'select', options: ['UTN', 'CEA'] },
                  { label: 'Costo de Certificado', name: 'costoCertificado', type: 'number' }
                ].map(({ label, name, type, options }) => (
                  <div key={name} className="flex flex-col">
                    <label className="text-sm font-medium mb-1">{label}:</label>
                    {type === 'select' ? (
                      <select 
                        name={name} 
                        value={formData[name]} 
                        onChange={handleChange} 
                        className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                        required
                      >
                        {options?.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={name}
                        type={type}
                        value={formData[name]}
                        onChange={handleChange}
                        className="border-2 border-gray-300 rounded-xl px-3 py-2 text-black focus:border-purple-500 focus:outline-none"
                        required
                        min={type === 'number' ? '0' : undefined}
                        step={type === 'number' ? '0.01' : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={closeForm} 
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                >
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