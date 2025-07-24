import React from 'react';
import DataTable from '../components/DataTable';
import { cursos } from '../data/cursos';
export default function Cursos() {
  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Código', accessor: 'code' },
    { Header: 'Nombre', accessor: 'name' },
    { Header: 'Duración', accessor: 'duracion' },
  ];
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">Cursos</h2>
      <DataTable columns={columns} data={cursos} />
    </div>
  );
}