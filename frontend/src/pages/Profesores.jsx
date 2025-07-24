import React from 'react';
import DataTable from '../components/DataTable';
import { profesores } from '../data/profesores';
export default function Profesores() {
  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Apellido', accessor: 'apellido' },
    { Header: 'Materia', accessor: 'materia' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Teléfono', accessor: 'telefono' },
  ];
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">Profesores</h2>
      <DataTable columns={columns} data={profesores} />
    </div>
  );
}