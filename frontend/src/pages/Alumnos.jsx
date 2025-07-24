import React, { useState, useMemo } from 'react';
import Stats from '../components/Stats';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import DataTable from '../components/DataTable';
import { alumnos } from '../data/alumnos';

export default function Alumnos() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Filtrado y búsqueda
  const filtered = useMemo(() => {
    return alumnos
      .filter(a => filter === 'Todos' || a.estado === filter)
      .filter(a => (`${a.nombre} ${a.apellido}`).toLowerCase().includes(search.toLowerCase()));
  }, [search, filter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  const stats = [
    { label: 'Total Alumnos', value: alumnos.length },
    { label: 'Activos', value: alumnos.filter(a => a.estado === 'Activo').length },
    { label: 'Inactivos', value: alumnos.filter(a => a.estado === 'Inactivo').length },
    { label: 'Con deudas', value: 2 },
  ];

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Apellido', accessor: 'apellido' },
    { Header: 'DNI', accessor: 'dni' },
    { Header: 'Teléfono', accessor: 'telefono' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Localidad', accessor: 'localidad' },
    { Header: 'Estado', accessor: 'estado' },
  ];

  return (
    <div className="p-6 relative text-white">
      <Stats stats={stats} />
      <SearchFilter search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />
      <DataTable columns={columns} data={paged} />
      <Pagination page={page} setPage={setPage} total={totalPages} />
    </div>
  );
}
