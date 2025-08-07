// api/login.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Asegúrate de que la variable de entorno esté configurada en Vercel
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!serviceAccount) {
    throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT no está configurada.');
}

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;

        try {
            // Aquí iría tu lógica para autenticar con Firebase
            // Por ejemplo, buscar un usuario en Firestore por email y verificar la contraseña
            const userRef = db.collection('users').where('email', '==', email);
            const userSnapshot = await userRef.get();

            if (userSnapshot.empty) {
                return res.status(401).json({ message: 'Usuario no encontrado' });
            }

            // Lógica de validación de contraseña (puedes usar bcrypt o similar)
            const userData = userSnapshot.docs[0].data();
            if (userData.password !== password) { // **¡AVISO! Esto es inseguro. Debes usar hashing.**
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            res.status(200).json({ message: 'Login exitoso', user: userData });

        } catch (error) {
            console.error('Error durante el login:', error);
            res.status(500).json({ message: 'Error del servidor' });
        }

    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Método ${req.method} no permitido`);
    }
}