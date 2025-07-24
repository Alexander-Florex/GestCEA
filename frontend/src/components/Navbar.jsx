// src/components/Navbar.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IoLogOut } from 'react-icons/io5';
import logo from '../assets/logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex justify-between items-center p-4 bg-white bg-opacity-20 backdrop-blur-md">
      <div className="flex items-center">
        <img src={logo} alt="CEA Cursos" className="h-10 mr-3" />
        <h1 className="text-white text-2xl font-bold">CEA CURSOS</h1>
      </div>
      <div className="flex items-center">
        <span className="text-white mr-4">{user?.name}</span>
        <button onClick={logout} className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition">
          <IoLogOut className="text-white text-xl" />
        </button>
      </div>
    </header>
  );
}
