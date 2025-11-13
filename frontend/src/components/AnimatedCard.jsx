// src/components/AnimatedCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AnimatedCard({ title, subtitle, icon: Icon, linkText, to }) {
    const navigate = useNavigate();

    // Verificar si Icon es un componente válido
    if (!Icon) {
        console.error('Icon prop is undefined for card:', title);
        return null; // O mostrar un fallback
    }

    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(to)}
            className="
        bg-white/90
        rounded-xl
        p-6
        flex-1 min-w-[260px]
        m-3
        shadow-lg
        hover:shadow-2xl
        transition-shadow
        cursor-pointer
        border border-gray-200
      "
        >
            <Icon className="text-red-600 text-4xl mb-4" /> {/* Cambiado a rojo */}
            <h2 className="text-gray-800 text-xl font-semibold mb-1">{title}</h2>
            <p className="text-gray-600 text-sm mb-4">{subtitle}</p>
            <span className="text-blue-600 font-medium hover:underline">{linkText} →</span> {/* Cambiado a azul */}
        </motion.div>
    );
}