// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Clave para almacenar la sesión en localStorage
const SESSION_KEY = 'gestcea_session';

// ⚠️ NOTA DE SEGURIDAD: En producción, las contraseñas deben hashearse con bcrypt o similar
// Esta es una implementación básica para desarrollo/demostración
const simpleHash = (password) => {
    // En producción, usar bcrypt, argon2, o similar
    // Por ahora, retornamos la contraseña tal cual para compatibilidad
    return password;
};

const comparePassword = (plainPassword, hashedPassword) => {
    // En producción, usar bcrypt.compare() o similar
    return plainPassword === hashedPassword;
};

export function AuthProvider({ children, dbContext }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Cargar sesión guardada al iniciar
    useEffect(() => {
        const loadSession = () => {
            try {
                const savedSession = localStorage.getItem(SESSION_KEY);
                if (savedSession) {
                    const sessionData = JSON.parse(savedSession);

                    // Verificar que la sesión no haya expirado (opcional)
                    const now = new Date().getTime();
                    const sessionTime = new Date(sessionData.loginTime).getTime();
                    const hoursSinceLogin = (now - sessionTime) / (1000 * 60 * 60);

                    // Expirar sesión después de 24 horas
                    if (hoursSinceLogin < 24) {
                        setUser(sessionData);
                        console.log('[Auth] Sesión restaurada:', sessionData.nombre);
                    } else {
                        localStorage.removeItem(SESSION_KEY);
                        console.log('[Auth] Sesión expirada');
                    }
                }
            } catch (error) {
                console.error('[Auth] Error cargando sesión:', error);
                localStorage.removeItem(SESSION_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    // Guardar sesión cuando el usuario cambia
    useEffect(() => {
        if (user) {
            try {
                localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            } catch (error) {
                console.error('[Auth] Error guardando sesión:', error);
            }
        }
    }, [user]);

    /**
     * Login usando la tabla users de AppDB
     * @param {string} username - Puede ser correo o DNI
     * @param {string} password - Contraseña del usuario
     * @param {object} findUserByLogin - Función de AppDB para buscar usuarios
     */
    const login = ({ username, password }, findUserByLogin) => {
        try {
            if (!username || !password) {
                alert('Usuario y contraseña son obligatorios');
                return false;
            }

            // Buscar usuario en la base de datos
            const foundUser = findUserByLogin(username.trim());

            if (!foundUser) {
                alert('Usuario no encontrado');
                return false;
            }

            // Verificar que el usuario esté activo
            if (!foundUser.activo) {
                alert('Usuario desactivado. Contacta al administrador.');
                return false;
            }

            // Verificar contraseña
            if (!comparePassword(password, foundUser.contraseña)) {
                alert('Contraseña incorrecta');
                return false;
            }

            // Crear objeto de sesión (sin incluir contraseña)
            const sessionData = {
                id: foundUser.id,
                nombre: foundUser.nombre,
                apellido: foundUser.apellido,
                name: `${foundUser.nombre} ${foundUser.apellido}`, // Para compatibilidad
                correo: foundUser.correo,
                dni: foundUser.dni,
                rol: foundUser.rol || 'Usuario',
                role: foundUser.rol || 'Usuario', // Para compatibilidad
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            };

            setUser(sessionData);
            console.log('[Auth] Login exitoso:', sessionData.nombre);

            // Navegar al dashboard
            navigate('/dashboard');
            return true;

        } catch (error) {
            console.error('[Auth] Error en login:', error);
            alert('Error al iniciar sesión');
            return false;
        }
    };

    /**
     * Logout - Cierra sesión y limpia datos
     */
    const logout = () => {
        try {
            setUser(null);
            localStorage.removeItem(SESSION_KEY);
            console.log('[Auth] Sesión cerrada');
            navigate('/login');
        } catch (error) {
            console.error('[Auth] Error en logout:', error);
        }
    };

    /**
     * Actualizar datos del usuario en sesión
     * (útil cuando se edita el perfil)
     */
    const updateUserSession = (updatedData) => {
        if (!user) return;

        const updatedUser = {
            ...user,
            ...updatedData,
            lastActivity: new Date().toISOString()
        };

        setUser(updatedUser);
    };

    /**
     * Verificar si el usuario tiene un rol específico
     */
    const hasRole = (requiredRole) => {
        if (!user) return false;
        return user.rol === requiredRole;
    };

    /**
     * Verificar si el usuario tiene alguno de los roles permitidos
     */
    const hasAnyRole = (allowedRoles = []) => {
        if (!user) return false;
        return allowedRoles.includes(user.rol);
    };

    /**
     * Verificar si la sesión sigue activa (no expirada)
     */
    const isSessionValid = () => {
        if (!user || !user.loginTime) return false;

        const now = new Date().getTime();
        const loginTime = new Date(user.loginTime).getTime();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

        return hoursSinceLogin < 24;
    };

    /**
     * Actualizar última actividad (útil para extender sesión)
     */
    const updateActivity = () => {
        if (user) {
            const updated = {
                ...user,
                lastActivity: new Date().toISOString()
            };
            setUser(updated);
        }
    };

    // Valor del contexto
    const value = {
        user,
        isLoading,
        isAuthenticated: !!user && isSessionValid(),
        login,
        logout,
        updateUserSession,
        hasRole,
        hasAnyRole,
        isSessionValid,
        updateActivity,
        // Constantes útiles
        ROLES: {
            ADMIN: 'Administrador',
            USER: 'Usuario',
            TEACHER: 'Profesor',
            ACCOUNTANT: 'Contador'
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook personalizado para usar AuthContext con AppDB
 * Este hook debe usarse en componentes que necesitan acceso a ambos contextos
 */
export function useAuthWithDB() {
    const auth = useAuth();

    return {
        ...auth,
        // Métodos adicionales que combinan Auth + DB pueden agregarse aquí
    };
}

/**
 * HOC para proteger rutas que requieren autenticación
 * Uso: <ProtectedRoute><MiComponente /></ProtectedRoute>
 */
export function ProtectedRoute({ children, requiredRole = null, allowedRoles = [] }) {
    const { isAuthenticated, hasRole, hasAnyRole, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // Verificar rol específico
    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
                    <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
                </div>
            </div>
        );
    }

    // Verificar roles permitidos
    if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
                    <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
                </div>
            </div>
        );
    }

    return children;
}

export default AuthContext;