// src/pages/Alumnos.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import useAlumnos from '../hooks/useAlumnos'; // Ajusta la ruta según tu estructura

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

// Componente de loading
function LoadingSpinner() {
  return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
  );
}

export default function Alumnos() {
  // Hook personalizado para manejar alumnos
  const { students, loading, error, createAlumno, updateAlumno, deleteAlumno } = useAlumnos();

  // Estados locales para la UI
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
                  f?.toLowerCase().includes(search.toLowerCase())
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
    setFormData({});
  };

  // Manejo inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  // Crear / editar
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      // Validación básica
      if (!formData.nombre || !formData.apellido || !formData.dni) {
        throw new Error('Nombre, Apellido y DNI son obligatorios');
      }

      let result;

      if (editing) {
        // Actualizar alumno existente
        result = await updateAlumno(editing.id, formData);
        if (result.success) {
          showNotification('success', 'Alumno editado correctamente');
        } else {
          throw new Error(result.error || 'Error al editar alumno');
        }
      } else {
        // Crear nuevo alumno
        result = await createAlumno(formData);
        if (result.success) {
          showNotification('success', 'Alumno creado correctamente');
        } else {
          throw new Error(result.error || 'Error al crear alumno');
        }
      }

      closeForm();

    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar alumno
  const handleDelete = async (alumno) => {
    if (window.confirm(`¿Seguro que querés eliminar a ${alumno.nombre}?`)) {
      const result = await deleteAlumno(alumno.id);
      if (result.success) {
        showNotification('success', 'Alumno eliminado correctamente');
      } else {
        showNotification('error', result.error || 'Error al eliminar alumno');
      }
    }
  };

  // Mostrar error si hay problemas de conexión
  if (error) {
    return (
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
            <button
                onClick={() => window.location.reload()}
                className="ml-4 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="p-6 relative">
        <Notifications notifications={notifications} remove={removeNotification} />

        {/* Buscador + Nuevo */}
        <div className="flex mb-4">
          <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
          />
          <button
              className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition disabled:opacity-50"
              onClick={() => openForm(null)}
              disabled={loading}
          >
            Nuevo Alumno
          </button>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* Tabla */}
        {!loading && (
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
                      <td className="px-4 py-2 text-black">{alumno.id}</td>
                      <td className="px-4 py-2 text-black">{alumno.nombre}</td>
                      <td className="px-4 py-2 text-black">{alumno.apellido}</td>
                      <td className="px-4 py-2 text-black">{alumno.dni}</td>
                      <td className="px-4 py-2 text-black">{alumno.telefono}</td>
                      <td className="px-4 py-2 text-black">
                        {alumno.email && alumno.email.length > 15
                            ? alumno.email.slice(0, 15) + '…'
                            : alumno.email}
                      </td>
                      <td className="px-4 py-2 text-black">{alumno.direccion}</td>
                      <td className="px-4 py-2 text-black">{alumno.localidad}</td>
                      <td className="px-4 py-2 text-black">
                    <span
                        className={`px-2 py-1 rounded-full text-xs ${
                            alumno.estado === 'Activo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {alumno.estado}
                    </span>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <motion.button
                            onClick={() => setViewing(alumno)}
                            whileHover={{ scale: 1.2 }}
                            className="text-black hover:text-purple-700"
                            title="Ver detalles"
                        >
                          <FiEye size={18} />
                        </motion.button>
                        <motion.button
                            onClick={() => openForm(alumno)}
                            whileHover={{ scale: 1.2 }}
                            className="text-black hover:text-purple-700"
                            title="Editar"
                        >
                          <FiEdit size={18} />
                        </motion.button>
                        <motion.button
                            onClick={() => handleDelete(alumno)}
                            whileHover={{ scale: 1.2 }}
                            className="text-black hover:text-red-600"
                            title="Eliminar"
                        >
                          <FiTrash2 size={18} />
                        </motion.button>
                      </td>
                    </motion.tr>
                ))}
                {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan="10" className="text-center py-4 text-gray-500">
                        {search ? 'No se encontraron resultados.' : 'No hay alumnos registrados.'}
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
        )}

        {/* Modal Ver Detalles */}
        <AnimatePresence>
          {viewing && (
              <motion.div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => e.target === e.currentTarget && setViewing(null)}
              >
                <motion.div
                    className="bg-white p-6 rounded-lg max-w-md w-full mx-4 relative text-black max-h-[90vh] overflow-y-auto"
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
                    <div className="w-20 h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
                      {viewing.foto ? (
                          <img src={viewing.foto} alt="Foto del alumno" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                          <div className="text-gray-400">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                      )}
                    </div>

                    {/* Información básica */}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold">{viewing.nombre} {viewing.apellido}</h3>
                      <p className="text-gray-600"><strong>DNI:</strong> {viewing.dni}</p>
                      <p className="text-gray-600"><strong>Estado:</strong>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            viewing.estado === 'Activo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                      {viewing.estado}
                    </span>
                      </p>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 mb-4">
                    <p><strong>Fecha de nacimiento:</strong> {viewing.fechaNacimiento || 'No especificada'}</p>
                    <p><strong>Teléfono:</strong> {viewing.telefono || 'No especificado'}</p>
                    <p><strong>Email:</strong> {viewing.email || 'No especificado'}</p>
                    <p><strong>Dirección:</strong> {viewing.direccion || 'No especificada'}</p>
                    <p><strong>Localidad:</strong> {viewing.localidad || 'No especificada'}</p>
                  </div>

                  {/* Datos de Padres/Tutores/Empresa */}
                  {viewing.padreTutor && (
                      <div className="mb-4">
                        <label className="text-sm font-semibold text-black mb-2 block">Datos de Padres/Tutores/Empresa:</label>
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-sm">{viewing.padreTutor}</p>
                        </div>
                      </div>
                  )}

                  {/* Observaciones */}
                  {viewing.observaciones && (
                      <div>
                        <label className="text-sm font-semibold text-black mb-2 block">Observaciones:</label>
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-sm">{viewing.observaciones}</p>
                        </div>
                      </div>
                  )}
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
                  onClick={(e) => e.target === e.currentTarget && closeForm()}
              >
                <motion.form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 relative text-black space-y-4 max-h-[90vh] overflow-y-auto"
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
                        <div className="w-20 h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
                          {formData.foto ? (
                              <img src={formData.foto} alt="Foto del alumno" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                              <div className="text-gray-400">
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-xl text-black file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                      </div>
                    </div>

                    {/* Campos del formulario */}
                    {[
                      { label: 'Nombre *', name: 'nombre', required: true },
                      { label: 'Apellido *', name: 'apellido', required: true },
                      { label: 'DNI *', name: 'dni', required: true },
                      { label: 'Teléfono', name: 'telefono' },
                      { label: 'Email', name: 'email', type: 'email' },
                      { label: 'Dirección', name: 'direccion' },
                      { label: 'Localidad', name: 'localidad' },
                      { label: 'Estado', name: 'estado', type: 'select', options: ['Activo', 'Inactivo'] },
                      { label: 'Fecha de Nacimiento', name: 'fechaNacimiento', type: 'date' },
                    ].map(({ label, name, type, options, required }) => (
                        <div key={name} className="flex flex-col">
                          <label className="text-sm font-medium mb-1">{label}</label>
                          {type === 'select' ? (
                              <select
                                  name={name}
                                  value={formData[name] || ''}
                                  onChange={handleChange}
                                  className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 text-black"
                                  required={required}
                              >
                                {options.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                          ) : (
                              <input
                                  name={name}
                                  type={type || 'text'}
                                  value={formData[name] || ''}
                                  onChange={handleChange}
                                  className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 placeholder-gray-400 text-black"
                                  required={required}
                              />
                          )}
                        </div>
                    ))}

                    {/* Padres/Tutores/Empresa */}
                    <div className="col-span-2 flex flex-col">
                      <label className="text-sm font-medium mb-1">Datos de Padres/Tutores/Empresa</label>
                      <textarea
                          name="padreTutor"
                          value={formData.padreTutor || ''}
                          onChange={handleChange}
                          rows={3}
                          className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 placeholder-gray-400 text-black resize-none"
                          placeholder="Ingrese datos de contacto de padres, tutores o empresa..."
                      />
                    </div>

                    {/* Observaciones */}
                    <div className="col-span-2 flex flex-col">
                      <label className="text-sm font-medium mb-1">Observaciones</label>
                      <textarea
                          name="observaciones"
                          value={formData.observaciones || ''}
                          onChange={handleChange}
                          rows={3}
                          className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 placeholder-gray-400 text-black resize-none"
                          placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                        disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submitting}
                    >
                      {submitting ? 'Guardando...' : (editing ? 'Guardar' : 'Crear')}
                    </button>
                  </div>
                </motion.form>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}