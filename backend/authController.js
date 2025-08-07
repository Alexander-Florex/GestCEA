// backend/authController.js
import db from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcrypt';

export async function verificarLogin(email, password) {
    try {
        console.log('🔍 Iniciando verificación de login para:', email);

        const usuariosRef = collection(db, 'USUARIOS');
        const q = query(
            usuariosRef,
            where('email', '==', email)
        );

        console.log('📊 Ejecutando query en Firestore...');
        const querySnapshot = await getDocs(q);
        console.log('📊 Query completada. Documentos encontrados:', querySnapshot.size);

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('👤 Usuario encontrado:', userData.email || 'Email no disponible');
            console.log('🔑 Password hash disponible:', !!userData.password_hash);

            if (!userData.password_hash) {
                console.log('⚠️  No se encontró password_hash en el documento del usuario');
                return null;
            }

            // Comparar la contraseña con bcrypt
            console.log('🔐 Comparando contraseñas...');
            const passwordMatch = await bcrypt.compare(password, userData.password_hash);
            console.log('🔐 Resultado de comparación:', passwordMatch ? 'MATCH' : 'NO MATCH');

            if (passwordMatch) {
                // Remover la contraseña hasheada de los datos que se devuelven
                const { password_hash, ...userWithoutPassword } = userData;
                console.log('✅ Login exitoso, devolviendo datos del usuario');
                return userWithoutPassword;
            } else {
                console.log('❌ Contraseña incorrecta');
                return null; // Contraseña incorrecta
            }
        } else {
            console.log('❌ Usuario no encontrado en la base de datos');
            return null; // Usuario no encontrado
        }
    } catch (error) {
        console.error('💥 Error en verificarLogin:', error);
        throw new Error('Error interno del servidor');
    }
}

// Función auxiliar para hashear contraseñas (útil para registro de usuarios)
export async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Función de utilidad para crear un usuario de prueba
export async function crearUsuarioPrueba() {
    try {
        const email = 'admin@admin.com';
        const password = 'admin1234';
        const hashedPassword = await hashPassword(password);

        console.log('🧪 Usuario de prueba:');
        console.log('📧 Email:', email);
        console.log('🔑 Password (original):', password);
        console.log('🔐 Password (hash):', hashedPassword);
        console.log('📝 Usa este hash en Firestore como "password_hash"');

        return { email, password_hash: hashedPassword };
    } catch (error) {
        console.error('Error creando usuario de prueba:', error);
    }
}