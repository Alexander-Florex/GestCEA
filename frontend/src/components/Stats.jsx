import React from 'react';
export default function Stats({ stats }) {
  return (
    <div className="flex space-x-4 mb-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-lg p-4 flex-1 text-center">
          <div className="text-3xl font-bold text-indigo-600">{s.value}</div>
          <div className="text-sm text-gray-600 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}