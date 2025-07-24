// src/components/AnimatedCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AnimatedCard({ title, subtitle, icon: Icon, linkText, to }) {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(to)}
      className="
        bg-white/90            /* blanco con 90% de opacidad */
        rounded-xl             /* bordes redondeados */
        p-6
        flex-1 min-w-[260px]
        m-3
        shadow-lg              /* sombra suave por defecto */
        hover:shadow-2xl        /* sombra más intensa al hover */
        transition-shadow
        cursor-pointer
      "
    >
      <Icon className="text-indigo-600 text-4xl mb-4" /> {/* icono color primario */}
      <h2 className="text-gray-800 text-xl font-semibold mb-1">{title}</h2>
      <p className="text-gray-600 text-sm mb-4">{subtitle}</p>
      <span className="text-indigo-600 font-medium hover:underline">{linkText} →</span>
    </motion.div>
  );
}
