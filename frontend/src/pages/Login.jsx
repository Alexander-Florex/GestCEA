// src/pages/Login.jsx

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error en la autenticación');
        setLoading(false);
        return;
      }

      // Aquí podrías guardar un token o la info del usuario en localStorage/context
      console.log('Usuario autenticado:', data.user);
      // Redirige al dashboard u otra ruta protegida
      history.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        >
          <h2 className="text-2xl font-semibold mb-6 text-center">Iniciar Sesión</h2>

          {error && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
                {error}
              </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring"
            />
          </div>

          <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded text-white ${
                  loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              } transition`}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
  );
}
