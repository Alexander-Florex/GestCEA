// src/pages/Profesores.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { useDB } from "../contexts/AppDB.jsx";

// Helpers
const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const resumenHorarios = (horarios=[]) =>
    horarios.map(h => `${h.dia.slice(0,3)} ${h.desde}-${h.hasta}`).join(', ');

// Mock data inicial ha sido eliminado.

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
              >
                {n.message}
              </motion.div>
          ))}
        </AnimatePresence>
      </div>
  );
}

export default function Profesores() {
  const { professors, addProfessor, updateProfessor, removeProfessor } = useDB();
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
      () => professors.filter(p =>
          [p.nombre, p.apellido, p.dni, (p.materias||[]).join(' ')].some(f =>
              String(f).toLowerCase().includes(search.toLowerCase())
          )
      ),
      [professors, search]
  );

  // ===== Form state =====
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '', localidad: '', estado: 'Activo',
    titulo: '', fechaAlta: '', observaciones: '', cv: '', photo: '',
    materias: [],
    horarios: [],
  });

  // Drafts
  const [materiaDraft, setMateriaDraft] = useState('');
  const [horarioDraft, setHorarioDraft] = useState({ dia: 'Lunes', desde: '', hasta: '' });

  const openForm = (prof) => {
    if (prof) {
      setEditing(prof);
      setFormData({
        nombre: prof.nombre,
        apellido: prof.apellido,
        dni: prof.dni,
        telefono: prof.telefono,
        email: prof.email,
        direccion: prof.direccion,
        localidad: prof.localidad,
        estado: prof.estado,
        titulo: prof.titulo,
        fechaAlta: prof.fechaAlta,
        observaciones: prof.observaciones,
        cv: prof.cv,
        photo: prof.photo,
        materias: prof.materias || [],
        horarios: prof.horarios || [],
      });
    } else {
      setEditing(null);
      setFormData({
        nombre:'', apellido:'', dni:'', telefono:'', email:'', direccion:'', localidad:'', estado:'Activo',
        titulo:'', fechaAlta:'', observaciones:'', cv:'', photo:'', materias:[], horarios:[]
      });
    }
    setMateriaDraft('');
    setHorarioDraft({ dia:'Lunes', desde:'', hasta:'' });
    setIsFormOpen(true);
  };
  const closeForm = () => { setIsFormOpen(false); setEditing(null); };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(fd=>({ ...fd, [name]: value }));
  };

  // Archivos
  const handleCvChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') return showNotification('error','Solo PDF permitido');
      setFormData(fd=>({ ...fd, cv: URL.createObjectURL(file) }));
    }
  };
  const handlePhotoChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(fd=>({ ...fd, photo: URL.createObjectURL(file) }));
    }
  };

  // Materias
  const addMateria = () => {
    const m = materiaDraft.trim();
    if (!m) return;
    if (formData.materias.includes(m)) {
      showNotification('error','La materia ya fue agregada');
      return;
    }
    setFormData(fd=>({ ...fd, materias: [...fd.materias, m] }));
    setMateriaDraft('');
  };
  const removeMateria = (m) => {
    setFormData(fd=>({ ...fd, materias: fd.materias.filter(x=>x!==m) }));
  };

  // Horarios
  const addHorario = () => {
    const { dia, desde, hasta } = horarioDraft;
    if (!dia || !desde || !hasta) {
      showNotification('error','Completa día, desde y hasta');
      return;
    }
    const exists = formData.horarios.some(h => h.dia===dia && h.desde===desde && h.hasta===hasta);
    if (exists) {
      showNotification('error','Ese horario ya está agregado');
      return;
    }
    setFormData(fd=>({ ...fd, horarios: [...fd.horarios, { dia, desde, hasta }] }));
    setHorarioDraft(d => ({ ...d, desde:'', hasta:'' }));
  };
  const removeHorario = (idx) => {
    setFormData(fd=>({ ...fd, horarios: fd.horarios.filter((_,i)=>i!==idx) }));
  };

  // Submit
  const handleSubmit = e => {
    e.preventDefault();
    try {
      if (!/^[0-9]+$/.test(formData.dni)) throw new Error('DNI numérico');
      if (!/^[0-9]+$/.test(formData.telefono)) throw new Error('Teléfono numérico');
      if (!formData.nombre || !formData.apellido) throw new Error('Nombre y Apellido son obligatorios');

      const payload = {
        ...formData,
        id: editing ? editing.id : null
      };

      if (editing) {
        updateProfessor(payload.id, payload);
        showNotification('success','Profesor editado');
      } else {
        addProfessor(payload);
        showNotification('success','Profesor creado');
      }
      closeForm();
    } catch(err) {
      showNotification('error', err.message);
    }
  };

  const handleDelete = prof => {
    if (window.confirm(`Eliminar a ${prof.nombre}?`)) {
      removeProfessor(prof.id);
      showNotification('success','Profesor eliminado');
    }
  };

  return (
      <div className="p-6 relative">
        <Notifications notifications={notifications} remove={removeNotification} />

        {/* Buscador + Nuevo */}
        <div className="flex mb-4">
          <input
              type="text"
              placeholder="Buscar por nombre, DNI o materia..."
              className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black"
              value={search}
              onChange={e=>setSearch(e.target.value)}
          />
          <button
              onClick={()=>openForm(null)}
              className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition"
          >
            Nuevo Profesor
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-auto border-2 border-purple-500 rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-purple-500 text-white">
            <tr>
              {['ID','Nombre','Apellido','DNI','Teléfono','Email','Dirección','Localidad','Estado','Materia/s a dictar','Horarios','Acciones']
                  .map(h=> <th key={h} className="px-4 py-2 whitespace-nowrap">{h}</th>)}
            </tr>
            </thead>
            <tbody>
            {filtered.map(prof=>(
                <motion.tr key={prof.id} className="hover:bg-gray-50" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.2}}>
                  <td className="px-4 py-2 text-black">{prof.id}</td>
                  <td className="px-4 py-2 text-black">{prof.nombre}</td>
                  <td className="px-4 py-2 text-black">{prof.apellido}</td>
                  <td className="px-4 py-2 text-black">{prof.dni}</td>
                  <td className="px-4 py-2 text-black">{prof.telefono}</td>
                  <td className="px-4 py-2 text-black">{prof.email.slice(0,18)}{prof.email.length>18?'…':''}</td>
                  <td className="px-4 py-2 text-black">{prof.direccion}</td>
                  <td className="px-4 py-2 text-black">{prof.localidad}</td>
                  <td className="px-4 py-2 text-black">{prof.estado}</td>
                  <td className="px-4 py-2 text-black">{(prof.materias||[]).join(', ') || '-'}</td>
                  <td className="px-4 py-2 text-black">{resumenHorarios(prof.horarios)}</td>
                  <td className="px-4 py-2 space-x-2">
                    <motion.button onClick={()=>setViewing(prof)} whileHover={{scale:1.2}} className="text-black hover:text-purple-700"><FiEye/></motion.button>
                    <motion.button onClick={()=>openForm(prof)} whileHover={{scale:1.2}} className="text-black hover:text-purple-700"><FiEdit/></motion.button>
                    <motion.button onClick={()=>handleDelete(prof)} whileHover={{scale:1.2}} className="text-red-600 hover:text-red-800"><FiTrash2/></motion.button>
                  </td>
                </motion.tr>
            ))}
            {filtered.length===0 && (
                <tr><td colSpan={12} className="text-center py-6 text-gray-500">No hay resultados</td></tr>
            )}
            </tbody>
          </table>
        </div>

        {/* Modal Detalles */}
        <AnimatePresence>
          {viewing && (
              <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                          onClick={()=>setViewing(null)}>
                <motion.div className="bg-white p-6 rounded-lg max-w-lg w-full relative border-2 border-blue-400 space-y-4 text-black"
                            initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}}
                            onClick={(e)=>e.stopPropagation()}>
                  <button className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100" onClick={()=>setViewing(null)}><FiX/></button>
                  <h2 className="text-xl font-semibold">Detalles del Profesor</h2>

                  <div className="flex space-x-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={viewing.photo||'/placeholder.png'} alt="Foto" className="w-full h-full object-cover"/>
                    </div>
                    <div className="space-y-1">
                      <p><strong>{viewing.nombre} {viewing.apellido}</strong></p>
                      <p>DNI: {viewing.dni}</p>
                      <p>Título: {viewing.titulo}</p>
                      <p>Teléfono: {viewing.telefono}</p>
                      <p>Dirección: {viewing.direccion}</p>
                      <p>Localidad: {viewing.localidad}</p>
                      <p>Fecha de alta: {viewing.fechaAlta}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium">Materia/s a dictar:</p>
                    <div className="mt-1 w-full border-2 border-gray-300 rounded-xl p-2 bg-gray-50">
                      {(viewing.materias||[]).join(', ') || '-'}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium">Horarios:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {viewing.horarios?.length
                          ? viewing.horarios.map((h,i)=><li key={i}>{h.dia}: {h.desde} - {h.hasta}</li>)
                          : <li>-</li>}
                    </ul>
                  </div>

                  <div className="flex flex-col">
                    <label className="font-medium">Observaciones:</label>
                    <textarea readOnly rows={3} className="mt-1 w-full border-2 border-black rounded-xl p-2 resize-none" value={viewing.observaciones||''} placeholder="Observaciones..."/>
                  </div>

                  <div className="flex space-x-2">
                    {viewing.cv && (
                        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                                onClick={()=>window.open(viewing.cv,'_blank')}>
                          Ver CV
                        </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Formulario */}
        <AnimatePresence>
          {isFormOpen && (
              <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                          onClick={closeForm}>
                <motion.form onSubmit={handleSubmit}
                             className="bg-white p-6 rounded-lg max-w-lg w-full relative space-y-4 text-black max-h-[90vh] overflow-y-auto"
                             initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}}
                             onClick={(e)=>e.stopPropagation()}>
                  <button type="button" className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100" onClick={closeForm}><FiX/></button>
                  <h2 className="text-xl font-semibold mb-2">{editing?'Editar Profesor':'Nuevo Profesor'}</h2>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {label:'Nombre',name:'nombre',type:'text'},
                      {label:'Apellido',name:'apellido',type:'text'},
                      {label:'DNI',name:'dni',type:'number'},
                      {label:'Teléfono',name:'telefono',type:'number'},
                      {label:'Email',name:'email',type:'email'},
                      {label:'Dirección',name:'direccion',type:'text'},
                      {label:'Localidad',name:'localidad',type:'text'},
                      {label:'Estado',name:'estado',type:'select',options:['Activo','Inactivo']},
                      {label:'Título',name:'titulo',type:'text'},
                      {label:'Fecha de alta',name:'fechaAlta',type:'date'},
                    ].map(({label,name,type,options})=>(
                        <div key={name} className="flex flex-col">
                          <label className="text-sm font-medium mb-1">{label}:</label>
                          {type==='select' ? (
                              <select name={name} value={formData[name]} onChange={handleChange} className="border-2 border-black rounded-xl px-3 py-2 text-black">
                                {options.map(o=><option key={o} value={o}>{o}</option>)}
                              </select>
                          ) : (
                              <input name={name} type={type} value={formData[name]} onChange={handleChange} className="border-2 border-black rounded-xl px-3 py-2 text-black" required />
                          )}
                        </div>
                    ))}

                    {/* Foto y CV */}
                    <div className="col-span-2 flex flex-col">
                      <label className="text-sm font-medium mb-1">Foto:</label>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm text-black" />
                    </div>
                    <div className="col-span-2 flex flex-col">
                      <label className="text-sm font-medium mb-1">Cargar CV (PDF):</label>
                      <input type="file" accept="application/pdf" onChange={handleCvChange} className="text-sm text-black" />
                    </div>
                  </div>

                  {/* Materias a dictar */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Materia/s a dictar:</label>
                    <div className="flex gap-2">
                      <input
                          type="text"
                          value={materiaDraft}
                          onChange={(e)=>setMateriaDraft(e.target.value)}
                          placeholder="Ej: Programación, Base de Datos…"
                          className="flex-1 border-2 border-black rounded-xl px-3 py-2 text-black"
                      />
                      <button type="button" onClick={addMateria} className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2">
                        <FiPlus/> Agregar
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.materias.length===0 && <span className="text-sm text-gray-500">Agrega una o más materias</span>}
                      {formData.materias.map(m=>(
                          <span key={m} className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {m}
                            <button type="button" onClick={()=>removeMateria(m)} className="hover:text-red-600">✕</button>
                    </span>
                      ))}
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Días y horarios:</label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                      <div className="md:col-span-2">
                        <select
                            value={horarioDraft.dia}
                            onChange={(e)=>setHorarioDraft(d=>({...d, dia:e.target.value}))}
                            className="w-full border-2 border-black rounded-xl px-3 py-2 text-black"
                        >
                          {diasSemana.map(d=><option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <input
                          type="time"
                          value={horarioDraft.desde}
                          onChange={(e)=>setHorarioDraft(d=>({...d, desde:e.target.value}))}
                          className="w-full border-2 border-black rounded-xl px-3 py-2 text-black"
                      />
                      <div className="flex gap-2">
                        <input
                            type="time"
                            value={horarioDraft.hasta}
                            onChange={(e)=>setHorarioDraft(d=>({...d, hasta:e.target.value}))}
                            className="w-full border-2 border-black rounded-xl px-3 py-2 text-black"
                        />
                        <button type="button" onClick={addHorario} className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2">
                          <FiPlus/> Agregar
                        </button>
                      </div>
                    </div>

                    {/* Listado */}
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {formData.horarios.length===0 && <div className="text-sm text-gray-500">Agrega al menos un horario.</div>}
                      {formData.horarios.map((h,idx)=>(
                          <div key={`${h.dia}-${h.desde}-${h.hasta}-${idx}`} className="flex items-center justify-between border-2 border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                            <div className="text-black">{h.dia} — {h.desde} a {h.hasta}</div>
                            <button type="button" onClick={()=>removeHorario(idx)} className="text-red-600 hover:text-red-800" title="Eliminar">
                              <FiMinus/>
                            </button>
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                    <button type="button" onClick={closeForm} className="px-4 py-2 border rounded hover:bg-gray-100 transition">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">{editing?'Guardar':'Crear'}</button>
                  </div>
                </motion.form>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}