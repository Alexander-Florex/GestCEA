import React from 'react';
export default function Pagination({ page, setPage, total }) {
  return (
    <div className="flex justify-between items-center mt-4">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
        className="px-4 py-2 bg-white bg-opacity-40 rounded-lg"
      >Anterior</button>
      <span className="text-white">Página {page} de {total}</span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, total))}
        disabled={page === total}
        className="px-4 py-2 bg-white bg-opacity-40 rounded-lg"
      >Siguiente</button>
    </div>
  );
}