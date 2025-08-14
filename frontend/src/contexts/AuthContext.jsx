import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = ({ username, password }) => {
    // credenciales de ejemplo
    if (username === 'admin' && password === 'admin') {
      setUser({ name: 'Administrador', role: 'Administrador' });
      navigate('/dashboard');
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };
  const logout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}