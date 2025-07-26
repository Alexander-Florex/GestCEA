// src/pages/Alumnos.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

// Mock data inicial
const initialData = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Lopez',
    dni: '1233',
    telefono: '123123',
    email: 'juan@example.com',
    direccion: 'Calle Falsa 123',
    localidad: 'Ciudad',
    estado: 'Activo',
    fechaNacimiento: '2000-01-01',
    observaciones: 'Alergia al maíz',
    padreTutor: 'María López',
    foto: '',
  },
  {
    id: 2,
    nombre: 'Ana',
    apellido: 'García',
    dni: '4567',
    telefono: '456456',
    email: 'ana@example.com',
    direccion: 'Av. Siempre Viva 742',
    localidad: 'Villa',
    estado: 'Inactivo',
    fechaNacimiento: '1998-05-12',
    observaciones: '',
    padreTutor: 'Carlos García',
    foto: '',
  },
];

// Componente de notificaciones animadas
function Notifications({ notifications, remove }) {
  return (
    <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50">
      <AnimatePresence>
        {notifications.map(({ id, type, message }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className={`px-4 py-2 rounded shadow ${
              type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
            onClick={() => remove(id)}
          >
            {message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Alumnos() {
  const [students, setStudents] = useState(initialData);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Mostrar notificación
  const showNotification = (type, message) => {
    const id = Date.now();
    setNotifications((n) => [...n, { id, type, message }]);
    setTimeout(() => removeNotification(id), 3000);
  };
  const removeNotification = (id) => {
    setNotifications((n) => n.filter((x) => x.id !== id));
  };

  // Filtrar alumnos
  const filtered = useMemo(
    () =>
      students.filter((a) =>
        [a.nombre, a.apellido, a.dni].some((f) =>
          f.toLowerCase().includes(search.toLowerCase())
        )
      ),
    [students, search]
  );

  // Abrir form (nuevo o editar)
  const openForm = (alumno) => {
    if (alumno) {
      setEditing(alumno);
      setFormData({ ...alumno });
    } else {
      setEditing(null);
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        email: '',
        direccion: '',
        localidad: '',
        estado: 'Activo',
        fechaNacimiento: '',
        padreTutor: '',
        observaciones: '',
        foto: '',
      });
    }
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  // Manejo inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  // Crear / editar
  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!formData.nombre || !formData.apellido || !formData.dni) {
        throw new Error('Nombre, Apellido y DNI son obligatorios');
      }
      if (editing) {
        setStudents((st) =>
          st.map((s) => (s.id === editing.id ? { ...formData, id: s.id } : s))
        );
        showNotification('success', 'Alumno editado correctamente');
      } else {
        const nextId = Math.max(0, ...students.map((s) => s.id)) + 1;
        setStudents((st) => [...st, { ...formData, id: nextId }]);
        showNotification('success', 'Alumno creado correctamente');
      }
      closeForm();
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Eliminar alumno
  const handleDelete = (alumno) => {
    if (window.confirm(`¿Seguro que querés eliminar a ${alumno.nombre}?`)) {
      setStudents((st) => st.filter((s) => s.id !== alumno.id));
      showNotification('success', 'Alumno eliminado correctamente');
    }
  };

  return (
    <div className="p-6 relative">
      <Notifications notifications={notifications} remove={removeNotification} />

      {/* Buscador + Nuevo */}
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition"
          onClick={() => openForm(null)}
        >
          Nuevo Alumno
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-auto border-2 border-purple-500 rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-purple-500 text-white">
            <tr>
              {[
                'ID',
                'Nombre',
                'Apellido',
                'DNI',
                'Teléfono',
                'Email',
                'Dirección',
                'Localidad',
                'Estado',
                'Acciones',
              ].map((h) => (
                <th key={h} className="px-4 py-2 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((alumno) => (
              <motion.tr
                key={alumno.id}
                className="hover:bg-gray-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {[
                  alumno.id,
                  alumno.nombre,
                  alumno.apellido,
                  alumno.dni,
                  alumno.telefono,
                  alumno.email.length > 10
                    ? alumno.email.slice(0, 10) + '…'
                    : alumno.email,
                  alumno.direccion,
                  alumno.localidad,
                  alumno.estado,
                ].map((c, i) => (
                  <td key={i} className="px-4 py-2 text-black">
                    {c}
                  </td>
                ))}
                <td className="px-4 py-2 space-x-2">
                  <motion.button
                    onClick={() => setViewing(alumno)}
                    whileHover={{ scale: 1.2 }}
                    className="text-black hover:text-purple-700"
                  >
                    <FiEye size={18} />
                  </motion.button>
                  <motion.button
                    onClick={() => openForm(alumno)}
                    whileHover={{ scale: 1.2 }}
                    className="text-black hover:text-purple-700"
                  >
                    <FiEdit size={18} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(alumno)}
                    whileHover={{ scale: 1.2 }}
                    className="text-black hover:text-purple-700"
                  >
                    <FiTrash2 size={18} />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center py-4 text-black">
                  No hay resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ver Detalles */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg max-w-md w-full relative text-black"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-black"
                onClick={() => setViewing(null)}
              >
                <FiX size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">Detalles del Alumno</h2>
              
              <div className="flex items-start gap-4 mb-4">
                {/* Foto del alumno */}
                <div className="w-20 h-20 border-2 border-black rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
                  {viewing.foto ? (
                    <img src={viewing.foto} alt="Foto del alumno" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-gray-400">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Información básica */}
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{viewing.nombre} {viewing.apellido}</h3>
                  <p className="text-gray-600"><strong>DNI:</strong> {viewing.dni}</p>
                  <p className="text-gray-600"><strong>Fecha de nacimiento:</strong> {viewing.fechaNacimiento}</p>
                  <p className="text-gray-600"><strong>Teléfono:</strong> {viewing.telefono}</p>
                  <p className="text-gray-600"><strong>Email:</strong> {viewing.email}</p>
                  <p className="text-gray-600"><strong>Dirección:</strong> {viewing.direccion}</p>
                  <p className="text-gray-600"><strong>Localidad:</strong> {viewing.localidad}</p>
                  <p className="text-gray-600"><strong>Estado:</strong> {viewing.estado}</p>
                  <p className="text-gray-600"><strong>Fecha de alta:</strong> {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>

              {/* Datos de Padres/Tutores/Empresa */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-black mb-2 block">Datos de Padres/Tutores/Empresa:</label>
                <textarea
                  value={viewing.padreTutor || ''}
                  readOnly
                  rows={3}
                  className="w-full border-2 border-black rounded-lg p-3 placeholder-gray-400 text-black resize-none"
                  placeholder="Datos..."
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-sm font-semibold text-black mb-2 block">Observaciones:</label>
                <textarea
                  value={viewing.observaciones || ''}
                  readOnly
                  rows={3}
                  className="w-full border-2 border-black rounded-lg p-3 placeholder-gray-400 text-black resize-none"
                  placeholder="Observaciones..."
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Crear/Editar */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-lg max-w-lg w-full relative text-black space-y-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-500 hover:text-black"
                onClick={closeForm}
              >
                <FiX size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-2">
                {editing ? 'Editar Alumno' : 'Nuevo Alumno'}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Foto del alumno */}
                <div className="col-span-2 flex flex-col">
                  <label className="text-sm font-medium mb-1">Foto del Alumno</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border-2 border-black rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
                      {formData.foto ? (
                        <img src={formData.foto} alt="Foto del alumno" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="text-gray-400">
                          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setFormData(fd => ({ ...fd, foto: e.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex-1 px-3 py-2 border-2 border-black rounded-xl text-black"
                    />
                  </div>
                </div>

                {[
                  { label: 'Nombre', name: 'nombre'},
                  { label: 'Apellido', name: 'apellido'},
                  { label: 'DNI', name: 'dni'},
                  { label: 'Teléfono', name: 'telefono'},
                  { label: 'Email', name: 'email'},
                  { label: 'Dirección', name: 'direccion'},
                  { label: 'Localidad', name: 'localidad'},
                  { label: 'Estado', name: 'estado', type: 'select', options: ['Activo','Inactivo'] },
                  { label: 'Fecha de Nacimiento', name: 'fechaNacimiento', type: 'date'},
                ].map(({ label, name, type, options }) => (
                  <div key={name} className="flex flex-col">
                    <label className="text-sm font-medium mb-1">{label}</label>
                    {type === 'select' ? (
                      <select
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        className="px-3 py-2 border-2 border-black rounded-xl placeholder-gray-400 text-black"
                      >
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        name={name}
                        type={type || 'text'}
                        value={formData[name]}
                        onChange={handleChange}
                        className="px-3 py-2 border-2 border-black rounded-xl placeholder-gray-400 text-black"
                        placeholder={label === 'Localidad' ? 'Datos...' : ''}
                        required
                      />
                    )}
                  </div>
                ))}
                
                {/* Padres/Tutores/Empresa */}
                <div className="col-span-2 flex flex-col">
                  <label className="text-sm font-medium mb-1">Datos de Padres/Tutores/Empresa</label>
                  <textarea
                    name="padreTutor"
                    value={formData.padreTutor}
                    onChange={handleChange}
                    rows={3}
                    className="px-3 py-2 border-2 border-black rounded-xl placeholder-gray-400 text-black resize-none"
                    placeholder="Datos..."
                  />
                </div>
                
                {/* Observaciones */}
                <div className="col-span-2 flex flex-col">
                  <label className="text-sm font-medium mb-1">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    rows={3}
                    className="px-3 py-2 border-2 border-black rounded-xl placeholder-gray-400 text-black resize-none"
                    placeholder="Observaciones..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                >
                  {editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}