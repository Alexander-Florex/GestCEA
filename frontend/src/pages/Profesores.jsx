// src/pages/Profesores.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiX, FiPlus, FiMinus } from 'react-icons/fi';

// Mock data inicial de profesores
const initialProfessors = [
  {
    id: 1,
    nombre: 'Carlos',
    apellido: 'Pérez',
    dni: '9876',
    telefono: '5551234',
    email: 'carlos.perez@ejemplo.com',
    direccion: 'Calle Real 456',
    localidad: 'Capital',
    estado: 'Activo',
    titulo: 'Lic. Matemáticas',
    fechaAlta: '2023-08-01',
    observaciones: 'Experto en álgebra',
    cv: '',
    photo: '',
    horarios: [
      { day: 'Lunes', range: '09:30 - 11:30' },
      { day: 'Jueves', range: '12:00 - 14:00' }
    ]
  }
];

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
            className={`px-4 py-2 rounded shadow ${
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

export default function Profesores() {
  const [professors, setProfessors] = useState(initialProfessors);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '', localidad: '', estado: 'Activo',
    titulo: '', fechaAlta: '', observaciones: '', cv: '', photo: '', horarios: []
  });
  const [scheduleDay, setScheduleDay] = useState('Lunes');
  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('');
  const [notifications, setNotifications] = useState([]);

  const showNotification = (type, message) => {
    const id = Date.now();
    setNotifications(n => [...n, { id, type, message }]);
    setTimeout(() => removeNotification(id), 3000);
  };
  const removeNotification = id => setNotifications(n => n.filter(x => x.id !== id));

  const filtered = useMemo(
    () => professors.filter(p =>
      [p.nombre, p.apellido, p.dni].some(f => f.toLowerCase().includes(search.toLowerCase()))
    ),
    [professors, search]
  );

  const openForm = prof => {
    if (prof) {
      setEditing(prof);
      setFormData({ ...prof });
    } else {
      setEditing(null);
      setFormData({ nombre:'',apellido:'',dni:'',telefono:'',email:'',direccion:'',localidad:'',estado:'Activo',titulo:'',fechaAlta:'',observaciones:'',cv:'',photo:'',horarios:[] });
    }
    setStartHour(''); setStartMin(''); setEndHour(''); setEndMin('');
    setScheduleDay('Lunes');
    setIsFormOpen(true);
  };
  const closeForm = () => { setIsFormOpen(false); setEditing(null); };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  const handleCvChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') return showNotification('error','Solo PDF permitido');
      setFormData(fd => ({ ...fd, cv: URL.createObjectURL(file) }));
    }
  };
  const handlePhotoChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(fd => ({ ...fd, photo: URL.createObjectURL(file) }));
    }
  };

  const addSchedule = () => {
    if (startHour && startMin && endHour && endMin) {
      const range = `${startHour.padStart(2,'0')}:${startMin.padStart(2,'0')} - ${endHour.padStart(2,'0')}:${endMin.padStart(2,'0')}`;
      setFormData(fd => ({ ...fd, horarios: [...fd.horarios, { day: scheduleDay, range }] }));
      setStartHour(''); setStartMin(''); setEndHour(''); setEndMin('');
    }
  };
  const removeSchedule = idx => {
    setFormData(fd => ({ ...fd, horarios: fd.horarios.filter((_,i)=>i!==idx) }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    try {
      if (!/^[0-9]+$/.test(formData.dni)) throw new Error('DNI numérico');
      if (!/^[0-9]+$/.test(formData.telefono)) throw new Error('Teléfono numérico');
      if (!formData.nombre || !formData.apellido) throw new Error('Campos obligatorios');
      if (editing) {
        setProfessors(ps => ps.map(p => p.id===editing.id?{...formData,id:p.id}:p));
        showNotification('success','Profesor editado');
      } else {
        const nextId = Math.max(0,...professors.map(p=>p.id))+1;
        setProfessors(ps=>[...ps,{...formData,id:nextId}]);
        showNotification('success','Profesor creado');
      }
      closeForm();
    } catch (err) {
      showNotification('error',err.message);
    }
  };
  const handleDelete = prof => {
    if (window.confirm(`Eliminar a ${prof.nombre}?`)) {
      setProfessors(ps=>ps.filter(p=>p.id!==prof.id));
      showNotification('success','Profesor eliminado');
    }
  };

  return (
    <div className="p-6 relative">
      <Notifications notifications={notifications} remove={removeNotification} />
      <div className="flex mb-4">
        <input type="text" placeholder="Buscar..." className="flex-grow px-4 py-2 border-2 border-purple-500 rounded-l-lg focus:outline-none text-black" value={search} onChange={e=>setSearch(e.target.value)} />
        <button onClick={()=>openForm(null)} className="bg-purple-600 text-white px-6 rounded-r-lg hover:bg-purple-700 transition">Nuevo Profesor</button>
      </div>
      <div className="overflow-auto border-2 border-purple-500 rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-purple-500 text-white"><tr>{['ID','Nombre','Apellido','DNI','Teléfono','Email','Dirección','Localidad','Estado','Acciones'].map(h=><th key={h} className="px-4 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(prof=>(
              <motion.tr key={prof.id} className="hover:bg-gray-50" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.2}}>
                {[prof.id,prof.nombre,prof.apellido,prof.dni,prof.telefono,prof.email.slice(0,10)+'…',prof.direccion,prof.localidad,prof.estado].map((c,i)=><td key={i} className="px-4 py-2 text-black">{c}</td>)}
                <td className="px-4 py-2 space-x-2">
                  <motion.button onClick={()=>setViewing(prof)} whileHover={{scale:1.2}} className="text-black hover:text-purple-700"><FiEye/></motion.button>
                  <motion.button onClick={()=>openForm(prof)} whileHover={{scale:1.2}} className="text-black hover:text-purple-700"><FiEdit/></motion.button>
                  <motion.button onClick={()=>handleDelete(prof)} whileHover={{scale:1.2}} className="text-black hover:text-purple-700"><FiTrash2/></motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>{viewing&&(
        <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div className="bg-white p-6 rounded-lg max-w-sm w-full relative border-2 border-blue-400 space-y-4 text-black" initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}}>
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
            <div><p className="font-medium">Horarios:</p><ul className="list-disc list-inside space-y-1">{viewing.horarios.map((h,i)=><li key={i}>{h.day}: {h.range}</li>)}</ul></div>
            <div className="flex flex-col"><label className="font-medium">Observaciones:</label><textarea readOnly rows={3} className="mt-1 w-full border-2 border-black rounded-xl p-2 resize-none" value={viewing.observaciones} placeholder="Observaciones..."/></div>
            <div className="flex space-x-2"><button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition" onClick={()=>window.open(viewing.cv,'_blank')}>Ver CV</button></div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{isFormOpen&&(
        <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4 text-black" initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}}>
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

            {/* Horarios */}
            <div className="flex items-end space-x-2 mt-2">
              <select value={scheduleDay} onChange={e=>setScheduleDay(e.target.value)} className="border-2 border-black rounded-xl px-3 py-2 text-black">
                {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <input type="number" placeholder="HH" min="0" max="23" value={startHour} onChange={e=>setStartHour(e.target.value)} className="w-16 border-2 border-black rounded-xl px-2 py-2 text-black" />
              <input type="number" placeholder="MM" min="0" max="59" value={startMin} onChange={e=>setStartMin(e.target.value)} className="w-16 border-2 border-black rounded-xl px-2 py-2 text-black" />
              <span className="text-black">-</span>
              <input type="number" placeholder="HH" min="0" max="23" value={endHour} onChange={e=>setEndHour(e.target.value)} className="w-16 border-2 border-black rounded-xl px-2 py-2 text-black" />
              <input type="number" placeholder="MM" min="0" max="59" value={endMin} onChange={e=>setEndMin(e.target.value)} className="w-16 border-2 border-black rounded-xl px-2 py-2 text-black" />
              <button type="button" onClick={addSchedule} className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"><FiPlus/></button>
            </div>
            {formData.horarios.length>0 && (
              <ul className="list-disc list-inside text-black space-y-1 ml-4">
                {formData.horarios.map((h,i)=>(
                  <li key={i} className="flex justify-between items-center">
                    <span>{h.day}: {h.range}</span>
                    <button type="button" onClick={()=>removeSchedule(i)} className="text-red-500 hover:text-red-700"><FiMinus/></button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end space-x-2 mt-4">
              <button type="button" onClick={closeForm} className="px-4 py-2 border rounded hover:bg-gray-100 transition">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">{editing?'Guardar':'Crear'}</button>
            </div>
          </motion.form>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
