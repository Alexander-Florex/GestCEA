import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!username || !password) {
      alert('Completa ambos campos');
    } else {
      login({ username, password });
    }
  };

  return (
      <div className="flex items-center justify-center min-h-screen relative">
        <div className="bg-shapes"></div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-xl w-full max-w-md z-10">
          <img src={logo} alt="CEA" className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
          <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 mb-4 border rounded-lg"
          />
          <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 mb-6 border rounded-lg"
          />
          <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >Ingresar</button>
        </form>
      </div>
  );
}