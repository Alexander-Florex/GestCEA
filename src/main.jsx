// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { AppDBProvider } from './contexts/AppDB'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <AppDBProvider>
                    <App />
                </AppDBProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
)