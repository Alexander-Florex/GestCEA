import React from 'react';
export default function SearchFilter({ search, setSearch, filter, setFilter }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <input
        type="text"
        placeholder="Buscar..."
        className="p-2 rounded-lg flex-1 mr-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="p-2 rounded-lg"
      >
        <option value="Todos">Todos los estados</option>
        <option value="Activo">Activos</option>
        <option value="Inactivo">Inactivos</option>
      </select>
    </div>
  );
}