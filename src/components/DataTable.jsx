// src/components/DataTable.jsx
import React from 'react'
import { IoEye, IoPencil, IoTrash } from 'react-icons/io5'

export default function DataTable({ columns, data }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-indigo-600">
          <tr>
            {columns.map(col => (
              <th
                key={col.accessor}
                className="px-4 py-2 text-left text-white text-sm font-medium uppercase tracking-wide"
              >
                {col.Header}
              </th>
            ))}
            <th className="px-4 py-2 text-left text-white text-sm font-medium uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id}
              className={
                idx % 2 === 0
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'bg-white hover:bg-gray-100'
              }
            >
              {columns.map(col => (
                <td
                  key={col.accessor}
                  className="px-4 py-3 text-gray-800 text-sm"
                >
                  {row[col.accessor]}
                </td>
              ))}
              <td className="px-4 py-3 flex space-x-2">
                <button className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition">
                  <IoEye />
                </button>
                <button className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition">
                  <IoPencil />
                </button>
                <button className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition">
                  <IoTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
