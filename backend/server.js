import express from 'express';
import cors from 'cors';
import { verificarLogin } from './authController.js';
import alumnosRoutes from './routes/alumnos.js';

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/api/alumnos', alumnosRoutes);

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Ruta de login
app.post('/api/login', async (req, res) => {
    try {
        console.log('Cuerpo de la solicitud recibido:', req.body);
        const { email, password } = req.body;

        // Validar que se envíen los datos requeridos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Verificar credenciales
        const usuario = await verificarLogin(email, password);

        if (usuario) {
            res.status(200).json({
                success: true,
                usuario,
                message: 'Login exitoso'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }
    } catch (error) {
        console.error('Error en /api/login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});

export default app;