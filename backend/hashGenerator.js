// backend/hashGenerator.js - Script temporal para generar hashes
import bcrypt from 'bcrypt';

async function generarHashesDeEjemplo() {
    console.log('🔐 Generando hashes de ejemplo...\n');

    const ejemplos = [
        { email: 'admin@admin.com', password: 'admin1234' },
        { email: 'test@test.com', password: 'test123' },
        { email: 'usuario@ejemplo.com', password: 'password123' }
    ];

    for (const usuario of ejemplos) {
        const hash = await bcrypt.hash(usuario.password, 10);
        console.log(`📧 Email: ${usuario.email}`);
        console.log(`🔑 Password: ${usuario.password}`);
        console.log(`🔐 Hash: ${hash}`);
        console.log('---');
    }

    console.log('📝 Copia el hash correspondiente y úsalo como "password_hash" en tu documento de Firestore');
}

generarHashesDeEjemplo().catch(console.error);